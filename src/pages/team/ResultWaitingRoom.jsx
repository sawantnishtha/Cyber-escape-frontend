import React, { useState, useEffect } from 'react';
import { Trophy, Users, CheckCircle2, XCircle, Clock, KeyRound } from 'lucide-react';
import { teamService } from '../../services/teamService';
import { GAME_CONFIG } from '../../constants/gameConfig';

// Official Cyber Escape round progression titles & descriptions
const CYBER_ROUND_PROGRESSION = {
  1: {
    nextRoundNum: '02',
    nextTitle: 'ROUND 02: GRIDLOCK PROTOCOL',
    fallbackWord: 'THINK'
  },
  2: {
    nextRoundNum: '03',
    nextTitle: 'ROUND 03: BINARY CONVERGENCE',
    fallbackWord: 'BEFORE'
  },
  3: {
    nextRoundNum: '04',
    nextTitle: 'ROUND 04: SYSTEM OVERRIDE',
    fallbackWord: 'YOU'
  },
  4: {
    nextRoundNum: 'FINAL',
    nextTitle: 'THE FINAL ESCAPE (MASTER RIDDLE)',
    fallbackWord: 'ESCAPE'
  }
};

export function ResultWaitingRoom({ team, roundNumber, gameSession }) {
  const [teamSelection, setTeamSelection] = useState(null);
  const [currentTeamStatus, setCurrentTeamStatus] = useState(team?.status);
  const [roundWord, setRoundWord] = useState(null);
  const [publishedTeamsList, setPublishedTeamsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const paddedRound = String(roundNumber || 1).padStart(2, '0');
  const progression = CYBER_ROUND_PROGRESSION[roundNumber] || CYBER_ROUND_PROGRESSION[1];

  useEffect(() => {
    async function loadStatus() {
      if (!team?.id) return;
      try {
        // Fetch up-to-date team details
        const updatedTeam = await teamService.getTeamDetails(team.id);
        if (updatedTeam?.status) {
          setCurrentTeamStatus(updatedTeam.status);
        }

        const selections = await teamService.getTeamSelections(team.id);
        const thisRoundSel = selections.find((s) => s.round_number === roundNumber);
        setTeamSelection(thisRoundSel || null);

        // Fetch team secret word (unlocked when selected)
        const words = await teamService.getTeamWords(team.id);
        const rWord = words.find((w) => w.round_number === roundNumber);
        const fallbackWord = GAME_CONFIG[`ROUND_${roundNumber}`]?.SECRET_WORD || progression.fallbackWord;
        setRoundWord(rWord?.word || fallbackWord || null);

        // Fetch officially published qualified teams list for this round
        const pubList = await teamService.getRoundPublishedTeams(roundNumber);
        setPublishedTeamsList(pubList || []);
      } catch (err) {
        console.error('Error fetching result scoreboard telemetry:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStatus();
    const interval = setInterval(loadStatus, 1500);
    return () => clearInterval(interval);
  }, [team?.id, roundNumber, progression.fallbackWord]);

  // Qualification status logic
  const isSelected =
    teamSelection?.selected === true ||
    currentTeamStatus === 'selected' ||
    team?.status === 'selected';

  const isEliminated =
    !isSelected &&
    (teamSelection?.selected === false ||
      currentTeamStatus === 'eliminated' ||
      team?.status === 'eliminated');

  const isPending = !isSelected && !isEliminated;

  // Make sure current team is included in published roster display if selected
  const displayRoster = [...publishedTeamsList];
  if (isSelected && team?.team_name && !displayRoster.some((t) => t.team_name === team.team_name || t.id === team.id)) {
    displayRoster.push({
      id: team.id,
      team_name: team.team_name,
      rank: displayRoster.length + 1
    });
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'calc(100vh - 56px)',
        maxHeight: 'calc(100vh - 56px)',
        overflow: 'hidden',
        padding: '0.8rem 1.6rem',
        boxSizing: 'border-box',
        width: '100%',
        position: 'relative'
      }}
    >
      {/* Cyber Background elements */}
      <div className="cyber-bg" />
      <div className="cyber-bg-radial" />

      {/* Embedded CSS for custom cyber yellow scrollbar & responsive layout */}
      <style>{`
        .cyber-scoreboard-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .cyber-scoreboard-scroll::-webkit-scrollbar-track {
          background: #080d1a;
          border-radius: 3px;
        }
        .cyber-scoreboard-scroll::-webkit-scrollbar-thumb {
          background: #ffb700;
          border-radius: 3px;
        }
        .cyber-scoreboard-scroll::-webkit-scrollbar-thumb:hover {
          background: #f59e0b;
        }
        @media (max-height: 740px) {
          .cyber-result-container {
            padding: 0.8rem 1.4rem !important;
          }
          .cyber-result-trophy {
            width: 38px !important;
            height: 38px !important;
          }
          .cyber-result-title {
            font-size: 1.5rem !important;
          }
        }
        @media (max-width: 860px) {
          .cyber-result-top-grid {
            grid-template-columns: 1fr !important;
            gap: 0.6rem !important;
          }
          .cyber-result-container {
            padding: 1.2rem !important;
          }
        }
      `}</style>

      {/* MAIN CYBER SCOREBOARD CONTAINER (VERTICALLY TALL, SPACIOUS & NON-SCROLLABLE) */}
      <div
        className="cyber-result-container"
        style={{
          width: '100%',
          maxWidth: '1240px',
          height: 'calc(100vh - 76px)',
          maxHeight: 'calc(100vh - 76px)',
          background: 'rgba(6, 11, 24, 0.96)',
          border: '1px solid rgba(255, 183, 0, 0.38)',
          borderRadius: '14px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(255, 183, 0, 0.14)',
          padding: 'clamp(1.2rem, 2.4vh, 2rem) clamp(1.6rem, 2.8vw, 2.8rem)',
          position: 'relative',
          zIndex: 1,
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}
      >
        {/* TOP SECTION: TROPHY + BADGE + HEADLINE */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            className="cyber-result-trophy"
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: '2px solid #ffb700',
              background: 'rgba(255, 183, 0, 0.12)',
              boxShadow: '0 0 24px rgba(255, 183, 0, 0.45)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.4rem'
            }}
          >
            <Trophy size={26} color="#ffb700" />
          </div>

          {/* OFFICIAL SCOREBOARD BANNER BADGE */}
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(255, 183, 0, 0.12)',
              border: '1px solid rgba(255, 183, 0, 0.5)',
              color: '#ffb700',
              padding: '0.28rem 1.8rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: '800',
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-display, inherit)',
              textShadow: '0 0 10px rgba(255, 183, 0, 0.4)',
              marginBottom: '0.3rem'
            }}
          >
            ROUND {paddedRound} OFFICIAL SCOREBOARD
          </div>

          {/* MAIN HEADLINE */}
          <h1
            className="cyber-result-title"
            style={{
              fontFamily: 'var(--font-display, inherit)',
              fontSize: 'clamp(1.9rem, 3.6vh, 2.6rem)',
              fontWeight: '900',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              color: '#ffffff',
              margin: '0.1rem 0 0 0',
              lineHeight: 1.15,
              textShadow: isSelected
                ? '0 0 24px rgba(0, 255, 136, 0.45), 0 0 45px rgba(0, 243, 255, 0.25)'
                : '0 0 20px rgba(255, 255, 255, 0.2)'
            }}
          >
            {isSelected
              ? `ROUND ${paddedRound} CLEARED!`
              : isEliminated
              ? `ROUND ${paddedRound} NOT CLEARED`
              : `ROUND ${paddedRound} IN REVIEW`}
          </h1>
        </div>

        {/* 3 TOP CARDS ROW: YOUR SQUAD | HINT WORD | SELECTION STATUS */}
        <div
          className="cyber-result-top-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'clamp(0.8rem, 1.6vw, 1.3rem)',
            width: '100%'
          }}
        >
          {/* Card 1: YOUR SQUAD */}
          <div
            style={{
              background: 'rgba(10, 18, 38, 0.94)',
              border: '1px solid rgba(255, 183, 0, 0.3)',
              borderRadius: '9px',
              padding: 'clamp(0.9rem, 1.8vh, 1.3rem) 1.2rem',
              textAlign: 'center',
              boxShadow: 'inset 0 0 16px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                fontSize: '0.76rem',
                fontWeight: '700',
                color: '#94a3b8',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '0.35rem',
                fontFamily: 'var(--font-mono, inherit)'
              }}
            >
              YOUR SQUAD
            </div>
            <div
              style={{
                fontSize: 'clamp(1.2rem, 2.4vh, 1.6rem)',
                fontWeight: '800',
                color: '#ffb700',
                letterSpacing: '1.2px',
                fontFamily: 'var(--font-display, inherit)',
                textShadow: '0 0 14px rgba(255, 183, 0, 0.3)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%'
              }}
            >
              {team?.team_name || 'Celeste\'z'}
            </div>
          </div>

          {/* Card 2 (MIDDLE): HINT WORD */}
          <div
            style={{
              background: isSelected
                ? 'rgba(0, 243, 255, 0.05)'
                : 'rgba(10, 18, 38, 0.94)',
              border: isSelected
                ? '1px solid rgba(0, 243, 255, 0.45)'
                : '1px solid rgba(0, 243, 255, 0.25)',
              borderRadius: '9px',
              padding: 'clamp(0.9rem, 1.8vh, 1.3rem) 1.2rem',
              textAlign: 'center',
              boxShadow: isSelected
                ? '0 0 20px rgba(0, 243, 255, 0.14), inset 0 0 16px rgba(0, 0, 0, 0.5)'
                : 'inset 0 0 16px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                fontSize: '0.76rem',
                fontWeight: '700',
                color: '#00f3ff',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '0.35rem',
                fontFamily: 'var(--font-mono, inherit)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <KeyRound size={13} color="#00f3ff" />
              <span>ROUND {paddedRound} HINT WORD</span>
            </div>
            <div
              style={{
                fontSize: 'clamp(1.3rem, 2.6vh, 1.75rem)',
                fontWeight: '900',
                letterSpacing: isSelected ? '4px' : '1px',
                color: isSelected ? '#00ff88' : '#64748b',
                fontFamily: 'var(--font-display, inherit)',
                textShadow: isSelected ? '0 0 18px rgba(0, 255, 136, 0.55)' : undefined,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%'
              }}
            >
              {isSelected ? (roundWord || progression.fallbackWord) : '[ LOCKED ]'}
            </div>
            <div
              style={{
                fontSize: '0.68rem',
                color: '#00f3ff',
                fontFamily: 'var(--font-mono, inherit)',
                fontWeight: '700',
                marginTop: '0.25rem',
                letterSpacing: '0.8px'
              }}
            >
              {isSelected ? '★ SAVE FOR FINAL RIDDLE' : 'QUALIFICATION REQUIRED'}
            </div>
          </div>

          {/* Card 3: SELECTION STATUS */}
          <div
            style={{
              background: isSelected
                ? 'rgba(0, 255, 136, 0.05)'
                : 'rgba(10, 18, 38, 0.94)',
              border: isSelected
                ? '1px solid rgba(0, 255, 136, 0.45)'
                : '1px solid rgba(0, 243, 255, 0.25)',
              borderRadius: '9px',
              padding: 'clamp(0.9rem, 1.8vh, 1.3rem) 1.2rem',
              textAlign: 'center',
              boxShadow: 'inset 0 0 16px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                fontSize: '0.76rem',
                fontWeight: '700',
                color: '#94a3b8',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '0.35rem',
                fontFamily: 'var(--font-mono, inherit)'
              }}
            >
              SELECTION STATUS
            </div>
            <div
              style={{
                fontSize: 'clamp(1.2rem, 2.4vh, 1.6rem)',
                fontWeight: '900',
                letterSpacing: '3px',
                fontFamily: 'var(--font-display, inherit)',
                color: isSelected
                  ? '#00ff88'
                  : isEliminated
                  ? '#ff2a5f'
                  : '#ffb700',
                textShadow: isSelected ? '0 0 20px rgba(0, 255, 136, 0.5)' : undefined
              }}
            >
              {isSelected ? 'SELECTED' : isEliminated ? 'NOT SELECTED' : 'IN REVIEW'}
            </div>
          </div>
        </div>

        {/* SQUAD SELECTION STATUS HEADER */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            color: '#ffb700',
            fontSize: '1rem',
            fontWeight: '800',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-display, inherit)'
          }}
        >
          <Users size={20} color="#ffb700" />
          <span>ROUND {paddedRound} SQUAD SELECTION STATUS</span>
        </div>

        {/* SQUAD SELECTION STATUS TABLE (SPACIOUS, TALL, SCROLLABLE ONLY IF TEAMS ARE MANY) */}
        <div
          style={{
            border: '1px solid rgba(255, 183, 0, 0.3)',
            borderRadius: '8px',
            background: 'rgba(5, 10, 22, 0.95)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: '180px',
            maxHeight: 'clamp(200px, 28vh, 280px)'
          }}
        >
          {/* Table Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 2rem',
              borderBottom: '1px solid rgba(255, 183, 0, 0.35)',
              background: 'rgba(12, 20, 42, 0.95)'
            }}
          >
            <span
              style={{
                color: '#ffb700',
                fontSize: '0.84rem',
                fontWeight: '800',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono, inherit)'
              }}
            >
              SQUAD
            </span>
            <span
              style={{
                color: '#ffb700',
                fontSize: '0.84rem',
                fontWeight: '800',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono, inherit)'
              }}
            >
              SELECTION STATUS
            </span>
          </div>

          {/* Table Body with Cyber Yellow Scrollbar (Smooth scrollable if teams are many) */}
          <div
            className="cyber-scoreboard-scroll"
            style={{
              flex: 1,
              overflowY: 'auto'
            }}
          >
            {displayRoster && displayRoster.length > 0 ? (
              displayRoster.map((sq, idx) => {
                const isCurrentSquad = sq.team_name === team?.team_name || sq.id === team?.id;
                return (
                  <div
                    key={sq.id || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.72rem 2rem',
                      borderBottom:
                        idx === displayRoster.length - 1
                          ? 'none'
                          : '1px solid rgba(255, 255, 255, 0.06)',
                      background: isCurrentSquad ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
                      borderLeft: isCurrentSquad ? '3px solid #00ff88' : '3px solid transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span
                        style={{
                          color: '#ffffff',
                          fontWeight: isCurrentSquad ? '800' : '700',
                          fontSize: '1.02rem',
                          letterSpacing: '0.4px'
                        }}
                      >
                        {sq.team_name}
                      </span>
                      {isCurrentSquad && (
                        <span
                          style={{
                            fontSize: '0.66rem',
                            fontFamily: 'var(--font-mono, inherit)',
                            color: '#00ff88',
                            background: 'rgba(0, 255, 136, 0.16)',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '3px',
                            fontWeight: '800',
                            letterSpacing: '0.5px',
                            border: '1px solid rgba(0, 255, 136, 0.4)'
                          }}
                        >
                          YOU
                        </span>
                      )}
                    </div>

                    <span
                      style={{
                        color: '#00ff88',
                        fontWeight: '800',
                        fontSize: '0.92rem',
                        letterSpacing: '1.8px',
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-mono, inherit)',
                        textShadow: '0 0 10px rgba(0, 255, 136, 0.45)'
                      }}
                    >
                      SELECTED
                    </span>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-mono, inherit)'
                }}
              >
                {loading
                  ? 'SYNCHRONIZING QUALIFIED ROSTER...'
                  : 'AWAITING OPERATOR QUALIFICATION BROADCAST...'}
              </div>
            )}
          </div>
        </div>

        {/* SQUAD SELECTION STATUS BANNER BOX */}
        <div
          style={{
            background: 'rgba(0, 255, 136, 0.08)',
            border: isSelected
              ? '1px solid rgba(0, 255, 136, 0.45)'
              : isEliminated
              ? '1px solid rgba(255, 42, 95, 0.45)'
              : '1px solid rgba(255, 183, 0, 0.45)',
            borderRadius: '8px',
            padding: '0.85rem 1.6rem',
            boxShadow: 'inset 0 0 16px rgba(0, 0, 0, 0.5)'
          }}
        >
          {isSelected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
              <CheckCircle2 size={19} color="#00ff88" style={{ flexShrink: 0 }} />
              <span
                style={{
                  color: '#00ff88',
                  fontSize: '0.84rem',
                  fontWeight: '800',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono, inherit)'
                }}
              >
                SQUAD SELECTION STATUS:
              </span>
              <span
                style={{
                  color: '#ffffff',
                  fontSize: '0.96rem',
                  fontWeight: '800',
                  letterSpacing: '0.5px'
                }}
              >
                SELECTED - PROCEED TO {progression.nextTitle}
              </span>
            </div>
          ) : isEliminated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
              <XCircle size={19} color="#ff2a5f" style={{ flexShrink: 0 }} />
              <span
                style={{
                  color: '#ff2a5f',
                  fontSize: '0.84rem',
                  fontWeight: '800',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono, inherit)'
                }}
              >
                SQUAD SELECTION STATUS:
              </span>
              <span
                style={{
                  color: '#ffffff',
                  fontSize: '0.96rem',
                  fontWeight: '800'
                }}
              >
                NOT SELECTED - THANK YOU FOR PARTICIPATING IN CYBER ESCAPE.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
              <Clock size={19} color="#ffb700" style={{ flexShrink: 0 }} />
              <span
                style={{
                  color: '#ffb700',
                  fontSize: '0.84rem',
                  fontWeight: '800',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono, inherit)'
                }}
              >
                SQUAD SELECTION STATUS:
              </span>
              <span
                style={{
                  color: '#ffffff',
                  fontSize: '0.96rem',
                  fontWeight: '800'
                }}
              >
                IN REVIEW - CENTRAL COMMAND IS COMPILING ROUND RESULTS.
              </span>
            </div>
          )}
        </div>

        {/* BOTTOM PROTOCOL BANNER BOX */}
        <div
          style={{
            background: isSelected
              ? 'rgba(0, 243, 255, 0.05)'
              : isEliminated
              ? 'rgba(255, 42, 95, 0.06)'
              : 'rgba(255, 183, 0, 0.06)',
            border: isSelected
              ? '1px solid rgba(0, 243, 255, 0.4)'
              : isEliminated
              ? '1px solid rgba(255, 42, 95, 0.4)'
              : '1px solid rgba(255, 183, 0, 0.4)',
            borderRadius: '8px',
            padding: '0.85rem 1.6rem',
            textAlign: 'center'
          }}
        >
          <span
            style={{
              color: isSelected ? '#00f3ff' : isEliminated ? '#ff2a5f' : '#ffb700',
              fontSize: '0.86rem',
              fontWeight: '800',
              letterSpacing: '1.6px',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono, inherit)'
            }}
          >
            {isSelected
              ? 'QUALIFICATION PROTOCOL PASSED. WAITING FOR SYSTEM OPERATOR TO COMMENCE NEXT ROUND.'
              : isEliminated
              ? 'QUALIFICATION PROTOCOL TERMINATED. WAITING FOR SYSTEM OPERATOR.'
              : 'EVALUATION IN PROGRESS. STAND BY FOR SYSTEM OPERATOR ANNOUNCEMENT.'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ResultWaitingRoom;
