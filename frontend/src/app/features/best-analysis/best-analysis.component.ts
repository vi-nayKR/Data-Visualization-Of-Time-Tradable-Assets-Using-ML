import { ChangeDetectionStrategy, Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockApiService } from '../../core/services/stock-api.service';
import { BestModelResponse, OHLCVRecord } from '../../core/models/stock.model';
import { PredictionChartComponent } from '../prediction/prediction-chart.component';
import { MetricsTableComponent } from '../../shared/metrics-table.component';
import { UI } from '../../shared/ui';
@Component({selector:'app-best-analysis',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[CommonModule,PredictionChartComponent,MetricsTableComponent,...UI],template:`
<ui-page-header label="// MODEL RESULTS" [title]="api.selectedTicker()+' model comparison'" description="Validation error chooses the winner. Held-out metrics show how it compares with a price-stays-the-same baseline." [source]="api.sourceLabel('best')" />
<div uiCard class="toolbar"><p class="data-date">Five ML models. Three transparent baselines.</p><div uiSegmented aria-label="Forecast horizon"><button [attr.aria-pressed]="api.horizon()===1" (click)="api.horizon.set(1)">1 trading day</button><button [attr.aria-pressed]="api.horizon()===5" (click)="api.horizon.set(5)">5 trading days</button></div></div>
@if(loading()){<section uiCard class="chart-frame"><ui-skeleton /></section>}@else if(error()){<section uiCard class="empty-state" role="status"><h2>Evaluation unavailable</h2><button uiButton (click)="load(api.selectedTicker(),api.horizon())">Retry</button></section>}@else if(response();as result){
<p class="snapshot-banner">{{result.message}} The validation winner {{result.winner_beats_naive ? 'beats' : 'does not beat'}} naive on held-out data.</p>
@if(api.sources()['best']==='snapshot'){<p class="snapshot-banner">Saved snapshot: 5-trading-day forecasts only.</p>}
<div class="rank-grid">@for(m of result.leaderboard;track m.name;let rank=$index){<article uiCard class="rank-card" [class.winner]="m.name===result.winner"><span class="rank">#{{rank+1}} {{m.name===result.winner?' / BEST VALIDATION FIT':''}}</span><h3 class="model-name">{{m.name}}</h3><p class="metric-value">{{m.validation_mae | number:'1.4-4'}}</p><p class="metric-note">Validation return MAE</p><p class="metric-note">Hold-out skill {{m.metrics.skill_vs_naive === null ? 'N/A' : (m.metrics.skill_vs_naive | percent:'1.2-2')}}</p></article>}</div>
<section uiCard><div class="table-wrap" role="region" aria-label="Model leaderboard" tabindex="0"><table><caption>Lowest validation MAE wins; held-out metrics are for reporting only.</caption><thead><tr><th scope="col">Model / baseline</th><th scope="col">Validation MAE</th><th scope="col">Hold-out return MAE</th><th scope="col">Skill vs naive</th></tr></thead><tbody>@for(m of result.leaderboard;track m.name){<tr [class.winner-row]="m.name===result.winner"><th scope="row">{{m.name}} {{m.name===result.winner?'- best validation fit':''}}</th><td>{{m.validation_mae | number:'1.4-4'}}</td><td>{{m.metrics.mae_return | number:'1.4-4'}}</td><td>{{m.metrics.skill_vs_naive === null ? 'N/A' : (m.metrics.skill_vs_naive | percent:'1.2-2')}}</td></tr>}</tbody></table></div></section>
@if(winner();as model){<section uiCard class="metrics-panel"><div class="panel-heading"><div><p class="eyebrow">// VALIDATION WINNER</p><h2>{{model.name}} forecast &middot; {{model.forecast.price | currency:result.currency}}</h2></div><p class="data-date">Data as of {{result.as_of}} &middot; trained {{result.trained_at | date:'short'}}</p></div><div class="chart-frame"><app-prediction-chart [records]="records()" [forecast]="model.forecast" [naive]="naive()!.forecast" [modelName]="model.name" /></div><app-metrics-table [metrics]="model.metrics" [currency]="result.currency" /></section>}
}@else{<section uiCard class="empty-state"><h2>No evaluation available</h2><button uiButton (click)="load(api.selectedTicker(),api.horizon())">Retry</button></section>}
`})
export class BestAnalysisComponent {
 api=inject(StockApiService);response=signal<BestModelResponse|null>(null);records=signal<OHLCVRecord[]>([]);loading=signal(false);error=signal(false);
 winner=computed(()=>this.response()?.models.find(m=>m.name===this.response()?.winner));naive=computed(()=>this.response()?.models.find(m=>m.name==='naive'));
 constructor(){effect(()=>{const ticker=this.api.selectedTicker(),horizon=this.api.horizon();if(ticker)this.load(ticker,horizon);});}
 async load(ticker:string,horizon:1|5){this.loading.set(true);this.error.set(false);try{const [result,records]=await Promise.all([this.api.getBestModel(ticker,horizon),this.api.getOHLCV(ticker)]);this.response.set(result);this.records.set(records);}catch{this.error.set(true);}finally{this.loading.set(false);}}
}
