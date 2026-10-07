import { ChangeDetectionStrategy, Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockApiService } from '../../core/services/stock-api.service';
import { OHLCVRecord, Timeframe, PredictionResponse, BestModelResponse } from '../../core/models/stock.model';
import { UI } from '../../shared/ui';
import { TickerPickerComponent } from '../../shared/ticker-picker';
import { ModelCardComponent } from './model-card.component';
import { PredictionChartComponent } from '../prediction/prediction-chart.component';
@Component({selector:'app-best-analysis',changeDetection:ChangeDetectionStrategy.OnPush,imports:[CommonModule,TickerPickerComponent,...UI,ModelCardComponent,PredictionChartComponent],template:`
<ui-page-header label="// MODEL RESULTS" title="Compare the models" description="Five approaches, ranked by their R? fit score for the selected asset." [source]="api.sourceLabel('best')" />
<div uiCard class="toolbar"><ui-ticker-picker /><p class="page-description">A higher R? indicates a closer fit in this experiment.</p></div>
@if(response(); as result){<div class="rank-grid">@for(m of rankedModels();track m.name;let rank=$index){<app-model-card [name]="m.name" [score]="m.score" [rank]="rank+1" [isWinner]="m.name===result.winner" />}</div>}
<section uiCard aria-labelledby="winner-title"><div class="panel-heading"><div><h2 id="winner-title">{{api.selectedTicker()}} ? {{response()?.winner || 'Best model projection'}}</h2><p>Historical prices and the highest-scoring model output.</p></div><span uiBadge>Best fit</span></div><div class="chart-frame" [attr.aria-busy]="loading()">@if(loading()){<ui-skeleton />}@else if(response()?.records?.length){<app-prediction-chart [records]="response()!.records" [predictions]="response()!.predictions" [modelName]="response()!.winner" />}@else{<div class="empty-state"><h2>{{error()?'Unable to load model results':'No model results available'}}</h2><button uiButton (click)="fetchBestModel(api.selectedTicker())">Retry</button></div>}</div><p class="chart-caption">The ranking describes this dataset. It does not establish which model will predict future prices best.</p></section>
`})
export class BestAnalysisComponent {
  api = inject(StockApiService);
  error = signal(false);

  loading = signal<boolean>(false);
  response = signal<BestModelResponse | null>(null);

  rankedModels = computed(() => [...(this.response()?.models ?? [])].sort((a,b) => b.score-a.score));

  constructor() {
    effect(() => {
      const ticker = this.api.selectedTicker();
      if (ticker) {
        this.fetchBestModel(ticker);
      }
    });
  }

  async fetchBestModel(ticker: string) {
    this.loading.set(true);
    this.error.set(false);
    try {
      const res = await this.api.getBestModel(ticker);
      this.response.set(res);
    } catch (e) {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
