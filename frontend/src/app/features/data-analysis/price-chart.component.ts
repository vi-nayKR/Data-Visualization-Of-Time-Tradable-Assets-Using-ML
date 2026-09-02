import { Component, ElementRef, ViewChild, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OHLCVRecord } from '../../core/models/stock.model';

declare const Plotly: any;

@Component({
  selector: 'app-price-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<div #chartContainer class="w-full h-[380px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 p-2"></div>`
})
export class PriceChartComponent {
  data = input.required<OHLCVRecord[]>();
  field = input.required<'open' | 'high' | 'low' | 'close'>();
  title = input<string>('');
  color = input<string>('#c084fc');

  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  constructor() {
    effect(() => {
      const records = this.data();
      const f = this.field();
      if (records && records.length > 0 && typeof Plotly !== 'undefined') {
        this.renderChart(records, f);
      }
    });
  }

  private renderChart(records: OHLCVRecord[], field: 'open' | 'high' | 'low' | 'close') {
    const dates = records.map(r => r.date);
    const values = records.map(r => r[field]);

    const trace = {
      x: dates,
      y: values,
      type: 'scatter',
      mode: 'lines',
      name: field.toUpperCase(),
      line: { color: this.color(), width: 2 }
    };

    const layout = {
      title: { text: this.title() || `${field.toUpperCase()} Price Trend`, font: { color: '#f8fafc', size: 16 } },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { color: '#94a3b8' },
      height: 360,
      margin: { l: 50, r: 30, t: 40, b: 40 },
      xaxis: { gridcolor: '#1e293b' },
      yaxis: { title: 'Price (USD)', gridcolor: '#1e293b' }
    };

    Plotly.react(this.chartContainer.nativeElement, [trace], layout, { responsive: true, displayModeBar: false });
  }
}
