import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-5xl mx-auto space-y-8">
      <div class="text-center py-6 border-b border-slate-800">
        <h1 class="text-4xl font-extrabold bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-3">
          📈 Stock Market Dashboard
        </h1>
        <p class="text-slate-400 text-lg">
          Time-Series Visualization & Machine Learning Predictive Analytics for Financial Assets
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 hover:border-indigo-500/50 transition-all">
          <div class="text-3xl mb-3">📊</div>
          <h2 class="text-xl font-bold text-slate-100 mb-2">Technical Analysis</h2>
          <p class="text-slate-400 text-sm leading-relaxed">
            Interactive Plotly candlestick charts, custom moving average overlays (10-200 days), intraday highs/lows, and trading volume visualizations.
          </p>
        </div>

        <div class="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
          <div class="text-3xl mb-3">🔮</div>
          <h2 class="text-xl font-bold text-slate-100 mb-2">ML Price Forecasting</h2>
          <p class="text-slate-400 text-sm leading-relaxed">
            Forecasting future stock closing prices using Linear Regression, Support Vector Machines (SVR), Decision Tree Regressors, and PyTorch LSTM Neural Networks.
          </p>
        </div>
      </div>

      <div class="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8 space-y-6">
        <h2 class="text-2xl font-bold text-slate-200">Financial Markets Overview</h2>
        
        <div class="space-y-4 text-slate-300 leading-relaxed text-sm">
          <p>
            <strong class="text-sky-400">Stock Market & Exchange:</strong> A stock market is the aggregation of buyers and sellers of stocks representing ownership claims on businesses. Investment platforms allow trading listed securities with investment strategies in mind.
          </p>
          <p>
            <strong class="text-purple-400">Machine Learning in Stock Prediction:</strong> Machine learning algorithms like Backpropagation Neural Networks, Time Recurrent Neural Networks (RNN/LSTM), and Kernel Regressors analyze time-series sequences to approximate price trajectories and trends.
          </p>
        </div>
      </div>
    </div>
  `
})
export class HomeComponent {}
