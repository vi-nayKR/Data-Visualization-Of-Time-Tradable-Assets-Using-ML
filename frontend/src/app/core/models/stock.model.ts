export interface Company {
  name: string;
  ticker: string;
  market: 'in'|'us';
  currency:'INR'|'USD';
}

export interface OHLCVRecord {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
  ma?: number | null;
  ema?: number | null;
  rsi?: number | null;
  macd?: number | null;
  macdSignal?: number | null;
  macdHist?: number | null;
  bbUpper?: number | null;
  bbLower?: number | null;
  bbMiddle?: number | null;
}

export interface Forecast { price:number; return:number; lower:number; upper:number; horizon:1|5; origin_price:number; }
export interface ModelMetrics { mae_return:number; rmse_return:number; mae_price:number; mape_price:number; directional_accuracy:number; directional_accuracy_ci:[number,number]; skill_vs_naive:number|null; observations:number; }
export interface PredictionResponse { ticker:string; market:'in'|'us'; currency:'INR'|'USD'; model:string; metrics:ModelMetrics; forecast:Forecast; naive:Forecast; as_of:string; trained_at:string; validation_mae:number; }
export interface ModelScore { name:string; validation_mae:number; metrics:ModelMetrics; forecast:Forecast; }
export interface BestModelResponse { ticker:string; market:'in'|'us'; currency:'INR'|'USD'; winner:string; models:ModelScore[]; leaderboard:ModelScore[]; beats_naive:boolean; winner_beats_naive:boolean; message:string; as_of:string; trained_at:string; }
export interface ModelStatus { trained_at:string; data_as_of:Record<string,string>; failures:Record<string,string>; }

export type Timeframe = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
export type ChartType = 'candlestick' | 'line' | 'bar' | 'area';
