import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UI } from '../../shared/ui';
@Component({selector:'app-model-card',changeDetection:ChangeDetectionStrategy.OnPush,imports:[...UI],template:`
<article uiCard class="rank-card" [class.winner]="isWinner()"><p class="rank">{{isWinner() ? 'BEST FIT' : 'RANK ' + rank()}}</p><h3>{{name()}}</h3><p class="metric-value">{{score() <= -900 ? 'N/A' : (score()*100).toFixed(2)+'%'}}</p><p class="metric-note">R? fit score</p><div class="score-meter" aria-hidden="true"><span [style.transform]="'scaleX('+Math.max(0,Math.min(1,score()))+')'"></span></div></article>`})
export class ModelCardComponent { name=input.required<string>();score=input.required<number>();rank=input(1);isWinner=input(false);Math=Math; }
