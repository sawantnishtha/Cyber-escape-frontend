import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, AlertTriangle, Lock, XOctagon, RotateCcw, LogOut } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';
import { adminService } from '../services/adminService';
import { authService } from '../services/authService';
import { supabase, isSupabaseConfigured } from '../config/supabase';

const MAX_WARNINGS = 2; // 2 warnings are valid, on 3rd infraction team is disqualified!

export function ProctoringGuard({ team, children, isActive = true }) {
  const [strikes, setStrikes] = useState(() => {
    if (!team?.id) return 0;
    const saved = localStorage.getItem(`cyber_escape_strikes_${team.id}`);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [activeWarning, setActiveWarning] = useState(null); // { strikeNum, reason }
  const [isDisqualified, setIsDisqualified] = useState(false);
  const lastInfractionTimeRef = useRef(0);

  // Check if team is already eliminated/disqualified in state or strikes >= 3
  useEffect(() => {
    if (strikes >= 3 || team?.status === 'eliminated') {
      setIsDisqualified(true);
    } else {
      setIsDisqualified(false);
    }
  }, [strikes, team?.status]);

  // Realtime BroadcastChannel listener for Admin Reset
  useEffect(() => {
    let bc;
    try {
      bc = new BroadcastChannel('cyber_escape_sync');
      bc.onmessage = (event) => {
        if (
          event.data?.type === 'EVENT_RESTARTED' ||
          (event.data?.type === 'STATE_CHANGED' && event.data?.payload?.state === 'LANDING')
        ) {
          setStrikes(0);
          setIsDisqualified(false);
          setActiveWarning(null);
          if (team?.id) {
            localStorage.removeItem(`cyber_escape_strikes_${team.id}`);
          }
        }
      };
    } catch (e) {
      // ignore
    }

    return () => {
      if (bc) bc.close();
    };
  }, [team?.id]);

  // Sync strikes count to localStorage
  const recordStrike = async (reason) => {
    const now = Date.now();
    // Debounce rapid multiple events (e.g. blur then visibilitychange within 2 seconds)
    if (now - lastInfractionTimeRef.current < 2000) {
      return;
    }
    lastInfractionTimeRef.current = now;

    const nextStrikes = strikes + 1;
    setStrikes(nextStrikes);
    if (team?.id) {
      localStorage.setItem(`cyber_escape_strikes_${team.id}`, nextStrikes.toString());
    }

    soundEffects.playAccessDenied();

    // Log strike in Supabase / audit log
    if (isSupabaseConfigured && team?.id) {
      try {
        await supabase.from('audit_logs').insert([
          {
            admin_id: 'SYSTEM_PROCTOR',
            action: nextStrikes >= 3 ? 'TEAM_DISQUALIFIED_STRIKE_3' : `PROCTOR_WARNING_STRIKE_${nextStrikes}`,
            target_team_id: team.id,
            metadata: { strike: nextStrikes, reason, timestamp: new Date().toISOString() }
          }
        ]);
      } catch (err) {
        console.warn('Proctoring log error:', err);
      }
    }

    if (nextStrikes >= 3) {
      // 3rd Warning = IMMEDIATE DISQUALIFICATION!
      setIsDisqualified(true);
      setActiveWarning(null);
      if (team?.id) {
        try {
          await adminService.updateTeamStatus(team.id, 'eliminated');
        } catch (err) {
          console.warn('Error setting eliminated status:', err);
        }
      }
    } else {
      // Warning 1 or 2
      setActiveWarning({ strikeNum: nextStrikes, reason });
    }
  };

  // Window Event Listeners for Tab Switching
  useEffect(() => {
    if (!isActive || !team?.id || isDisqualified) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !isDisqualified) {
        recordStrike('TAB_SWITCH (NAVIGATED AWAY / MINIMIZED)');
      }
    };

    const handleWindowBlur = () => {
      if (!isDisqualified) {
        recordStrike('WINDOW_UNFOCUS (SWITCHED APPLICATION / ALT+TAB)');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isActive, team?.id, strikes, isDisqualified]);

  // Helper to acknowledge warning and resume
  const handleAcknowledgeWarning = () => {
    setActiveWarning(null);
    soundEffects.playClick();
  };

  // Handler to clear strikes and restore team for testing
  const handleResetTesting = async () => {
    soundEffects.playClick();
    if (team?.id) {
      localStorage.removeItem(`cyber_escape_strikes_${team.id}`);
      try {
        await adminService.updateTeamStatus(team.id, 'active', 1);
      } catch (e) {
        console.warn('Failed to update status:', e);
      }
    }
    setStrikes(0);
    setIsDisqualified(false);
    setActiveWarning(null);
    window.location.reload();
  };

  // Handler to logout and return to landing page
  const handleLogoutAndReturn = () => {
    soundEffects.playClick();
    if (team?.id) {
      localStorage.removeItem(`cyber_escape_strikes_${team.id}`);
      adminService.updateTeamStatus(team.id, 'active', 1).catch(() => {});
    }
    authService.logoutTeam();
    window.location.reload();
  };

  // 1. PERMANENT DISQUALIFICATION SCREEN
  if (isDisqualified) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
          background: 'radial-gradient(circle at center, #1f0408 0%, #080102 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-main)',
          overflowY: 'auto'
        }}
      >
        <div
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'rgba(255, 42, 95, 0.15)',
            border: '3px solid var(--neon-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 35px var(--neon-red-glow)',
            marginBottom: '1.5rem',
            animation: 'pulse 1.8s infinite'
          }}
        >
          <XOctagon size={48} color="var(--neon-red)" />
        </div>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            color: 'var(--neon-red)',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            marginBottom: '0.6rem'
          }}
        >
          PROTOCOL BREACH // STRIKE 3/3 REACHED
        </div>

        <h1
          className="glow-red font-display"
          style={{
            fontSize: '2.5rem',
            letterSpacing: '3px',
            color: 'var(--neon-red)',
            marginBottom: '1rem'
          }}
        >
          TEAM DISQUALIFIED
        </h1>

        <div
          style={{
            maxWidth: '620px',
            background: 'rgba(15, 20, 35, 0.85)',
            border: '1px solid var(--border-error)',
            borderRadius: '8px',
            padding: '1.8rem',
            marginBottom: '1.8rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.92rem',
            lineHeight: '1.6',
            color: 'var(--text-muted)',
            textAlign: 'left'
          }}
        >
          <div style={{ color: 'var(--neon-red)', fontWeight: '700', marginBottom: '0.5rem' }}>
            SECURITY AUDIT LOG: MAXIMUM ALLOWED PROCTORING INFRACTIONS EXCEEDED
          </div>
          <p style={{ margin: '0 0 0.8rem 0' }}>
            Team: <strong style={{ color: '#fff' }}>{team?.team_name || team?.name || 'UNKNOWN'}</strong> (ID: {team?.id?.slice(0, 8)})
          </p>
          <p style={{ margin: '0 0 0.8rem 0' }}>
            Disqualification Reason: Multiple full-screen exits (ESC key) or unauthorized application/tab changes detected during an active competition round.
          </p>
          <div
            style={{
              padding: '0.75rem',
              background: 'rgba(255, 42, 95, 0.08)',
              borderLeft: '3px solid var(--neon-red)',
              fontSize: '0.85rem',
              color: 'var(--text-main)'
            }}
          >
            Central Command has locked this workstation session. For testing or authorized restart, use the controls below.
          </div>
        </div>

        {/* Action Controls for Testing & Session Recovery */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.8rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleResetTesting}
            className="cyber-btn cyber-btn-primary"
            style={{ padding: '0.85rem 1.8rem', fontSize: '0.92rem' }}
          >
            <RotateCcw size={16} /> RESET & RE-ENTER FROM BEGINNING
          </button>

          <button
            onClick={handleLogoutAndReturn}
            className="cyber-btn"
            style={{ padding: '0.85rem 1.8rem', fontSize: '0.92rem', borderColor: 'var(--border-subtle)' }}
          >
            <LogOut size={16} /> LOGOUT & RETURN TO LOGIN
          </button>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          CYBER ESCAPE SECURE PROCTORING ENGINE v2.6 // TERMINATED
        </div>
      </div>
    );
  }

  // 2. WARNING OVERLAY (Strike 1 or Strike 2)
  return (
    <>
      {activeWarning && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99998,
            background: 'rgba(4, 7, 16, 0.94)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <div
            className="cyber-modal-content"
            style={{
              maxWidth: '540px',
              border: `2px solid ${activeWarning.strikeNum === 2 ? 'var(--neon-red)' : 'var(--neon-amber)'}`,
              boxShadow: activeWarning.strikeNum === 2 ? '0 0 35px var(--neon-red-glow)' : '0 0 30px rgba(255, 184, 0, 0.3)',
              textAlign: 'center',
              animation: 'fadeIn 0.25s ease'
            }}
          >
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: activeWarning.strikeNum === 2 ? 'rgba(255, 42, 95, 0.15)' : 'rgba(255, 184, 0, 0.15)',
                border: `2px solid ${activeWarning.strikeNum === 2 ? 'var(--neon-red)' : 'var(--neon-amber)'}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.2rem'
              }}
            >
              {activeWarning.strikeNum === 2 ? (
                <ShieldAlert size={36} color="var(--neon-red)" />
              ) : (
                <AlertTriangle size={36} color="var(--neon-amber)" />
              )}
            </div>

            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                letterSpacing: '2px',
                color: activeWarning.strikeNum === 2 ? 'var(--neon-red)' : 'var(--neon-amber)',
                marginBottom: '0.4rem',
                textTransform: 'uppercase'
              }}
            >
              SECURITY WARNING // STRIKE {activeWarning.strikeNum} OF {MAX_WARNINGS + 1}
            </div>

            <h3
              className={activeWarning.strikeNum === 2 ? 'glow-red font-display' : 'glow-amber font-display'}
              style={{ fontSize: '1.6rem', marginBottom: '1rem', letterSpacing: '1px' }}
            >
              {activeWarning.strikeNum === 2 ? 'FINAL WARNING: IMMINENT DISQUALIFICATION' : 'PROCTORING PROTOCOL INFRACTION'}
            </h3>

            <div
              style={{
                background: 'rgba(10, 16, 32, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '1rem',
                marginBottom: '1.5rem',
                textAlign: 'left',
                fontSize: '0.88rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)'
              }}
            >
              <div style={{ color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                <strong>Detected Violation:</strong> <span style={{ color: 'var(--neon-cyan)' }}>{activeWarning.reason}</span>
              </div>
              <p style={{ margin: 0, lineHeight: '1.5' }}>
                {activeWarning.strikeNum === 1
                  ? 'Switching tabs or navigating away during the competition is strictly prohibited. You have 1 warning remaining.'
                  : 'CRITICAL ALERT: This is your 2nd and FINAL warning. Any subsequent tab change or application switch will result in IMMEDIATE DISQUALIFICATION.'}
              </p>
            </div>

            <button
              onClick={handleAcknowledgeWarning}
              className={`cyber-btn ${activeWarning.strikeNum === 2 ? 'cyber-btn-danger' : 'cyber-btn-primary'}`}
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', justifyContent: 'center' }}
            >
              <ShieldAlert size={18} /> ACKNOWLEDGE WARNING & RESUME
            </button>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
