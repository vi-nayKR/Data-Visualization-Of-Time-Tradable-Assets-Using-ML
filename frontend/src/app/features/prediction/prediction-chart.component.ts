import { Component, ElementRef, ViewChild, input, effect, inject, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { OHLCVRecord, Forecast } from '../../core/models/stock.model';
import { StockApiService } from '../../core/services/stock-api.service';
declare const Plotly:any;
@Component({selector:'app-prediction-chart',standalone:true,template:`<div #chartContainer class="w-full h-full" role="img" [attr.aria-label]="modelName()+' forecast, validation residual band, and price-stays-the-same baseline'" ></div>`})
export class PredictionChartComponent implements AfterViewInit,OnDestroy {
 api=inject(StockApiService);records=input.required<OHLCVRecord[]>();forecast=input.required<Forecast>();naive=input.required<Forecast>();modelName=input('Model');
 @ViewChild('chartContainer',{static:true}) chartContainer!:ElementRef;
 ready=signal(false);private observer?:ResizeObserver;private rendered=false;
 constructor(){effect(()=>{const records=this.records(),forecast=this.forecast(),naive=this.naive(),name=this.modelName(),currency=this.api.currencySymbol(),dark=this.api.isDarkMode();if(this.ready()&&records.length)this.draw(records,forecast,naive,name,currency,dark);});}
 ngAfterViewInit(){this.ready.set(true);this.observer=new ResizeObserver(()=>{if(this.rendered)Plotly.Plots.resize(this.chartContainer.nativeElement);});this.observer.observe(this.chartContainer.nativeElement);}
 ngOnDestroy(){this.observer?.disconnect();if(this.rendered)Plotly.purge(this.chartContainer.nativeElement);}
 private draw(records:OHLCVRecord[],forecast:Forecast,naive:Forecast,name:string,currency:string,dark:boolean){
 const history=records.slice(-60),x=history.map((_,i)=>i),last=x.length-1,end=last+forecast.horizon,origin=forecast.origin_price;
 const accent=dark?'#ff6b00':'#ea580c',green='#089981',bg=dark?'#060608':'#ffffff',muted=dark?'#8e93a0':'#6b7280';
 const traces=[
 {x,y:history.map(r=>r.close),type:'scatter',mode:'lines',name:'Historical close',line:{color:accent,width:2}},
 {x:[last,end],y:[origin,forecast.lower],type:'scatter',mode:'lines',line:{width:0},showlegend:false,hoverinfo:'skip'},
 {x:[last,end],y:[origin,forecast.upper],type:'scatter',mode:'lines',line:{width:0},fill:'tonexty',fillcolor:'rgba(8,153,129,0.18)',name:'Validation residual band (10-90%)'},
 {x:[last,end],y:[origin,forecast.price],type:'scatter',mode:'lines+markers',name:name+' forecast',line:{color:green,width:2,dash:'dot'}},
 {x:[last,end],y:[origin,naive.price],type:'scatter',mode:'lines',name:'Naive: price stays the same',line:{color:muted,width:2,dash:'dash'}}];
 const ticks=[0,Math.floor(last/2),last,end];
 this.rendered=false;
 Plotly.react(this.chartContainer.nativeElement,traces,{paper_bgcolor:bg,plot_bgcolor:bg,autosize:true,font:{color:muted,family:'JetBrains Mono, monospace',size:10},margin:{l:10,r:70,t:60,b:45},legend:{orientation:'h',y:1.15},hovermode:'x unified',xaxis:{tickvals:ticks,ticktext:[history[0].date,history[Math.floor(last/2)].date,history[last].date,'+'+forecast.horizon+' trading days'],gridcolor:dark?'#12121a':'#e5e7eb'},yaxis:{side:'right',tickprefix:currency,gridcolor:dark?'#12121a':'#e5e7eb'}},{responsive:true,scrollZoom:true,displayModeBar:false}).then(()=>this.rendered=true);
 }
}
