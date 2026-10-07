import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ModelStatus, Company, OHLCVRecord, PredictionResponse, BestModelResponse, Timeframe, ChartType } from '../models/stock.model';

export type DrawingTool = 'crosshair' | 'trendline' | 'fibonacci' | 'brush' | 'target' | 'measure' | 'zoom' | 'none';

@Injectable({ providedIn: 'root' })
export class StockApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  sources = signal<Record<string, 'live' | 'snapshot'>>({});
  source = computed<'live' | 'snapshot'>(() => Object.values(this.sources()).includes('snapshot') ? 'snapshot' : 'live');
  generatedAt = signal('');
  private manifest?: Promise<{ generated_at: string }>;

  sourceLabel(scope: string): string {
    return this.sources()[scope] === 'snapshot' ? `Snapshot · ${this.generatedAt()}` : 'Live';
  }

  private async request<T>(path: string, snapshotPath: string, scope: string): Promise<T> {
    try {
      const data = await firstValueFrom(this.http.get<T>(`${this.baseUrl}/${path}`).pipe(timeout(5000)));
      this.sources.update(s => ({ ...s, [scope]: 'live' }));
      return data;
    } catch (error) {
      this.handleHttpError(error);
      const data = await firstValueFrom(this.http.get<T>(`/data/${snapshotPath}.json`));
      if (scope === 'prediction' && (data as any).forecast?.horizon !== this.horizon()) this.horizon.set(5);
      if (scope === 'best' && (data as any).evaluation?.horizon !== this.horizon()) this.horizon.set(5);
      this.manifest ??= firstValueFrom(this.http.get<{ generated_at: string }>('/data/manifest.json'));
      const manifest = await this.manifest;
      this.generatedAt.set(manifest.generated_at.slice(0, 10));
      this.sources.update(s => ({ ...s, [scope]: 'snapshot' }));
      return data;
    }
  }

  // Theme state synchronized with Portfolio-Ng
  isDarkMode = signal<boolean>(true);

  market = signal<'in'|'us'>('us');
  horizon = signal<1|5>(5);
  currency = computed(() => this.market() === 'in' ? 'INR' : 'USD');
  currencySymbol = computed(() => this.market() === 'in' ? '?' : '$');
  modelStatus = signal<ModelStatus|null>(null);
  selectedTicker = signal<string>('AAPL');
  selectedCompanyName = signal<string>('Apple Inc.');
  companies = signal<Company[]>([]);
  searchQuery = signal<string>('');
  
  // Terminal state signals
  timeframe = signal<Timeframe>('6M');
  chartType = signal<ChartType>('candlestick');
  currentRecords = signal<OHLCVRecord[]>([]);

  // Rate Limiting & Infra Alert signals
  rateLimitWarning = signal<{ active: boolean; message: string; retryAfter: number }>({
    active: false,
    message: '',
    retryAfter: 0
  });

  // Interactive Drawing & Tool Modes
  activeDrawingTool = signal<DrawingTool>('crosshair');
  drawingAction = signal<{ type: 'clear' | 'fibonacci' | 'zoom' | 'measure', timestamp: number } | null>(null);

  constructor() {
    this.initTheme();
  }

  private initTheme() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      const isLight = saved === 'light';
      this.isDarkMode.set(!isLight);
      this.applyTheme(!isLight);
    }
  }

  toggleTheme() {
    const nextDark = !this.isDarkMode();
    this.isDarkMode.set(nextDark);
    this.applyTheme(nextDark);
  }

  private applyTheme(dark: boolean) {
    if (typeof document === 'undefined') return;
    if (dark) {
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }
  }

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

  private handleHttpError(error: any): void {
    if (error instanceof HttpErrorResponse && error.status === 429) {
      const retryAfter = error.error?.retry_after_seconds || 15;
      const msg = error.error?.message || 'Rate limit reached. Please wait a moment before sending more requests.';
      this.rateLimitWarning.set({ active: true, message: msg, retryAfter });
      
      setTimeout(() => {
        this.rateLimitWarning.set({ active: false, message: '', retryAfter: 0 });
      }, retryAfter * 1000);
    }
  }

  async loadCompanies(): Promise<Company[]> {
    try {
      const data = await this.request<Company[]>(`companies/?market=${this.market()}`, `companies-${this.market()}`, 'companies');
      this.companies.set(data);
      if (data.length > 0 && !data.some(c => c.ticker === this.selectedTicker())) {
        this.selectCompany(data[0].ticker, data[0].name);
      }
      return data;
    } catch (e) {
      this.handleHttpError(e);
      return [];
    }
  }

  async selectMarket(market:'in'|'us') {
    this.market.set(market);
    await this.loadCompanies();
  }
  async loadModelStatus() {
    this.modelStatus.set(await this.request<ModelStatus>('models/status','models/status','status'));
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
    try {
      const res = await this.request<OHLCVRecord[]>(`stocks/${encodeURIComponent(ticker)}/ohlcv?period=${period}`, `stocks/${encodeURIComponent(ticker)}/ohlcv`, 'stocks');
      this.currentRecords.set(res);
      return res;
    } catch (e) {
      this.handleHttpError(e);
      return [];
    }
  }

  async getMovingAverage(ticker: string, days = 50, period = '180d'): Promise<OHLCVRecord[]> {
    try {
      const res = await this.request<OHLCVRecord[]>(`stocks/${encodeURIComponent(ticker)}/moving-average?days=${days}&period=${period}`, `stocks/${encodeURIComponent(ticker)}/moving-average`, 'stocks');
      this.currentRecords.set(res);
      return res;
    } catch (e) {
      this.handleHttpError(e);
      return [];
    }
  }

  async getPrediction(ticker: string, model = 'linear_regression', horizon:1|5 = this.horizon()): Promise<PredictionResponse> {
    try {
      return await this.request<PredictionResponse>(`predictions/${encodeURIComponent(ticker)}/predict?model=${model}&horizon=${horizon}`, `predictions/${encodeURIComponent(ticker)}/predict/${model}/h5`, 'prediction');
    } catch (e) {
      this.handleHttpError(e);
      throw e;
    }
  }

  async getBestModel(ticker: string, horizon:1|5 = this.horizon()): Promise<BestModelResponse> {
    try {
      return await this.request<BestModelResponse>(`predictions/${encodeURIComponent(ticker)}/best-model?horizon=${horizon}`, `predictions/${encodeURIComponent(ticker)}/best-model/h5`, 'best');
    } catch (e) {
      this.handleHttpError(e);
      throw e;
    }
  }

  async getCompanyInfo(ticker: string): Promise<any> {
    try {
      return await this.request<any>(`companies/${encodeURIComponent(ticker)}/info`, `companies/${encodeURIComponent(ticker)}/info`, 'info');
    } catch (e) {
      this.handleHttpError(e);
      return null;
    }
  }
}
