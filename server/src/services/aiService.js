const config = require('../config/env');
const { AppError } = require('../middleware/errorHandler');

const MAX_INPUT_LENGTH = 15000;
// Keep reply requests small enough for low-throughput provider tiers while retaining
// the latest relevant thread context.
const MAX_REPLY_INPUT_LENGTH = 2200;
const MAX_RETRIES = 3;

/**
 * Provider-agnostic AI service.
 * Uses environment variables to select the provider at runtime.
 */

const _sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const _withRetry = async (fn, retries = MAX_RETRIES) => {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // Only retry on overloaded/rate-limited errors
      if (attempt < retries && (err.statusCode === 503 || /overload/i.test(err.message))) {
        const delay = (attempt + 1) * 2000; // 2s, 4s, 6s
        console.warn(`[AI] Retrying after ${delay}ms (attempt ${attempt + 1}/${retries}): ${err.message}`);
        await _sleep(delay);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
};

const _callProvider = async (messages, { maxTokens = 4096 } = {}) => {
  const { provider, apiKey, model } = config.ai;
  if (!apiKey) throw new AppError('AI provider not configured', 500, 'AI_PROVIDER_ERROR');

  const timeout = 30000;

  if (provider === 'openai' || provider === 'openai-compatible') {
    const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const requestBody = {
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      };
      // NOTE: Do NOT set reasoning_format:'hidden' — Qwen3 on Groq returns empty content with it.

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) {
        const errBody = await response.text();
        console.error('[AI] Provider error:', response.status, errBody);
        let errMsg = 'AI provider error';
        try { errMsg = JSON.parse(errBody)?.error?.message || errMsg; } catch {}
        if (response.status === 429) {
          const wait = errMsg.match(/try again in\s+([\d.]+)s/i)?.[1];
          throw new AppError(
            `AI provider rate limit reached.${wait ? ` Please try again in ${Math.ceil(Number(wait))} seconds.` : ' Please wait a moment and try again.'}`,
            429,
            'AI_RATE_LIMITED'
          );
        }
        throw new AppError(errMsg, 502, 'AI_PROVIDER_ERROR');
      }
      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') throw new AppError('AI request timed out', 504, 'AI_TIMEOUT');
      throw err;
    }
  }

  if (provider === 'gemini') {
    // Use official @google/genai SDK — supports both AIzaSy and AQ. key formats natively
    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const candidateModels = [
      model && model !== 'gemini' ? model : null,
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ].filter(Boolean);

    const systemMsg = messages.find((m) => m.role === 'system');
    const chatMsgs = messages.filter((m) => m.role !== 'system');

    let lastError = null;

    for (const mod of candidateModels) {
      try {
        console.log(`[AI Gemini] Trying model: ${mod}`);
        const response = await ai.models.generateContent({
          model: mod,
          contents: chatMsgs.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          ...(systemMsg && {
            config: { systemInstruction: systemMsg.content },
          }),
        });

        const text = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text || '';
        console.log(`[AI Gemini] Success with model: ${mod}`);
        return text;
      } catch (err) {
        lastError = err.message || String(err);
        console.warn(`[AI Gemini] Model ${mod} failed: ${lastError}`);
        // If model not found, try next; if overloaded, throw for retry
        if (/not found|404/i.test(lastError)) continue;
        if (/overload|503|429|quota/i.test(lastError)) {
          throw new AppError(lastError, 503, 'AI_PROVIDER_ERROR');
        }
        if (/invalid|unauthorized|403|401/i.test(lastError)) {
          throw new AppError('AI API key is invalid. Go to https://aistudio.google.com/apikey and create a new key.', 401, 'AI_PROVIDER_ERROR');
        }
      }
    }

    throw new AppError(lastError || 'All Gemini models failed', 502, 'AI_PROVIDER_ERROR');
  }

  throw new AppError(`Unsupported AI provider: ${provider}`, 500, 'AI_PROVIDER_ERROR');
};

/**
 * Strips HTML tags, styles, scripts, and collapses whitespace to provide clean plain text for AI.
 */
const _stripHtml = (str) => {
  if (!str) return '';
  return str
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Cleans thinking model tags (<think>...</think>) and extracts clean output or structured JSON.
 */
const _cleanModelOutput = (raw) => {
  if (!raw) return '';
  let cleaned = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/Thinking Process:[\s\S]*?(?=\n\n(?:[A-Z]|#|Dear|Hi|Thank|Subject|Regarding|{))/gi, '')
    .replace(/^Thinking Process:[\s\S]*?\n\n/gi, '')
    .replace(/^<think>[\s\S]*/gi, '')
    .trim();
  return cleaned || raw.trim();
};

const _cleanReplyOutput = (raw) => _cleanModelOutput(raw)
  .replace(/^(?:subject|reply|draft)\s*:\s*.*(?:\r?\n|$)/i, '')
  .trim();

const _parseJsonSummary = (raw) => {
  const cleaned = _cleanModelOutput(raw);

  // Try extracting json block between ```json ... ``` or first { to last }
  let jsonStr = cleaned.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();

  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      summary: parsed.summary || cleaned,
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      deadlines: Array.isArray(parsed.deadlines) ? parsed.deadlines : [],
    };
  } catch {
    // If parsing still fails, provide the cleaned text as summary without thinking tags
    return {
      summary: cleaned,
      keyPoints: [],
      actionItems: [],
      questions: [],
      deadlines: [],
    };
  }
};

const summarizeEmail = async ({ subject, body, from, date }) => {
  const plainText = _stripHtml(body || '');
  const truncatedBody = plainText.slice(0, MAX_INPUT_LENGTH);
  const messages = [
    {
      role: 'system',
      content: `You are an AI email assistant. Summarize the following email concisely. Include:
- Main topic
- Key points
- Action items (if any)
- Questions directed at the reader (if any)
- Important dates/deadlines (if explicitly mentioned)
Do NOT output thinking tags. Do NOT invent facts. Output ONLY a valid JSON object with keys: summary (string), keyPoints (string[]), actionItems (string[]), questions (string[]), deadlines (string[]).`,
    },
    {
      role: 'user',
      content: `From: ${from}\nDate: ${date}\nSubject: ${subject}\n\n${truncatedBody}`,
    },
  ];

  const raw = await _withRetry(() => _callProvider(messages));
  return _parseJsonSummary(raw);
};

const summarizeThread = async (threadMessages) => {
  const condensed = threadMessages
    .map((m) => {
      const text = m.body?.text || _stripHtml(m.body?.html || '') || m.snippet || '';
      return `From: ${m.from}\nDate: ${m.date}\nSubject: ${m.subject}\n${text.slice(0, 2500)}`;
    })
    .join('\n---\n')
    .slice(0, MAX_INPUT_LENGTH);

  const messages = [
    {
      role: 'system',
      content: `You are an AI email assistant. Summarize the following email thread concisely. Include:
- Main topic
- Key points from all messages
- Action items (if any)
- Questions directed at the reader (if any)
- Important dates/deadlines (if explicitly mentioned)
Do NOT output thinking tags. Do NOT invent facts. Output ONLY a valid JSON object with keys: summary (string), keyPoints (string[]), actionItems (string[]), questions (string[]), deadlines (string[]).`,
    },
    { role: 'user', content: condensed },
  ];

  const raw = await _withRetry(() => _callProvider(messages));
  return _parseJsonSummary(raw);
};

const generateReply = async ({ threadMessages, prompt, tone = 'professional' }) => {
  const condensed = (threadMessages || [])
    .map((m) => {
      const text = m.body?.text || _stripHtml(m.body?.html || '') || m.snippet || '';
      return `From: ${m.from}\nDate: ${m.date}\nSubject: ${m.subject}\n${text.slice(0, 650)}`;
    })
    .join('\n---\n')
    .slice(0, MAX_REPLY_INPUT_LENGTH);

  const hasThreadContext = condensed.length > 0;
  const messages = [
    {
      role: 'system',
      content: `You are an AI email assistant. ${hasThreadContext
        ? 'Generate a reply to the latest email in this thread.'
        : 'Write a complete email draft from the user\'s instructions.'}
Tone: ${tone}
Rules:
- Read the supplied email content and respond only to that email
- Return only the reply body that can be pasted into an email
- Never include a subject line, "Reply:", "Draft:", analysis, or markdown labels
- Do NOT fabricate commitments, facts, dates, names, or actions
- Keep the reply concise and natural
- Do NOT include thinking tags or notes. Output the reply text only.`,
    },
    { role: 'user', content: hasThreadContext ? condensed : `Instructions:\n${String(prompt || '').trim()}` },
  ];

  const raw = await _withRetry(() => _callProvider(messages, { maxTokens: 300 }));
  const reply = _cleanReplyOutput(raw);
  return { content: reply, tone, source: 'ai', ...(hasThreadContext ? {} : { suggestedSubject: '' }) };
};

module.exports = { summarizeEmail, summarizeThread, generateReply };
