import { supabase, isSupabaseConfigured } from '../config/supabase';
import { simulatorEngine } from './simulatorEngine';

export const realtimeService = {
  subscribeToGameState(onUpdate) {
    let supabaseChannel = null;

    if (isSupabaseConfigured && supabase) {
      try {
        supabaseChannel = supabase
          .channel('game_state_channel_' + Math.random().toString(36).substring(2, 7))
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'game_session' },
            (payload) => {
              onUpdate({ type: 'GAME_SESSION_UPDATE', payload });
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'round_selections' },
            (payload) => {
              onUpdate({ type: 'ROUND_SELECTION_UPDATE', payload });
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'teams' },
            (payload) => {
              onUpdate({ type: 'TEAM_UPDATE', payload });
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'round_results' },
            (payload) => {
              onUpdate({ type: 'ROUND_RESULTS_UPDATE', payload });
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'final_attempts' },
            (payload) => {
              onUpdate({ type: 'FINAL_ATTEMPTS_UPDATE', payload });
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Supabase realtime channel subscription error:', err);
      }
    }

    // ALWAYS also subscribe to local BroadcastChannel via simulator engine for instant multi-tab sync
    const simUnsub = simulatorEngine.subscribe((state, event) => {
      onUpdate({ type: event.type, payload: event.payload, state });
    });

    return () => {
      if (supabaseChannel && supabase) {
        try {
          supabase.removeChannel(supabaseChannel);
        } catch {}
      }
      if (typeof simUnsub === 'function') {
        simUnsub();
      }
    };
  }
};
