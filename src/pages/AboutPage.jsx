import React from 'react';

export default function AboutPage() {
  return (
    <div className="about-page">
      <div className="about-header">
        <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem' }}>About CyberOps</h1>
        <p style={{ fontSize: '1.25rem', color: '#94a3b8' }}>Securing the future driven by AI and data intelligence.</p>
      </div>

      <div className="about-content">
        <div className="about-card">
          <h2 style={{ marginBottom: '1rem', color: 'white' }}>Our Mission</h2>
          <p style={{ lineHeight: '1.8', color: '#cbd5e1' }}>
            The modern cybersecurity landscape is drowning in noise. Vulnerability scanners output thousands of alerts, leaving security analysts paralyzed by false positives and lacking context.
            Our mission is to dramatically reduce Mean Time To Remediation (MTTR) by prioritizing vulnerabilities that actually matter using EPSS, and automatically suggesting how to fix them using cutting edge AI.
          </p>
        </div>

        <div className="about-stats">
          <div className="stat-box">
            <span className="stat-number">10K+</span>
            <span className="stat-label">CVEs Analysed</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">99.9%</span>
            <span className="stat-label">Uptime</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Protection</span>
          </div>
        </div>

        <div className="about-card" style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', color: 'white' }}>How We Built It</h2>
          <p style={{ lineHeight: '1.8', color: '#cbd5e1' }}>
            CyberOps is a commercial-grade platform built with React, Node.js, and modern AI inference algorithms. 
            We pull live intelligence from the National Vulnerability Database (NVD) and the Exploit Prediction Scoring System (EPSS) to bring you the best security insights available.
          </p>
        </div>
      </div>
    </div>
  );
}
