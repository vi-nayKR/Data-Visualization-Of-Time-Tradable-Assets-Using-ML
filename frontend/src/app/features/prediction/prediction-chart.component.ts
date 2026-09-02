import { Component, ElementRef, ViewChild, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OHLCVRecord } from '../../core/models/stock.model';

declare const Plotly: any;

@Component({
  selector: 'app-prediction-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<div #chartContainer class="w-full h-[580px] bg-[#131722] overflow-hidden"></div>`
})
export class PredictionChartComponent {
  records = input.required<OHLCVRecord[]>();
  predictions = input.required<(number | null)[]>();
  modelName = input<string>('ML Model');

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

    // Actual Historical Prices
    const actualTrace = {
      x: dates,
      y: closePrices,
      type: 'scatter',
      mode: 'lines',
      name: 'Actual Close',
      line: { color: '#2962ff', width: 2 },
      fill: 'tozeroy',
      fillcolor: 'rgba(41, 98, 255, 0.05)'
    };

    // ML Predicted Future Trajectory
    const predTrace = {
      x: dates,
      y: predictions,
      type: 'scatter',
      mode: 'lines+markers',
      name: `${modelName} Forecast`,
      line: { color: '#089981', width: 2.5, dash: 'dot' },
      marker: { size: 4, color: '#089981' }
    };

    const layout = {
      paper_bgcolor: '#131722',
      plot_bgcolor: '#131722',
      font: { color: '#787b86', family: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif', size: 11 },
      height: 570,
      margin: { l: 20, r: 60, t: 20, b: 30 },
      showlegend: true,
      legend: {
        x: 0.02,
        y: 0.98,
        bgcolor: '#1e222d',
        bordercolor: '#363a45',
        font: { color: '#f0f3fa', size: 11 }
      },
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: '#1e222d',
        bordercolor: '#363a45',
        font: { color: '#f0f3fa', size: 11 }
      },
      xaxis: {
        gridcolor: '#1e222d',
        linecolor: '#2a2e39',
        rangeslider: { visible: false },
        showspikes: true,
        spikemode: 'across',
        spikethickness: 1,
        spikedash: 'dot',
        spikecolor: '#787b86'
      },
      yaxis: {
        side: 'right',
        gridcolor: '#1e222d',
        linecolor: '#2a2e39',
        tickformat: '.2f',
        showspikes: true,
        spikemode: 'across',
        spikethickness: 1,
        spikedash: 'dot',
        spikecolor: '#787b86'
      }
    };

    const config = {
      responsive: true,
      displayModeBar: false,
      scrollZoom: true
    };

    Plotly.react(this.chartContainer.nativeElement, [actualTrace, predTrace], layout, config);
  }
}
