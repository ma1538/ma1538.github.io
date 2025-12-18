
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
  const [playerSecret, setPlayerSecret] = useState<string>('');
  const [cpuSecret, setCpuSecret] = useState<string>('');
  const [inputBuffer, setInputBuffer] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentTurn, setCurrentTurn] = useState<Turn>('PLAYER');
  const [cpuThinking, setCpuThinking] = useState(false);
  const [message, setMessage] = useState('あなたの秘密の数字（3桁）を決めてください');

  const cpuCandidates = useRef<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isUniqueDigits = (numStr: string) => {
    return new Set(numStr).size === numStr.length;
  };

  const calculateHB = (secret: string, guess: string) => {
    let hit = 0;
    let blow = 0;
    for (let i = 0; i < 3; i++) {
      if (guess[i] === secret[i]) {
        hit++;
      } else if (secret.includes(guess[i])) {
        blow++;
      }
    }
    return { hit, blow };
  };

  const generateCandidates = useCallback(() => {
    const list: string[] = [];
    for (let i = 0; i < 1000; i++) {
      const s = i.toString().padStart(3, '0');
      if (isUniqueDigits(s)) {
        list.push(s);
      }
    }
    return list;
  }, []);

  useEffect(() => {
    cpuCandidates.current = generateCandidates();
    const all = generateCandidates();
    const randomIndex = Math.floor(Math.random() * all.length);
    setCpuSecret(all[randomIndex]);
  }, [generateCandidates]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, cpuThinking]);

  const handleKeyInput = (key: string) => {
    if (inputBuffer.length < 3) {
      if (!inputBuffer.includes(key)) {
        setInputBuffer(inputBuffer + key);
      }
    }
  };

  const handleDelete = () => {
    setInputBuffer(prev => prev.slice(0, -1));
  };

  const handleEnter = () => {
    if (inputBuffer.length !== 3) return;

    if (phase === 'SETUP') {
      setPlayerSecret(inputBuffer);
      setInputBuffer('');
      setPhase('PLAYING');
      setMessage('相手の数字を予想してください。');
      return;
    }

    if (phase === 'PLAYING' && currentTurn === 'PLAYER') {
      const result = calculateHB(cpuSecret, inputBuffer);
      const newHistory = [...history, { turn: 'PLAYER' as Turn, guess: inputBuffer, ...result }];
      setHistory(newHistory);
      setInputBuffer('');

      if (result.hit === 3) {
        const playerGuessCount = newHistory.filter(h => h.turn === 'PLAYER').length;
        const finalScore = Math.max(0, 500 - (50 * playerGuessCount));
        
        setTimeout(() => {
          onGameEnd({ 
            score: finalScore, 
            timestamp: Date.now(), 
            metadata: { winner: 'PLAYER', attempts: playerGuessCount } 
          });
        }, 1000);
        return;
      }

      setCurrentTurn('CPU');
      setMessage('相手のターン...');
      setCpuThinking(true);
    }
  };

  useEffect(() => {
    if (currentTurn === 'CPU' && phase === 'PLAYING') {
      const timer = setTimeout(() => {
        const lastCpuMove = [...history].reverse().find(h => h.turn === 'CPU');
        if (lastCpuMove) {
          cpuCandidates.current = cpuCandidates.current.filter(cand => {
            const { hit, blow } = calculateHB(cand, lastCpuMove.guess);
            return hit === lastCpuMove.hit && blow === lastCpuMove.blow;
          });
        }

        let nextGuess = '';
        const isRandomMove = Math.random() < 0.25;

        if (isRandomMove) {
          const allPossible = generateCandidates();
          nextGuess = allPossible[Math.floor(Math.random() * allPossible.length)];
        } else {
          if (cpuCandidates.current.length > 0) {
            const idx = Math.floor(Math.random() * cpuCandidates.current.length);
            nextGuess = cpuCandidates.current[idx];
          } else {
            const allPossible = generateCandidates();
            nextGuess = allPossible[Math.floor(Math.random() * allPossible.length)];
          }
        }

        const result = calculateHB(playerSecret, nextGuess);
        const newHistory = [...history, { turn: 'CPU' as Turn, guess: nextGuess, ...result }];
        setHistory(newHistory);
        
        if (result.hit === 3) {
          setTimeout(() => {
            onGameEnd({ score: 0, timestamp: Date.now(), metadata: { winner: 'CPU' } });
          }, 1000);
        } else {
          setCpuThinking(false);
          setCurrentTurn('PLAYER');
          setMessage('あなたのターンです');
        }

      }, 1500 + Math.random() * 1000);

      return () => clearTimeout(timer);
    }
  }, [currentTurn, phase, history, playerSecret, onGameEnd, generateCandidates]);


  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100 overflow-hidden">
      {/* ヘッダー：高さを抑える */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-800/80 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1 rounded-lg">
            <User size={14} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-gray-400 font-bold">YOU</span>
            <span className="font-mono text-lg font-black tracking-widest text-indigo-300">
              {playerSecret || '---'}
            </span>
          </div>
        </div>

        <div className="text-[10px] font-black text-gray-600 italic">BATTLE</div>

        <div className="flex items-center gap-2 text-right">
          <div className="flex flex-col items-end leading-tight">
            <span className="text-[10px] text-gray-400 font-bold">CPU</span>
            <span className="font-mono text-lg font-black tracking-widest text-red-400 flex items-center gap-1">
              {phase === 'PLAYING' ? '???' : '---'}
            </span>
          </div>
          <div className={`p-1 rounded-lg transition-colors ${cpuThinking ? 'bg-yellow-600 animate-pulse' : 'bg-gray-700'}`}>
            <Cpu size={14} />
          </div>
        </div>
      </div>

      {/* メインエリア：履歴表示を flex-1 で最大化 */}
      <div className="flex-1 overflow-hidden relative bg-gray-950">
        <div className="absolute inset-0 p-4 overflow-y-auto space-y-2 scroll-smooth" ref={scrollRef}>
          {phase === 'SETUP' && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
              <ShieldQuestion size={40} className="text-indigo-500" />
              <p className="text-xs text-gray-400 leading-relaxed px-10">
                秘密の3桁を入力してください<br/>
                同じ数字は使えません
              </p>
            </div>
          )}

          {history.map((item, idx) => (
            <div key={idx} className={`flex ${item.turn === 'PLAYER' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-1 fade-in duration-200`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-1.5 ${
                item.turn === 'PLAYER' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-bold tracking-widest">{item.guess}</span>
                  <div className="flex gap-2 text-[10px] font-black uppercase">
                    <span className="text-yellow-400">{item.hit}H</span>
                    <span className="text-blue-400">{item.blow}B</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {cpuThinking && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-gray-800 text-gray-500 rounded-xl rounded-bl-none px-3 py-1 text-[10px] font-bold flex items-center gap-1">
                <Cpu size={10} />
                THINKING...
              </div>
            </div>
          )}
          <div className="h-4" />
        </div>
        
        {/* メッセージ：中央付近に浮かせる */}
        <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none z-10">
          <span className="inline-block bg-indigo-500 text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow-lg border border-indigo-400 animate-in fade-in zoom-in duration-300">
            {message}
          </span>
        </div>
      </div>

      {/* キーパッドエリア：垂直方向を圧縮 */}
      <div className="bg-gray-900 border-t border-gray-800 p-2 pb-safe shrink-0">
        {/* 入力バッファ表示 */}
        <div className="flex justify-center mb-2 items-center gap-2">
           {[0, 1, 2].map((i) => (
             <div key={i} className={`w-10 h-10 border-2 rounded-lg flex items-center justify-center text-xl font-mono font-black transition-all ${
               inputBuffer[i] ? 'border-indigo-500 text-white bg-indigo-900/40 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'border-gray-800 text-gray-700 bg-gray-950'
             }`}>
               {inputBuffer[i] || ''}
             </div>
           ))}
        </div>

        {/* 3列テンキーレイアウト */}
        <div className="max-w-[280px] mx-auto grid grid-cols-3 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
             const isUsed = inputBuffer.includes(num.toString());
             return (
              <button
                key={num}
                onClick={() => handleKeyInput(num.toString())}
                disabled={isUsed || (currentTurn === 'CPU' && phase === 'PLAYING')}
                className={`h-11 rounded-lg font-bold text-xl transition-all active:scale-90 flex items-center justify-center
                  ${isUsed 
                    ? 'bg-gray-800/50 text-gray-700 cursor-not-allowed' 
                    : 'bg-gray-800 hover:bg-gray-700 text-white border-b-2 border-black'
                  }
                  ${(currentTurn === 'CPU' && phase === 'PLAYING') ? 'opacity-30' : ''}
                `}
              >
                {num}
              </button>
            );
          })}
          {/* 最下段 */}
          <button
            onClick={handleDelete}
            className="h-11 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 flex items-center justify-center transition-all active:scale-90 border-b-2 border-black"
          >
            <Delete size={20} />
          </button>
          <button
            onClick={() => handleKeyInput('0')}
            disabled={inputBuffer.includes('0') || (currentTurn === 'CPU' && phase === 'PLAYING')}
            className={`h-11 rounded-lg font-bold text-xl transition-all active:scale-90 flex items-center justify-center
              ${inputBuffer.includes('0') 
                ? 'bg-gray-800/50 text-gray-700' 
                : 'bg-gray-800 text-white border-b-2 border-black'
              }
            `}
          >
            0
          </button>
          <button
            onClick={handleEnter}
            disabled={inputBuffer.length !== 3 || (currentTurn === 'CPU' && phase === 'PLAYING')}
            className={`h-11 rounded-lg flex items-center justify-center font-black transition-all active:scale-90 shadow-lg
              ${inputBuffer.length === 3 && (currentTurn === 'PLAYER' || phase === 'SETUP')
                ? 'bg-indigo-600 text-white border-b-2 border-indigo-900 shadow-indigo-500/20' 
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }
            `}
          >
            <Check size={20} />
          </button>
        </div>
      </div>
      
      <style>{`
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 0.5rem);
        }
      `}</style>
    </div>
  );
};
