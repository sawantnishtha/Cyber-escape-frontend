import React, { useState } from 'react';
import { HelpCircle, Sparkles, Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';
import { codeService } from '../../services/codeService';
import { GAME_CONFIG } from '../../constants/gameConfig';
import { getTeamRiddleIndex } from '../../utils/shuffleUtils';

export function FinalRiddlePage({ team, onFinalAnswerAccepted }) {
  // Determine assigned riddle for this squad (Internet or A Map)
  const riddleIndex = getTeamRiddleIndex(team?.team_key_hash || team?.id || '');
  const assignedRiddle =
    (GAME_CONFIG.FINAL_CHALLENGE.RIDDLES && GAME_CONFIG.FINAL_CHALLENGE.RIDDLES[riddleIndex]) ||
    GAME_CONFIG.FINAL_CHALLENGE.RIDDLES?.[0] || {
      question: GAME_CONFIG.FINAL_CHALLENGE.RIDDLE_TEXT,
      answer: 'INTERNET',
      acceptedAnswers: ['INTERNET', 'THE INTERNET']
    };

  const riddleStatement =
    assignedRiddle?.question || assignedRiddle?.riddle || GAME_CONFIG.FINAL_CHALLENGE.RIDDLE_TEXT;
  const acceptedAnswersList =
    assignedRiddle?.acceptedAnswers ||
    assignedRiddle?.answers ||
    [assignedRiddle?.answer, 'INTERNET', 'A MAP'].filter(Boolean);

  const [finalAnswer, setFinalAnswer] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(GAME_CONFIG.FINAL_CHALLENGE.MAX_ATTEMPTS || 2);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitFinal = async (e) => {
    if (e) e.preventDefault();
    if (!finalAnswer.trim() || attemptsRemaining <= 0 || isSubmitting || feedback === 'correct') return;

    setIsSubmitting(true);
    soundEffects.playClick();

    const normalized = finalAnswer.trim().toUpperCase().replace(/\s+/g, ' ');
    const acceptedSet = (acceptedAnswersList || []).map((a) => String(a).trim().toUpperCase());

    // Valid answers set for both Master Riddles (Internet & A Map)
    const allValid = new Set([
      ...acceptedSet,
      'INTERNET',
      'THE INTERNET',
      'A MAP',
      'MAP',
      'THE MAP',
      'CODE'
    ]);

    const localMatch = allValid.has(normalized) || [...allValid].some((a) => normalized.includes(a));

    try {
      const res = await codeService.submitFinalAnswer(team?.id, finalAnswer.trim());
      if ((res && res.is_correct) || localMatch) {
        soundEffects.playAccessGranted();
        setFeedback('correct');
        setTimeout(() => {
          if (onFinalAnswerAccepted) {
            onFinalAnswerAccepted();
          }
        }, 1200);
      } else {
        soundEffects.playAccessDenied();
        setFeedback('wrong');
        setAttemptsRemaining(res?.attempts_remaining ?? Math.max(0, attemptsRemaining - 1));
      }
    } catch (err) {
      console.error('Final answer submission error:', err);
      if (localMatch) {
        soundEffects.playAccessGranted();
        setFeedback('correct');
        setTimeout(() => {
          if (onFinalAnswerAccepted) {
            onFinalAnswerAccepted();
          }
        }, 1200);
      } else {
        soundEffects.playAccessDenied();
        setFeedback('wrong');
        setAttemptsRemaining((prev) => Math.max(0, prev - 1));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        maxWidth: '920px',
        margin: '0 auto',
        width: '100%',
        minHeight: 'calc(100vh - 70px)'
      }}
    >
      <div className="cyber-bg" />
      <div className="cyber-bg-radial" />

      {/* Main Cyber Riddle Panel */}
      <div
        className="cyber-card"
        style={{
          width: '100%',
          padding: 'clamp(1.8rem, 3.5vw, 3rem)',
          background: 'rgba(7, 13, 27, 0.96)',
          border: '2px solid var(--neon-cyan)',
          boxShadow: '0 0 35px rgba(0, 243, 255, 0.25), inset 0 0 30px rgba(0, 0, 0, 0.7)',
          borderRadius: '12px',
          textAlign: 'center',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Top Header Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 1.3rem',
            borderRadius: '4px',
            background: 'rgba(0, 243, 255, 0.1)',
            border: '1px solid rgba(0, 243, 255, 0.4)',
            color: 'var(--neon-cyan)',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '1rem'
          }}
        >
          <Sparkles size={14} /> CYBER ESCAPE // MASTER DEFENSE PROTOCOL
        </div>

        <h1
          className="font-display glow-cyan"
          style={{
            fontSize: 'clamp(2rem, 4.5vw, 3rem)',
            letterSpacing: '4px',
            margin: '0.2rem 0 0.8rem 0',
            color: '#fff',
            textTransform: 'uppercase'
          }}
        >
          THE FINAL RIDDLE
        </h1>

        <div
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.92rem',
            marginBottom: '2rem',
            fontFamily: 'var(--font-mono)'
          }}
        >
          FINAL CHALLENGE &bull; SQUAD: <strong style={{ color: 'var(--neon-cyan)' }}>{team?.team_name || 'AGENT'}</strong> &bull; SOLVE THE RIDDLE TO WIN
        </div>

        {/* Riddle Statement Box */}
        <div
          style={{
            background: 'rgba(10, 18, 38, 0.92)',
            border: '1px solid rgba(0, 243, 255, 0.4)',
            borderRadius: '10px',
            padding: '2.2rem 2.4rem',
            marginBottom: '2.5rem',
            boxShadow: 'inset 0 0 24px rgba(0, 0, 0, 0.7)'
          }}
        >
          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--neon-cyan)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <HelpCircle size={16} /> MASTER RIDDLE STATEMENT
          </div>

          <h2
            style={{
              fontSize: 'clamp(1.25rem, 2.8vw, 1.65rem)',
              fontWeight: '600',
              color: '#ffffff',
              lineHeight: 1.8,
              margin: '0',
              textTransform: 'none',
              letterSpacing: 'normal',
              whiteSpace: 'pre-line',
              textShadow: '0 0 20px rgba(255, 255, 255, 0.35)'
            }}
          >
            &ldquo;{riddleStatement}&rdquo;
          </h2>
        </div>

        {/* Answer Submission Form */}
        <form onSubmit={handleSubmitFinal} style={{ maxWidth: '520px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1.2rem' }}>
            <input
              type="text"
              className="cyber-input"
              placeholder="ENTER FINAL WORD"
              value={finalAnswer}
              onChange={(e) => setFinalAnswer(e.target.value.toUpperCase())}
              disabled={feedback === 'correct' || attemptsRemaining <= 0 || isSubmitting}
              style={{
                fontSize: '1.35rem',
                fontWeight: '800',
                textAlign: 'center',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                padding: '1rem',
                border: '2px solid rgba(0, 243, 255, 0.5)',
                background: 'rgba(5, 10, 24, 0.9)'
              }}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!finalAnswer.trim() || attemptsRemaining <= 0 || isSubmitting || feedback === 'correct'}
            className="cyber-btn cyber-btn-primary"
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              fontSize: '1.05rem',
              fontWeight: '800',
              letterSpacing: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem'
            }}
          >
            {isSubmitting ? (
              'VERIFYING CIPHER...'
            ) : (
              <>
                <Send size={18} /> SUBMIT FINAL ESCAPE ANSWER
              </>
            )}
          </button>
        </form>

        {/* Feedback & Attempts Counter */}
        <div style={{ marginTop: '1.8rem', minHeight: '36px' }}>
          {feedback === 'correct' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem 1.4rem',
                borderRadius: '6px',
                background: 'rgba(0, 255, 136, 0.15)',
                border: '1px solid var(--neon-green)',
                color: 'var(--neon-green)',
                fontWeight: '800',
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem'
              }}
            >
              <CheckCircle2 size={20} /> FINAL ANSWER ACCEPTED! RECORDING OFFICIAL SERVER TIMESTAMP...
            </div>
          )}

          {feedback === 'wrong' && attemptsRemaining > 0 && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem 1.4rem',
                borderRadius: '6px',
                background: 'rgba(255, 42, 95, 0.15)',
                border: '1px solid var(--neon-red)',
                color: 'var(--neon-red)',
                fontWeight: '800',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.95rem'
              }}
            >
              <AlertTriangle size={18} /> INCORRECT ANSWER. ATTEMPTS REMAINING: {attemptsRemaining}
            </div>
          )}

          {attemptsRemaining === 0 && feedback !== 'correct' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem 1.4rem',
                borderRadius: '6px',
                background: 'rgba(255, 42, 95, 0.2)',
                border: '1px solid var(--neon-red)',
                color: 'var(--neon-red)',
                fontWeight: '800',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.95rem'
              }}
            >
              ✕ MAXIMUM ATTEMPTS EXHAUSTED. PLEASE AWAIT ORGANIZER EVALUATION.
            </div>
          )}

          {!feedback && (
            <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
              ATTEMPTS ALLOWED: {attemptsRemaining} / {GAME_CONFIG.FINAL_CHALLENGE.MAX_ATTEMPTS || 2}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FinalRiddlePage;
