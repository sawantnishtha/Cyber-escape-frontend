import { apiClient } from './apiClient';

/**
 * Game Session & Progress API endpoints to communicate with backend
 */
export const gameApi = {
  /**
   * Fetch current active game session from backend
   */
  async getGameSession() {
    if (!apiClient.isConfigured()) return null;
    try {
      const { data, error } = await apiClient.from('game_session').select('*').limit(1).single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[gameApi] getGameSession error:', err);
      return null;
    }
  },

  /**
   * Fetch team solved questions for a given round
   */
  async getTeamProgress(teamId, roundNumber) {
    if (!apiClient.isConfigured()) return null;
    try {
      const { data, error } = await apiClient
        .from('team_questions')
        .select('*')
        .eq('team_id', teamId)
        .eq('round_number', roundNumber);

      if (error) throw error;
      const correctQuestions = data.filter((d) => d.is_correct);
      return {
        totalAttempts: data.length,
        solvedCount: correctQuestions.length,
        solvedQuestionNumbers: correctQuestions.map((c) => c.question_number)
      };
    } catch (err) {
      console.warn('[gameApi] getTeamProgress error:', err);
      return null;
    }
  },

  /**
   * Fetch unlocked secret words for a team
   */
  async getTeamWords(teamId) {
    if (!apiClient.isConfigured()) return null;
    try {
      const { data, error } = await apiClient
        .from('team_words')
        .select('*')
        .eq('team_id', teamId)
        .order('round_number', { ascending: true });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[gameApi] getTeamWords error:', err);
      return null;
    }
  },

  /**
   * Fetch advancement selections for a team
   */
  async getTeamSelections(teamId) {
    if (!apiClient.isConfigured()) return null;
    try {
      const { data, error } = await apiClient
        .from('round_selections')
        .select('*')
        .eq('team_id', teamId)
        .order('round_number', { ascending: true });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[gameApi] getTeamSelections error:', err);
      return null;
    }
  },

  /**
   * Update status of an individual team (e.g. active, disqualified, waiting)
   */
  async updateTeamStatus(teamId, status, roundNumber = null) {
    if (!apiClient.isConfigured()) return false;
    try {
      const updatePayload = { status, updated_at: new Date().toISOString() };
      if (roundNumber !== null) {
        updatePayload.current_round = roundNumber;
      }
      const { error } = await apiClient.from('teams').update(updatePayload).eq('id', teamId);
      return !error;
    } catch (err) {
      console.warn('[gameApi] updateTeamStatus error:', err);
      return false;
    }
  }
};

export default gameApi;
