export interface Company {
  name: string;
  ticker: string;
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
}

export interface PredictionResponse {
  ticker: string;
  model: string;
  confidence: number;
  records: OHLCVRecord[];
  predictions: (number | null)[];
}

export interface ModelScore {
  name: string;
  score: number;
}

export interface BestModelResponse {
  ticker: string;
  winner: string;
  winnerScore: number;
  models: ModelScore[];
  records: OHLCVRecord[];
  predictions: (number | null)[];
}

export type Timeframe = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
export type ChartType = 'candlestick' | 'line' | 'bar' | 'area';
