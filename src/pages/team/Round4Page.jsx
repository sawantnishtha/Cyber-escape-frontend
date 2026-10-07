import React, { useState, useEffect } from 'react';
import { Clock, Shield, KeyRound, Play, Code2, HelpCircle, ArrowRight, Check, X } from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';
import { questionService } from '../../services/questionService';
import { teamService } from '../../services/teamService';
import { CodeRevealModal } from '../../components/CodeRevealModal';
import { DEMO_ROUND_4_QUESTIONS } from '../../constants/demoData';
import { GAME_CONFIG } from '../../constants/gameConfig';

export function Round4Page({ team, onRoundComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLang, setSelectedLang] = useState('cpp'); // 'cpp' | 'python' | 'java'
  const [timerSeconds, setTimerSeconds] = useState(GAME_CONFIG.ROUND_4.DURATION_SECONDS);
  const [blankValues, setBlankValues] = useState({}); // { 0: 'a', 1: 'sum' }
  const [solvedQuestions, setSolvedQuestions] = useState(new Set());
  const [hintText, setHintText] = useState(null);
  const [hintUsedThisQ, setHintUsedThisQ] = useState(false);
  const [executionFeedback, setExecutionFeedback] = useState(null); // 'correct' | 'wrong'
  const [unlockedCodeLetters, setUnlockedCodeLetters] = useState([]);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [secretWord, setSecretWord] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load questions and initial progress
  useEffect(() => {
    async function loadData() {
      try {
        const qList = await questionService.getQuestionsForRound(4);
        setQuestions(qList);

        if (team?.id) {
          const progress = await teamService.getTeamProgress(team.id, 4);
          if (progress?.solvedQuestionNumbers) {
            const solved = new Set(progress.solvedQuestionNumbers);
            setSolvedQuestions(solved);
            updateCodeLetters(solved);
          }
          const words = await teamService.getTeamWords(team.id);
          const r4Word = words.find((w) => w.round_number === 4);
          if (r4Word) {
            setSecretWord(r4Word.word);
          }
        }
      } catch (err) {
        console.error('Error loading Round 4:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [team?.id]);

  function updateCodeLetters(solvedSet) {
    // 4-letter key 'CODE' unlocked in scrambled anagram format ['D', 'O', 'C', 'E']
    const scrambled = GAME_CONFIG.ROUND_4.SCRAMBLED_LETTERS || ['D', 'O', 'C', 'E'];
    const letters = [];
    if (solvedSet.has(1)) letters.push(scrambled[0]);
    if (solvedSet.has(2)) letters.push(scrambled[1]);
    if (solvedSet.has(3)) letters.push(scrambled[2]);
    if (solvedSet.has(4)) letters.push(scrambled[3]);
    setUnlockedCodeLetters(letters);
  }

  // 90s question timer
  useEffect(() => {
    if (executionFeedback === 'correct') return;

    const timer = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          soundEffects.playAccessDenied();
          clearInterval(timer);
          return 0;
        }
        if (prev <= 10) {
          soundEffects.playWarningTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, executionFeedback]);

  const handleRunCode = async (e) => {
    e.preventDefault();
    const currentQ = questions[currentIndex];
    const blanksCount = currentQ.question_data.blanksCount || 2;

    // Check if all blanks have input
    const filledValues = [];
    for (let i = 0; i < blanksCount; i++) {
      if (!blankValues[i] || !blankValues[i].trim()) {
        alert(`Please complete Blank #${i + 1} before running the code.`);
        return;
      }
      filledValues.push(blankValues[i].trim());
    }

    soundEffects.playClick();
    const submittedStr = filledValues.join(',');
    const timeTaken = GAME_CONFIG.ROUND_4.DURATION_SECONDS - timerSeconds;

    try {
      const res = await questionService.submitAnswer(
        team.id,
        4,
        currentQ.question_number,
        submittedStr,
        timeTaken
      );

      if (res.is_correct) {
        soundEffects.playAccessGranted();
        setExecutionFeedback('correct');
        const nextSolved = new Set(solvedQuestions);
        nextSolved.add(currentQ.question_number);
        setSolvedQuestions(nextSolved);
        updateCodeLetters(nextSolved);
      } else {
        soundEffects.playAccessDenied();
        setExecutionFeedback('wrong');
      }
    } catch (err) {
      console.error('Error running code blanks:', err);
    }
  };

  const handleRequestHint = async () => {
    if (hintUsedThisQ) return;
    soundEffects.playClick();

    const currentQ = questions[currentIndex];
    try {
      const res = await questionService.requestHint(team.id, 4, currentQ.question_number);
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
      setTimerSeconds(GAME_CONFIG.ROUND_4.DURATION_SECONDS);
      setBlankValues({});
      setExecutionFeedback(null);
      setHintText(null);
      setHintUsedThisQ(false);
    }
  };

  if (loading || questions.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>
          <span className="pulse-dot" /> BOOTING TRI-COMPILER KERNEL...
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const snippet = currentQ.question_data.snippets[selectedLang] || '';
  const blanksCount = currentQ.question_data.blanksCount || 2;
  const labels = currentQ.question_data.labels || [];

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

      {/* Top Bar */}
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
            CYBER ESCAPE // ROUND 04
          </div>
          <div className="font-display glow-cyan" style={{ fontSize: '1.25rem', letterSpacing: '2px' }}>
            SYSTEM OVERRIDE
          </div>
        </div>

        {/* Language selector tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', background: '#050a16', padding: '4px', borderRadius: '6px' }}>
          {['cpp', 'python', 'java'].map((lang) => (
            <button
              key={lang}
              onClick={() => {
                soundEffects.playClick();
                setSelectedLang(lang);
              }}
              className={`cyber-btn ${selectedLang === lang ? 'cyber-btn-primary' : ''}`}
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase'
              }}
            >
              {lang === 'cpp' ? 'C++' : lang === 'python' ? 'PYTHON' : 'JAVA'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div
            className={`cyber-timer-box ${timerSeconds <= 20 ? 'cyber-timer-danger' : timerSeconds <= 40 ? 'cyber-timer-warning' : ''}`}
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

      {/* Main Coding Challenge Card */}
      <div
        className="cyber-card"
        style={{
          flex: 1,
          padding: '2rem 2.5rem',
          background: 'rgba(8, 14, 28, 0.94)',
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
              marginBottom: '1.2rem'
            }}
          >
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', fontSize: '0.85rem' }}>
                PROBLEM 0{currentQ.question_number} // {currentQ.difficulty.toUpperCase()}
              </span>
              <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '0.2rem' }}>
                {currentQ.question_data.title}
              </h2>
            </div>

            {!hintUsedThisQ ? (
              <button
                onClick={handleRequestHint}
                className="cyber-btn"
                style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem', borderColor: 'var(--neon-amber)', color: 'var(--neon-amber)' }}
              >
                <HelpCircle size={14} /> REQUEST HINT
              </button>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--neon-amber)', fontFamily: 'var(--font-mono)' }}>
                * HINT RECORDED *
              </span>
            )}
          </div>

          {hintText && (
            <div
              style={{
                padding: '0.7rem 1rem',
                borderRadius: '6px',
                background: 'rgba(255, 183, 0, 0.08)',
                border: '1px solid rgba(255, 183, 0, 0.3)',
                color: 'var(--neon-amber)',
                fontSize: '0.85rem',
                marginBottom: '1.2rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <strong>DEBUG HINT:</strong> {hintText}
            </div>
          )}

          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.2rem' }}>
            {currentQ.question_data.description}
          </p>

          {/* Code Viewer with Syntax Style */}
          <div
            style={{
              borderRadius: '8px',
              background: '#040711',
              border: '1px solid var(--border-subtle)',
              padding: '1.2rem 1.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.88rem',
              lineHeight: '1.6',
              color: '#d1d5db',
              marginBottom: '1.8rem',
              maxHeight: '420px',
              overflowY: 'auto',
              position: 'relative'
            }}
          >
            <div
              style={{
                position: 'sticky',
                top: 0,
                display: 'flex',
                justifyContent: 'space-between',
                paddingBottom: '0.5rem',
                marginBottom: '0.6rem',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: '#040711',
                fontSize: '0.72rem',
                color: 'var(--text-dim)',
                textTransform: 'uppercase'
              }}
            >
              <span>// {selectedLang.toUpperCase()} SOURCE IMPLEMENTATION</span>
              <span>{snippet.split('\n').length} LINES</span>
            </div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.55' }}>{snippet}</pre>
          </div>

          {/* Interactive Blanks Fill Area */}
          <form onSubmit={handleRunCode}>
            <div
              style={{
                background: 'rgba(10, 18, 36, 0.7)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '1.2rem',
                marginBottom: '1.5rem'
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--neon-cyan)',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '1rem'
                }}
              >
                FILL IN MISSING LOGIC TO EXECUTE:
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`,
                  gap: '1rem'
                }}
              >
                {Array.from({ length: blanksCount }).map((_, idx) => (
                  <div key={idx}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        marginBottom: '0.4rem',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      BLANK #{idx + 1} ({labels[idx] || 'Expression'})
                    </label>
                    <input
                      type="text"
                      className="cyber-input"
                      placeholder={`/* blank_${idx} */`}
                      value={blankValues[idx] || ''}
                      onChange={(e) => setBlankValues({ ...blankValues, [idx]: e.target.value })}
                      disabled={executionFeedback === 'correct'}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="submit"
                disabled={executionFeedback === 'correct'}
                className="cyber-btn cyber-btn-primary"
                style={{ padding: '0.65rem 1.8rem' }}
              >
                <Play size={16} /> RUN CODE
              </button>

              {/* Execution Feedback */}
              <div>
                {executionFeedback === 'correct' && (
                  <span
                    style={{
                      color: 'var(--neon-green)',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    <Check size={18} /> CORRECT! CODE LETTER UNLOCKED
                  </span>
                )}
                {executionFeedback === 'wrong' && (
                  <span
                    style={{
                      color: 'var(--neon-red)',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    <X size={18} /> LOGIC ERROR / MISMATCH. CHECK BLANKS.
                  </span>
                )}
              </div>
            </div>
          </form>
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
              disabled={executionFeedback === null}
            >
              NEXT LOGIC BLOCK <ArrowRight size={16} />
            </button>
          )}

          {isLastQuestion && (
            <button
              onClick={() => {
                soundEffects.playClick();
                if (unlockedCodeLetters.length >= 4 && !secretWord) {
                  setShowCodeModal(true);
                } else {
                  // Direct transition to Final Riddle as per Section 19!
                  onRoundComplete();
                }
              }}
              className="cyber-btn cyber-btn-success"
            >
              {secretWord ? 'ENTER THE FINAL RIDDLE' : 'ENTER FINAL CODE'} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Code Reveal Modal */}
      <CodeRevealModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        teamId={team.id}
        roundNumber={4}
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
