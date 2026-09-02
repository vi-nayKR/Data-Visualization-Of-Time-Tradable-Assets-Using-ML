import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockApiService } from './core/services/stock-api.service';
import { Timeframe, ChartType } from './core/models/stock.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-screen w-screen bg-[#131722] text-[#d1d4dc] overflow-hidden font-sans select-none">
      
      <!-- TOP TRADINGVIEW HEADER BAR -->
      <header class="h-12 bg-[#131722] border-b border-[#2a2e39] flex items-center justify-between px-3 z-30 flex-shrink-0 text-xs">
        
        <!-- Left Section: Symbol Search & Live Stats -->
        <div class="flex items-center gap-3">
          <!-- Logo -->
          <div class="flex items-center gap-2 pr-2 border-r border-[#2a2e39]">
            <span class="text-xl">📈</span>
            <span class="font-bold text-sm tracking-wider text-white">TRADEX<span class="text-[#2962ff]">.ML</span></span>
          </div>

          <!-- Symbol Search Button / Selector -->
          <div class="relative">
            <button (click)="toggleSymbolSearch()"
                    class="flex items-center gap-2 bg-[#1e222d] hover:bg-[#2a2e39] border border-[#363a45] rounded px-2.5 py-1 text-white font-semibold transition-all">
              <span class="text-xs text-[#787b86]">🔍</span>
              <span class="text-sm font-bold text-[#f0f3fa]">{{ api.selectedTicker() }}</span>
              <span class="text-[11px] text-[#787b86] max-w-[120px] truncate hidden sm:inline">{{ api.selectedCompanyName() }}</span>
              <span class="text-[10px] text-[#787b86]">▾</span>
            </button>

            <!-- Search Modal Dropdown -->
            @if (showSymbolSearch()) {
              <div class="absolute left-0 top-10 w-80 bg-[#1e222d] border border-[#363a45] rounded-lg shadow-2xl z-50 p-2 space-y-2">
                <input type="text"
                       [ngModel]="api.searchQuery()"
                       (ngModelChange)="api.searchQuery.set($event)"
                       placeholder="Search 500+ stocks (e.g. AAPL, TSLA)..."
                       autofocus
                       class="w-full bg-[#131722] border border-[#363a45] rounded px-3 py-1.5 text-xs text-white placeholder-[#787b86] focus:outline-none focus:border-[#2962ff]">
                
                <div class="max-h-60 overflow-y-auto divide-y divide-[#2a2e39]">
                  @for (c of api.filteredCompanies(); track c.ticker) {
                    <div (click)="onSelectCompany(c.ticker, c.name)"
                         class="flex items-center justify-between p-2 hover:bg-[#2a2e39] rounded cursor-pointer transition-colors">
                      <div>
                        <span class="font-bold text-white text-xs">{{ c.ticker }}</span>
                        <span class="text-[11px] text-[#787b86] ml-2">{{ c.name }}</span>
                      </div>
                      <span class="text-[10px] text-[#2962ff] bg-[#2962ff]/10 px-1.5 py-0.5 rounded font-mono">EQUITY</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Live Price & Change Badge -->
          @if (api.latestRecord(); as latest) {
            <div class="hidden md:flex items-center gap-2 pl-2 border-l border-[#2a2e39]">
              <span class="text-sm font-extrabold font-mono text-[#f0f3fa]">\${{ latest.close }}</span>
              
              <div [class]="api.priceChange().isPositive ? 'text-[#089981] bg-[#089981]/10' : 'text-[#f23645] bg-[#f23645]/10'"
                   class="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1">
                <span>{{ api.priceChange().isPositive ? '▲' : '▼' }}</span>
                <span>{{ api.priceChange().isPositive ? '+' : '' }}{{ api.priceChange().diff }}</span>
                <span>({{ api.priceChange().isPositive ? '+' : '' }}{{ api.priceChange().percent }}%)</span>
              </div>
            </div>

            <!-- OHLC Ticker Ribbon -->
            <div class="hidden lg:flex items-center gap-3 text-[11px] text-[#787b86] font-mono">
              <span>O <strong class="text-[#d1d4dc]">\${{ latest.open }}</strong></span>
              <span>H <strong class="text-[#089981]">\${{ latest.high }}</strong></span>
              <span>L <strong class="text-[#f23645]">\${{ latest.low }}</strong></span>
              <span>C <strong class="text-[#d1d4dc]">\${{ latest.close }}</strong></span>
              <span>Vol <strong class="text-[#d1d4dc]">{{ latest.volume }}M</strong></span>
            </div>
          }
        </div>

        <!-- Center Section: Timeframes & Chart Type -->
        <div class="hidden md:flex items-center gap-1 border-x border-[#2a2e39] px-2">
          @for (tf of timeframes; track tf) {
            <button (click)="api.timeframe.set(tf)"
                    [class]="api.timeframe() === tf ? 'bg-[#2a2e39] text-[#2962ff] font-bold' : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#1e222d]'"
                    class="px-2 py-1 rounded text-xs transition-colors">
              {{ tf }}
            </button>
          }

          <span class="w-[1px] h-4 bg-[#2a2e39] mx-1"></span>

          <!-- Chart Types -->
          <div class="flex items-center gap-1">
            <button (click)="api.chartType.set('candlestick')"
                    [class]="api.chartType() === 'candlestick' ? 'bg-[#2a2e39] text-[#2962ff]' : 'text-[#787b86] hover:text-white'"
                    title="Candles" class="p-1 rounded text-sm">🕯️</button>
            <button (click)="api.chartType.set('line')"
                    [class]="api.chartType() === 'line' ? 'bg-[#2a2e39] text-[#2962ff]' : 'text-[#787b86] hover:text-white'"
                    title="Line Chart" class="p-1 rounded text-sm">📈</button>
            <button (click)="api.chartType.set('bar')"
                    [class]="api.chartType() === 'bar' ? 'bg-[#2a2e39] text-[#2962ff]' : 'text-[#787b86] hover:text-white'"
                    title="Volume Bars" class="p-1 rounded text-sm">📊</button>
          </div>
        </div>

        <!-- Right Section: Navigation Tabs & Watchlist Toggle -->
        <div class="flex items-center gap-2">
          <nav class="flex items-center gap-1">
            @for (tab of navTabs; track tab.path) {
              <a [routerLink]="tab.path"
                 [routerLinkActiveOptions]="{exact: tab.exact}"
                 routerLinkActive="!bg-[#2962ff] !text-white"
                 class="px-2.5 py-1 rounded text-xs font-semibold text-[#787b86] hover:text-white hover:bg-[#1e222d] transition-all">
                {{ tab.label }}
              </a>
            }
          </nav>

          <span class="w-[1px] h-4 bg-[#2a2e39] mx-1"></span>

          <!-- Watchlist Drawer Toggle Button -->
          <button (click)="showWatchlist.set(!showWatchlist())"
                  [class]="showWatchlist() ? 'bg-[#2962ff] text-white' : 'bg-[#1e222d] text-[#787b86] hover:text-white'"
                  class="flex items-center gap-1 px-2.5 py-1 rounded border border-[#363a45] transition-all"
                  title="Toggle Watchlist Drawer">
            <span>📋</span>
            <span class="hidden sm:inline font-medium">Watchlist</span>
          </button>
        </div>
      </header>

      <!-- MAIN WORKSPACE: LEFT TOOLBAR + CENTER CONTENT + RIGHT WATCHLIST -->
      <div class="flex flex-1 w-full overflow-hidden relative">

        <!-- TRADINGVIEW LEFT DRAWING TOOLBAR (Slim Dock) -->
        <aside class="w-11 bg-[#131722] border-r border-[#2a2e39] flex flex-col items-center py-2 gap-3 z-20 flex-shrink-0 text-xs">
          <button class="p-1.5 text-[#787b86] hover:text-white hover:bg-[#2a2e39] rounded transition-all" title="Crosshair">┼</button>
          <button class="p-1.5 text-[#787b86] hover:text-white hover:bg-[#2a2e39] rounded transition-all" title="Trend Line">╱</button>
          <button class="p-1.5 text-[#787b86] hover:text-white hover:bg-[#2a2e39] rounded transition-all" title="Fibonacci Retracement">⧎</button>
          <button class="p-1.5 text-[#787b86] hover:text-white hover:bg-[#2a2e39] rounded transition-all" title="Brush / Highlighter">🖌</button>
          <button class="p-1.5 text-[#787b86] hover:text-white hover:bg-[#2a2e39] rounded transition-all" title="Text / Annotations">𝘛</button>
          <button class="p-1.5 text-[#2962ff] bg-[#2962ff]/10 rounded p-1.5 transition-all" title="ML Prediction Target">🎯</button>
          <button class="p-1.5 text-[#787b86] hover:text-white hover:bg-[#2a2e39] rounded transition-all" title="Measure Distance">📏</button>
          <button class="p-1.5 text-[#787b86] hover:text-white hover:bg-[#2a2e39] rounded transition-all" title="Magnet Mode">𝧲</button>
          
          <div class="mt-auto flex flex-col gap-2">
            <button class="p-1.5 text-[#787b86] hover:text-white hover:bg-[#2a2e39] rounded transition-all" title="Zoom In">🔍</button>
            <button class="p-1.5 text-[#787b86] hover:text-[#f23645] hover:bg-[#2a2e39] rounded transition-all" title="Clear All">🗑</button>
          </div>
        </aside>

        <!-- CENTER VIEWPORT (Dynamic Angular Outlet) -->
        <main class="flex-1 bg-[#131722] overflow-y-auto relative">
          <router-outlet></router-outlet>
        </main>

        <!-- TRADINGVIEW RIGHT WATCHLIST & DETAIL PANEL (Collapsible Drawer) -->
        @if (showWatchlist()) {
          <aside class="w-72 bg-[#181b24] border-l border-[#2a2e39] flex flex-col z-20 flex-shrink-0 animate-in slide-in-from-right duration-200">
            
            <!-- Watchlist Header -->
            <div class="p-3 border-b border-[#2a2e39] flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-white">Watchlist</span>
                <span class="text-[10px] bg-[#2a2e39] text-[#787b86] px-1.5 py-0.5 rounded-full font-mono">
                  {{ api.companies().length }}
                </span>
              </div>
              <button (click)="showWatchlist.set(false)" class="text-[#787b86] hover:text-white text-sm">✕</button>
            </div>

            <!-- Quick Filter Input -->
            <div class="p-2 border-b border-[#2a2e39]">
              <input type="text"
                     [ngModel]="api.searchQuery()"
                     (ngModelChange)="api.searchQuery.set($event)"
                     placeholder="Filter ticker..."
                     class="w-full bg-[#131722] border border-[#2a2e39] rounded px-2.5 py-1 text-xs text-white placeholder-[#787b86] focus:outline-none focus:border-[#2962ff]">
            </div>

            <!-- Watchlist Items List -->
            <div class="flex-1 overflow-y-auto divide-y divide-[#2a2e39]/50">
              @for (c of api.filteredCompanies(); track c.ticker) {
                <div (click)="onSelectCompany(c.ticker, c.name)"
                     [class]="api.selectedTicker() === c.ticker ? 'bg-[#2a2e39]/70 border-l-2 border-[#2962ff]' : 'hover:bg-[#1e222d]'"
                     class="px-3 py-2.5 flex items-center justify-between cursor-pointer transition-colors">
                  <div>
                    <div class="font-bold text-xs text-white">{{ c.ticker }}</div>
                    <div class="text-[10px] text-[#787b86] truncate max-w-[130px]">{{ c.name }}</div>
                  </div>
                  <div class="text-right font-mono">
                    <span class="text-xs font-bold text-[#d1d4dc]">$USD</span>
                    <div class="text-[10px] text-[#089981] font-semibold">+0.50%</div>
                  </div>
                </div>
              }
            </div>

            <!-- Bottom Detail Widget: Technical Summary -->
            <div class="p-3 border-t border-[#2a2e39] bg-[#131722]/80 space-y-2">
              <div class="text-xs font-bold text-[#787b86] uppercase tracking-wider">Technical Summary</div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-[#787b86]">Oscillators:</span>
                <span class="text-[#089981] font-bold font-mono">BUY (12)</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-[#787b86]">Moving Averages:</span>
                <span class="text-[#089981] font-bold font-mono">STRONG BUY (18)</span>
              </div>
              <div class="w-full bg-[#2a2e39] h-1.5 rounded-full overflow-hidden flex">
                <div class="bg-[#f23645] w-[15%]"></div>
                <div class="bg-[#787b86] w-[20%]"></div>
                <div class="bg-[#089981] w-[65%]"></div>
              </div>
            </div>
          </aside>
        }
      </div>

    </div>
  `
})
export class AppComponent implements OnInit {
  api = inject(StockApiService);

  showWatchlist = signal<boolean>(true);
  showSymbolSearch = signal<boolean>(false);

  timeframes: Timeframe[] = ['1D', '5D', '1M', '3M', '6M', '1Y', 'ALL'];

  navTabs = [
    { path: '/analysis',      label: 'SuperChart',     exact: false },
    { path: '/prediction',    label: 'ML Forecast',   exact: false },
    { path: '/best-analysis', label: 'Best Strategy',  exact: false },
    { path: '/',              label: 'Market Info',    exact: true },
  ];

  ngOnInit() {
    this.api.loadCompanies();
  }

  toggleSymbolSearch() {
    this.showSymbolSearch.set(!this.showSymbolSearch());
  }

  onSelectCompany(ticker: string, name: string) {
    this.api.selectCompany(ticker, name);
    this.showSymbolSearch.set(false);
  }
}
