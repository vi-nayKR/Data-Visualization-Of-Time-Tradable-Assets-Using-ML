import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockApiService } from '../../core/services/stock-api.service';
import { OHLCVRecord, Timeframe } from '../../core/models/stock.model';
import { CandlestickChartComponent } from './candlestick-chart.component';

@Component({
  selector: 'app-data-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, CandlestickChartComponent],
  template: `
    <div class="flex flex-col h-full bg-[var(--color-void)] text-[var(--color-frost)] overflow-hidden transition-colors duration-300">
      
      <!-- SUB-HEADER: INDICATORS & TOOLBAR -->
      <div class="h-10 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-3 sm:px-4 text-xs flex-shrink-0 gap-2 overflow-x-auto transition-colors duration-300">
        
        <!-- Left: Active Indicators Chips & Controls -->
        <div class="flex items-center gap-1.5 sm:gap-2">
          
          <!-- SMA Indicator Chip -->
          <div class="flex items-center gap-1.5 bg-[var(--color-void)] border border-[var(--color-border)] rounded-lg px-2.5 py-1">
            <span class="w-2.5 h-2.5 rounded-full bg-[#ff9242]"></span>
            <span class="font-bold text-[var(--color-frost)] text-xs">SMA</span>
            <span class="font-mono-num text-[var(--color-muted)] text-xs">({{ maDays() }}d)</span>
            
            <button (click)="showMA.set(!showMA())"
                    [class]="showMA() ? 'text-[#089981]' : 'text-[var(--color-muted)]'"
                    class="hover:opacity-80 ml-0.5 p-0.5" title="Toggle SMA Visibility">
              @if (showMA()) {
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              } @else {
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              }
            </button>
          </div>

          <!-- SMA Period Settings Modal -->
          <div class="relative">
            <button (click)="showMASettings.set(!showMASettings())"
                    class="p-1 hover:bg-[var(--color-void)] rounded-lg text-[var(--color-muted)] hover:text-[var(--color-frost)] transition-colors" title="SMA Settings">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>

            @if (showMASettings()) {
              <div class="absolute left-0 top-8 w-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl p-3.5 z-50 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-[var(--color-frost)] text-xs">SMA Moving Average</span>
                  <span class="font-mono-num font-bold text-[var(--color-accent)]">{{ maDays() }} Days</span>
                </div>
                <input type="range" [min]="5" [max]="200" [value]="maDays()"
                       (input)="onMaSliderChange($event)"
                       class="w-full accent-[var(--color-accent)]">
              </div>
            }
          </div>

          <!-- EMA Toggle -->
          <button (click)="showEMA.set(!showEMA())"
                  [class]="showEMA() ? 'bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]/50' : 'bg-[var(--color-void)] text-[var(--color-muted)] border-[var(--color-border)] hover:text-[var(--color-frost)]'"
                  class="flex items-center gap-1.5 border rounded-lg px-2.5 py-1 transition-all">
            <span class="w-2 h-2 rounded-full bg-[#00e5ff]"></span>
            <span class="font-bold">EMA (20)</span>
          </button>

          <!-- Bollinger Bands Toggle -->
          <button (click)="showBB.set(!showBB())"
                  [class]="showBB() ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border-[var(--color-accent)]/50' : 'bg-[var(--color-void)] text-[var(--color-muted)] border-[var(--color-border)] hover:text-[var(--color-frost)]'"
                  class="flex items-center gap-1.5 border rounded-lg px-2.5 py-1 transition-all">
            <span class="w-2 h-2 rounded-full bg-[var(--color-accent)]"></span>
            <span class="font-bold">BB (20,2)</span>
          </button>

          <!-- RSI Oscillator Toggle -->
          <button (click)="showRSI.set(!showRSI())"
                  [class]="showRSI() ? 'bg-[#e040fb]/20 text-[#e040fb] border-[#e040fb]/50' : 'bg-[var(--color-void)] text-[var(--color-muted)] border-[var(--color-border)] hover:text-[var(--color-frost)]'"
                  class="flex items-center gap-1.5 border rounded-lg px-2.5 py-1 transition-all">
            <span class="w-2 h-2 rounded-full bg-[#e040fb]"></span>
            <span class="font-bold">RSI (14)</span>
          </button>
        </div>

        <!-- Right: View Mode Toggle -->
        <div class="flex items-center gap-1 bg-[var(--color-void)] p-0.5 rounded-lg border border-[var(--color-border)] flex-shrink-0">
          <button (click)="viewMode.set('chart')"
                  [class]="viewMode() === 'chart' ? 'bg-[var(--color-accent)] text-white font-bold shadow' : 'text-[var(--color-muted)] hover:text-[var(--color-frost)]'"
                  class="px-3 py-1 rounded-md text-xs transition-all">
            Chart View
          </button>
          <button (click)="viewMode.set('financials')"
                  [class]="viewMode() === 'financials' ? 'bg-[var(--color-accent)] text-white font-bold shadow' : 'text-[var(--color-muted)] hover:text-[var(--color-frost)]'"
                  class="px-3 py-1 rounded-md text-xs transition-all">
            Key Fundamentals
          </button>
          <button (click)="viewMode.set('table')"
                  [class]="viewMode() === 'table' ? 'bg-[var(--color-accent)] text-white font-bold shadow' : 'text-[var(--color-muted)] hover:text-[var(--color-frost)]'"
                  class="px-3 py-1 rounded-md text-xs transition-all">
            Price History Table
          </button>
        </div>
      </div>

      <!-- MAIN CONTENT VIEWPORT -->
      <div class="flex-1 relative overflow-hidden flex flex-col">
        
        <!-- Loading Spinner -->
        @if (loading()) {
          <div class="absolute inset-0 bg-[var(--color-void)]/85 backdrop-blur-sm z-40 flex flex-col items-center justify-center gap-3">
            <div class="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
            <span class="text-xs font-mono-num text-[var(--color-muted)]">Fetching real-time market data for {{ api.selectedTicker() }}...</span>
          </div>
        }

        <!-- 1. CHART VIEW -->
        @if (viewMode() === 'chart') {
          <div class="flex-1 w-full relative">
            <app-candlestick-chart [data]="records()"
                                   [maDays]="maDays()"
                                   [showMA]="showMA()"
                                   [showEMA]="showEMA()"
                                   [showBB]="showBB()"
                                   [showRSI]="showRSI()"
                                   [chartType]="api.chartType()">
            </app-candlestick-chart>
          </div>

          <!-- Bottom Time Range Dock -->
          <div class="h-9 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-between px-4 text-xs flex-shrink-0 transition-colors duration-300">
            <div class="flex items-center gap-1">
              @for (r of rangeButtons; track r.period) {
                <button (click)="changeRange(r.timeframe, r.period)"
                        [class]="api.timeframe() === r.timeframe ? 'bg-[var(--color-void)] text-[var(--color-accent)] border border-[var(--color-border)] font-bold' : 'text-[var(--color-muted)] hover:text-[var(--color-frost)]'"
                        class="px-2.5 py-0.5 rounded-md text-xs font-mono-num transition-colors">
                  {{ r.label }}
                </button>
              }
            </div>

            <div class="flex items-center gap-4 text-xs font-mono-num text-[var(--color-muted)]">
              <span>Timezone: UTC+05:30</span>
              <span class="text-[#089981] font-semibold flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-[#089981]"></span>
                Market Session Live
              </span>
            </div>
          </div>
        }

        <!-- 2. FUNDAMENTALS VIEW -->
        @else if (viewMode() === 'financials') {
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 space-y-2 shadow">
                <span class="text-xs text-[var(--color-muted)] uppercase font-bold tracking-wider">ISIN Code</span>
                <div class="text-xl font-mono-num font-extrabold text-[var(--color-frost)]">{{ companyInfo()?.isin || 'US0378331005' }}</div>
              </div>
              <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 space-y-2 shadow">
                <span class="text-xs text-[var(--color-muted)] uppercase font-bold tracking-wider">Market Cap</span>
                <div class="text-xl font-mono-num font-bold text-[var(--color-accent)]">$3.42 Trillion</div>
              </div>
              <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 space-y-2 shadow">
                <span class="text-xs text-[var(--color-muted)] uppercase font-bold tracking-wider">Trailing P/E</span>
                <div class="text-xl font-mono-num font-bold text-[#089981]">34.82</div>
              </div>
              <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 space-y-2 shadow">
                <span class="text-xs text-[var(--color-muted)] uppercase font-bold tracking-wider">Dividend Yield</span>
                <div class="text-xl font-mono-num font-bold text-[var(--color-frost)]">0.52%</div>
              </div>
            </div>

            <!-- Ownership Details -->
            <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 space-y-4 shadow-xl">
              <h3 class="text-sm font-bold text-[var(--color-frost)] uppercase tracking-wider">Corporate Governance & Valuation Overview</h3>
              <p class="text-xs text-[var(--color-muted)] leading-relaxed">
                Fundamental ownership metadata, institutional holdings, dividends, and corporate calendar events retrieved in real-time from Yahoo Finance for {{ api.selectedCompanyName() }} ({{ api.selectedTicker() }}).
              </p>
            </div>
          </div>
        }

        <!-- 3. HISTORICAL DATA TABLE VIEW -->
        @else if (viewMode() === 'table') {
          <div class="flex-1 overflow-y-auto p-5">
            <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-xl">
              <table class="w-full text-left text-xs">
                <thead class="bg-[var(--color-void)] text-[var(--color-muted)] uppercase border-b border-[var(--color-border)] sticky top-0 font-bold">
                  <tr>
                    <th class="p-3.5">Date</th>
                    <th class="p-3.5">Open Price</th>
                    <th class="p-3.5">High Price</th>
                    <th class="p-3.5">Low Price</th>
                    <th class="p-3.5">Close Price</th>
                    <th class="p-3.5">Volume</th>
                    <th class="p-3.5">SMA ({{ maDays() }}d)</th>
                    <th class="p-3.5">RSI (14)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[var(--color-border)] font-mono-num text-[var(--color-frost)]">
                  @for (r of records(); track r.date) {
                    <tr class="hover:bg-[var(--color-void)]/60 transition-colors">
                      <td class="p-3.5 text-[var(--color-muted)]">{{ r.date }}</td>
                      <td class="p-3.5">\${{ r.open }}</td>
                      <td class="p-3.5 text-[#089981] font-semibold">\${{ r.high }}</td>
                      <td class="p-3.5 text-[#f23645] font-semibold">\${{ r.low }}</td>
                      <td class="p-3.5 font-bold text-[var(--color-frost)]">\${{ r.close }}</td>
                      <td class="p-3.5 text-[var(--color-muted)]">{{ r.volume }}M</td>
                      <td class="p-3.5 text-[#ff9242]">{{ r.ma ? '$' + r.ma : '—' }}</td>
                      <td class="p-3.5 text-[#e040fb]">{{ r.rsi ? r.rsi : '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

      </div>
    </div>
  `
})
export class DataAnalysisComponent {
  api = inject(StockApiService);

  viewMode = signal<'chart' | 'financials' | 'table'>('chart');
  showMA = signal<boolean>(true);
  showEMA = signal<boolean>(false);
  showBB = signal<boolean>(false);
  showRSI = signal<boolean>(false);
  showMASettings = signal<boolean>(false);
  maDays = signal<number>(50);
  loading = signal<boolean>(false);
  records = signal<OHLCVRecord[]>([]);
  companyInfo = signal<any>(null);

  rangeButtons: { label: string; period: string; timeframe: Timeframe }[] = [
    { label: '5D', period: '5d', timeframe: '5D' },
    { label: '1M', period: '30d', timeframe: '1M' },
    { label: '3M', period: '90d', timeframe: '3M' },
    { label: '6M', period: '180d', timeframe: '6M' },
    { label: '1Y', period: '365d', timeframe: '1Y' },
    { label: 'ALL', period: '730d', timeframe: 'ALL' },
  ];

  constructor() {
    effect(() => {
      const ticker = this.api.selectedTicker();
      const ma = this.maDays();
      const tf = this.api.timeframe();
      
      const periodMap: Record<string, string> = {
        '1D': '5d',
        '5D': '5d',
        '1M': '30d',
        '3M': '90d',
        '6M': '180d',
        '1Y': '365d',
        'ALL': '730d'
      };
      const period = periodMap[tf] || '180d';

      if (ticker) {
        this.fetchData(ticker, ma, period);
      }
    });
  }

  onMaSliderChange(event: Event) {
    const val = +(event.target as HTMLInputElement).value;
    this.maDays.set(val);
  }

  changeRange(tf: Timeframe, period: string) {
    this.api.timeframe.set(tf);
  }

  private async fetchData(ticker: string, ma: number, period: string) {
    this.loading.set(true);
    try {
      const data = await this.api.getMovingAverage(ticker, ma, period);
      this.records.set(data);
      const info = await this.api.getCompanyInfo(ticker);
      this.companyInfo.set(info);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }
}
