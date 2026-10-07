import { ChangeDetectionStrategy, Component, Directive, effect, input, signal } from '@angular/core';
@Directive({ selector: '[uiButton]', host: { class: 'ui-button' } })
export class UiButton {}
@Directive({ selector: '[uiCard]', host: { class: 'ui-card' } })
export class UiCard {}
@Directive({ selector: '[uiBadge]', host: { class: 'ui-badge' } })
export class UiBadge {}
@Directive({ selector: '[uiSegmented]', host: { class: 'ui-segmented', role: 'group' } })
export class UiSegmented {}
@Directive({ selector: 'select[uiSelect], input[uiSelect]', host: { class: 'ui-select' } })
export class UiSelect {}
@Component({ selector: 'ui-skeleton', changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'skeleton', role: 'status', 'aria-label': 'Loading chart' },
  template: `<span class="sr-only">Loading chart…</span><div class="skeleton-lines" aria-hidden="true"></div>` })
export class UiSkeleton {}
@Component({ selector: 'ui-page-header', changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<header class="page-header"><div><p class="eyebrow">{{ label() }}</p><h1>{{ title() }}</h1><p class="page-description">{{ description() }}</p></div><div class="page-status"><span class="ui-badge" role="status">{{ source() }}</span><small>Not financial advice</small></div></header>
    @if (source().startsWith('Snapshot')) { <div class="snapshot-banner">Viewing a saved research snapshot. Live data will resume when the API is available.</div> }` })
export class UiPageHeader {
  label = input('// RESEARCH TERMINAL'); title = input.required<string>();
  description = input.required<string>(); source = input('Live');
}
@Component({selector:'ui-count-up',changeDetection:ChangeDetectionStrategy.OnPush,
  template:`<span class="sr-only">{{format(value())}}</span><span aria-hidden="true">{{format(displayed())}}</span>`})
export class UiCountUp {
  value=input.required<number>(); currency=input(''); displayed=signal(0);
  constructor(){effect(cleanup=>{
    const target=this.value();
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){this.displayed.set(target);return;}
    const start=performance.now();let frame=0;
    const tick=(now:number)=>{const progress=Math.min((now-start)/220,1);this.displayed.set(target*(1-Math.pow(1-progress,3)));if(progress<1)frame=requestAnimationFrame(tick);};
    frame=requestAnimationFrame(tick);cleanup(()=>cancelAnimationFrame(frame));
  });}
  format(value:number){return new Intl.NumberFormat('en',{style:this.currency()?'currency':'decimal',currency:this.currency()||undefined,minimumFractionDigits:2,maximumFractionDigits:2}).format(value);}
}
export const UI = [UiButton, UiCard, UiBadge, UiSegmented, UiSelect, UiSkeleton, UiPageHeader, UiCountUp];
