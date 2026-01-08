import React, { useState, useEffect, useCallback } from 'react';
import { GameResult } from '../../types';
import { CircleAlert, CircleCheck, Spade, Heart, Diamond, Club } from 'lucide-react';

interface MemoryGameProps {
  onGameEnd: (result: GameResult) => void;
}

interface Card {
  id: number;
  rank: string;
  suit: 'spade' | 'heart' | 'diamond' | 'club';
  isFlipped: boolean;
  isMatched: boolean;
}

const SUITS: Card['suit'][] = ['spade', 'heart', 'diamond', 'club'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const MAX_MISTAKES = 5;

export const MemoryGame: React.FC<MemoryGameProps> = ({ onGameEnd }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [removedCount, setRemovedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // ゲーム初期化
  const initGame = useCallback(() => {
    const pairsCount = 6; 
    const selectedRanks = [...RANKS].sort(() => Math.random() - 0.5).slice(0, pairsCount);
    
    let deck: Card[] = [];
    selectedRanks.forEach((rank, index) => {
      const suit1 = SUITS[Math.floor(Math.random() * SUITS.length)];
      const suit2 = SUITS[Math.floor(Math.random() * SUITS.length)];
      
      deck.push({ id: index * 2, rank, suit: suit1, isFlipped: false, isMatched: false });
      deck.push({ id: index * 2 + 1, rank, suit: suit2, isFlipped: false, isMatched: false });
    });

    deck = deck.sort(() => Math.random() - 0.5);
    setCards(deck);
    setMistakes(0);
    setRemovedCount(0);
    setFlippedIndices([]);
    setIsProcessing(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleCardClick = (index: number) => {
    if (isProcessing || cards[index].isFlipped || cards[index].isMatched || flippedIndices.length >= 2) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      checkMatch(newFlipped);
    }
  };

  const checkMatch = (indices: number[]) => {
    setIsProcessing(true);
    const [first, second] = indices;
    
    if (cards[first].rank === cards[second].rank) {
      setTimeout(() => {
        const newCards = [...cards];
        newCards[first].isMatched = true;
        newCards[second].isMatched = true;
        setCards(newCards);
        setRemovedCount(prev => prev + 2);
        setFlippedIndices([]);
        setIsProcessing(false);

        if (removedCount + 2 === 12) {
          endGame(removedCount + 2);
        }
      }, 600);
    } else {
      setTimeout(() => {
        const newCards = [...cards];
        newCards[first].isFlipped = false;
        newCards[second].isFlipped = false;
        setCards(newCards);
        
        const nextMistakes = mistakes + 1;
        setMistakes(nextMistakes);
        setFlippedIndices([]);
        setIsProcessing(false);

        if (nextMistakes >= MAX_MISTAKES) {
          endGame(removedCount);
        }
      }, 1000);
    }
  };

  const endGame = (finalRemoved: number) => {
    const score = 40 * finalRemoved;
    onGameEnd({
      score,
      timestamp: Date.now(),
      metadata: { mistakes, removed: finalRemoved }
    });
  };

  const getSuitIcon = (suit: Card['suit'], size: number = 24) => {
    switch (suit) {
      case 'spade': return <Spade className="text-gray-900" size={size} />;
      case 'heart': return <Heart className="text-red-600" size={size} />;
      case 'diamond': return <Diamond className="text-red-600" size={size} />;
      case 'club': return <Club className="text-gray-900" size={size} />;
    }
  };

  return (
    // overflow-hidden を削除し、min-h-screen に変更
    <div className="flex flex-col min-h-screen bg-emerald-950 p-4 relative">
      {/* HUD: 固定位置のまま */}
      <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-20">
        <div className="bg-black/60 backdrop-blur px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 shadow-lg">
          <CircleAlert size={14} className="text-red-400" />
          <span className="text-[10px] font-bold text-gray-300">MISS:</span>
          <span className={`text-xs font-mono font-bold ${mistakes >= MAX_MISTAKES - 1 ? 'text-red-500' : 'text-white'}`}>
            {mistakes}/{MAX_MISTAKES}
          </span>
        </div>
        <div className="bg-black/60 backdrop-blur px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 shadow-lg">
          <CircleCheck size={14} className="text-emerald-400" />
          <span className="text-[10px] font-bold text-gray-300">MATCH:</span>
          <span className="text-xs font-mono font-bold text-white">
            {removedCount}/12
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 mt-12 mb-8">
        <div className="grid grid-cols-4 gap-3 w-full max-w-sm">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`aspect-[2.5/3.5] relative perspective-1000 transition-all duration-300 ${card.isMatched ? 'opacity-0 scale-75 pointer-events-none' : 'hover:scale-105'}`}
            >
              <div
                onClick={() => handleCardClick(index)}
                className={`relative w-full h-full transition-transform duration-500 transform-style-3d cursor-pointer rounded-lg shadow-xl ${card.isFlipped ? 'rotate-y-180' : ''}`}
              >
                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-lg border border-indigo-400/30 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-1 border border-white/5 rounded-md flex items-center justify-center">
                    <Spade size={20} className="text-white/10" />
                  </div>
                </div>

                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-center p-1 shadow-inner">
                  <div className="absolute top-1 left-1 flex flex-col items-center leading-none">
                    <span className={`text-[10px] font-black ${card.suit === 'heart' || card.suit === 'diamond' ? 'text-red-600' : 'text-gray-900'}`}>
                      {card.rank}
                    </span>
                    {getSuitIcon(card.suit, 8)}
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="mb-0.5">
                      {getSuitIcon(card.suit, 24)}
                    </div>
                    <span className={`text-sm font-black leading-none ${card.suit === 'heart' || card.suit === 'diamond' ? 'text-red-600' : 'text-gray-900'}`}>
                      {card.rank}
                    </span>
                  </div>

                  <div className="absolute bottom-1 right-1 flex flex-col items-center leading-none rotate-180">
                    <span className={`text-[10px] font-black ${card.suit === 'heart' || card.suit === 'diamond' ? 'text-red-600' : 'text-gray-900'}`}>
                      {card.rank}
                    </span>
                    {getSuitIcon(card.suit, 8)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-1.5 bg-black/40 backdrop-blur rounded-full border border-white/5">
          <p className="text-emerald-300/80 text-[10px] uppercase tracking-widest font-black text-center">
            {isProcessing ? "CHECKING..." : "SELECT TWO CARDS"}
          </p>
        </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};