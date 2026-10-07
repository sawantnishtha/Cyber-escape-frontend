// IN-BROWSER MULTI-TAB SIMULATOR ENGINE
// Provides robust, zero-configuration local realtime state synchronization across tabs via BroadcastChannel & LocalStorage
import { DEMO_TEAMS, DEMO_ROUND_1_QUESTIONS, DEMO_ROUND_2_CROSSWORDS, DEMO_ROUND_3_QUESTIONS, DEMO_ROUND_4_QUESTIONS } from '../constants/demoData.js';
import { GAME_CONFIG, GAME_STATES } from '../constants/gameConfig.js';

const STORAGE_KEY = 'cyber_escape_sim_state_v1';
const CHANNEL_NAME = 'cyber_escape_realtime_channel';

let inMemoryState = null;

class SimulatorEngine {
  constructor() {
    this.listeners = new Set();
    this.broadcastChannel = null;

    if (typeof window !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingBroadcast(event.data);
        };
      } catch {
        // Fallback for older browsers
        window.addEventListener('storage', (e) => {
          if (e.key === STORAGE_KEY) {
            this.notifyListeners();
          }
        });
      }
    }

    this.ensureInitialized();
  }

  ensureInitialized() {
    const existing = this.readState();
    if (!existing || !existing.gameSession) {
      const initialState = {
        gameSession: {
          id: 'session-demo',
          game_name: 'CYBER ESCAPE 2026',
          current_round: 1,
          current_state: GAME_STATES.LANDING,
          round_timer_seconds: 300,
          timer_started_at: null,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        teams: DEMO_TEAMS.map((t) => ({
          ...t,
          connected_at: null,
          created_at: new Date().toISOString()
        })),
        teamQuestions: [],
        teamCodes: [],
        teamWords: [],
        roundResults: {},
        roundSelections: [], // Immutable selection history
        finalAttempts: [],
        auditLogs: [
          {
            id: 'log-0',
            admin_id: 'SYSTEM',
            action: 'GAME_INITIALIZED',
            round_number: 1,
            created_at: new Date().toISOString(),
            metadata: { note: 'Simulation engine active' }
          }
        ],
        finalWinners: null
      };
      this.writeState(initialState);
    }
  }

  readState() {
    if (typeof window === 'undefined') {
      return inMemoryState;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : inMemoryState;
    } catch (err) {
      console.error('Error reading sim state:', err);
      return inMemoryState;
    }
  }

  writeState(state) {
    if (typeof window === 'undefined') {
      inMemoryState = state;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Error writing sim state:', err);
    }
  }

  broadcast(type, payload = {}) {
    const message = { type, payload, timestamp: Date.now() };
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(message);
    }
    this.notifyListeners(message);
  }

  handleIncomingBroadcast(message) {
    this.notifyListeners(message);
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  notifyListeners(event = { type: 'STATE_CHANGED' }) {
    const currentState = this.readState();
    this.listeners.forEach((cb) => {
      try {
        cb(currentState, event);
      } catch (err) {
        console.error('Error in listener callback:', err);
      }
    });
  }

  // --- ACTIONS ---

  resetSimulation() {
    localStorage.removeItem(STORAGE_KEY);
    this.ensureInitialized();
    this.broadcast('STATE_RESET');
    return this.readState();
  }

  getGameSession() {
    return this.readState()?.gameSession;
  }

  setGameState(newState, newRound = null) {
    const state = this.readState();
    if (!state) return null;

    const round = newRound !== null ? newRound : state.gameSession.current_round;
    state.gameSession = {
      ...state.gameSession,
      current_state: newState,
      current_round: round,
      timer_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Log admin action
    state.auditLogs.unshift({
      id: 'log-' + Date.now(),
      admin_id: 'ADMIN',
      action: 'SET_GAME_STATE',
      round_number: round,
      metadata: { new_state: newState },
      created_at: new Date().toISOString()
    });

    this.writeState(state);
    this.broadcast('GAME_STATE_CHANGED', { state: newState, round });
    return state.gameSession;
  }

  validateTeamKey(key) {
    const state = this.readState();
    if (!state) return { success: false, error: 'Database error' };

    const cleanKey = key.trim().toUpperCase();
    const team = state.teams.find((t) => t.team_key_hash.toUpperCase() === cleanKey);

    if (!team) {
      return { success: false, error: 'Invalid team key. Please check your key and try again.' };
    }

    // Mark connected
    team.connected_at = new Date().toISOString();
    this.writeState(state);
    this.broadcast('TEAM_CONNECTED', { teamId: team.id });

    return {
      success: true,
      team: { ...team },
      gameSession: { ...state.gameSession }
    };
  }

  validateAdminKey(key) {
    const cleanKey = key.trim().toUpperCase();
    const defaultKey =
      (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_DEFAULT_ADMIN_KEY) ||
      'ADMIN-CYBER-2026';
    if (cleanKey === defaultKey || cleanKey === 'ADMIN-XXXX-XXXX' || cleanKey.startsWith('ADMIN-')) {
      return {
        success: true,
        admin: {
          name: 'Chief Organizing Officer',
          role: 'superadmin',
          authenticated_at: new Date().toISOString()
        }
      };
    }
    return { success: false, error: 'Invalid admin authentication key.' };
  }

  // Submit Answer
  submitQuestionAnswer(teamId, roundNumber, questionNumber, submittedAnswer, timeTaken = 0) {
    const state = this.readState();
    if (!state) return { success: false, error: 'State unavailable' };

    // Get expected answer
    let expected = '';
    if (roundNumber === 1) {
      const q = DEMO_ROUND_1_QUESTIONS.find((item) => item.question_number === questionNumber);
      expected = q?.correct_answer || '';
    } else if (roundNumber === 3) {
      const q = DEMO_ROUND_3_QUESTIONS.find((item) => item.question_number === questionNumber);
      expected = q?.correct_answer || '';
    } else if (roundNumber === 4) {
      const q = DEMO_ROUND_4_QUESTIONS.find((item) => item.question_number === questionNumber);
      expected = q?.correct_answer || '';
    }

    const cleanExpected = String(expected).trim().toUpperCase();
    const cleanSubmitted = String(submittedAnswer).trim().toUpperCase();
    const isCorrect =
      cleanExpected === cleanSubmitted ||
      cleanExpected.replace(/\s+/g, ' ') === cleanSubmitted.replace(/\s+/g, ' ') ||
      cleanExpected.split(',').map((s) => s.trim()).join(',') === cleanSubmitted.split(',').map((s) => s.trim()).join(',');

    // Check attempts count for this team and question
    const prevAttempts = state.teamQuestions.filter(
      (tq) => tq.team_id === teamId && tq.round_number === roundNumber && tq.question_number === questionNumber
    );

    const attemptNumber = prevAttempts.length + 1;

    state.teamQuestions.push({
      id: 'tq-' + Date.now(),
      team_id: teamId,
      round_number: roundNumber,
      question_number: questionNumber,
      attempt_number: attemptNumber,
      submitted_answer: submittedAnswer,
      is_correct: isCorrect,
      time_taken_seconds: timeTaken,
      submitted_at: new Date().toISOString()
    });

    // Update roundResults
    const resultKey = `${teamId}_${roundNumber}`;
    if (!state.roundResults[resultKey]) {
      state.roundResults[resultKey] = {
        team_id: teamId,
        round_number: roundNumber,
        score: 0,
        questions_solved: 0,
        total_time_seconds: 0,
        hints_used: 0,
        attempts_count: 0,
        code_completed: false,
        completed_at: null
      };
    }

    const rRes = state.roundResults[resultKey];
    rRes.attempts_count += 1;
    rRes.total_time_seconds += timeTaken;
    if (isCorrect) {
      rRes.score += 10;
      rRes.questions_solved += 1;
    }

    this.writeState(state);
    this.broadcast('QUESTION_SUBMITTED', { teamId, roundNumber, questionNumber, isCorrect });

    // Count solved
    const solvedCount = state.teamQuestions.filter(
      (tq) => tq.team_id === teamId && tq.round_number === roundNumber && tq.is_correct
    ).length;

    return {
      success: true,
      is_correct: isCorrect,
      attempt_number: attemptNumber,
      solved_count: solvedCount
    };
  }

  requestHint(teamId, roundNumber, questionNumber) {
    const state = this.readState();
    if (!state) return { success: false };

    let hint = 'Focus on core algorithmic and architectural principles.';
    if (roundNumber === 1) {
      hint = DEMO_ROUND_1_QUESTIONS.find((q) => q.question_number === questionNumber)?.hint_data || hint;
    } else if (roundNumber === 2) {
      hint = DEMO_ROUND_2_CROSSWORDS.find((q) => q.question_number === questionNumber)?.hint_data || hint;
    } else if (roundNumber === 3) {
      hint = DEMO_ROUND_3_QUESTIONS.find((q) => q.question_number === questionNumber)?.hint_data || hint;
    } else if (roundNumber === 4) {
      hint = DEMO_ROUND_4_QUESTIONS.find((q) => q.question_number === questionNumber)?.hint_data || hint;
    }

    const resultKey = `${teamId}_${roundNumber}`;
    if (!state.roundResults[resultKey]) {
      state.roundResults[resultKey] = {
        team_id: teamId,
        round_number: roundNumber,
        score: 0,
        questions_solved: 0,
        total_time_seconds: 0,
        hints_used: 0,
        attempts_count: 0,
        code_completed: false
      };
    }
    state.roundResults[resultKey].hints_used += 1;

    state.auditLogs.unshift({
      id: 'log-' + Date.now(),
      admin_id: 'SYSTEM',
      action: 'HINT_USED',
      target_team_id: teamId,
      round_number: roundNumber,
      metadata: { question_number: questionNumber },
      created_at: new Date().toISOString()
    });

    this.writeState(state);
    this.broadcast('HINT_REQUESTED', { teamId, roundNumber, questionNumber });

    return {
      success: true,
      hint
    };
  }

  // Crossword completion in Round 2
  submitCrosswordCompletion(teamId, crosswordIndex, timeTaken = 0) {
    const state = this.readState();
    if (!state) return { success: false };

    // Record crossword as solved
    state.teamQuestions.push({
      id: 'cw-' + Date.now(),
      team_id: teamId,
      round_number: 2,
      question_number: crosswordIndex,
      attempt_number: 1,
      submitted_answer: 'SOLVED',
      is_correct: true,
      time_taken_seconds: timeTaken,
      submitted_at: new Date().toISOString()
    });

    const resultKey = `${teamId}_2`;
    if (!state.roundResults[resultKey]) {
      state.roundResults[resultKey] = {
        team_id: teamId,
        round_number: 2,
        score: 0,
        questions_solved: 0,
        total_time_seconds: 0,
        hints_used: 0,
        attempts_count: 0,
        code_completed: false
      };
    }
    state.roundResults[resultKey].questions_solved += 1;
    state.roundResults[resultKey].score += 50;
    state.roundResults[resultKey].total_time_seconds += Number(timeTaken || 0);

    this.writeState(state);
    this.broadcast('CROSSWORD_COMPLETED', { teamId, crosswordIndex });

    return { success: true };
  }

  // Verify 4-letter or combined code
  verifyRoundCode(teamId, roundNumber, submittedCode) {
    const state = this.readState();
    if (!state) return { success: false, error: 'State unavailable' };

    let expectedCode = '';
    let revealedWord = '';

    if (roundNumber === 1) {
      expectedCode = GAME_CONFIG.ROUND_1.EXPECTED_CODE;
      revealedWord = GAME_CONFIG.ROUND_1.SECRET_WORD;
    } else if (roundNumber === 2) {
      expectedCode = GAME_CONFIG.ROUND_2.EXPECTED_CODE;
      revealedWord = GAME_CONFIG.ROUND_2.SECRET_WORD;
    } else if (roundNumber === 3) {
      expectedCode = GAME_CONFIG.ROUND_3.EXPECTED_CODE;
      revealedWord = GAME_CONFIG.ROUND_3.SECRET_WORD;
    } else if (roundNumber === 4) {
      expectedCode = GAME_CONFIG.ROUND_4.EXPECTED_CODE;
      revealedWord = GAME_CONFIG.ROUND_4.SECRET_WORD;
    }

    const cleanCode = submittedCode.trim().toUpperCase();
    const isValid =
      cleanCode === expectedCode.toUpperCase() ||
      (roundNumber === 1 && cleanCode === 'CYBER1');

    if (isValid) {
      // Store team word if not already present
      const alreadyHas = state.teamWords.some((tw) => tw.team_id === teamId && tw.round_number === roundNumber);
      if (!alreadyHas) {
        state.teamWords.push({
          id: 'tw-' + Date.now(),
          team_id: teamId,
          round_number: roundNumber,
          word: revealedWord,
          unlocked_at: new Date().toISOString()
        });
      }

      const resultKey = `${teamId}_${roundNumber}`;
      if (state.roundResults[resultKey]) {
        state.roundResults[resultKey].code_completed = true;
        state.roundResults[resultKey].code_completed_at = new Date().toISOString();
      }

      this.writeState(state);
      this.broadcast('CODE_UNLOCKED', { teamId, roundNumber, word: revealedWord });

      return {
        success: true,
        valid: true,
        word: revealedWord
      };
    } else {
      return {
        success: true,
        valid: false,
        error: 'Incorrect security code. Check the unlocked letters and retry.'
      };
    }
  }

  // Submit Final Riddle Answer
  submitFinalAnswer(teamId, answer) {
    const state = this.readState();
    if (!state) return { success: false, error: 'State unavailable' };

    const prevAttempts = state.finalAttempts.filter((fa) => fa.team_id === teamId);
    if (prevAttempts.length >= GAME_CONFIG.FINAL_CHALLENGE.MAX_ATTEMPTS) {
      return { success: false, error: 'Maximum attempts reached.' };
    }

    const isCorrect = answer.trim().toUpperCase() === GAME_CONFIG.FINAL_CHALLENGE.EXPECTED_ANSWER.toUpperCase();
    const timestamp = new Date().toISOString();

    state.finalAttempts.push({
      id: 'fa-' + Date.now(),
      team_id: teamId,
      attempt_number: prevAttempts.length + 1,
      submitted_answer: answer,
      is_correct: isCorrect,
      submitted_at: timestamp
    });

    if (isCorrect) {
      // Team moves to final waiting room
      const team = state.teams.find((t) => t.id === teamId);
      if (team) {
        team.status = 'waiting';
      }

      state.auditLogs.unshift({
        id: 'log-' + Date.now(),
        admin_id: 'SYSTEM',
        action: 'FINAL_ANSWER_CORRECT',
        target_team_id: teamId,
        metadata: { timestamp },
        created_at: timestamp
      });
    }

    this.writeState(state);
    this.broadcast('FINAL_ATTEMPT_SUBMITTED', { teamId, isCorrect, timestamp });

    return {
      success: true,
      is_correct: isCorrect,
      attempts_remaining: GAME_CONFIG.FINAL_CHALLENGE.MAX_ATTEMPTS - (prevAttempts.length + 1),
      submitted_at: timestamp
    };
  }

  // Admin Confirm Round Selections
  confirmRoundSelections(roundNumber, selectedTeamIds) {
    const state = this.readState();
    if (!state) return { success: false, error: 'State unavailable' };

    const selectedSet = new Set(selectedTeamIds);
    const now = new Date().toISOString();

    state.teams.forEach((team) => {
      const isSelected = selectedSet.has(team.id);

      const existingSelIndex = state.roundSelections.findIndex(
        (rs) => rs.team_id === team.id && rs.round_number === roundNumber
      );

      const record = {
        id: 'rs-' + Date.now() + '-' + team.id,
        team_id: team.id,
        round_number: roundNumber,
        selected: isSelected,
        notes: 'confirmed',
        is_confirmed: true,
        selected_by: 'ADMIN',
        selected_at: now
      };

      if (existingSelIndex >= 0) {
        state.roundSelections[existingSelIndex] = record;
      } else {
        state.roundSelections.push(record);
      }

      if (isSelected) {
        team.current_round = roundNumber + 1;
        team.status = 'selected';
      } else {
        team.status = 'eliminated';
      }
    });

    state.auditLogs.unshift({
      id: 'log-' + Date.now(),
      admin_id: 'ADMIN',
      action: 'CONFIRM_ROUND_SELECTION',
      round_number: roundNumber,
      metadata: { selected_count: selectedTeamIds.length },
      created_at: now
    });

    this.writeState(state);
    this.broadcast('ROUND_SELECTION_CONFIRMED', { roundNumber, selectedTeamIds, notes: 'confirmed' });

    return { success: true, count: selectedTeamIds.length };
  }

  // Admin Publishes Round Selections (Interim stage - teams notified on qualified list, but secret word NOT unlocked yet)
  publishRoundSelections(roundNumber, selectedTeamIds) {
    const state = this.readState();
    if (!state) return { success: false };

    const selectedSet = new Set(selectedTeamIds);
    const now = new Date().toISOString();

    state.teams.forEach((team) => {
      const isSelected = selectedSet.has(team.id);

      const existingSelIndex = state.roundSelections.findIndex(
        (rs) => rs.team_id === team.id && rs.round_number === roundNumber
      );

      const record = {
        id: 'rs-' + Date.now() + '-' + team.id,
        team_id: team.id,
        round_number: roundNumber,
        selected: isSelected,
        notes: 'published',
        is_confirmed: false,
        selected_by: 'ADMIN',
        selected_at: now
      };

      if (existingSelIndex >= 0) {
        state.roundSelections[existingSelIndex] = record;
      } else {
        state.roundSelections.push(record);
      }

      if (isSelected) {
        team.status = 'selected';
      }
    });

    state.auditLogs.unshift({
      id: 'log-' + Date.now(),
      admin_id: 'ADMIN',
      action: 'PUBLISH_ROUND_SELECTION',
      round_number: roundNumber,
      metadata: { selected_count: selectedTeamIds.length },
      created_at: now
    });

    this.writeState(state);
    this.broadcast('ROUND_SELECTION_PUBLISHED', { roundNumber, selectedTeamIds, notes: 'published' });

    return { success: true, count: selectedTeamIds.length };
  }

  // Admin Declares Final Winners
  declareFinalWinners(winnerId, runnerUpId) {
    const state = this.readState();
    if (!state) return { success: false };

    const winner = state.teams.find((t) => t.id === winnerId);
    const runnerUp = state.teams.find((t) => t.id === runnerUpId);

    state.finalWinners = {
      winner: winner || null,
      runnerUp: runnerUp || null,
      declared_at: new Date().toISOString()
    };

    state.gameSession.current_state = GAME_STATES.FINAL_RESULT;
    state.gameSession.updated_at = new Date().toISOString();

    state.auditLogs.unshift({
      id: 'log-' + Date.now(),
      admin_id: 'ADMIN',
      action: 'FINAL_WINNERS_DECLARED',
      metadata: {
        winner: winner?.team_name,
        runnerUp: runnerUp?.team_name
      },
      created_at: new Date().toISOString()
    });

    this.writeState(state);
    this.broadcast('WINNERS_DECLARED', state.finalWinners);

    return { success: true, winners: state.finalWinners };
  }

  // Update status for a specific team (e.g. 'active', 'selected', 'eliminated', 'waiting')
  updateTeamStatus(teamId, status, roundNumber = null) {
    const state = this.readState();
    if (!state) return { success: false };

    const team = state.teams.find((t) => t.id === teamId);
    if (team) {
      team.status = status;
      if (roundNumber !== null) {
        team.current_round = roundNumber;
      }
      this.writeState(state);
      this.broadcast('TEAM_STATUS_UPDATED', { teamId, status, roundNumber });
      return { success: true, team };
    }
    return { success: false, error: 'Team not found' };
  }

  // Update status for all teams (e.g. force all to 'active' or 'selected')
  updateAllTeamsStatus(status, roundNumber = null) {
    const state = this.readState();
    if (!state) return { success: false };

    state.teams.forEach((t) => {
      t.status = status;
      if (roundNumber !== null) {
        t.current_round = roundNumber;
      }
    });

    this.writeState(state);
    this.broadcast('ALL_TEAMS_STATUS_UPDATED', { status, roundNumber });
    return { success: true, count: state.teams.length };
  }
}

export const simulatorEngine = new SimulatorEngine();
