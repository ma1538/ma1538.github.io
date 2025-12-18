import React from 'react';
import { GameResult } from '../types';
import { RotateCcw, Home, Trophy, Share2 } from 'lucide-react';

interface ResultScreenProps {
  result: GameResult;
  onRetry: () => void;
  onHome: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ result, onRetry, onHome }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900 p-6 animate-fade-in relative z-50">
      
      <div className="w-full max-w-sm bg-gray-800/80 backdrop-blur border border-gray-700 rounded-2xl p-8 text-center shadow-2xl">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-yellow-500/20 rounded-full ring-2 ring-yellow-500/50">
            <Trophy size={48} className="text-yellow-400" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-300 mb-2">GAME FINISHED</h2>
        
        <div className="my-8">
          <p className="text-sm text-gray-400 mb-1">YOUR SCORE</p>
          <p className="text-5xl font-black text-white tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400">
            {result.score.toLocaleString()}
          </p>
        </div>

        {/* アクションボタン */}
        <div className="space-y-3 w-full">
          <button
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-colors"
          >
            <RotateCcw size={18} />
            <span>もう一度遊ぶ</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
             <button
              onClick={onHome}
              className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-xl transition-colors"
            >
              <Home size={18} />
              <span>ホーム</span>
            </button>
            <button
              className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
              disabled
              title="機能は実装されていません"
            >
              <Share2 size={18} />
              <span>共有</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-xs text-gray-500">
        スコアは保存されません
      </div>
    </div>
  );
};