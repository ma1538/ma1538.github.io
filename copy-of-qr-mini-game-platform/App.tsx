
import React, { useState, useCallback, useEffect } from 'react';
import { AppState, GameResult, GameId } from './types';
import { LandingPage } from './components/LandingPage';
import { GameLoader } from './components/GameLoader';
import { ReflexGame } from './components/games/ReflexGame';
import { HitAndBlow } from './components/games/HitAndBlow';
import { MemoryGame } from './components/games/MemoryGame';
import { SlotGame } from './components/games/SlotGame';
import { ResultScreen } from './components/ResultScreen';

const App: React.FC = () => {
  const [currentState, setCurrentState] = useState<AppState>(AppState.LANDING);
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameParam = params.get('game');
    
    if (gameParam) {
      const validGameIds = Object.values(GameId) as string[];
      if (validGameIds.includes(gameParam)) {
        setActiveGameId(gameParam as GameId);
        setCurrentState(AppState.LOADING);
      }
    }
  }, []);

  const handleStartGame = useCallback((gameId: GameId) => {
    setActiveGameId(gameId);
    setCurrentState(AppState.LOADING);
  }, []);

  const handleLoadComplete = useCallback(() => {
    setCurrentState(AppState.GAME);
  }, []);

  const handleGameComplete = useCallback((result: GameResult) => {
    setLastResult(result);
    setCurrentState(AppState.RESULT);
  }, []);

  const handleRetry = useCallback(() => {
    setCurrentState(AppState.LOADING);
  }, []);

  const handleGoHome = useCallback(() => {
    setCurrentState(AppState.LANDING);
    setLastResult(null);
    setActiveGameId(null);
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const renderGame = () => {
    switch (activeGameId) {
      case GameId.HIT_AND_BLOW:
        return <HitAndBlow onGameEnd={handleGameComplete} />;
      case GameId.MEMORY:
        return <MemoryGame onGameEnd={handleGameComplete} />;
      case GameId.CASINO:
        return <SlotGame onGameEnd={handleGameComplete} />;
      case GameId.REFLEX:
      default:
        return <ReflexGame onGameEnd={handleGameComplete} />;
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-gray-950 text-gray-100 font-sans">
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-gray-900 to-black" />

      <main className="flex-1 relative z-10 w-full h-full">
        {currentState === AppState.LANDING && (
          <LandingPage onSelectGame={handleStartGame} />
        )}

        {currentState === AppState.LOADING && (
          <GameLoader onComplete={handleLoadComplete} />
        )}

        {currentState === AppState.GAME && renderGame()}

        {currentState === AppState.RESULT && lastResult && (
          <ResultScreen 
            result={lastResult} 
            onRetry={handleRetry} 
            onHome={handleGoHome}
          />
        )}
      </main>
    </div>
  );
};

export default App;
