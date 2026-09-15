import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import { initTeams } from './teams/context';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

export default function App() {
  const [displayName, setDisplayName] = useState('VikingVision User');
  const [inTeams, setInTeams] = useState(false);
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    initTeams().then(({ inTeams, user }) => {
      setInTeams(inTeams);
      setDisplayName(user.userPrincipalName ?? user.displayName ?? 'VikingVision User');
    });
    fetch(`${API_BASE}/health`).then(r => setApiOk(r.ok)).catch(() => setApiOk(false));
  }, []);

  return <Dashboard displayName={displayName} inTeams={inTeams} apiOk={apiOk} />;
}
