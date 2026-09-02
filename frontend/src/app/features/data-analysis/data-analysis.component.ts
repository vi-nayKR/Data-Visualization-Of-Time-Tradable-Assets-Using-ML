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
    <div class="flex flex-col h-full bg-[#131722] text-[#d1d4dc] overflow-hidden">
      
      <!-- SUB-HEADER: TRADINGVIEW INDICATORS & TOOLBAR -->
      <div class="h-10 bg-[#1e222d] border-b border-[#2a2e39] flex items-center justify-between px-4 text-xs">
        
        <!-- Left: Active Indicators Chips & Controls -->
        <div class="flex items-center gap-2">
          
          <!-- Moving Average Indicator Chip -->
          <div class="flex items-center gap-1.5 bg-[#131722] border border-[#363a45] rounded px-2.5 py-1">
            <span class="w-2 h-2 rounded-full bg-[#ff9800]"></span>
            <span class="font-semibold text-white">SMA</span>
            <span class="font-mono text-[#787b86]">({{ maDays() }})</span>
            <button (click)="showMA.set(!showMA())"
                    [class]="showMA() ? 'text-[#089981]' : 'text-[#787b86]'"
                    class="hover:opacity-80 ml-1 text-xs" title="Toggle SMA Visibility">
              {{ showMA() ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>

          <!-- SMA Slider Dropdown Trigger -->
          <div class="relative">
            <button (click)="showMASettings.set(!showMASettings())"
                    class="p-1 hover:bg-[#2a2e39] rounded text-[#787b86] hover:text-white" title="SMA Settings">
              ⚙️
            </button>

            @if (showMASettings()) {
              <div class="absolute left-0 top-8 w-64 bg-[#1e222d] border border-[#363a45] rounded-lg shadow-xl p-3 z-50 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-white text-xs">SMA Period (Days)</span>
                  <span class="font-mono font-bold text-[#2962ff]">{{ maDays() }}d</span>
                </div>
                <input type="range" [min]="5" [max]="200" [value]="maDays()"
                       (input)="onMaSliderChange($event)"
                       class="w-full accent-[#2962ff]">
              </div>
            }
          </div>

          <!-- Volume Indicator Chip -->
          <div class="flex items-center gap-1.5 bg-[#131722] border border-[#363a45] rounded px-2.5 py-1 text-[#787b86]">
            <span class="w-2 h-2 rounded-full bg-[#089981]"></span>
            <span class="font-semibold text-white">Vol</span>
            <span class="font-mono">(20)</span>
          </div>
        </div>

        <!-- Right: View Mode Toggle (Chart vs Financials) -->
        <div class="flex items-center gap-1 bg-[#131722] p-0.5 rounded border border-[#2a2e39]">
          <button (click)="viewMode.set('chart')"
                  [class]="viewMode() === 'chart' ? 'bg-[#2962ff] text-white font-bold' : 'text-[#787b86] hover:text-white'"
                  class="px-3 py-1 rounded text-xs transition-all">
            Chart
          </button>
          <button (click)="viewMode.set('financials')"
                  [class]="viewMode() === 'financials' ? 'bg-[#2962ff] text-white font-bold' : 'text-[#787b86] hover:text-white'"
                  class="px-3 py-1 rounded text-xs transition-all">
            Fundamentals & ISIN
          </button>
          <button (click)="viewMode.set('table')"
                  [class]="viewMode() === 'table' ? 'bg-[#2962ff] text-white font-bold' : 'text-[#787b86] hover:text-white'"
                  class="px-3 py-1 rounded text-xs transition-all">
            Historical Data
          </button>
        </div>
      </div>

      <!-- MAIN CONTENT VIEWPORT -->
      <div class="flex-1 relative overflow-hidden flex flex-col">
        
        <!-- Loading Spinner -->
        @if (loading()) {
          <div class="absolute inset-0 bg-[#131722]/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center gap-3">
            <div class="w-8 h-8 border-2 border-[#2962ff] border-t-transparent rounded-full animate-spin"></div>
            <span class="text-xs font-mono text-[#787b86]">Loading market data for {{ api.selectedTicker() }}...</span>
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

          <!-- Bottom TradingView Range Toolbar -->
          <div class="h-9 bg-[#1e222d] border-t border-[#2a2e39] flex items-center justify-between px-3 text-xs flex-shrink-0">
            <div class="flex items-center gap-1">
              @for (r of rangeButtons; track r.period) {
                <button (click)="changeRange(r.period)"
                        [class]="currentPeriod === r.period ? 'bg-[#2a2e39] text-[#2962ff] font-bold' : 'text-[#787b86] hover:text-white'"
                        class="px-2 py-0.5 rounded text-[11px] font-mono transition-colors">
                  {{ r.label }}
                </button>
              }
            </div>

            <div class="flex items-center gap-3 text-[11px] font-mono text-[#787b86]">
              <span>UTC+05:30 (IST)</span>
              <span class="text-[#089981]">● Market Open</span>
            </div>
          </div>
        }

        <!-- 2. FUNDAMENTALS VIEW -->
        @else if (viewMode() === 'financials') {
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-[#1e222d] border border-[#2a2e39] rounded-lg p-4 space-y-2">
                <span class="text-xs text-[#787b86] uppercase font-bold">ISIN Identifier</span>
                <div class="text-xl font-mono font-extrabold text-white">{{ companyInfo()?.isin || 'N/A' }}</div>
              </div>
              <div class="bg-[#1e222d] border border-[#2a2e39] rounded-lg p-4 space-y-2">
                <span class="text-xs text-[#787b86] uppercase font-bold">Primary Exchange</span>
                <div class="text-xl font-bold text-[#2962ff]">NASDAQ / NYSE</div>
              </div>
              <div class="bg-[#1e222d] border border-[#2a2e39] rounded-lg p-4 space-y-2">
                <span class="text-xs text-[#787b86] uppercase font-bold">Currency</span>
                <div class="text-xl font-mono font-bold text-[#089981]">USD ($)</div>
              </div>
            </div>

            <!-- Holders & Recommendations Data -->
            <div class="bg-[#1e222d] border border-[#2a2e39] rounded-lg p-5 space-y-4">
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">Institutional Ownership & Calendar</h3>
              <p class="text-xs text-[#787b86] leading-relaxed">
                Fundamental ownership metadata and earnings events retrieved directly from Yahoo Finance API for {{ api.selectedCompanyName() }}.
              </p>
            </div>
          </div>
        }

        <!-- 3. HISTORICAL DATA TABLE VIEW -->
        @else if (viewMode() === 'table') {
          <div class="flex-1 overflow-y-auto p-4">
            <div class="bg-[#1e222d] border border-[#2a2e39] rounded-lg overflow-hidden">
              <table class="w-full text-left text-xs">
                <thead class="bg-[#131722] text-[#787b86] uppercase border-b border-[#2a2e39] sticky top-0">
                  <tr>
                    <th class="p-3">Date</th>
                    <th class="p-3">Open</th>
                    <th class="p-3">High</th>
                    <th class="p-3">Low</th>
                    <th class="p-3">Close</th>
                    <th class="p-3">Volume</th>
                    <th class="p-3">SMA ({{ maDays() }})</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#2a2e39] font-mono text-[#d1d4dc]">
                  @for (r of records(); track r.date) {
                    <tr class="hover:bg-[#2a2e39]/50">
                      <td class="p-3 text-[#787b86]">{{ r.date }}</td>
                      <td class="p-3">\${{ r.open }}</td>
                      <td class="p-3 text-[#089981]">\${{ r.high }}</td>
                      <td class="p-3 text-[#f23645]">\${{ r.low }}</td>
                      <td class="p-3 font-bold text-white">\${{ r.close }}</td>
                      <td class="p-3 text-[#787b86]">{{ r.volume }}M</td>
                      <td class="p-3 text-[#ff9800]">{{ r.ma ? '$' + r.ma : '—' }}</td>
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
