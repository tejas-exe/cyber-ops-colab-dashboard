import React from "react";
import { ChevronDown, Sparkles } from "lucide-react";

export default function VirtualizedCVEList({ data, expandedCve, onToggle }) {
  const Row = ({ item }) => {
    const isExpanded = expandedCve === item.cve;

    return (
      <div className={`cve-item ${isExpanded ? "expanded" : ""}`} style={{ marginBottom: "1rem" }}>
        <div
          className="cve-item-header"
          onClick={() => onToggle(item.cve)}
          style={{ padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
        >
          <div className="cve-item-info">
            <span style={{ fontWeight: 600, fontSize: "1.1rem" }}>
              {item.cve}
            </span>
            <div style={{ display: "flex", gap: "1rem", fontSize: "0.875rem", color: "#94a3b8" }}>
              <span style={{ color: "var(--risk-critical)" }}>CVSS {item.cvss}</span>
              <span style={{ color: "var(--primary-accent)" }}>
                EPSS {(item.epss * 100).toFixed(2)}%
              </span>
            </div>
          </div>
          <ChevronDown className="chevron-icon" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }} />
        </div>

        <div 
          style={{ 
            maxHeight: isExpanded ? "2000px" : "0", 
            overflow: "hidden", 
            transition: "all 0.5s cubic-bezier(0, 1, 0, 1)",
            background: "rgba(0,0,0,0.1)"
          }}
        >
          <div className="cve-item-content-inner" style={{ padding: "1.5rem" }}>
            <div className="description-box" style={{ marginBottom: "1.5rem", color: "var(--text-muted)", lineHeight: "1.6" }}>
              {item.description}
            </div>
            <div className="ai-fix-box">
              <div className="ai-fix-header" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary-accent)", fontWeight: 600, marginBottom: "1rem" }}>
                <Sparkles size={18} />
                <span>AI Recommended Fixes</span>
              </div>
              {item.fix && item.fix.length > 0 ? (
                <ul className="ai-fix-list" style={{ paddingLeft: "1.5rem" }}>
                  {item.fix.map((point, idx) => (
                    <li key={idx} style={{ marginBottom: "0.5rem" }}>{point}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                  No remediation steps available.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="cve-list">
      {data.map((item) => (
        <Row key={item.cve} item={item} />
      ))}
    </div>
  );
}