import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AuraMail — AI Intelligent Email Assistant",
  description: "AI-powered email assistant with Gmail OAuth, automatic thread summarization, and tone-crafted reply generation.",
  icons: {
    icon: "/auramail-icon.jpg",
    shortcut: "/auramail-icon.jpg",
    apple: "/auramail-icon.jpg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans selection:bg-indigo-500 selection:text-white">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#18181b',
              color: '#f4f4f5',
              fontSize: '13px',
              borderRadius: '12px',
              border: '1px solid #27272a',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
