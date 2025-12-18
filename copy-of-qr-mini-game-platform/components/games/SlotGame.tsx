
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameResult } from '../../types';
import { CircleDollarSign, Coins, RotateCw, Delete, Play, DoorOpen } from 'lucide-react';

interface SlotGameProps {
  onGameEnd: (result: GameResult) => void;
}

type SymbolType = '7' | 'WM' | 'BL' | 'RP' | 'BLANK';

interface SymbolInfo {
  type: SymbolType;
  display: React.ReactNode;
  label: string;
  color: string;
}

const SYMBOLS: Record<SymbolType, SymbolInfo> = {
  '7': { 
    type: '7', 
    display: <span className="text-red-600 font-black">7</span>, 
    label: '7', 
    color: 'text-red-600' 
  },
  'WM': { 
    type: 'WM', 
    display: <span>🍉</span>, 
    label: 'WM', 
    color: 'text-green-500' 
  },
  'BL': { 
    type: 'BL', 
    display: <span>🔔</span>, 
    label: 'BL', 
    color: 'text-yellow-400' 
  },
  'RP': { 
    type: 'RP', 
    display: <span>🔄</span>, 
    label: 'RP', 
    color: 'text-blue-400' 
  },
  'BLANK': { 
    type: 'BLANK', 
    display: <span>💎</span>, 
    label: '??', 
    color: 'text-gray-400' 
  },
};

const ALL_SYMBOL_TYPES: SymbolType[] = ['7', 'WM', 'BL', 'RP'];
const MAX_BET = 100;

export const SlotGame: React.FC<SlotGameProps> = ({ onGameEnd }) => {
  const [phase, setPhase] = useState<'BETTING' | 'SPINNING' | 'RESULT'>('BETTING');
  const [spinsLeft, setSpinsLeft] = useState(3);
  const [totalScore, setTotalScore] = useState(0);
  const [currentBetInput, setCurrentBetInput] = useState('');
  const [reels, setReels] = useState<SymbolType[]>(['BLANK', 'BLANK', 'BLANK']);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // 当選判定ロジック
  const determineResult = useCallback((): { result: SymbolType[], multiplier: number } => {
    const r = Math.floor(Math.random() * 100);
    
    if (r < 5) { // 5% 7
      return { result: ['7', '7', '7'], multiplier: 5 };
    } else if (r < 15) { // 10% WM
      return { result: ['WM', 'WM', 'WM'], multiplier: 3 };
    } else if (r < 35) { // 20% BL
      return { result: ['BL', 'BL', 'BL'], multiplier: 2 };
    } else if (r < 50) { // 15% RP
      return { result: ['RP', 'RP', 'RP'], multiplier: 1 };
    } else { // 50% はずれ
      let res: SymbolType[] = [];
      do {
        res = [
          ALL_SYMBOL_TYPES[Math.floor(Math.random() * ALL_SYMBOL_TYPES.length)],
          ALL_SYMBOL_TYPES[Math.floor(Math.random() * ALL_SYMBOL_TYPES.length)],
          ALL_SYMBOL_TYPES[Math.floor(Math.random() * ALL_SYMBOL_TYPES.length)]
        ];
      } while (res[0] === res[1] && res[1] === res[2]);
      return { result: res, multiplier: 0 };
    }
  }, []);

  const handleSpin = () => {
    const bet = parseInt(currentBetInput);
    if (isNaN(bet) || bet < 1 || bet > MAX_BET) return;

    setIsSpinning(true);
    setPhase('SPINNING');
    setLastWin(null);

    const { result, multiplier } = determineResult();
    const winAmount = bet * multiplier;

    let count = 0;
    const interval = setInterval(() => {
      setReels([
        ALL_SYMBOL_TYPES[Math.floor(Math.random() * ALL_SYMBOL_TYPES.length)],
        ALL_SYMBOL_TYPES[Math.floor(Math.random() * ALL_SYMBOL_TYPES.length)],
        ALL_SYMBOL_TYPES[Math.floor(Math.random() * ALL_SYMBOL_TYPES.length)]
      ]);
      count++;
      if (count > 20) {
        clearInterval(interval);
        setReels(result);
        setIsSpinning(false);
        setPhase('RESULT');
        setLastWin(winAmount);
        setTotalScore(prev => prev + winAmount);
        setSpinsLeft(prev => prev - 1);
      }
    }, 80);
  };

  const handleNext = () => {
    if (spinsLeft === 0) {
      onGameEnd({ score: totalScore, timestamp: Date.now() });
    } else {
      setPhase('BETTING');
      setCurrentBetInput('');
      setLastWin(null);
    }
  };

  const handleQuit = () => {
    onGameEnd({ score: totalScore, timestamp: Date.now() });
  };

  const addDigit = (digit: string) => {
    if (currentBetInput.length >= 3) return;
    const newVal = currentBetInput + digit;
    const numVal = parseInt(newVal);
    if (numVal > MAX_BET) {
      setCurrentBetInput(MAX_BET.toString());
    } else {
      setCurrentBetInput(newVal);
    }
  };

  const removeDigit = () => {
    setCurrentBetInput(prev => prev.slice(0, -1));
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(184,134,11,0.15),_transparent_70%)]" />
      
      <div className="relative z-10 flex justify-between items-center p-4 bg-black/40 border-b border-yellow-600/30">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-600/20 p-2 rounded-lg border border-yellow-600/50">
            <Coins className="text-yellow-500" size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">Total Score</span>
            <span className="text-xl font-mono font-bold text-white leading-none">{totalScore.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-400 font-bold uppercase">Spins Remaining</span>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full border ${i < spinsLeft ? 'bg-yellow-500 border-yellow-300' : 'bg-gray-800 border-gray-700'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6 relative z-10">
        <div className="w-full max-w-sm aspect-[2/1] bg-gradient-to-b from-gray-800 to-black p-2 rounded-2xl border-4 border-yellow-600 shadow-[0_0_30px_rgba(202,138,4,0.3)]">
          <div className="h-full grid grid-cols-3 gap-2 bg-gray-900 rounded-lg overflow-hidden border-2 border-black">
            {reels.map((symbol, i) => (
              <div key={i} className="relative flex items-center justify-center bg-white shadow-inner overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-300/50 via-transparent to-gray-300/50 pointer-events-none" />
                <div className={`text-4xl sm:text-5xl transform transition-transform duration-75 flex items-center justify-center ${isSpinning ? 'animate-bounce' : ''}`}>
                  {SYMBOLS[symbol].display}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-12 flex items-center justify-center">
          {phase === 'RESULT' && lastWin !== null && (
            <div className={`text-2xl font-black italic tracking-tighter animate-bounce ${lastWin > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
              {lastWin > 0 ? `WIN +${lastWin}!` : 'LOSE...'}
            </div>
          )}
          {phase === 'BETTING' && (
            <div className="text-yellow-500/80 text-xs font-bold uppercase tracking-widest animate-pulse">
              Enter your bet (1-{MAX_BET})
            </div>
          )}
        </div>

        <div className="w-full max-w-sm space-y-4">
          {phase === 'BETTING' ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-center items-center gap-4">
                 <div className="bg-black/60 border-2 border-yellow-600/50 rounded-xl px-6 py-3 flex items-center gap-3">
                   <CircleDollarSign className="text-yellow-500" size={24} />
                   <span className="text-3xl font-mono font-bold w-20 text-center tracking-widest">
                     {currentBetInput || '0'}
                   </span>
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
                  <button
                    key={n}
                    onClick={() => addDigit(n.toString())}
                    className="h-12 rounded-lg bg-gray-800/80 hover:bg-gray-700 active:scale-95 transition-all border-b-2 border-gray-950 font-bold text-xl"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={removeDigit}
                  className="h-12 rounded-lg bg-red-900/40 hover:bg-red-800/60 active:scale-95 transition-all border-b-2 border-red-950 flex items-center justify-center"
                >
                  <Delete size={20} className="text-red-400" />
                </button>
                <button
                  onClick={handleQuit}
                  className="h-12 rounded-lg bg-gray-900 border-2 border-gray-700/50 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <DoorOpen size={18} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-400 uppercase">Exit</span>
                </button>
              </div>

              <button
                onClick={handleSpin}
                disabled={!currentBetInput || parseInt(currentBetInput) < 1}
                className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-black text-2xl transition-all shadow-xl active:scale-95
                  ${currentBetInput && parseInt(currentBetInput) >= 1 
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-yellow-900/50' 
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                  }`}
              >
                <Play fill="currentColor" size={28} />
                SPIN!
              </button>
            </div>
          ) : phase === 'RESULT' ? (
            <div className="animate-in fade-in zoom-in-95">
              <button
                onClick={handleNext}
                className="w-full h-16 bg-white text-black rounded-2xl flex items-center justify-center gap-3 font-black text-2xl transition-all shadow-xl active:scale-95 border-b-4 border-gray-300"
              >
                {spinsLeft === 0 ? 'FINISH' : 'NEXT SPIN'}
                <RotateCw size={24} />
              </button>
            </div>
          ) : (
            <div className="flex justify-center items-center h-16">
               <div className="flex gap-2">
                 <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" />
                 <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                 <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce [animation-delay:0.4s]" />
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-black/60 border-t border-yellow-600/30 grid grid-cols-4 gap-2 relative z-10">
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-red-600">777</span>
          <span className="text-[10px] font-bold text-yellow-500">x5</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs">🍉🍉🍉</span>
          <span className="text-[10px] font-bold text-yellow-500">x3</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs">🔔🔔🔔</span>
          <span className="text-[10px] font-bold text-yellow-500">x2</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs">🔄🔄🔄</span>
          <span className="text-[10px] font-bold text-yellow-500">x1</span>
        </div>
      </div>
    </div>
  );
};
