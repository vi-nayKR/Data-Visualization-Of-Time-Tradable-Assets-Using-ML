import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockApiService } from '../../core/services/stock-api.service';
import { PredictionResponse } from '../../core/models/stock.model';
import { PredictionChartComponent } from './prediction-chart.component';

@Component({
  selector: 'app-prediction',
  standalone: true,
  imports: [CommonModule, PredictionChartComponent],
  template: `
    <div class="space-y-8">
      <div class="border-b border-slate-800 pb-5">
        <h1 class="text-3xl font-extrabold bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
          🔮 Machine Learning Price Prediction
        </h1>
        <p class="text-slate-400 text-sm mt-1">
          Target forecasting for {{ api.selectedCompanyName() }} ({{ api.selectedTicker() }})
        </p>
      </div>

      <!-- Model Radio Option Selector -->
      <div class="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Select Regression Model
        </label>
        <div class="flex flex-wrap gap-3">
          @for (m of models; track m.key) {
            <button (click)="selectedModel.set(m.key)"
                    [class]="selectedModel() === m.key
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-purple-400 shadow-lg shadow-purple-500/20'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:border-indigo-400'"
                    class="px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all">
              {{ m.label }}
            </button>
          }
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-20 text-slate-400">
          <div class="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Training & running {{ selectedModelName() }}...</p>
        </div>
      } @else if (response()) {
        <!-- Model Result Header -->
        <div class="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 text-center space-y-2">
          <h2 class="text-2xl font-bold text-slate-100">
            {{ response()!.model }}
          </h2>
          <div class="inline-flex items-center gap-2 bg-indigo-950/80 border border-indigo-500/50 rounded-full px-4 py-1 text-sm font-semibold text-indigo-300">
            <span>Confidence Score (R²):</span>
            <span class="text-sky-300 font-mono text-base font-bold">
              {{ (response()!.confidence * 100).toFixed(2) }}%
            </span>
          </div>
        </div>

        <!-- Prediction Chart -->
        <app-prediction-chart [records]="response()!.records"
                              [predictions]="response()!.predictions"
                              [modelName]="response()!.model">
        </app-prediction-chart>
      }
    </div>
  `
})
export class PredictionComponent {
  api = inject(StockApiService);

  models = [
    { key: 'linear_regression', label: 'Linear Regression' },
    { key: 'svr',               label: 'SVR Prediction' },
    { key: 'rbf',               label: 'RBF Prediction' },
    { key: 'tree',              label: 'Tree Prediction' },
    { key: 'lstm',              label: 'LSTM Neural Network' },
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

  selectedModelName(): string {
    return this.models.find(m => m.key === this.selectedModel())?.label || 'Model';
  }

  private async fetchPrediction(ticker: string, model: string) {
    this.loading.set(true);
    try {
      const res = await this.api.getPrediction(ticker, model);
      this.response.set(res);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }
}
