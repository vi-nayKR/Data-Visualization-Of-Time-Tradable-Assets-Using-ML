import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Company, OHLCVRecord, PredictionResponse, BestModelResponse, Timeframe, ChartType } from '../models/stock.model';

export type DrawingTool = 'crosshair' | 'trendline' | 'fibonacci' | 'brush' | 'target' | 'measure' | 'zoom' | 'none';

@Injectable({ providedIn: 'root' })
export class StockApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  selectedTicker = signal<string>('AAPL');
  selectedCompanyName = signal<string>('Apple Inc.');
  companies = signal<Company[]>([]);
  searchQuery = signal<string>('');
  
  // Terminal state signals
  timeframe = signal<Timeframe>('6M');
  chartType = signal<ChartType>('candlestick');
  currentRecords = signal<OHLCVRecord[]>([]);

  // Interactive Drawing & Tool Modes
  activeDrawingTool = signal<DrawingTool>('crosshair');
  drawingAction = signal<{ type: 'clear' | 'fibonacci' | 'zoom' | 'measure', timestamp: number } | null>(null);

  // Computed state
  filteredCompanies = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.companies();
    return this.companies().filter(
      c => c.name.toLowerCase().includes(q) || c.ticker.toLowerCase().includes(q)
    );
  });

  latestRecord = computed(() => {
    const recs = this.currentRecords();
    return recs.length > 0 ? recs[recs.length - 1] : null;
  });

  previousRecord = computed(() => {
    const recs = this.currentRecords();
    return recs.length > 1 ? recs[recs.length - 2] : null;
  });

  priceChange = computed(() => {
    const curr = this.latestRecord();
    const prev = this.previousRecord();
    if (!curr || !prev) return { diff: 0, percent: 0, isPositive: true };
    const diff = curr.close - prev.close;
    const percent = prev.close !== 0 ? (diff / prev.close) * 100 : 0;
    return {
      diff: Math.round(diff * 100) / 100,
      percent: Math.round(percent * 100) / 100,
      isPositive: diff >= 0
    };
  });

  setTool(tool: DrawingTool) {
    this.activeDrawingTool.set(tool);
    if (tool === 'fibonacci') {
      this.triggerAction('fibonacci');
    } else if (tool === 'zoom') {
      this.triggerAction('zoom');
    } else if (tool === 'measure') {
      this.triggerAction('measure');
    }
  }

  triggerAction(type: 'clear' | 'fibonacci' | 'zoom' | 'measure') {
    this.drawingAction.set({ type, timestamp: Date.now() });
  }

  async loadCompanies(): Promise<Company[]> {
    try {
      const data = await firstValueFrom(this.http.get<Company[]>(`${this.baseUrl}/companies`));
      this.companies.set(data);
      if (data.length > 0 && !this.selectedTicker()) {
        this.selectCompany(data[0].ticker, data[0].name);
      }
      return data;
    } catch (e) {
      console.error('Failed to load companies:', e);
      return [];
    }
  }

  selectCompany(ticker: string, name?: string) {
    this.selectedTicker.set(ticker);
    if (name) {
      this.selectedCompanyName.set(name);
    } else {
      const c = this.companies().find(x => x.ticker === ticker);
      if (c) this.selectedCompanyName.set(c.name);
    }
  }

  async getOHLCV(ticker: string, period = '180d'): Promise<OHLCVRecord[]> {
    const res = await firstValueFrom(
      this.http.get<OHLCVRecord[]>(`${this.baseUrl}/stocks/${ticker}/ohlcv?period=${period}`)
    );
    this.currentRecords.set(res);
    return res;
  }

  async getMovingAverage(ticker: string, days = 50, period = '180d'): Promise<OHLCVRecord[]> {
    const res = await firstValueFrom(
      this.http.get<OHLCVRecord[]>(`${this.baseUrl}/stocks/${ticker}/moving-average?days=${days}&period=${period}`)
    );
    this.currentRecords.set(res);
    return res;
  }

  async getPrediction(ticker: string, model = 'linear_regression'): Promise<PredictionResponse> {
    return firstValueFrom(
      this.http.get<PredictionResponse>(`${this.baseUrl}/predictions/${ticker}/predict?model=${model}`)
    );
  }

  async getBestModel(ticker: string): Promise<BestModelResponse> {
    return firstValueFrom(
      this.http.get<BestModelResponse>(`${this.baseUrl}/predictions/${ticker}/best-model`)
    );
  }

  async getCompanyInfo(ticker: string): Promise<any> {
    return firstValueFrom(
      this.http.get<any>(`${this.baseUrl}/companies/${ticker}/info`)
    );
  }
}
