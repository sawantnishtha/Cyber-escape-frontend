import { authApi } from '../api/authApi';
import { simulatorEngine } from './simulatorEngine';

const AUTH_STORAGE_KEYS = {
  TEAM: 'cyber_escape_team_auth',
  ADMIN: 'cyber_escape_admin_auth'
};

export const authService = {
  // TEAM AUTHENTICATION
  async loginTeam(teamKey) {
    if (!teamKey || !teamKey.trim()) {
      return { success: false, error: 'Please enter your team key.' };
    }

    const apiRes = await authApi.loginTeam(teamKey);
    if (apiRes.success && apiRes.team) {
      this.persistTeamSession(apiRes.team);
      return apiRes;
    }

    if (!apiRes.fallback && apiRes.error) {
      return apiRes;
    }

    // Simulator / Demo fallback
    const result = simulatorEngine.validateTeamKey(teamKey);
    if (result.success) {
      this.persistTeamSession(result.team);
    }
    return result;
  },

  // ADMIN AUTHENTICATION
  async loginAdmin(adminKey) {
    if (!adminKey || !adminKey.trim()) {
      return { success: false, error: 'Please enter your admin access key.' };
    }

    const apiRes = await authApi.loginAdmin(adminKey);
    if (apiRes.success && apiRes.admin) {
      this.persistAdminSession(apiRes.admin);
      return apiRes;
    }

    if (!apiRes.fallback && apiRes.error) {
      return apiRes;
    }

    const result = simulatorEngine.validateAdminKey(adminKey);
    if (result.success) {
      this.persistAdminSession(result.admin);
    }
    return result;
  },

  persistTeamSession(team) {
    try {
      localStorage.setItem(AUTH_STORAGE_KEYS.TEAM, JSON.stringify(team));
    } catch {
      // ignore
    }
  },

  persistAdminSession(admin) {
    try {
      localStorage.setItem(AUTH_STORAGE_KEYS.ADMIN, JSON.stringify(admin));
    } catch {
      // ignore
    }
  },

  getCurrentTeam() {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEYS.TEAM);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  getCurrentAdmin() {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEYS.ADMIN);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  logoutTeam() {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEYS.TEAM);
    } catch {
      // ignore
    }
  },

  logoutAdmin() {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEYS.ADMIN);
    } catch {
      // ignore
    }
  }
};
