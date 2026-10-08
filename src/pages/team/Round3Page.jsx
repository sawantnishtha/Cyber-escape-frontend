import React, { useState, useEffect } from 'react';
import { Clock, Shield, KeyRound, HelpCircle, Check, X, ArrowRight, Binary, Table } from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';
import { questionService } from '../../services/questionService';
import { teamService } from '../../services/teamService';
import { CodeRevealModal } from '../../components/CodeRevealModal';
import { ASCII_REFERENCE_TABLE, DEMO_ROUND_3_QUESTIONS } from '../../constants/demoData';
import { GAME_CONFIG } from '../../constants/gameConfig';
import { seededShuffle } from '../../utils/shuffleUtils';

export function Round3Page({ team, onRoundComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(GAME_CONFIG.ROUND_3.DURATION_SECONDS);
  const [submittedAnswer, setSubmittedAnswer] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(GAME_CONFIG.ROUND_3.MAX_ATTEMPTS);
  const [solvedQuestions, setSolvedQuestions] = useState(new Set());
  const [hintText, setHintText] = useState(null);
  const [hintUsedThisQ, setHintUsedThisQ] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState(null); // 'correct' | 'wrong'
  const [unlockedCodeLetters, setUnlockedCodeLetters] = useState([]);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [secretWord, setSecretWord] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Questions and initial state
  useEffect(() => {
    async function loadData() {
      try {
        const qList = await questionService.getQuestionsForRound(3);
        const shuffledList = seededShuffle(qList, team?.team_key_hash || team?.id);
        setQuestions(shuffledList);

        if (team?.id) {
          const progress = await teamService.getTeamProgress(team.id, 3);
          if (progress?.solvedQuestionNumbers) {
            const solved = new Set(progress.solvedQuestionNumbers);
            setSolvedQuestions(solved);
            updateCodeLetters(solved);
          }
          const words = await teamService.getTeamWords(team.id);
          const r3Word = words.find((w) => w.round_number === 3);
          if (r3Word) {
            setSecretWord(r3Word.word);
          }
        }
      } catch (err) {
        console.error('Error loading Round 3:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [team?.id]);

  function updateCodeLetters(solvedSet) {
    // 4-letter key 'LOCK' unlocked in scrambled anagram format ['C', 'L', 'K', 'O']
    const scrambled = GAME_CONFIG.ROUND_3.SCRAMBLED_LETTERS || ['C', 'L', 'K', 'O'];
    const count = Math.min(4, solvedSet.size);
    setUnlockedCodeLetters(scrambled.slice(0, count));
  }

  // Question countdown timer
  useEffect(() => {
    if (submissionFeedback === 'correct' || attemptsRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          soundEffects.playAccessDenied();
          setAttemptsRemaining((att) => Math.max(0, att - 1));
          return 0;
        }
        if (prev <= 10) {
          soundEffects.playWarningTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, submissionFeedback, attemptsRemaining]);

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!submittedAnswer.trim() || attemptsRemaining <= 0 || submissionFeedback === 'correct') return;

    soundEffects.playClick();
    const currentQ = questions[currentIndex];
    const timeTaken = GAME_CONFIG.ROUND_3.DURATION_SECONDS - timerSeconds;
    const cleanAnswer = submittedAnswer.trim().replace(/\s+/g, ' ');

    try {
      const res = await questionService.submitAnswer(
        team.id,
        3,
        currentQ.question_number,
        cleanAnswer,
        timeTaken
      );

      if (res.is_correct) {
        soundEffects.playAccessGranted();
        setSubmissionFeedback('correct');
        const nextSolved = new Set(solvedQuestions);
        nextSolved.add(currentQ.question_number);
        setSolvedQuestions(nextSolved);
        updateCodeLetters(nextSolved);
      } else {
        soundEffects.playAccessDenied();
        setSubmissionFeedback('wrong');
        setAttemptsRemaining((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error submitting binary answer:', err);
    }
  };

  const handleRequestHint = async () => {
    if (hintUsedThisQ) return;
    soundEffects.playClick();

    // Time penalty: deduct 10s for requesting hint
    setTimerSeconds((prev) => Math.max(5, prev - 10));

    const currentQ = questions[currentIndex];
    try {
      const res = await questionService.requestHint(team?.id, 3, currentQ.question_number);
      if (res && res.hint) {
        setHintText(res.hint);
        setHintUsedThisQ(true);
      }
    } catch (err) {
      console.error('Error requesting hint:', err);
    }
  };

  const handleNextQuestion = () => {
    soundEffects.playClick();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimerSeconds(GAME_CONFIG.ROUND_3.DURATION_SECONDS);
      setSubmittedAnswer('');
      setAttemptsRemaining(GAME_CONFIG.ROUND_3.MAX_ATTEMPTS);
      setSubmissionFeedback(null);
      setHintText(null);
      setHintUsedThisQ(false);
    }
  };

  if (loading || questions.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>
          <span className="pulse-dot" /> MOUNTING ASCII DECRYPTOR...
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isSolved = solvedQuestions.has(currentQ.question_number);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 2rem',
        maxWidth: '1100px',
        margin: '0 auto',
        width: '100%'
      }}
    >
      <div className="cyber-bg" />
      <div className="cyber-bg-radial" />

      {/* Top Status Bar */}
      <div
        className="cyber-card"
        style={{
          padding: '1rem 1.5rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            CYBER ESCAPE // ROUND 03
          </div>
          <div className="font-display glow-cyan" style={{ fontSize: '1.25rem', letterSpacing: '2px' }}>
            BINARY CONVERGENCE
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>PROGRESS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--neon-green)' }}>
              CHALLENGE {currentIndex + 1} / {questions.length} ({solvedQuestions.size} Solved)
            </div>
          </div>

          <div
            className={`cyber-timer-box ${timerSeconds <= 15 ? 'cyber-timer-danger' : timerSeconds <= 30 ? 'cyber-timer-warning' : ''}`}
          >
            <Clock size={16} /> 00:{timerSeconds.toString().padStart(2, '0')}
          </div>

          <button
            onClick={() => {
              soundEffects.playClick();
              setShowCodeModal(true);
            }}
            className="cyber-btn"
            style={{
              borderColor: unlockedCodeLetters.length >= 4 ? 'var(--neon-green)' : 'var(--neon-cyan)',
              color: unlockedCodeLetters.length >= 4 ? 'var(--neon-green)' : 'var(--neon-cyan)'
            }}
          >
            <KeyRound size={16} /> CODE UNLOCK ({unlockedCodeLetters.length}/4)
          </button>
        </div>
      </div>

      {/* Permanent ASCII Reference Matrix Header (Section 17 requirement) */}
      <div
        className="cyber-card"
        style={{
          padding: '0.9rem 1.2rem',
          marginBottom: '1.5rem',
          background: 'rgba(5, 10, 22, 0.88)'
        }}
      >
        <div
          style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--neon-cyan)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Table size={14} /> PERMANENT SYSTEM REFERENCE // ASCII CODE TABLE
        </div>

        {/* Scrollable ASCII Quick Lookups */}
        <div
          style={{
            display: 'flex',
            gap: '0.6rem',
            overflowX: 'auto',
            paddingBottom: '0.3rem'
          }}
        >
          {ASCII_REFERENCE_TABLE.map((row) => (
            <div
              key={row.char}
              style={{
                flexShrink: 0,
                padding: '0.3rem 0.55rem',
                borderRadius: '4px',
                background: 'rgba(0, 243, 255, 0.05)',
                border: '1px solid rgba(0, 243, 255, 0.15)',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                textAlign: 'center'
              }}
            >
              <div style={{ color: 'var(--neon-cyan)', fontWeight: '700' }}>{row.char}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{row.dec}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Binary Challenge Card */}
      <div
        className="cyber-card"
        style={{
          flex: 1,
          padding: '2.5rem',
          background: 'rgba(9, 15, 30, 0.92)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '0.8rem',
              marginBottom: '1.8rem'
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', fontSize: '0.85rem' }}>
              CHALLENGE 0{currentQ.question_number} // ATTEMPTS REMAINING: {attemptsRemaining} / {GAME_CONFIG.ROUND_3.MAX_ATTEMPTS}
            </span>

            {/* Hint Button */}
            {!hintUsedThisQ ? (
              <button
                onClick={handleRequestHint}
                className="cyber-btn"
                style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem', borderColor: 'var(--neon-amber)', color: 'var(--neon-amber)' }}
              >
                <HelpCircle size={14} /> REQUEST HINT (-10s PENALTY)
              </button>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--neon-amber)', fontFamily: 'var(--font-mono)' }}>
                * HINT RECORDED IN LEADERBOARD *
              </span>
            )}
          </div>

          {/* Hint Card if revealed */}
          {hintText && (
            <div
              style={{
                padding: '0.8rem 1.2rem',
                borderRadius: '6px',
                background: 'rgba(255, 183, 0, 0.08)',
                border: '1px solid rgba(255, 183, 0, 0.3)',
                color: 'var(--neon-amber)',
                fontSize: '0.88rem',
                marginBottom: '1.5rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <strong>TACTICAL HINT:</strong> {hintText}
            </div>
          )}

          {/* Prompt */}
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1.5rem' }}>
            {currentQ.question_data.instruction}
          </p>

          {/* Binary Display Matrix */}
          <div
            style={{
              padding: '2rem 1.5rem',
              borderRadius: '8px',
              background: '#040711',
              border: '2px solid var(--neon-cyan)',
              boxShadow: '0 0 20px var(--neon-cyan-glow)',
              textAlign: 'center',
              marginBottom: '1.8rem'
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: '0.6rem' }}>
              INCOMING 8-BIT CIPHER STREAM // MULTI-WORD PROTOCOL
            </div>
            <div
              className="font-mono glow-cyan"
              style={{
                fontSize: 'clamp(1.1rem, 2.2vw, 1.5rem)',
                letterSpacing: '2px',
                fontWeight: '700',
                lineHeight: '2',
                wordBreak: 'break-word',
                maxWidth: '900px',
                margin: '0 auto'
              }}
            >
              {currentQ.question_data.binary}
            </div>
            <div style={{ marginTop: '0.6rem', fontSize: '0.74rem', color: 'var(--neon-amber)', fontFamily: 'var(--font-mono)' }}>
              TIP: Space byte is 00100000 (dec 32). Separate decoded words with a single space.
            </div>
          </div>

          {/* Answer Input */}
          <form onSubmit={handleSubmitAnswer} style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <input
                type="text"
                maxLength={40}
                className="cyber-input"
                placeholder="DECRYPTED PHRASE (E.G. ZERO TRUST)"
                value={submittedAnswer}
                onChange={(e) => setSubmittedAnswer(e.target.value.toUpperCase())}
                disabled={submissionFeedback === 'correct' || attemptsRemaining <= 0}
                style={{
                  fontSize: '1.15rem',
                  fontWeight: '700',
                  textAlign: 'center',
                  letterSpacing: '2px',
                  textTransform: 'uppercase'
                }}
                autoFocus
              />
              <button
                type="submit"
                disabled={!submittedAnswer.trim() || attemptsRemaining <= 0 || submissionFeedback === 'correct'}
                className="cyber-btn cyber-btn-primary"
                style={{ padding: '0 1.8rem', whiteSpace: 'nowrap' }}
              >
                SUBMIT
              </button>
            </div>
          </form>

          {/* Feedback states */}
          <div style={{ textAlign: 'center', marginTop: '1.2rem', minHeight: '24px' }}>
            {submissionFeedback === 'correct' && (
              <span style={{ color: 'var(--neon-green)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                ✓ CODE MATCH VERIFIED! CODE LETTER UNLOCKED
              </span>
            )}
            {submissionFeedback === 'wrong' && attemptsRemaining > 0 && (
              <span style={{ color: 'var(--neon-red)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                ✕ INCORRECT. {attemptsRemaining} ATTEMPT REMAINING.
              </span>
            )}
            {attemptsRemaining === 0 && submissionFeedback !== 'correct' && (
              <span style={{ color: 'var(--neon-red)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                ✕ NO ATTEMPTS REMAINING FOR THIS QUESTION.
              </span>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1.2rem',
            marginTop: '2rem',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem'
          }}
        >
          {!isLastQuestion && (
            <button
              onClick={handleNextQuestion}
              className="cyber-btn cyber-btn-primary"
              disabled={submissionFeedback === null && attemptsRemaining > 0}
            >
              NEXT CHALLENGE <ArrowRight size={16} />
            </button>
          )}

          {isLastQuestion && (
            <button
              onClick={() => {
                soundEffects.playClick();
                if (unlockedCodeLetters.length >= 4 && !secretWord) {
                  setShowCodeModal(true);
                } else {
                  onRoundComplete();
                }
              }}
              className="cyber-btn cyber-btn-success"
            >
              {secretWord ? 'PROCEED TO RESULTS' : 'ENTER FINAL CODE'} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Code Reveal Modal */}
      <CodeRevealModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        teamId={team.id}
        roundNumber={3}
        unlockedCodeLetters={unlockedCodeLetters}
        totalLettersNeeded={4}
        onWordUnlocked={(word) => {
          setSecretWord(word);
        }}
        onRoundComplete={onRoundComplete}
      />
    </div>
  );
}
