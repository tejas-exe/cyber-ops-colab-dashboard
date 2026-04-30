import React from 'react';
import { ShieldAlert, Globe, Mail, Activity } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <ShieldAlert className="logo-icon-small" size={24} color="#3b82f6" />
          <span>CyberOps</span>
        </div>
        <p className="footer-text">© {new Date().getFullYear()} CyberOps Platform. All rights reserved.</p>
        <div className="footer-socials">
          <a href="#"><Globe size={20} /></a>
          <a href="#"><Mail size={20} /></a>
          <a href="#"><Activity size={20} /></a>
        </div>
      </div>
    </footer>
  );
}
