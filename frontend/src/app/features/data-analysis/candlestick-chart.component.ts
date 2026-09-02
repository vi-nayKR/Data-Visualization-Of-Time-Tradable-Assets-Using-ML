import { Component, ElementRef, ViewChild, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OHLCVRecord } from '../../core/models/stock.model';

declare const Plotly: any;

@Component({
  selector: 'app-candlestick-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<div #chartContainer class="w-full h-[550px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 p-2"></div>`
})
export class CandlestickChartComponent {
  data = input.required<OHLCVRecord[]>();
  maDays = input<number>(50);
  showMA = input<boolean>(true);
  
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  constructor() {
    effect(() => {
      const records = this.data();
      const ma = this.maDays();
      const show = this.showMA();
      if (records && records.length > 0 && typeof Plotly !== 'undefined') {
        this.renderChart(records, ma, show);
      }
    });
  }

  private renderChart(records: OHLCVRecord[], maDays: number, showMA: boolean) {
    const dates = records.map(r => r.date);
    
    const candlestickTrace = {
      x: dates,
      open: records.map(r => r.open),
      high: records.map(r => r.high),
      low: records.map(r => r.low),
      close: records.map(r => r.close),
      type: 'candlestick',
      name: 'Market Data',
      increasing: { line: { color: '#22c55e' } },
      decreasing: { line: { color: '#ef4444' } }
    };

    const traces: any[] = [candlestickTrace];

    if (showMA) {
      const maValues = records.map(r => r.ma);
      traces.push({
        x: dates,
        y: maValues,
        type: 'scatter',
        mode: 'lines',
        name: `${maDays}-Day MA`,
        line: { color: '#38bdf8', width: 2 }
      });
    }

    const layout = {
      title: { text: 'Live Share Price Evolution', font: { color: '#f8fafc', size: 16 } },
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
            { count: 180, label: '180D', step: 'day', stepmode: 'backward' },
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

    Plotly.react(this.chartContainer.nativeElement, traces, layout, { responsive: true, displayModeBar: false });
  }
}
