import { MonitorUp, MonitorX } from "lucide-react";
import type { CSSProperties } from "react";

const ScreenShareControls = ({
  mediaMessage,
  isScreenSharing,
  startScreenShare,
  stopScreenShare,
}) => {
  const handleClick = () =>
    isScreenSharing ? stopScreenShare() : startScreenShare();

  return (
    <div style={styles.wrapper}>
      <span style={styles.text}>{mediaMessage}</span>

      <button
        type="button"
        onClick={handleClick}
        style={{
          ...styles.button,
          background: isScreenSharing
            ? "rgba(239,68,68,0.2)"
            : "rgba(16,185,129,0.2)",
        }}
      >
        {isScreenSharing ? <MonitorX size={16} /> : <MonitorUp size={16} />}
        {isScreenSharing ? "Stop Sharing" : "Share Screen"}
      </button>
    </div>
  );
};

export default ScreenShareControls;
const styles: {
  wrapper: CSSProperties;
  text: CSSProperties;
  button: CSSProperties;
} = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },

  text: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  },

  button: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff",
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: 13,
  },
};
