import { Component, ElementRef, ViewChild, input, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OHLCVRecord } from '../../core/models/stock.model';
import { StockApiService } from '../../core/services/stock-api.service';

declare const Plotly: any;

@Component({
  selector: 'app-prediction-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<div #chartContainer class="w-full h-[620px] bg-[var(--color-void)] overflow-hidden transition-colors duration-300"></div>`
})
export class PredictionChartComponent {
  api = inject(StockApiService);

  records = input.required<OHLCVRecord[]>();
  predictions = input.required<(number | null)[]>();
  modelName = input<string>('ML Model');

  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  constructor() {
    effect(() => {
      const recs = this.records();
      const preds = this.predictions();
      const name = this.modelName();
      const isDark = this.api.isDarkMode();
      if (recs && recs.length > 0 && typeof Plotly !== 'undefined') {
        this.renderChart(recs, preds, name, isDark);
      }
    });
  }

  private renderChart(records: OHLCVRecord[], predictions: (number | null)[], modelName: string, isDark: boolean) {
    const dates = records.map(r => r.date);
    const closePrices = records.map(r => r.close);

    // Theme Palette
    const bgVoid = isDark ? '#060608' : '#ffffff';
    const bgSurface = isDark ? '#12121a' : '#f9fafb';
    const border = isDark ? '#1a1a24' : '#e5e7eb';
    const textMuted = isDark ? '#8e93a0' : '#6b7280';
    const textFrost = isDark ? '#f4f5f8' : '#111827';
    const accent = isDark ? '#ff6b00' : '#ea580c';
    const green = isDark ? '#089981' : '#059669';

    // Filter valid numbers for dynamic tight scaling
    const validCloses = closePrices.filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
    const validPreds = predictions.filter(v => typeof v === 'number' && !isNaN(v as number) && (v as number) > 0) as number[];
    const allValidPrices = [...validCloses, ...validPreds];

    let minPrice = Math.min(...allValidPrices);
    let maxPrice = Math.max(...allValidPrices);
    
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
      line: { color: accent, width: 2 },
      fill: 'tozeroy',
      fillcolor: isDark ? 'rgba(255, 107, 0, 0.08)' : 'rgba(234, 88, 12, 0.08)'
    };

    // ML Predicted Future Trajectory Trace
    const predTrace = {
      x: dates,
      y: predictions,
      type: 'scatter',
      mode: 'lines+markers',
      name: `${modelName} Projected Forecast`,
      line: { color: green, width: 2.5, dash: 'dot' },
      marker: { size: 5, color: green }
    };

    const layout = {
      paper_bgcolor: bgVoid,
      plot_bgcolor: bgVoid,
      font: { color: textMuted, family: 'Inter, -apple-system, sans-serif', size: 11 },
      height: 600,
      margin: { l: 25, r: 65, t: 25, b: 45 },
      showlegend: true,
      legend: {
        x: 0.02,
        y: 0.98,
        bgcolor: isDark ? 'rgba(18, 18, 26, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        bordercolor: border,
        borderwidth: 1,
        font: { color: textFrost, size: 12 }
      },
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: bgSurface,
        bordercolor: border,
        font: { color: textFrost, size: 11, family: 'JetBrains Mono, monospace' }
      },
      xaxis: {
        type: 'date',
        range: [dates[0], dates[dates.length - 1]],
        rangeslider: {
          visible: true,
          thickness: 0.06,
          bgcolor: bgSurface,
          bordercolor: border,
          borderwidth: 1,
          yaxis: { rangemode: 'match' }
        },
        gridcolor: isDark ? '#12121a' : '#f3f4f6',
        linecolor: border,
        tickfont: { color: textMuted, size: 10 },
        showspikes: true,
        spikemode: 'across',
        spikethickness: 1,
        spikedash: 'dot',
        spikecolor: textMuted
      },
      yaxis: {
        side: 'right',
        range: yRange,
        autorange: false,
        gridcolor: isDark ? '#12121a' : '#f3f4f6',
        linecolor: border,
        tickformat: '.2f',
        tickprefix: '$',
        tickfont: { color: textMuted, size: 11, family: 'JetBrains Mono, monospace' },
        showspikes: true,
        spikemode: 'across',
        spikethickness: 1,
        spikedash: 'dot',
        spikecolor: textMuted
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
