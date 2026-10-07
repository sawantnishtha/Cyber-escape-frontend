import { leaderboardApi } from '../api/leaderboardApi';
import { simulatorEngine } from './simulatorEngine';

export const leaderboardService = {
  async getLiveLeaderboard(currentRound = null) {
    const apiData = await leaderboardApi.fetchLeaderboardData();
    if (apiData && apiData.teams) {
      return this.aggregateLeaderboard(
        apiData.teams,
        apiData.results,
        apiData.finalAttempts,
        apiData.selections,
        currentRound
      );
    }

    const state = simulatorEngine.readState();
    if (!state) return [];

    const teams = state.teams;
    const results = Object.values(state.roundResults || {});
    const finalAttempts = state.finalAttempts || [];
    const selections = state.roundSelections || [];

    return this.aggregateLeaderboard(teams, results, finalAttempts, selections, currentRound);
  },

  aggregateLeaderboard(teams, results, finalAttempts, selections, currentRound) {
    const list = teams.map((team) => {
      const teamResults = results.filter((r) => r.team_id === team.id);

      const r1Res = teamResults.find((r) => r.round_number === 1);
      const r2Res = teamResults.find((r) => r.round_number === 2);
      const r3Res = teamResults.find((r) => r.round_number === 3);
      const r4Res = teamResults.find((r) => r.round_number === 4);

      const r1_score = r1Res ? Number(r1Res.score || 0) : 0;
      const r2_score = r2Res ? Number(r2Res.score || 0) : 0;
      const r3_score = r3Res ? Number(r3Res.score || 0) : 0;
      const r4_score = r4Res ? Number(r4Res.score || 0) : 0;

      const r1_solved = r1Res ? Number(r1Res.questions_solved || 0) : 0;
      const r2_solved = r2Res ? Number(r2Res.questions_solved || 0) : 0;
      const r3_solved = r3Res ? Number(r3Res.questions_solved || 0) : 0;
      const r4_solved = r4Res ? Number(r4Res.questions_solved || 0) : 0;

      const r1_time = r1Res ? Number(r1Res.total_time_seconds || 0) : 0;
      const r2_time = r2Res ? Number(r2Res.total_time_seconds || 0) : 0;
      const r3_time = r3Res ? Number(r3Res.total_time_seconds || 0) : 0;
      const r4_time = r4Res ? Number(r4Res.total_time_seconds || 0) : 0;

      const r1_completed = Boolean(r1Res?.code_completed);
      const r2_completed = Boolean(r2Res?.code_completed);
      const r3_completed = Boolean(r3Res?.code_completed);
      const r4_completed = Boolean(r4Res?.code_completed);

      const totalScore = r1_score + r2_score + r3_score + r4_score;
      const totalSolved = r1_solved + r2_solved + r3_solved + r4_solved;
      const totalTime = r1_time + r2_time + r3_time + r4_time;
      const totalHints = teamResults.reduce((acc, r) => acc + (r.hints_used || 0), 0);
      const totalAttempts = teamResults.reduce((acc, r) => acc + (r.attempts_count || 0), 0);

      // Check final correct attempt timestamp
      const correctFinal = finalAttempts.find((fa) => fa.team_id === team.id && fa.is_correct);

      // Check selections history
      const teamSelections = selections.filter((s) => s.team_id === team.id);

      return {
        id: team.id,
        team_name: team.team_name,
        current_round: team.current_round,
        status: team.status,
        connected: Boolean(team.connected_at),

        // Per-round breakdown
        r1_score,
        r2_score,
        r3_score,
        r4_score,

        r1_solved,
        r2_solved,
        r3_solved,
        r4_solved,

        r1_time_seconds: r1_time,
        r2_time_seconds: r2_time,
        r3_time_seconds: r3_time,
        r4_time_seconds: r4_time,

        r1_completed,
        r2_completed,
        r3_completed,
        r4_completed,

        // Global Totals
        total_score: totalScore,
        score: totalScore,
        questions_solved: totalSolved,
        total_time_seconds: totalTime,
        hints_used: totalHints,
        attempts_count: totalAttempts,
        code_completed: r1_completed || r2_completed || r3_completed || r4_completed,

        final_submission_at: correctFinal ? correctFinal.submitted_at : null,
        selections: teamSelections
      };
    });

    // Objective sorting rules for overall leaderboard:
    list.sort((a, b) => {
      if (a.final_submission_at && b.final_submission_at) {
        return new Date(a.final_submission_at).getTime() - new Date(b.final_submission_at).getTime();
      }
      if (a.final_submission_at && !b.final_submission_at) return -1;
      if (!a.final_submission_at && b.final_submission_at) return 1;

      if (b.total_score !== a.total_score) return b.total_score - a.total_score;
      if (b.questions_solved !== a.questions_solved) return b.questions_solved - a.questions_solved;
      if (a.code_completed !== b.code_completed) return a.code_completed ? -1 : 1;
      if (a.total_time_seconds !== b.total_time_seconds) return a.total_time_seconds - b.total_time_seconds;
      if (a.hints_used !== b.hints_used) return a.hints_used - b.hints_used;
      return a.attempts_count - b.attempts_count;
    });

    return list.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
  },

  /**
   * Sort teams specifically for a given round's evaluation (Tabs 2 - 5)
   * Ranked by that round's score desc, code completion, and lowest time taken!
   */
  sortTeamsForRound(teams, roundNumber) {
    if (!teams || teams.length === 0) return [];
    const sorted = [...teams];
    const scoreKey = `r${roundNumber}_score`;
    const solvedKey = `r${roundNumber}_solved`;
    const timeKey = `r${roundNumber}_time_seconds`;
    const completedKey = `r${roundNumber}_completed`;

    sorted.sort((a, b) => {
      const aTime = a[timeKey] || 0;
      const bTime = b[timeKey] || 0;

      // 1. Teams that verified the round security key / completed full round come first
      if (a[completedKey] !== b[completedKey]) {
        return a[completedKey] ? -1 : 1;
      }

      // 2. Among completed teams, FASTEST SUBMISSION TIME RANKS FIRST!
      if (a[completedKey] && b[completedKey]) {
        if (aTime > 0 && bTime > 0 && aTime !== bTime) {
          return aTime - bTime;
        }
        if (aTime > 0 && bTime === 0) return -1;
        if (bTime > 0 && aTime === 0) return 1;
      }

      // 3. Higher score in that round
      if ((b[scoreKey] || 0) !== (a[scoreKey] || 0)) {
        return (b[scoreKey] || 0) - (a[scoreKey] || 0);
      }

      // 4. More solved in that round
      if ((b[solvedKey] || 0) !== (a[solvedKey] || 0)) {
        return (b[solvedKey] || 0) - (a[solvedKey] || 0);
      }

      // 5. Fastest time for tied scores
      if (aTime > 0 && bTime > 0 && aTime !== bTime) {
        return aTime - bTime;
      }
      if (aTime > 0 && bTime === 0) return -1;
      if (bTime > 0 && aTime === 0) return 1;

      // 6. Overall total score
      if (b.total_score !== a.total_score) {
        return b.total_score - a.total_score;
      }
      return (a.team_name || '').localeCompare(b.team_name || '');
    });

    return sorted.map((team, idx) => ({
      ...team,
      round_rank: idx + 1
    }));
  }
};
