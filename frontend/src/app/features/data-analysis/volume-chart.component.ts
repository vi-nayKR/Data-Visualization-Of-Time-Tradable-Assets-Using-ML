import { Component, ElementRef, ViewChild, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OHLCVRecord } from '../../core/models/stock.model';

declare const Plotly: any;

@Component({
  selector: 'app-volume-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<div #chartContainer class="w-full h-[400px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 p-2"></div>`
})
export class VolumeChartComponent {
  data = input.required<OHLCVRecord[]>();
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  constructor() {
    effect(() => {
      const records = this.data();
      if (records && records.length > 0 && typeof Plotly !== 'undefined') {
        this.renderChart(records);
      }
    });
  }

  private renderChart(records: OHLCVRecord[]) {
    const dates = records.map(r => r.date);
    const volumes = records.map(r => r.volume);

    const trace = {
      x: dates,
      y: volumes,
      type: 'bar',
      name: 'Volume',
      marker: { color: '#818cf8' }
    };

    const layout = {
      title: { text: 'Volume of Stock (in Millions)', font: { color: '#f8fafc', size: 16 } },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { color: '#94a3b8' },
      height: 380,
      margin: { l: 50, r: 30, t: 40, b: 40 },
      xaxis: { gridcolor: '#1e293b' },
      yaxis: { title: 'Shares Traded (M)', gridcolor: '#1e293b' }
    };

    Plotly.react(this.chartContainer.nativeElement, [trace], layout, { responsive: true, displayModeBar: false });
  }
}
