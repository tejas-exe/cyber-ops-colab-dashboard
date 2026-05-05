import React from 'react';
import { ShieldAlert } from 'lucide-react';
import '../index.css';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "");

export default function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div className="login-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '2rem' }}>
        <ShieldAlert size={48} className="logo-icon" style={{ margin: '0 auto 1.5rem auto' }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Welcome to CyberOps</h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Sign in or create an account to access the intelligence dashboard.</p>
        
        <button className="btn-primary" onClick={handleGoogleLogin} style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
          Continue with Google
        </button>
      </div>
    </div>
  );
}
