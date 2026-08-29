AI Email Management Application — Project Specification

Project Overview & Tech Stack

Project Overview

Build a full-stack AI-powered Email Management Application that connects to a real email provider, starting with Gmail through Google OAuth 2.0. The application must allow users to securely connect their Gmail account, view and search emails, open email threads, organize and manage messages, summarize long emails using AI, generate context-aware replies, edit AI-generated replies, compose new emails, and send messages through the Gmail API.

The application must never ask users for their Gmail password. Authentication and Gmail access must be handled exclusively through OAuth. Google access tokens and refresh tokens must remain on the backend, must never be exposed in frontend JavaScript, and must be encrypted at rest.

Example Workflow

User → Connect Gmail → Google OAuth Login/Consent → OAuth Authorization Code → Backend Token Exchange → Gmail API → Inbox Dashboard → Open Thread → AI Summarize → Generate Reply → Edit Reply → Send via Gmail API

Recommended Tech Stack

Frontend: Next.js, React, Tailwind CSS, Zustand, Axios, React Query/TanStack Query, lucide-react.

Backend: Node.js, Express, MongoDB, Mongoose, JWT or secure server-side session handling, helmet, morgan, compression, express-validator, rate limiting.

Gmail Integration: Google OAuth 2.0, Gmail API, Google APIs Node.js client.

AI Integration: Provider-agnostic AI service with support for a primary LLM provider and configurable fallback provider through environment variables.

Real-Time / Background Processing: Socket.IO for live activity updates and BullMQ + Redis for asynchronous AI processing and email synchronization. Provide a development fallback when Redis is unavailable.

Security: Environment variables for secrets, encrypted OAuth credentials at rest, HTTPS in production, secure cookies or protected JWT handling, strict CORS, request validation, rate limiting, and sanitized email/HTML rendering.

Authentication, Gmail Connection, and User Access

Application Authentication

The application must provide secure account authentication for the application itself.

Required capabilities:

User registration.

User login.

Secure password hashing using bcrypt or an equivalent password hashing algorithm.

Protected application routes.

Current-user profile endpoint such as GET /api/auth/me.

Logout.

Persistent authenticated state on the client.

Proper validation and error handling for invalid credentials.

Rate limiting on authentication endpoints.

Gmail OAuth Flow

The Gmail connection flow must follow this sequence:

Connect Gmail → Google Authorization Page → User Grants Permissions → Google Redirects to Backend Callback → Backend Exchanges Authorization Code for Tokens → Backend Encrypts and Stores Tokens → Application Marks Gmail as Connected → Gmail API Access

The application must:

Never request or store the user's Gmail password.

Start OAuth from a backend endpoint.

Handle Google's OAuth callback on the backend.

Exchange the authorization code for access and refresh tokens on the backend.

Store encrypted access and refresh tokens only on the server.

Store token expiry information.

Refresh access tokens when necessary.

Detect revoked or expired authorization.

Display a clear reconnect action when authorization is invalid.

Store only the minimum Gmail scopes required by the application.

Never include access tokens, refresh tokens, client secrets, or encryption keys in client-side bundles.

Never commit secrets to GitHub.

Never log raw OAuth tokens.

Gmail Scopes

Use the minimum practical OAuth scopes required to implement the application.

At minimum, the integration needs permission to:

Read Gmail messages and threads.

Modify message state such as read/unread, star, archive, and labels where required.

Send emails.

The implementation must document every requested scope and avoid unnecessarily broad permissions.

Gmail Dashboard and Inbox

Users must be able to access a dashboard after connecting Gmail.

Dashboard Requirements

The dashboard should include:

Connected Gmail account information.

Inbox message list.

Unread count.

Starred count.

Important/relevant message indicators where available.

Search bar.

Refresh/sync control.

Pagination or cursor-based loading.

Loading states and skeleton loaders.

Empty-state handling.

Error states.

Navigation to inbox, starred, sent, drafts, archived, and other supported Gmail categories.

Quick actions for read/unread, star/unstar, archive, and delete.

Message List

Each email row should display:

Sender name.

Sender email address.

Subject.

Short preview/snippet.

Received date/time.

Unread/read state.

Star state.

Attachment indicator where available.

Thread/message count when applicable.

The UI must allow bulk selection where practical for common management operations.

Email Reading and Thread View

Email Details

Users must be able to open an email and view:

Sender.

Recipients.

CC/BCC when available and appropriate.

Subject.

Timestamp.

Message body.

Attachments metadata.

Labels.

Read/unread state.

Star state.

Thread context.

HTML emails must be rendered safely. Potentially unsafe HTML, scripts, tracking content, and malicious markup must be sanitized before rendering.

Email Threads

The application must treat Gmail conversations as threads.

A thread view must:

Fetch and display all relevant messages in the conversation.

Show messages in chronological order.

Clearly distinguish sender and recipient.

Allow collapsing older messages.

Allow the user to expand individual messages.

Provide thread-level actions.

Allow the user to reply within the existing Gmail thread.

Email Search

Users must be able to search their Gmail account.

The search implementation should:

Provide a frontend search input.

Support normal text search.

Pass supported search expressions to Gmail where practical.

Support sender and recipient filters.

Support subject search.

Support date-related search.

Support unread/read filters.

Support starred mail.

Support attachment filtering where supported.

Display clear empty states.

Preserve search state in the URL or application state where useful.

The backend must validate and safely pass search parameters to the Gmail API.

Basic Email Management

The application must support the following core actions:

Mark as read.

Mark as unread.

Star.

Unstar.

Archive.

Delete.

Open/view.

Refresh/sync.

All destructive or potentially consequential actions must surface appropriate UI feedback.

The frontend must update state optimistically only when safe and must reconcile with Gmail API responses.

Failures from Gmail must be surfaced clearly rather than silently ignored.

AI Email Summarization

Summary Workflow

Open Email/Thread → Click Summarize → Backend Retrieves Required Content → AI Service Generates Summary → Summary Returned → User Reviews Summary

Users must be able to request an AI summary of an email or thread.

The summary should:

Identify the main topic.

Highlight important points.

Extract action items when present.

Identify requests/questions directed to the user.

Mention deadlines or dates when explicitly present.

Keep the summary concise and readable.

Avoid inventing facts not contained in the email.

Summary UI

The email detail page should provide:

Summarize button.

Loading state while summary is generated.

Summary panel or inline summary section.

Error state if the AI service fails.

Ability to regenerate the summary.

Clear indication that the output is AI-generated.

The backend should send only the necessary email content to the AI provider.

Sensitive information should not be logged in plaintext by the application.

AI-Generated Replies

Reply Generation Workflow

Open Email/Thread → Generate Reply → AI Reads Conversation Context → AI Produces Draft Reply → User Reviews → User Edits → User Sends

The AI reply generator must:

Use the current thread as context.

Consider the latest inbound message.

Produce a context-aware draft.

Avoid fabricating commitments, facts, dates, names, or actions.

Match a selected tone.

Keep the reply relevant to the user's message.

Preserve important requested details when appropriate.

Supported tone options should include:

Professional.

Friendly.

Concise.

Formal.

Appreciative.

Reply UI

The reply composer must allow users to:

Generate an AI reply.

Regenerate the reply.

Select tone.

Edit the generated text.

Completely replace the generated content.

Discard the generated reply.

Send the final edited reply.

Cancel the action.

AI-generated text must never be sent automatically without explicit user action.

Email Composition

Users must be able to compose new emails.

Compose Requirements

The compose window/page should support:

To.

CC.

BCC.

Subject.

Rich or sanitized message body.

Plain-text fallback where needed.

Attachments metadata/upload support if included in the implementation scope.

Save draft where practical.

Discard draft.

Send.

Validation must ensure:

At least one valid recipient exists.

Subject/body rules are handled correctly.

Invalid email addresses are rejected.

User-visible errors are clear.

Sending Email

Emails must be sent through the Gmail API using the connected Gmail account.

The send workflow must be:

User Reviews Email → User Clicks Send → Frontend Calls Backend → Backend Validates Request → Backend Loads/Refreshes OAuth Credentials → Backend Calls Gmail API → Gmail Response Returned → Activity Recorded

The application must:

Require explicit user confirmation through the Send action.

Never send an AI-generated reply automatically.

Use Gmail API message/thread formatting correctly.

Preserve threadId for replies to an existing Gmail thread where applicable.

Return a clear success state.

Handle failures such as revoked authorization, invalid recipients, rate limits, and transient Gmail API failures.

Drafts and Email History

Draft Support

When included, drafts should support:

Creating a draft.

Saving edits.

Opening an existing draft.

Discarding a draft.

Sending a draft.

Application Activity History

The application must maintain an activity history for important operations performed through the application.

Activity entries should include:

User.

Action type.

Related email/thread.

Timestamp.

Success/failure state.

Relevant non-sensitive metadata.

Error category when applicable.

Do not store raw OAuth tokens or other secrets in activity logs.

Backend API Integration

The frontend must communicate with the backend through a dedicated API layer.

Controllers should remain thin. Business logic must live in services.

Backend Architecture

Routes: HTTP routing, validation, authentication middleware, and request lifecycle.

Controllers: Parse requests and shape responses only.

Services: Business logic for authentication, Gmail operations, AI generation, message parsing, search, activity history, and token refresh.

Integrations: Gmail provider abstraction behind a common interface.

AI Layer: Provider-agnostic summarization and reply generation service.

Queues: Background synchronization and AI jobs.

Config: Centralized environment loading and application configuration.

Models: Mongoose models for application persistence.

Middleware: Authentication, validation, error handling, logging, CORS, and rate limiting.

Controllers must never call MongoDB directly.

Controllers must never contain Gmail API implementation details.

AI services must never directly manipulate HTTP requests/responses.

Database Collections

Users

Stores application users:

name

email

passwordHash

role

lastLogin

createdAt

updatedAt

The password hash must not be returned by normal user queries.

GmailConnections

Stores Gmail connection metadata:

owner

provider

googleAccountEmail

googleSubjectId or provider user identifier where appropriate

scopes

encryptedAccessToken

encryptedRefreshToken

expiresAt

isConnected

lastSyncedAt

createdAt

updatedAt

Tokens must be encrypted at rest.

EmailCache

Optional but recommended for performance and search acceleration:

owner

gmailMessageId

threadId

labelIds

sender

recipients

subject

snippet

internalDate

isRead

isStarred

hasAttachments

cachedAt

Cached email content should be minimized and should follow the application's data retention policy.

EmailSummaries

Stores generated AI summaries where persistence is enabled:

owner

threadId

messageId

summary

actionItems

generatedAt

model

metadata

ReplyDrafts

Stores generated or manually edited application drafts when required:

owner

threadId

messageId

content

tone

source: ai | manual

createdAt

updatedAt

ActivityLogs

Stores important application activity:

owner

action

messageId

threadId

provider

status

message

metadata

createdAt

Sensitive credentials must never be stored in this collection.

API Endpoints

Health and Auth

GET /api/health – System health and dependency status.

POST /api/auth/register – Register an application user.

POST /api/auth/login – Authenticate the application user.

POST /api/auth/logout – End the application session.

GET /api/auth/me – Fetch the current application user.

Gmail OAuth and Connection

GET /api/gmail/oauth/start – Start Google OAuth authorization.

GET /api/gmail/oauth/callback – Handle the Google OAuth callback.

GET /api/gmail/status – Return Gmail connection status.

POST /api/gmail/reconnect – Begin a reconnect flow.

POST /api/gmail/disconnect – Disconnect Gmail and revoke/clear stored credentials as appropriate.

Inbox and Messages

GET /api/emails – List messages with pagination, labels, and optional search.

GET /api/emails/search – Search Gmail messages.

GET /api/emails/:id – Fetch a single Gmail message.

GET /api/threads/:threadId – Fetch a complete Gmail thread.

POST /api/emails/:id/read – Mark a message as read.

POST /api/emails/:id/unread – Mark a message as unread.

POST /api/emails/:id/star – Star a message.

DELETE /api/emails/:id/star – Remove a star.

POST /api/emails/:id/archive – Archive a message.

DELETE /api/emails/:id – Delete a message.

AI

POST /api/ai/summarize – Summarize an email or thread.

POST /api/ai/generate-reply – Generate a reply draft from email/thread context.

Sending and Composition

POST /api/emails/send – Send a new email.

POST /api/threads/:threadId/reply – Send a reply in an existing Gmail thread.

POST /api/drafts – Create/save an application draft where supported.

PUT /api/drafts/:id – Update a draft.

GET /api/drafts – List drafts.

POST /api/drafts/:id/send – Send a saved draft.

DELETE /api/drafts/:id – Delete a saved draft.

Activity

GET /api/activity – Return email/application activity history.

GET /api/activity/:id – Return an activity record.

Frontend Pages

The application should use a responsive email-client layout.

Required Pages

/ – Landing page explaining the application and AI email features.

/login – Application login.

/register – Application registration.

/dashboard – Main inbox/dashboard.

/emails/[id] – Single message view.

/threads/[threadId] – Thread view.

/compose or a global compose modal – New email composer.

/search – Search results.

/sent – Sent mail.

/starred – Starred mail.

/drafts – Draft messages.

/archive – Archived messages.

/activity – Application email activity/history.

/integrations – Gmail connection and OAuth status.

/settings – Account, security, and application settings.

Authenticated users visiting / should be redirected to /dashboard. Unauthenticated users should be redirected to /login for protected pages.

Frontend Components

Suggested component structure:

Layout

AppShell

Sidebar

TopBar

SearchBar

UserMenu

NotificationArea

Inbox

InboxList

EmailRow

EmailListToolbar

BulkActionToolbar

PaginationControls

FolderNavigation

Email / Thread

EmailHeader

EmailBody

ThreadView

ThreadMessage

AttachmentList

EmailActions

AI

SummaryPanel

GenerateReplyButton

ReplyToneSelector

ReplyComposer

AIStatusIndicator

Compose

ComposeModal

RecipientInput

RichTextEditor

SendButton

DraftControls

Integration

GmailConnectionCard

OAuthStatus

ReconnectButton

State Management

The frontend should use centralized state management for:

Authentication state.

Gmail connection state.

Inbox/thread state.

Search state.

Compose/draft state.

AI generation state.

UI preferences.

Suggested stores:

authStore

gmailStore

emailStore

composeStore

uiStore

Server data should use a query/cache layer where appropriate to avoid unnecessary Gmail API calls.

Gmail Service Architecture

All Gmail API communication must be isolated behind a Gmail integration/service layer.

Example Structure

The Gmail integration should provide methods conceptually similar to:

getAuthorizationUrl()

handleOAuthCallback()

refreshAccessToken()

getProfile()

listMessages()

getMessage()

getThread()

searchMessages()

modifyMessage()

archiveMessage()

deleteMessage()

sendMessage()

sendReply()

The frontend must never directly call the Gmail API using OAuth credentials.

AI Service Architecture

The AI implementation must use a provider abstraction.

The service should expose operations such as:

summarizeEmail()

summarizeThread()

generateReply()

The selected model/provider must be controlled through backend environment variables.

AI Safety and Reliability Requirements

AI output must:

Be grounded in the supplied email content.

Avoid fabricated information.

Avoid silently changing factual details.

Clearly be presented as a draft when generating replies.

Never trigger a send operation by itself.

Return structured output where practical.

The backend should enforce maximum input lengths and sensible output limits.

Email Parsing and Content Safety

Gmail messages can contain MIME multipart structures and HTML content.

The backend must:

Correctly decode Gmail message payloads.

Handle multipart/alternative messages.

Prefer safe readable text extraction.

Preserve useful formatting when appropriate.

Sanitize HTML before the frontend renders it.

Avoid executing scripts, embedded active content, or unsafe remote content.

Handle messages without bodies or with unusual MIME structures gracefully.

Synchronization Strategy

The application should support refreshing and syncing Gmail data.

Initial Sync

After OAuth connection:

Validate the Gmail connection.

Fetch the user's Gmail profile.

Fetch recent inbox messages.

Persist only required metadata if caching is enabled.

Set the initial synchronization timestamp.

Display the inbox.

Subsequent Sync

On refresh:

Validate or refresh the access token.

Fetch updated message/thread data.

Reconcile local cached records.

Update unread/starred/archive state.

Record synchronization activity.

A background synchronization job may be used for larger inboxes.

Error Handling

The application must convert provider and application failures into clear error categories.

Important categories include:

GMAIL_NOT_CONNECTED

AUTH_EXPIRED

OAUTH_DENIED

GMAIL_API_ERROR

GMAIL_RATE_LIMIT

INVALID_RECIPIENT

MESSAGE_NOT_FOUND

AI_PROVIDER_ERROR

AI_TIMEOUT

VALIDATION_ERROR

UNAUTHORIZED

FORBIDDEN

INTERNAL_ERROR

The frontend must display user-friendly messages while backend logs retain sufficient diagnostic information without exposing secrets.

Real-Time Layer

Socket.IO may be used to provide live status updates for:

Gmail synchronization.

AI summarization.

AI reply generation.

Email sending.

Background draft processing.

Example events:

gmail:sync:started

gmail:sync:progress

gmail:sync:completed

ai:summary:started

ai:summary:completed

ai:reply:started

ai:reply:completed

email:send:started

email:send:completed

email:send:failed

The frontend should update relevant UI elements from these events.

Environment Variables

All sensitive configuration must be provided through environment variables.

Example variables:

NODE_ENV=development

PORT=5000
CLIENT_URL=http://localhost:3000

MONGODB_URI=
JWT_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5000/api/gmail/oauth/callback

CREDENTIAL_ENCRYPTION_KEY=

AI_PROVIDER=
AI_API_KEY=
AI_MODEL=

REDIS_URL=

Rules:

Never hard-code secrets.

Never expose backend secrets through NEXT_PUBLIC_* variables.

Never commit .env files containing real credentials.

Provide .env.example with placeholder values only.

Validate required environment variables at application startup.

Do not log secret values.

Security Requirements

The application must follow secure-by-default practices.

Authentication Security

Hash application passwords securely.

Protect all authenticated API routes.

Enforce authorization checks for every user-owned resource.

Prevent users from accessing another user's emails, summaries, drafts, or activity records.

Rate-limit login and OAuth initiation endpoints.

Use secure cookies or otherwise secure token handling in production.

OAuth Security

Perform Google OAuth on the backend.

Use a secure OAuth state parameter to prevent CSRF.

Validate OAuth callback parameters.

Encrypt access and refresh tokens at rest.

Keep Google client secrets server-side only.

Never expose access tokens to the browser.

Never log raw tokens.

Clear credentials on disconnect.

Handle refresh-token rotation/revocation appropriately.

API Security

Use helmet.

Restrict CORS to the configured client origin.

Validate request bodies and query parameters.

Sanitize rendered HTML.

Apply reasonable request size limits.

Rate-limit expensive endpoints, especially AI generation and email sending.

Return generic internal errors to clients without revealing stack traces or secrets.

AI Security

Do not place OAuth tokens or application secrets in AI prompts.

Do not send more email content to the AI provider than is required.

Validate model output.

Treat AI output as untrusted user-visible text.

Never automatically execute actions based solely on generated text.

Folder Structure

Frontend

client/
└── src/
    ├── components/
    │   ├── AppShell/
    │   ├── Sidebar/
    │   ├── SearchBar/
    │   ├── InboxList/
    │   ├── EmailRow/
    │   ├── ThreadView/
    │   ├── EmailViewer/
    │   ├── SummaryPanel/
    │   ├── ReplyComposer/
    │   ├── ComposeModal/
    │   ├── GmailConnectionCard/
    │   └── ProtectedRoute/
    ├── pages/
    │   ├── _app.js
    │   ├── index.js
    │   ├── login.js
    │   ├── register.js
    │   ├── dashboard.js
    │   ├── search.js
    │   ├── sent.js
    │   ├── starred.js
    │   ├── drafts.js
    │   ├── archive.js
    │   ├── activity.js
    │   ├── integrations.js
    │   ├── settings.js
    │   ├── emails/
    │   │   └── [id].js
    │   └── threads/
    │       └── [threadId].js
    ├── store/
    │   ├── authStore.js
    │   ├── gmailStore.js
    │   ├── emailStore.js
    │   ├── composeStore.js
    │   └── uiStore.js
    └── services/
        ├── api.js
        └── socket.js

Backend

server/
└── src/
    ├── config/
    │   ├── env.js
    │   ├── db.js
    │   └── socket.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── gmailRoutes.js
    │   ├── emailRoutes.js
    │   ├── threadRoutes.js
    │   ├── aiRoutes.js
    │   ├── draftRoutes.js
    │   └── activityRoutes.js
    ├── controllers/
    │   ├── authController.js
    │   ├── gmailController.js
    │   ├── emailController.js
    │   ├── threadController.js
    │   ├── aiController.js
    │   ├── draftController.js
    │   └── activityController.js
    ├── services/
    │   ├── authService.js
    │   ├── gmailService.js
    │   ├── emailService.js
    │   ├── threadService.js
    │   ├── aiService.js
    │   ├── tokenService.js
    │   ├── activityService.js
    │   └── syncService.js
    ├── integrations/
    │   ├── baseEmailIntegration.js
    │   └── gmailIntegration.js
    ├── middleware/
    │   ├── auth.js
    │   ├── validation.js
    │   ├── errorHandler.js
    │   └── rateLimiter.js
    ├── models/
    │   ├── User.js
    │   ├── GmailConnection.js
    │   ├── EmailCache.js
    │   ├── EmailSummary.js
    │   ├── ReplyDraft.js
    │   └── ActivityLog.js
    └── queues/
        ├── emailSyncQueue.js
        └── aiQueue.js

Development Phases

Phase 1 — Project Setup and Application Authentication

Implement:

Frontend and backend project setup.

Environment configuration.

MongoDB connection.

Development fallback where practical.

User registration/login/logout.

Password hashing.

Protected routes.

Base application shell.

Global error handling.

Security middleware.

Phase 2 — Gmail OAuth Integration

Implement:

Google Cloud OAuth configuration.

OAuth start endpoint.

Secure state handling.

OAuth callback.

Token exchange.

Encrypted token storage.

Refresh-token logic.

Gmail connection status.

Connect/reconnect/disconnect UI.

Gmail profile retrieval.

Phase 3 — Inbox and Email Viewing

Implement:

Inbox dashboard.

Gmail message listing.

Pagination.

Message detail view.

Thread retrieval.

MIME parsing.

Safe HTML sanitization.

Read/unread.

Star/unstar.

Archive.

Delete.

Phase 4 — Search, Composition, and Sending

Implement:

Gmail search.

Search filters.

Compose UI.

New email sending.

Thread reply sending.

Recipient validation.

Send status/error handling.

Draft support if included.

Activity logging.

Phase 5 — AI Summarization

Implement:

AI provider abstraction.

Email summarization endpoint.

Thread summarization.

Summary UI.

Structured summary output.

AI loading/error states.

Prompt construction and length limits.

Phase 6 — AI Reply Generation

Implement:

Tone selector.

Context-aware reply generation.

Reply editor.

Regeneration.

Draft review/edit workflow.

Explicit-send requirement.

AI activity logging.

Phase 7 — Background Processing and Real-Time Updates

Implement:

BullMQ + Redis.

Gmail sync jobs.

AI background jobs where useful.

Socket.IO events.

Live sync/AI/send status.

Retry handling with bounded backoff.

Development fallback where Redis is unavailable.

Phase 8 — Hardening, Testing, and Deployment

Implement:

Unit tests.

Integration tests.

OAuth flow testing.

Gmail API error handling.

Security review.

Input/output validation.

Responsive UI testing.

Production environment configuration.

Deployment of frontend and backend.

MongoDB production setup.

Redis production setup if used.

Final smoke test of OAuth, inbox, search, AI summary, AI reply, and send flows.

UI and UX Requirements

The UI should feel like a modern productivity-focused email client rather than an admin dashboard.

Requirements:

Clean and responsive layout.

Desktop-first inbox experience with mobile responsiveness.

Sidebar for Gmail folders/categories.

Clear unread/read visual distinction.

Fast message scanning.

Keyboard-friendly interactions where practical.

Loading states and skeletons.

Empty states.

Error states.

Toasts or inline confirmations for actions.

Confirmation for destructive actions when appropriate.

Accessible buttons and form controls.

Clear disabled/loading states for AI and Send actions.

AI sections should be visually distinct but not overwhelming.

AI UX Principle

AI assists the user; it does not replace the user's control.

The user must always be able to:

Review generated summaries.

Edit generated replies.

Regenerate output.

Discard AI output.

Decide whether an email is actually sent.

Testing Requirements

At minimum, cover:

Authentication

Registration.

Login.

Logout.

Protected route access.

Authorization boundaries.

OAuth

Successful OAuth.

OAuth denial.

Invalid state.

Callback errors.

Expired access token.

Refresh token handling.

Disconnected/revoked account.

Email Operations

Inbox listing.

Search.

Message retrieval.

Thread retrieval.

Read/unread.

Star/unstar.

Archive.

Delete.

Send.

Reply.

AI

Summary generation.

Reply generation.

AI timeout.

AI provider error.

Invalid/malformed AI output.

Maximum input handling.

Security

Cross-user data access prevention.

Request validation.

Rate limiting.

HTML sanitization.

Secret leakage checks.

Deployment Requirements

The final system must be deployable as a working production application.

Production Requirements

Frontend deployed to a production hosting platform.

Backend deployed to a production hosting platform.

Production MongoDB.

Redis when background queues are enabled.

HTTPS.

Proper Google OAuth redirect URI configuration.

Production environment variables.

Secure CORS configuration.

Production logging without sensitive data.

Health endpoint.

Error monitoring/logging where practical.

Google OAuth Production Configuration

The deployed application's Google OAuth configuration must use production callback URLs.

The following must be configured correctly:

Authorized JavaScript origins where required.

Authorized redirect URIs.

OAuth consent screen.

Required Gmail API enabled.

Required scopes declared and justified.

Final Expected Outcome

The completed application must let a user:

Create an account or sign in securely.

Connect Gmail using Google OAuth without entering a Gmail password into the application.

View their real Gmail inbox.

Search and filter emails.

Open email messages and complete Gmail threads.

Mark messages read/unread.

Star/unstar messages.

Archive and delete messages.

Click Summarize and receive an AI-generated summary.

Click Generate Reply and receive an AI-generated draft.

Edit the generated reply before sending.

Compose a new email.

Send an email through the Gmail API.

View application activity/history.

Reconnect Gmail when authorization expires or is revoked.

Use the application through a deployed production URL.

The final product should feel like a focused, modern AI email assistant—combining the reliability of a normal Gmail client with AI-assisted reading and replying.

Codex & AI Agent Implementation Instructions

The AI coding agent must build the application phase by phase and keep the architecture disciplined.

Rules:

Follow the folder structure unless a strong technical reason requires a documented change.

Keep controllers thin.

Put business logic in services.

Never call MongoDB directly from controllers.

Never call the Gmail API directly from React components.

Never expose OAuth access tokens or refresh tokens to the frontend.

Never store Gmail passwords.

Treat Google OAuth as the only mechanism for Gmail authentication/access.

Encrypt OAuth credentials at rest.

Treat all secrets as process.env values.

Never commit real secrets to Git.

Use .env.example for documented placeholders.

Sanitize email HTML before rendering.

Validate all request input.

Enforce user ownership checks on every Gmail-related resource.

Never send an AI-generated reply without explicit user action.

Keep AI providers behind a service abstraction.

Log useful operational events but never log raw tokens or secrets.

Handle Gmail authorization expiration as a distinct error.

Handle Gmail API rate limits and transient failures with bounded retries.

Make local development possible even when optional external infrastructure is unavailable, using clearly documented fallbacks where practical.

Write tests for critical authentication, OAuth, Gmail, AI, and sending paths.

At the end of every development phase, report the files created or changed and the phase's completed functionality.

Before declaring the project complete, verify the complete end-to-end flow:

Application Login → Connect Gmail → Google OAuth → Gmail Inbox → Open Thread → Summarize → Generate Reply → Edit Reply → Send → Activity History

