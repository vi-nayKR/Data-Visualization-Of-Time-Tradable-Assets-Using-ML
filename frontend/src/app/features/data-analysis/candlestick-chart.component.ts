import { Component, ElementRef, ViewChild, input, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OHLCVRecord, ChartType } from '../../core/models/stock.model';
import { StockApiService } from '../../core/services/stock-api.service';

declare const Plotly: any;

@Component({
  selector: 'app-candlestick-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<div #chartContainer class="w-full h-[650px] bg-[#131722] overflow-hidden"></div>`
})
export class CandlestickChartComponent {
  api = inject(StockApiService);

  data = input.required<OHLCVRecord[]>();
  maDays = input<number>(50);
  showMA = input<boolean>(true);
  showEMA = input<boolean>(false);
  showBB = input<boolean>(false);
  showRSI = input<boolean>(false);
  chartType = input<ChartType>('candlestick');
  
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  constructor() {
    // Render chart on data/indicator changes
    effect(() => {
      const records = this.data();
      const ma = this.maDays();
      const showMA = this.showMA();
      const showEMA = this.showEMA();
      const showBB = this.showBB();
      const showRSI = this.showRSI();
      const type = this.chartType();
      if (records && records.length > 0 && typeof Plotly !== 'undefined') {
        this.renderChart(records, ma, showMA, showEMA, showBB, showRSI, type);
      }
    });

    // Handle Active Tool changes (Trendline, Brush, Measure, Crosshair)
    effect(() => {
      const tool = this.api.activeDrawingTool();
      if (typeof Plotly !== 'undefined' && this.chartContainer?.nativeElement) {
        this.applyDrawingTool(tool);
      }
    });

    // Handle One-Shot Drawing Actions (Clear, Fibonacci, Zoom)
    effect(() => {
      const action = this.api.drawingAction();
      if (action && typeof Plotly !== 'undefined' && this.chartContainer?.nativeElement) {
        if (action.type === 'clear') {
          Plotly.relayout(this.chartContainer.nativeElement, { shapes: [] });
        } else if (action.type === 'fibonacci') {
          this.applyFibonacci();
        } else if (action.type === 'zoom') {
          this.applyZoomIn();
        }
      }
    });
  }

  private applyDrawingTool(tool: string) {
    if (!this.chartContainer?.nativeElement) return;
    const el = this.chartContainer.nativeElement;

    if (tool === 'trendline') {
      Plotly.relayout(el, {
        dragmode: 'drawline',
        'newshape.line.color': '#2962ff',
        'newshape.line.width': 2
      });
    } else if (tool === 'brush') {
      Plotly.relayout(el, {
        dragmode: 'drawrect',
        'newshape.fillcolor': 'rgba(41, 98, 255, 0.12)',
        'newshape.line.color': '#2962ff',
        'newshape.line.width': 1.5
      });
    } else if (tool === 'measure') {
      Plotly.relayout(el, { dragmode: 'select' });
    } else if (tool === 'crosshair') {
      Plotly.relayout(el, {
        dragmode: 'zoom',
        'xaxis.showspikes': true,
        'yaxis.showspikes': true
      });
    } else {
      Plotly.relayout(el, { dragmode: 'zoom' });
    }
  }

  private applyFibonacci() {
    const records = this.data();
    if (!records || records.length === 0 || !this.chartContainer?.nativeElement) return;

    const highs = records.map(r => r.high);
    const lows = records.map(r => r.low);
    const maxHigh = Math.max(...highs);
    const minLow = Math.min(...lows);
    const diff = maxHigh - minLow;

    const fibLevels = [
      { ratio: 0.0, color: '#f23645', name: '0.0% (Low)' },
      { ratio: 0.236, color: '#ff9800', name: '23.6%' },
      { ratio: 0.382, color: '#00e5ff', name: '38.2%' },
      { ratio: 0.5, color: '#2962ff', name: '50.0%' },
      { ratio: 0.618, color: '#089981', name: '61.8% (Golden)' },
      { ratio: 0.786, color: '#e040fb', name: '78.6%' },
      { ratio: 1.0, color: '#089981', name: '100.0% (High)' }
    ];

    const shapes = fibLevels.map(fib => {
      const yVal = minLow + (diff * fib.ratio);
      return {
        type: 'line',
        xref: 'paper',
        x0: 0,
        x1: 1,
        yref: 'y',
        y0: yVal,
        y1: yVal,
        line: {
          color: fib.color,
          width: fib.ratio === 0.618 || fib.ratio === 0.5 ? 2 : 1,
          dash: 'dashdot'
        }
      };
    });

    Plotly.relayout(this.chartContainer.nativeElement, { shapes });
  }

  private applyZoomIn() {
    const records = this.data();
    if (!records || records.length < 30 || !this.chartContainer?.nativeElement) return;
    const last30 = records.slice(records.length - 30);
    Plotly.relayout(this.chartContainer.nativeElement, {
      'xaxis.range': [last30[0].date, last30[last30.length - 1].date]
    });
  }

  private renderChart(
    records: OHLCVRecord[],
    maDays: number,
    showMA: boolean,
    showEMA: boolean,
    showBB: boolean,
    showRSI: boolean,
    chartType: ChartType
  ) {
    const dates = records.map(r => r.date);
    const opens = records.map(r => r.open);
    const highs = records.map(r => r.high);
    const lows = records.map(r => r.low);
    const closes = records.map(r => r.close);
    const volumes = records.map(r => r.volume);

    // Calculate dynamic tight price range
    const validLows = lows.filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
    const validHighs = highs.filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
    let minPrice = Math.min(...validLows);
    let maxPrice = Math.max(...validHighs);

    if (!isFinite(minPrice) || !isFinite(maxPrice) || minPrice === maxPrice) {
      minPrice = 100;
      maxPrice = 200;
    }

    const priceDelta = maxPrice - minPrice;
    const padding = Math.max(priceDelta * 0.08, 2);
    const yRange = [Math.max(0, Math.floor(minPrice - padding)), Math.ceil(maxPrice + padding)];

    const volumeColors = records.map(r => r.close >= r.open ? 'rgba(8, 153, 129, 0.45)' : 'rgba(242, 54, 69, 0.45)');

    const traces: any[] = [];

    // 1. Primary Price Series
    if (chartType === 'candlestick') {
      traces.push({
        x: dates,
        open: opens,
        high: highs,
        low: lows,
        close: closes,
        type: 'candlestick',
        name: 'Candles',
        yaxis: 'y',
        increasing: { line: { color: '#089981', width: 1.2 }, fillcolor: '#089981' },
        decreasing: { line: { color: '#f23645', width: 1.2 }, fillcolor: '#f23645' }
      });
    } else if (chartType === 'line' || chartType === 'area') {
      traces.push({
        x: dates,
        y: closes,
        type: 'scatter',
        mode: 'lines',
        name: 'Close Price',
        yaxis: 'y',
        line: { color: '#2962ff', width: 2 },
        fill: chartType === 'area' ? 'tozeroy' : 'none',
        fillcolor: 'rgba(41, 98, 255, 0.08)'
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

    // 2. Bollinger Bands
    if (showBB) {
      traces.push({
        x: dates,
        y: records.map(r => r.bbUpper),
        type: 'scatter',
        mode: 'lines',
        name: 'BB Upper (20,2)',
        yaxis: 'y',
        line: { color: 'rgba(41, 98, 255, 0.4)', width: 1, dash: 'dot' }
      });
      traces.push({
        x: dates,
        y: records.map(r => r.bbLower),
        type: 'scatter',
        mode: 'lines',
        name: 'BB Lower (20,2)',
        yaxis: 'y',
        fill: 'tonexty',
        fillcolor: 'rgba(41, 98, 255, 0.04)',
        line: { color: 'rgba(41, 98, 255, 0.4)', width: 1, dash: 'dot' }
      });
    }

    // 3. Simple Moving Average (SMA)
    if (showMA) {
      traces.push({
        x: dates,
        y: records.map(r => r.ma),
        type: 'scatter',
        mode: 'lines',
        name: `SMA ${maDays}`,
        yaxis: 'y',
        line: { color: '#ff9800', width: 1.8 }
      });
    }

    // 4. Exponential Moving Average (EMA 20)
    if (showEMA) {
      traces.push({
        x: dates,
        y: records.map(r => r.ema),
        type: 'scatter',
        mode: 'lines',
        name: 'EMA (20)',
        yaxis: 'y',
        line: { color: '#00e5ff', width: 1.6 }
      });
    }

    // 5. Volume Subplot
    traces.push({
      x: dates,
      y: volumes,
      type: 'bar',
      name: 'Volume',
      yaxis: 'y2',
      marker: { color: volumeColors },
      hoverinfo: 'x+y'
    });

    // 6. RSI Subplot
    if (showRSI) {
      traces.push({
        x: dates,
        y: records.map(r => r.rsi),
        type: 'scatter',
        mode: 'lines',
        name: 'RSI (14)',
        yaxis: 'y3',
        line: { color: '#e040fb', width: 1.5 }
      });
    }

    // Layout configuration
    const layout: any = {
      paper_bgcolor: '#131722',
      plot_bgcolor: '#131722',
      font: { color: '#9db2c6', family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', size: 11 },
      height: 640,
      margin: { l: 20, r: 65, t: 15, b: 30 },
      showlegend: showBB || showEMA,
      legend: {
        x: 0.01,
        y: 0.99,
        bgcolor: 'rgba(30, 34, 45, 0.8)',
        bordercolor: '#363c4e',
        font: { color: '#f0f3fa', size: 10 }
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
        gridcolor: '#1e222d',
        gridwidth: 1,
        linecolor: '#2a2e39',
        rangeslider: { visible: false },
        tickfont: { color: '#9db2c6', size: 10 },
        showspikes: true,
        spikemode: 'across',
        spikethickness: 1,
        spikedash: 'dot',
        spikecolor: '#787b86'
      },
      yaxis: {
        title: '',
        side: 'right',
        range: yRange,
        autorange: false,
        domain: showRSI ? [0.35, 1.0] : [0.22, 1.0],
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
      },
      yaxis2: {
        title: '',
        side: 'right',
        domain: showRSI ? [0.18, 0.32] : [0.0, 0.18],
        gridcolor: '#1e222d',
        linecolor: '#2a2e39',
        showticklabels: false
      }
    };

    if (showRSI) {
      layout.yaxis3 = {
        title: 'RSI',
        side: 'right',
        domain: [0.0, 0.15],
        gridcolor: '#1e222d',
        linecolor: '#2a2e39',
        range: [0, 100],
        tickvals: [30, 70],
        tickfont: { color: '#e040fb', size: 9 }
      };
    }

    const config = {
      responsive: true,
      displayModeBar: false,
      scrollZoom: true
    };

    Plotly.react(this.chartContainer.nativeElement, traces, layout, config);
  }
}
