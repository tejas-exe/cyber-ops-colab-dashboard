import { Video, X } from "lucide-react";

const VcWrapper = ({ children, workspaceName ,onClose }) => {
    return (

        <div style={{
            position: "fixed", top: "4vh", left: "4vw",
            width: "92vw", height: "92vh",
            background: "linear-gradient(165deg, #0f172a 0%, #020617 100%)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "32px", zIndex: 4000, display: "flex", flexDirection: "column",
            boxShadow: "0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",
            backdropFilter: "blur(40px)",
            animation: "drPopup 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
            overflow: "hidden",
        }}>
            <div style={{
                padding: "1.25rem 2.5rem",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(255,255,255,0.02)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: "14px",
                        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 8px 25px rgba(99,102,241,0.4)",
                    }}>
                        <Video size={24} color="#fff" />
                    </div>
                    <div>
                        <h3 style={{
                            margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#fff",
                            letterSpacing: "-0.02em"
                        }}>Video Discussion</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }} />
                            <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(148,163,184,0.7)", fontWeight: 500 }}>
                                {workspaceName} • 12 Active Participants
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                        padding: "8px 16px", borderRadius: "12px", background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600
                    }}>
                        00:42:15
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "14px", color: "rgba(148,163,184,0.8)", cursor: "pointer",
                            width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                            e.currentTarget.style.color = "#ef4444";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                            e.currentTarget.style.color = "rgba(148,163,184,0.8)";
                        }}
                    >
                        <X size={22} />
                    </button>
                </div>
            </div>
            <div style={{ flex: 1, display: "flex", padding: "24px", gap: "24px", overflow: "hidden" }}>
                {children}
            </div>
        </div>

    )
}

export default VcWrapper