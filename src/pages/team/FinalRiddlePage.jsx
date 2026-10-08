import React, { useState, useEffect } from 'react';
import { Sparkles, HelpCircle, Key, ArrowRight, Check, X, ShieldAlert, Move } from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';
import { teamService } from '../../services/teamService';
import { codeService } from '../../services/codeService';
import { GAME_CONFIG } from '../../constants/gameConfig';
import { getTeamRiddleIndex } from '../../utils/shuffleUtils';

export function FinalRiddlePage({ team, onFinalAnswerAccepted }) {
  const riddleIndex = getTeamRiddleIndex(team?.team_key_hash || team?.id || '');
  const assignedRiddle =
    (GAME_CONFIG.FINAL_CHALLENGE.RIDDLES && GAME_CONFIG.FINAL_CHALLENGE.RIDDLES[riddleIndex]) ||
    { riddle: GAME_CONFIG.FINAL_CHALLENGE.RIDDLE_TEXT, answers: ['INTERNET', 'A MAP'] };

  const [collectedWords, setCollectedWords] = useState(['THINK', 'BEFORE', 'YOU', 'ESCAPE']);
  const [arrangedWords, setArrangedWords] = useState(['ESCAPE', 'YOU', 'BEFORE', 'THINK']); // Initially scrambled
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isSentenceUnlocked, setIsSentenceUnlocked] = useState(false);
  const [finalAnswer, setFinalAnswer] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(GAME_CONFIG.FINAL_CHALLENGE.MAX_ATTEMPTS);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWords() {
      if (!team?.id) return;
      try {
        const wordsData = await teamService.getTeamWords(team.id);
        if (wordsData && wordsData.length > 0) {
          const list = wordsData.map((w) => w.word.toUpperCase());
          // Ensure we have all 4 demo words or defaults
          const complete = ['THINK', 'BEFORE', 'YOU', 'ESCAPE'];
          list.forEach((w) => {
            if (!complete.includes(w)) complete.push(w);
          });
          setCollectedWords(complete);
          // Shuffle initially
          const shuffled = [...complete].sort(() => 0.5 - Math.random());
          setArrangedWords(shuffled);
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
    const target = GAME_CONFIG.FINAL_CHALLENGE.TARGET_SENTENCE;
    const isMatch = arrangedWords.length === target.length && arrangedWords.every((w, i) => w === target[i]);
    if (isMatch && !isSentenceUnlocked) {
      soundEffects.playAccessGranted();
      setIsSentenceUnlocked(true);
    }
  }, [arrangedWords, isSentenceUnlocked]);

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

    const normalized = finalAnswer.trim().toUpperCase();
    const localMatch = assignedRiddle.answers.some(
      (a) => a.toUpperCase() === normalized || normalized.includes(a.toUpperCase())
    );

    try {
      const res = await codeService.submitFinalAnswer(team.id, finalAnswer.trim());
      if ((res && res.is_correct) || localMatch) {
        soundEffects.playAccessGranted();
        setFeedback('correct');
        setTimeout(() => {
          onFinalAnswerAccepted();
        }, 1200);
      } else {
        soundEffects.playAccessDenied();
        setFeedback('wrong');
        setAttemptsRemaining(res?.attempts_remaining ?? attemptsRemaining - 1);
      }
    } catch (err) {
      console.error('Final answer submission error:', err);
      if (localMatch) {
        soundEffects.playAccessGranted();
        setFeedback('correct');
        setTimeout(() => {
          onFinalAnswerAccepted();
        }, 1200);
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
          Reconstruct the sequence of your 4 decrypted round words to synthesize the master cryptographic riddle.
        </div>
      </div>

      {/* Word Arrangement Matrix */}
      <div
        className="cyber-card"
        style={{
          width: '100%',
          padding: '2.5rem',
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
          <Move size={16} /> DRAG OR ARRANGE WORDS INTO THE PROPER CIPHER PHRASE:
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

        {/* Status of sentence */}
        {isSentenceUnlocked ? (
          <div
            style={{
              color: 'var(--neon-green)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9rem',
              fontWeight: '700'
            }}
          >
            ✓ CIPHER PHRASE VALIDATED: "THINK BEFORE YOU ESCAPE"
          </div>
        ) : (
          <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            Arrange the words in grammatical & logical sequence to unlock the riddle prompt.
          </div>
        )}
      </div>

      {/* Riddle Statement Card (Appears after sentence is arranged) */}
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
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#fff',
              lineHeight: 1.7,
              marginBottom: '2rem',
              maxWidth: '650px',
              margin: '0 auto 2rem auto',
              textTransform: 'none',
              letterSpacing: 'normal',
              whiteSpace: 'pre-line'
            }}
          >
            {assignedRiddle.riddle}
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmitFinal} style={{ maxWidth: '420px', margin: '0 auto' }}>
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
              style={{ width: '100%', padding: '0.85rem' }}
            >
              {isSubmitting ? 'SUBMITTING...' : 'SUBMIT FINAL ESCAPE ANSWER'}
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
