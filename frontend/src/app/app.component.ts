import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StockApiService } from './core/services/stock-api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="flex min-h-screen bg-slate-900 text-slate-100">
      <!-- Sidebar -->
      <aside class="w-64 fixed inset-y-0 left-0 bg-gradient-to-b from-slate-900 via-indigo-950 to-purple-950 border-r border-indigo-600/30 p-5 flex flex-col z-20">
        <div class="text-center mb-8">
          <span class="text-3xl">📈</span>
          <h1 class="text-lg font-extrabold uppercase tracking-wider bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent mt-2">
            Stock Dashboard
          </h1>
          <p class="text-xs text-slate-400">ML Time-Series Analytics</p>
        </div>

        <nav class="space-y-2 flex-1">
          @for (link of navLinks; track link.path) {
            <a [routerLink]="link.path"
               [routerLinkActiveOptions]="{exact: link.exact}"
               routerLinkActive="bg-purple-900/40 border-purple-500 text-sky-300 shadow-lg shadow-purple-500/10"
               class="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-700/50 bg-slate-800/40 text-slate-300 font-medium transition-all hover:bg-slate-700/50 hover:border-indigo-400">
              <span class="text-lg">{{ link.icon }}</span>
              <span>{{ link.label }}</span>
            </a>
          }
        </nav>

        <!-- Company Dropdown Selector -->
        <div class="pt-4 border-t border-slate-700/50">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Select Company
          </label>
          <select [value]="api.selectedTicker()"
                  (change)="onCompanyChange($event)"
                  class="w-full bg-slate-800 border border-indigo-500/50 rounded-xl px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-purple-500">
            @for (comp of api.companies(); track comp.ticker) {
              <option [value]="comp.ticker">{{ comp.name }} ({{ comp.ticker }})</option>
            }
          </select>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="ml-64 flex-1 p-8 min-h-screen">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AppComponent implements OnInit {
  api = inject(StockApiService);

  navLinks = [
    { path: '/',              label: 'Home',          icon: '🏠', exact: true },
    { path: '/analysis',      label: 'Data Analysis', icon: '📊', exact: false },
    { path: '/prediction',    label: 'Prediction',    icon: '🔮', exact: false },
    { path: '/best-analysis', label: 'Best Analysis', icon: '🏆', exact: false },
  ];

  ngOnInit() {
    this.api.loadCompanies();
  }

  onCompanyChange(event: Event) {
    const ticker = (event.target as HTMLSelectElement).value;
    const comp = this.api.companies().find(c => c.ticker === ticker);
    this.api.selectedTicker.set(ticker);
    if (comp) {
      this.api.selectedCompanyName.set(comp.name);
    }
  }
}
