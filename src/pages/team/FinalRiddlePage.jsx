import React, { useState, useEffect } from 'react';
import { Sparkles, HelpCircle, Key, ArrowRight, Check, X, ShieldAlert, Move, Unlock, Lock } from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';
import { teamService } from '../../services/teamService';
import { codeService } from '../../services/codeService';
import { GAME_CONFIG } from '../../constants/gameConfig';
import { getTeamRiddleIndex } from '../../utils/shuffleUtils';

export function FinalRiddlePage({ team, onFinalAnswerAccepted }) {
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

  const [collectedWords, setCollectedWords] = useState(['THINK', 'BEFORE', 'YOU', 'ESCAPE']);
  const [arrangedWords, setArrangedWords] = useState(['ESCAPE', 'YOU', 'BEFORE', 'THINK']); // Initially scrambled
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [typedPhrase, setTypedPhrase] = useState('');
  const [phraseError, setPhraseError] = useState('');
  const [isSentenceUnlocked, setIsSentenceUnlocked] = useState(false);
  const [finalAnswer, setFinalAnswer] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(GAME_CONFIG.FINAL_CHALLENGE.MAX_ATTEMPTS || 2);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWords() {
      if (!team?.id) {
        setLoading(false);
        return;
      }
      try {
        const wordsData = await teamService.getTeamWords(team.id);
        if (wordsData && wordsData.length > 0) {
          const list = wordsData.map((w) => w.word.toUpperCase());
          const complete = ['THINK', 'BEFORE', 'YOU', 'ESCAPE'];
          list.forEach((w) => {
            if (!complete.includes(w)) complete.push(w);
          });
          setCollectedWords(complete);
        }
      } catch (err) {
        console.error('Error loading team words:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWords();
  }, [team?.id]);

  // Check if current arrangement matches target sentence
  useEffect(() => {
    const target = GAME_CONFIG.FINAL_CHALLENGE.TARGET_SENTENCE || ['THINK', 'BEFORE', 'YOU', 'ESCAPE'];
    const isMatch = arrangedWords.length === target.length && arrangedWords.every((w, i) => w === target[i]);
    if (isMatch && !isSentenceUnlocked) {
      soundEffects.playAccessGranted();
      setIsSentenceUnlocked(true);
      setTypedPhrase('THINK BEFORE YOU ESCAPE');
      setPhraseError('');
    }
  }, [arrangedWords, isSentenceUnlocked]);

  // Handle typing or direct entry of passphrase
  const handleVerifyTypedPhrase = (e) => {
    if (e) e.preventDefault();
    const cleanTyped = typedPhrase.trim().toUpperCase().replace(/\s+/g, ' ');
    if (cleanTyped === 'THINK BEFORE YOU ESCAPE') {
      soundEffects.playAccessGranted();
      setIsSentenceUnlocked(true);
      setArrangedWords(['THINK', 'BEFORE', 'YOU', 'ESCAPE']);
      setPhraseError('');
    } else {
      soundEffects.playAccessDenied();
      setPhraseError('Incorrect phrase. Enter the 4 secret words: "THINK BEFORE YOU ESCAPE"');
    }
  };

  const handlePhraseInputChange = (e) => {
    const val = e.target.value;
    setTypedPhrase(val);
    const cleanTyped = val.trim().toUpperCase().replace(/\s+/g, ' ');
    if (cleanTyped === 'THINK BEFORE YOU ESCAPE' && !isSentenceUnlocked) {
      soundEffects.playAccessGranted();
      setIsSentenceUnlocked(true);
      setArrangedWords(['THINK', 'BEFORE', 'YOU', 'ESCAPE']);
      setPhraseError('');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index) => {
    setDraggedIndex(index);
    soundEffects.playClick();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    const newArranged = [...arrangedWords];
    const [movedItem] = newArranged.splice(draggedIndex, 1);
    newArranged.splice(dropIndex, 0, movedItem);
    setArrangedWords(newArranged);
    setDraggedIndex(null);
    soundEffects.playClick();
  };

  // Swap helper for mobile or non-drag users
  const handleMoveLeft = (index) => {
    if (index === 0) return;
    const next = [...arrangedWords];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setArrangedWords(next);
    soundEffects.playClick();
  };

  const handleMoveRight = (index) => {
    if (index === arrangedWords.length - 1) return;
    const next = [...arrangedWords];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setArrangedWords(next);
    soundEffects.playClick();
  };

  const handleSubmitFinal = async (e) => {
    e.preventDefault();
    if (!finalAnswer.trim() || attemptsRemaining <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    soundEffects.playClick();

    const normalized = finalAnswer.trim().toUpperCase().replace(/\s+/g, ' ');
    const acceptedSet = (acceptedAnswersList || []).map((a) => String(a).trim().toUpperCase());
    
    // Add default fallbacks for both master riddles so students never get stuck on formatting
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
          onFinalAnswerAccepted();
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
          onFinalAnswerAccepted();
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
        padding: '2rem 1.5rem',
        maxWidth: '880px',
        margin: '0 auto',
        width: '100%'
      }}
    >
      <div className="cyber-bg" />
      <div className="cyber-bg-radial" />

      {/* Top Header Card */}
      <div
        className="cyber-card"
        style={{
          width: '100%',
          padding: '1.2rem 1.8rem',
          marginBottom: '1.5rem',
          textAlign: 'center',
          background: 'rgba(9, 15, 30, 0.9)'
        }}
      >
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          CYBER ESCAPE // MASTER DEFENSE PROTOCOL
        </div>
        <h1 className="font-display glow-cyan" style={{ fontSize: '2rem', letterSpacing: '4px', margin: '0.4rem 0' }}>
          THE FINAL RIDDLE
        </h1>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Assemble the 4 secret words collected from Rounds 1–4 into the passphrase to reveal the Master Riddle.
        </div>
      </div>

      {/* Word Arrangement Matrix */}
      <div
        className="cyber-card"
        style={{
          width: '100%',
          padding: '2rem',
          marginBottom: '1.5rem',
          background: 'rgba(8, 14, 28, 0.94)',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--neon-cyan)',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem'
          }}
        >
          <Move size={16} /> ASSEMBLE OR ENTER CIPHER PHRASE:
        </div>

        {/* Word Cards */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1.5rem'
          }}
        >
          {arrangedWords.map((word, idx) => (
            <div
              key={word + idx}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(idx)}
              style={{
                padding: '1rem 1.6rem',
                borderRadius: '8px',
                background: isSentenceUnlocked ? 'rgba(0, 255, 136, 0.15)' : 'rgba(0, 243, 255, 0.08)',
                border: `2px solid ${isSentenceUnlocked ? 'var(--neon-green)' : 'var(--neon-cyan)'}`,
                boxShadow: isSentenceUnlocked ? '0 0 15px var(--neon-green-glow)' : '0 0 10px var(--neon-cyan-glow)',
                color: isSentenceUnlocked ? 'var(--neon-green)' : 'var(--text-main)',
                fontFamily: 'var(--font-display)',
                fontSize: '1.4rem',
                fontWeight: '700',
                letterSpacing: '3px',
                cursor: 'grab',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem',
                userSelect: 'none'
              }}
            >
              <span>{word}</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {idx > 0 && (
                  <button
                    onClick={() => handleMoveLeft(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                    title="Move Left"
                  >
                    ◀
                  </button>
                )}
                {idx < arrangedWords.length - 1 && (
                  <button
                    onClick={() => handleMoveRight(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                    title="Move Right"
                  >
                    ▶
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Direct Text Input for Passphrase */}
        {!isSentenceUnlocked ? (
          <form onSubmit={handleVerifyTypedPhrase} style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <input
                type="text"
                className="cyber-input"
                placeholder="TYPE: THINK BEFORE YOU ESCAPE"
                value={typedPhrase}
                onChange={handlePhraseInputChange}
                style={{
                  fontSize: '1rem',
                  fontWeight: '700',
                  textAlign: 'center',
                  letterSpacing: '2px',
                  textTransform: 'uppercase'
                }}
              />
              <button
                type="submit"
                className="cyber-btn cyber-btn-primary"
                style={{ whiteSpace: 'nowrap', padding: '0.75rem 1.2rem' }}
              >
                <Unlock size={16} /> UNLOCK
              </button>
            </div>

            {phraseError ? (
              <div style={{ color: 'var(--neon-red)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                {phraseError}
              </div>
            ) : (
              <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                Rearrange the word tiles above OR type <strong>THINK BEFORE YOU ESCAPE</strong> to reveal the riddle.
              </div>
            )}
          </form>
        ) : (
          <div
            style={{
              padding: '0.75rem 1.2rem',
              borderRadius: '6px',
              background: 'rgba(0, 255, 136, 0.1)',
              border: '1px solid var(--neon-green)',
              color: 'var(--neon-green)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.95rem',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Check size={18} /> CIPHER PHRASE VALIDATED: &quot;THINK BEFORE YOU ESCAPE&quot;
          </div>
        )}
      </div>

      {/* Master Riddle Statement Card (Revealed Once Passphrase Unlocked) */}
      {isSentenceUnlocked && (
        <div
          className="cyber-card"
          style={{
            width: '100%',
            padding: '2.5rem',
            background: 'rgba(8, 14, 28, 0.94)',
            textAlign: 'center',
            border: '2px solid var(--neon-cyan)',
            boxShadow: '0 0 25px var(--neon-cyan-glow)',
            animation: 'fadeIn 0.5s ease-out'
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--neon-cyan)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: '0.8rem'
            }}
          >
            THE MASTER RIDDLE
          </div>

          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: '600',
              color: '#fff',
              lineHeight: 1.8,
              marginBottom: '2rem',
              maxWidth: '700px',
              margin: '0 auto 2rem auto',
              textTransform: 'none',
              letterSpacing: 'normal',
              whiteSpace: 'pre-line'
            }}
          >
            {riddleStatement}
          </h2>

          {/* Form for Riddle Solution */}
          <form onSubmit={handleSubmitFinal} style={{ maxWidth: '440px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.2rem' }}>
              <input
                type="text"
                className="cyber-input"
                placeholder="ENTER FINAL WORD"
                value={finalAnswer}
                onChange={(e) => setFinalAnswer(e.target.value.toUpperCase())}
                disabled={feedback === 'correct' || attemptsRemaining <= 0 || isSubmitting}
                style={{
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  textAlign: 'center',
                  letterSpacing: '4px',
                  textTransform: 'uppercase'
                }}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={!finalAnswer.trim() || attemptsRemaining <= 0 || isSubmitting || feedback === 'correct'}
              className="cyber-btn cyber-btn-primary"
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
            >
              {isSubmitting ? 'VERIFYING...' : 'SUBMIT FINAL ESCAPE ANSWER'}
            </button>
          </form>

          {/* Feedback */}
          <div style={{ marginTop: '1.2rem', minHeight: '24px' }}>
            {feedback === 'correct' && (
              <span style={{ color: 'var(--neon-green)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                ✓ FINAL ANSWER ACCEPTED! RECORDING OFFICIAL SERVER TIMESTAMP...
              </span>
            )}
            {feedback === 'wrong' && attemptsRemaining > 0 && (
              <span style={{ color: 'var(--neon-red)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                ✕ INCORRECT ANSWER. ATTEMPTS REMAINING: {attemptsRemaining}
              </span>
            )}
            {attemptsRemaining === 0 && feedback !== 'correct' && (
              <span style={{ color: 'var(--neon-red)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                ✕ MAXIMUM ATTEMPTS EXHAUSTED. PLEASE AWAIT ORGANIZER EVALUATION.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
