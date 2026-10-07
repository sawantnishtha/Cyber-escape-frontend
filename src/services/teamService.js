import { gameApi } from '../api/gameApi';
import { authApi } from '../api/authApi';
import { simulatorEngine } from './simulatorEngine';
import { leaderboardService } from './leaderboardService';

export const teamService = {
  async getTeamDetails(teamId) {
    const apiTeam = await authApi.getTeamProfile(teamId);
    if (apiTeam) return apiTeam;

    const state = simulatorEngine.readState();
    return state?.teams.find((t) => t.id === teamId) || null;
  },

  async getTeamWords(teamId) {
    const apiWords = await gameApi.getTeamWords(teamId);
    if (apiWords) return apiWords;

    const state = simulatorEngine.readState();
    return state?.teamWords.filter((tw) => tw.team_id === teamId) || [];
  },

  async getTeamProgress(teamId, roundNumber) {
    const apiProgress = await gameApi.getTeamProgress(teamId, roundNumber);
    if (apiProgress) return apiProgress;

    const state = simulatorEngine.readState();
    if (!state) return { totalAttempts: 0, solvedCount: 0, solvedQuestionNumbers: [] };

    const teamQ = state.teamQuestions.filter(
      (tq) => tq.team_id === teamId && tq.round_number === roundNumber
    );
    const correctQ = teamQ.filter((tq) => tq.is_correct);
    return {
      totalAttempts: teamQ.length,
      solvedCount: correctQ.length,
      solvedQuestionNumbers: correctQ.map((c) => c.question_number)
    };
  },

  async getTeamSelections(teamId) {
    const apiSelections = await gameApi.getTeamSelections(teamId);
    if (apiSelections) return apiSelections;

    const state = simulatorEngine.readState();
    return state?.roundSelections.filter((rs) => rs.team_id === teamId) || [];
  },

  /**
   * Get all officially published/qualified teams for a specific round.
   * Returns teams arranged by fastest submission time, containing rank and team_name only (no time shown).
   */
  async getRoundPublishedTeams(roundNumber) {
    try {
      const lb = await leaderboardService.getLiveLeaderboard(roundNumber);
      if (!lb || lb.length === 0) return [];

      // Filter teams selected/published for this round
      const qualified = lb.filter((t) => {
        const sel = t.selections?.find((s) => s.round_number === roundNumber);
        return sel && sel.selected;
      });

      if (qualified.length === 0) {
        // Fallback: check if teams are marked with status === 'selected' or have advanced
        const selectedTeams = lb.filter((t) => t.status === 'selected' || (t.current_round && t.current_round > roundNumber));
        if (selectedTeams.length > 0) {
          const sorted = leaderboardService.sortTeamsForRound(selectedTeams, roundNumber);
          return sorted.map((t, idx) => ({
            rank: idx + 1,
            id: t.id,
            team_name: t.team_name
          }));
        }
        return [];
      }

      // Sort strictly as per submission time
      const sorted = leaderboardService.sortTeamsForRound(qualified, roundNumber);

      // Return rank and team name ONLY (do not expose or return time)
      return sorted.map((t, idx) => ({
        rank: idx + 1,
        id: t.id,
        team_name: t.team_name
      }));
    } catch (err) {
      console.warn('Error fetching published teams for round:', err);
      return [];
    }
  }
};
