import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import '../index.css';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken && refreshToken) {
      // Store in localStorage for frontend state
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Set cookies for backend/guard compatibility
      // We set them for 7 days (matching refresh token) or appropriate duration
      const setCookie = (name, value, days) => {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax`;
      };

      setCookie('access_token', accessToken, 7);
      setCookie('refresh_token', refreshToken, 7);

      // Clean up URL parameters and redirect
      navigate('/dashboard', { replace: true });
    } else {
      console.error('Missing tokens in callback URL');
      navigate('/login', { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className="login-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Loader2 size={48} className="spinner" style={{ color: '#3b82f6', marginBottom: '1rem' }} />
      <h2 style={{ fontSize: '1.25rem', fontWeight: 500 }}>Authenticating...</h2>
      <p style={{ color: '#94a3b8' }}>Please wait while we log you in.</p>
    </div>
  );
}
