import React, { useState, useEffect, useMemo } from 'react';
import {
  Terminal,
  Play,
  Square,
  Users,
  Clock,
  CheckSquare,
  Activity,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Trophy,
  Search,
  Check,
  Radio
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';
import { adminService } from '../../services/adminService';
import { leaderboardService } from '../../services/leaderboardService';
import { ConfirmModal } from '../../components/ConfirmModal';
import { GAME_STATES } from '../../constants/gameConfig';

// Master list of all available game screens for Global Dropdown
const GLOBAL_SCREENS = [
  { value: GAME_STATES.LANDING, label: 'RULES / LOBBY (RESET)', round: 1 },
  { value: GAME_STATES.R1_WAITING, label: 'ROUND 1 WAITING ROOM', round: 1 },
  { value: GAME_STATES.R1_ACTIVE, label: 'ROUND 1 ACTIVE (MCQs)', round: 1 },
  { value: GAME_STATES.R1_RESULT, label: 'ROUND 1 RESULTS & EVALUATION', round: 1 },

  { value: GAME_STATES.R2_WAITING, label: 'ROUND 2 WAITING ROOM', round: 2 },
  { value: GAME_STATES.R2_ACTIVE, label: 'ROUND 2 ACTIVE (CROSSWORDS)', round: 2 },
  { value: GAME_STATES.R2_RESULT, label: 'ROUND 2 RESULTS & EVALUATION', round: 2 },

  { value: GAME_STATES.R3_WAITING, label: 'ROUND 3 WAITING ROOM', round: 3 },
  { value: GAME_STATES.R3_ACTIVE, label: 'ROUND 3 ACTIVE (BINARY MATRIX)', round: 3 },
  { value: GAME_STATES.R3_RESULT, label: 'ROUND 3 RESULTS & EVALUATION', round: 3 },

  { value: GAME_STATES.R4_WAITING, label: 'ROUND 4 WAITING ROOM', round: 4 },
  { value: GAME_STATES.R4_ACTIVE, label: 'ROUND 4 ACTIVE (SYSTEM OVERRIDE)', round: 4 },
  { value: GAME_STATES.R4_RESULT, label: 'ROUND 4 RESULTS & EVALUATION', round: 4 },

  { value: GAME_STATES.FINAL_WAITING, label: 'FINAL WAITING ROOM', round: 4 },
  { value: GAME_STATES.FINAL_RIDDLE, label: 'FINAL RIDDLE PROTOCOL', round: 4 },
  { value: GAME_STATES.FINAL_RESULT, label: 'OFFICIAL WINNERS PODIUM', round: 4 }
];

export function AdminDashboard({ admin, gameSession, onResetDemo }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [publishedRoundsMap, setPublishedRoundsMap] = useState({});
  const [selectionHistory, setSelectionHistory] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Per-round qualification checkbox state: { [roundNumber]: { [teamId]: boolean } }
  const [roundQualifications, setRoundQualifications] = useState({
    1: {},
    2: {},
    3: {},
    4: {}
  });
  const [hasInitializedQuals, setHasInitializedQuals] = useState(false);

  const currentState = gameSession?.current_state || GAME_STATES.LANDING;
  const currentRound = gameSession?.current_round || 1;
  const activeAdminKey =
    admin?.admin_key ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEFAULT_ADMIN_KEY) ||
    'ADM-2007';

  // Search query for team monitor
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  // Confirmation modal config
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusNotice, setStatusNotice] = useState('SYSTEM INITIALIZED. READY FOR COMMANDS.');

  // Final winners pickers
  const [selectedWinnerId, setSelectedWinnerId] = useState('');
  const [selectedRunnerUpId, setSelectedRunnerUpId] = useState('');

  // Fetch live dashboard telemetry
  const fetchData = async () => {
    try {
      const lb = await leaderboardService.getLiveLeaderboard(currentRound);
      setLeaderboard(lb);

      const history = await adminService.getAllSelectionHistory();
      setSelectionHistory(history);

      if (history && history.length > 0) {
        const pubMap = {};
        history.forEach((h) => {
          if (h.notes === 'published' || h.notes === 'confirmed') {
            pubMap[h.round_number] = true;
          }
        });
        setPublishedRoundsMap((prev) => ({ ...prev, ...pubMap }));

        // Initial sync of qualification checkboxes from database/history on first load
        if (!hasInitializedQuals) {
          const initMap = { 1: {}, 2: {}, 3: {}, 4: {} };
          history.forEach((h) => {
            if (h.selected && h.round_number >= 1 && h.round_number <= 4) {
              initMap[h.round_number][h.team_id] = true;
            }
          });
          setRoundQualifications(initMap);
          setHasInitializedQuals(true);
        }
      }

      const logs = await adminService.getAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.error('Error fetching admin telemetry:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1500);
    return () => clearInterval(interval);
  }, [currentRound, currentState]);

  const showConsoleNotice = (msg) => {
    setStatusNotice(`> ${msg}`);
  };

  // State Transition Action with instant broadcast
  const handleTransitionState = (targetState, targetRound, actionLabel, isDanger = false) => {
    soundEffects.playClick();
    setConfirmModalConfig({
      title: `${actionLabel.toUpperCase()}?`,
      message: `Broadcast game state transition to: ${targetState} (Round ${targetRound})? All synchronized team screens will update instantaneously.`,
      danger: isDanger,
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          if (targetState === GAME_STATES.LANDING || targetState === GAME_STATES.R1_WAITING) {
            await adminService.updateAllTeamsStatus('active', targetRound);
          }

          await adminService.setGameState(activeAdminKey, targetState, targetRound);
          soundEffects.playAccessGranted();
          showConsoleNotice(`BROADCAST DISPATCHED: ${actionLabel.toUpperCase()} (${targetState})`);
          fetchData();
        } catch (err) {
          alert('Failed to update state: ' + err.message);
        } finally {
          setIsProcessing(false);
          setConfirmModalConfig(null);
        }
      }
    });
  };

  // Global Dropdown Screen Change
  const handleGlobalScreenChange = (newScreenVal) => {
    const screenItem = GLOBAL_SCREENS.find((s) => s.value === newScreenVal);
    if (!screenItem) return;
    handleTransitionState(
      screenItem.value,
      screenItem.round,
      `Switch to ${screenItem.label}`,
      screenItem.value === GAME_STATES.LANDING
    );
  };

  // Toggle qualification checkbox for a specific round and team
  const toggleQualification = (teamId, roundNumber) => {
    soundEffects.playClick();
    setRoundQualifications((prev) => ({
      ...prev,
      [roundNumber]: {
        ...prev[roundNumber],
        [teamId]: !prev[roundNumber]?.[teamId]
      }
    }));
  };

  // Bulk select top teams for a given round
  const handleBulkSelectForRound = (roundNumber, count) => {
    soundEffects.playClick();
    const sorted = leaderboardService.sortTeamsForRound(leaderboard, roundNumber);
    const newMap = {};
    if (count === 'ALL') {
      sorted.forEach((t) => {
        newMap[t.id] = true;
      });
    } else if (count > 0) {
      sorted.slice(0, count).forEach((t) => {
        newMap[t.id] = true;
      });
    }
    setRoundQualifications((prev) => ({
      ...prev,
      [roundNumber]: newMap
    }));
    showConsoleNotice(`MARKED TOP ${count} SQUADS FOR ROUND ${roundNumber}`);
  };

  // One-Click Publish Round Results
  // Directly reads the selected checkboxes for this round, persists qualification,
  // updates team statuses, and transitions state to R_RESULT in one clean click!
  const handleOneClickPublishRound = (roundNumber) => {
    soundEffects.playClick();
    const roundMap = roundQualifications[roundNumber] || {};
    const selectedIds = Object.keys(roundMap).filter((id) => roundMap[id]);

    if (selectedIds.length === 0) {
      alert(`Please check at least 1 team in the Qualification column for Round ${roundNumber} before publishing results.`);
      return;
    }

    setConfirmModalConfig({
      title: `PUBLISH ROUND ${roundNumber} RESULTS?`,
      message: `You have selected ${selectedIds.length} team(s) to advance in Round ${roundNumber}.\n\nThis will publish the official scoreboard with these teams to all participant screens and advance qualified teams. Proceed?`,
      danger: false,
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          // 1. Confirm selections in database and simulator
          await adminService.confirmRoundSelections(activeAdminKey, roundNumber, selectedIds);
          // 2. Publish qualified roster
          await adminService.publishRoundSelections(activeAdminKey, roundNumber, selectedIds);

          // 3. Set game state to the corresponding RESULT state
          let resultState = GAME_STATES.R1_RESULT;
          if (roundNumber === 1) resultState = GAME_STATES.R1_RESULT;
          else if (roundNumber === 2) resultState = GAME_STATES.R2_RESULT;
          else if (roundNumber === 3) resultState = GAME_STATES.R3_RESULT;
          else if (roundNumber === 4) resultState = GAME_STATES.R4_RESULT;

          await adminService.setGameState(activeAdminKey, resultState, roundNumber);

          setPublishedRoundsMap((prev) => ({ ...prev, [roundNumber]: true }));
          soundEffects.playAccessGranted();
          showConsoleNotice(`ROUND ${roundNumber} RESULTS PUBLISHED! (${selectedIds.length} TEAMS ADVANCED)`);
          fetchData();
        } catch (err) {
          alert('Publishing failed: ' + err.message);
        } finally {
          setIsProcessing(false);
          setConfirmModalConfig(null);
        }
      }
    });
  };

  // Declare Final Winners and broadcast podium
  const handleDeclareFinalWinners = () => {
    soundEffects.playClick();
    if (!selectedWinnerId || !selectedRunnerUpId) {
      alert('Please choose both Champion (Winner) and Runner-up.');
      return;
    }
    if (selectedWinnerId === selectedRunnerUpId) {
      alert('Champion and Runner-up cannot be the same team.');
      return;
    }

    const winner = leaderboard.find((t) => t.id === selectedWinnerId);
    const runnerUp = leaderboard.find((t) => t.id === selectedRunnerUpId);

    setConfirmModalConfig({
      title: 'DECLARE WINNERS PODIUM',
      message: `Champion: ${winner?.team_name}\nRunner-up: ${runnerUp?.team_name}\n\nPublish official champion podium to all screens?`,
      danger: false,
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          await adminService.declareFinalWinners(activeAdminKey, selectedWinnerId, selectedRunnerUpId, winner?.team_name, runnerUp?.team_name);
          soundEffects.playKeyUnlocked();
          showConsoleNotice(`FINAL PODIUM PUBLISHED // WINNER: ${winner?.team_name}, RUNNER-UP: ${runnerUp?.team_name}`);
          fetchData();
        } catch (err) {
          alert('Failed to declare winners: ' + err.message);
        } finally {
          setIsProcessing(false);
          setConfirmModalConfig(null);
        }
      }
    });
  };

  // Dedicated Emergency Restart Event handler
  const handleRestartEvent = () => {
    soundEffects.playClick();
    setConfirmModalConfig({
      title: 'RESTART ENTIRE EVENT?',
      message: 'This will reset all team states to Active/Round 1, return the game session to the Lobby, clear all scores, words, and submissions, and reset all proctoring strikes. Proceed?',
      danger: true,
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          await adminService.resetEvent(activeAdminKey);
          if (onResetDemo) {
            await onResetDemo();
          }
          setRoundQualifications({ 1: {}, 2: {}, 3: {}, 4: {} });
          await fetchData();
          soundEffects.playAccessGranted();
          showConsoleNotice('EVENT RESTARTED // INITIAL DEFAULT STATE RESTORED');
        } catch (err) {
          alert('Failed to restart event: ' + err.message);
        } finally {
          setIsProcessing(false);
          setConfirmModalConfig(null);
        }
      }
    });
  };

  // Dedicated Emergency End Event handler
  const handleEndEvent = () => {
    soundEffects.playClick();
    const sorted = [...leaderboard].sort((a, b) => (a.rank || 99) - (b.rank || 99));
    const defaultWinner = sorted[0];
    const defaultRunnerUp = sorted[1];

    const winnerId = selectedWinnerId || defaultWinner?.id;
    const runnerUpId = selectedRunnerUpId || defaultRunnerUp?.id;

    const winnerName = leaderboard.find((t) => t.id === winnerId)?.team_name || defaultWinner?.team_name || 'TEAM ALPHA';
    const runnerUpName = leaderboard.find((t) => t.id === runnerUpId)?.team_name || defaultRunnerUp?.team_name || 'TEAM BETA';

    setConfirmModalConfig({
      title: 'END TOURNAMENT & DECLARE CHAMPIONS?',
      message: `Are you sure you want to conclude the event?\n\n• Champion (1st): ${winnerName}\n• Runner-up (2nd): ${runnerUpName}\n\nThis will terminate active challenges and broadcast the Official Winners Podium to all screens.`,
      danger: true,
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          if (winnerId && runnerUpId) {
            await adminService.declareFinalWinners(activeAdminKey, winnerId, runnerUpId, winnerName, runnerUpName);
          } else {
            await adminService.setGameState(activeAdminKey, GAME_STATES.FINAL_RESULT, 4);
          }
          soundEffects.playAccessGranted();
          showConsoleNotice(`TOURNAMENT CONCLUDED // CHAMPION: ${winnerName}, RUNNER-UP: ${runnerUpName}`);
          fetchData();
        } catch (err) {
          alert('Failed to end event: ' + err.message);
        } finally {
          setIsProcessing(false);
          setConfirmModalConfig(null);
        }
      }
    });
  };

  // Filtered leaderboard sorted as per time submission for the current round
  const filteredLeaderboard = useMemo(() => {
    const sorted = leaderboardService.sortTeamsForRound(leaderboard, currentRound);
    return sorted.filter((t) => {
      if (!teamSearchQuery.trim()) return true;
      const q = teamSearchQuery.toLowerCase();
      return (
        t.team_name.toLowerCase().includes(q) ||
        (t.id && t.id.toLowerCase().includes(q))
      );
    });
  }, [leaderboard, teamSearchQuery, currentRound]);

  const connectedCount = leaderboard.filter((t) => t.connected).length;

  const currentRoundTitle = useMemo(() => {
    if (currentRound === 1) return 'ROUND 01: THE FIRST BREACH';
    if (currentRound === 2) return 'ROUND 02: GRIDLOCK PROTOCOL';
    if (currentRound === 3) return 'ROUND 03: BINARY CONVERGENCE';
    if (currentRound === 4) return 'ROUND 04: SYSTEM OVERRIDE';
    return 'CYBER ESCAPE';
  }, [currentRound]);

  // Clean, high-legibility typography for Admin Operations
  const adminSans = { fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" };
  const adminMono = { fontFamily: "'Fira Code', 'Roboto Mono', Consolas, monospace", fontVariantNumeric: 'tabular-nums' };

  return (
    <div
      className="admin-dashboard-container"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '1.2rem 2rem',
        maxWidth: '1440px',
        margin: '0 auto',
        width: '100%',
        color: '#f1f5f9',
        ...adminSans
      }}
    >
      <div className="cyber-bg" />
      <div className="cyber-bg-radial" />

      {/* ============================================================== */}
      {/* 1. TOP MODULAR STATUS BAR (4 BOXES - CYBER ESCAPE THEMED) */}
      {/* ============================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* BOX 1: CURRENT MISSION */}
        <div
          style={{
            background: 'rgba(10, 17, 34, 0.88)',
            border: '1px solid rgba(0, 243, 255, 0.28)',
            borderRadius: '6px',
            padding: '0.9rem 1.2rem',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)'
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--neon-cyan)',
              ...adminSans,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '0.3rem',
              fontWeight: '700'
            }}
          >
            <Activity size={13} color="var(--neon-cyan)" /> CURRENT ROUND / MISSION
          </div>
          <div
            style={{
              fontSize: '1.15rem',
              fontWeight: '700',
              color: '#ffffff',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              ...adminSans
            }}
          >
            {currentRoundTitle}
          </div>
        </div>

        {/* BOX 2: GLOBAL LIVE SCREEN DROPDOWN */}
        <div
          style={{
            background: 'rgba(10, 17, 34, 0.88)',
            border: '1px solid rgba(255, 183, 0, 0.35)',
            borderRadius: '6px',
            padding: '0.9rem 1.2rem',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)'
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--neon-amber)',
              ...adminSans,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '0.3rem',
              fontWeight: '700'
            }}
          >
            <Radio size={13} color="var(--neon-amber)" /> GLOBAL BROADCAST SCREEN
          </div>
          <select
            value={currentState}
            onChange={(e) => handleGlobalScreenChange(e.target.value)}
            style={{
              width: '100%',
              background: '#070c1a',
              border: '1px solid rgba(255, 183, 0, 0.4)',
              borderRadius: '4px',
              color: '#ffb700',
              fontWeight: '700',
              fontSize: '0.85rem',
              ...adminSans,
              padding: '0.4rem 0.6rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {GLOBAL_SCREENS.map((s) => (
              <option key={s.value} value={s.value} style={{ background: '#0a1122', color: '#fff' }}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* BOX 3: CONNECTED PARTICIPANTS */}
        <div
          style={{
            background: 'rgba(10, 17, 34, 0.88)',
            border: '1px solid rgba(0, 243, 255, 0.28)',
            borderRadius: '6px',
            padding: '0.9rem 1.2rem',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)'
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--neon-cyan)',
              ...adminSans,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '0.3rem',
              fontWeight: '700'
            }}
          >
            <Users size={13} color="var(--neon-cyan)" /> REGISTERED AGENTS
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', ...adminMono }}>
              {leaderboard.length}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--neon-green)', fontWeight: '600' }}>
              ({connectedCount} ONLINE)
            </span>
          </div>
        </div>

        {/* BOX 4: EVENT TIMER / STATE */}
        <div
          style={{
            background: 'rgba(10, 17, 34, 0.88)',
            border: '1px solid rgba(0, 243, 255, 0.28)',
            borderRadius: '6px',
            padding: '0.9rem 1.2rem',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)'
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--neon-cyan)',
              ...adminSans,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '0.3rem',
              fontWeight: '700'
            }}
          >
            <Clock size={13} color="var(--neon-cyan)" /> EVENT STATUS
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--neon-green)', ...adminMono }}>
            {currentState.replace(/_/g, ' ')}
          </div>
        </div>
      </div>

      {/* 2. REALTIME NOTIFICATION TICKER */}
      <div
        style={{
          background: 'rgba(6, 12, 24, 0.85)',
          border: '1px solid rgba(0, 243, 255, 0.2)',
          borderRadius: '4px',
          padding: '0.5rem 1rem',
          marginBottom: '1.2rem',
          fontSize: '0.78rem',
          color: '#cbd5e1',
          ...adminMono,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Terminal size={14} color="var(--neon-cyan)" />
          <span style={{ color: 'var(--neon-cyan)', fontWeight: '700' }}>CONSOLE:</span>
          <span>{statusNotice}</span>
        </div>
        <div style={{ color: 'var(--neon-green)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="pulse-dot" style={{ background: 'var(--neon-green)' }} />
          REALTIME BROADCAST ARMED
        </div>
      </div>

      {/* 3. SUBHEADER / STATUS BAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(0, 243, 255, 0.2)',
          marginBottom: '1.5rem',
          paddingBottom: '0.5rem',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div
          style={{
            color: 'var(--neon-cyan)',
            fontSize: '0.85rem',
            fontWeight: '800',
            letterSpacing: '0.08em',
            ...adminSans,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Activity size={16} color="var(--neon-cyan)" /> LIVE EVENT CONTROL CENTER
        </div>
        <div style={{ color: '#64748b', fontSize: '0.75rem', ...adminMono }}>
          ACTIVE SQUADS: {leaderboard.length} | QUALIFIED R1: {Object.values(roundQualifications[1] || {}).filter(Boolean).length} | QUALIFIED R2: {Object.values(roundQualifications[2] || {}).filter(Boolean).length}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MAIN VIEW: ROUND CARDS + EMERGENCY + LIVE MONITOR */}
      {/* ============================================================== */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Mission / Round Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
            gap: '1.2rem',
            marginBottom: '1.8rem'
          }}
        >
          {/* CARD 1: ROUND 1 */}
          <div
            style={{
              background: 'rgba(10, 17, 34, 0.85)',
              border: '1px solid rgba(0, 243, 255, 0.28)',
              borderRadius: '8px',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem',
              backdropFilter: 'blur(12px)'
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: 'var(--neon-cyan)',
                  letterSpacing: '0.02em',
                  margin: 0,
                  ...adminSans
                }}
              >
                ROUND 1: THE FIRST BREACH
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', ...adminSans, marginTop: '0.2rem', fontWeight: '500' }}>
                MCQ FIREWALL INTRUSION PROTOCOL
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.4rem' }}>
              <button
                onClick={() => handleTransitionState(GAME_STATES.R1_ACTIVE, 1, 'Start Round 1')}
                style={{
                  background: 'linear-gradient(135deg, #ffb700, #f59e0b)',
                  color: '#000',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  ...adminSans,
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 16px rgba(255, 183, 0, 0.35)'
                }}
              >
                <Play size={16} fill="#000" /> START ROUND 1
              </button>

              <button
                onClick={() => handleTransitionState(GAME_STATES.R1_WAITING, 1, 'Open Round 1 Waiting Room')}
                style={{
                  background: 'rgba(13, 22, 44, 0.85)',
                  border: '1px solid rgba(0, 243, 255, 0.25)',
                  color: '#e2e8f0',
                  fontSize: '0.82rem',
                  ...adminSans,
                  fontWeight: '600',
                  padding: '0.65rem 1rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <Clock size={15} color="var(--neon-cyan)" /> WAITING ROOM
              </button>

              {/* ONE-CLICK PUBLISH ROUND 1 RESULTS */}
              <button
                onClick={() => handleOneClickPublishRound(1)}
                style={{
                  background: 'rgba(13, 22, 44, 0.85)',
                  border: '1px solid rgba(0, 255, 136, 0.35)',
                  color: 'var(--neon-green)',
                  fontSize: '0.82rem',
                  ...adminSans,
                  fontWeight: '700',
                  padding: '0.65rem 1rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  boxShadow:
                    Object.values(roundQualifications[1] || {}).filter(Boolean).length > 0
                      ? '0 0 12px rgba(0, 255, 136, 0.25)'
                      : undefined
                }}
              >
                <CheckSquare size={15} color="var(--neon-green)" /> PUBLISH ROUND 1 RESULTS ({Object.values(roundQualifications[1] || {}).filter(Boolean).length})
              </button>
            </div>
          </div>

          {/* CARD 2: ROUND 2 */}
          <div
            style={{
              background: 'rgba(10, 17, 34, 0.85)',
              border: '1px solid rgba(0, 243, 255, 0.28)',
              borderRadius: '8px',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem',
              backdropFilter: 'blur(12px)'
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: 'var(--neon-cyan)',
                  letterSpacing: '0.02em',
                  margin: 0,
                  ...adminSans
                }}
              >
                ROUND 2: GRIDLOCK PROTOCOL
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', ...adminSans, marginTop: '0.2rem', fontWeight: '500' }}>
                TECHNICAL CRYPTOGRAPHIC CROSSWORDS
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.4rem' }}>
              <button
                onClick={() => handleTransitionState(GAME_STATES.R2_ACTIVE, 2, 'Start Round 2')}
                style={{
                  background: 'linear-gradient(135deg, #ffb700, #f59e0b)',
                  color: '#000',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  ...adminSans,
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 16px rgba(255, 183, 0, 0.35)'
                }}
              >
                <Play size={16} fill="#000" /> START ROUND 2
              </button>

              <button
                onClick={() => handleTransitionState(GAME_STATES.R2_WAITING, 2, 'Open Round 2 Waiting Room')}
                style={{
                  background: 'rgba(13, 22, 44, 0.85)',
                  border: '1px solid rgba(0, 243, 255, 0.25)',
                  color: '#e2e8f0',
                  fontSize: '0.82rem',
                  ...adminSans,
                  fontWeight: '600',
                  padding: '0.65rem 1rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <Clock size={15} color="var(--neon-cyan)" /> WAITING ROOM
              </button>

              {/* ONE-CLICK PUBLISH ROUND 2 RESULTS */}
              <button
                onClick={() => handleOneClickPublishRound(2)}
                style={{
                  background: 'rgba(13, 22, 44, 0.85)',
                  border: '1px solid rgba(0, 255, 136, 0.35)',
                  color: 'var(--neon-green)',
                  fontSize: '0.82rem',
                  ...adminSans,
                  fontWeight: '700',
                  padding: '0.65rem 1rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  boxShadow:
                    Object.values(roundQualifications[2] || {}).filter(Boolean).length > 0
                      ? '0 0 12px rgba(0, 255, 136, 0.25)'
                      : undefined
                }}
              >
                <CheckSquare size={15} color="var(--neon-green)" /> PUBLISH ROUND 2 RESULTS ({Object.values(roundQualifications[2] || {}).filter(Boolean).length})
              </button>
            </div>
          </div>

          {/* CARD 3: ROUND 3 */}
          <div
            style={{
              background: 'rgba(10, 17, 34, 0.85)',
              border: '1px solid rgba(0, 243, 255, 0.28)',
              borderRadius: '8px',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem',
              backdropFilter: 'blur(12px)'
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: 'var(--neon-cyan)',
                  letterSpacing: '0.02em',
                  margin: 0,
                  ...adminSans
                }}
              >
                ROUND 3: BINARY CONVERGENCE
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', ...adminSans, marginTop: '0.2rem', fontWeight: '500' }}>
                ASCII DECRYPTION MATRIX STREAM
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.4rem' }}>
              <button
                onClick={() => handleTransitionState(GAME_STATES.R3_ACTIVE, 3, 'Start Round 3')}
                style={{
                  background: 'linear-gradient(135deg, #ffb700, #f59e0b)',
                  color: '#000',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  ...adminSans,
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 16px rgba(255, 183, 0, 0.35)'
                }}
              >
                <Play size={16} fill="#000" /> START ROUND 3
              </button>

              <button
                onClick={() => handleTransitionState(GAME_STATES.R3_WAITING, 3, 'Open Round 3 Waiting Room')}
                style={{
                  background: 'rgba(13, 22, 44, 0.85)',
                  border: '1px solid rgba(0, 243, 255, 0.25)',
                  color: '#e2e8f0',
                  fontSize: '0.82rem',
                  ...adminSans,
                  fontWeight: '600',
                  padding: '0.65rem 1rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <Clock size={15} color="var(--neon-cyan)" /> WAITING ROOM
              </button>

              {/* ONE-CLICK PUBLISH ROUND 3 RESULTS */}
              <button
                onClick={() => handleOneClickPublishRound(3)}
                style={{
                  background: 'rgba(13, 22, 44, 0.85)',
                  border: '1px solid rgba(0, 255, 136, 0.35)',
                  color: 'var(--neon-green)',
                  fontSize: '0.82rem',
                  ...adminSans,
                  fontWeight: '700',
                  padding: '0.65rem 1rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  boxShadow:
                    Object.values(roundQualifications[3] || {}).filter(Boolean).length > 0
                      ? '0 0 12px rgba(0, 255, 136, 0.25)'
                      : undefined
                }}
              >
                <CheckSquare size={15} color="var(--neon-green)" /> PUBLISH ROUND 3 RESULTS ({Object.values(roundQualifications[3] || {}).filter(Boolean).length})
              </button>
            </div>
          </div>

          {/* CARD 4: ROUND 4 & FINAL RIDDLE */}
          <div
            style={{
              background: 'rgba(10, 17, 34, 0.85)',
              border: '1px solid rgba(0, 243, 255, 0.28)',
              borderRadius: '8px',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem',
              backdropFilter: 'blur(12px)'
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: 'var(--neon-cyan)',
                  letterSpacing: '0.02em',
                  margin: 0,
                  ...adminSans
                }}
              >
                ROUND 4: SYSTEM OVERRIDE
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', ...adminSans, marginTop: '0.2rem', fontWeight: '500' }}>
                KERNEL CODE FILL & MASTER RIDDLE
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.4rem' }}>
              <button
                onClick={() => handleTransitionState(GAME_STATES.R4_ACTIVE, 4, 'Start Round 4')}
                style={{
                  background: 'linear-gradient(135deg, #ffb700, #f59e0b)',
                  color: '#000',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  ...adminSans,
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 16px rgba(255, 183, 0, 0.35)'
                }}
              >
                <Play size={16} fill="#000" /> START ROUND 4
              </button>

              {/* ONE-CLICK PUBLISH ROUND 4 RESULTS */}
              <button
                onClick={() => handleOneClickPublishRound(4)}
                style={{
                  background: 'rgba(13, 22, 44, 0.85)',
                  border: '1px solid rgba(0, 255, 136, 0.35)',
                  color: 'var(--neon-green)',
                  fontSize: '0.82rem',
                  ...adminSans,
                  fontWeight: '700',
                  padding: '0.65rem 1rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <CheckSquare size={15} color="var(--neon-green)" /> PUBLISH ROUND 4 RESULTS ({Object.values(roundQualifications[4] || {}).filter(Boolean).length})
              </button>

              <button
                onClick={() => handleTransitionState(GAME_STATES.FINAL_RIDDLE, 4, 'Open Final Riddle Protocol')}
                style={{
                  background: 'rgba(13, 22, 44, 0.85)',
                  border: '1px solid rgba(0, 243, 255, 0.35)',
                  color: 'var(--neon-cyan)',
                  fontSize: '0.82rem',
                  ...adminSans,
                  fontWeight: '700',
                  padding: '0.65rem 1rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={15} color="var(--neon-cyan)" /> OPEN FINAL RIDDLE
              </button>

              <button
                onClick={() => handleTransitionState(GAME_STATES.FINAL_RESULT, 4, 'Publish Winners Podium', false)}
                style={{
                  background: 'rgba(13, 22, 44, 0.85)',
                  border: '1px solid rgba(255, 183, 0, 0.3)',
                  color: 'var(--neon-amber)',
                  fontSize: '0.82rem',
                  ...adminSans,
                  fontWeight: '700',
                  padding: '0.65rem 1rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <Trophy size={15} color="var(--neon-amber)" /> PUBLISH WINNERS PODIUM
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* EMERGENCY EVENT OVERRIDE CONTROLS */}
        {/* ============================================================== */}
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--neon-red)',
              ...adminSans,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '0.6rem',
              fontWeight: '700'
            }}
          >
            <AlertTriangle size={14} color="var(--neon-red)" /> EMERGENCY EVENT OVERRIDE CONTROLS
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* RESTART EVENT BUTTON */}
            <button
              onClick={handleRestartEvent}
              disabled={isProcessing}
              style={{
                background: 'linear-gradient(135deg, #ffb700, #f59e0b)',
                color: '#000',
                fontWeight: '700',
                fontSize: '0.9rem',
                ...adminSans,
                letterSpacing: '0.03em',
                padding: '0.85rem',
                border: 'none',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.7 : 1
              }}
            >
              <RotateCcw size={16} /> {isProcessing ? 'RESTARTING...' : 'RESTART EVENT'}
            </button>

            {/* END EVENT BUTTON */}
            <button
              onClick={handleEndEvent}
              disabled={isProcessing}
              style={{
                background: '#991b1b',
                color: '#fff',
                fontWeight: '700',
                fontSize: '0.9rem',
                ...adminSans,
                letterSpacing: '0.03em',
                padding: '0.85rem',
                border: 'none',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                cursor: isProcessing ? 'not-allowed' : 'pointer'
              }}
            >
              <Square size={16} fill="#fff" /> END EVENT
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* LIVE TEAM STATUS MONITOR (EXACT MATCH TO SCREENSHOT 2) */}
        {/* ============================================================== */}
        <div
          style={{
            background: 'rgba(10, 17, 34, 0.88)',
            border: '1px solid rgba(0, 243, 255, 0.28)',
            borderRadius: '8px',
            padding: '1.4rem',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}
        >
          {/* Header and Search Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.2rem',
              paddingBottom: '0.8rem',
              borderBottom: '1px solid rgba(0, 243, 255, 0.15)'
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: '800',
                  color: 'var(--neon-amber)',
                  letterSpacing: '0.03em',
                  margin: 0,
                  ...adminSans
                }}
              >
                LIVE TEAM STATUS MONITOR
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', ...adminSans, marginTop: '0.2rem', fontWeight: '500' }}>
                CONNECTED PARTICIPANT AGENTS
              </div>
            </div>

            {/* Search and Bulk Helpers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <input
                  type="text"
                  placeholder="Search Team Name or ID..."
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#070c1a',
                    border: '1px solid rgba(0, 243, 255, 0.3)',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '0.82rem',
                    ...adminSans,
                    padding: '0.45rem 0.6rem 0.45rem 2rem'
                  }}
                />
                <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neon-cyan)' }} />
              </div>

              <span style={{ fontSize: '0.72rem', color: '#64748b', ...adminSans, fontWeight: '600' }}>Mark Top 10:</span>
              {[1, 2, 3, 4].map((rNum) => (
                <button
                  key={rNum}
                  onClick={() => handleBulkSelectForRound(rNum, 10)}
                  style={{
                    background: 'rgba(13, 22, 44, 0.85)',
                    border: '1px solid rgba(0, 243, 255, 0.3)',
                    color: 'var(--neon-cyan)',
                    fontSize: '0.72rem',
                    ...adminSans,
                    fontWeight: '700',
                    padding: '0.35rem 0.55rem',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                  title={`Mark Top 10 for Round ${rNum}`}
                >
                  R{rNum}
                </button>
              ))}
              <button
                onClick={() => setRoundQualifications({ 1: {}, 2: {}, 3: {}, 4: {} })}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 42, 95, 0.3)',
                  color: 'var(--neon-red)',
                  fontSize: '0.72rem',
                  ...adminSans,
                  fontWeight: '600',
                  padding: '0.35rem 0.55rem',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
                title="Clear all qualifications"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="cyber-table-container">
            <table className="cyber-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0, 243, 255, 0.2)' }}>
                  <th style={{ color: 'var(--neon-amber)', ...adminSans, fontSize: '0.75rem', fontWeight: '800', padding: '0.8rem 0.6rem', letterSpacing: '0.04em' }}>TEAM NAME</th>
                  <th style={{ color: 'var(--neon-amber)', ...adminSans, fontSize: '0.75rem', fontWeight: '800', padding: '0.8rem 0.6rem', letterSpacing: '0.04em' }}>CURRENT MISSION</th>
                  <th style={{ color: 'var(--neon-amber)', ...adminSans, fontSize: '0.75rem', fontWeight: '800', padding: '0.8rem 0.6rem', letterSpacing: '0.04em' }}>CURRENT SCREEN</th>
                  <th style={{ color: 'var(--neon-amber)', ...adminSans, fontSize: '0.75rem', fontWeight: '800', padding: '0.8rem 0.6rem', letterSpacing: '0.04em' }}>QUALIFICATION</th>
                  <th style={{ color: 'var(--neon-amber)', ...adminSans, fontSize: '0.75rem', fontWeight: '800', padding: '0.8rem 0.6rem', letterSpacing: '0.04em' }}>STATUS</th>
                  <th style={{ color: 'var(--neon-amber)', ...adminSans, fontSize: '0.75rem', fontWeight: '800', padding: '0.8rem 0.6rem', letterSpacing: '0.04em' }}>M1 SCORE</th>
                  <th style={{ color: 'var(--neon-amber)', ...adminSans, fontSize: '0.75rem', fontWeight: '800', padding: '0.8rem 0.6rem', letterSpacing: '0.04em' }}>M2 SCORE</th>
                  <th style={{ color: 'var(--neon-amber)', ...adminSans, fontSize: '0.75rem', fontWeight: '800', padding: '0.8rem 0.6rem', letterSpacing: '0.04em' }}>M3 SCORE</th>
                  <th style={{ color: 'var(--neon-amber)', ...adminSans, fontSize: '0.75rem', fontWeight: '800', padding: '0.8rem 0.6rem', letterSpacing: '0.04em' }}>TOTAL PTS</th>
                  <th style={{ color: 'var(--neon-amber)', ...adminSans, fontSize: '0.75rem', fontWeight: '800', padding: '0.8rem 0.6rem', letterSpacing: '0.04em' }}>SUBMISSION</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.map((team) => {
                  const isEliminated = team.status === 'eliminated';
                  const isAnyChecked =
                    Boolean(roundQualifications[1]?.[team.id]) ||
                    Boolean(roundQualifications[2]?.[team.id]) ||
                    Boolean(roundQualifications[3]?.[team.id]) ||
                    Boolean(roundQualifications[4]?.[team.id]);

                  return (
                    <tr
                      key={team.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        background: isAnyChecked ? 'rgba(0, 243, 255, 0.04)' : undefined
                      }}
                    >
                      {/* TEAM NAME */}
                      <td style={{ padding: '0.75rem 0.6rem', fontWeight: '600', color: '#fff', ...adminSans }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--neon-amber)', fontWeight: '700', fontSize: '0.82rem', ...adminSans }}>
                            #{team.round_rank || team.rank}
                          </span>
                          {team.connected && <span className="pulse-dot" style={{ background: 'var(--neon-green)' }} />}
                          <span>{team.team_name}</span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', ...adminMono }}>
                          ID: {team.id?.slice(0, 10)}...
                        </div>
                      </td>

                      {/* CURRENT MISSION */}
                      <td style={{ padding: '0.75rem 0.6rem', ...adminSans, fontSize: '0.82rem', fontWeight: '500', color: '#cbd5e1' }}>
                        Mission {team.current_round || 1}
                      </td>

                      {/* CURRENT SCREEN */}
                      <td style={{ padding: '0.75rem 0.6rem', ...adminSans, fontSize: '0.8rem' }}>
                        {isEliminated ? (
                          <span style={{ color: 'var(--neon-red)', fontWeight: '600' }}>Eliminated</span>
                        ) : currentState === GAME_STATES.LANDING ? (
                          <span style={{ color: '#94a3b8' }}>Lobby (M1)</span>
                        ) : currentState.includes('WAITING') ? (
                          <span style={{ color: 'var(--neon-amber)', fontWeight: '600' }}>Press Start</span>
                        ) : currentState.includes('ACTIVE') ? (
                          <span style={{ color: 'var(--neon-green)', fontWeight: '600' }}>Active (M{team.current_round || 1})</span>
                        ) : (
                          <span style={{ color: 'var(--neon-cyan)', fontWeight: '600' }}>Results (M{currentRound})</span>
                        )}
                      </td>

                      {/* QUALIFICATION - FOUR CHECKBOXES FOR ROUNDS 1, 2, 3, 4 */}
                      <td style={{ padding: '0.75rem 0.6rem' }}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(88px, 1fr))',
                            gap: '0.35rem',
                            minWidth: '180px'
                          }}
                        >
                          {[1, 2, 3, 4].map((rNum) => {
                            const isChecked = Boolean(roundQualifications[rNum]?.[team.id]);
                            return (
                              <label
                                key={rNum}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  cursor: 'pointer',
                                  fontSize: '0.73rem',
                                  ...adminSans,
                                  fontWeight: isChecked ? '700' : '500',
                                  color: isChecked ? 'var(--neon-green)' : '#94a3b8',
                                  background: isChecked ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
                                  padding: '0.15rem 0.35rem',
                                  borderRadius: '3px',
                                  border: isChecked ? '1px solid rgba(0, 255, 136, 0.3)' : '1px solid transparent'
                                }}
                                title={`Select ${team.team_name} for Round ${rNum}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleQualification(team.id, rNum)}
                                  style={{
                                    accentColor: 'var(--neon-cyan)',
                                    cursor: 'pointer',
                                    width: '14px',
                                    height: '14px'
                                  }}
                                />
                                <span>Qualify R{rNum}</span>
                              </label>
                            );
                          })}
                        </div>
                      </td>

                      {/* STATUS - CLEAN STATUS PILL (ACTIVE DROPDOWN REMOVED) */}
                      <td style={{ padding: '0.75rem 0.6rem' }}>
                        <span
                          className={`status-pill status-pill-${team.status || 'active'}`}
                          style={{
                            fontSize: '0.72rem',
                            ...adminSans,
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          {team.connected && <span className="pulse-dot" style={{ background: 'var(--neon-green)', width: 6, height: 6 }} />}
                          {team.status === 'selected'
                            ? `Online QUALIFIED_M${team.current_round || 1}`
                            : (team.status || 'ACTIVE').toUpperCase()}
                        </span>
                      </td>

                      {/* M1 SCORE */}
                      <td style={{ padding: '0.75rem 0.6rem', ...adminSans, fontVariantNumeric: 'tabular-nums', fontWeight: '600', color: '#cbd5e1' }}>
                        {team.r1_score > 0 || currentRound >= 1 ? `${team.r1_score || 0} PTS` : '—'}
                      </td>

                      {/* M2 SCORE */}
                      <td style={{ padding: '0.75rem 0.6rem', ...adminSans, fontVariantNumeric: 'tabular-nums', fontWeight: '600', color: '#cbd5e1' }}>
                        {team.r2_score > 0 || currentRound >= 2 ? `${team.r2_score || 0} PTS` : '—'}
                      </td>

                      {/* M3 SCORE */}
                      <td style={{ padding: '0.75rem 0.6rem', ...adminSans, fontVariantNumeric: 'tabular-nums', fontWeight: '600', color: '#cbd5e1' }}>
                        {team.r3_score > 0 || currentRound >= 3 ? `${team.r3_score || 0} PTS` : '—'}
                      </td>

                      {/* TOTAL PTS */}
                      <td style={{ padding: '0.75rem 0.6rem', ...adminSans, fontVariantNumeric: 'tabular-nums', fontWeight: '800', color: 'var(--neon-amber)' }}>
                        {team.total_score || 0} PTS
                      </td>

                      {/* SUBMISSION */}
                      <td style={{ padding: '0.75rem 0.6rem' }}>
                        <div
                          style={{
                            maxWidth: '240px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.7rem',
                            color: '#64748b',
                            ...adminMono
                          }}
                          title={team.questions_solved > 0 ? `${team.questions_solved} challenges solved in ${team.total_time_seconds || 0}s` : '--'}
                        >
                          {team.questions_solved > 0 ? (
                            <span style={{ color: '#94a3b8' }}>
                              {`[{"solved":${team.questions_solved},"time":${team.total_time_seconds || 0},"m1":${team.r1_score || 0}}]`}
                            </span>
                          ) : (
                            '--'
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModalConfig && (
        <ConfirmModal
          isOpen={Boolean(confirmModalConfig)}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          danger={confirmModalConfig.danger}
          onConfirm={confirmModalConfig.onConfirm}
          onCancel={() => setConfirmModalConfig(null)}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
