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
    <div class="flex flex-col h-full bg-[#131722] text-[#d1d4dc] overflow-hidden">
      
      <!-- TOP MODEL SELECTION RIBBON -->
      <div class="h-12 bg-[#1e222d] border-b border-[#2a2e39] flex items-center justify-between px-4 text-xs">
        
        <!-- Left: Model Selector Chips -->
        <div class="flex items-center gap-1.5 overflow-x-auto">
          <span class="text-[#787b86] font-bold uppercase text-[11px] mr-2 hidden sm:inline">Strategy:</span>
          @for (m of models; track m.key) {
            <button (click)="selectedModel.set(m.key)"
                    [class]="selectedModel() === m.key
                      ? 'bg-[#2962ff] text-white font-bold'
                      : 'bg-[#131722] text-[#787b86] hover:text-white border border-[#2a2e39] hover:bg-[#2a2e39]'"
                    class="px-3 py-1 rounded text-xs transition-all whitespace-nowrap">
              {{ m.label }}
            </button>
          }
        </div>

        <!-- Right: Confidence / R² Score Badge -->
        @if (response()) {
          <div class="flex items-center gap-2">
            <span class="text-[#787b86] text-[11px]">R² Confidence:</span>
            <span class="font-mono font-bold text-xs px-2 py-0.5 rounded"
                  [class]="response()!.confidence >= 0 ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#f23645]/20 text-[#f23645]'">
              {{ (response()!.confidence * 100).toFixed(2) }}%
            </span>
          </div>
        }
      </div>

      <!-- MAIN PREDICTION CANVAS -->
      <div class="flex-1 relative flex flex-col">
        
        <!-- Loading State -->
        @if (loading()) {
          <div class="absolute inset-0 bg-[#131722]/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center gap-3">
            <div class="w-8 h-8 border-2 border-[#089981] border-t-transparent rounded-full animate-spin"></div>
            <span class="text-xs font-mono text-[#787b86]">Training neural/kernel regression model for {{ api.selectedTicker() }}...</span>
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
          <div class="h-10 bg-[#1e222d] border-t border-[#2a2e39] flex items-center justify-between px-4 text-xs font-mono">
            <div class="flex items-center gap-4 text-[#787b86]">
              <span>Active Model: <strong class="text-white">{{ response()!.model }}</strong></span>
              <span>Forecast Horizon: <strong class="text-[#2962ff]">50 Trading Days</strong></span>
            </div>
            <div class="text-[#089981] font-semibold">
              ● Quantitative Engine Active
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
    { key: 'svr',               label: 'SVR (Linear)' },
    { key: 'rbf',               label: 'SVR (RBF Kernel)' },
    { key: 'tree',              label: 'Decision Tree' },
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
