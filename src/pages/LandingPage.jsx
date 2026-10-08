import React, { useState } from 'react';
import { KeyRound, Shield, HelpCircle } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';
import { authService } from '../services/authService';

export function LandingPage({ onTeamLoginSuccess, onAdminLoginSuccess }) {
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [accessKey, setAccessKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const key = accessKey.trim();
    if (!key) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const cleanUpperKey = key.toUpperCase();
      const defaultAdminKey = (
        (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_DEFAULT_ADMIN_KEY) ||
        'ADM-2007'
      ).trim().toUpperCase();

      // 1. If key matches admin key or starts with ADM / ADMIN, attempt Admin login first
      if (
        cleanUpperKey === defaultAdminKey ||
        cleanUpperKey === 'ADM-2007' ||
        cleanUpperKey.startsWith('ADM-') ||
        cleanUpperKey.startsWith('ADMIN')
      ) {
        const adminRes = await authService.loginAdmin(key);
        if (adminRes.success) {
          soundEffects.playAccessGranted();
          setShowAccessModal(false);
          onAdminLoginSuccess(adminRes.admin);
          return;
        }
      }

      // 2. Attempt Team login (e.g. CYB-001)
      const teamRes = await authService.loginTeam(key);
      if (teamRes.success) {
        soundEffects.playAccessGranted();
        setShowAccessModal(false);
        onTeamLoginSuccess(teamRes.team, teamRes.gameSession);
        return;
      }

      // 3. Fallback check for Admin key
      const fallbackAdminRes = await authService.loginAdmin(key);
      if (fallbackAdminRes.success) {
        soundEffects.playAccessGranted();
        setShowAccessModal(false);
        onAdminLoginSuccess(fallbackAdminRes.admin);
        return;
      }

      soundEffects.playAccessDenied();
      setErrorMsg(teamRes.error || 'Invalid security access key. Please check your credentials and retry.');
    } catch (err) {
      soundEffects.playAccessDenied();
      setErrorMsg('Authentication error. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        height: '100vh',
        padding: '2rem 1.5rem',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Background Video / Asset */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.18,
          pointerEvents: 'none',
          zIndex: 0
        }}
        poster="/assets/main page starter page.webp"
      >
        <source src="/assets/main page 1.mp4" type="video/mp4" />
      </video>

      <div className="cyber-bg" />
      <div className="cyber-bg-radial" />

      {/* Hero Content Container - Only CYBER ESCAPE and START GAME */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Main CYBER ESCAPE Display Heading - Larger & Glowing */}
        <h1
          className="glow-cyan font-display"
          style={{
            fontSize: 'clamp(4rem, 10vw, 7.2rem)',
            fontWeight: '900',
            letterSpacing: '8px',
            lineHeight: 1.05,
            marginBottom: '3rem',
            filter: 'drop-shadow(0 0 35px rgba(0, 243, 255, 0.55))',
            textShadow: '0 0 30px var(--neon-cyan-glow)'
          }}
        >
          CYBER ESCAPE
        </h1>

        {/* Single Action Button: START GAME ONLY */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <button
            onClick={() => {
              soundEffects.playClick();
              setErrorMsg('');
              setShowAccessModal(true);
            }}
            className="cyber-btn cyber-btn-primary"
            style={{
              padding: '1.15rem 3.6rem',
              fontSize: '1.25rem',
              letterSpacing: '2.5px',
              boxShadow: '0 0 30px var(--neon-cyan-glow)',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.8rem'
            }}
          >
            <KeyRound size={24} /> START GAME
          </button>
        </div>
      </div>

      {/* UNIFIED ACCESS LOGIN MODAL */}
      {showAccessModal && (
        <div className="cyber-modal-overlay">
          <div className="cyber-modal-content" style={{ maxWidth: '460px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.2rem' }}>
              <Shield size={24} color="var(--neon-cyan)" />
              <h3 className="cyber-title glow-cyan" style={{ fontSize: '1.15rem' }}>
                SECURITY ACCESS AUTHORIZATION
              </h3>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Enter your assigned security access key to authenticate. The system will automatically detect your team profile or authorized command credentials.
            </p>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '1.2rem' }}>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="ENTER ACCESS KEY (e.g. CYB-001)"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  style={{ letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center', fontSize: '1.1rem' }}
                  autoFocus
                />
              </div>

              {errorMsg && (
                <div
                  style={{
                    padding: '0.6rem 0.9rem',
                    borderRadius: '6px',
                    background: 'rgba(255, 42, 95, 0.12)',
                    border: '1px solid var(--border-error)',
                    color: 'var(--neon-red)',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  ✕ {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="cyber-btn"
                  onClick={() => {
                    soundEffects.playClick();
                    setShowAccessModal(false);
                  }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="cyber-btn cyber-btn-primary"
                  disabled={loading || !accessKey.trim()}
                >
                  {loading ? 'AUTHENTICATING...' : 'ENTER SYSTEM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

