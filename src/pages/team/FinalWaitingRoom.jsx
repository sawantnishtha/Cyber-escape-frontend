import React from 'react';
import { ShieldCheck, Clock, Award, Users } from 'lucide-react';

export function FinalWaitingRoom({ team, gameSession }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.5rem',
        maxWidth: '740px',
        margin: '0 auto',
        width: '100%'
      }}
    >
      <div className="cyber-bg" />
      <div className="cyber-bg-radial" />

      <div
        className="cyber-card"
        style={{
          width: '100%',
          padding: '3rem 2.2rem',
          textAlign: 'center',
          background: 'rgba(9, 15, 30, 0.92)'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(0, 255, 136, 0.1)',
            border: '2px solid var(--neon-green)',
            boxShadow: '0 0 20px var(--neon-green-glow)',
            marginBottom: '1.2rem'
          }}
        >
          <ShieldCheck size={36} color="var(--neon-green)" />
        </div>

        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--neon-green)',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '0.5rem'
          }}
        >
          ESCAPE PROTOCOL EXECUTED
        </div>

        <h1
          className="glow-green font-display"
          style={{
            fontSize: 'clamp(2rem, 5vw, 2.8rem)',
            letterSpacing: '4px',
            marginBottom: '0.8rem'
          }}
        >
          FINAL ANSWER VERIFIED
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2rem', lineHeight: '1.6' }}>
          Outstanding work, <strong style={{ color: '#fff' }}>{team.team_name}</strong>! Your final answer has been received and timestamped on the server clock.
        </p>

        {/* Timestamp card */}
        <div
          style={{
            background: 'rgba(6, 11, 22, 0.85)',
            border: '1px solid rgba(0, 243, 255, 0.2)',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--neon-cyan)', marginBottom: '0.5rem' }}>
            <Clock size={16} />
            <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>OFFICIAL SERVER SUBMISSION ORDER</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Submission timestamp logged with millisecond accuracy for fair ranking.
          </div>
        </div>

        {/* Live waiting status */}
        <div
          style={{
            padding: '1.2rem',
            borderRadius: '8px',
            background: 'rgba(255, 183, 0, 0.08)',
            border: '1px solid rgba(255, 183, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--neon-amber)' }}>
            <span className="pulse-dot" style={{ background: 'var(--neon-amber)' }} />
            <span style={{ fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
              WAITING FOR ADMIN FINAL WINNER DECLARATION
            </span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            The official Winner & Runner-up podium will automatically appear once authorized by CESA organizers.
          </div>
        </div>
      </div>
    </div>
  );
}
