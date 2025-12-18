import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameResult } from '../../types';
import { Delete, Check, User, Cpu, ShieldQuestion } from 'lucide-react';

interface HitAndBlowProps {
  onGameEnd: (result: GameResult) => void;
}

type Turn = 'PLAYER' | 'CPU';
type Phase = 'SETUP' | 'PLAYING' | 'RESULT';

interface HistoryItem {
  turn: Turn;
  guess: string;
  hit: number;
  blow: number;
}

export const HitAndBlow: React.FC<HitAndBlowProps> = ({ onGameEnd }) => {
  const [phase, setPhase] = useState<Phase>('SETUP');
  const [playerSecret, setPlayerSecret] = useState('');
  const [cpuSecret, setCpuSecret] = useState('');
  const [inputBuffer, setInputBuffer] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentTurn, setCurrentTurn] = useState<Turn>('PLAYER');
  const [cpuThinking, setCpuThinking] = useState(false);
  const [message, setMessage] = useState('あなたの秘密の数字（3桁）を決めてください');

  const cpuCandidates = useRef<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isUniqueDigits = (numStr: string) =>
    new Set(numStr).size === numStr.length;

  const calculateHB = (secret: string, guess: string) => {
    let hit = 0;
    let blow = 0;
    for (let i = 0; i < 3; i++) {
      if (guess[i] === secret[i]) hit++;
      else if (secret.includes(guess[i])) blow++;
    }
    return { hit, blow };
  };

  const generateCandidates = useCallback(() => {
    const list: string[] = [];
    for (let i = 0; i < 1000; i++) {
      const s = i.toString().padStart(3, '0');
      if (isUniqueDigits(s)) list.push(s);
    }
    return list;
  }, []);

  useEffect(() => {
    const all = generateCandidates();
    cpuCandidates.current = all;
    setCpuSecret(all[Math.floor(Math.random() * all.length)]);
  }, [generateCandidates]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleKeyInput = (key: string) => {
    if (inputBuffer.length < 3 && !inputBuffer.includes(key)) {
      setInputBuffer(prev => prev + key);
    }
  };

  const handleDelete = () => {
    setInputBuffer(prev => prev.slice(0, -1));
  };

  const handleEnter = () => {
    if (inputBuffer.length !== 3 || !isUniqueDigits(inputBuffer)) return;

    if (phase === 'SETUP') {
      setPlayerSecret(inputBuffer);
      setInputBuffer('');
      setPhase('PLAYING');
      setMessage('あなたのターンです。相手の数字を予想してください。');
      return;
    }

    if (phase === 'PLAYING' && currentTurn === 'PLAYER') {
      const result = calculateHB(cpuSecret, inputBuffer);
      setHistory(prev => [...prev, { turn: 'PLAYER', guess: inputBuffer, ...result }]);
      setInputBuffer('');

      if (result.hit === 3) {
        const attempts = history.filter(h => h.turn === 'PLAYER').length + 1;
        const score = Math.max(0, 500 - attempts * 50);
        setTimeout(() => {
          onGameEnd({ score, timestamp: Date.now(), metadata: { winner: 'PLAYER', attempts } });
        }, 800);
        return;
      }

      setCurrentTurn('CPU');
      setCpuThinking(true);
      setMessage('相手のターン...');
    }
  };

  useEffect(() => {
    if (currentTurn !== 'CPU' || phase !== 'PLAYING' || !playerSecret) return;

    const timer = setTimeout(() => {
      const lastCpuMove = [...history].reverse().find(h => h.turn === 'CPU');
      if (lastCpuMove) {
        cpuCandidates.current = cpuCandidates.current.filter(cand => {
          const { hit, blow } = calculateHB(cand, lastCpuMove.guess);
          return hit === lastCpuMove.hit && blow === lastCpuMove.blow;
        });
      }

      const candidates = cpuCandidates.current.length
        ? cpuCandidates.current
        : generateCandidates();

      const nextGuess = candidates[Math.floor(Math.random() * candidates.length)];
      cpuCandidates.current = cpuCandidates.current.filter(c => c !== nextGuess);

      const result = calculateHB(playerSecret, nextGuess);
      setHistory(prev => [...prev, { turn: 'CPU', guess: nextGuess, ...result }]);

      if (result.hit === 3) {
        setTimeout(() => {
          onGameEnd({ score: 0, timestamp: Date.now(), metadata: { winner: 'CPU' } });
        }, 800);
      } else {
        setCpuThinking(false);
        setCurrentTurn('PLAYER');
        setMessage('あなたのターンです');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [currentTurn, phase, history, playerSecret, generateCandidates, onGameEnd]);

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="shrink-0 p-4 bg-gray-800/50 border-b border-gray-700 flex justify-between">
        <span className="font-mono">{playerSecret || '???'}</span>
        <span className="text-gray-500">VS</span>
        <span className="text-gray-600">CPU</span>
      </div>

      {/* History (scroll only here) */}
      <div className="flex-1 relative overflow-hidden bg-gray-950">
        <div ref={scrollRef} className="absolute inset-0 overflow-y-auto p-4 space-y-3">
          {phase === 'SETUP' && (
            <div className="h-full flex items-center justify-center text-center text-gray-400">
              3桁の数字を決めてください
            </div>
          )}

          {history.map((h, i) => (
            <div key={i} className={`flex ${h.turn === 'PLAYER' ? 'justify-end' : 'justify-start'}`}>
              <div className="px-4 py-2 rounded-xl bg-gray-800">
                <div className="font-mono text-lg">{h.guess}</div>
                <div className="text-sm">{h.hit}H {h.blow}B</div>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-4 inset-x-4 text-center pointer-events-none">
          <span className="text-xs bg-black/60 px-3 py-1 rounded-full">{message}</span>
        </div>
      </div>

      {/* Keypad */}
      <div
        className="shrink-0 border-t border-gray-800 bg-gray-900 p-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-center gap-2 mb-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-10 h-12 border border-gray-700 flex items-center justify-center">
              {inputBuffer[i]}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
          {[1,2,3,4,5,6,7,8,9,0].map(n => (
            <button
              key={n}
              onClick={() => handleKeyInput(n.toString())}
              disabled={inputBuffer.includes(n.toString())}
              className="h-12 rounded bg-gray-800 text-white"
            >
              {n}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2 max-w-md mx-auto">
          <button onClick={handleDelete} className="h-12 bg-gray-800 rounded">
            <Delete />
          </button>
          <button
            onClick={handleEnter}
            disabled={inputBuffer.length !== 3}
            className="h-12 bg-indigo-600 rounded flex items-center justify-center gap-2"
          >
            <Check /> DECIDE
          </button>
        </div>
      </div>
    </div>
  );
};
