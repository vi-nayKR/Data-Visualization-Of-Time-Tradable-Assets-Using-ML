import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockApiService } from '../../core/services/stock-api.service';
import { OHLCVRecord } from '../../core/models/stock.model';
import { CandlestickChartComponent } from './candlestick-chart.component';
import { VolumeChartComponent } from './volume-chart.component';
import { PriceChartComponent } from './price-chart.component';

@Component({
  selector: 'app-data-analysis',
  standalone: true,
  imports: [
    CommonModule,
    CandlestickChartComponent,
    VolumeChartComponent,
    PriceChartComponent
  ],
  template: `
    <div class="space-y-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 class="text-3xl font-extrabold bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">
            Visualization for {{ api.selectedCompanyName() }} ({{ api.selectedTicker() }})
          </h1>
          <p class="text-slate-400 text-sm mt-1">Live market evolution & technical indicators</p>
        </div>

        <div class="flex items-center gap-3 bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-2">
          <span class="text-xs font-semibold text-slate-300">View Option:</span>
          <button (click)="viewOption.set('graphs')"
                  [class]="viewOption() === 'graphs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'"
                  class="px-3 py-1 text-xs font-semibold rounded-lg transition-all">
            Graphs
          </button>
          <button (click)="viewOption.set('company_data')"
                  [class]="viewOption() === 'company_data' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'"
                  class="px-3 py-1 text-xs font-semibold rounded-lg transition-all">
            Company Data
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-20 text-slate-400">
          <div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Fetching market data for {{ api.selectedTicker() }}...</p>
        </div>
      } @else if (viewOption() === 'graphs') {
        <!-- Moving Average Controls -->
        <div class="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4">
          <label class="flex items-center gap-2 cursor-pointer text-slate-200 text-sm font-medium">
            <input type="checkbox" [checked]="showMA()" (change)="showMA.set(!showMA())" class="rounded accent-indigo-500">
            Show Moving Average
          </label>

          @if (showMA()) {
            <div class="flex items-center gap-3 flex-1 w-full">
              <span class="text-xs text-slate-400">Days:</span>
              <input type="range" [min]="5" [max]="200" [value]="maDays()"
                     (input)="onMaSliderChange($event)"
                     class="flex-1 accent-indigo-500">
              <span class="text-sm font-bold text-sky-400 font-mono w-12">{{ maDays() }}d</span>
            </div>
          }
        </div>

        <!-- Candlestick Chart -->
        <app-candlestick-chart [data]="records()" [maDays]="maDays()" [showMA]="showMA()"></app-candlestick-chart>

        <!-- Volume Chart -->
        <div class="space-y-2">
          <h2 class="text-xl font-bold text-slate-200">Volume of Stocks</h2>
          <p class="text-slate-400 text-sm leading-relaxed">
            Trading volume measures how much of a given financial asset traded over a period of time.
          </p>
          <app-volume-chart [data]="records()"></app-volume-chart>
        </div>

        <!-- Price Component Charts -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="text-lg font-bold text-slate-200 mb-2">Opening Price</h3>
            <app-price-chart [data]="records()" field="open" color="#38bdf8"></app-price-chart>
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-200 mb-2">High Price</h3>
            <app-price-chart [data]="records()" field="high" color="#22c55e"></app-price-chart>
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-200 mb-2">Low Price</h3>
            <app-price-chart [data]="records()" field="low" color="#ef4444"></app-price-chart>
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-200 mb-2">Closing Price</h3>
            <app-price-chart [data]="records()" field="close" color="#c084fc"></app-price-chart>
          </div>
        </div>

      } @else {
        <!-- Company Data Tab -->
        @if (companyInfo()) {
          <div class="space-y-6">
            <div class="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
              <h2 class="text-xl font-bold text-slate-200 mb-4">Stock Price Data Table</h2>
              <div class="overflow-x-auto max-h-96">
                <table class="w-full text-left text-sm text-slate-300">
                  <thead class="bg-slate-800 text-xs uppercase text-slate-400 sticky top-0">
                    <tr>
                      <th class="p-3">Date</th>
                      <th class="p-3">Open</th>
                      <th class="p-3">High</th>
                      <th class="p-3">Low</th>
                      <th class="p-3">Close</th>
                      <th class="p-3">Volume (M)</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800">
                    @for (r of records(); track r.date) {
                      <tr class="hover:bg-slate-800/50">
                        <td class="p-3 font-mono text-xs">{{ r.date }}</td>
                        <td class="p-3">$\{{ r.open }}</td>
                        <td class="p-3 text-green-400">$\{{ r.high }}</td>
                        <td class="p-3 text-red-400">$\{{ r.low }}</td>
                        <td class="p-3 font-semibold">$\{{ r.close }}</td>
                        <td class="p-3 font-mono text-xs">{{ r.volume }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `
})
export class DataAnalysisComponent {
  api = inject(StockApiService);
  
  viewOption = signal<'graphs' | 'company_data'>('graphs');
  showMA = signal<boolean>(true);
  maDays = signal<number>(50);
  loading = signal<boolean>(false);
  records = signal<OHLCVRecord[]>([]);
  companyInfo = signal<any>(null);

  constructor() {
    effect(() => {
      const ticker = this.api.selectedTicker();
      const ma = this.maDays();
      if (ticker) {
        this.fetchData(ticker, ma);
      }
    });
  }

  onMaSliderChange(event: Event) {
    const val = +(event.target as HTMLInputElement).value;
    this.maDays.set(val);
  }

  private async fetchData(ticker: string, ma: number) {
    this.loading.set(true);
    try {
      const data = await this.api.getMovingAverage(ticker, ma);
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
