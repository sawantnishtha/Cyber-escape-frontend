import React from 'react';
import { LogOut, RotateCcw } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';
import { authService } from '../services/authService';

export function CyberNavbar({ currentTeam, currentAdmin, onLogout, onResetDemo }) {
  // If neither team nor admin is logged in (i.e. Landing Page), do not render any appbar
  if (!currentTeam && !currentAdmin) {
    return null;
  }

  return (
    <header className="cyber-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Active Team Badge: SQUAD: <TEAM NAME> */}
        {currentTeam && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.42rem 1.1rem',
              background: 'rgba(0, 240, 255, 0.06)',
              border: '1px solid rgba(0, 240, 255, 0.35)',
              borderRadius: '6px',
              boxShadow: '0 0 14px rgba(0, 240, 255, 0.12)'
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#00ff88',
                boxShadow: '0 0 8px #00ff88',
                display: 'inline-block'
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.88rem',
                fontWeight: '700',
                letterSpacing: '1.8px',
                color: 'var(--neon-cyan)',
                textTransform: 'uppercase'
              }}
            >
              SQUAD: {currentTeam.team_name}
            </span>
          </div>
        )}

        {/* Team Logout Button */}
        {currentTeam && (
          <button
            onClick={() => {
              soundEffects.playClick();
              authService.logoutTeam();
              if (onLogout) onLogout();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.42rem 1rem',
              background: 'rgba(255, 42, 95, 0.12)',
              border: '1px solid rgba(255, 42, 95, 0.45)',
              borderRadius: '6px',
              color: '#ff3b68',
              fontFamily: 'var(--font-display)',
              fontSize: '0.82rem',
              fontWeight: '700',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 0 10px rgba(255, 42, 95, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 42, 95, 0.25)';
              e.currentTarget.style.borderColor = 'var(--neon-red)';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(255, 42, 95, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 42, 95, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(255, 42, 95, 0.45)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 42, 95, 0.2)';
            }}
            title="Logout Team"
          >
            <LogOut size={14} /> LOGOUT
          </button>
        )}

        {/* Active Admin Badge */}
        {currentAdmin && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.42rem 1.1rem',
              background: 'rgba(255, 183, 0, 0.08)',
              border: '1px solid rgba(255, 183, 0, 0.35)',
              borderRadius: '6px',
              boxShadow: '0 0 14px rgba(255, 183, 0, 0.12)'
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--neon-amber)',
                boxShadow: '0 0 8px var(--neon-amber)',
                display: 'inline-block'
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.88rem',
                fontWeight: '700',
                letterSpacing: '1.8px',
                color: 'var(--neon-amber)',
                textTransform: 'uppercase'
              }}
            >
              ADMIN: COMMAND CENTER
            </span>
          </div>
        )}

        {/* Admin Reset Button */}
        {currentAdmin && onResetDemo && (
          <button
            onClick={async () => {
              soundEffects.playClick();
              if (confirm('RESTART EVENT? Reset all teams and game session to Round 1 Lobby?')) {
                await onResetDemo();
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.42rem 0.85rem',
              background: 'rgba(255, 183, 0, 0.1)',
              border: '1px solid rgba(255, 183, 0, 0.4)',
              borderRadius: '6px',
              color: 'var(--neon-amber)',
              fontFamily: 'var(--font-display)',
              fontSize: '0.8rem',
              fontWeight: '700',
              letterSpacing: '1px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Reset Game Simulation"
          >
            <RotateCcw size={14} /> RESET
          </button>
        )}

        {/* Admin Logout Button */}
        {currentAdmin && (
          <button
            onClick={() => {
              soundEffects.playClick();
              authService.logoutAdmin();
              if (onLogout) onLogout();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.42rem 1rem',
              background: 'rgba(255, 42, 95, 0.12)',
              border: '1px solid rgba(255, 42, 95, 0.45)',
              borderRadius: '6px',
              color: '#ff3b68',
              fontFamily: 'var(--font-display)',
              fontSize: '0.82rem',
              fontWeight: '700',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 0 10px rgba(255, 42, 95, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 42, 95, 0.25)';
              e.currentTarget.style.borderColor = 'var(--neon-red)';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(255, 42, 95, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 42, 95, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(255, 42, 95, 0.45)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 42, 95, 0.2)';
            }}
            title="Logout Admin"
          >
            <LogOut size={14} /> LOGOUT
          </button>
        )}
      </div>
    </header>
  );
}
