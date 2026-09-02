import { Component, ElementRef, ViewChild, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OHLCVRecord, ChartType } from '../../core/models/stock.model';

declare const Plotly: any;

@Component({
  selector: 'app-candlestick-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<div #chartContainer class="w-full h-[650px] bg-[#131722] overflow-hidden"></div>`
})
export class CandlestickChartComponent {
  data = input.required<OHLCVRecord[]>();
  maDays = input<number>(50);
  showMA = input<boolean>(true);
  chartType = input<ChartType>('candlestick');
  
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  constructor() {
    effect(() => {
      const records = this.data();
      const ma = this.maDays();
      const show = this.showMA();
      const type = this.chartType();
      if (records && records.length > 0 && typeof Plotly !== 'undefined') {
        this.renderChart(records, ma, show, type);
      }
    });
  }

  private renderChart(records: OHLCVRecord[], maDays: number, showMA: boolean, chartType: ChartType) {
    const dates = records.map(r => r.date);
    const opens = records.map(r => r.open);
    const highs = records.map(r => r.high);
    const lows = records.map(r => r.low);
    const closes = records.map(r => r.close);
    const volumes = records.map(r => r.volume);

    // Volume colors: Green if close >= open, Red if close < open
    const volumeColors = records.map(r => r.close >= r.open ? 'rgba(8, 153, 129, 0.4)' : 'rgba(242, 54, 69, 0.4)');

    const traces: any[] = [];

    if (chartType === 'candlestick') {
      // Main Candlestick Series
      traces.push({
        x: dates,
        open: opens,
        high: highs,
        low: lows,
        close: closes,
        type: 'candlestick',
        name: 'Candles',
        yaxis: 'y',
        increasing: { line: { color: '#089981', width: 1 }, fillcolor: '#089981' },
        decreasing: { line: { color: '#f23645', width: 1 }, fillcolor: '#f23645' }
      });
    } else if (chartType === 'line' || chartType === 'area') {
      traces.push({
        x: dates,
        y: closes,
        type: 'scatter',
        mode: 'lines',
        name: 'Close',
        yaxis: 'y',
        line: { color: '#2962ff', width: 2 },
        fill: chartType === 'area' ? 'tozeroy' : 'none',
        fillcolor: 'rgba(41, 98, 255, 0.1)'
      });
    } else if (chartType === 'bar') {
      traces.push({
        x: dates,
        open: opens,
        high: highs,
        low: lows,
        close: closes,
        type: 'ohlc',
        name: 'OHLC Bars',
        yaxis: 'y',
        increasing: { line: { color: '#089981' } },
        decreasing: { line: { color: '#f23645' } }
      });
    }

    // Moving Average Line Overlay (TradingView signature Blue)
    if (showMA) {
      traces.push({
        x: dates,
        y: records.map(r => r.ma),
        type: 'scatter',
        mode: 'lines',
        name: `SMA ${maDays}`,
        yaxis: 'y',
        line: { color: '#ff9800', width: 1.5 }
      });
    }

    // Secondary Sub-pane: Volume Histogram Bars
    traces.push({
      x: dates,
      y: volumes,
      type: 'bar',
      name: 'Volume',
      yaxis: 'y2',
      marker: { color: volumeColors },
      hoverinfo: 'x+y'
    });

    const layout = {
      paper_bgcolor: '#131722',
      plot_bgcolor: '#131722',
      font: { color: '#787b86', family: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif', size: 11 },
      height: 640,
      margin: { l: 20, r: 60, t: 15, b: 30 },
      showlegend: false,
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: '#1e222d',
        bordercolor: '#363a45',
        font: { color: '#f0f3fa', size: 11 }
      },
      grid: { rows: 2, columns: 1, roworder: 'top to bottom' },
      xaxis: {
        gridcolor: '#1e222d',
        gridwidth: 1,
        linecolor: '#2a2e39',
        rangeslider: { visible: false },
        showspikes: true,
        spikemode: 'across',
        spikethickness: 1,
        spikedash: 'dot',
        spikecolor: '#787b86'
      },
      yaxis: {
        title: '',
        side: 'right',
        domain: [0.22, 1.0],
        gridcolor: '#1e222d',
        linecolor: '#2a2e39',
        tickformat: '.2f',
        showspikes: true,
        spikemode: 'across',
        spikethickness: 1,
        spikedash: 'dot',
        spikecolor: '#787b86'
      },
      yaxis2: {
        title: '',
        side: 'right',
        domain: [0.0, 0.18],
        gridcolor: '#1e222d',
        linecolor: '#2a2e39',
        showticklabels: false
      }
    };

    const config = {
      responsive: true,
      displayModeBar: false,
      scrollZoom: true
    };

    Plotly.react(this.chartContainer.nativeElement, traces, layout, config);
  }
}
