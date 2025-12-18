// ゲームIDの定義
export enum GameId {
  REFLEX = 'reflex',         // 既存の反射神経ゲーム（デモ用）
  HIT_AND_BLOW = 'hit-and-blow', // Hit & Blow
  MEMORY = 'memory',         // 神経衰弱（予定）
  CASINO = 'casino',         // カジノマス（予定）
}

// アプリケーションの表示状態管理
export enum AppState {
  LANDING = 'LANDING', // QRスキャン後の初期画面
  LOADING = 'LOADING', // ゲームリソース読み込み中
  GAME = 'GAME',       // ゲームプレイ中
  RESULT = 'RESULT',   // 結果画面
}

// ゲームの基本設定インターフェース
export interface GameConfig {
  id: GameId;
  title: string;
  description: string;
}

// ゲームの結果インターフェース
export interface GameResult {
  score: number;        // スコア（または勝敗フラグ: 1=Win, 0=Lose）
  timestamp: number;
  metadata?: any;       // ゲーム固有の詳細結果（ターン数など）
}
