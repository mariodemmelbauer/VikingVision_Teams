import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import { initTeams, TeamsUser } from './teams/context';

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ??
  'http://localhost:8000';

export default function App() {
  const [user, setUser] = useState<TeamsUser>({
    displayName: 'VikingVision User'
  });

  const [inTeams, setInTeams] = useState(false);
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    initTeams().then(({ inTeams, user }) => {
      setInTeams(inTeams);
      setUser(user);
    });

    fetch(`${API_BASE}/health`)
      .then(r => setApiOk(r.ok))
      .catch(() => setApiOk(false));
  }, []);

  return (
    <Dashboard
      displayName={user.displayName ?? 'VikingVision User'}
      userPrincipalName={user.userPrincipalName}
      inTeams={inTeams}
      ssoOk={user.tokenOk ?? false}
      ssoError={user.tokenError}
      apiOk={apiOk}
    />
  );
}
