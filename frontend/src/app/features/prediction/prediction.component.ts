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
    <div role="status" class="px-3 py-1 text-xs bg-[var(--color-surface)] text-[var(--color-frost)]">
      {{ api.sourceLabel('prediction') }} · Not financial advice
    </div>
    <div class="flex flex-col h-full bg-[var(--color-void)] text-[var(--color-frost)] overflow-hidden transition-colors duration-300">
      
      <!-- TOP MODEL SELECTION RIBBON (SWIPEABLE & TOUCH-FRIENDLY) -->
      <div class="h-11 sm:h-12 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-2 sm:px-4 text-xs flex-shrink-0 gap-2 transition-colors duration-300 overflow-x-auto no-scrollbar">
        
        <!-- Left: Strategy Selector Buttons -->
        <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span class="text-[var(--color-muted)] font-bold uppercase text-[10px] sm:text-[11px] mr-1 hidden sm:inline tracking-wider">Model:</span>
          @for (m of models; track m.key) {
            <button (click)="selectedModel.set(m.key)"
                    [class]="selectedModel() === m.key
                      ? 'bg-[var(--color-accent)] text-white font-bold shadow-md shadow-[var(--shadow-accent)]'
                      : 'bg-[var(--color-void)] text-[var(--color-muted)] hover:text-[var(--color-frost)] border border-[var(--color-border)] hover:bg-[var(--color-surface)]'"
                    class="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs transition-all whitespace-nowrap font-medium shrink-0">
              {{ m.shortLabel || m.label }}
            </button>
          }
        </div>

        <!-- Right: Confidence / R² Score Badge -->
        @if (response()) {
          <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span class="text-[var(--color-muted)] text-[10px] sm:text-xs font-semibold hidden sm:inline">R² Score:</span>
            <span class="font-mono-num font-extrabold text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border whitespace-nowrap"
                  [class]="response()!.confidence >= 0 
                    ? 'bg-[#089981]/15 text-[#089981] border-[#089981]/30' 
                    : 'bg-[#f23645]/15 text-[#f23645] border-[#f23645]/30'">
              {{ (response()!.confidence * 100).toFixed(1) }}% R²
            </span>
          </div>
        }
      </div>

      <!-- MAIN PREDICTION CANVAS -->
      <div class="flex-1 relative flex flex-col overflow-hidden">
        
        <!-- Loading State -->
        @if (loading()) {
          <div class="absolute inset-0 bg-[var(--color-void)]/85 backdrop-blur-sm z-40 flex flex-col items-center justify-center gap-3">
            <div class="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
            <span class="text-xs font-mono-num text-[var(--color-muted)]">Computing 50-day forecast for {{ api.selectedTicker() }}...</span>
          </div>
        }

        @if (response()) {
          <div class="flex-1 w-full h-full relative overflow-hidden">
            <app-prediction-chart [records]="response()!.records"
                                  [predictions]="response()!.predictions"
                                  [modelName]="response()!.model">
            </app-prediction-chart>
          </div>

          <!-- Bottom Forecast Metrics Banner -->
          <div class="h-9 sm:h-10 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-between px-3 sm:px-4 text-[11px] sm:text-xs font-mono-num flex-shrink-0 transition-colors duration-300">
            <div class="flex items-center gap-3 sm:gap-5 text-[var(--color-muted)] truncate">
              <span>Model: <strong class="text-[var(--color-frost)]">{{ response()!.model }}</strong></span>
              <span class="hidden sm:inline">Horizon: <strong class="text-[var(--color-accent)]">50 Days</strong></span>
            </div>
            <div class="text-[#089981] font-semibold flex items-center gap-1 shrink-0">
              <span class="w-1.5 h-1.5 rounded-full bg-[#089981]"></span>
              <span>{{ api.sourceLabel('prediction') }}</span>
            </div>
          </div>
        }

      </div>
    </div>
  `
})
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

  constructor() {
    effect(() => {
      const ticker = this.api.selectedTicker();
      const model = this.selectedModel();
      if (ticker) {
        this.fetchPrediction(ticker, model);
      }
    });
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
