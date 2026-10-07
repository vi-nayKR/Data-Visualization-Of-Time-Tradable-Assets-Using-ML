import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { StockApiService } from '../core/services/stock-api.service';
import { UiSelect } from './ui';
@Component({ selector: 'ui-ticker-picker', changeDetection: ChangeDetectionStrategy.OnPush, imports: [UiSelect],
  template: `<label class="field ticker-field">Search asset<input uiSelect list="asset-options" aria-label="Search asset by ticker or company" [value]="api.selectedTicker()" (change)="select($event)" autocomplete="off" /><datalist id="asset-options">@for (company of api.companies(); track company.ticker) { <option [value]="company.ticker">{{ company.name }}</option> }</datalist></label>` })
export class TickerPicker {
  api = inject(StockApiService);
  select(event: Event) {
    const input = event.target as HTMLInputElement;
    const company = this.api.companies().find(c => c.ticker.toLowerCase() === input.value.trim().toLowerCase() || c.name.toLowerCase() === input.value.trim().toLowerCase());
    if (company) this.api.selectCompany(company.ticker, company.name);
    input.value = this.api.selectedTicker();
  }
}
