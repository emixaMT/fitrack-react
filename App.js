import { ExpoRoot } from 'expo-router';

export default function App() {
  // Dossier des routes placé dans src/app
  const ctx = require.context('./src/app');
  return <ExpoRoot context={ctx} />;
}