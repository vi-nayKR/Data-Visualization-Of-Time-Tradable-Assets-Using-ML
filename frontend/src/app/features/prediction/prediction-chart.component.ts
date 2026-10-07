import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, input, effect, inject, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { OHLCVRecord, Forecast } from '../../core/models/stock.model';
import { StockApiService } from '../../core/services/stock-api.service';
import { UiSkeleton, UiButton } from '../../shared/ui';
import { loadPlotly, chartPalette, chartLayout } from '../../shared/aurora-chart';
@Component({selector:'app-prediction-chart',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[UiSkeleton,UiButton],template:`@if(loadFailed()){<div class="empty-state"><p>Chart could not load.</p><button uiButton (click)="ngAfterViewInit()">Retry chart</button></div>}@else if(!rendered()){<ui-skeleton />}<div #chartContainer class="chart-canvas" role="img" [attr.aria-label]="modelName()+' forecast, validation residual band, and price-stays-the-same baseline'" ></div>`})
export class PredictionChartComponent implements AfterViewInit,OnDestroy {
 api=inject(StockApiService);records=input.required<OHLCVRecord[]>();forecast=input.required<Forecast>();naive=input.required<Forecast>();modelName=input('Model');
 @ViewChild('chartContainer',{static:true}) chartContainer!:ElementRef;
 ready=signal(false);private observer?:ResizeObserver;rendered=signal(false);loadFailed=signal(false);private Plotly:any;private destroyed=false;
 constructor(){effect(()=>{const records=this.records(),forecast=this.forecast(),naive=this.naive(),name=this.modelName(),currency=this.api.currencySymbol(),dark=this.api.isDarkMode();if(this.ready()&&records.length)this.draw(records,forecast,naive,name,currency,dark);});}
 async ngAfterViewInit(){this.loadFailed.set(false);try{this.Plotly=await loadPlotly();}catch{this.loadFailed.set(true);return;}if(this.destroyed)return;this.ready.set(true);this.observer=new ResizeObserver(()=>{if(this.rendered())this.Plotly.Plots.resize(this.chartContainer.nativeElement);});this.observer.observe(this.chartContainer.nativeElement);}
 ngOnDestroy(){this.destroyed=true;this.observer?.disconnect();if(this.rendered())this.Plotly.purge(this.chartContainer.nativeElement);}
 private draw(records:OHLCVRecord[],forecast:Forecast,naive:Forecast,name:string,currency:string,dark:boolean){
 const history=records.slice(-60),x=history.map((_,i)=>i),last=x.length-1,end=last+forecast.horizon,origin=forecast.origin_price;
 const palette=chartPalette(),base=chartLayout();const accent=palette.accent,green=palette.indigo,muted=palette.muted;
 const traces=[
 {x,y:history.map(r=>r.close),type:'scatter',mode:'lines',name:'Historical close',line:{color:accent,width:2}},
 {x:[last,end],y:[origin,forecast.lower],type:'scatter',mode:'lines',line:{width:0},showlegend:false,hoverinfo:'skip'},
 {x:[last,end],y:[origin,forecast.upper],type:'scatter',mode:'lines',line:{width:0},fill:'tonexty',fillcolor:palette.fill,name:'Validation residual band (10-90%)'},
 {x:[last,end],y:[origin,forecast.price],type:'scatter',mode:'lines+markers',name:name+' forecast',line:{color:green,width:2,dash:'dot'}},
 {x:[last,end],y:[origin,naive.price],type:'scatter',mode:'lines',name:'Naive: price stays the same',line:{color:muted,width:2,dash:'dash'}}];
 const mobile=innerWidth<768;const ticks=mobile?[0,Math.floor(last/2),end]:[0,Math.floor(last/2),last,end];const labels=mobile?[history[0].date,history[Math.floor(last/2)].date,'+'+forecast.horizon+' trading days']:[history[0].date,history[Math.floor(last/2)].date,history[last].date,'+'+forecast.horizon+' trading days'];
 this.rendered.set(false);
 this.Plotly.react(this.chartContainer.nativeElement,traces,{...base,margin:{l:10,r:70,t:60,b:45},legend:{orientation:'h',y:1.15},hovermode:'x unified',xaxis:{...base.xaxis,tickvals:ticks,ticktext:labels,tickangle:0,automargin:true,gridcolor:palette.grid},yaxis:{...base.yaxis,side:'right',tickprefix:currency,gridcolor:palette.grid}},{responsive:true,scrollZoom:true,displayModeBar:false}).then(()=>{if(!this.destroyed)this.rendered.set(true);});
 }
}
