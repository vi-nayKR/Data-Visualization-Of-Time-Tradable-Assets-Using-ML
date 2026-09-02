import { Component, ElementRef, ViewChild, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OHLCVRecord } from '../../core/models/stock.model';

declare const Plotly: any;

@Component({
  selector: 'app-prediction-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<div #chartContainer class="w-full h-[550px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 p-2"></div>`
})
export class PredictionChartComponent {
  records = input.required<OHLCVRecord[]>();
  predictions = input.required<(number | null)[]>();
  modelName = input<string>('Prediction');

  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  constructor() {
    effect(() => {
      const recs = this.records();
      const preds = this.predictions();
      const name = this.modelName();
      if (recs && recs.length > 0 && typeof Plotly !== 'undefined') {
        this.renderChart(recs, preds, name);
      }
    });
  }

  private renderChart(records: OHLCVRecord[], predictions: (number | null)[], modelName: string) {
    const dates = records.map(r => r.date);
    const closePrices = records.map(r => r.close);

    const actualTrace = {
      x: dates,
      y: closePrices,
      type: 'scatter',
      mode: 'lines',
      name: 'Actual Close',
      line: { color: '#38bdf8', width: 2 }
    };

    const predTrace = {
      x: dates,
      y: predictions,
      type: 'scatter',
      mode: 'lines',
      name: `${modelName} Predictions`,
      line: { color: '#c084fc', width: 2, dash: 'dot' }
    };

    const layout = {
      title: { text: `Actual vs ${modelName} Price Trajectory`, font: { color: '#f8fafc', size: 16 } },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { color: '#94a3b8' },
      height: 530,
      margin: { l: 50, r: 30, t: 50, b: 40 },
      xaxis: {
        gridcolor: '#1e293b',
        rangeslider: { visible: true },
        rangeselector: {
          buttons: [
            { count: 30, label: '30D', step: 'day', stepmode: 'backward' },
            { count: 60, label: '60D', step: 'day', stepmode: 'backward' },
            { count: 90, label: '90D', step: 'day', stepmode: 'backward' },
            { count: 120, label: '120D', step: 'day', stepmode: 'backward' },
            { step: 'all', label: 'All' }
          ],
          bgcolor: '#1e293b',
          activecolor: '#4f46e5',
          font: { color: '#e2e8f0' }
        }
      },
      yaxis: {
        title: 'Stock Price (USD)',
        gridcolor: '#1e293b'
      }
    };

    Plotly.react(this.chartContainer.nativeElement, [actualTrace, predTrace], layout, { responsive: true, displayModeBar: false });
  }
}
