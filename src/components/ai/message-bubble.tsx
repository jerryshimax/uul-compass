"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/hooks/use-chat";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const [expandedImg, setExpandedImg] = useState<string | null>(null);

  if (message.role === "tool_call") {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <span
          className={`material-symbols-outlined text-sm text-blue-400 ${!message.toolOutput ? "animate-spin" : ""}`}
        >
          {message.toolOutput ? "check_circle" : "progress_activity"}
        </span>
        <span className="text-xs text-slate-500 uppercase tracking-wider font-mono">
          {message.toolOutput
            ? `${message.toolName} done`
            : `Using ${message.toolName}...`}
        </span>
      </div>
    );
  }

  const isUser = message.role === "user";
  const attachments = (message as any).attachments as
    | Array<{ url: string; filename: string; contentType: string }>
    | undefined;

  return (
    <>
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} px-4`}>
        <div
          className={`max-w-[85%] rounded-2xl text-sm leading-relaxed ${
            isUser ? "rounded-br-sm" : "rounded-bl-sm"
          }`}
          style={{
            background: isUser ? "#1e293b" : "#131b2d",
            color: "#dbe2fb",
          }}
        >
          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div className="flex gap-1.5 p-2 pb-0 flex-wrap">
              {attachments.map((att, i) =>
                att.contentType.startsWith("image/") ? (
                  <button
                    key={i}
                    onClick={() => setExpandedImg(att.url)}
                    className="rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={att.url}
                      alt={att.filename}
                      className="max-h-40 max-w-[200px] rounded-lg object-cover"
                    />
                  </button>
                ) : (
                  <a
                    key={i}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs hover:brightness-125 transition-colors bg-slate-800 text-slate-300"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      description
                    </span>
                    {att.filename}
                  </a>
                )
              )}
            </div>
          )}

          {/* Text content */}
          {message.content && (
            <div className="px-4 py-3">
              {isUser ? (
                <span className="whitespace-pre-wrap">{message.content}</span>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    h1: ({ children }) => <h1 className="font-bold text-base text-white mb-1">{children}</h1>,
                    h2: ({ children }) => <h2 className="font-semibold text-sm text-white mb-1">{children}</h2>,
                    h3: ({ children }) => <h3 className="font-semibold text-sm text-slate-200 mb-1">{children}</h3>,
                    code: ({ children, className }) => {
                      const isBlock = className?.includes("language-");
                      return isBlock ? (
                        <code className="block bg-slate-900 rounded px-3 py-2 text-xs font-mono text-slate-300 my-2 overflow-x-auto whitespace-pre">
                          {children}
                        </code>
                      ) : (
                        <code className="bg-slate-800 rounded px-1 py-0.5 text-xs font-mono text-blue-300">
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => <pre className="my-2">{children}</pre>,
                    hr: () => <hr className="border-slate-700 my-3" />,
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">
                        {children}
                      </a>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-slate-600 pl-3 italic text-slate-400 my-2">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-2">
                        <table className="w-full text-xs border-collapse">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="border-b border-slate-700">{children}</thead>,
                    tbody: ({ children }) => <tbody>{children}</tbody>,
                    tr: ({ children }) => <tr className="border-b border-slate-800">{children}</tr>,
                    th: ({ children }) => <th className="text-left px-3 py-1.5 font-semibold text-slate-300">{children}</th>,
                    td: ({ children }) => <td className="px-3 py-1.5 text-slate-400">{children}</td>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
              {message.isStreaming && (
                <span className="inline-block w-1.5 h-4 ml-0.5 animate-pulse rounded-sm bg-blue-400" />
              )}
            </div>
          )}

          {/* Thinking indicator */}
          {!message.content && message.isStreaming && !isUser && (
            <div className="px-4 py-3 flex items-center gap-1.5">
              <span className="block w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="block w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="block w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>
      </div>

      {/* Expanded image overlay */}
      {expandedImg && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedImg(null)}
        >
          <img
            src={expandedImg}
            alt="Expanded"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </>
  );
}
