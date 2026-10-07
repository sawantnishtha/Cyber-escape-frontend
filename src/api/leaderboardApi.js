import { apiClient } from './apiClient';

/**
 * Leaderboard API endpoints to communicate with backend
 */
export const leaderboardApi = {
  /**
   * Fetch raw leaderboard source records from backend
   */
  async fetchLeaderboardData() {
    if (!apiClient.isConfigured()) return null;
    try {
      const [teamsRes, resultsRes, finalsRes, selectionsRes] = await Promise.all([
        apiClient.from('teams').select('*'),
        apiClient.from('round_results').select('*'),
        apiClient.from('final_attempts').select('*'),
        apiClient.from('round_selections').select('*')
      ]);

      if (teamsRes.error) throw teamsRes.error;

      return {
        teams: teamsRes.data || [],
        results: resultsRes.data || [],
        finalAttempts: finalsRes.data || [],
        selections: selectionsRes.data || []
      };
    } catch (err) {
      console.warn('[leaderboardApi] fetchLeaderboardData error:', err);
      return null;
    }
  },

  /**
   * Subscribe to live updates on teams and round_results
   */
  subscribeToChanges(onChangeCallback) {
    if (!apiClient.isConfigured()) return () => {};

    const channel = apiClient.channel('public:leaderboard_updates');
    if (!channel) return () => {};

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'round_results' }, () => {
        onChangeCallback();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        onChangeCallback();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'final_attempts' }, () => {
        onChangeCallback();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }
};

export default leaderboardApi;
