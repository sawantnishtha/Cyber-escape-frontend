import React, { useState, useEffect } from 'react';
import { CyberNavbar } from './components/CyberNavbar';
import { LandingPage } from './pages/LandingPage';
import { TeamApp } from './pages/team/TeamApp';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { authService } from './services/authService';
import { adminService } from './services/adminService';
import { useGameState } from './hooks/useGameState';
import { soundEffects } from './utils/soundEffects';

export function App() {
  const [currentTeam, setCurrentTeam] = useState(null);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const { gameSession, currentState, refreshGameState } = useGameState();

  // Restore authenticated session on mount
  useEffect(() => {
    soundEffects.initSoundPreference();
    const storedTeam = authService.getCurrentTeam();
    const storedAdmin = authService.getCurrentAdmin();

    if (storedTeam) {
      setCurrentTeam(storedTeam);
    } else if (storedAdmin) {
      setCurrentAdmin(storedAdmin);
    }
  }, []);

  const handleResetDemo = async () => {
    await adminService.resetEvent('ADMIN-CYBER-2026');
    refreshGameState();
  };

  const handleLogout = () => {
    setCurrentTeam(null);
    setCurrentAdmin(null);
    refreshGameState();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      {/* Main Cyber Navigation Header */}
      <CyberNavbar
        currentTeam={currentTeam}
        currentAdmin={currentAdmin}
        onLogout={handleLogout}
        onResetDemo={handleResetDemo}
      />

      {/* Main View Router */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {currentAdmin ? (
          <AdminDashboard
            admin={currentAdmin}
            gameSession={gameSession}
            onResetDemo={handleResetDemo}
          />
        ) : currentTeam ? (
          <TeamApp
            team={currentTeam}
            gameSession={gameSession}
            onTeamStateChange={refreshGameState}
          />
        ) : (
          <LandingPage
            onTeamLoginSuccess={(team) => {
              setCurrentTeam(team);
              refreshGameState();
            }}
            onAdminLoginSuccess={(admin) => {
              setCurrentAdmin(admin);
              refreshGameState();
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;
