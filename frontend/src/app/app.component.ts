import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockApiService, DrawingTool } from './core/services/stock-api.service';
import { Timeframe, ChartType } from './core/models/stock.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-screen w-screen bg-[#131722] text-[#f0f3fa] overflow-hidden font-sans select-none">
      
      <!-- TOP NAVIGATION BAR -->
      <header class="h-12 bg-[#131722] border-b border-[#2a2e39] flex items-center justify-between px-3 z-30 flex-shrink-0 text-xs gap-2">
        
        <!-- Left Section: Brand Logo & Symbol Search -->
        <div class="flex items-center gap-3">
          <!-- Logo -->
          <div class="flex items-center gap-2 pr-2 border-r border-[#2a2e39]">
            <svg class="w-5 h-5 text-[#2962ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
            <span class="font-bold text-sm tracking-wider text-white">TRADEX<span class="text-[#2962ff]">.ML</span></span>
          </div>

          <!-- Symbol Search Selector -->
          <div class="relative">
            <button (click)="toggleSymbolSearch()"
                    class="flex items-center gap-2 bg-[#1e222d] hover:bg-[#2a2e39] border border-[#363c4e] rounded px-3 py-1.5 text-white font-semibold transition-all">
              <svg class="tv-icon tv-icon-sm text-[#9db2c6]" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span class="text-sm font-bold text-white tracking-wide">{{ api.selectedTicker() }}</span>
              <span class="text-xs text-[#9db2c6] max-w-[140px] truncate hidden sm:inline">{{ api.selectedCompanyName() }}</span>
              <svg class="w-3 h-3 text-[#9db2c6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <!-- Search Dropdown Modal -->
            @if (showSymbolSearch()) {
              <div class="absolute left-0 top-11 w-80 sm:w-96 bg-[#1e222d] border border-[#363c4e] rounded-lg shadow-2xl z-50 p-2 space-y-2">
                <div class="relative">
                  <input type="text"
                         [ngModel]="api.searchQuery()"
                         (ngModelChange)="api.searchQuery.set($event)"
                         placeholder="Search stock symbol or name (e.g. AAPL, TSLA)..."
                         autofocus
                         class="w-full bg-[#131722] border border-[#363c4e] rounded px-3 py-2 text-xs text-white placeholder-[#787b86] focus:outline-none focus:border-[#2962ff]">
                </div>
                
                <div class="max-h-64 overflow-y-auto divide-y divide-[#2a2e39]">
                  @for (c of api.filteredCompanies(); track c.ticker) {
                    <div (click)="onSelectCompany(c.ticker, c.name)"
                         class="flex items-center justify-between p-2.5 hover:bg-[#2a2e39] rounded cursor-pointer transition-colors">
                      <div>
                        <span class="font-bold text-white text-xs">{{ c.ticker }}</span>
                        <span class="text-xs text-[#9db2c6] ml-2">{{ c.name }}</span>
                      </div>
                      <span class="text-[10px] text-[#2962ff] bg-[#2962ff]/15 px-2 py-0.5 rounded font-mono font-bold">STOCK</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Live Price & Change Badge -->
          @if (api.latestRecord(); as latest) {
            <div class="hidden md:flex items-center gap-2 pl-2 border-l border-[#2a2e39]">
              <span class="text-sm font-extrabold font-mono-num text-white">\${{ latest.close }}</span>
              
              <div [class]="api.priceChange().isPositive ? 'text-[#089981] bg-[#089981]/15 border border-[#089981]/30' : 'text-[#f23645] bg-[#f23645]/15 border border-[#f23645]/30'"
                   class="px-2 py-0.5 rounded text-[11px] font-mono-num font-bold flex items-center gap-1">
                <span>{{ api.priceChange().isPositive ? '▲' : '▼' }}</span>
                <span>{{ api.priceChange().isPositive ? '+' : '' }}{{ api.priceChange().diff }}</span>
                <span>({{ api.priceChange().isPositive ? '+' : '' }}{{ api.priceChange().percent }}%)</span>
              </div>
            </div>

            <!-- Header OHLC Ticker Ribbon -->
            <div class="hidden xl:flex items-center gap-3 text-xs text-[#9db2c6] font-mono-num">
              <span>O <strong class="text-white">\${{ latest.open }}</strong></span>
              <span>H <strong class="text-[#089981]">\${{ latest.high }}</strong></span>
              <span>L <strong class="text-[#f23645]">\${{ latest.low }}</strong></span>
              <span>C <strong class="text-white">\${{ latest.close }}</strong></span>
              <span>Vol <strong class="text-white">{{ latest.volume }}M</strong></span>
            </div>
          }
        </div>

        <!-- Center Section: Timeframes & Chart Type -->
        <div class="hidden lg:flex items-center gap-1 border-x border-[#2a2e39] px-2">
          @for (tf of timeframes; track tf) {
            <button (click)="onSelectTimeframe(tf)"
                    [class]="api.timeframe() === tf ? 'tv-timeframe-btn-active' : ''"
                    class="tv-timeframe-btn">
              {{ tf }}
            </button>
          }

          <span class="w-[1px] h-4 bg-[#2a2e39] mx-1"></span>

          <!-- Chart Types Buttons with SVG Icons -->
          <div class="flex items-center gap-1">
            <!-- Candlestick Icon -->
            <button (click)="api.chartType.set('candlestick')"
                    [class]="api.chartType() === 'candlestick' ? 'bg-[#2962ff] text-white shadow-md' : 'text-[#9db2c6] hover:text-white hover:bg-[#2a2e39]'"
                    title="Candles" class="p-1.5 rounded transition-all">
              <svg class="tv-icon tv-icon-sm" viewBox="0 0 24 24">
                <line x1="9" y1="2" x2="9" y2="22"></line>
                <rect x="6" y="6" width="6" height="11" rx="1" fill="currentColor"></rect>
                <line x1="17" y1="4" x2="17" y2="20"></line>
                <rect x="14" y="8" width="6" height="8" rx="1" fill="currentColor"></rect>
              </svg>
            </button>

            <!-- Line Chart Icon -->
            <button (click)="api.chartType.set('line')"
                    [class]="api.chartType() === 'line' ? 'bg-[#2962ff] text-white shadow-md' : 'text-[#9db2c6] hover:text-white hover:bg-[#2a2e39]'"
                    title="Line Chart" class="p-1.5 rounded transition-all">
              <svg class="tv-icon tv-icon-sm" viewBox="0 0 24 24">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </button>

            <!-- OHLC Bar Icon -->
            <button (click)="api.chartType.set('bar')"
                    [class]="api.chartType() === 'bar' ? 'bg-[#2962ff] text-white shadow-md' : 'text-[#9db2c6] hover:text-white hover:bg-[#2a2e39]'"
                    title="OHLC Bars" class="p-1.5 rounded transition-all">
              <svg class="tv-icon tv-icon-sm" viewBox="0 0 24 24">
                <line x1="12" y1="2" x2="12" y2="22"></line>
                <line x1="12" y1="8" x2="8" y2="8"></line>
                <line x1="12" y1="16" x2="16" y2="16"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Right Section: Navigation Tabs & Watchlist Toggle -->
        <div class="flex items-center gap-2">
          <nav class="flex items-center gap-1">
            @for (tab of navTabs; track tab.path) {
              <a [routerLink]="tab.path"
                 [routerLinkActiveOptions]="{exact: tab.exact}"
                 routerLinkActive="tv-nav-tab-active"
                 class="tv-nav-tab">
                {{ tab.label }}
              </a>
            }
          </nav>

          <span class="w-[1px] h-4 bg-[#2a2e39] mx-1"></span>

          <!-- Watchlist Drawer Toggle Button -->
          <button (click)="showWatchlist.set(!showWatchlist())"
                  [class]="showWatchlist() ? 'bg-[#2962ff] text-white' : 'bg-[#1e222d] text-[#9db2c6] hover:text-white border-[#363c4e]'"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold transition-all">
            <svg class="tv-icon tv-icon-sm" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
            <span class="hidden sm:inline">Watchlist</span>
          </button>
        </div>
      </header>

      <!-- MAIN WORKSPACE: LEFT TOOLBAR + CENTER CONTENT + RIGHT WATCHLIST -->
      <div class="flex flex-1 w-full overflow-hidden relative">

        <!-- FUNCTIONAL LEFT DRAWING TOOLBAR -->
        <aside class="w-11 bg-[#131722] border-r border-[#2a2e39] flex flex-col items-center py-3 gap-2.5 z-20 flex-shrink-0 text-xs">
          
          <!-- Crosshair Mode -->
          <button (click)="api.setTool('crosshair')"
                  [class]="api.activeDrawingTool() === 'crosshair' ? 'bg-[#2962ff] text-white shadow-lg' : 'text-[#9db2c6] hover:text-white hover:bg-[#2a2e39]'"
                  class="p-2 rounded-lg transition-all" title="Crosshair Mode">
            <svg class="tv-icon" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="2" x2="12" y2="22"></line>
              <line x1="2" y1="12" x2="22" y2="12"></line>
            </svg>
          </button>

          <!-- Interactive Trend Line Drawing Mode -->
          <button (click)="api.setTool('trendline')"
                  [class]="api.activeDrawingTool() === 'trendline' ? 'bg-[#2962ff] text-white shadow-lg' : 'text-[#9db2c6] hover:text-white hover:bg-[#2a2e39]'"
                  class="p-2 rounded-lg transition-all" title="Draw Trend Line">
            <svg class="tv-icon" viewBox="0 0 24 24">
              <line x1="4" y1="20" x2="20" y2="4"></line>
              <circle cx="4" cy="20" r="2" fill="currentColor"></circle>
              <circle cx="20" cy="4" r="2" fill="currentColor"></circle>
            </svg>
          </button>

          <!-- Fibonacci Retracement Auto-Plot -->
          <button (click)="api.setTool('fibonacci')"
                  [class]="api.activeDrawingTool() === 'fibonacci' ? 'bg-[#2962ff] text-white shadow-lg' : 'text-[#9db2c6] hover:text-white hover:bg-[#2a2e39]'"
                  class="p-2 rounded-lg transition-all" title="Plot Fibonacci Retracement Levels">
            <svg class="tv-icon" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <!-- Brush / Highlight Box Mode -->
          <button (click)="api.setTool('brush')"
                  [class]="api.activeDrawingTool() === 'brush' ? 'bg-[#2962ff] text-white shadow-lg' : 'text-[#9db2c6] hover:text-white hover:bg-[#2a2e39]'"
                  class="p-2 rounded-lg transition-all" title="Highlight Area / Brush">
            <svg class="tv-icon" viewBox="0 0 24 24">
              <path d="M18.375 2.625a3.875 3.875 0 0 0-5.48 0L3 12.5v5.5h5.5l9.875-9.875a3.875 3.875 0 0 0 0-5.5z"></path>
            </svg>
          </button>

          <!-- Quick Jump to ML Target Forecast -->
          <button (click)="onTargetClick()"
                  [class]="api.activeDrawingTool() === 'target' ? 'bg-[#2962ff] text-white shadow-lg' : 'text-[#9db2c6] hover:text-white hover:bg-[#2a2e39]'"
                  class="p-2 rounded-lg transition-all" title="Launch ML Forecast Target">
            <svg class="tv-icon" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="6"></circle>
              <circle cx="12" cy="12" r="2" fill="currentColor"></circle>
            </svg>
          </button>

          <!-- Distance / Range Measurement Mode -->
          <button (click)="api.setTool('measure')"
                  [class]="api.activeDrawingTool() === 'measure' ? 'bg-[#2962ff] text-white shadow-lg' : 'text-[#9db2c6] hover:text-white hover:bg-[#2a2e39]'"
                  class="p-2 rounded-lg transition-all" title="Measure Distance & Price Delta">
            <svg class="tv-icon" viewBox="0 0 24 24">
              <path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4z"></path>
            </svg>
          </button>

          <!-- Bottom Utilities: Zoom In & Clear All Drawings -->
          <div class="mt-auto flex flex-col gap-2">
            <!-- Zoom 30D -->
            <button (click)="api.setTool('zoom')"
                    class="p-2 text-[#9db2c6] hover:text-white hover:bg-[#2a2e39] rounded-lg transition-all" title="Zoom to Recent 30 Days">
              <svg class="tv-icon" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </button>
            
            <!-- Clear Drawings -->
            <button (click)="api.triggerAction('clear')"
                    class="p-2 text-[#9db2c6] hover:text-[#f23645] hover:bg-[#f23645]/15 rounded-lg transition-all" title="Clear All Lines & Annotations">
              <svg class="tv-icon" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </aside>

        <!-- CENTER VIEWPORT (Dynamic Angular Router Outlet) -->
        <main class="flex-1 bg-[#131722] overflow-y-auto relative">
          <router-outlet></router-outlet>
        </main>

        <!-- RIGHT WATCHLIST & DETAIL PANEL -->
        @if (showWatchlist()) {
          <aside class="w-72 sm:w-80 bg-[#181b24] border-l border-[#2a2e39] flex flex-col z-20 flex-shrink-0">
            
            <!-- Watchlist Header -->
            <div class="p-3 border-b border-[#2a2e39] flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-white tracking-wide">Watchlist</span>
                <span class="text-[10px] bg-[#2a2e39] text-[#9db2c6] px-2 py-0.5 rounded-full font-mono font-bold">
                  {{ api.companies().length }}
                </span>
              </div>
              <button (click)="showWatchlist.set(false)" class="text-[#9db2c6] hover:text-white p-1 rounded hover:bg-[#2a2e39] transition-colors">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <!-- Search Filter Input -->
            <div class="p-2.5 border-b border-[#2a2e39]">
              <div class="relative">
                <input type="text"
                       [ngModel]="api.searchQuery()"
                       (ngModelChange)="api.searchQuery.set($event)"
                       placeholder="Filter symbol or company..."
                       class="w-full bg-[#131722] border border-[#2a2e39] rounded px-3 py-1.5 text-xs text-white placeholder-[#787b86] focus:outline-none focus:border-[#2962ff]">
              </div>
            </div>

            <!-- Watchlist Table Columns Header -->
            <div class="px-3 py-1.5 bg-[#131722] border-b border-[#2a2e39] flex items-center justify-between text-[11px] font-bold text-[#787b86] uppercase tracking-wider">
              <span>Symbol</span>
              <span>Last / Chg</span>
            </div>

            <!-- Watchlist Items List -->
            <div class="flex-1 overflow-y-auto divide-y divide-[#2a2e39]/50">
              @for (c of api.filteredCompanies(); track c.ticker) {
                <div (click)="onSelectCompany(c.ticker, c.name)"
                     [class]="api.selectedTicker() === c.ticker ? 'bg-[#2a2e39] border-l-2 border-[#2962ff]' : 'hover:bg-[#1e222d]'"
                     class="px-3 py-2.5 flex items-center justify-between cursor-pointer transition-colors">
                  <div>
                    <div class="font-bold text-xs text-white tracking-wide">{{ c.ticker }}</div>
                    <div class="text-[11px] text-[#9db2c6] truncate max-w-[140px]">{{ c.name }}</div>
                  </div>
                  <div class="text-right font-mono-num">
                    <span class="text-xs font-bold text-white">USD</span>
                    <div class="text-[11px] text-[#089981] font-semibold">+0.50%</div>
                  </div>
                </div>
              }
            </div>

            <!-- Bottom Detail Widget: Technical Summary -->
            <div class="p-3.5 border-t border-[#2a2e39] bg-[#131722] space-y-2.5">
              <div class="text-xs font-bold text-[#9db2c6] uppercase tracking-wider flex items-center justify-between">
                <span>Technical Rating</span>
                <span class="text-[#089981] font-bold font-mono">STRONG BUY</span>
              </div>
              <div class="flex items-center justify-between text-xs text-[#9db2c6]">
                <span>Oscillators (12):</span>
                <span class="text-[#089981] font-bold font-mono">BUY</span>
              </div>
              <div class="flex items-center justify-between text-xs text-[#9db2c6]">
                <span>Moving Averages (18):</span>
                <span class="text-[#089981] font-bold font-mono">STRONG BUY</span>
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
  router = inject(Router);

  showWatchlist = signal<boolean>(true);
  showSymbolSearch = signal<boolean>(false);

  timeframes: Timeframe[] = ['1D', '5D', '1M', '3M', '6M', '1Y', 'ALL'];

  navTabs = [
    { path: '/analysis',      label: 'SuperChart',           exact: false },
    { path: '/prediction',    label: 'ML Forecasts',        exact: false },
    { path: '/best-analysis', label: 'Strategy Leaderboard', exact: false },
    { path: '/',              label: 'Market Overview',      exact: true },
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

  onSelectTimeframe(tf: Timeframe) {
    this.api.timeframe.set(tf);
  }

  onTargetClick() {
    this.api.setTool('target');
    this.router.navigate(['/prediction']);
  }
}
