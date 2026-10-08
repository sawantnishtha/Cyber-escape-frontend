import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Lock, Unlock, ArrowRight, X } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';
import { codeService } from '../services/codeService';

export function CodeRevealModal({
  isOpen,
  onClose,
  teamId,
  roundNumber,
  unlockedCodeLetters = [], // e.g. ['C', 'Y', 'B', 'R']
  totalLettersNeeded = 4,
  onWordUnlocked,
  onRoundComplete
}) {
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  if (!isOpen) return null;

  const isCodeFullyUnlocked = unlockedCodeLetters.length >= totalLettersNeeded;

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    const cleanInput = inputCode.trim().toUpperCase();

    // Check if team entered the literal scrambled sequence
    const scrambledSequences = {
      1: 'ONED',
      2: 'SHAH',
      3: 'CLKO',
      4: 'OPTR'
    };

    const targetKeywords = {
      1: 'NODE',
      2: 'HASH',
      3: 'LOCK',
      4: 'PORT'
    };

    if (scrambledSequences[roundNumber] && cleanInput === scrambledSequences[roundNumber]) {
      soundEffects.playAccessDenied();
      setErrorMsg(`⚠️ '${cleanInput}' is the scrambled sequence! Unscramble the letters to enter the valid English tech keyword (e.g. ${targetKeywords[roundNumber] || 'PORT'}).`);
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');

    try {
      const res = await codeService.verifyCode(teamId, roundNumber, cleanInput);
      if (res && res.valid) {
        soundEffects.playKeyUnlocked();
        setIsVerified(true);
        if (onWordUnlocked) {
          onWordUnlocked(res.word);
        }
      } else {
        soundEffects.playAccessDenied();
        setErrorMsg(res?.error || `Invalid key sequence. Rearrange the 4 unlocked letters into the correct English tech keyword.`);
      }
    } catch (err) {
      soundEffects.playAccessDenied();
      setErrorMsg('Verification failed. Please retry.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="cyber-modal-overlay">
      <div className="cyber-modal-content" style={{ maxWidth: '580px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '1rem',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <KeyRound size={20} color="var(--neon-cyan)" />
            <h3 className="cyber-title glow-cyan" style={{ fontSize: '1.15rem' }}>
              SECURITY KEY OVERRIDE // ROUND {roundNumber}
            </h3>
          </div>
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {!isVerified ? (
          <div>
            {/* Visual Unlocked Letters Display */}
            <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
              <div
                style={{
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  color: isCodeFullyUnlocked ? 'var(--neon-green)' : 'var(--neon-amber)',
                  letterSpacing: '1px',
                  marginBottom: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                {isCodeFullyUnlocked ? (
                  <>
                    <Unlock size={14} /> COMPLETE 4-LETTER ANAGRAM ASSEMBLED
                  </>
                ) : (
                  <>
                    <Lock size={14} /> DECRYPTING CODE SEGMENTS ({unlockedCodeLetters.length}/{totalLettersNeeded})
                  </>
                )}
              </div>

              {/* Anagram Shuffled Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 183, 0, 0.12)',
                  border: '1px solid rgba(255, 183, 0, 0.4)',
                  color: 'var(--neon-amber)',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '1rem',
                  letterSpacing: '0.5px'
                }}
              >
                🔀 SHUFFLED KEY: UNSCRAMBLE LETTERS TO PASS
              </div>

              {/* Character blocks */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                {Array.from({ length: totalLettersNeeded }).map((_, idx) => {
                  const char = unlockedCodeLetters[idx];
                  const hasChar = Boolean(char);
                  return (
                    <div
                      key={idx}
                      style={{
                        width: '56px',
                        height: '64px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: hasChar ? 'rgba(0, 255, 136, 0.12)' : 'rgba(10, 16, 32, 0.9)',
                        border: `2px solid ${hasChar ? 'var(--neon-green)' : 'var(--border-subtle)'}`,
                        borderRadius: '8px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1.9rem',
                        fontWeight: '700',
                        color: hasChar ? 'var(--neon-green)' : 'var(--text-dim)',
                        boxShadow: hasChar ? '0 0 14px var(--neon-green-glow)' : 'none',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {hasChar ? char : '?'}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleVerify}>
              <div style={{ marginBottom: '1.2rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '0.5rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  ENTER UNSCRAMBLED 4-LETTER KEYWORD
                </label>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <input
                    type="text"
                    className="cyber-input"
                    placeholder="ENTER UNSCRAMBLED WORD"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    style={{ letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700', textAlign: 'center' }}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="cyber-btn cyber-btn-primary"
                    disabled={isVerifying || !inputCode.trim()}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {isVerifying ? 'VERIFYING...' : 'VERIFY KEY'}
                  </button>
                </div>
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

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    onClose();
                    if (onRoundComplete) {
                      onRoundComplete();
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    fontSize: '0.82rem',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  Proceed to evaluation waiting room without code &rarr;
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Submission Confirmed - Transition to Waiting Room */
          <div style={{ textAlign: 'center', padding: '1.5rem 0', animation: 'fadeIn 0.4s ease-out' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(0, 255, 136, 0.12)',
                border: '2px solid var(--neon-green)',
                boxShadow: '0 0 25px var(--neon-green-glow)',
                marginBottom: '1.2rem'
              }}
            >
              <ShieldCheck size={36} color="var(--neon-green)" />
            </div>

            <h3 className="glow-green font-display" style={{ fontSize: '1.6rem', letterSpacing: '2px', marginBottom: '0.6rem' }}>
              SECURITY KEY VERIFIED!
            </h3>

            <div style={{ fontSize: '0.9rem', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              ROUND 0{roundNumber} SUBMISSION COMPLETED
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              Your round submission and security key have been verified and locked with Central Command. You are now transitioning to the evaluation waiting room.
            </p>

            <button
              onClick={() => {
                soundEffects.playClick();
                onClose();
                if (onRoundComplete) {
                  onRoundComplete();
                }
              }}
              className="cyber-btn cyber-btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '1rem',
                justifyContent: 'center',
                fontWeight: '700'
              }}
            >
              PROCEED TO WAITING ROOM <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
