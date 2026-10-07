import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockApiService } from '../../core/services/stock-api.service';
import { PredictionResponse, OHLCVRecord } from '../../core/models/stock.model';
import { PredictionChartComponent } from './prediction-chart.component';
import { MetricsTableComponent } from '../../shared/metrics-table.component';
@Component({selector:'app-prediction',standalone:true,imports:[CommonModule,PredictionChartComponent,MetricsTableComponent],template:`
<section class="h-full overflow-y-auto p-4 text-[var(--color-frost)] bg-[var(--color-void)]">
<div role="status">{{api.sourceLabel('prediction')}} · Not financial advice</div>
<h1 class="text-lg font-bold my-3">{{api.selectedTicker()}} · Forward log-return forecast</h1>
<div class="flex flex-wrap gap-2 mb-4" role="group" aria-label="Model">@for(m of models;track m.key){<button class="px-3 py-2 border border-[var(--color-border)] rounded" [attr.aria-pressed]="selectedModel()===m.key" (click)="selectedModel.set(m.key)">{{m.shortLabel}}</button>}</div>
<div class="flex gap-3 mb-3" role="group" aria-label="Forecast horizon"><button [attr.aria-pressed]="api.horizon()===1" (click)="api.horizon.set(1)">1 trading day</button><button [attr.aria-pressed]="api.horizon()===5" (click)="api.horizon.set(5)">5 trading days</button></div>
@if(loading()){<p role="status">Loading cached forecast...</p>}
@if(error()){<p>Forecast unavailable. <button (click)="fetchPrediction(api.selectedTicker(),selectedModel())">Retry</button></p>}
@if(response();as result){
@if(api.sources()['prediction']==='snapshot'){<p class="py-2">Saved snapshot · 5-trading-day forecasts only.</p>}
<p class="text-xs py-2">Data as of {{result.as_of}} · trained {{result.trained_at | date:'short'}}</p>
<p>Forecast {{result.forecast.price | currency:result.currency}} · band {{result.forecast.lower | currency:result.currency}} – {{result.forecast.upper | currency:result.currency}}</p>
<div class="h-[420px] my-3"><app-prediction-chart [records]="records()" [forecast]="result.forecast" [naive]="result.naive" [modelName]="result.model" /></div>
<app-metrics-table [metrics]="result.metrics" [currency]="result.currency" />
<p class="text-xs mt-3">Band: 10th–90th percentile of validation residuals, not a guarantee. Positive skill beats the price-stays-the-same baseline.</p>
}
</section>`})
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
