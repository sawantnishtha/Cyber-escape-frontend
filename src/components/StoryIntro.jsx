import React, { useState, useEffect } from 'react';
import { ShieldAlert, Terminal, ChevronRight, SkipForward } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

const STORY_LINES = [
  { text: 'SYSTEM ALERT...', style: 'glow-red', delay: 1200 },
  { text: 'Something has gone wrong.', style: '', delay: 1400 },
  { text: 'A secure core system has been breached.', style: 'glow-amber', delay: 1500 },
  { text: 'The entire institutional network is locked down.', style: '', delay: 1500 },
  { text: 'Four defensive security layers remain active.', style: 'glow-cyan', delay: 1600 },
  { text: 'Only those who can decode, think, debug, and connect the clues can escape.', style: '', delay: 2000 },
  { text: 'Your team has been selected for extraction.', style: 'glow-green', delay: 1800 },
  { text: 'The system is waiting...', style: '', delay: 1500 },
  { text: 'CYBER ESCAPE', style: 'glow-cyan font-display text-4xl', delay: 2200 }
];

export function StoryIntro({ onComplete }) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState([STORY_LINES[0]]);

  useEffect(() => {
    soundEffects.playTyping();
    if (currentLineIndex < STORY_LINES.length - 1) {
      const timer = setTimeout(() => {
        const nextIndex = currentLineIndex + 1;
        setCurrentLineIndex(nextIndex);
        setVisibleLines((prev) => [...prev, STORY_LINES[nextIndex]]);
        soundEffects.playTyping();
      }, STORY_LINES[currentLineIndex].delay);

      return () => clearTimeout(timer);
    } else {
      // Completed all lines, hold for a moment then transition
      const endTimer = setTimeout(() => {
        onComplete();
      }, 2500);
      return () => clearTimeout(endTimer);
    }
  }, [currentLineIndex, onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#040711',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem'
      }}
    >
      <div className="cyber-bg" />
      <div className="cyber-bg-radial" />

      {/* Skip button in corner */}
      <button
        onClick={() => {
          soundEffects.playClick();
          onComplete();
        }}
        className="cyber-btn"
        style={{
          position: 'absolute',
          top: '2rem',
          right: '2rem',
          fontSize: '0.8rem',
          padding: '0.4rem 0.9rem'
        }}
      >
        <SkipForward size={14} /> SKIP INTRO
      </button>

      {/* Terminal Story Box */}
      <div
        className="cyber-card"
        style={{
          width: '100%',
          maxWidth: '720px',
          padding: '2.5rem',
          background: 'rgba(8, 14, 28, 0.92)',
          border: '1px solid rgba(0, 243, 255, 0.25)',
          minHeight: '420px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        {/* Terminal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.8rem',
            marginBottom: '1.5rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: 'var(--neon-cyan)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={16} />
            <span>SECURE_BOOT_SEQUENCE // CESA-ENG</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={14} color="var(--neon-amber)" />
            <span style={{ color: 'var(--neon-amber)' }}>LEVEL-4 LOCKDOWN</span>
          </div>
        </div>

        {/* Narrative Flow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          {visibleLines.map((line, index) => {
            const isLast = index === visibleLines.length - 1;
            return (
              <div
                key={index}
                className={line.style}
                style={{
                  fontSize: index === STORY_LINES.length - 1 ? '2.4rem' : '1.15rem',
                  fontWeight: index === STORY_LINES.length - 1 ? '700' : '500',
                  opacity: 1,
                  animation: 'fadeIn 0.4s ease-out',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  letterSpacing: index === STORY_LINES.length - 1 ? '4px' : '0.5px'
                }}
              >
                {index !== STORY_LINES.length - 1 && (
                  <span style={{ color: 'var(--neon-cyan)', opacity: 0.6, fontSize: '0.9rem' }}>&gt;</span>
                )}
                <span>{line.text}</span>
                {isLast && index < STORY_LINES.length - 1 && (
                  <span
                    className="pulse-dot"
                    style={{
                      width: '8px',
                      height: '14px',
                      borderRadius: '2px',
                      background: 'var(--neon-cyan)',
                      display: 'inline-block'
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Footer */}
        <div
          style={{
            marginTop: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-dim)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <span>PROGRESS: {Math.round(((currentLineIndex + 1) / STORY_LINES.length) * 100)}%</span>
          {currentLineIndex === STORY_LINES.length - 1 ? (
            <button
              onClick={() => {
                soundEffects.playClick();
                onComplete();
              }}
              className="cyber-btn cyber-btn-primary"
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            >
              ENTER SYSTEM <ChevronRight size={16} />
            </button>
          ) : (
            <span>DECRYPTING LOGS...</span>
          )}
        </div>
      </div>
    </div>
  );
}
