import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Zap, Lock, BrainCircuit, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="badge-pill">🚀 Next-Generation AI Security</div>
          <h1 className="hero-title">
            Enterprise <span className="text-gradient">Vulnerability</span> Intelligence
          </h1>
          <p className="hero-subtitle">
            Instantly ingest security logs, extract CVEs, calculate EPSS risk scores, and let AI generate actionable remediation steps to secure your infrastructure.
          </p>
          <div className="hero-actions">
            <Link to="/dashboard" className="btn-glow" style={{ textDecoration: 'none' }}>
              Get Started Now <ArrowRight size={18} />
            </Link>
            <Link to="/about" className="btn-secondary" style={{ textDecoration: 'none' }}>
              Learn More
            </Link>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="glass-panel floating-1">
            <div className="glass-header">
              <ShieldAlert color="#ef4444" size={24} />
              <span>Critical Threat Detected</span>
            </div>
            <p className="cve-label">CVE-2023-38545</p>
            <div className="risk-bar"><div className="risk-fill critical" style={{width: '98%'}}></div></div>
          </div>
          <div className="glass-panel floating-2">
            <div className="glass-header">
              <BrainCircuit color="#3b82f6" size={24} />
              <span>AI Remediation</span>
            </div>
            <p className="ai-preview">Patch available. Update libcurl immediately to mitigate remote execution risk.</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features">
        <h2 className="section-title">Why Choose CyberOps?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="icon-wrapper"><Zap /></div>
            <h3>Lightning Fast Parsing</h3>
            <p>Drag and drop vast log files. We extract indicators of compromise and CVE strings in milliseconds.</p>
          </div>
          <div className="feature-card">
            <div className="icon-wrapper"><Lock /></div>
            <h3>EPSS & CVSS Correlation</h3>
            <p>Prioritize patching based on real-world exploit probability combined with severity ratings.</p>
          </div>
          <div className="feature-card">
            <div className="icon-wrapper"><BrainCircuit /></div>
            <h3>AI Remediation Plans</h3>
            <p>Stop Googling vulnerabilities. Our LLM pipeline feeds you exact actions to resolve the issue directly.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
