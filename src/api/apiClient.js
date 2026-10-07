import { supabase, isSupabaseConfigured } from '../config/supabase';

/**
 * Core API Client for communicating with the backend (Supabase / REST / RPC).
 * Standardizes calls, error handling, connection checks, and response structures.
 */
export const apiClient = {
  /**
   * Check whether backend connection is active
   */
  isConfigured() {
    return isSupabaseConfigured && supabase !== null;
  },

  /**
   * Health check to test backend connectivity
   */
  async healthCheck() {
    if (!this.isConfigured()) {
      return { connected: false, message: 'Backend not configured or in Demo Mode' };
    }
    try {
      const { data, error } = await supabase.from('game_session').select('id, current_state').limit(1);
      if (error) throw error;
      return { connected: true, data };
    } catch (err) {
      return { connected: false, error: err.message || err };
    }
  },

  /**
   * Invoke a backend Remote Procedure Call (RPC)
   * @param {string} functionName - Database RPC function name
   * @param {object} params - Parameters object
   */
  async rpc(functionName, params = {}) {
    if (!this.isConfigured()) {
      return { success: false, fallback: true, error: 'Backend not connected' };
    }
    try {
      const { data, error } = await supabase.rpc(functionName, params);
      if (error) {
        console.warn(`[Backend API] RPC ${functionName} error:`, error);
        return { success: false, error: error.message || error, code: error.code };
      }
      return { success: true, data };
    } catch (err) {
      console.warn(`[Backend API] RPC ${functionName} exception:`, err);
      return { success: false, error: err.message || 'API connection error' };
    }
  },

  /**
   * Direct Table query builder
   * @param {string} tableName
   */
  from(tableName) {
    if (!this.isConfigured()) {
      throw new Error('Cannot query table when backend is not configured.');
    }
    return supabase.from(tableName);
  },

  /**
   * Get Supabase Realtime channel instance
   * @param {string} channelName
   */
  channel(channelName) {
    if (!this.isConfigured()) return null;
    return supabase.channel(channelName);
  },

  /**
   * Expose raw supabase instance if needed
   */
  raw() {
    return supabase;
  }
};

export default apiClient;
