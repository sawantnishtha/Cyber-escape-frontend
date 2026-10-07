import React, { useState, useEffect } from 'react';
import { WaitingRoom } from './WaitingRoom';
import { ResultWaitingRoom } from './ResultWaitingRoom';
import { Round1Page } from './Round1Page';
import { Round2Page } from './Round2Page';
import { Round3Page } from './Round3Page';
import { Round4Page } from './Round4Page';
import { FinalRiddlePage } from './FinalRiddlePage';
import { FinalWaitingRoom } from './FinalWaitingRoom';
import { FinalWinnersScreen } from './FinalWinnersScreen';
import { ProctoringGuard } from '../../components/ProctoringGuard';
import { teamService } from '../../services/teamService';
import { adminService } from '../../services/adminService';
import { leaderboardService } from '../../services/leaderboardService';
import { GAME_STATES } from '../../constants/gameConfig';
import { simulatorEngine } from '../../services/simulatorEngine';

export function TeamApp({ team, gameSession, onTeamStateChange }) {
  const [currentTeam, setCurrentTeam] = useState(team);
  const [winnersData, setWinnersData] = useState(null);
  const [completedRoundWaiting, setCompletedRoundWaiting] = useState(null);

  const currentState = gameSession?.current_state || GAME_STATES.LANDING;
  const currentRound = gameSession?.current_round || 1;

  // Sync team details on update
  useEffect(() => {
    async function syncTeam() {
      if (!team?.id) return;
      try {
        const updated = await teamService.getTeamDetails(team.id);
        if (updated) {
          setCurrentTeam(updated);
        }
      } catch (err) {
        console.error('Error syncing team:', err);
      }
    }
    syncTeam();
  }, [team?.id, gameSession?.current_state, gameSession?.current_round]);

  // Handle final winners detection
  useEffect(() => {
    async function checkWinners() {
      if (currentState === GAME_STATES.FINAL_RESULT) {
        // 1. Check simulator engine
        const simState = simulatorEngine.readState();
        if (simState?.finalWinners) {
          setWinnersData(simState.finalWinners);
          return;
        }

        // 2. Check Supabase audit log
        try {
          const logs = await adminService.getAuditLogs();
          const winLog = logs.find((l) => l.action === 'FINAL_WINNERS_DECLARED');
          if (winLog?.metadata) {
            setWinnersData({
              winner: { team_name: winLog.metadata.winner || winLog.metadata.winner_name || 'TEAM ALPHA' },
              runnerUp: { team_name: winLog.metadata.runner_up || winLog.metadata.runner_up_name || 'TEAM BETA' }
            });
            return;
          }
        } catch (e) {
          // ignore
        }

        // 3. Fallback to top 2 from leaderboard
        try {
          const lb = await leaderboardService.getLiveLeaderboard();
          if (lb && lb.length >= 2) {
            setWinnersData({
              winner: lb[0],
              runnerUp: lb[1]
            });
          }
        } catch (e) {
          // ignore
        }
      }
    }
    checkWinners();
  }, [currentState]);

  // Check if team already completed current round
  useEffect(() => {
    async function checkCompletion() {
      if (!team?.id) return;
      try {
        const words = await teamService.getTeamWords(team.id);
        const thisRoundWord = words.find((w) => w.round_number === currentRound);
        if (thisRoundWord) {
          setCompletedRoundWaiting(currentRound);
        } else {
          setCompletedRoundWaiting(null);
        }
      } catch (err) {
        // ignore
      }
    }
    checkCompletion();
  }, [team?.id, currentRound, currentState]);

  // If game is in Final Result, show podium to everyone
  if (currentState === GAME_STATES.FINAL_RESULT) {
    return <FinalWinnersScreen winners={winnersData} />;
  }

  // If team is eliminated and game has moved beyond Round 1, show Not Selected screen
  const isPostRound1 = [
    GAME_STATES.R2_WAITING, GAME_STATES.R2_ACTIVE, GAME_STATES.R2_RESULT,
    GAME_STATES.R3_WAITING, GAME_STATES.R3_ACTIVE, GAME_STATES.R3_RESULT,
    GAME_STATES.R4_WAITING, GAME_STATES.R4_ACTIVE, GAME_STATES.R4_RESULT,
    GAME_STATES.FINAL_RIDDLE, GAME_STATES.FINAL_WAITING
  ].includes(currentState);

  const renderActiveScreen = () => {
    if (isPostRound1 && currentTeam?.status === 'eliminated') {
      return <ResultWaitingRoom team={currentTeam} roundNumber={currentTeam?.current_round || 1} gameSession={gameSession} />;
    }

    // If team has submitted final riddle, show Final Waiting Room
    if (currentState === GAME_STATES.FINAL_WAITING) {
      return <FinalWaitingRoom team={currentTeam} gameSession={gameSession} />;
    }

    // Final Riddle
    if (currentState === GAME_STATES.FINAL_RIDDLE) {
      return (
        <FinalRiddlePage
          team={currentTeam}
          onFinalAnswerAccepted={() => {
            // Handled via realtime state change
          }}
        />
      );
    }

    // Round 1
    if (currentState === GAME_STATES.R1_WAITING) {
      return <WaitingRoom team={currentTeam} roundNumber={1} gameSession={gameSession} />;
    }
    if (currentState === GAME_STATES.R1_ACTIVE) {
      if (completedRoundWaiting === 1) {
        return <WaitingRoom team={currentTeam} roundNumber={1} gameSession={gameSession} isCompletedSubmission={true} />;
      }
      return <Round1Page team={currentTeam} onRoundComplete={() => setCompletedRoundWaiting(1)} />;
    }
    if (currentState === GAME_STATES.R1_RESULT) {
      return <ResultWaitingRoom team={currentTeam} roundNumber={1} gameSession={gameSession} />;
    }

    // Round 2
    if (currentState === GAME_STATES.R2_WAITING) {
      return <WaitingRoom team={currentTeam} roundNumber={2} gameSession={gameSession} />;
    }
    if (currentState === GAME_STATES.R2_ACTIVE) {
      if (completedRoundWaiting === 2) {
        return <WaitingRoom team={currentTeam} roundNumber={2} gameSession={gameSession} isCompletedSubmission={true} />;
      }
      return <Round2Page team={currentTeam} onRoundComplete={() => setCompletedRoundWaiting(2)} />;
    }
    if (currentState === GAME_STATES.R2_RESULT) {
      return <ResultWaitingRoom team={currentTeam} roundNumber={2} gameSession={gameSession} />;
    }

    // Round 3
    if (currentState === GAME_STATES.R3_WAITING) {
      return <WaitingRoom team={currentTeam} roundNumber={3} gameSession={gameSession} />;
    }
    if (currentState === GAME_STATES.R3_ACTIVE) {
      if (completedRoundWaiting === 3) {
        return <WaitingRoom team={currentTeam} roundNumber={3} gameSession={gameSession} isCompletedSubmission={true} />;
      }
      return <Round3Page team={currentTeam} onRoundComplete={() => setCompletedRoundWaiting(3)} />;
    }
    if (currentState === GAME_STATES.R3_RESULT) {
      return <ResultWaitingRoom team={currentTeam} roundNumber={3} gameSession={gameSession} />;
    }

    // Round 4
    if (currentState === GAME_STATES.R4_WAITING) {
      return <WaitingRoom team={currentTeam} roundNumber={4} gameSession={gameSession} />;
    }
    if (currentState === GAME_STATES.R4_ACTIVE) {
      if (completedRoundWaiting === 4) {
        return <WaitingRoom team={currentTeam} roundNumber={4} gameSession={gameSession} isCompletedSubmission={true} />;
      }
      return <Round4Page team={currentTeam} onRoundComplete={() => setCompletedRoundWaiting(4)} />;
    }
    if (currentState === GAME_STATES.R4_RESULT) {
      return <ResultWaitingRoom team={currentTeam} roundNumber={4} gameSession={gameSession} />;
    }

    // Default fallback to Waiting Room 1
    return <WaitingRoom team={currentTeam} roundNumber={1} gameSession={gameSession} />;
  };

  return (
    <ProctoringGuard team={currentTeam} isActive={currentState !== GAME_STATES.LANDING}>
      {renderActiveScreen()}
    </ProctoringGuard>
  );
}
