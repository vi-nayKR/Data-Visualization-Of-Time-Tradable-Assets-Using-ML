import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockApiService } from '../../core/services/stock-api.service';
import { BestModelResponse } from '../../core/models/stock.model';
import { ModelCardComponent } from './model-card.component';
import { PredictionChartComponent } from '../prediction/prediction-chart.component';

@Component({
  selector: 'app-best-analysis',
  standalone: true,
  imports: [CommonModule, ModelCardComponent, PredictionChartComponent],
  template: `
    <div class="space-y-8">
      <div class="border-b border-slate-800 pb-5">
        <h1 class="text-3xl font-extrabold bg-gradient-to-r from-amber-400 via-sky-400 to-purple-400 bg-clip-text text-transparent">
          🏆 Best Model Selector
        </h1>
        <p class="text-slate-400 text-sm mt-1">
          Evaluates Linear Regression, Decision Tree, SVR, RBF, and LSTM to select the top predictor for {{ api.selectedCompanyName() }} ({{ api.selectedTicker() }})
        </p>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-20 text-slate-400">
          <div class="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Benchmarking all 5 Machine Learning models...</p>
        </div>
      } @else if (response()) {
        <!-- Model Grid Comparison -->
        <div class="space-y-4">
          <h2 class="text-lg font-bold text-slate-200">📊 Benchmark Results</h2>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            @for (m of response()!.models; track m.name) {
              <app-model-card [name]="m.name"
                              [score]="m.score"
                              [isWinner]="m.name === response()!.winner">
              </app-model-card>
            }
          </div>
        </div>

        <!-- Winner Alert Banner -->
        <div class="bg-gradient-to-r from-green-950/80 via-emerald-950/80 to-slate-900 border border-green-500/80 rounded-2xl p-5 flex items-center gap-4">
          <div class="text-3xl">🏆</div>
          <div>
            <h3 class="text-lg font-bold text-green-300">
              Winner: {{ response()!.winner }}
            </h3>
            <p class="text-slate-300 text-sm">
              Achieved the highest accuracy score of
              <strong class="text-green-400 font-mono">{{ (response()!.winnerScore * 100).toFixed(2) }}% R²</strong> for {{ api.selectedTicker() }}.
            </p>
          </div>
        </div>

        <!-- Winner Prediction Chart -->
        <app-prediction-chart [records]="response()!.records"
                              [predictions]="response()!.predictions"
                              [modelName]="response()!.winner">
        </app-prediction-chart>
      }
    </div>
  `
})
export class BestAnalysisComponent {
  api = inject(StockApiService);

  loading = signal<boolean>(false);
  response = signal<BestModelResponse | null>(null);

  constructor() {
    effect(() => {
      const ticker = this.api.selectedTicker();
      if (ticker) {
        this.fetchBestModel(ticker);
      }
    });
  }

  private async fetchBestModel(ticker: string) {
    this.loading.set(true);
    try {
      const res = await this.api.getBestModel(ticker);
      this.response.set(res);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }
}
