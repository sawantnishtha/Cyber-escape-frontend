import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Shield,
  KeyRound,
  Check,
  HelpCircle,
  ArrowRight,
  Grid,
  Award,
  RotateCcw,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';
import { questionService } from '../../services/questionService';
import { teamService } from '../../services/teamService';
import { CodeRevealModal } from '../../components/CodeRevealModal';
import { GAME_CONFIG } from '../../constants/gameConfig';
import { DEMO_ROUND_2_CROSSWORDS } from '../../constants/demoData';

export function Round2Page({ team, onRoundComplete }) {
  const [crosswords, setCrosswords] = useState([]);
  const [activeCrosswordIndex, setActiveCrosswordIndex] = useState(0); // 0 or 1
  const [timerSeconds, setTimerSeconds] = useState(GAME_CONFIG.ROUND_2.DURATION_PER_CROSSWORD_SECONDS);
  const [solvedCrosswords, setSolvedCrosswords] = useState(new Set());
  const [gridValues, setGridValues] = useState({}); // { 'r-c': 'A' }
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 1 });
  const [selectedDirection, setSelectedDirection] = useState('across'); // 'across' | 'down'
  const [unlockedCodeLetters, setUnlockedCodeLetters] = useState([]);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [secretWord, setSecretWord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [incorrectCells, setIncorrectCells] = useState(new Set());
  const [checkMessage, setCheckMessage] = useState(null);

  const inputRefs = useRef({});

  // Fetch crosswords & team state
  useEffect(() => {
    async function loadData() {
      try {
        setCrosswords(DEMO_ROUND_2_CROSSWORDS);

        if (team?.id) {
          const progress = await teamService.getTeamProgress(team.id, 2);
          if (progress?.solvedQuestionNumbers) {
            const solved = new Set(progress.solvedQuestionNumbers);
            setSolvedCrosswords(solved);
            updateCodeLetters(solved);
          }
          const words = await teamService.getTeamWords(team.id);
          const r2Word = words.find((w) => w.round_number === 2);
          if (r2Word) {
            setSecretWord(r2Word.word);
          }
        }
      } catch (err) {
        console.error('Error loading Round 2:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [team?.id]);

  function updateCodeLetters(solvedSet) {
    // 4-letter key 'HASH' unlocked in scrambled anagram format ['S', 'H', 'A', 'H']
    const scrambled = GAME_CONFIG.ROUND_2.SCRAMBLED_LETTERS || ['S', 'H', 'A', 'H'];
    const letters = [];
    if (solvedSet.has(1)) {
      letters.push(scrambled[0], scrambled[1]);
    }
    if (solvedSet.has(2)) {
      letters.push(scrambled[2], scrambled[3]);
    }
    setUnlockedCodeLetters(letters);
  }

  // Timer countdown
  useEffect(() => {
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
  }, [activeCrosswordIndex]);

  // Set default selected cell when changing active crossword
  useEffect(() => {
    if (crosswords[activeCrosswordIndex]) {
      const firstWord = crosswords[activeCrosswordIndex].question_data.words[0];
      if (firstWord) {
        setSelectedCell({ row: firstWord.row, col: firstWord.col });
        setSelectedDirection(firstWord.direction);
      }
      setGridValues({});
      setIncorrectCells(new Set());
      setCheckMessage(null);
    }
  }, [activeCrosswordIndex, crosswords]);

  if (loading || crosswords.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>
          <span className="pulse-dot" /> INITIALIZING CRYPTOGRAPHIC GRIDS...
        </div>
      </div>
    );
  }

  const currentCrossword = crosswords[activeCrosswordIndex];
  const { title, gridRows = 6, gridCols = 8, words } = currentCrossword.question_data;

  // Build grid layout map of active cells
  const activeCells = {};
  words.forEach((w) => {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.direction === 'across' ? w.row : w.row + i;
      const c = w.direction === 'across' ? w.col + i : w.col;
      const key = `${r}-${c}`;
      if (!activeCells[key]) {
        activeCells[key] = {
          number: i === 0 ? w.number : null,
          expectedLetter: w.answer[i],
          wordIds: [w.id],
          words: [w]
        };
      } else {
        if (i === 0 && !activeCells[key].number) {
          activeCells[key].number = w.number;
        }
        activeCells[key].wordIds.push(w.id);
        activeCells[key].words.push(w);
      }
    }
  });

  // Determine current active word based on selectedCell and selectedDirection
  const currentCellKey = `${selectedCell.row}-${selectedCell.col}`;
  const currentCellInfo = activeCells[currentCellKey];

  let activeWord = null;
  if (currentCellInfo) {
    activeWord = currentCellInfo.words.find((w) => w.direction === selectedDirection) || currentCellInfo.words[0];
  }

  // Set of cell keys belonging to currently active word
  const activeWordCells = new Set();
  if (activeWord) {
    for (let i = 0; i < activeWord.answer.length; i++) {
      const r = activeWord.direction === 'across' ? activeWord.row : activeWord.row + i;
      const c = activeWord.direction === 'across' ? activeWord.col + i : activeWord.col;
      activeWordCells.add(`${r}-${c}`);
    }
  }

  const handleCellClick = (r, c) => {
    const key = `${r}-${c}`;
    if (!activeCells[key]) return;

    soundEffects.playClick();
    if (selectedCell.row === r && selectedCell.col === c) {
      // Toggle direction if cell is an intersection
      if (activeCells[key].words.length > 1) {
        setSelectedDirection((prev) => (prev === 'across' ? 'down' : 'across'));
      }
    } else {
      setSelectedCell({ row: r, col: c });
      // If cell only belongs to one direction, snap to it
      if (activeCells[key].words.length === 1) {
        setSelectedDirection(activeCells[key].words[0].direction);
      }
    }

    if (inputRefs.current[key]) {
      inputRefs.current[key].focus();
    }
  };

  const handleClueClick = (word) => {
    soundEffects.playClick();
    setSelectedDirection(word.direction);
    setSelectedCell({ row: word.row, col: word.col });
    const key = `${word.row}-${word.col}`;
    if (inputRefs.current[key]) {
      inputRefs.current[key].focus();
    }
  };

  const handleKeyDown = (e, r, c) => {
    const key = `${r}-${c}`;
    if (!activeCells[key]) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      setGridValues((prev) => ({ ...prev, [key]: '' }));

      // Move backwards in current word
      if (activeWord) {
        const offset = activeWord.direction === 'across' ? c - activeWord.col : r - activeWord.row;
        if (offset > 0) {
          const prevR = activeWord.direction === 'across' ? r : r - 1;
          const prevC = activeWord.direction === 'across' ? c - 1 : c;
          setSelectedCell({ row: prevR, col: prevC });
          const prevKey = `${prevR}-${prevC}`;
          if (inputRefs.current[prevKey]) inputRefs.current[prevKey].focus();
        }
      }
    } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      e.preventDefault();
      const letter = e.key.toUpperCase();
      setGridValues((prev) => ({ ...prev, [key]: letter }));
      soundEffects.playTyping();

      // Clear any incorrect mark on this cell
      setIncorrectCells((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });

      // Auto-advance to next cell in current word
      if (activeWord) {
        const offset = activeWord.direction === 'across' ? c - activeWord.col : r - activeWord.row;
        if (offset < activeWord.answer.length - 1) {
          const nextR = activeWord.direction === 'across' ? r : r + 1;
          const nextC = activeWord.direction === 'across' ? c + 1 : c;
          setSelectedCell({ row: nextR, col: nextC });
          const nextKey = `${nextR}-${nextC}`;
          if (inputRefs.current[nextKey]) inputRefs.current[nextKey].focus();
        }
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      for (let nextC = c + 1; nextC < gridCols; nextC++) {
        if (activeCells[`${r}-${nextC}`]) {
          setSelectedCell({ row: r, col: nextC });
          setSelectedDirection('across');
          if (inputRefs.current[`${r}-${nextC}`]) inputRefs.current[`${r}-${nextC}`].focus();
          break;
        }
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      for (let prevC = c - 1; prevC >= 0; prevC--) {
        if (activeCells[`${r}-${prevC}`]) {
          setSelectedCell({ row: r, col: prevC });
          setSelectedDirection('across');
          if (inputRefs.current[`${r}-${prevC}`]) inputRefs.current[`${r}-${prevC}`].focus();
          break;
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      for (let nextR = r + 1; nextR < gridRows; nextR++) {
        if (activeCells[`${nextR}-${c}`]) {
          setSelectedCell({ row: nextR, col: c });
          setSelectedDirection('down');
          if (inputRefs.current[`${nextR}-${c}`]) inputRefs.current[`${nextR}-${c}`].focus();
          break;
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      for (let prevR = r - 1; prevR >= 0; prevR--) {
        if (activeCells[`${prevR}-${c}`]) {
          setSelectedCell({ row: prevR, col: c });
          setSelectedDirection('down');
          if (inputRefs.current[`${prevR}-${c}`]) inputRefs.current[`${prevR}-${c}`].focus();
          break;
        }
      }
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (activeCells[key].words.length > 1) {
        setSelectedDirection((prev) => (prev === 'across' ? 'down' : 'across'));
      }
    }
  };

  // Verify and submit current crossword
  const handleVerifyCrossword = async () => {
    soundEffects.playClick();

    const badCells = new Set();
    let isComplete = true;

    for (const [k, cellInfo] of Object.entries(activeCells)) {
      const entered = (gridValues[k] || '').trim().toUpperCase();
      if (!entered || entered !== cellInfo.expectedLetter.toUpperCase()) {
        badCells.add(k);
        isComplete = false;
      }
    }

    if (isComplete) {
      soundEffects.playAccessGranted();
      setIncorrectCells(new Set());
      const currentNumber = currentCrossword.question_number;
      const timeTaken = Math.max(1, GAME_CONFIG.ROUND_2.DURATION_PER_CROSSWORD_SECONDS - timerSeconds);
      await questionService.submitCrossword(team.id, currentNumber, timeTaken);

      const nextSolved = new Set(solvedCrosswords);
      nextSolved.add(currentNumber);
      setSolvedCrosswords(nextSolved);
      updateCodeLetters(nextSolved);

      if (currentNumber === 1 && crosswords.length > 1) {
        setCheckMessage({
          type: 'success',
          text: '✓ GRIDLOCK 1 SOLVED! UNLOCKED KEYS [T, E]. ADVANCING TO GRID 2.'
        });
        setTimeout(() => {
          setActiveCrosswordIndex(1);
          setTimerSeconds(GAME_CONFIG.ROUND_2.DURATION_PER_CROSSWORD_SECONDS);
        }, 1200);
      } else {
        setCheckMessage({
          type: 'success',
          text: '✓ ALL CROSSWORDS COMPLETED! 4-LETTER KEY [TECH] FULLY UNLOCKED.'
        });
        setTimeout(() => {
          setShowCodeModal(true);
        }, 800);
      }
    } else {
      soundEffects.playAccessDenied();
      setIncorrectCells(badCells);
      setCheckMessage({
        type: 'error',
        text: `✕ ${badCells.size} cell(s) are incorrect or empty. Red highlight indicates mismatches.`
      });
    }
  };

  const handleClearGrid = () => {
    soundEffects.playClick();
    setGridValues({});
    setIncorrectCells(new Set());
    setCheckMessage(null);
  };

  const isCrosswordSolved = solvedCrosswords.has(currentCrossword.question_number);
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;

  // Separate Across & Down clues
  const acrossClues = words.filter((w) => w.direction === 'across');
  const downClues = words.filter((w) => w.direction === 'down');

  // Helper to check if a word is completely and correctly filled
  const isWordFilled = (w) => {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.direction === 'across' ? w.row : w.row + i;
      const c = w.direction === 'across' ? w.col + i : w.col;
      const entered = (gridValues[`${r}-${c}`] || '').toUpperCase();
      if (entered !== w.answer[i]) return false;
    }
    return true;
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}
    >
      <div className="cyber-bg" />
      <div className="cyber-bg-radial" />

      {/* Header bar */}
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
            CYBER ESCAPE // ROUND 02
          </div>
          <div className="font-display glow-cyan" style={{ fontSize: '1.25rem', letterSpacing: '2px' }}>
            GRIDLOCK PROTOCOL
          </div>
        </div>

        {/* Tab selection for Crossword 1 & 2 */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveCrosswordIndex(0);
            }}
            className={`cyber-btn ${activeCrosswordIndex === 0 ? 'cyber-btn-primary' : ''}`}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
          >
            GRID 1 (ARCHITECTURE) {solvedCrosswords.has(1) && '✓'}
          </button>
          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveCrosswordIndex(1);
            }}
            className={`cyber-btn ${activeCrosswordIndex === 1 ? 'cyber-btn-primary' : ''}`}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
          >
            GRID 2 (SYSTEMS) {solvedCrosswords.has(2) && '✓'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div
            className={`cyber-timer-box ${timerSeconds <= 60 ? 'cyber-timer-danger' : timerSeconds <= 120 ? 'cyber-timer-warning' : ''}`}
          >
            <Clock size={16} /> {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
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

      {/* Main Grid & Clues Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(360px, 1.25fr) minmax(320px, 1fr)',
          gap: '1.5rem',
          flex: 1
        }}
      >
        {/* Left: Crossword Interactive Grid */}
        <div
          className="cyber-card"
          style={{
            padding: '1.8rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(8, 14, 28, 0.94)'
          }}
        >
          <div style={{ width: '100%', textAlign: 'center', marginBottom: '1.2rem' }}>
            <div
              style={{
                color: 'var(--neon-cyan)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                fontWeight: '700',
                letterSpacing: '1px',
                marginBottom: '0.4rem'
              }}
            >
              {title}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Direction: <span style={{ color: 'var(--neon-cyan)', textTransform: 'uppercase' }}>{selectedDirection}</span> | Click a cell to toggle Across / Down
            </div>
          </div>

          {/* Crossword Grid Matrix */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${gridCols}, 46px)`,
              gridTemplateRows: `repeat(${gridRows}, 46px)`,
              gap: '4px',
              padding: '12px',
              background: '#040711',
              border: '2px solid var(--border-subtle)',
              borderRadius: '8px',
              boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.8)'
            }}
          >
            {Array.from({ length: gridRows }).map((_, r) =>
              Array.from({ length: gridCols }).map((__, c) => {
                const key = `${r}-${c}`;
                const cell = activeCells[key];
                const isSelected = selectedCell.row === r && selectedCell.col === c;
                const isInActiveWord = activeWordCells.has(key);
                const isBad = incorrectCells.has(key);
                const value = gridValues[key] || '';

                if (!cell) {
                  // Solid Black block cell
                  return (
                    <div
                      key={key}
                      style={{
                        background: '#060a15',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.03)'
                      }}
                    />
                  );
                }

                return (
                  <div
                    key={key}
                    onClick={() => handleCellClick(r, c)}
                    style={{
                      position: 'relative',
                      background: isBad
                        ? 'rgba(255, 42, 95, 0.25)'
                        : isSelected
                        ? 'rgba(0, 243, 255, 0.35)'
                        : isInActiveWord
                        ? 'rgba(0, 243, 255, 0.12)'
                        : 'rgba(12, 20, 42, 0.95)',
                      border: `1.5px solid ${
                        isBad
                          ? 'var(--neon-red)'
                          : isSelected
                          ? 'var(--neon-cyan)'
                          : isInActiveWord
                          ? 'rgba(0, 243, 255, 0.5)'
                          : 'var(--border-subtle)'
                      }`,
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: isSelected
                        ? '0 0 12px var(--neon-cyan-glow)'
                        : isBad
                        ? '0 0 10px var(--neon-red-glow)'
                        : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {cell.number && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '2px',
                          left: '3px',
                          fontSize: '0.62rem',
                          color: isSelected ? '#fff' : 'var(--neon-cyan)',
                          fontFamily: 'var(--font-mono)',
                          lineHeight: 1,
                          fontWeight: '700'
                        }}
                      >
                        {cell.number}
                      </span>
                    )}
                    <input
                      ref={(el) => (inputRefs.current[key] = el)}
                      type="text"
                      maxLength={1}
                      value={value}
                      onChange={() => {}}
                      onKeyDown={(e) => handleKeyDown(e, r, c)}
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'center',
                        color: isBad ? 'var(--neon-red)' : '#ffffff',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1.3rem',
                        fontWeight: '700',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* Feedback Notice */}
          {checkMessage && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                background: checkMessage.type === 'success' ? 'rgba(0, 255, 136, 0.12)' : 'rgba(255, 42, 95, 0.12)',
                border: `1px solid ${checkMessage.type === 'success' ? 'var(--neon-green)' : 'var(--border-error)'}`,
                color: checkMessage.type === 'success' ? 'var(--neon-green)' : 'var(--neon-red)',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {checkMessage.text}
            </div>
          )}

          {/* Controls Bar */}
          <div style={{ marginTop: '1.2rem', display: 'flex', gap: '0.8rem', width: '100%', justifyContent: 'center' }}>
            <button
              onClick={handleClearGrid}
              className="cyber-btn"
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
            >
              <RotateCcw size={15} /> CLEAR
            </button>
            <button
              onClick={handleVerifyCrossword}
              className="cyber-btn cyber-btn-primary"
              style={{ padding: '0.6rem 1.8rem', fontSize: '0.9rem' }}
            >
              <Check size={16} /> VERIFY GRID
            </button>
          </div>
        </div>

        {/* Right: Technical Clues List */}
        <div
          className="cyber-card"
          style={{
            padding: '1.8rem',
            background: 'rgba(8, 14, 28, 0.94)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflowY: 'auto',
            maxHeight: '680px'
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '0.6rem',
                marginBottom: '1.2rem'
              }}
            >
              <h3 className="glow-cyan font-display" style={{ fontSize: '1.1rem', letterSpacing: '1px', margin: 0 }}>
                CLUES & SPECIFICATIONS
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>
                {words.filter(isWordFilled).length} / {words.length} SOLVED
              </span>
            </div>

            {/* Across Clues */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--neon-cyan)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '1px',
                  fontWeight: '700',
                  marginBottom: '0.6rem',
                  textTransform: 'uppercase'
                }}
              >
                // ACROSS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {acrossClues.map((w) => {
                  const isActive = activeWord?.id === w.id;
                  const isDone = isWordFilled(w);
                  return (
                    <div
                      key={w.id}
                      onClick={() => handleClueClick(w)}
                      style={{
                        padding: '0.6rem 0.8rem',
                        background: isActive
                          ? 'rgba(0, 243, 255, 0.15)'
                          : 'rgba(10, 16, 32, 0.6)',
                        border: `1px solid ${isActive ? 'var(--neon-cyan)' : 'var(--border-subtle)'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isActive ? '0 0 10px rgba(0, 243, 255, 0.2)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontWeight: '700',
                            color: isActive ? 'var(--neon-cyan)' : '#fff',
                            fontFamily: 'var(--font-mono)',
                            minWidth: '22px'
                          }}
                        >
                          {w.number}.
                        </span>
                        <span
                          style={{
                            fontSize: '0.85rem',
                            color: isDone ? 'var(--neon-green)' : 'var(--text-main)',
                            textDecoration: isDone ? 'line-through' : 'none',
                            lineHeight: '1.4'
                          }}
                        >
                          {w.clue}
                        </span>
                        {isDone && <Check size={14} color="var(--neon-green)" style={{ marginLeft: 'auto' }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Down Clues */}
            <div>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--neon-cyan)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '1px',
                  fontWeight: '700',
                  marginBottom: '0.6rem',
                  textTransform: 'uppercase'
                }}
              >
                // DOWN
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {downClues.map((w) => {
                  const isActive = activeWord?.id === w.id;
                  const isDone = isWordFilled(w);
                  return (
                    <div
                      key={w.id}
                      onClick={() => handleClueClick(w)}
                      style={{
                        padding: '0.6rem 0.8rem',
                        background: isActive
                          ? 'rgba(0, 243, 255, 0.15)'
                          : 'rgba(10, 16, 32, 0.6)',
                        border: `1px solid ${isActive ? 'var(--neon-cyan)' : 'var(--border-subtle)'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isActive ? '0 0 10px rgba(0, 243, 255, 0.2)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontWeight: '700',
                            color: isActive ? 'var(--neon-cyan)' : '#fff',
                            fontFamily: 'var(--font-mono)',
                            minWidth: '22px'
                          }}
                        >
                          {w.number}.
                        </span>
                        <span
                          style={{
                            fontSize: '0.85rem',
                            color: isDone ? 'var(--neon-green)' : 'var(--text-main)',
                            textDecoration: isDone ? 'line-through' : 'none',
                            lineHeight: '1.4'
                          }}
                        >
                          {w.clue}
                        </span>
                        {isDone && <Check size={14} color="var(--neon-green)" style={{ marginLeft: 'auto' }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Secret Code Progression Footer */}
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: 'rgba(10, 16, 32, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px'
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-dim)',
                fontFamily: 'var(--font-mono)',
                marginBottom: '0.4rem',
                textTransform: 'uppercase'
              }}
            >
              KEY UNLOCK STATUS (SCRAMBLED ANAGRAM)
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {(GAME_CONFIG.ROUND_2.SCRAMBLED_LETTERS || ['H', 'E', 'T', 'C']).map((char, idx) => {
                const unlocked = idx < unlockedCodeLetters.length;
                return (
                  <div
                    key={idx}
                    style={{
                      width: '32px',
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: unlocked ? 'rgba(0, 255, 136, 0.15)' : 'rgba(0,0,0,0.5)',
                      border: `1.5px solid ${unlocked ? 'var(--neon-green)' : 'var(--border-subtle)'}`,
                      borderRadius: '4px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '700',
                      fontSize: '1.1rem',
                      color: unlocked ? 'var(--neon-green)' : 'var(--text-dim)'
                    }}
                  >
                    {unlocked ? char : '?'}
                  </div>
                );
              })}
              {unlockedCodeLetters.length >= 4 && (
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setShowCodeModal(true);
                  }}
                  className="cyber-btn cyber-btn-success"
                  style={{ marginLeft: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                >
                  SUBMIT CODE <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Code Reveal Modal */}
      <CodeRevealModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        teamId={team.id}
        roundNumber={2}
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
