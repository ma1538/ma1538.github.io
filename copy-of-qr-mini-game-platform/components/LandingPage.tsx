
import React from 'react';
import { GameId } from '../types';
import { QrCode, Brain, Spade, CircleDollarSign } from 'lucide-react';

interface LandingPageProps {
  onSelectGame: (id: GameId) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectGame }) => {
  return (
    <div className="flex flex-col h-full p-6 animate-fade-in overflow-y-auto">
      {/* ヘッダーセクション */}
      <div className="text-center space-y-2 mb-10 mt-6">
        <div className="bg-indigo-600/20 p-4 rounded-full inline-block border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
          <QrCode size={36} className="text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-2">
          QR Mini Game
        </h1>
        <p className="text-gray-400 text-xs">
          QRコードからアクセス可能なミニゲームプラットフォーム
        </p>
      </div>

      {/* ゲーム選択セクション */}
      <div className="space-y-4 w-full max-w-sm mx-auto pb-12">
        {/* Hit & Blow */}
        <button
          onClick={() => onSelectGame(GameId.HIT_AND_BLOW)}
          className="w-full bg-gray-900/60 border border-indigo-500/30 p-5 rounded-2xl text-left hover:bg-gray-800 transition-all active:scale-95 group relative overflow-hidden shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start gap-4">
            <div className="bg-indigo-500/20 p-3 rounded-xl text-indigo-400">
              <Brain size={26} />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Hit & Blow</h3>
              <p className="text-xs text-gray-400 mt-1">3桁の数字を推理する論理的思考バトル。相手の数字を先に当てろ。</p>
            </div>
          </div>
        </button>

        {/* 神経衰弱 */}
        <button
          onClick={() => onSelectGame(GameId.MEMORY)}
          className="w-full bg-gray-900/60 border border-purple-500/30 p-5 rounded-2xl text-left hover:bg-gray-800 transition-all active:scale-95 group relative overflow-hidden shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start gap-4">
            <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400">
              <Spade size={26} />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">神経衰弱</h3>
              <p className="text-xs text-gray-400 mt-1">瞬時の記憶力が試される。トランプのペアをすべて見つけ出せ。</p>
            </div>
          </div>
        </button>

        {/* カジノマス（スロット） */}
        <button
          onClick={() => onSelectGame(GameId.CASINO)}
          className="w-full bg-gray-900/60 border border-yellow-500/30 p-5 rounded-2xl text-left hover:bg-gray-800 transition-all active:scale-95 group relative overflow-hidden shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start gap-4">
            <div className="bg-yellow-500/20 p-3 rounded-xl text-yellow-400">
              <CircleDollarSign size={26} />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">カジノ・スロット</h3>
              <p className="text-xs text-gray-400 mt-1">運を味方につけてハイスコアを目指せ。最大3回転の勝負。</p>
            </div>
          </div>
        </button>
      </div>

      {/* フッター */}
      <div className="mt-auto pt-6 text-center">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-medium">
          Powered by Gemini API & React
        </p>
      </div>
    </div>
  );
};
