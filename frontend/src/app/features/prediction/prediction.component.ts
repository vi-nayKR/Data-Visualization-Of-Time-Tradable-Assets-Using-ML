import { ChangeDetectionStrategy, Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockApiService } from '../../core/services/stock-api.service';
import { OHLCVRecord, Timeframe, PredictionResponse, BestModelResponse } from '../../core/models/stock.model';
import { UI } from '../../shared/ui';
import { TickerPickerComponent } from '../../shared/ticker-picker';
import { PredictionChartComponent } from './prediction-chart.component';
@Component({selector:'app-prediction',changeDetection:ChangeDetectionStrategy.OnPush,imports:[CommonModule,TickerPickerComponent,...UI,PredictionChartComponent],template:`
<ui-page-header label="// MODEL EXPERIMENTS" title="Model predictions" description="Compare five machine learning models against historical prices for your selected asset." [source]="api.sourceLabel('prediction')" />
<div uiCard class="toolbar"><ui-ticker-picker /><div class="field"><span>Prediction model</span><div uiSegmented aria-label="Prediction model">@for(m of models; track m.key){<button [attr.aria-pressed]="selectedModel() === m.key" (click)="selectedModel.set(m.key)">{{m.shortLabel}}</button>}</div></div></div>
<section uiCard aria-labelledby="prediction-title"><div class="panel-heading"><div><h2 id="prediction-title">{{api.selectedTicker()}} ? Actual vs. predicted</h2><p>Historical prices in cyan. Model output in indigo.</p></div><span class="eyebrow">// PRICE PROJECTION</span></div><div class="chart-frame" [attr.aria-busy]="loading()">
@if(loading()){<ui-skeleton />}@else if(response()?.records?.length){<app-prediction-chart [records]="response()!.records" [predictions]="response()!.predictions" [modelName]="response()!.model" />}@else{<div class="empty-state"><h2>{{error() ? 'Unable to load this experiment' : 'No model data available'}}</h2><p>Try loading the selected asset again.</p><button uiButton (click)="fetchPrediction(api.selectedTicker(),selectedModel())">Retry</button></div>}
</div><p class="chart-caption">Interactive historical comparison. Drag to pan, pinch or scroll to zoom. Model outputs are research experiments.</p></section>
@if(response(); as result){<div class="stats-grid"><div uiCard class="stat"><p class="stat-label">MODEL FIT ? R?</p><p class="metric-value" [class.negative]="result.confidence < 0">{{(result.confidence*100).toFixed(1)}}%</p><p class="metric-note">Fit score for this experiment; not a forecast guarantee.</p></div><div uiCard class="stat"><p class="stat-label">SELECTED MODEL</p><p class="metric-value model-name">{{result.model}}</p><p class="metric-note">Same data, a different modelling approach.</p></div><div uiCard class="stat"><p class="stat-label">HISTORICAL OBSERVATIONS</p><p class="metric-value">{{result.records.length}}</p><p class="metric-note">Records returned by the research dataset.</p></div></div>}
`})
export class PredictionComponent {
  api = inject(StockApiService);
  error = signal(false);

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

  constructor() {
    effect(() => {
      const ticker = this.api.selectedTicker();
      const model = this.selectedModel();
      if (ticker) {
        this.fetchPrediction(ticker, model);
      }
    });
  }

  async fetchPrediction(ticker: string, model: string) {
    this.loading.set(true);
    this.error.set(false);
    try {
      const res = await this.api.getPrediction(ticker, model);
      this.response.set(res);
    } catch (e) {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
