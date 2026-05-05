import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, Copy, Check } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsAuthenticated(!!token);
  }, [location]);

  const copyMyId = async () => {
    try {
      setIsCopying(true);
      const token = localStorage.getItem('accessToken');
      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "");
      
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      
      if (res.ok) {
        const userData = await res.json();
        const userId = userData.id;
        
        await navigator.clipboard.writeText(userId);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (e) {
      console.error("Failed to copy ID", e);
    } finally {
      setIsCopying(false);
    }
  };

  const handleLogout = async () => {
    try {
      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "");
      await fetch(`${API_BASE_URL}/auth/logout`, { 
        method: 'POST',
        credentials: 'include' 
      });
    } catch (e) {
      console.error("Logout failed", e);
    }
    
    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Clear cookies
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <ShieldAlert className="logo-icon" />
          <span>CyberOps</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>About</Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
              <button 
                onClick={copyMyId} 
                className="btn-secondary" 
                style={{ 
                  padding: '0.4rem 0.8rem', 
                  fontSize: '0.8rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: 'var(--primary-accent)'
                }}
              >
                {isCopying ? <Check size={14} /> : <Copy size={14} />}
                Copy My ID
              </button>
              <button onClick={handleLogout} className="btn-primary nav-btn" style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', cursor: 'pointer' }}>Logout</button>
            </>
          ) : (
            <Link to="/login" className="btn-primary nav-btn" style={{ textDecoration: 'none' }}>Get Started</Link>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: '#10b981',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease-out'
        }}>
          <Check size={18} />
          <span>User ID copied successfully!</span>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(1rem); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </nav>
  );
}
