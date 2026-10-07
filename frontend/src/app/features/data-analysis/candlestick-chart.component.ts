import { ChangeDetectionStrategy, signal, Component, ElementRef, ViewChild, input, effect, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OHLCVRecord, ChartType } from '../../core/models/stock.model';
import { StockApiService } from '../../core/services/stock-api.service';

import { UiSkeleton, UiButton } from '../../shared/ui';
import { loadPlotly, chartPalette, chartLayout } from '../../shared/aurora-chart';

@Component({
  selector: 'app-candlestick-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule,UiSkeleton,UiButton],
  template: `
    @if(loadFailed()){<div class="empty-state"><p>Chart could not load.</p><button uiButton (click)="ngAfterViewInit()">Retry chart</button></div>}@else if(!rendered()){<ui-skeleton />}
    <div #chartContainer 
         class="chart-canvas" role="img" [attr.aria-label]="api.selectedTicker()+' historical price, volume and selected technical indicators'">
    </div>
  `
})
export class CandlestickChartComponent implements AfterViewInit, OnDestroy {
  api = inject(StockApiService);

  data = input.required<OHLCVRecord[]>();
  maDays = input<number>(50);
  showMA = input<boolean>(true);
  showEMA = input<boolean>(false);
  showBB = input<boolean>(false);
  showRSI = input<boolean>(false);
  chartType = input<ChartType>('candlestick');
  
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  private touchStartDistance = 0;
  private resizeObserver?: ResizeObserver;
  private chartReady = false;
  private Plotly:any;
  private destroyed=false;
  private loaded=signal(false);
  rendered=signal(false);loadFailed=signal(false);

  constructor() {
    // Render chart on data/indicator/theme changes
    effect(() => {
      const records = this.data();
      const ma = this.maDays();
      const showMA = this.showMA();
      const showEMA = this.showEMA();
      const showBB = this.showBB();
      const showRSI = this.showRSI();
      const type = this.chartType();
      const isDark = this.api.isDarkMode();
      if (this.loaded() && records && records.length > 0) {
        this.renderChart(records, ma, showMA, showEMA, showBB, showRSI, type, isDark);
      }
    });

    // Handle Active Tool changes (Trendline, Brush, Measure, Crosshair)
    effect(() => {
      const tool = this.api.activeDrawingTool();
      if (this.chartReady && this.chartContainer?.nativeElement) {
        this.applyDrawingTool(tool);
      }
    });

    // Handle One-Shot Drawing Actions (Clear, Fibonacci, Zoom)
    effect(() => {
      const action = this.api.drawingAction();
      if (action && this.chartReady && this.chartContainer?.nativeElement) {
        if (action.type === 'clear') {
          this.Plotly.relayout(this.chartContainer.nativeElement, { shapes: [] });
        } else if (action.type === 'fibonacci') {
          this.applyFibonacci();
        } else if (action.type === 'zoom') {
          this.applyZoomIn();
        }
      }
    });
  }

  async ngAfterViewInit() {
    this.loadFailed.set(false);try{this.Plotly=await loadPlotly();}catch{this.loadFailed.set(true);return;}
    if(this.destroyed)return;
    this.loaded.set(true);
    this.setupTouchGestures();
    if (typeof ResizeObserver !== 'undefined' && this.chartContainer?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.chartReady && this.chartContainer?.nativeElement) {
          this.Plotly.Plots.resize(this.chartContainer.nativeElement);
        }
      });
      this.resizeObserver.observe(this.chartContainer.nativeElement);
    }
  }

  ngOnDestroy() {
    this.destroyed=true;
    if(this.chartReady)this.Plotly.purge(this.chartContainer.nativeElement);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private setupTouchGestures() {
    const el = this.chartContainer?.nativeElement;
    if (!el) return;

    // Dual-finger pinch-to-zoom handler for mobile touchscreens
    el.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.touchStartDistance = Math.hypot(dx, dy);
      }
    }, { passive: true });

    el.addEventListener('touchmove', (e: TouchEvent) => {
      if (e.touches.length === 2 && this.touchStartDistance > 0) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDistance = Math.hypot(dx, dy);
        const factor = currentDistance / this.touchStartDistance;

        // Apply smooth pinch scaling if significant delta
        if (Math.abs(factor - 1) > 0.08) {
          this.zoomScale(factor > 1 ? 0.85 : 1.15);
          this.touchStartDistance = currentDistance;
        }
      }
    }, { passive: true });

    el.addEventListener('touchend', () => {
      this.touchStartDistance = 0;
    }, { passive: true });
  }

  private zoomScale(scaleFactor: number) {
    const el = this.chartContainer?.nativeElement;
    if (!el || !el._fullLayout || !el._fullLayout.xaxis) return;
    
    const xRange = el._fullLayout.xaxis.range;
    if (!xRange || xRange.length < 2) return;

    const t0 = new Date(xRange[0]).getTime();
    const t1 = new Date(xRange[1]).getTime();
    const mid = (t0 + t1) / 2;
    const halfSpan = ((t1 - t0) * scaleFactor) / 2;

    const newStart = new Date(mid - halfSpan).toISOString().split('T')[0];
    const newEnd = new Date(mid + halfSpan).toISOString().split('T')[0];

    this.Plotly.relayout(el, {
      'xaxis.range': [newStart, newEnd]
    });
  }

  private applyDrawingTool(tool: string) {
    if (!this.chartReady || !this.chartContainer?.nativeElement) return;
    const el = this.chartContainer.nativeElement;
    const accent = chartPalette().accent;

    if (tool === 'trendline') {
      this.Plotly.relayout(el, {
        dragmode: 'drawline',
        'newshape.line.color': accent,
        'newshape.line.width': 2
      });
    } else if (tool === 'brush') {
      this.Plotly.relayout(el, {
        dragmode: 'drawrect',
        'newshape.fillcolor': chartPalette().fill,
        'newshape.line.color': accent,
        'newshape.line.width': 1.5
      });
    } else if (tool === 'measure') {
      this.Plotly.relayout(el, { dragmode: 'select' });
    } else if (tool === 'crosshair') {
      this.Plotly.relayout(el, {
        dragmode: 'pan',
        'xaxis.showspikes': true,
        'yaxis.showspikes': true
      });
    } else {
      this.Plotly.relayout(el, { dragmode: 'pan' });
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
      { ratio: 0.0, color: chartPalette().red, name: '0.0% (Low)' },
      { ratio: 0.236, color: chartPalette().indigo, name: '23.6%' },
      { ratio: 0.382, color: chartPalette().accent, name: '38.2%' },
      { ratio: 0.5, color: chartPalette().accent, name: '50.0%' },
      { ratio: 0.618, color: chartPalette().green, name: '61.8% (Golden)' },
      { ratio: 0.786, color: chartPalette().indigo, name: '78.6%' },
      { ratio: 1.0, color: chartPalette().green, name: '100.0% (High)' }
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

    this.Plotly.relayout(this.chartContainer.nativeElement, { shapes });
  }

  private applyZoomIn() {
    const records = this.data();
    if (!records || records.length < 30 || !this.chartContainer?.nativeElement) return;
    const last30 = records.slice(records.length - 30);
    this.Plotly.relayout(this.chartContainer.nativeElement, {
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
    chartType: ChartType,
    isDark: boolean
  ) {
    const dates = records.map(r => r.date);
    const opens = records.map(r => r.open);
    const highs = records.map(r => r.high);
    const lows = records.map(r => r.low);
    const closes = records.map(r => r.close);
    const volumes = records.map(r => r.volume);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Theme Palette
    const palette=chartPalette();
    const bgVoid='transparent',bgSurface=palette.surface,border=palette.border,textMuted=palette.muted,textFrost=palette.text,accent=palette.accent,green=palette.green,red=palette.red;

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

    const volumeColors = records.map(r => r.close >= r.open ? palette.green : palette.red);

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
        increasing: { line: { color: green, width: 1.2 }, fillcolor: green },
        decreasing: { line: { color: red, width: 1.2 }, fillcolor: red }
      });
    } else if (chartType === 'line' || chartType === 'area') {
      traces.push({
        x: dates,
        y: closes,
        type: 'scatter',
        mode: 'lines',
        name: 'Close Price',
        yaxis: 'y',
        line: { color: accent, width: 2 },
        fill: chartType === 'area' ? 'tozeroy' : 'none',
        fillcolor: palette.fill
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
        increasing: { line: { color: green } },
        decreasing: { line: { color: red } }
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
        line: { color: palette.indigo, width: 1, dash: 'dot' }
      });
      traces.push({
        x: dates,
        y: records.map(r => r.bbLower),
        type: 'scatter',
        mode: 'lines',
        name: 'BB Lower (20,2)',
        yaxis: 'y',
        fill: 'tonexty',
        fillcolor: palette.fill,
        line: { color: palette.indigo, width: 1, dash: 'dot' }
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
        line: { color: chartPalette().indigo, width: 1.8 }
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
        line: { color: chartPalette().accent, width: 1.6 }
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
        line: { color: chartPalette().indigo, width: 1.5 }
      });
    }

    // Layout configuration with TradingView Pan/Zoom touch mechanics
    const layout: any = {
      paper_bgcolor: bgVoid,
      plot_bgcolor: bgVoid,
      autosize: true,
      dragmode: 'pan', // Default to smooth single-finger drag/pan like TradingView
      font: { color: textMuted, family: 'Inter, -apple-system, sans-serif', size: isMobile ? 9 : 11 },
      margin: isMobile 
        ? { l: 5, r: 48, t: 10, b: 35 }
        : { l: 20, r: 65, t: 15, b: 45 },
      showlegend: !isMobile && (showBB || showEMA),
      legend: {
        x: 0.01,
        y: 0.99,
        bgcolor: palette.surface,
        bordercolor: border,
        font: { color: textFrost, size: 10 }
      },
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: bgSurface,
        bordercolor: border,
        font: { color: textFrost, size: isMobile ? 9 : 11, family: 'JetBrains Mono, monospace' }
      },
      xaxis: {
        type: 'date',
        range: [dates[0], dates[dates.length - 1]],
        fixedrange: false, // Fully zoomable & pannable by hand!
        rangeslider: {
          visible: true,
          thickness: isMobile ? 0.05 : 0.06,
          bgcolor: bgSurface,
          bordercolor: border,
          borderwidth: 1,
          yaxis: { rangemode: 'match' }
        },
        gridcolor: palette.grid,
        gridwidth: 1,
        linecolor: border,
        tickfont: { color: textMuted, size: isMobile ? 8 : 10 },
        showspikes: true,
        spikemode: 'across',
        spikethickness: 1,
        spikedash: 'dot',
        spikecolor: textMuted
      },
      yaxis: {
        title: '',
        side: 'right',
        range: yRange,
        autorange: false,
        fixedrange: false, // Zoomable & stretchable by hand!
        domain: showRSI ? [0.38, 1.0] : [0.24, 1.0],
        gridcolor: palette.grid,
        linecolor: border,
        tickformat: '.2f',
        tickprefix: this.api.currencySymbol(),
        tickfont: { color: textMuted, size: isMobile ? 9 : 11, family: 'JetBrains Mono, monospace' },
        showspikes: true,
        spikemode: 'across',
        spikethickness: 1,
        spikedash: 'dot',
        spikecolor: textMuted
      },
      yaxis2: {
        title: '',
        side: 'right',
        fixedrange: true,
        domain: showRSI ? [0.20, 0.35] : [0.08, 0.22],
        gridcolor: palette.grid,
        linecolor: border,
        showticklabels: false
      }
    };

    if (showRSI) {
      layout.yaxis3 = {
        title: 'RSI',
        side: 'right',
        fixedrange: true,
        domain: [0.08, 0.18],
        gridcolor: palette.grid,
        linecolor: border,
        range: [0, 100],
        tickvals: [30, 70],
        tickfont: { color: chartPalette().indigo, size: 8 }
      };
    }

    const shared=chartLayout();
    Object.assign(layout,shared,{xaxis:{...layout.xaxis,...shared.xaxis},yaxis:{...layout.yaxis,...shared.yaxis}});
    const config = {
      responsive: true,
      scrollZoom: true,     // Enables pinch-to-zoom and wheel zoom
      displayModeBar: false,
      doubleClick: 'reset', // Double tap to reset
      showTips: false
    };

    this.chartReady = false;
    this.Plotly.react(this.chartContainer.nativeElement, traces, layout, config).then(() => {
      if(this.destroyed)return;
      this.chartReady = true;
      this.rendered.set(true);
      this.applyDrawingTool(this.api.activeDrawingTool());
    });
  }
}
