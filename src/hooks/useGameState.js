import { useState, useEffect, useCallback } from 'react';
import { roundService } from '../services/roundService';
import { realtimeService } from '../services/realtimeService';
import { GAME_STATES } from '../constants/gameConfig';

export function useGameState() {
  const [gameSession, setGameSession] = useState({
    current_round: 1,
    current_state: GAME_STATES.LANDING,
    round_timer_seconds: 300,
    timer_started_at: null
  });
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const session = await roundService.getGameSession();
      if (session) {
        setGameSession(session);
      }
    } catch (err) {
      console.error('Failed to fetch game session:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();

    // 1. Subscribe to realtime state events (Supabase websocket & BroadcastChannel)
    const unsubscribe = realtimeService.subscribeToGameState((event) => {
      fetchSession();
    });

    // 2. Active heartbeat polling (every 1.5s) to guarantee real-time sync across devices and tabs
    const interval = setInterval(fetchSession, 1500);

    return () => {
      clearInterval(interval);
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [fetchSession]);

  return {
    gameSession,
    currentState: gameSession.current_state,
    currentRound: gameSession.current_round,
    loading,
    refreshGameState: fetchSession
  };
}
