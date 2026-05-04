import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Users, Send, Smile } from "lucide-react";
import { io } from "socket.io-client";

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

function MemberAvatar({ member, index, size = 40 }) {
  const [hovered, setHovered] = useState(false);
  const [from, to] = PALETTE[index % PALETTE.length];
  const name  = member?.user?.name  || member?.name  || "Unknown";
  const email = member?.user?.email || member?.email || "";
  const role  = member?.role || "Member";

  return (
    <div
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: `linear-gradient(135deg, ${from}, ${to})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.38, fontWeight: 800, color: "#fff",
        border: "2.5px solid rgba(255,255,255,0.14)",
        cursor: "default", userSelect: "none",
        boxShadow: hovered
          ? `0 0 0 3px ${from}66, 0 6px 20px ${from}55`
          : "0 2px 10px rgba(0,0,0,0.35)",
        transform: hovered ? "translateY(-5px) scale(1.1)" : "none",
        transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {name.charAt(0).toUpperCase()}
      </div>

      {hovered && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 10px)", left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(145deg,rgba(15,23,42,0.98),rgba(30,41,59,0.98))",
          border: "1px solid rgba(255,255,255,0.12)", borderRadius: "14px",
          padding: "10px 14px", whiteSpace: "nowrap", pointerEvents: "none",
          zIndex: 9999,
          boxShadow: "0 10px 36px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
          backdropFilter: "blur(16px)",
          animation: "drTooltip 0.16s ease forwards",
        }}>
          {/* arrow */}
          <div style={{
            position:"absolute", top:"100%", left:"50%",
            transform:"translateX(-50%)", borderLeft:"6px solid transparent",
            borderRight:"6px solid transparent",
            borderTop:"6px solid rgba(255,255,255,0.12)",
          }}/>
          <p style={{ margin:0, fontSize:"0.83rem", fontWeight:700, color:"#f1f5f9" }}>{name}</p>
          {email && <p style={{ margin:"2px 0 0", fontSize:"0.72rem", color:"rgba(148,163,184,0.85)" }}>{email}</p>}
          <span style={{
            display:"inline-block", marginTop:"5px",
            fontSize:"0.67rem", fontWeight:700, textTransform:"uppercase",
            letterSpacing:"0.06em", color: from,
            background:`${from}22`, padding:"2px 8px", borderRadius:"99px",
          }}>{role}</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CHAT MESSAGE
───────────────────────────────────────────────────────────────────────────── */
function ChatMessage({ msg, isOwn }) {
  const [from, to] = PALETTE[msg.colorIndex % PALETTE.length];
  return (
    <div style={{
      display:"flex", gap:"10px",
      flexDirection: isOwn ? "row-reverse" : "row",
      alignItems:"flex-start", marginBottom:"1rem",
    }}>
      {/* avatar */}
      <div style={{
        width:34, height:34, borderRadius:"50%", flexShrink:0,
        background:`linear-gradient(135deg,${from},${to})`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:"0.78rem", fontWeight:800, color:"#fff",
        border:"2px solid rgba(255,255,255,0.12)",
      }}>
        {msg.author.charAt(0).toUpperCase()}
      </div>
      <div style={{ maxWidth:"72%", display:"flex", flexDirection:"column", gap:"4px",
        alignItems: isOwn ? "flex-end" : "flex-start" }}>
        <span style={{ fontSize:"0.7rem", color:"rgba(148,163,184,0.55)", fontWeight:600 }}>
          {msg.author} · {msg.time}
        </span>
        <div style={{
          padding:"10px 14px", borderRadius: isOwn ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
          background: isOwn
            ? `linear-gradient(135deg,${from}cc,${to}bb)`
            : "rgba(255,255,255,0.05)",
          border: isOwn ? "none" : "1px solid rgba(255,255,255,0.07)",
          fontSize:"0.88rem", lineHeight:1.5, color:"#f1f5f9",
          boxShadow: isOwn ? `0 4px 14px ${from}44` : "none",
        }}>
          {msg.text}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
const DEMO_MESSAGES = [
  { id:1, author:"System", text:"Welcome to the Discussion Room! This is a shared space for your team.", time:"Just now", colorIndex:0, isSystem:true },
];

export default function DiscussionRoom({ workspaceName, workspaceId, members = [], user }) {
  const [open, setOpen]     = useState(false);
  const [input, setInput]   = useState("");
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [unread, setUnread] = useState(0);
  const socketRef = useRef(null);

  // Initialize Socket.io
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:3000";
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to chat socket:", socket.id);
      socket.emit("retrive-message", { workSpaceId: workspaceId });
    });

    socket.on("all-messages", (history) => {
      if (Array.isArray(history)) {
        const mapped = history.map((m) => ({
          id: m.id,
          author: m.user?.name || "Member",
          text: m.message,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          colorIndex: 0,
          isOwn: m.userId === user?.id,
        }));
        setMessages([DEMO_MESSAGES[0], ...mapped]);
      }
    });

    socket.on("received-message", (data) => {
      // If the backend returns an empty object, we might need to handle it.
      // But we expect { text, author, authorId, time, colorIndex }
      if (data && data.text) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            author: data.author || "Guest",
            text: data.text,
            time: data.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            colorIndex: data.colorIndex || 0,
            isOwn: data.authorId === user?.id,
          },
        ]);
        if (!open) setUnread((u) => u + 1);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, open]);

  const popupRef  = useRef(null);
  const messagesRef = useRef(null);
  const inputRef  = useRef(null);

  // show up to 5 avatars in footer
  const visible = members.slice(0, 5);
  const extra   = members.length - visible.length;

  // close on outside click
  useEffect(() => {
    function onDown(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // scroll to bottom on new message
  useEffect(() => {
    if (messagesRef.current)
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    if (open) setUnread(0);
  }, [messages, open]);

  function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const authorName = user?.name || "You";

    const messageData = {
      text,
      author: authorName,
      authorId: user?.id,
      workSpaceId: workspaceId,
      time,
      colorIndex: 0,
    };

    // Emit to backend
    if (socketRef.current) {
      socketRef.current.emit("sent-message", messageData);
    }

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
    setTimeout(() => inputRef.current?.focus(), 50);
  }

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
      `}</style>

      {/* ── Popup ────────────────────────────────────────────────────────────── */}
      {open && (
        <div ref={popupRef} style={{
          position:"fixed", bottom:"90px", right:"28px",
          width:"min(420px, calc(100vw - 40px))",
          height:"min(580px, calc(100vh - 130px))",
          background:"linear-gradient(160deg,rgba(10,15,30,0.97) 0%,rgba(17,24,39,0.97) 100%)",
          border:"1px solid rgba(255,255,255,0.09)",
          borderRadius:"24px", zIndex:3000, display:"flex", flexDirection:"column",
          boxShadow:"0 28px 72px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)",
          backdropFilter:"blur(28px)",
          animation:"drPopup 0.26s cubic-bezier(0.34,1.56,0.64,1) forwards",
          overflow:"hidden",
        }}>

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div style={{
            background:"linear-gradient(90deg,rgba(99,102,241,0.22) 0%,rgba(139,92,246,0.14) 100%)",
            borderBottom:"1px solid rgba(255,255,255,0.07)",
            padding:"1.1rem 1.4rem",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            flexShrink:0,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
              <div style={{
                width:40, height:40, borderRadius:"12px",
                background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 4px 14px rgba(99,102,241,0.45)",
              }}>
                <MessageCircle size={20} color="#fff" />
              </div>
              <div>
                <p style={{ margin:0, fontSize:"0.65rem", fontWeight:700,
                  color:"rgba(148,163,184,0.65)", textTransform:"uppercase", letterSpacing:"0.1em" }}>
                  Discussion Room for
                </p>
                <h3 style={{ margin:"2px 0 0", fontSize:"1.05rem", fontWeight:800,
                  background:"linear-gradient(90deg,#818cf8,#a78bfa)",
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                  backgroundClip:"text", letterSpacing:"-0.01em" }}>
                  {workspaceName || "Workspace"}
                </h3>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
              borderRadius:"10px", color:"rgba(148,163,184,0.8)", cursor:"pointer",
              width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(239,68,68,0.18)"}
              onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.06)"}
            >
              <X size={16} />
            </button>
          </div>

          {/* ── Online members strip ────────────────────────────────────────── */}
          <div style={{
            padding:"0.75rem 1.4rem",
            borderBottom:"1px solid rgba(255,255,255,0.05)",
            display:"flex", alignItems:"center", gap:"10px", flexShrink:0,
            background:"rgba(255,255,255,0.015)",
          }}>
            <Users size={13} color="rgba(148,163,184,0.5)" />
            <span style={{ fontSize:"0.73rem", color:"rgba(148,163,184,0.5)", fontWeight:600, marginRight:4 }}>
              {members.length} member{members.length !== 1 ? "s" : ""}
            </span>
            <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
              {visible.map((m, i) => (
                <MemberAvatar key={m.id || i} member={m} index={i} size={30} />
              ))}
              {extra > 0 && (
                <div style={{
                  width:30, height:30, borderRadius:"50%",
                  background:"rgba(255,255,255,0.07)", border:"2px solid rgba(255,255,255,0.1)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"0.68rem", fontWeight:800, color:"rgba(148,163,184,0.75)",
                }}>+{extra}</div>
              )}
            </div>
          </div>

          {/* ── Messages area ──────────────────────────────────────────────── */}
          <div ref={messagesRef} className="dr-messages" style={{
            flex:1, overflowY:"auto", padding:"1.2rem 1.4rem",
          }}>
            {messages.map(msg => (
              msg.isSystem ? (
                <div key={msg.id} style={{
                  textAlign:"center", margin:"0.5rem 0 1.25rem",
                  fontSize:"0.73rem", color:"rgba(148,163,184,0.45)", fontStyle:"italic",
                }}>
                  <span style={{
                    padding:"4px 14px", background:"rgba(255,255,255,0.03)",
                    border:"1px solid rgba(255,255,255,0.06)", borderRadius:"99px",
                  }}>{msg.text}</span>
                </div>
              ) : (
                <ChatMessage key={msg.id} msg={msg} isOwn={!!msg.isOwn} />
              )
            ))}
          </div>

          {/* ── Input bar ──────────────────────────────────────────────────── */}
          <form onSubmit={sendMessage} style={{
            padding:"1rem 1.4rem",
            borderTop:"1px solid rgba(255,255,255,0.07)",
            display:"flex", gap:"10px", alignItems:"center",
            background:"rgba(255,255,255,0.015)", flexShrink:0,
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Message the team…"
              style={{
                flex:1, background:"rgba(255,255,255,0.05)",
                border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px",
                padding:"0.65rem 1rem", color:"#f1f5f9", fontSize:"0.88rem",
                outline:"none", transition:"border 0.2s",
              }}
              onFocus={e => e.target.style.borderColor="rgba(99,102,241,0.5)"}
              onBlur={e  => e.target.style.borderColor="rgba(255,255,255,0.1)"}
            />
            <button type="submit" className="dr-send" style={{
              width:40, height:40, borderRadius:"12px",
              background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
              border:"none", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 4px 14px rgba(99,102,241,0.4)",
              transition:"all 0.2s", flexShrink:0,
            }}>
              <Send size={17} color="#fff" />
            </button>
          </form>
        </div>
      )}

      {/* ── FAB ─────────────────────────────────────────────────────────────── */}
      <button
        className="dr-fab"
        onClick={() => { setOpen(v => !v); setUnread(0); }}
        aria-label="Open Discussion Room"
        style={{
          position:"fixed", bottom:"28px", right:"28px", zIndex:2999,
          display:"flex", alignItems:"center", gap:"10px",
          padding:"0 20px 0 14px", height:"50px", borderRadius:"999px",
          background: open
            ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
            : "linear-gradient(135deg,#4f46e5,#7c3aed)",
          border:"none", cursor:"pointer", color:"#fff",
          fontSize:"0.88rem", fontWeight:700, letterSpacing:"0.01em",
          animation: open ? "none" : "drPulse 2.6s ease-in-out infinite",
          boxShadow:"0 8px 26px rgba(99,102,241,0.4)",
          whiteSpace:"nowrap",
        }}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
        <span>Discussion Room</span>
        {!open && unread > 0 && (
          <span style={{
            background:"#ef4444", borderRadius:"99px",
            padding:"1px 7px", fontSize:"0.72rem", fontWeight:800,
            boxShadow:"0 2px 8px rgba(239,68,68,0.5)",
          }}>{unread}</span>
        )}
      </button>
    </>
  );
}
