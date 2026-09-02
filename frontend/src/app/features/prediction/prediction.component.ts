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
    <div class="flex flex-col h-full bg-[var(--color-void)] text-[var(--color-frost)] overflow-hidden transition-colors duration-300">
      
      <!-- TOP MODEL SELECTION RIBBON -->
      <div class="h-12 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4 text-xs flex-shrink-0 transition-colors duration-300">
        
        <!-- Left: Strategy Selector Buttons -->
        <div class="flex items-center gap-2 overflow-x-auto">
          <span class="text-[var(--color-muted)] font-bold uppercase text-[11px] mr-1 hidden sm:inline tracking-wider">Algorithm:</span>
          @for (m of models; track m.key) {
            <button (click)="selectedModel.set(m.key)"
                    [class]="selectedModel() === m.key
                      ? 'bg-[var(--color-accent)] text-white font-bold shadow-md shadow-[var(--shadow-accent)]'
                      : 'bg-[var(--color-void)] text-[var(--color-muted)] hover:text-[var(--color-frost)] border border-[var(--color-border)] hover:bg-[var(--color-surface)]'"
                    class="px-3.5 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap font-medium">
              {{ m.label }}
            </button>
          }
        </div>

        <!-- Right: Confidence / R² Score Badge -->
        @if (response()) {
          <div class="flex items-center gap-2">
            <span class="text-[var(--color-muted)] text-xs font-semibold">Model Confidence:</span>
            <span class="font-mono-num font-extrabold text-xs px-2.5 py-1 rounded-lg border"
                  [class]="response()!.confidence >= 0 
                    ? 'bg-[#089981]/15 text-[#089981] border-[#089981]/30' 
                    : 'bg-[#f23645]/15 text-[#f23645] border-[#f23645]/30'">
              {{ (response()!.confidence * 100).toFixed(2) }}% R²
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
            <span class="text-xs font-mono-num text-[var(--color-muted)]">Fitting regression model & computing 50-day forecast for {{ api.selectedTicker() }}...</span>
          </div>
        }

        @if (response()) {
          <div class="flex-1 w-full">
            <app-prediction-chart [records]="response()!.records"
                                  [predictions]="response()!.predictions"
                                  [modelName]="response()!.model">
            </app-prediction-chart>
          </div>

          <!-- Bottom Forecast Metrics Banner -->
          <div class="h-10 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-between px-4 text-xs font-mono-num flex-shrink-0 transition-colors duration-300">
            <div class="flex items-center gap-5 text-[var(--color-muted)]">
              <span>Active Algorithm: <strong class="text-[var(--color-frost)]">{{ response()!.model }}</strong></span>
              <span>Projection Horizon: <strong class="text-[var(--color-accent)]">50 Trading Days Ahead</strong></span>
            </div>
            <div class="text-[#089981] font-semibold flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-[#089981]"></span>
              Quantitative Engine Online
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
    { key: 'linear_regression', label: 'Linear Regression' },
    { key: 'svr',               label: 'Support Vector Machine (Linear)' },
    { key: 'rbf',               label: 'Support Vector Machine (RBF)' },
    { key: 'tree',              label: 'Decision Tree Regressor' },
    { key: 'lstm',              label: 'PyTorch LSTM Neural Network' },
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
