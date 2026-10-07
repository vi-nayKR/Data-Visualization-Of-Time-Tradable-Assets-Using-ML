import { ChangeDetectionStrategy, Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockApiService } from '../../core/services/stock-api.service';
import { PredictionResponse, OHLCVRecord } from '../../core/models/stock.model';
import { PredictionChartComponent } from './prediction-chart.component';
import { MetricsTableComponent } from '../../shared/metrics-table.component';
import { UI } from '../../shared/ui';
@Component({selector:'app-prediction',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[CommonModule,PredictionChartComponent,MetricsTableComponent,...UI],template:`
<ui-page-header label="// FORECAST EXPERIMENT" [title]="api.selectedTicker()+' forecasts'" description="Forward log-return forecasts with a validation residual band and an honest naive baseline." [source]="api.sourceLabel('prediction')" />
<div uiCard class="toolbar"><div class="field"><span>Prediction model</span><div uiSegmented aria-label="Model">@for(m of models;track m.key){<button [attr.aria-pressed]="selectedModel()===m.key" (click)="selectedModel.set(m.key)">{{m.shortLabel}}</button>}</div></div><div class="field"><span>Forecast horizon</span><div uiSegmented aria-label="Forecast horizon"><button [attr.aria-pressed]="api.horizon()===1" (click)="api.horizon.set(1)">1 trading day</button><button [attr.aria-pressed]="api.horizon()===5" (click)="api.horizon.set(5)">5 trading days</button></div></div></div>
<section uiCard aria-labelledby="forecast-title"><div class="panel-heading"><div><h2 id="forecast-title">{{api.selectedCompanyName()}}</h2><p>Historical close, forecast band and baseline</p></div><span class="mono">{{api.currency()}}</span></div>
@if(loading()){<div class="chart-frame"><ui-skeleton /></div>}@else if(error()){<div class="empty-state" role="status"><h2>Forecast unavailable</h2><p>Try loading this asset again.</p><button uiButton (click)="fetchPrediction(api.selectedTicker(),selectedModel())">Retry</button></div>}@else if(response();as result){
<div class="forecast-summary"><div><p class="eyebrow">// {{result.forecast.horizon}} TRADING DAYS</p><h2><ui-count-up [value]="result.forecast.price" [currency]="result.currency" /></h2><p class="metric-note">Band {{result.forecast.lower | currency:result.currency}} to {{result.forecast.upper | currency:result.currency}}</p></div><p class="forecast-note">The band contains the 10th to 90th percentile of validation residuals. It is an empirical range, not a guarantee.</p></div>
@if(api.sources()['prediction']==='snapshot'){<p class="snapshot-banner">Saved snapshot: 5-trading-day forecasts only.</p>}
<div class="chart-frame">@defer (on viewport) {<app-prediction-chart [records]="records()" [forecast]="result.forecast" [naive]="result.naive" [modelName]="result.model" />} @placeholder {<ui-skeleton />}</div>
<p class="chart-caption">Data as of {{result.as_of}} &middot; trained {{result.trained_at | date:'short'}}. The naive line keeps the last price unchanged.</p>
}@else{<div class="empty-state"><h2>No forecast available</h2><button uiButton (click)="fetchPrediction(api.selectedTicker(),selectedModel())">Retry</button></div>}
</section>
@if(!loading()&&!error()){ @if(response();as result){<section uiCard class="metrics-panel"><div class="panel-heading"><div><p class="eyebrow">// MODEL RESULTS</p><h2>Held-out evaluation</h2></div><p>Positive skill beats the naive baseline.</p></div><app-metrics-table [metrics]="result.metrics" [currency]="result.currency" /></section>} }
`})
export class PredictionComponent {
  api = inject(StockApiService);

  models = [
    { key: 'linear_regression', label: 'Linear Regression', shortLabel: 'Linear Reg' },
    { key: 'svr',               label: 'SVM (Linear)',       shortLabel: 'SVM Linear' },
    { key: 'rbf',               label: 'SVM (RBF Kernel)',   shortLabel: 'SVM RBF' },
    { key: 'tree',              label: 'Decision Tree',      shortLabel: 'Tree' },
    { key: 'lstm',              label: 'PyTorch LSTM',       shortLabel: 'LSTM' },
  ];

  selectedModel = signal<string>('linear_regression');
  loading = signal<boolean>(false);
  response = signal<PredictionResponse | null>(null);

  records = signal<OHLCVRecord[]>([]);
  error = signal(false);
  constructor() {
    effect(() => {
      const ticker = this.api.selectedTicker();
      const model = this.selectedModel();
      const horizon = this.api.horizon();
      if (ticker) {
        this.fetchPrediction(ticker, model, horizon);
      }
    });
  }

  async fetchPrediction(ticker: string, model: string, horizon:1|5 = this.api.horizon()) {
    this.loading.set(true);
    this.error.set(false);
    try {
      const [res, records] = await Promise.all([this.api.getPrediction(ticker, model, horizon),this.api.getOHLCV(ticker)]);
      this.records.set(records);
      this.response.set(res);
    } catch (e) {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
