import { gameApi } from '../api/gameApi';
import { simulatorEngine } from './simulatorEngine';
import { GAME_CONFIG, GAME_STATES } from '../constants/gameConfig';

export const roundService = {
  async getGameSession() {
    const apiSession = await gameApi.getGameSession();
    if (apiSession) return apiSession;

    return simulatorEngine.getGameSession();
  },

  getRoundConfig(roundNumber) {
    switch (roundNumber) {
      case 1:
        return GAME_CONFIG.ROUND_1;
      case 2:
        return GAME_CONFIG.ROUND_2;
      case 3:
        return GAME_CONFIG.ROUND_3;
      case 4:
        return GAME_CONFIG.ROUND_4;
      default:
        return null;
    }
  },

  // Calculate elapsed time from server-side ISO timestamp
  calculateElapsedSeconds(timerStartedAt) {
    if (!timerStartedAt) return 0;
    const started = new Date(timerStartedAt).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - started) / 1000);
    return Math.max(0, elapsed);
  },

  // State checks
  isRoundActive(gameState, roundNumber) {
    const activeStates = {
      1: GAME_STATES.R1_ACTIVE,
      2: GAME_STATES.R2_ACTIVE,
      3: GAME_STATES.R3_ACTIVE,
      4: GAME_STATES.R4_ACTIVE
    };
    return gameState === activeStates[roundNumber];
  },

  isRoundWaiting(gameState, roundNumber) {
    const waitingStates = {
      1: GAME_STATES.R1_WAITING,
      2: GAME_STATES.R2_WAITING,
      3: GAME_STATES.R3_WAITING,
      4: GAME_STATES.R4_WAITING
    };
    return gameState === waitingStates[roundNumber];
  },

  isRoundResult(gameState, roundNumber) {
    const resultStates = {
      1: GAME_STATES.R1_RESULT,
      2: GAME_STATES.R2_RESULT,
      3: GAME_STATES.R3_RESULT,
      4: GAME_STATES.R4_RESULT
    };
    return gameState === resultStates[roundNumber];
  }
};
