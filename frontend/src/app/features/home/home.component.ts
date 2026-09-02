import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto p-6 md:p-10 space-y-8 text-[var(--color-frost)]">
      
      <!-- Hero Banner with Portfolio-Ng Gradient & Live Action Buttons -->
      <div class="apple-glass rounded-3xl p-8 md:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 shadow-2xl border border-[var(--color-border)] relative overflow-hidden">
        
        <div class="space-y-4 max-w-2xl relative z-10">
          <div class="inline-flex items-center gap-2 bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 text-[var(--color-accent)] text-xs px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider font-mono">
            Quantitative Analytics &amp; Machine Learning Engine
          </div>

          <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight font-display leading-tight">
            Data Visualization of Time-Tradable Assets Using ML
          </h1>

          <p class="text-sm text-[var(--color-muted)] leading-relaxed">
            A high-performance quantitative technical terminal and machine learning forecasting platform. Integrates dual-pane Plotly.js candlestick charting, drawing annotations, mathematical indicator overlays, and 50-day predictive time-series regressors.
          </p>

          <div class="flex flex-wrap items-center gap-3 pt-2">
            <a routerLink="/analysis"
               class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-glow)] text-white font-bold text-xs transition-all duration-200 shadow-lg shadow-[var(--shadow-accent)] hover:scale-102 cursor-pointer">
              <span>Open SuperChart</span>
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </a>

            <a routerLink="/prediction"
               class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 text-[var(--color-frost)] font-semibold text-xs hover:bg-[var(--color-abyss)] transition-all duration-200 cursor-pointer">
              <span>ML Predictive Forecasts</span>
            </a>

            <a routerLink="/best-analysis"
               class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 text-[var(--color-frost)] font-semibold text-xs hover:bg-[var(--color-abyss)] transition-all duration-200 cursor-pointer">
              <span>Strategy Leaderboard</span>
            </a>
          </div>
        </div>
        
        <div class="w-20 h-20 rounded-3xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)] flex-shrink-0 shadow-2xl shadow-[var(--shadow-accent)]">
          <svg class="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
            <polyline points="16 7 22 7 22 13"></polyline>
          </svg>
        </div>
      </div>

      <!-- Feature Grid with Direct Navigation -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- SuperChart Feature Card -->
        <a routerLink="/analysis"
           class="group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4 hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface)]/80 transition-all shadow-lg flex flex-col justify-between cursor-pointer">
          <div class="space-y-3">
            <div class="w-11 h-11 rounded-xl bg-[#089981]/15 text-[#089981] flex items-center justify-center">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="9" y1="2" x2="9" y2="22"></line>
                <rect x="6" y="6" width="6" height="11" rx="1" fill="currentColor"></rect>
                <line x1="17" y1="4" x2="17" y2="20"></line>
                <rect x="14" y="8" width="6" height="8" rx="1" fill="currentColor"></rect>
              </svg>
            </div>
            <h2 class="text-base font-bold text-[var(--color-frost)] group-hover:text-[var(--color-accent)] transition-colors">
              Interactive SuperChart
            </h2>
            <p class="text-xs text-[var(--color-muted)] leading-relaxed">
              Full-featured technical charting canvas with dual-pane volume subplots, moving averages (SMA/EMA), Bollinger Bands (20,2), RSI (14), Fibonacci retracements, and horizontal range scrollbars.
            </p>
          </div>

          <div class="flex items-center gap-1.5 text-xs font-bold text-[var(--color-accent)] font-mono pt-2">
            <span>Launch SuperChart</span>
            <svg class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </a>

        <!-- ML Forecasting Feature Card -->
        <a routerLink="/prediction"
           class="group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4 hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface)]/80 transition-all shadow-lg flex flex-col justify-between cursor-pointer">
          <div class="space-y-3">
            <div class="w-11 h-11 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h2 class="text-base font-bold text-[var(--color-frost)] group-hover:text-[var(--color-accent)] transition-colors">
              ML Predictive Forecasting
            </h2>
            <p class="text-xs text-[var(--color-muted)] leading-relaxed">
              50-day forward price trend forecasting powered by Linear Regression, Support Vector Machines (Linear &amp; RBF Kernels), Decision Tree regressors, and PyTorch Deep LSTM Neural Networks.
            </p>
          </div>

          <div class="flex items-center gap-1.5 text-xs font-bold text-[var(--color-accent)] font-mono pt-2">
            <span>Explore ML Models</span>
            <svg class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </a>

        <!-- Strategy Leaderboard Feature Card -->
        <a routerLink="/best-analysis"
           class="group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4 hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface)]/80 transition-all shadow-lg flex flex-col justify-between cursor-pointer">
          <div class="space-y-3">
            <div class="w-11 h-11 rounded-xl bg-[#ff9242]/15 text-[#ff9242] flex items-center justify-center">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                <path d="M4 22h16"></path>
                <path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-2.34"></path>
                <path d="M18 14.66V17c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-2.34"></path>
                <path d="M6 2h12v7a6 6 0 0 1-12 0V2z"></path>
              </svg>
            </div>
            <h2 class="text-base font-bold text-[var(--color-frost)] group-hover:text-[var(--color-accent)] transition-colors">
              Strategy Leaderboard
            </h2>
            <p class="text-xs text-[var(--color-muted)] leading-relaxed">
              Parallel multi-model evaluation calculating coefficient of determination (R² metric) to elect the optimal quantitative strategy for any selected asset ticker.
            </p>
          </div>

          <div class="flex items-center gap-1.5 text-xs font-bold text-[var(--color-accent)] font-mono pt-2">
            <span>View Leaderboard</span>
            <svg class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </a>

      </div>

      <!-- Financial Theory & Documentation Section -->
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 space-y-5 shadow-xl">
        <h3 class="text-sm font-bold text-[var(--color-frost)] uppercase tracking-wider font-mono">
          Methodology &amp; Mathematical Foundation (IEEE Publication)
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[var(--color-muted)] leading-relaxed">
          <div class="space-y-2.5">
            <h4 class="text-[var(--color-frost)] font-semibold text-sm">Supervised Forward Horizon Feature Engineering</h4>
            <p>
              Daily OHLCV time-series records fetched in real-time from financial exchanges are normalized and structured with a forward horizon shift of <code>50 trading days</code>:
            </p>
            <div class="bg-[var(--color-void)] border border-[var(--color-border)] p-3 rounded-xl text-[var(--color-accent)] font-mono-num font-semibold">
              X_scaled = (X - X_min) / (X_max - X_min)
            </div>
          </div>

          <div class="space-y-2.5">
            <h4 class="text-[var(--color-frost)] font-semibold text-sm">PyTorch Recurrent LSTM Deep Learning</h4>
            <p>
              Dual-layer Long Short-Term Memory network capturing non-linear temporal market regimes:
            </p>
            <div class="bg-[var(--color-void)] border border-[var(--color-border)] p-3 rounded-xl text-[#089981] font-mono-num font-semibold">
              Hidden Dimension: 50 | Num Layers: 2 | Optimizer: Adam (lr=0.001)
            </div>
          </div>
        </div>
      </div>

    </div>
  `
})
export class HomeComponent {}
