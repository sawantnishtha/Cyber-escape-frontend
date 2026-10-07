import { apiClient } from './apiClient';

/**
 * Security Code & Final Riddle API endpoints to communicate with backend
 */
export const codeApi = {
  /**
   * Verify round code via backend RPC verify_round_code
   */
  async verifyRoundCode(teamId, roundNumber, submittedCode) {
    if (!apiClient.isConfigured()) {
      return { success: false, fallback: true };
    }
    const cleanCode = submittedCode.trim().toUpperCase();
    const result = await apiClient.rpc('verify_round_code', {
      p_team_id: teamId,
      p_round_number: roundNumber,
      p_submitted_code: cleanCode
    });

    if (result.success && result.data) {
      return result.data;
    }
    return { success: false, error: result.error };
  },

  /**
   * Fallback direct database update if legacy RPC has different validation
   */
  async unlockTeamWordDirect(teamId, roundNumber, revealedWord) {
    if (!apiClient.isConfigured()) return false;
    try {
      await apiClient.from('team_words').upsert([
        {
          team_id: teamId,
          round_number: roundNumber,
          word: revealedWord,
          unlocked_at: new Date().toISOString()
        }
      ], { onConflict: 'team_id, round_number' });

      await apiClient
        .from('round_results')
        .update({
          code_completed: true,
          code_completed_at: new Date().toISOString()
        })
        .match({ team_id: teamId, round_number: roundNumber });

      return true;
    } catch (err) {
      console.warn('[codeApi] unlockTeamWordDirect error:', err);
      return false;
    }
  },

  /**
   * Submit final riddle solution via backend RPC submit_final_riddle_answer
   */
  async submitFinalAnswer(teamId, submittedAnswer) {
    if (!apiClient.isConfigured()) {
      return { success: false, fallback: true };
    }
    const cleanAnswer = submittedAnswer.trim();
    const result = await apiClient.rpc('submit_final_riddle_answer', {
      p_team_id: teamId,
      p_submitted_answer: cleanAnswer
    });

    if (result.success && result.data) {
      return result.data;
    }
    return { success: false, error: result.error };
  }
};

export default codeApi;
