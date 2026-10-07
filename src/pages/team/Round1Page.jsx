import React, { useState, useEffect, useRef } from 'react';
import { Clock, Shield, KeyRound, Check, X, HelpCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';
import { questionService } from '../../services/questionService';
import { teamService } from '../../services/teamService';
import { CodeRevealModal } from '../../components/CodeRevealModal';
import { GAME_CONFIG } from '../../constants/gameConfig';

export function Round1Page({ team, onRoundComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stage, setStage] = useState('A'); // 'A' = 15s Question Only, 'B' = 30s Options View
  const [stageTimer, setStageTimer] = useState(GAME_CONFIG.ROUND_1.QUESTION_VIEW_SECONDS);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(null); // 'correct' | 'wrong' | 'attempt_failed' | null
  const [chancesLeft, setChancesLeft] = useState(2);
  const [wrongOptions, setWrongOptions] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [solvedQuestions, setSolvedQuestions] = useState(new Set());
  const [unlockedCodeLetters, setUnlockedCodeLetters] = useState([]);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [secretWord, setSecretWord] = useState(null);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef(null);

  // Fetch Questions and initial team progress
  useEffect(() => {
    async function loadData() {
      try {
        const qList = await questionService.getQuestionsForRound(1);
        setQuestions(qList);

        if (team?.id) {
          const progress = await teamService.getTeamProgress(team.id, 1);
          if (progress?.solvedQuestionNumbers) {
            setSolvedQuestions(new Set(progress.solvedQuestionNumbers));
            // Calculate code segments unlocked based on solved count
            updateCodeLetters(progress.solvedCount);
          }
          const words = await teamService.getTeamWords(team.id);
          const r1Word = words.find((w) => w.round_number === 1);
          if (r1Word) {
            setSecretWord(r1Word.word);
          }
        }
      } catch (err) {
        console.error('Error loading Round 1:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [team?.id]);

  function updateCodeLetters(solvedCount) {
    // 4-letter key 'CYBR' unlocked in scrambled anagram format ['R', 'C', 'Y', 'B']
    const scrambled = GAME_CONFIG.ROUND_1.SCRAMBLED_LETTERS || ['R', 'C', 'Y', 'B'];
    const lettersUnlockedCount = Math.min(4, Math.floor(solvedCount / 2));
    setUnlockedCodeLetters(scrambled.slice(0, lettersUnlockedCount));
  }

  // 15s Stage A -> 30s Stage B countdown
  useEffect(() => {
    // Only stop timer when the question has finished (correct or all chances exhausted)
    if (submissionStatus === 'correct' || submissionStatus === 'wrong') return;

    timerRef.current = setInterval(() => {
      setStageTimer((prev) => {
        if (prev <= 1) {
          if (stage === 'A') {
            soundEffects.playTyping();
            setStage('B');
            return GAME_CONFIG.ROUND_1.OPTION_VIEW_SECONDS;
          } else {
            // Stage B timed out without answer or after 1st attempt
            soundEffects.playAccessDenied();
            setChancesLeft(0);
            setSubmissionStatus('wrong');
            clearInterval(timerRef.current);
            return 0;
          }
        }
        if (prev <= 5) {
          soundEffects.playWarningTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [stage, submissionStatus, currentIndex]);

  const handleSelectOption = async (option) => {
    if (
      stage !== 'B' ||
      submissionStatus === 'correct' ||
      submissionStatus === 'wrong' ||
      wrongOptions.has(option) ||
      chancesLeft <= 0 ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);
    setSelectedOption(option);
    soundEffects.playClick();

    const currentQ = questions[currentIndex];
    const timeTaken = GAME_CONFIG.ROUND_1.TOTAL_TIME_PER_QUESTION - stageTimer;

    try {
      const res = await questionService.submitAnswer(
        team.id,
        1,
        currentQ.question_number,
        option,
        timeTaken
      );

      if (res.is_correct) {
        soundEffects.playAccessGranted();
        setSubmissionStatus('correct');
        const nextSolved = new Set(solvedQuestions);
        nextSolved.add(currentQ.question_number);
        setSolvedQuestions(nextSolved);
        updateCodeLetters(nextSolved.size);
      } else {
        soundEffects.playAccessDenied();
        const remaining = chancesLeft - 1;
        setChancesLeft(remaining);
        setWrongOptions((prev) => new Set(prev).add(option));

        if (remaining > 0) {
          // Attempt 1 failed - 1 chance remaining, keep timer ticking
          setSubmissionStatus('attempt_failed');
        } else {
          // Both chances exhausted
          setSubmissionStatus('wrong');
        }
      }
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    soundEffects.playClick();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setStage('A');
      setStageTimer(GAME_CONFIG.ROUND_1.QUESTION_VIEW_SECONDS);
      setSelectedOption(null);
      setSubmissionStatus(null);
      setChancesLeft(2);
      setWrongOptions(new Set());
    }
  };

  if (loading || questions.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>
          <span className="pulse-dot" /> LOADING ROUND 1 CHALLENGES...
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isQuestionAlreadySolved = solvedQuestions.has(currentQ.question_number);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 2rem',
        maxWidth: '1000px',
        margin: '0 auto',
        width: '100%'
      }}
    >
      <div className="cyber-bg" />
      <div className="cyber-bg-radial" />

      {/* Top Cyber Status Bar */}
      <div
        className="cyber-card"
        style={{
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            CYBER ESCAPE // ROUND 01
          </div>
          <div className="font-display glow-cyan" style={{ fontSize: '1.25rem', letterSpacing: '2px' }}>
            THE FIRST BREACH
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Progress badge */}
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>PROGRESS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--neon-green)' }}>
              Q{currentIndex + 1} / {questions.length} ({solvedQuestions.size} Solved)
            </div>
          </div>

          {/* Dual-Stage Timer */}
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              {stage === 'A' ? 'STAGE A: 15s STATEMENT' : 'STAGE B: 30s SELECTION'}
            </div>
            <div
              className={`cyber-timer-box ${stageTimer <= 5 ? 'cyber-timer-danger' : stageTimer <= 10 ? 'cyber-timer-warning' : ''}`}
            >
              <Clock size={16} /> 00:{stageTimer.toString().padStart(2, '0')}
            </div>
          </div>

          {/* Chances Indicator */}
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              CHANCES
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
              {[1, 2].map((num) => {
                const isUsedAndWrong = chancesLeft < num;
                const isAvailable = chancesLeft >= num;
                return (
                  <span
                    key={num}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '700',
                      border: `1.5px solid ${
                        isUsedAndWrong
                          ? 'var(--neon-red)'
                          : chancesLeft === 1
                          ? 'var(--neon-amber)'
                          : 'var(--neon-cyan)'
                      }`,
                      background: isUsedAndWrong
                        ? 'rgba(255, 42, 95, 0.25)'
                        : isAvailable
                        ? chancesLeft === 1
                          ? 'rgba(255, 170, 0, 0.25)'
                          : 'rgba(0, 243, 255, 0.2)'
                        : 'transparent',
                      color: isUsedAndWrong
                        ? 'var(--neon-red)'
                        : chancesLeft === 1
                        ? 'var(--neon-amber)'
                        : 'var(--neon-cyan)',
                      boxShadow: isAvailable
                        ? `0 0 8px ${chancesLeft === 1 ? 'rgba(255,170,0,0.5)' : 'rgba(0,243,255,0.4)'}`
                        : 'none'
                    }}
                  >
                    {isUsedAndWrong ? '✕' : num}
                  </span>
                );
              })}
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  marginLeft: '0.2rem',
                  color:
                    chancesLeft === 2
                      ? 'var(--neon-cyan)'
                      : chancesLeft === 1
                      ? 'var(--neon-amber)'
                      : 'var(--neon-red)'
                }}
              >
                {chancesLeft}/2
              </span>
            </div>
          </div>

          {/* Code Unlock Trigger */}
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

      {/* Main Question Card */}
      <div
        className="cyber-card"
        style={{
          flex: 1,
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'rgba(9, 15, 30, 0.92)'
        }}
      >
        <div>
          {/* Question Meta Info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '0.8rem'
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--neon-cyan)',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              QUESTION 0{currentQ.question_number} // DIFFICULTY: {currentQ.difficulty.toUpperCase()}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: chancesLeft === 2 ? 'var(--neon-cyan)' : chancesLeft === 1 ? 'var(--neon-amber)' : 'var(--neon-red)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                {chancesLeft === 2 ? '2 CHANCES REMAINING' : chancesLeft === 1 ? '⚠️ 1 CHANCE REMAINING' : '0 CHANCES LEFT'}
              </span>

              {isQuestionAlreadySolved && (
                <span
                  style={{
                    color: 'var(--neon-green)',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Check size={14} /> SOLVED
                </span>
              )}
            </div>
          </div>

          {/* Question Text */}
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: '600',
              color: 'var(--text-main)',
              lineHeight: 1.6,
              marginBottom: '2rem',
              fontFamily: 'var(--font-body)',
              textTransform: 'none',
              letterSpacing: 'normal'
            }}
          >
            {currentQ.question_data.question}
          </h2>

          {/* Options Display */}
          {stage === 'A' ? (
            /* Stage A: Options Hidden for 15 seconds */
            <div
              style={{
                padding: '2.5rem 2rem',
                borderRadius: '8px',
                background: 'rgba(0, 243, 255, 0.04)',
                border: '1px dashed rgba(0, 243, 255, 0.25)',
                textAlign: 'center',
                color: 'var(--neon-cyan)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.95rem'
              }}
            >
              <div style={{ marginBottom: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span className="pulse-dot" style={{ display: 'inline-block' }} />
                <span style={{ letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700' }}>READ QUESTION STATEMENT</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                OPTIONS WILL UNLOCK IN <strong style={{ color: 'var(--neon-cyan)', fontSize: '1.15rem' }}>{stageTimer}s</strong> &bull; (2 CHANCES ALLOWED)
              </div>
            </div>
          ) : (
            /* Stage B: Options Unlocked */
            <div>
              {submissionStatus === 'attempt_failed' && (
                <div
                  style={{
                    padding: '0.85rem 1.2rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 170, 0, 0.12)',
                    border: '1px solid var(--neon-amber)',
                    color: 'var(--neon-amber)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.2rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem',
                    boxShadow: '0 0 15px rgba(255, 170, 0, 0.2)'
                  }}
                >
                  <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>INCORRECT ATTEMPT!</strong> You have <strong>1 CHANCE REMAINING</strong>. Select another option before the timer runs out!
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.9rem' }}>
                {currentQ.question_data.options.map((opt, i) => {
                  const isSelected = selectedOption === opt;
                  const isWrongAttempt = wrongOptions.has(opt);
                  const isOptionDisabled =
                    submissionStatus === 'correct' ||
                    submissionStatus === 'wrong' ||
                    isWrongAttempt ||
                    isSubmitting;

                  let optionStyle = {
                    padding: '1rem 1.4rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: 'rgba(10, 17, 36, 0.8)',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    cursor: isOptionDisabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '1rem',
                    textAlign: 'left',
                    opacity: isWrongAttempt ? 0.45 : 1
                  };

                  if (isSelected && submissionStatus === 'correct') {
                    optionStyle.borderColor = 'var(--neon-green)';
                    optionStyle.background = 'rgba(0, 255, 136, 0.15)';
                    optionStyle.color = 'var(--neon-green)';
                  } else if (isWrongAttempt) {
                    optionStyle.borderColor = 'var(--neon-red)';
                    optionStyle.background = 'rgba(255, 42, 95, 0.12)';
                    optionStyle.color = 'var(--neon-red)';
                    optionStyle.textDecoration = 'line-through';
                  }

                  return (
                    <button
                      key={i}
                      disabled={isOptionDisabled}
                      onClick={() => handleSelectOption(opt)}
                      style={optionStyle}
                      className="cyber-option-btn"
                    >
                      <span
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '4px',
                          border: '1px solid currentColor',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '700',
                          fontSize: '0.85rem',
                          flexShrink: 0
                        }}
                      >
                        {isWrongAttempt ? <X size={14} /> : String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            marginTop: '2.5rem',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Submission feedback */}
          <div>
            {submissionStatus === 'correct' && (
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
                <Check size={18} /> CORRECT! SYSTEM VERIFIED
              </span>
            )}
            {submissionStatus === 'attempt_failed' && (
              <span
                style={{
                  color: 'var(--neon-amber)',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <AlertTriangle size={18} /> ATTEMPT 1 FAILED — 1 CHANCE REMAINING
              </span>
            )}
            {submissionStatus === 'wrong' && (
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
                <X size={18} /> INCORRECT — ALL CHANCES EXHAUSTED
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.8rem' }}>
            {(submissionStatus === 'correct' || submissionStatus === 'wrong') && !isLastQuestion && (
              <button onClick={handleNextQuestion} className="cyber-btn cyber-btn-primary">
                NEXT QUESTION <ArrowRight size={16} />
              </button>
            )}

            {isLastQuestion && (submissionStatus === 'correct' || submissionStatus === 'wrong') && (
              <button
                onClick={() => {
                  soundEffects.playClick();
                  if (unlockedCodeLetters.length > 0 && !secretWord) {
                    setShowCodeModal(true);
                  } else {
                    onRoundComplete();
                  }
                }}
                className="cyber-btn cyber-btn-success"
              >
                {secretWord ? 'PROCEED TO WAITING ROOM' : 'ENTER SECURITY CODE'} <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Code Reveal Modal */}
      <CodeRevealModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        teamId={team.id}
        roundNumber={1}
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
