import { adminApi } from '../api/adminApi';
import { gameApi } from '../api/gameApi';
import { simulatorEngine } from './simulatorEngine.js';

export const adminService = {
  // Validate if transition is permitted (Admin has master override authority)
  canTransition(currentState, targetState) {
    return true; // Admin has full authority at any time
  },

  // Transition game state
  async setGameState(adminKey, newState, roundNumber = null) {
    const apiRes = await adminApi.setGameState(adminKey, newState, roundNumber || 1);

    // Always broadcast across local tabs via BroadcastChannel as well
    const simSession = simulatorEngine.setGameState(newState, roundNumber);
    simulatorEngine.broadcast('STATE_CHANGED', { state: newState, round: roundNumber || 1 });
    return apiRes.data || simSession;
  },

  // Direct status update for an individual team
  async updateTeamStatus(teamId, status, roundNumber = null) {
    await gameApi.updateTeamStatus(teamId, status, roundNumber);

    // Always broadcast across local tabs and sync local state
    const res = simulatorEngine.updateTeamStatus(teamId, status, roundNumber);
    simulatorEngine.broadcast('TEAM_STATUS_CHANGED', { teamId, status, round: roundNumber });
    return res;
  },

  // Direct status update for all teams (e.g. bring everyone into active/selected)
  async updateAllTeamsStatus(status, roundNumber = null) {
    return simulatorEngine.updateAllTeamsStatus(status, roundNumber);
  },

  // Step 1: Publish selected teams list (notifies teams on roster, secret word remains locked)
  async publishRoundSelections(adminKey, roundNumber, selectedTeamIds) {
    const apiRes = await adminApi.publishRoundSelections(adminKey, roundNumber, selectedTeamIds);

    // Always sync simulator and broadcast
    const simRes = simulatorEngine.publishRoundSelections(roundNumber, selectedTeamIds);
    simulatorEngine.broadcast('SELECTIONS_PUBLISHED', { round: roundNumber, selectedCount: selectedTeamIds.length, selectedTeamIds });
    return apiRes.success ? apiRes : simRes;
  },

  // Step 2: Confirm selection of teams advancing to the next round & unlock secret words
  async confirmRoundSelections(adminKey, roundNumber, selectedTeamIds) {
    const apiRes = await adminApi.confirmRoundSelections(adminKey, roundNumber, selectedTeamIds);

    // Always sync simulator and broadcast
    const simRes = simulatorEngine.confirmRoundSelections(roundNumber, selectedTeamIds);
    simulatorEngine.broadcast('SELECTIONS_CONFIRMED', { round: roundNumber, selectedCount: selectedTeamIds.length, selectedTeamIds });
    return apiRes.data || simRes;
  },

  // Fetch all selection history across all rounds
  async getAllSelectionHistory() {
    const apiData = await adminApi.getAllSelectionHistory();
    if (apiData) return apiData;

    const state = simulatorEngine.readState();
    return state?.roundSelections || [];
  },

  // Declare final Winner and Runner-up & End Event
  async declareFinalWinners(adminKey, winnerId, runnerUpId, winnerName = null, runnerUpName = null) {
    await adminApi.declareFinalWinners(adminKey, winnerId, runnerUpId, winnerName, runnerUpName);
    const res = simulatorEngine.declareFinalWinners(winnerId, runnerUpId);
    simulatorEngine.broadcast('WINNERS_DECLARED', { winnerId, runnerUpId, winnerName, runnerUpName });
    simulatorEngine.broadcast('STATE_CHANGED', { state: 'FINAL_RESULT', round: 4 });
    return res;
  },

  // Fetch audit logs
  async getAuditLogs() {
    const apiData = await adminApi.getAuditLogs();
    if (apiData) return apiData;

    const state = simulatorEngine.readState();
    return state?.auditLogs || [];
  },

  // Full Reset of Competition Event (Supabase + Local Simulator + Anti-cheat strikes)
  async resetEvent(adminKey = 'ADM-2007') {
    // 1. Backend Reset via adminApi (sets session to LANDING, round 1, resets teams & deletes scores)
    await adminApi.resetEvent(adminKey);

    // 2. Clear all local proctoring strikes in localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('cyber_escape_strikes_')) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (e) {
      // ignore
    }

    // 3. Reset Local Simulator & Broadcast across all tabs
    const simResult = simulatorEngine.resetSimulation();
    simulatorEngine.broadcast('EVENT_RESTARTED', { timestamp: new Date().toISOString() });
    simulatorEngine.broadcast('STATE_CHANGED', { state: 'LANDING', round: 1 });

    return simResult;
  },

  // Reset demo simulation (alias for resetEvent)
  async resetDemoGame() {
    return this.resetEvent();
  }
};
