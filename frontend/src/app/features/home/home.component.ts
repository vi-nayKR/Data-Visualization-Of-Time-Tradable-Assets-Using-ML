import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-6xl mx-auto p-8 space-y-8 text-[#f0f3fa]">
      
      <!-- Hero Banner -->
      <div class="bg-gradient-to-r from-[#1e222d] to-[#181b24] border border-[#2a2e39] rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div class="space-y-3">
          <div class="inline-flex items-center gap-2 bg-[#2962ff]/15 border border-[#2962ff]/30 text-[#2962ff] text-xs px-3 py-1 rounded font-bold uppercase tracking-wider">
            Quantitative Terminal Architecture
          </div>
          <h1 class="text-3xl font-extrabold text-white tracking-tight">
            Market Intelligence & Time-Series Machine Learning Analytics
          </h1>
          <p class="text-sm text-[#9db2c6] max-w-xl leading-relaxed">
            High-performance technical charting suite integrated with Machine Learning regressors (Linear, SVR, Decision Trees, and PyTorch Deep LSTM) for live market asset forecasting.
          </p>
        </div>
        
        <div class="w-16 h-16 rounded-2xl bg-[#2962ff]/10 border border-[#2962ff]/30 flex items-center justify-center text-[#2962ff] flex-shrink-0">
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
            <polyline points="16 7 22 7 22 13"></polyline>
          </svg>
        </div>
      </div>

      <!-- Feature Grid with Vector Icons -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div class="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-6 space-y-3 hover:border-[#363c4e] transition-all shadow-lg">
          <div class="w-10 h-10 rounded-lg bg-[#089981]/15 text-[#089981] flex items-center justify-center">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="9" y1="2" x2="9" y2="22"></line>
              <rect x="6" y="6" width="6" height="11" rx="1" fill="currentColor"></rect>
              <line x1="17" y1="4" x2="17" y2="20"></line>
              <rect x="14" y="8" width="6" height="8" rx="1" fill="currentColor"></rect>
            </svg>
          </div>
          <h2 class="text-base font-bold text-white">Interactive SuperChart</h2>
          <p class="text-xs text-[#9db2c6] leading-relaxed">
            Dual-pane candlestick visualization with sub-plot volume histogram, moving average indicators (SMA 20/50/200), and interactive time range navigation.
          </p>
        </div>

        <div class="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-6 space-y-3 hover:border-[#363c4e] transition-all shadow-lg">
          <div class="w-10 h-10 rounded-lg bg-[#2962ff]/15 text-[#2962ff] flex items-center justify-center">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <h2 class="text-base font-bold text-white">ML Forecasting Terminal</h2>
          <p class="text-xs text-[#9db2c6] leading-relaxed">
            Predict forward 50-day closing price trends utilizing Linear Regression, Support Vector Machines (Linear & RBF), and Recurrent Deep Learning (LSTM).
          </p>
        </div>

        <div class="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-6 space-y-3 hover:border-[#363c4e] transition-all shadow-lg">
          <div class="w-10 h-10 rounded-lg bg-[#ff9800]/15 text-[#ff9800] flex items-center justify-center">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
              <path d="M4 22h16"></path>
              <path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-2.34"></path>
              <path d="M18 14.66V17c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-2.34"></path>
              <path d="M6 2h12v7a6 6 0 0 1-12 0V2z"></path>
            </svg>
          </div>
          <h2 class="text-base font-bold text-white">Strategy Leaderboard</h2>
          <p class="text-xs text-[#9db2c6] leading-relaxed">
            Parallel algorithmic benchmarking that scores model confidence (R² coefficient of determination) to automatically elect the top forecast strategy.
          </p>
        </div>

      </div>

      <!-- Financial Theory & Documentation Section -->
      <div class="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-7 space-y-4 shadow-xl">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider">Methodology & Mathematical Foundation</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#9db2c6] leading-relaxed">
          <div class="space-y-2">
            <h4 class="text-white font-semibold text-sm">Time-Series Feature Engineering</h4>
            <p>
              Historical OHLCV data from Yahoo Finance is scaled using MinMax normalization:
              <code class="block bg-[#131722] border border-[#2a2e39] p-3 rounded-lg text-[#2962ff] font-mono-num my-2">X_scaled = (X - X_min) / (X_max - X_min)</code>
              A 50-day forward shift is applied to create the supervised predictive target vector.
            </p>
          </div>
          <div class="space-y-2">
            <h4 class="text-white font-semibold text-sm">Deep Learning LSTM Architecture</h4>
            <p>
              PyTorch 2-layer Long Short-Term Memory network trained with Adam optimizer:
              <code class="block bg-[#131722] border border-[#2a2e39] p-3 rounded-lg text-[#089981] font-mono-num my-2">Hidden Units: 50 | Layers: 2 | Epochs: 10</code>
              Captures non-linear temporal dependencies across sequential market cycles.
            </p>
          </div>
        </div>
      </div>

    </div>
  `
})
export class HomeComponent {}
