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
    <div class="flex flex-col h-full bg-[#131722] text-[#d1d4dc] overflow-y-auto">
      
      <!-- SUB-HEADER: BENCHMARK TITLE & WINNER SUMMARY -->
      <div class="p-4 border-b border-[#2a2e39] bg-[#1e222d] flex flex-col md:flex-row md:items-center md:justify-between gap-3 flex-shrink-0">
        <div>
          <h1 class="text-base font-bold text-white flex items-center gap-2">
            <span>🏆 Quantitative Strategy Leaderboard</span>
            <span class="text-xs font-mono font-normal text-[#787b86]">({{ api.selectedTicker() }})</span>
          </h1>
          <p class="text-xs text-[#787b86]">
            Concurrent multi-algorithm benchmarking across Linear, SVM, Decision Tree, and Deep Neural Networks.
          </p>
        </div>

        @if (response()) {
          <div class="flex items-center gap-3 bg-[#131722] border border-[#089981]/50 rounded-lg px-3 py-1.5">
            <span class="text-base">🥇</span>
            <div>
              <div class="text-[10px] uppercase font-bold text-[#787b86]">Best Performer</div>
              <div class="text-xs font-bold text-[#089981]">{{ response()!.winner }}</div>
            </div>
            <div class="font-mono font-bold text-sm text-white ml-2">
              {{ (response()!.winnerScore * 100).toFixed(2) }}%
            </div>
          </div>
        }
      </div>

      <!-- MAIN BENCHMARK BODY -->
      <div class="p-6 space-y-6 flex-1">
        
        <!-- Loading State -->
        @if (loading()) {
          <div class="py-20 flex flex-col items-center justify-center gap-3">
            <div class="w-8 h-8 border-2 border-[#2962ff] border-t-transparent rounded-full animate-spin"></div>
            <span class="text-xs font-mono text-[#787b86]">Evaluating algorithms in parallel for {{ api.selectedTicker() }}...</span>
          </div>
        }

        @if (response()) {
          <!-- Strategy Cards Grid -->
          <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
            @for (m of response()!.models; track m.name) {
              <app-model-card [name]="m.name"
                              [score]="m.score"
                              [isWinner]="m.name === response()!.winner">
              </app-model-card>
            }
          </div>

          <!-- Winner Model Projection Chart -->
          <div class="bg-[#1e222d] border border-[#2a2e39] rounded-lg overflow-hidden">
            <div class="p-3 border-b border-[#2a2e39] flex items-center justify-between text-xs">
              <span class="font-bold text-white">Visual Trajectory: {{ response()!.winner }}</span>
              <span class="text-[#089981] font-mono font-semibold">● Optimal Model Output</span>
            </div>
            <app-prediction-chart [records]="response()!.records"
                                  [predictions]="response()!.predictions"
                                  [modelName]="response()!.winner">
            </app-prediction-chart>
          </div>
        }

      </div>
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
