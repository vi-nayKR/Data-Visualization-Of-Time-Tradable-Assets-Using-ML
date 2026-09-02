import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockApiService } from '../../core/services/stock-api.service';
import { OHLCVRecord } from '../../core/models/stock.model';
import { CandlestickChartComponent } from './candlestick-chart.component';

@Component({
  selector: 'app-data-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, CandlestickChartComponent],
  template: `
    <div class="flex flex-col h-full bg-[#131722] text-[#f0f3fa] overflow-hidden">
      
      <!-- SUB-HEADER: TRADINGVIEW INDICATORS & TOOLBAR -->
      <div class="h-10 bg-[#1e222d] border-b border-[#2a2e39] flex items-center justify-between px-4 text-xs flex-shrink-0">
        
        <!-- Left: Active Indicators Chips & Controls -->
        <div class="flex items-center gap-2">
          
          <!-- Moving Average Indicator Chip -->
          <div class="flex items-center gap-2 bg-[#131722] border border-[#363c4e] rounded px-3 py-1">
            <span class="w-2.5 h-2.5 rounded-full bg-[#ff9800]"></span>
            <span class="font-bold text-white text-xs">SMA</span>
            <span class="font-mono-num text-[#9db2c6] text-xs">({{ maDays() }}d)</span>
            
            <!-- Eye Toggle SVG -->
            <button (click)="showMA.set(!showMA())"
                    [class]="showMA() ? 'text-[#089981]' : 'text-[#787b86]'"
                    class="hover:opacity-80 ml-1 p-0.5" title="Toggle SMA Visibility">
              @if (showMA()) {
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
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

          <!-- SMA Slider Dropdown Trigger -->
          <div class="relative">
            <button (click)="showMASettings.set(!showMASettings())"
                    class="p-1 hover:bg-[#2a2e39] rounded text-[#9db2c6] hover:text-white transition-colors" title="SMA Settings">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>

            @if (showMASettings()) {
              <div class="absolute left-0 top-8 w-64 bg-[#1e222d] border border-[#363c4e] rounded-lg shadow-xl p-3 z-50 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-white text-xs">SMA Moving Average Period</span>
                  <span class="font-mono-num font-bold text-[#2962ff]">{{ maDays() }} Days</span>
                </div>
                <input type="range" [min]="5" [max]="200" [value]="maDays()"
                       (input)="onMaSliderChange($event)"
                       class="w-full accent-[#2962ff]">
              </div>
            }
          </div>

          <!-- Volume Indicator Chip -->
          <div class="flex items-center gap-1.5 bg-[#131722] border border-[#363c4e] rounded px-2.5 py-1 text-[#9db2c6]">
            <span class="w-2 h-2 rounded-full bg-[#089981]"></span>
            <span class="font-bold text-white">Volume</span>
            <span class="font-mono-num">(20)</span>
          </div>
        </div>

        <!-- Right: View Mode Toggle (Chart vs Financials vs Table) -->
        <div class="flex items-center gap-1 bg-[#131722] p-0.5 rounded border border-[#2a2e39]">
          <button (click)="viewMode.set('chart')"
                  [class]="viewMode() === 'chart' ? 'bg-[#2962ff] text-white font-bold' : 'text-[#9db2c6] hover:text-white'"
                  class="px-3 py-1 rounded text-xs transition-all">
            Chart View
          </button>
          <button (click)="viewMode.set('financials')"
                  [class]="viewMode() === 'financials' ? 'bg-[#2962ff] text-white font-bold' : 'text-[#9db2c6] hover:text-white'"
                  class="px-3 py-1 rounded text-xs transition-all">
            Fundamentals & ISIN
          </button>
          <button (click)="viewMode.set('table')"
                  [class]="viewMode() === 'table' ? 'bg-[#2962ff] text-white font-bold' : 'text-[#9db2c6] hover:text-white'"
                  class="px-3 py-1 rounded text-xs transition-all">
            Price History Table
          </button>
        </div>
      </div>

      <!-- MAIN CONTENT VIEWPORT -->
      <div class="flex-1 relative overflow-hidden flex flex-col">
        
        <!-- Loading Spinner -->
        @if (loading()) {
          <div class="absolute inset-0 bg-[#131722]/85 backdrop-blur-sm z-40 flex flex-col items-center justify-center gap-3">
            <div class="w-8 h-8 border-2 border-[#2962ff] border-t-transparent rounded-full animate-spin"></div>
            <span class="text-xs font-mono-num text-[#9db2c6]">Fetching real-time market data for {{ api.selectedTicker() }}...</span>
          </div>
        }

        <!-- 1. CHART VIEW -->
        @if (viewMode() === 'chart') {
          <div class="flex-1 w-full relative">
            <app-candlestick-chart [data]="records()"
                                   [maDays]="maDays()"
                                   [showMA]="showMA()"
                                   [chartType]="api.chartType()">
            </app-candlestick-chart>
          </div>

          <!-- Bottom Time Range Dock -->
          <div class="h-9 bg-[#1e222d] border-t border-[#2a2e39] flex items-center justify-between px-4 text-xs flex-shrink-0">
            <div class="flex items-center gap-1">
              @for (r of rangeButtons; track r.period) {
                <button (click)="changeRange(r.period)"
                        [class]="currentPeriod === r.period ? 'bg-[#2a2e39] text-[#2962ff] font-bold' : 'text-[#9db2c6] hover:text-white'"
                        class="px-2.5 py-0.5 rounded text-xs font-mono-num transition-colors">
                  {{ r.label }}
                </button>
              }
            </div>

            <div class="flex items-center gap-4 text-xs font-mono-num text-[#9db2c6]">
              <span>Timezone: UTC+05:30</span>
              <span class="text-[#089981] font-semibold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-[#089981]"></span>
                Market Session Live
              </span>
            </div>
          </div>
        }

        <!-- 2. FUNDAMENTALS & ISIN VIEW -->
        @else if (viewMode() === 'financials') {
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-[#1e222d] border border-[#2a2e39] rounded-lg p-5 space-y-2">
                <span class="text-xs text-[#9db2c6] uppercase font-bold tracking-wider">ISIN Identifier</span>
                <div class="text-2xl font-mono-num font-extrabold text-white">{{ companyInfo()?.isin || 'US0378331005' }}</div>
              </div>
              <div class="bg-[#1e222d] border border-[#2a2e39] rounded-lg p-5 space-y-2">
                <span class="text-xs text-[#9db2c6] uppercase font-bold tracking-wider">Primary Exchange</span>
                <div class="text-2xl font-bold text-[#2962ff]">NASDAQ / Global Select</div>
              </div>
              <div class="bg-[#1e222d] border border-[#2a2e39] rounded-lg p-5 space-y-2">
                <span class="text-xs text-[#9db2c6] uppercase font-bold tracking-wider">Settlement Currency</span>
                <div class="text-2xl font-mono-num font-bold text-[#089981]">USD ($)</div>
              </div>
            </div>

            <!-- Ownership Details -->
            <div class="bg-[#1e222d] border border-[#2a2e39] rounded-lg p-6 space-y-4">
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">Institutional Ownership & Corporate Calendar</h3>
              <p class="text-xs text-[#9db2c6] leading-relaxed">
                Fundamental ownership metadata, institutional holdings, dividends, and corporate calendar events retrieved in real-time from Yahoo Finance for {{ api.selectedCompanyName() }} ({{ api.selectedTicker() }}).
              </p>
            </div>
          </div>
        }

        <!-- 3. HISTORICAL DATA TABLE VIEW -->
        @else if (viewMode() === 'table') {
          <div class="flex-1 overflow-y-auto p-5">
            <div class="bg-[#1e222d] border border-[#2a2e39] rounded-lg overflow-hidden shadow-xl">
              <table class="w-full text-left text-xs">
                <thead class="bg-[#131722] text-[#9db2c6] uppercase border-b border-[#2a2e39] sticky top-0 font-bold">
                  <tr>
                    <th class="p-3.5">Date</th>
                    <th class="p-3.5">Open Price</th>
                    <th class="p-3.5">High Price</th>
                    <th class="p-3.5">Low Price</th>
                    <th class="p-3.5">Close Price</th>
                    <th class="p-3.5">Volume</th>
                    <th class="p-3.5">SMA ({{ maDays() }}d)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#2a2e39] font-mono-num text-[#f0f3fa]">
                  @for (r of records(); track r.date) {
                    <tr class="hover:bg-[#2a2e39]/60 transition-colors">
                      <td class="p-3.5 text-[#9db2c6]">{{ r.date }}</td>
                      <td class="p-3.5">\${{ r.open }}</td>
                      <td class="p-3.5 text-[#089981] font-semibold">\${{ r.high }}</td>
                      <td class="p-3.5 text-[#f23645] font-semibold">\${{ r.low }}</td>
                      <td class="p-3.5 font-bold text-white">\${{ r.close }}</td>
                      <td class="p-3.5 text-[#9db2c6]">{{ r.volume }}M</td>
                      <td class="p-3.5 text-[#ff9800]">{{ r.ma ? '$' + r.ma : '—' }}</td>
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
  showMASettings = signal<boolean>(false);
  maDays = signal<number>(50);
  loading = signal<boolean>(false);
  records = signal<OHLCVRecord[]>([]);
  companyInfo = signal<any>(null);
  currentPeriod = '180d';

  rangeButtons = [
    { label: '1M', period: '30d' },
    { label: '3M', period: '90d' },
    { label: '6M', period: '180d' },
    { label: '1Y', period: '365d' },
    { label: 'ALL', period: '730d' },
  ];

  constructor() {
    effect(() => {
      const ticker = this.api.selectedTicker();
      const ma = this.maDays();
      if (ticker) {
        this.fetchData(ticker, ma, this.currentPeriod);
      }
    });
  }

  onMaSliderChange(event: Event) {
    const val = +(event.target as HTMLInputElement).value;
    this.maDays.set(val);
  }

  changeRange(period: string) {
    this.currentPeriod = period;
    this.fetchData(this.api.selectedTicker(), this.maDays(), period);
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
