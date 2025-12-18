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

  // CPUの推測候補リスト
  const cpuCandidates = useRef<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 数字が重複していないかチェック
  const isUniqueDigits = (numStr: string) => {
    return new Set(numStr).size === numStr.length;
  };

  // H/B判定ロジック
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

  // 全通りの候補を生成 (012 ~ 987)
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

  // ゲーム初期化
  useEffect(() => {
    cpuCandidates.current = generateCandidates();
    const all = generateCandidates();
    const randomIndex = Math.floor(Math.random() * all.length);
    setCpuSecret(all[randomIndex]);
  }, [generateCandidates]);

  // 履歴追加時のスクロール
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // キーパッド入力処理
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

  // プレイヤーの決定アクション
  const handleEnter = () => {
    if (inputBuffer.length !== 3) return;

    if (phase === 'SETUP') {
      setPlayerSecret(inputBuffer);
      setInputBuffer('');
      setPhase('PLAYING');
      setMessage('あなたのターンです。相手の数字を予想してください。');
      return;
    }

    if (phase === 'PLAYING' && currentTurn === 'PLAYER') {
      const result = calculateHB(cpuSecret, inputBuffer);
      const newHistory = [...history, { turn: 'PLAYER' as Turn, guess: inputBuffer, ...result }];
      setHistory(newHistory);
      setInputBuffer('');

      if (result.hit === 3) {
        // プレイヤー勝利: 点数 = (500 - (50 * プレイヤーが数字を予想した数))
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

  // CPUの思考と行動
  useEffect(() => {
    if (currentTurn === 'CPU' && phase === 'PLAYING') {
      const timer = setTimeout(() => {
        // 1. 候補の絞り込み (前回の自分の推測結果を利用)
        const lastCpuMove = [...history].reverse().find(h => h.turn === 'CPU');
        if (lastCpuMove) {
          cpuCandidates.current = cpuCandidates.current.filter(cand => {
            const { hit, blow } = calculateHB(cand, lastCpuMove.guess);
            return hit === lastCpuMove.hit && blow === lastCpuMove.blow;
          });
        }

        // 2. 次の一手を選択（25%の確率でランダム行動を行い難易度を下げる）
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

        // 3. 判定
        const result = calculateHB(playerSecret, nextGuess);
        // Turn型への明示的なキャストを追加してエラーを修正
        const newHistory = [...history, { turn: 'CPU' as Turn, guess: nextGuess, ...result }];
        setHistory(newHistory);
        
        if (result.hit === 3) {
          // CPU勝利（プレイヤー敗北時は0点）
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
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      {/* ヘッダー情報 */}
      <div className="flex justify-between items-center p-4 bg-gray-800/50 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <User size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">YOU</span>
            <span className="font-mono text-xl font-bold tracking-widest">
              {playerSecret || '???'}
            </span>
          </div>
        </div>

        <div className="text-sm font-bold text-gray-500">VS</div>

        <div className="flex items-center gap-2 text-right">
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-400">CPU</span>
            <span className="font-mono text-xl font-bold tracking-widest flex items-center gap-1">
              {phase === 'PLAYING' ? (
                <>
                  <ShieldQuestion size={16} className="text-gray-600"/>
                  <span>???</span>
                </>
              ) : (
                <span className="text-gray-600">waiting</span>
              )}
            </span>
          </div>
          <div className={`p-1.5 rounded-lg transition-colors ${cpuThinking ? 'bg-yellow-600 animate-pulse' : 'bg-gray-700'}`}>
            <Cpu size={16} />
          </div>
        </div>
      </div>

      {/* メインエリア：履歴表示 */}
      <div className="flex-1 overflow-hidden relative bg-gray-950">
        <div className="absolute inset-0 p-4 overflow-y-auto space-y-3" ref={scrollRef}>
          {phase === 'SETUP' && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-80">
              <div className="bg-indigo-900/30 p-4 rounded-full">
                <ShieldQuestion size={48} className="text-indigo-400" />
              </div>
              <p className="text-sm text-gray-300">
                相手に当てられないように<br/>
                3桁の数字を決めてください
              </p>
            </div>
          )}

          {history.map((item, idx) => (
            <div key={idx} className={`flex ${item.turn === 'PLAYER' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                item.turn === 'PLAYER' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
              }`}>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xl font-bold tracking-widest">{item.guess}</span>
                  <div className="flex gap-2 text-sm font-bold">
                    <span className="text-yellow-400">{item.hit}H</span>
                    <span className="text-blue-400">{item.blow}B</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {cpuThinking && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-gray-800 text-gray-400 rounded-2xl rounded-bl-none px-4 py-2 text-xs flex items-center gap-1">
                <Cpu size={12} />
                thinking...
              </div>
            </div>
          )}
          
          <div className="h-24" />
        </div>
        
        <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none">
          <span className="inline-block bg-black/60 backdrop-blur text-white text-xs px-3 py-1 rounded-full border border-white/10 shadow-lg">
            {message}
          </span>
        </div>
      </div>

      {/* キーパッドエリア */}
      <div className="bg-gray-900 border-t border-gray-800 p-2 pb-6 safe-area-bottom">
        <div className="flex justify-center mb-2 h-12 items-center gap-2">
           {[0, 1, 2].map((i) => (
             <div key={i} className={`w-10 h-12 border-2 rounded flex items-center justify-center text-2xl font-mono font-bold transition-all ${
               inputBuffer[i] ? 'border-indigo-500 text-white bg-indigo-900/20' : 'border-gray-700 text-gray-600 bg-gray-800/50'
             }`}>
               {inputBuffer[i]}
             </div>
           ))}
        </div>

        <div className="grid grid-cols-5 gap-2 px-2 max-w-md mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => {
             const isUsed = inputBuffer.includes(num.toString());
             return (
              <button
                key={num}
                onClick={() => handleKeyInput(num.toString())}
                disabled={isUsed || (currentTurn === 'CPU' && phase === 'PLAYING')}
                className={`h-12 rounded-lg font-bold text-xl transition-all active:scale-95 flex items-center justify-center
                  ${isUsed 
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                    : 'bg-gray-800 hover:bg-gray-700 text-white shadow-sm border-b-2 border-gray-950'
                  }
                  ${(currentTurn === 'CPU' && phase === 'PLAYING') ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                {num}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2 px-2 max-w-md mx-auto">
          <button
            onClick={handleDelete}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 h-12 rounded-lg flex items-center justify-center transition-all active:scale-95 border-b-2 border-gray-950"
          >
            <Delete size={20} />
          </button>
          
          <button
            onClick={handleEnter}
            disabled={inputBuffer.length !== 3 || (currentTurn === 'CPU' && phase === 'PLAYING')}
            className={`h-12 rounded-lg flex items-center justify-center font-bold gap-2 transition-all active:scale-95 shadow-lg
              ${inputBuffer.length === 3 && (currentTurn === 'PLAYER' || phase === 'SETUP')
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/50' 
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }
            `}
          >
            <Check size={20} />
            <span>DECIDE</span>
          </button>
        </div>
      </div>
    </div>
  );
};