import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModelMetrics } from '../core/models/stock.model';
@Component({selector:'app-metrics-table',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[CommonModule],template:`
<div class="table-wrap" role="region" aria-label="Held-out model metrics" tabindex="0"><table ><caption >Held-out evaluation · {{metrics().observations}} trading observations</caption><tbody>
<tr><th scope="row">Return MAE / RMSE</th><td>{{metrics().mae_return | number:'1.4-4'}} / {{metrics().rmse_return | number:'1.4-4'}}</td></tr>
<tr><th scope="row">Price MAE</th><td>{{metrics().mae_price | currency:currency()}}</td></tr>
<tr><th scope="row">Price MAPE</th><td>{{metrics().mape_price | percent:'1.2-2'}}</td></tr>
<tr><th scope="row">Directional accuracy · 95% CI</th><td>{{metrics().directional_accuracy | percent:'1.1-1'}} ({{metrics().directional_accuracy_ci[0] | percent:'1.1-1'}}–{{metrics().directional_accuracy_ci[1] | percent:'1.1-1'}})</td></tr>
<tr><th scope="row">Skill vs naive</th><td>{{metrics().skill_vs_naive === null ? 'N/A' : (metrics().skill_vs_naive | percent:'1.2-2')}}</td></tr>
</tbody></table></div>`})
export class MetricsTableComponent {metrics=input.required<ModelMetrics>();currency=input('USD');}
