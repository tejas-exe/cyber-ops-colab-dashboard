import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { MessageCircle, X, Users, Send, Video, Copy, Check } from "lucide-react";
// import { socket } from "../sockets/socket";
import VcComponentRoom from "./VcComponentRoom";
import { useSockets } from "../providers/Socket";

/* ─────────────────────────────────────────────────────────────────────────────
   AVATAR + TOOLTIP
───────────────────────────────────────────────────────────────────────────── */
const PALETTE = [
  ["#3b82f6", "#6366f1"],
  ["#8b5cf6", "#ec4899"],
  ["#10b981", "#06b6d4"],
  ["#f59e0b", "#ef4444"],
  ["#06b6d4", "#8b5cf6"],
];

const getPaletteIndexFromSeed = (seed = "") => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % PALETTE.length;
};

function MemberAvatar({ member, index, size = 40 }) {
  const [hovered, setHovered] = useState(false);
  const [from, to] = PALETTE[index % PALETTE.length];
  const name = member?.user?.name || member?.name || "Unknown";
  const email = member?.user?.email || member?.email || "";
  const role = member?.role || "Member";

  return (
    <div
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${from}, ${to})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.38,
          fontWeight: 800,
          color: "#fff",
          border: "2.5px solid rgba(255,255,255,0.14)",
          cursor: "default",
          userSelect: "none",
          boxShadow: hovered
            ? `0 0 0 3px ${from}66, 0 6px 20px ${from}55`
            : "0 2px 10px rgba(0,0,0,0.35)",
          transform: hovered ? "translateY(-5px) scale(1.1)" : "none",
          transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {name.charAt(0).toUpperCase()}
      </div>

      {hovered && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 10px)",
            left: "50%",
            transform: "translateX(-50%)",
            background:
              "linear-gradient(145deg,rgba(15,23,42,0.98),rgba(30,41,59,0.98))",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "14px",
            padding: "10px 14px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 9999,
            boxShadow:
              "0 10px 36px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
            backdropFilter: "blur(16px)",
            animation: "drTooltip 0.16s ease forwards",
          }}
        >
          {/* arrow */}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid rgba(255,255,255,0.12)",
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: "0.83rem",
              fontWeight: 700,
              color: "#f1f5f9",
            }}
          >
            {name}
          </p>
          {email && (
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "0.72rem",
                color: "rgba(148,163,184,0.85)",
              }}
            >
              {email}
            </p>
          )}
          <span
            style={{
              display: "inline-block",
              marginTop: "5px",
              fontSize: "0.67rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: from,
              background: `${from}22`,
              padding: "2px 8px",
              borderRadius: "99px",
            }}
          >
            {role}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CHAT MESSAGE
───────────────────────────────────────────────────────────────────────────── */
function ChatMessage({
  msg,
  isOwn,
  compact = false,
  onCopyMessage,
  isCopied = false,
}) {
  const [from, to] = PALETTE[msg.colorIndex % PALETTE.length];
  const bubbleBackground = isOwn
    ? `linear-gradient(135deg,${from}f2,${to}e6)`
    : `linear-gradient(135deg,${from}cc,${to}bc)`;

  return (
    <div
      style={{
        display: "flex",
        gap: "11px",
        flexDirection: isOwn ? "row-reverse" : "row",
        alignItems: "flex-start",
        marginBottom: compact ? "0.8rem" : "0.95rem",
      }}
    >
      {/* avatar */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          flexShrink: 0,
          background: `linear-gradient(135deg,${from},${to})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.78rem",
          fontWeight: 800,
          color: "#fff",
          border: "2px solid rgba(255,255,255,0.16)",
          boxShadow: `0 4px 12px ${from}33`,
        }}
      >
        {msg.author.charAt(0).toUpperCase()}
      </div>
      <div
        style={{
          maxWidth: compact ? "82%" : "75%",
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          alignItems: isOwn ? "flex-end" : "flex-start",
          minWidth: 0,
          flex: 1,
        }}
      >
        <span
          style={{
            fontSize: "0.7rem",
            color: "rgba(148,163,184,0.64)",
            fontWeight: 600,
            maxWidth: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {msg.author} · {msg.time}
        </span>
        <div
          style={{
            padding: compact ? "9px 12px" : "10px 14px",
            borderRadius: isOwn ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
            background: bubbleBackground,
            border: `1px solid ${from}4d`,
            fontSize: "0.88rem",
            lineHeight: 1.5,
            color: "#f1f5f9",
            boxShadow: `0 5px 16px ${from}38`,
            backdropFilter: "blur(6px)",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            maxWidth: "100%",
          }}
        >
          {msg.text}
        </div>
        <button
          type="button"
          onClick={() => onCopyMessage?.(msg)}
          style={{
            border: "1px solid rgba(255,255,255,0.14)",
            background: isCopied ? "rgba(16,185,129,0.2)" : "rgba(2,6,23,0.35)",
            color: isCopied ? "#34d399" : "rgba(226,232,240,0.85)",
            borderRadius: 999,
            padding: "3px 8px",
            fontSize: "0.66rem",
            lineHeight: 1.2,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            backdropFilter: "blur(6px)",
          }}
          title="Copy message"
          aria-label="Copy message"
        >
          {isCopied ? <Check size={12} /> : <Copy size={12} />}
          {isCopied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function ChatPanel({
  messages,
  input,
  onInputChange,
  onSubmit,
  messagesRef,
  inputRef,
  compact = false,
  panelHeight = "100%",
}) {
  const [copiedId, setCopiedId] = useState(null);
  const [copyLog, setCopyLog] = useState("");

  const handleCopyMessage = async (msg) => {
    if (!msg?.text) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(msg.text);
      } else {
        const tempTextArea = document.createElement("textarea");
        tempTextArea.value = msg.text;
        tempTextArea.setAttribute("readonly", "");
        tempTextArea.style.position = "absolute";
        tempTextArea.style.left = "-9999px";
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand("copy");
        document.body.removeChild(tempTextArea);
      }

      setCopiedId(msg.id);
      setCopyLog("Copied to clipboard");
      setTimeout(() => setCopiedId(null), 1300);
      setTimeout(() => setCopyLog(""), 1700);
    } catch {
      setCopyLog("Could not copy message");
      setTimeout(() => setCopyLog(""), 1700);
    }
  };

  return (
    <>
      <div
        ref={messagesRef}
        className="dr-messages"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: compact ? "0.95rem 1rem" : "1.2rem 1.4rem",
          minHeight: 0,
          height: panelHeight,
        }}
      >
        {messages.map((msg) =>
          msg.isSystem ? (
            <div
              key={msg.id}
              style={{
                textAlign: "center",
                margin: "0.5rem 0 1.25rem",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  maxWidth: "85%",
                  padding: "6px 16px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  fontSize: "0.73rem",
                  color: "rgba(148,163,184,0.6)",
                  fontStyle: "italic",
                  lineHeight: "1.5",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {msg.text}
              </span>
            </div>
          ) : (
            <ChatMessage
              key={msg.id}
              msg={msg}
              isOwn={!!msg.isOwn}
              compact={compact}
              onCopyMessage={handleCopyMessage}
              isCopied={copiedId === msg.id}
            />
          ),
        )}
      </div>
      {copyLog && (
        <div
          style={{
            padding: "0 1rem 0.35rem",
            fontSize: "0.72rem",
            fontWeight: 600,
            color: copyLog.includes("Could not") ? "#fca5a5" : "#6ee7b7",
            textAlign: "center",
          }}
        >
          {copyLog}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="dr-input-form"
        style={{
          padding: compact ? "0.85rem 1rem" : "1rem 1.4rem",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          gap: "10px",
          alignItems: "center",
          background: "rgba(255,255,255,0.015)",
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Message the team…"
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "0.65rem 1rem",
            color: "#f1f5f9",
            fontSize: "0.88rem",
            outline: "none",
            transition: "border 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.5)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
        />
        <button
          type="submit"
          className="dr-send"
          style={{
            width: 40,
            height: 40,
            borderRadius: "12px",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
            transition: "all 0.2s",
            flexShrink: 0,
          }}
        >
          <Send size={17} color="#fff" />
        </button>
      </form>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
const DEMO_MESSAGES = [
  {
    id: 1,
    author: "System",
    text: "Welcome to the Discussion Room! This is a shared space for your team.",
    time: "Just now",
    colorIndex: 0,
    isSystem: true,
  },
];

export default function DiscussionRoom({
  workspaceName,
  workspaceId,
  members = [],
  user,
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [roomStatus, setRoomStatus] = useState("Start");
  const socket = useSockets();
  const popupRef = useRef(null);
  const popupMessagesRef = useRef(null);
  const popupInputRef = useRef(null);
  const videoMessagesRef = useRef(null);
  const videoInputRef = useRef(null);

  const memberColorMap = useMemo(() => {
    const map = new Map();
    members.forEach((member, index) => {
      const colorIndex = index % PALETTE.length;
      const memberId = member?.user?.id || member?.id;
      const memberName = member?.user?.name || member?.name;

      if (memberId) map.set(`id:${memberId}`, colorIndex);
      if (memberName) map.set(`name:${memberName.toLowerCase()}`, colorIndex);
    });
    return map;
  }, [members]);

  const resolveColorIndex = useCallback(
    (authorId, authorName) => {
      if (authorId && memberColorMap.has(`id:${authorId}`)) {
        return memberColorMap.get(`id:${authorId}`);
      }
      const nameKey = (authorName || "").toLowerCase();
      if (nameKey && memberColorMap.has(`name:${nameKey}`)) {
        return memberColorMap.get(`name:${nameKey}`);
      }
      return getPaletteIndexFromSeed(`${authorId || ""}:${authorName || ""}`);
    },
    [memberColorMap],
  );

  useEffect(() => {
    const onConnection = () => {
      socket.emit("join-room", { workSpaceId: `${workspaceId}` });
      socket.emit("retrive-message", { workSpaceId: workspaceId });
    };

    if (socket.connected) {
      onConnection();
    }
    socket.on("connect", onConnection);

    const handleAllMessages = (history) => {
      if (Array.isArray(history)) {
        const mapped = history.map((m) => ({
          id: m.id,
          author: m.user?.name || "Member",
          authorId: m.userId || m.user?.id,
          text: m.message,
          time: new Date(m.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          colorIndex: resolveColorIndex(m.userId || m.user?.id, m.user?.name),
          isOwn: m.userId === user?.id,
        }));
        setMessages([DEMO_MESSAGES[0], ...mapped]);
      }
    };

    const handleReceived = (data) => {
      if (data && data.text) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            author: data.author || "Guest",
            authorId: data.authorId,
            text: data.text,
            time:
              data.time ||
              new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            colorIndex: resolveColorIndex(data.authorId, data.author),
            isOwn: data.authorId === user?.id,
          },
        ]);
        if (!open && !videoCallOpen) setUnread((u) => u + 1);
      }
    };

    socket.on("all-messages", handleAllMessages);
    socket.on("received-message", handleReceived);

    return () => {
      socket.off("connect", onConnection);
      socket.off("all-messages", handleAllMessages);
      socket.off("received-message", handleReceived);
      socket.emit("leave-room", { workSpaceId: workspaceId });
    };
  }, [open, resolveColorIndex, socket, user?.id, videoCallOpen, workspaceId]);

  // show up to 5 avatars in footer
  const visible = members.slice(0, 5);
  const extra = members.length - visible.length;

  // close on outside click
  useEffect(() => {
    function onDown(e) {
      if (popupRef.current && !popupRef.current.contains(e.target))
        setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // scroll to bottom on new message
  useEffect(() => {
    if (popupMessagesRef.current) {
      popupMessagesRef.current.scrollTop = popupMessagesRef.current.scrollHeight;
    }
    if (videoMessagesRef.current) {
      videoMessagesRef.current.scrollTop = videoMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  //
  useEffect(() => {
    const handleCallActive = (data) => {
      if (data.workSpaceId == workspaceId) {
        setRoomStatus(data.status ? "Join" : "Start");
      }
    };
    socket.on("on-call-active", handleCallActive);

    if (videoCallOpen) {
      socket.emit("join-video-room", { workSpaceId: workspaceId });
    }

    return () => {
      socket.off("on-call-active", handleCallActive); // ← cleanup
    };
  }, [videoCallOpen, socket, workspaceId]);

  function sendMessage(e, focusRef) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const authorName = user?.name || "You";

    const messageData = {
      text,
      author: authorName,
      authorId: user?.id,
      workSpaceId: workspaceId,
      time,
      colorIndex: resolveColorIndex(user?.id, authorName),
    };

    socket.emit("sent-message", messageData);

    // Local update (optional if backend broadcasts back, but good for UX)
    // However, if backend broadcasts back to EVERYONE including sender, we might get duplicates.
    // Standard practice is either local update or wait for broadcast.
    // The backend code provided uses `this.server.emit` which broadcasts to everyone.

    /* 
    setMessages(prev => [...prev, {
      ...messageData,
      id: Date.now(),
      isOwn: true,
    }]); 
    */

    setInput("");
    setTimeout(() => focusRef?.current?.focus(), 50);
  }

  const handlePopupSend = (e) => sendMessage(e, popupInputRef);
  const handleVideoSend = (e) => sendMessage(e, videoInputRef);

  return (
    <>
      <style>{`
        @keyframes drTooltip {
          from { opacity:0; transform:translateX(-50%) translateY(5px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
        @keyframes drPopup {
          from { opacity:0; transform:translateY(20px) scale(0.97); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
        @keyframes drPulse {
          0%,100% { box-shadow: 0 0 0 0   rgba(99,102,241,0.55), 0 8px 24px rgba(99,102,241,0.35); }
          50%     { box-shadow: 0 0 0 10px rgba(99,102,241,0),   0 8px 24px rgba(99,102,241,0.35); }
        }
        .dr-fab { transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1) !important; }
        .dr-fab:hover { transform: translateY(-3px) scale(1.04) !important; }
        .dr-send:hover { background: rgba(99,102,241,0.9) !important; }
        .dr-messages::-webkit-scrollbar { width: 4px; }
        .dr-messages::-webkit-scrollbar-track { background: transparent; }
        .dr-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius:99px; }
        @media (max-width: 768px) {
          .dr-popup {
            right: 12px !important;
            left: 12px !important;
            width: auto !important;
            bottom: 74px !important;
            height: min(560px, calc(100vh - 110px)) !important;
            border-radius: 18px !important;
          }
          .dr-popup-header {
            padding: 0.8rem 0.85rem !important;
          }
          .dr-popup-title h3 {
            font-size: 0.92rem !important;
          }
          .dr-popup-title p {
            font-size: 0.58rem !important;
          }
          .dr-popup-actions {
            gap: 6px !important;
          }
          .dr-video-btn {
            padding: 6px 8px !important;
            font-size: 0.68rem !important;
          }
          .dr-members-strip {
            padding: 0.6rem 0.85rem !important;
          }
          .dr-messages {
            padding: 0.9rem 0.85rem !important;
          }
          .dr-input-form {
            padding: 0.75rem 0.85rem !important;
          }
          .dr-fab {
            right: 12px !important;
            bottom: 12px !important;
            padding: 0 14px !important;
            height: 46px !important;
          }
          .dr-fab-text {
            display: none;
          }
        }
      `}</style>

      {/* ── Popup ────────────────────────────────────────────────────────────── */}
      {open && !videoCallOpen && (
        <div
          ref={popupRef}
          className="dr-popup"
          style={{
            position: "fixed",
            bottom: "90px",
            right: "28px",
            width: "min(420px, calc(100vw - 40px))",
            height: "min(580px, calc(100vh - 130px))",
            background:
              "linear-gradient(160deg,rgba(10,15,30,0.97) 0%,rgba(17,24,39,0.97) 100%)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: "24px",
            zIndex: 3000,
            display: "flex",
            flexDirection: "column",
            boxShadow:
              "0 28px 72px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)",
            backdropFilter: "blur(28px)",
            animation: "drPopup 0.26s cubic-bezier(0.34,1.56,0.64,1) forwards",
            overflow: "hidden",
          }}
        >
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div
            className="dr-popup-header"
            style={{
              background:
                "linear-gradient(90deg,rgba(99,102,241,0.22) 0%,rgba(139,92,246,0.14) 100%)",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              padding: "1.1rem 1.4rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div
              className="dr-popup-title"
              style={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "12px",
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(99,102,241,0.45)",
                }}
              >
                <MessageCircle size={20} color="#fff" />
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "rgba(148,163,184,0.65)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Discussion Room for
                </p>
                <h3
                  style={{
                    margin: "2px 0 0",
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    background: "linear-gradient(90deg,#818cf8,#a78bfa)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {workspaceName || "Workspace"}
                </h3>
              </div>
            </div>

            <div
              className="dr-popup-actions"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <button
                onClick={() => {
                  setVideoCallOpen(true);
                }}
                className="dr-video-btn"
                style={{
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  border: "none",
                  borderRadius: "10px",
                  color: "#fff",
                  padding: "6px 14px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 16px rgba(99,102,241,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(99,102,241,0.3)";
                }}
              >
                <Video size={14} />
                {`${roomStatus} Video Discussion`}
              </button>

              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  color: "rgba(148,163,184,0.8)",
                  cursor: "pointer",
                  width: 34,
                  height: 34,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(239,68,68,0.18)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
                }
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Online members strip ────────────────────────────────────────── */}
          <div
            className="dr-members-strip"
            style={{
              padding: "0.75rem 1.4rem",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexShrink: 0,
              background: "rgba(255,255,255,0.015)",
            }}
          >
            <Users size={13} color="rgba(148,163,184,0.5)" />
            <span
              style={{
                fontSize: "0.73rem",
                color: "rgba(148,163,184,0.5)",
                fontWeight: 600,
                marginRight: 4,
              }}
            >
              {members.length} member{members.length !== 1 ? "s" : ""}
            </span>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {visible.map((m, i) => (
                <MemberAvatar key={m.id || i} member={m} index={i} size={30} />
              ))}
              {extra > 0 && (
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.07)",
                    border: "2px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    color: "rgba(148,163,184,0.75)",
                  }}
                >
                  +{extra}
                </div>
              )}
            </div>
          </div>

          <ChatPanel
            messages={messages}
            input={input}
            onInputChange={setInput}
            onSubmit={handlePopupSend}
            messagesRef={popupMessagesRef}
            inputRef={popupInputRef}
          />
        </div>
      )}

      {/* ── Video Call Popup ────────────────────────────────────────────────── */}
      {videoCallOpen && (
        // <VideoRoom
        //   workspaceName={workspaceName}
        //   onClose={() => setVideoCallOpen(false)}
        //   workspaceId={workspaceId}
        //   userId={user?.id}
        // />
        <VcComponentRoom
          workspaceName={workspaceName}
          onClose={() => setVideoCallOpen(false)}
          workspaceId={workspaceId}
          userId={user?.id}
          chatPanel={
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
                background:
                  "linear-gradient(160deg,rgba(10,15,30,0.96) 0%,rgba(17,24,39,0.96) 100%)",
              }}
            >
              <div
                style={{
                  padding: "0.8rem 1rem",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  color: "rgba(226,232,240,0.86)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Discussion Chat
              </div>
              <ChatPanel
                messages={messages}
                input={input}
                onInputChange={setInput}
                onSubmit={handleVideoSend}
                messagesRef={videoMessagesRef}
                inputRef={videoInputRef}
                compact
              />
            </div>
          }
        />
      )}

      {/* ── FAB ─────────────────────────────────────────────────────────────── */}
      <button
        className="dr-fab"
        onClick={() => {
          setOpen((v) => !v);
          setUnread(0);
        }}
        aria-label="Open Discussion Room"
        style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          zIndex: 2999,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "0 20px 0 14px",
          height: "50px",
          borderRadius: "999px",
          background: open
            ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
            : "linear-gradient(135deg,#4f46e5,#7c3aed)",
          border: "none",
          cursor: "pointer",
          color: "#fff",
          fontSize: "0.88rem",
          fontWeight: 700,
          letterSpacing: "0.01em",
          animation: open ? "none" : "drPulse 2.6s ease-in-out infinite",
          boxShadow: "0 8px 26px rgba(99,102,241,0.4)",
          whiteSpace: "nowrap",
        }}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
        <span className="dr-fab-text">Discussion Room</span>
        {!open && unread > 0 && (
          <span
            style={{
              background: "#ef4444",
              borderRadius: "99px",
              padding: "1px 7px",
              fontSize: "0.72rem",
              fontWeight: 800,
              boxShadow: "0 2px 8px rgba(239,68,68,0.5)",
            }}
          >
            {unread}
          </span>
        )}
      </button>
    </>
  );
}
