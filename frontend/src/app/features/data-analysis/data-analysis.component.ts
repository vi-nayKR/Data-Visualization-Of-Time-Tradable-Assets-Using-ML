import { ChangeDetectionStrategy, Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockApiService } from '../../core/services/stock-api.service';
import { OHLCVRecord, Timeframe, PredictionResponse, BestModelResponse } from '../../core/models/stock.model';
import { UI } from '../../shared/ui';
import { FormsModule } from '@angular/forms';
import { CandlestickChartComponent } from './candlestick-chart.component';
@Component({selector:'app-data-analysis',changeDetection:ChangeDetectionStrategy.OnPush,imports:[CommonModule,...UI,FormsModule,CandlestickChartComponent],template:`
<ui-page-header label="// HISTORICAL SIGNAL" title="Market analysis" description="Inspect price movement, trading volume, and technical indicators in one interactive view." [source]="api.sourceLabel('stocks')" />
<div uiCard class="toolbar"><div class="toolbar-start"><label class="field">Chart style<select uiSelect [value]="api.chartType()" (change)="setChartType($event)"><option value="candlestick">Candlestick</option><option value="line">Price line</option><option value="area">Price area</option><option value="bar">OHLC bars</option></select></label></div><div class="field"><span>History period</span><div class="period-chips" role="group" aria-label="History period">@for(r of rangeButtons;track r.period){<button [attr.aria-pressed]="api.timeframe()===r.timeframe" (click)="changeRange(r.timeframe,r.period)">{{r.label}}</button>}</div></div></div>
<section uiCard aria-labelledby="analysis-title"><div class="panel-heading"><div><h2 id="analysis-title">{{api.selectedCompanyName()}} · {{api.selectedTicker()}}</h2><p>Price above. Trading volume below.</p></div><div uiSegmented aria-label="Data view"><button [attr.aria-pressed]="viewMode()==='chart'" (click)="viewMode.set('chart')">Chart</button><button [attr.aria-pressed]="viewMode()==='financials'" (click)="viewMode.set('financials')">Stats</button><button [attr.aria-pressed]="viewMode()==='table'" (click)="viewMode.set('table')">Table</button></div></div>
<div class="controls-row"><label><input type="checkbox" [checked]="showMA()" (change)="showMA.set(!showMA())">SMA</label><label>Lookback <input uiSelect class="lookback" type="number" min="5" max="200" [value]="maDays()" (change)="onMaSliderChange($event)"></label><label><input type="checkbox" [checked]="showEMA()" (change)="showEMA.set(!showEMA())">EMA 20</label><label><input type="checkbox" [checked]="showBB()" (change)="showBB.set(!showBB())">Bollinger bands</label><label><input type="checkbox" [checked]="showRSI()" (change)="showRSI.set(!showRSI())">RSI 14</label></div>
@if(viewMode()==='chart'){<div class="controls-row"><label>Drawing tool<select uiSelect [value]="api.activeDrawingTool()" (change)="setDrawingTool($event)"><option value="crosshair">Crosshair / pan</option><option value="trendline">Trendline</option><option value="brush">Rectangle</option><option value="measure">Measure</option></select></label><button uiButton (click)="api.triggerAction('fibonacci')">Fibonacci</button><button uiButton (click)="api.triggerAction('zoom')">Zoom to 30 days</button><button uiButton (click)="api.triggerAction('clear')">Clear drawings</button></div>}
@if(loading()){<div class="chart-frame"><ui-skeleton /></div>}@else if(!records().length){<div class="empty-state"><h2>{{error()?'Unable to load this asset':'No historical data available'}}</h2><button uiButton (click)="retry()">Retry</button></div>}@else if(viewMode()==='chart'){<div class="chart-frame"><app-candlestick-chart [data]="records()" [maDays]="maDays()" [showMA]="showMA()" [showEMA]="showEMA()" [showBB]="showBB()" [showRSI]="showRSI()" [chartType]="api.chartType()" /></div><p class="chart-caption">Drag to pan, scroll or pinch to zoom. Snapshot mode contains saved 180-day history and SMA 50.</p>}@else if(viewMode()==='table'){<div class="table-wrap analysis-table" tabindex="0" role="region" aria-label="Historical price table"><table><caption class="sr-only">Historical prices and indicators for {{api.selectedTicker()}}</caption><thead><tr><th>Date</th><th>Open</th><th>High</th><th>Low</th><th>Close</th><th>Volume</th><th>SMA</th><th>RSI</th></tr></thead><tbody>@for(r of records();track r.date){<tr><td>{{r.date}}</td><td>{{r.open | currency:api.currency()}}</td><td>{{r.high | currency:api.currency()}}</td><td>{{r.low | currency:api.currency()}}</td><td>{{r.close | currency:api.currency()}}</td><td>{{r.volume}}</td><td>{{r.ma ?? 'Unavailable'}}</td><td>{{r.rsi ?? 'Unavailable'}}</td></tr>}</tbody></table></div>}@else{<div class="stats-grid stats-in-panel"><div class="stat"><p class="stat-label">LATEST CLOSE</p><p class="metric-value">{{records()[records().length-1].close | currency:api.currency()}}</p></div><div class="stat"><p class="stat-label">OBSERVATIONS</p><p class="metric-value">{{records().length}}</p></div><div class="stat"><p class="stat-label">ISIN</p><p class="metric-value model-name">{{companyInfo()?.isin || 'Unavailable'}}</p></div></div>}
</section>
`})
export class DataAnalysisComponent {
  api = inject(StockApiService);
  error = signal(false);

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

  setChartType(event: Event) { this.api.chartType.set((event.target as HTMLSelectElement).value as import('../../core/models/stock.model').ChartType); }
  setDrawingTool(event: Event) { this.api.setTool((event.target as HTMLSelectElement).value as import('../../core/services/stock-api.service').DrawingTool); }
  retry() { this.fetchData(this.api.selectedTicker(), this.maDays(), this.rangeButtons.find(r=>r.timeframe===this.api.timeframe())?.period || '180d'); }
  onMaSliderChange(event: Event) {
    const val = +(event.target as HTMLInputElement).value;
    if (Number.isInteger(val) && val >= 5 && val <= 200) this.maDays.set(val);
  }

  changeRange(tf: Timeframe, period: string) {
    this.api.timeframe.set(tf);
  }

  async fetchData(ticker: string, ma: number, period: string) {
    this.loading.set(true);
    this.error.set(false);
    try {
      const data = await this.api.getMovingAverage(ticker, ma, period);
      this.records.set(data);
      const info = await this.api.getCompanyInfo(ticker);
      this.companyInfo.set(info);
    } catch (e) {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
