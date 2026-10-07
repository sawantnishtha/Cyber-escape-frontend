import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

export function ConfirmModal({ isOpen, title, message, confirmText = 'Confirm', danger = false, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="cyber-modal-overlay">
      <div className="cyber-modal-content" style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={22} color={danger ? 'var(--neon-red)' : 'var(--neon-amber)'} />
            <h3
              style={{
                fontSize: '1.1rem',
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                letterSpacing: '0.02em',
                color: danger ? 'var(--neon-red)' : 'var(--neon-amber)',
                textShadow: danger ? '0 0 12px var(--neon-red-glow)' : '0 0 12px var(--neon-amber-glow)',
                margin: 0
              }}
            >
              {title}
            </h3>
          </div>
          <button
            onClick={() => {
              soundEffects.playClick();
              onCancel();
            }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ color: 'var(--text-main)', fontSize: '0.92rem', marginBottom: '1.8rem', lineHeight: '1.55', fontFamily: "var(--font-body)" }}>
          {message}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
          <button
            className="cyber-btn"
            onClick={() => {
              soundEffects.playClick();
              onCancel();
            }}
          >
            CANCEL
          </button>
          <button
            className={`cyber-btn ${danger ? 'cyber-btn-danger' : 'cyber-btn-primary'}`}
            onClick={() => {
              soundEffects.playClick();
              onConfirm();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
