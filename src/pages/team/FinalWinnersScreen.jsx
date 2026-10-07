import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Medal, Sparkles, Award } from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';

export function FinalWinnersScreen({ winners }) {
  useEffect(() => {
    soundEffects.playKeyUnlocked();

    // Trigger celebratory confetti burst
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
      const interval = setInterval(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 2500);

      return () => clearInterval(interval);
    } catch {
      // ignore
    }
  }, []);

  const winnerTeamName = winners?.winner?.team_name || 'TEAM ALPHA';
  const runnerUpTeamName = winners?.runnerUp?.team_name || 'TEAM BETA';

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.5rem',
        maxWidth: '860px',
        margin: '0 auto',
        width: '100%',
        textAlign: 'center'
      }}
    >
      <div className="cyber-bg" />
      <div className="cyber-bg-radial" />

      {/* Top Banner */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.4rem 1.2rem',
          borderRadius: '20px',
          background: 'rgba(0, 255, 136, 0.1)',
          border: '1px solid rgba(0, 255, 136, 0.3)',
          color: 'var(--neon-green)',
          fontSize: '0.85rem',
          fontWeight: '700',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginBottom: '1rem',
          boxShadow: '0 0 15px var(--neon-green-glow)'
        }}
      >
        <Sparkles size={16} /> OFFICIAL RESULTS DECLARED // CESA
      </div>

      <h1
        className="glow-cyan font-display"
        style={{
          fontSize: 'clamp(2.4rem, 6vw, 4rem)',
          letterSpacing: '6px',
          marginBottom: '0.5rem'
        }}
      >
        CYBER ESCAPE 2026
      </h1>

      <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
        Department of Computer Engineering proudly honors the champions of Cyber Escape.
      </p>

      {/* Podium Cards Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          width: '100%',
          marginBottom: '2.5rem'
        }}
      >
        {/* WINNER PODIUM */}
        <div
          className="cyber-card"
          style={{
            padding: '2.5rem 2rem',
            background: 'linear-gradient(135deg, rgba(255, 183, 0, 0.15) 0%, rgba(13, 22, 44, 0.95) 100%)',
            border: '2px solid var(--neon-amber)',
            boxShadow: '0 0 30px var(--neon-amber-glow)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            order: 1
          }}
        >
          <div
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              background: 'rgba(255, 183, 0, 0.15)',
              border: '2px solid var(--neon-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 0 20px var(--neon-amber-glow)'
            }}
          >
            <Trophy size={40} color="var(--neon-amber)" />
          </div>

          <div
            style={{
              fontSize: '0.85rem',
              color: 'var(--neon-amber)',
              fontWeight: '700',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: '0.4rem'
            }}
          >
            CHAMPION // 1ST PLACE
          </div>

          <div
            className="font-display glow-amber"
            style={{
              fontSize: '2.2rem',
              letterSpacing: '3px',
              fontWeight: '900',
              margin: '0.4rem 0'
            }}
          >
            {winnerTeamName}
          </div>

          <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
            WINNER OF CYBER ESCAPE
          </div>
        </div>

        {/* RUNNER-UP PODIUM */}
        <div
          className="cyber-card"
          style={{
            padding: '2.5rem 2rem',
            background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.12) 0%, rgba(13, 22, 44, 0.95) 100%)',
            border: '2px solid var(--neon-cyan)',
            boxShadow: '0 0 25px var(--neon-cyan-glow)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            order: 2
          }}
        >
          <div
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              background: 'rgba(0, 243, 255, 0.15)',
              border: '2px solid var(--neon-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 0 20px var(--neon-cyan-glow)'
            }}
          >
            <Medal size={40} color="var(--neon-cyan)" />
          </div>

          <div
            style={{
              fontSize: '0.85rem',
              color: 'var(--neon-cyan)',
              fontWeight: '700',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: '0.4rem'
            }}
          >
            RUNNER-UP // 2ND PLACE
          </div>

          <div
            className="font-display glow-cyan"
            style={{
              fontSize: '2.2rem',
              letterSpacing: '3px',
              fontWeight: '900',
              margin: '0.4rem 0'
            }}
          >
            {runnerUpTeamName}
          </div>

          <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
            RUNNER-UP OF CYBER ESCAPE
          </div>
        </div>
      </div>

      <div
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          fontSize: '0.9rem'
        }}
      >
        CONGRATULATIONS TO ALL 30 PARTICIPATING TEAMS! // CESA 2026
      </div>
    </div>
  );
}
