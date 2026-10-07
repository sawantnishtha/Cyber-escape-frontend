import { apiClient } from './apiClient';

/**
 * Question and Answer API endpoints to communicate with backend
 */
export const questionApi = {
  /**
   * Fetch sanitized questions for a round (answers stripped for security)
   */
  async getQuestionsForRound(roundNumber) {
    if (!apiClient.isConfigured()) return null;
    try {
      const { data, error } = await apiClient
        .from('public_questions')
        .select('*')
        .eq('round_number', roundNumber)
        .order('question_number', { ascending: true });

      if (error) throw error;
      return data && data.length > 0 ? data : null;
    } catch (err) {
      console.warn('[questionApi] getQuestionsForRound error:', err);
      return null;
    }
  },

  /**
   * Submit an answer to the backend RPC submit_question_answer
   */
  async submitAnswer(teamId, roundNumber, questionNumber, submittedAnswer, timeTaken = 0) {
    if (!apiClient.isConfigured()) {
      return { success: false, fallback: true };
    }
    const result = await apiClient.rpc('submit_question_answer', {
      p_team_id: teamId,
      p_round_number: roundNumber,
      p_question_number: questionNumber,
      p_submitted_answer: String(submittedAnswer),
      p_time_taken: timeTaken
    });

    if (result.success && result.data) {
      return result.data;
    }
    return { success: false, error: result.error };
  },

  /**
   * Request a hint for a question via backend RPC request_question_hint
   */
  async requestHint(teamId, roundNumber, questionNumber) {
    if (!apiClient.isConfigured()) {
      return { success: false, fallback: true };
    }
    const result = await apiClient.rpc('request_question_hint', {
      p_team_id: teamId,
      p_round_number: roundNumber,
      p_question_number: questionNumber
    });

    if (result.success && result.data) {
      return result.data;
    }
    return { success: false, error: result.error };
  },

  /**
   * Submit crossword completion for Round 2
   */
  async submitCrossword(teamId, crosswordIndex, timeTaken = 0) {
    return this.submitAnswer(teamId, 2, crosswordIndex, 'COMPLETED', timeTaken);
  }
};

export default questionApi;
