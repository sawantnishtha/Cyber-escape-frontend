import React, { useState, useEffect } from 'react';
import { Shield, Volume2, VolumeX, LogOut, Terminal, Users, RotateCcw } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';
import { isSupabaseConfigured } from '../config/supabase';
import { authService } from '../services/authService';

export function CyberNavbar({ currentTeam, currentAdmin, onLogout, onResetDemo }) {
  const [muted, setMuted] = useState(soundEffects.isMuted());

  useEffect(() => {
    soundEffects.initSoundPreference();
    setMuted(soundEffects.isMuted());
  }, []);

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    soundEffects.setMuted(next);
    if (!next) {
      soundEffects.playClick();
    }
  };

  return (
    <header className="cyber-header">
      <div className="cyber-header-brand">
        <div className="cyber-header-logo-icon">
          <Shield className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <div className="cyber-header-title">CYBER ESCAPE</div>
          <div className="cyber-header-sub">CESA — Department of Computer Engineering</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Mode Tag */}
        <div
          style={{
            fontSize: '0.72rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '4px',
            background: isSupabaseConfigured ? 'rgba(0, 255, 136, 0.1)' : 'rgba(0, 243, 255, 0.1)',
            border: `1px solid ${isSupabaseConfigured ? 'rgba(0, 255, 136, 0.3)' : 'rgba(0, 243, 255, 0.3)'}`,
            color: isSupabaseConfigured ? 'var(--neon-green)' : 'var(--neon-cyan)',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
          title={isSupabaseConfigured ? 'Connected to live Supabase project' : 'Running multi-tab demo simulator'}
        >
          <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />
          {isSupabaseConfigured ? 'SUPABASE REALTIME' : 'DEMO SIMULATOR'}
        </div>

        {/* Audio Toggle */}
        <button
          className="cyber-btn"
          style={{ padding: '0.4rem 0.7rem' }}
          onClick={toggleSound}
          title={muted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} color="var(--neon-cyan)" />}
        </button>

        {/* Active Team Badge */}
        {currentTeam && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.8rem',
              background: 'rgba(0, 243, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              fontSize: '0.85rem'
            }}
          >
            <Users size={14} color="var(--neon-cyan)" />
            <span style={{ fontWeight: 600, color: 'var(--neon-cyan)' }}>{currentTeam.team_name}</span>
            <button
              onClick={() => {
                soundEffects.playClick();
                authService.logoutTeam();
                if (onLogout) onLogout();
              }}
              title="Logout Team"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                marginLeft: '0.4rem'
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        )}

        {/* Active Admin Badge */}
        {currentAdmin && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.8rem',
              background: 'rgba(255, 183, 0, 0.08)',
              border: '1px solid rgba(255, 183, 0, 0.3)',
              borderRadius: '6px',
              fontSize: '0.85rem'
            }}
          >
            <Terminal size={14} color="var(--neon-amber)" />
            <span style={{ fontWeight: 600, color: 'var(--neon-amber)' }}>ADMIN CENTER</span>
            {onResetDemo && (
              <button
                onClick={async () => {
                  soundEffects.playClick();
                  if (confirm('RESTART EVENT? Reset all teams and game session to Round 1 Lobby?')) {
                    await onResetDemo();
                  }
                }}
                title="Reset Game Simulation"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: '0.4rem'
                }}
              >
                <RotateCcw size={14} />
              </button>
            )}
            <button
              onClick={() => {
                soundEffects.playClick();
                authService.logoutAdmin();
                if (onLogout) onLogout();
              }}
              title="Logout Admin"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                marginLeft: '0.4rem'
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
