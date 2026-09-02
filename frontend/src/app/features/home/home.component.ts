import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-6xl mx-auto p-8 space-y-8 text-[#d1d4dc]">
      
      <!-- Hero Banner -->
      <div class="bg-gradient-to-r from-[#1e222d] to-[#181b24] border border-[#2a2e39] rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="space-y-3">
          <div class="inline-flex items-center gap-2 bg-[#2962ff]/10 border border-[#2962ff]/30 text-[#2962ff] text-xs px-2.5 py-1 rounded font-semibold uppercase tracking-wider">
            TradingView Terminal Engine
          </div>
          <h1 class="text-3xl font-extrabold text-white">
            Quantitative Market Intelligence & Time-Series Analytics
          </h1>
          <p class="text-sm text-[#787b86] max-w-xl leading-relaxed">
            High-performance technical charting suite integrated with Machine Learning regressors (SVR, Decision Trees, and PyTorch LSTM) for live market asset forecasting.
          </p>
        </div>
        <div class="text-6xl">📊</div>
      </div>

      <!-- Feature Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div class="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-5 space-y-3 hover:border-[#363a45] transition-all">
          <div class="text-2xl">🕯️</div>
          <h2 class="text-base font-bold text-white">TradingView SuperChart</h2>
          <p class="text-xs text-[#787b86] leading-relaxed">
            Dual-pane candlestick visualization with sub-plot volume histogram, moving average indicators (SMA 20/50/200), and interactive time range navigation.
          </p>
        </div>

        <div class="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-5 space-y-3 hover:border-[#363a45] transition-all">
          <div class="text-2xl">🔮</div>
          <h2 class="text-base font-bold text-white">ML Forecasting Terminal</h2>
          <p class="text-xs text-[#787b86] leading-relaxed">
            Predict forward 50-day closing price trends utilizing Linear Regression, Support Vector Machines (Linear & RBF), and Recurrent Deep Learning (LSTM).
          </p>
        </div>

        <div class="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-5 space-y-3 hover:border-[#363a45] transition-all">
          <div class="text-2xl">🏆</div>
          <h2 class="text-base font-bold text-white">Strategy Leaderboard</h2>
          <p class="text-xs text-[#787b86] leading-relaxed">
            Parallel algorithmic benchmarking that scores model confidence (R² coefficient of determination) to automatically elect the top forecast strategy.
          </p>
        </div>

      </div>

      <!-- Financial Theory & Documentation Section -->
      <div class="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-6 space-y-4">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider">Methodology & Mathematical Foundation</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#787b86] leading-relaxed">
          <div class="space-y-2">
            <h4 class="text-white font-semibold">Time-Series Feature Engineering</h4>
            <p>
              Historical OHLCV data from Yahoo Finance is scaled using MinMax normalization:
              <code class="block bg-[#131722] p-2 rounded text-[#2962ff] font-mono my-1">X_scaled = (X - X_min) / (X_max - X_min)</code>
              A 50-day forward shift is applied to create the supervised predictive target vector.
            </p>
          </div>
          <div class="space-y-2">
            <h4 class="text-white font-semibold">Deep Learning LSTM Architecture</h4>
            <p>
              PyTorch 2-layer Long Short-Term Memory network trained with Adam optimizer:
              <code class="block bg-[#131722] p-2 rounded text-[#089981] font-mono my-1">Hidden Units: 50 | Layers: 2 | Epochs: 10</code>
              Captures non-linear temporal dependencies across sequential market cycles.
            </p>
          </div>
        </div>
      </div>

    </div>
  `
})
export class HomeComponent {}
