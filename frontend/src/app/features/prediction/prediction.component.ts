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
    <div class="flex flex-col h-full bg-[#131722] text-[#f0f3fa] overflow-hidden">
      
      <!-- TOP MODEL SELECTION RIBBON -->
      <div class="h-12 bg-[#1e222d] border-b border-[#2a2e39] flex items-center justify-between px-4 text-xs flex-shrink-0">
        
        <!-- Left: Strategy Selector Buttons -->
        <div class="flex items-center gap-2 overflow-x-auto">
          <span class="text-[#9db2c6] font-bold uppercase text-[11px] mr-1 hidden sm:inline tracking-wider">Algorithm:</span>
          @for (m of models; track m.key) {
            <button (click)="selectedModel.set(m.key)"
                    [class]="selectedModel() === m.key
                      ? 'bg-[#2962ff] text-white font-bold shadow-md shadow-[#2962ff]/20'
                      : 'bg-[#131722] text-[#9db2c6] hover:text-white border border-[#363c4e] hover:bg-[#2a2e39]'"
                    class="px-3.5 py-1.5 rounded text-xs transition-all whitespace-nowrap font-medium">
              {{ m.label }}
            </button>
          }
        </div>

        <!-- Right: Confidence / R² Score Badge -->
        @if (response()) {
          <div class="flex items-center gap-2">
            <span class="text-[#9db2c6] text-xs font-semibold">Model Confidence:</span>
            <span class="font-mono-num font-extrabold text-xs px-2.5 py-1 rounded border"
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
          <div class="absolute inset-0 bg-[#131722]/85 backdrop-blur-sm z-40 flex flex-col items-center justify-center gap-3">
            <div class="w-8 h-8 border-2 border-[#089981] border-t-transparent rounded-full animate-spin"></div>
            <span class="text-xs font-mono-num text-[#9db2c6]">Fitting regression model & computing 50-day forecast for {{ api.selectedTicker() }}...</span>
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
          <div class="h-10 bg-[#1e222d] border-t border-[#2a2e39] flex items-center justify-between px-4 text-xs font-mono-num flex-shrink-0">
            <div class="flex items-center gap-5 text-[#9db2c6]">
              <span>Active Algorithm: <strong class="text-white">{{ response()!.model }}</strong></span>
              <span>Projection Horizon: <strong class="text-[#2962ff]">50 Trading Days Ahead</strong></span>
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
