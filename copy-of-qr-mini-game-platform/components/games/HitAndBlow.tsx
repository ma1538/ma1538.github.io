import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameResult } from '../../types';
import { Delete, Check, User, Cpu, ShieldQuestion } from 'lucide-react';

interface HitAndBlowProps {
  onGameEnd: (result: GameResult) => void;
}

type Turn = 'PLAYER' | 'CPU';
type Phase = 'SETUP' | 'PLAYING';

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

  const isUniqueDigits = (s: string) => new Set(s).size === s.length;

  const calculateHB = (secret: string, guess: string) => {
    let hit = 0;
    let blow = 0;
    for (let i = 0; i < 3; i++) {
      if (secret[i] === guess[i]) hit++;
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

  const handleDelete = () => setInputBuffer(prev => prev.slice(0, -1));

  const handleEnter = () => {
    if (inputBuffer.length !== 3 || !isUniqueDigits(inputBuffer)) return;

    if (phase === 'SETUP') {
      setPlayerSecret(inputBuffer);
      setInputBuffer('');
      setPhase('PLAYING');
      setMessage('あなたのターンです');
      return;
    }

    if (currentTurn === 'PLAYER') {
      const result = calculateHB(cpuSecret, inputBuffer);
      setHistory(prev => [...prev, { turn: 'PLAYER', guess: inputBuffer, ...result }]);
      setInputBuffer('');

      if (result.hit === 3) {
        setTimeout(() => {
          onGameEnd({ score: 300, timestamp: Date.now(), metadata: { winner: 'PLAYER' } });
        }, 800);
        return;
      }

      setCurrentTurn('CPU');
      setCpuThinking(true);
      setMessage('相手のターン...');
    }
  };

  useEffect(() => {
    if (currentTurn !== 'CPU' || phase !== 'PLAYING') return;

    const timer = setTimeout(() => {
      const next = cpuCandidates.current[Math.floor(Math.random() * cpuCandidates.current.length)];
      cpuCandidates.current = cpuCandidates.current.filter(c => c !== next);

      const result = calculateHB(playerSecret, next);
      setHistory(prev => [...prev, { turn: 'CPU', guess: next, ...result }]);

      if (result.hit === 3) {
        onGameEnd({ score: 0, timestamp: Date.now(), metadata: { winner: 'CPU' } });
      } else {
        setCpuThinking(false);
        setCurrentTurn('PLAYER');
        setMessage('あなたのターンです');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [currentTurn, phase, playerSecret, onGameEnd]);

  return (
    /* ===== 全体（黒い余白） ===== */
    <div className="w-full h-dvh bg-black flex items-center justify-center overflow-hidden">

      {/* ===== 中央 ゲーム画面（高さのみ56%に変更） ===== */}
      <div className="w-[80%] h-[56%] bg-gray-900 text-gray-100 flex flex-col rounded-xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="shrink-0 p-3 bg-gray-800 border-b border-gray-700 flex justify-between text-sm">
          <span>{playerSecret || '???'}</span>
          <span className="text-gray-500">VS</span>
          <span className="text-gray-400">CPU</span>
        </div>

        {/* History */}
        <div className="flex-1 relative overflow-hidden bg-gray-950">
          <div ref={scrollRef} className="absolute inset-0 p-3 overflow-y-auto space-y-2">
            {history.map((h, i) => (
              <div key={i} className={`flex ${h.turn === 'PLAYER' ? 'justify-end' : 'justify-start'}`}>
                <div className="bg-gray-800 px-3 py-1.5 rounded-lg text-sm">
                  <span className="font-mono">{h.guess}</span>
                  <span className="ml-2 text-yellow-400">{h.hit}H</span>
                  <span className="ml-1 text-blue-400">{h.blow}B</span>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-2 inset-x-2 text-center pointer-events-none">
            <span className="text-xs bg-black/60 px-3 py-1 rounded-full">
              {message}
            </span>
          </div>
        </div>

        {/* Keypad */}
        <div className="shrink-0 p-2 border-t border-gray-800 bg-gray-900">
          <div className="flex justify-center gap-1 mb-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-8 h-10 border border-gray-700 flex items-center justify-center">
                {inputBuffer[i]}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-1">
            {[1,2,3,4,5,6,7,8,9,0].map(n => (
              <button
                key={n}
                onClick={() => handleKeyInput(n.toString())}
                className="h-10 bg-gray-800 rounded text-sm"
              >
                {n}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-1 mt-2">
            <button onClick={handleDelete} className="h-10 bg-gray-800 rounded">
              <Delete size={16} />
            </button>
            <button
              onClick={handleEnter}
              disabled={inputBuffer.length !== 3}
              className="h-10 bg-indigo-600 rounded flex items-center justify-center gap-1 text-sm"
            >
              <Check size={16} /> OK
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};