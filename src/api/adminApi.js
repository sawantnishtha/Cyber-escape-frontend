import { apiClient } from './apiClient';

/**
 * Admin operations API endpoints to communicate with backend
 */
export const adminApi = {
  /**
   * Transition game state via backend RPC admin_set_game_state
   */
  async setGameState(adminKey, newState, roundNumber = 1) {
    if (!apiClient.isConfigured()) {
      return { success: false, fallback: true };
    }
    const result = await apiClient.rpc('admin_set_game_state', {
      p_admin_key: adminKey,
      p_new_state: newState,
      p_new_round: roundNumber || 1
    });

    if (result.success && result.data) {
      return result.data;
    }
    return { success: false, error: result.error };
  },

  /**
   * Publish round advancing teams list (Step 1 of qualification: teams notified of selection, secret words not yet unlocked)
   */
  async publishRoundSelections(adminKey, roundNumber, selectedTeamIds) {
    if (!apiClient.isConfigured()) {
      return { success: false, fallback: true };
    }
    try {
      const { data: allTeams } = await apiClient.from('teams').select('id');
      if (allTeams && allTeams.length > 0) {
        const rows = allTeams.map((t) => ({
          team_id: t.id,
          round_number: roundNumber,
          selected: selectedTeamIds.includes(t.id),
          notes: 'published',
          selected_at: new Date().toISOString()
        }));

        await apiClient.from('round_selections').upsert(rows, { onConflict: 'team_id, round_number' });

        // Update selected teams status to 'selected'
        if (selectedTeamIds.length > 0) {
          await apiClient
            .from('teams')
            .update({ status: 'selected' })
            .in('id', selectedTeamIds);
        }
      }

      await apiClient.from('audit_logs').insert([
        {
          admin_id: 'admin',
          action: 'PUBLISH_SELECTION',
          round_number: roundNumber,
          metadata: { selected_count: selectedTeamIds.length }
        }
      ]);

      return { success: true, count: selectedTeamIds.length };
    } catch (err) {
      console.warn('[adminApi] publishRoundSelections error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Confirm round advancing teams via backend RPC admin_confirm_round_selections (Step 2: unlocks secret words)
   */
  async confirmRoundSelections(adminKey, roundNumber, selectedTeamIds) {
    if (!apiClient.isConfigured()) {
      return { success: false, fallback: true };
    }
    const result = await apiClient.rpc('admin_confirm_round_selections', {
      p_admin_key: adminKey,
      p_round_number: roundNumber,
      p_selected_team_ids: selectedTeamIds
    });

    // Also update round_selections notes to 'confirmed'
    try {
      await apiClient
        .from('round_selections')
        .update({ notes: 'confirmed' })
        .eq('round_number', roundNumber);
    } catch (e) {
      // ignore
    }

    if (result.success && result.data) {
      return result.data;
    }
    return { success: false, error: result.error };
  },

  /**
   * Full Event Reset via atomic RPC or multi-table rollback
   */
  async resetEvent(adminKey = 'ADM-2007') {
    if (!apiClient.isConfigured()) {
      return { success: false, fallback: true };
    }

    // 1. Try atomic admin_reset_event RPC first
    try {
      const rpcRes = await apiClient.rpc('admin_reset_event', { p_admin_key: adminKey });
      if (rpcRes.success && rpcRes.data?.success) {
        return { success: true };
      }
    } catch (e) {
      console.warn('RPC admin_reset_event not available, falling back to multi-step reset:', e);
    }

    // 2. Guaranteed multi-step reset:
    try {
      const dummyFilter = '00000000-0000-0000-0000-000000000000';

      // A. Reset game_session to LANDING, round 1 via admin_set_game_state RPC
      await this.setGameState(adminKey, 'LANDING', 1);

      // B. Fetch all teams and reset their status & current_round to 1 via admin_confirm_round_selections
      const { data: allTeams } = await apiClient.from('teams').select('id');
      if (allTeams && allTeams.length > 0) {
        const allIds = allTeams.map((t) => t.id);
        await this.confirmRoundSelections(adminKey, 0, allIds);
      }

      // C. Delete all tournament progress rows
      await Promise.allSettled([
        apiClient.from('round_results').delete().neq('team_id', dummyFilter),
        apiClient.from('team_words').delete().neq('team_id', dummyFilter),
        apiClient.from('team_questions').delete().neq('team_id', dummyFilter),
        apiClient.from('round_selections').delete().neq('team_id', dummyFilter),
        apiClient.from('final_attempts').delete().neq('team_id', dummyFilter)
      ]);

      // D. Record in audit logs
      try {
        await apiClient.from('audit_logs').insert([
          {
            admin_id: 'admin',
            action: 'EVENT_RESTARTED',
            round_number: 1,
            metadata: { timestamp: new Date().toISOString() }
          }
        ]);
      } catch (logErr) {
        // ignore
      }

      return { success: true };
    } catch (err) {
      console.warn('[adminApi] resetEvent fallback error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Fetch all selection history across all rounds
   */
  async getAllSelectionHistory() {
    if (!apiClient.isConfigured()) return null;
    try {
      const { data, error } = await apiClient
        .from('round_selections')
        .select('*, teams(team_name)')
        .order('round_number', { ascending: true });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[adminApi] getAllSelectionHistory error:', err);
      return null;
    }
  },

  /**
   * Declare final tournament winners
   */
  async declareFinalWinners(adminKey, winnerId, runnerUpId, winnerName = null, runnerUpName = null) {
    if (!apiClient.isConfigured()) return false;
    try {
      let wName = winnerName;
      let rName = runnerUpName;
      if (!wName || !rName) {
        const { data: teams } = await apiClient.from('teams').select('id, team_name').in('id', [winnerId, runnerUpId]);
        if (teams) {
          wName = teams.find((t) => t.id === winnerId)?.team_name || wName;
          rName = teams.find((t) => t.id === runnerUpId)?.team_name || rName;
        }
      }
      await apiClient.from('audit_logs').insert([
        {
          admin_id: 'admin',
          action: 'FINAL_WINNERS_DECLARED',
          metadata: {
            winner_id: winnerId,
            runner_up_id: runnerUpId,
            winner_name: wName || 'TEAM ALPHA',
            runner_up_name: rName || 'TEAM BETA',
            timestamp: new Date().toISOString()
          }
        }
      ]);
      await this.setGameState(adminKey, 'FINAL_RESULT', 4);
      return true;
    } catch (err) {
      console.warn('[adminApi] declareFinalWinners error:', err);
      return false;
    }
  },

  /**
   * Fetch audit logs
   */
  async getAuditLogs() {
    if (!apiClient.isConfigured()) return null;
    try {
      const { data, error } = await apiClient
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[adminApi] getAuditLogs error:', err);
      return null;
    }
  }
};

export default adminApi;
