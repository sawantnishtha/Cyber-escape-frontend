import React, { useState } from 'react';
import { KeyRound, Shield, Sparkles, HelpCircle } from 'lucide-react';
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
      // 1. If key starts with ADMIN, attempt Admin login first
      if (key.toUpperCase().startsWith('ADMIN')) {
        const adminRes = await authService.loginAdmin(key);
        if (adminRes.success) {
          soundEffects.playAccessGranted();
          setShowAccessModal(false);
          onAdminLoginSuccess(adminRes.admin);
          return;
        }
      }

      // 2. Attempt Team login
      const teamRes = await authService.loginTeam(key);
      if (teamRes.success) {
        soundEffects.playAccessGranted();
        setShowAccessModal(false);
        onTeamLoginSuccess(teamRes.team, teamRes.gameSession);
        return;
      }

      // 3. Fallback check for Admin key (in case admin key without ADMIN prefix is used)
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
        minHeight: 'calc(100vh - 68px)',
        padding: '2rem 1.5rem',
        overflow: 'hidden'
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

      {/* Hero Content Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          maxWidth: '850px',
          margin: '0 auto'
        }}
      >
        {/* Organizer Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.4rem 1.1rem',
            borderRadius: '20px',
            background: 'rgba(0, 243, 255, 0.08)',
            border: '1px solid rgba(0, 243, 255, 0.3)',
            color: 'var(--neon-cyan)',
            fontSize: '0.85rem',
            fontWeight: '600',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginBottom: '1.5rem',
            boxShadow: '0 0 15px var(--neon-cyan-glow)'
          }}
        >
          <Sparkles size={16} />
          Presented by CESA — Department of Computer Engineering
        </div>

        {/* Main CYBER ESCAPE Display Heading using Timetravel font */}
        <h1
          className="glow-cyan font-display"
          style={{
            fontSize: 'clamp(2.8rem, 7vw, 5.2rem)',
            fontWeight: '900',
            letterSpacing: '6px',
            lineHeight: 1.1,
            marginBottom: '1.2rem',
            filter: 'drop-shadow(0 0 25px rgba(0, 243, 255, 0.45))'
          }}
        >
          CYBER ESCAPE
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: 'var(--text-muted)',
            maxWidth: '650px',
            margin: '0 auto 2.8rem auto',
            lineHeight: 1.6
          }}
        >
          A high-stakes 4-layer technical escape competition. Decode algorithms, navigate security grids, decrypt binary data streams, and reconstruct kernel logic to unlock the final riddle.
        </p>

        {/* Single Action Button: START GAME ONLY */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '3rem'
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
              padding: '1rem 3rem',
              fontSize: '1.15rem',
              letterSpacing: '2px',
              boxShadow: '0 0 25px var(--neon-cyan-glow)'
            }}
          >
            <KeyRound size={22} /> START GAME
          </button>
        </div>

        {/* Technical Competition Quick Rules Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            textAlign: 'left'
          }}
        >
          <div className="cyber-card" style={{ padding: '1.2rem' }}>
            <div style={{ color: 'var(--neon-cyan)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginBottom: '0.3rem' }}>
              ROUND 01
            </div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.3rem' }}>THE FIRST BREACH</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>8 MCQs // 30s View + 30s Options</div>
          </div>

          <div className="cyber-card" style={{ padding: '1.2rem' }}>
            <div style={{ color: 'var(--neon-cyan)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginBottom: '0.3rem' }}>
              ROUND 02
            </div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.3rem' }}>GRIDLOCK PROTOCOL</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>2 Technical Crosswords // 5 Mins</div>
          </div>

          <div className="cyber-card" style={{ padding: '1.2rem' }}>
            <div style={{ color: 'var(--neon-cyan)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginBottom: '0.3rem' }}>
              ROUND 03
            </div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.3rem' }}>BINARY CONVERGENCE</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>4 Binary Challenges // ASCII Matrix</div>
          </div>

          <div className="cyber-card" style={{ padding: '1.2rem' }}>
            <div style={{ color: 'var(--neon-cyan)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginBottom: '0.3rem' }}>
              ROUND 04
            </div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.3rem' }}>SYSTEM OVERRIDE</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>C++ / Python / Java Code Fill</div>
          </div>
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
                  placeholder="e.g. CE-DEMO-001 or ACCESS KEY"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  style={{ letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center', fontSize: '1.1rem' }}
                  autoFocus
                />
              </div>

              {/* Demo Hint Helper */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  marginBottom: '1.2rem',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <HelpCircle size={14} /> Team Keys: CE-DEMO-001 to 015 | Admin Key: ADMIN-CYBER-2026
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

