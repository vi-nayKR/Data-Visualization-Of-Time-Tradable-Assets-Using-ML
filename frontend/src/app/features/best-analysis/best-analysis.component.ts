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
    <div class="flex flex-col h-full bg-[var(--color-void)] text-[var(--color-frost)] overflow-y-auto transition-colors duration-300">
      
      <!-- SUB-HEADER: BENCHMARK TITLE & WINNER SUMMARY -->
      <div class="p-3 sm:p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0 transition-colors duration-300">
        <div>
          <h1 class="text-sm sm:text-base font-bold text-[var(--color-frost)] flex items-center gap-2">
            <svg class="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
              <path d="M4 22h16"></path>
              <path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-2.34"></path>
              <path d="M18 14.66V17c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-2.34"></path>
              <path d="M6 2h12v7a6 6 0 0 1-12 0V2z"></path>
            </svg>
            <span>Strategy Leaderboard</span>
            <span class="text-xs font-mono-num font-semibold text-[var(--color-muted)]">({{ api.selectedTicker() }})</span>
          </h1>
          <p class="text-[11px] sm:text-xs text-[var(--color-muted)] mt-0.5">
            Concurrent multi-algorithm benchmarking across 5 machine learning models.
          </p>
        </div>

        @if (response()) {
          <div class="flex items-center gap-2.5 sm:gap-3 bg-[var(--color-void)] border border-[#089981]/50 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 shadow shrink-0">
            <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#089981]/15 flex items-center justify-center text-[#089981] shrink-0">
              <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div>
              <div class="text-[9px] sm:text-[10px] uppercase font-bold text-[var(--color-muted)] tracking-wider">Top Strategy</div>
              <div class="text-xs font-bold text-[#089981]">{{ response()!.winner }}</div>
            </div>
            <div class="font-mono-num font-extrabold text-xs sm:text-sm text-[var(--color-frost)] ml-1 sm:ml-2">
              {{ (response()!.winnerScore * 100).toFixed(1) }}% R²
            </div>
          </div>
        }
      </div>

      <!-- MAIN BENCHMARK BODY -->
      <div class="p-3 sm:p-6 space-y-4 sm:space-y-6 flex-1">
        
        <!-- Loading State -->
        @if (loading()) {
          <div class="py-16 sm:py-20 flex flex-col items-center justify-center gap-3">
            <div class="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
            <span class="text-xs font-mono-num text-[var(--color-muted)]">Evaluating all 5 machine learning models for {{ api.selectedTicker() }}...</span>
          </div>
        }

        @if (response()) {
          <!-- Strategy Cards Grid (Responsive 1-col on mobile, 2-col on tablet, 5-col on desktop) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-3.5">
            @for (m of response()!.models; track m.name) {
              <app-model-card [name]="m.name"
                              [score]="m.score"
                              [isWinner]="m.name === response()!.winner">
              </app-model-card>
            }
          </div>

          <!-- Winner Model Projection Chart -->
          <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-xl transition-colors duration-300">
            <div class="p-3 border-b border-[var(--color-border)] flex items-center justify-between text-xs">
              <span class="font-bold text-[var(--color-frost)] text-xs sm:text-sm truncate">Trajectory: {{ response()!.winner }}</span>
              <span class="text-[#089981] font-mono-num font-semibold flex items-center gap-1 shrink-0">
                <span class="w-2 h-2 rounded-full bg-[#089981]"></span>
                Top Model
              </span>
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
