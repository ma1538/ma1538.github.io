import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameResult } from '../../types';
import { Target, CircleX } from 'lucide-react';

interface ReflexGameProps {
  onGameEnd: (result: GameResult) => void;
}

interface TargetItem {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  createdAt: number;
}

const GAME_DURATION = 15; // 秒

export const ReflexGame: React.FC<ReflexGameProps> = ({ onGameEnd }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [gameActive, setGameActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  useEffect(() => {
    setGameActive(true);
  }, []);

  useEffect(() => {
    if (!gameActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameActive(false);
          onGameEnd({ score, timestamp: Date.now() });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive, onGameEnd, score]);

  useEffect(() => {
    if (!gameActive || timeLeft <= 0) return;

    const spawnRate = 600;
    const spawner = setInterval(() => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const size = Math.random() * 40 + 40;
        const x = Math.random() * (width - size);
        const y = Math.random() * (height - size);
        
        const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-400'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const newTarget: TargetItem = {
          id: nextId.current++,
          x,
          y,
          size,
          color: randomColor,
          createdAt: Date.now(),
        };

        setTargets((prev) => [...prev, newTarget]);

        setTimeout(() => {
          setTargets((current) => current.filter(t => t.id !== newTarget.id));
        }, 2000);
      }
    }, spawnRate);

    return () => clearInterval(spawner);
  }, [gameActive, timeLeft]);

  const handleTargetClick = useCallback((id: number) => {
    if (!gameActive) return;
    
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    setScore(prev => prev + 100);
    setTargets(prev => prev.filter(t => t.id !== id));
  }, [gameActive]);

  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden select-none">
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-20 pointer-events-none">
        <div className="bg-black/50 backdrop-blur px-4 py-2 rounded-lg border border-white/10">
          <div className="text-xs text-gray-400">SCORE</div>
          <div className="text-2xl font-mono font-bold text-white">{score.toLocaleString()}</div>
        </div>
        
        <div className="bg-black/50 backdrop-blur px-4 py-2 rounded-lg border border-white/10">
          <div className="text-xs text-gray-400">TIME</div>
          <div className={`text-2xl font-mono font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {timeLeft}s
          </div>
        </div>
      </div>

      <div 
        ref={containerRef} 
        className="w-full h-full relative touch-none"
      >
        {targets.map((target) => (
          <button
            key={target.id}
            className={`absolute rounded-full shadow-lg transform active:scale-95 transition-transform flex items-center justify-center ${target.color} border-2 border-white/50`}
            style={{
              left: target.x,
              top: target.y,
              width: target.size,
              height: target.size,
              animation: 'bounce-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              handleTargetClick(target.id);
            }}
          >
            <div className="w-1/2 h-1/2 rounded-full bg-white/30" />
          </button>
        ))}
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-10" 
           style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
      />
    </div>
  );
};