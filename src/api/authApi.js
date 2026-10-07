import { apiClient } from './apiClient';

/**
 * Authentication API endpoints to communicate with backend
 */
export const authApi = {
  /**
   * Validate team credentials via backend RPC validate_team_key
   */
  async loginTeam(teamKey) {
    if (!apiClient.isConfigured()) {
      return { success: false, fallback: true, error: 'Backend not connected' };
    }
    const cleanKey = teamKey.trim().toUpperCase();
    const result = await apiClient.rpc('validate_team_key', { p_key: cleanKey });
    
    if (result.success && result.data?.success) {
      return { success: true, team: result.data.team };
    }
    return {
      success: false,
      error: result.data?.error || result.error || 'Invalid team key.'
    };
  },

  /**
   * Validate admin credentials via backend RPC validate_admin_key
   */
  async loginAdmin(adminKey) {
    if (!apiClient.isConfigured()) {
      return { success: false, fallback: true, error: 'Backend not connected' };
    }
    const cleanKey = adminKey.trim();
    const result = await apiClient.rpc('validate_admin_key', { p_key: cleanKey });

    if (result.success && result.data?.success) {
      return { success: true, admin: result.data.admin };
    }
    return {
      success: false,
      error: result.data?.error || result.error || 'Invalid admin key.'
    };
  },

  /**
   * Fetch team profile details directly from backend
   */
  async getTeamProfile(teamId) {
    if (!apiClient.isConfigured()) return null;
    try {
      const { data, error } = await apiClient.from('teams').select('*').eq('id', teamId).single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[authApi] getTeamProfile error:', err);
      return null;
    }
  }
};

export default authApi;
