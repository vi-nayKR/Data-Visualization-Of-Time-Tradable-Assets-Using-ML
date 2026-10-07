import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockApiService } from '../../core/services/stock-api.service';
import { BestModelResponse, OHLCVRecord } from '../../core/models/stock.model';
import { PredictionChartComponent } from '../prediction/prediction-chart.component';
import { MetricsTableComponent } from '../../shared/metrics-table.component';
@Component({selector:'app-best-analysis',standalone:true,imports:[CommonModule,PredictionChartComponent,MetricsTableComponent],template:`
<section class="h-full overflow-y-auto p-4 text-[var(--color-frost)] bg-[var(--color-void)]"><div role="status">{{api.sourceLabel('best')}} · Not financial advice</div><h1 class="text-lg font-bold my-3">{{api.selectedTicker()}} · Validation leaderboard</h1>
<div class="flex gap-3 mb-3" role="group" aria-label="Forecast horizon"><button [attr.aria-pressed]="api.horizon()===1" (click)="api.horizon.set(1)">1 trading day</button><button [attr.aria-pressed]="api.horizon()===5" (click)="api.horizon.set(5)">5 trading days</button></div>
@if(loading()){<p role="status">Loading cached evaluation...</p>}@if(error()){<p>Evaluation unavailable. <button (click)="load(api.selectedTicker(),api.horizon())">Retry</button></p>}
@if(response();as result){<p class="my-3">{{result.message}}</p><p class="text-xs">Data as of {{result.as_of}} · trained {{result.trained_at | date:'short'}}</p>
@if(api.sources()['best']==='snapshot'){<p class="py-2">Saved snapshot · 5-trading-day forecasts only.</p>}
<div class="overflow-x-auto my-4"><table class="w-full text-xs text-left"><caption class="text-left py-2">Lowest validation MAE wins; held-out metrics are for reporting only.</caption><thead><tr><th class="p-2">Model / baseline</th><th>Validation MAE</th><th>Hold-out return MAE</th><th>Skill vs naive</th></tr></thead><tbody>@for(m of result.leaderboard;track m.name){<tr [class]="m.name===result.winner ? 'text-[var(--color-accent)]' : ''"><th class="p-2">{{m.name}} {{m.name===result.winner?'- best validation fit':''}}</th><td>{{m.validation_mae | number:'1.4-4'}}</td><td>{{m.metrics.mae_return | number:'1.4-4'}}</td><td>{{m.metrics.skill_vs_naive | percent:'1.2-2'}}</td></tr>}</tbody></table></div>
@if(winner();as model){<h2>{{model.name}} · forecast {{model.forecast.price | currency:result.currency}}</h2><div class="h-[420px] my-3"><app-prediction-chart [records]="records()" [forecast]="model.forecast" [naive]="naive()!.forecast" [modelName]="model.name" /></div><app-metrics-table [metrics]="model.metrics" [currency]="result.currency" />}
}
</section>`})
export class BestAnalysisComponent {
 api=inject(StockApiService);response=signal<BestModelResponse|null>(null);records=signal<OHLCVRecord[]>([]);loading=signal(false);error=signal(false);
 winner=computed(()=>this.response()?.models.find(m=>m.name===this.response()?.winner));naive=computed(()=>this.response()?.models.find(m=>m.name==='naive'));
 constructor(){effect(()=>{const ticker=this.api.selectedTicker(),horizon=this.api.horizon();if(ticker)this.load(ticker,horizon);});}
 async load(ticker:string,horizon:1|5){this.loading.set(true);this.error.set(false);try{const [result,records]=await Promise.all([this.api.getBestModel(ticker,horizon),this.api.getOHLCV(ticker)]);this.response.set(result);this.records.set(records);}catch{this.error.set(true);}finally{this.loading.set(false);}}
}
