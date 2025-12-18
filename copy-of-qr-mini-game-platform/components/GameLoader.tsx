import React, { useEffect, useState } from 'react';
import { Loader2, Smartphone } from 'lucide-react';

interface GameLoaderProps {
  onComplete: () => void;
}

export const GameLoader: React.FC<GameLoaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 擬似的なローディング処理
    // 実際の実装ではここで画像や音声アセットのプリロードを行います
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 15;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      // 100%になってから少し待機して遷移させる
      const timer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-black relative">
      <div className="absolute inset-0 bg-[url('https://picsum.photos/1000/1000?blur=5')] opacity-20 bg-cover bg-center" />
      
      <div className="relative z-10 flex flex-col items-center space-y-6 w-64">
        <div className="relative">
          <Smartphone size={48} className="text-gray-400 animate-pulse" />
          <Loader2 size={48} className="text-indigo-500 absolute inset-0 animate-spin opacity-50" />
        </div>
        
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs text-gray-400 uppercase tracking-wider">
            <span>Loading Assets</span>
            <span>{Math.min(100, Math.floor(progress))}%</span>
          </div>
          <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 animate-pulse">
          画面の向きを縦に固定してください
        </p>
      </div>
    </div>
  );
};