import { Component, ElementRef, ViewChild, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OHLCVRecord } from '../../core/models/stock.model';

declare const Plotly: any;

@Component({
  selector: 'app-prediction-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<div #chartContainer class="w-full h-[620px] bg-[#131722] overflow-hidden"></div>`
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

    // Filter valid numbers for dynamic tight scaling
    const validCloses = closePrices.filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
    const validPreds = predictions.filter(v => typeof v === 'number' && !isNaN(v as number) && (v as number) > 0) as number[];
    const allValidPrices = [...validCloses, ...validPreds];

    let minPrice = Math.min(...allValidPrices);
    let maxPrice = Math.max(...allValidPrices);
    
    // Safety fallback
    if (!isFinite(minPrice) || !isFinite(maxPrice) || minPrice === maxPrice) {
      minPrice = 100;
      maxPrice = 200;
    }
    
    const priceDelta = maxPrice - minPrice;
    const padding = Math.max(priceDelta * 0.08, 2);
    const yRange = [Math.max(0, Math.floor(minPrice - padding)), Math.ceil(maxPrice + padding)];

    // Actual Historical Prices Trace
    const actualTrace = {
      x: dates,
      y: closePrices,
      type: 'scatter',
      mode: 'lines',
      name: 'Actual Close Price',
      line: { color: '#2962ff', width: 2 },
      fill: 'tozeroy',
      fillcolor: 'rgba(41, 98, 255, 0.08)'
    };

    // ML Predicted Future Trajectory Trace
    const predTrace = {
      x: dates,
      y: predictions,
      type: 'scatter',
      mode: 'lines+markers',
      name: `${modelName} Projected Forecast`,
      line: { color: '#089981', width: 2.5, dash: 'dot' },
      marker: { size: 5, color: '#089981' }
    };

    const layout = {
      paper_bgcolor: '#131722',
      plot_bgcolor: '#131722',
      font: { color: '#9db2c6', family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', size: 11 },
      height: 600,
      margin: { l: 25, r: 65, t: 25, b: 45 },
      showlegend: true,
      legend: {
        x: 0.02,
        y: 0.98,
        bgcolor: '#1e222d',
        bordercolor: '#363c4e',
        borderwidth: 1,
        font: { color: '#f0f3fa', size: 12 }
      },
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: '#1e222d',
        bordercolor: '#363c4e',
        font: { color: '#ffffff', size: 11, family: 'JetBrains Mono, monospace' }
      },
      xaxis: {
        type: 'date',
        range: [dates[0], dates[dates.length - 1]],
        rangeslider: {
          visible: true,
          thickness: 0.06,
          bgcolor: '#181b24',
          bordercolor: '#2a2e39',
          borderwidth: 1,
          yaxis: { rangemode: 'match' }
        },
        gridcolor: '#1e222d',
        linecolor: '#2a2e39',
        tickfont: { color: '#9db2c6', size: 10 },
        showspikes: true,
        spikemode: 'across',
        spikethickness: 1,
        spikedash: 'dot',
        spikecolor: '#787b86'
      },
      yaxis: {
        side: 'right',
        range: yRange,
        autorange: false,
        gridcolor: '#1e222d',
        linecolor: '#2a2e39',
        tickformat: '.2f',
        tickprefix: '$',
        tickfont: { color: '#9db2c6', size: 11, family: 'JetBrains Mono, monospace' },
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
