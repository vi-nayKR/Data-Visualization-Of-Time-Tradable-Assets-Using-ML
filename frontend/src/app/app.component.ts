import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs';
import { StockApiService, DrawingTool } from './core/services/stock-api.service';
import { Timeframe, ChartType } from './core/models/stock.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-screen w-screen bg-[var(--color-void)] text-[var(--color-frost)] overflow-hidden font-sans select-none transition-colors duration-300">
      
      <!-- RATE LIMIT FLOATING ALERT BANNER -->
      @if (api.rateLimitWarning().active) {
        <div class="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#f23645] text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-bounce border border-white/20">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ api.rateLimitWarning().message }}</span>
        </div>
      }

      <!-- TOP NAVIGATION BAR (HORIZONTALLY SCROLLABLE ON MOBILE PHONES & DESKTOP) -->
      <header class="h-12 bg-[var(--color-abyss)] border-b border-[var(--color-border)] flex items-center justify-between px-2 sm:px-3 z-30 flex-shrink-0 text-xs gap-2.5 sm:gap-3 transition-colors duration-300 header-scroll-container">
        
        <!-- Left Section: Brand Logo & Symbol Search -->
        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          <!-- Logo with Portfolio Gradient -->
          <a routerLink="/" class="flex items-center gap-1.5 sm:gap-2 pr-1.5 sm:pr-2 border-r border-[var(--color-border)] cursor-pointer hover:opacity-90 transition-opacity shrink-0">
            <svg class="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
            <div class="flex flex-col">
              <span class="font-extrabold text-xs sm:text-sm tracking-wider font-display leading-tight">
                DATA VIZ<span class="text-[var(--color-accent)]">.ML</span>
              </span>
              <span class="text-[8px] sm:text-[9px] text-[var(--color-muted)] tracking-tight hidden md:inline leading-none font-medium">
                Time-Tradable Assets
              </span>
            </div>
          </a>

          <!-- Symbol Search Selector (Shown on Trading & ML views) -->
          @if (!isOverview()) {
            <div class="relative group shrink-0">
              <button (click)="toggleSymbolSearch()"
                      class="flex items-center gap-1.5 bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50 border border-[var(--color-border)] rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[var(--color-frost)] font-semibold transition-all">
                <svg class="tv-icon tv-icon-sm text-[var(--color-muted)]" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span class="text-xs sm:text-sm font-bold tracking-wide">{{ api.selectedTicker() }}</span>
                <span class="text-xs text-[var(--color-muted)] max-w-[120px] truncate hidden xl:inline">{{ api.selectedCompanyName() }}</span>
                <svg class="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[var(--color-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              <!-- Search Dropdown Modal -->
              @if (showSymbolSearch()) {
                <div class="fixed inset-x-2 top-14 sm:absolute sm:left-0 sm:top-11 sm:w-96 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl z-50 p-3 space-y-2">
                  <div class="flex items-center justify-between sm:hidden pb-1 border-b border-[var(--color-border)]">
                    <span class="font-bold text-xs text-[var(--color-frost)]">Select Market Asset</span>
                    <button (click)="showSymbolSearch.set(false)" class="text-[var(--color-muted)] p-1 text-sm">✕</button>
                  </div>
                  <div class="relative">
                    <input type="text"
                           [ngModel]="api.searchQuery()"
                           (ngModelChange)="api.searchQuery.set($event)"
                           placeholder="Search symbol or company (e.g. AAPL, TSLA)..."
                           autofocus
                           class="w-full bg-[var(--color-void)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-frost)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)]">
                  </div>
                  
                  <div class="max-h-60 sm:max-h-64 overflow-y-auto divide-y divide-[var(--color-border)]">
                    @for (c of api.filteredCompanies(); track c.ticker) {
                      <div (click)="onSelectCompany(c.ticker, c.name)"
                           class="flex items-center justify-between p-2.5 hover:bg-[var(--color-abyss)] rounded-lg cursor-pointer transition-colors">
                        <div>
                          <span class="font-bold text-[var(--color-frost)] text-xs">{{ c.ticker }}</span>
                          <span class="text-xs text-[var(--color-muted)] ml-2">{{ c.name }}</span>
                        </div>
                        <span class="text-[10px] text-[var(--color-accent)] bg-[var(--color-accent)]/15 px-2 py-0.5 rounded font-mono font-bold">STOCK</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Live Price & Change Badge -->
            @if (api.latestRecord(); as latest) {
              <div class="flex items-center gap-1.5 pl-1.5 border-l border-[var(--color-border)] shrink-0">
                <span class="text-xs sm:text-sm font-extrabold font-mono-num text-[var(--color-frost)]">\${{ latest.close }}</span>
                
                <div [class]="api.priceChange().isPositive ? 'text-[#089981] bg-[#089981]/15 border border-[#089981]/30' : 'text-[#f23645] bg-[#f23645]/15 border border-[#f23645]/30'"
                     class="px-1.5 sm:px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-mono-num font-bold flex items-center gap-0.5">
                  <span>{{ api.priceChange().isPositive ? '▲' : '▼' }}</span>
                  <span>{{ api.priceChange().isPositive ? '+' : '' }}{{ api.priceChange().diff }}</span>
                  <span class="hidden md:inline">({{ api.priceChange().isPositive ? '+' : '' }}{{ api.priceChange().percent }}%)</span>
                </div>
              </div>

              <!-- Header OHLC Ribbon on Large Screens -->
              @if (isSuperChart()) {
                <div class="hidden 2xl:flex items-center gap-3 text-xs text-[var(--color-muted)] font-mono-num shrink-0">
                  <span>O <strong class="text-[var(--color-frost)]">\${{ latest.open }}</strong></span>
                  <span>H <strong class="text-[#089981]">\${{ latest.high }}</strong></span>
                  <span>L <strong class="text-[#f23645]">\${{ latest.low }}</strong></span>
                  <span>C <strong class="text-[var(--color-frost)]">\${{ latest.close }}</strong></span>
                  <span>Vol <strong class="text-[var(--color-frost)]">{{ latest.volume }}M</strong></span>
                </div>
              }
            }
          }
        </div>

        <!-- Center Section: Contextual Controls (Scrollable on Mobile) -->
        <!-- 1. SuperChart View: Timeframes & Chart Type Selectors -->
        @if (isSuperChart()) {
          <div class="flex items-center gap-1 border-x border-[var(--color-border)] px-1.5 sm:px-2 shrink-0">
            @for (tf of timeframes; track tf) {
              <button (click)="onSelectTimeframe(tf)"
                      [class]="api.timeframe() === tf ? 'tv-timeframe-btn-active' : ''"
                      class="tv-timeframe-btn">
                {{ tf }}
              </button>
            }

            <span class="w-[1px] h-4 bg-[var(--color-border)] mx-1"></span>

            <!-- Chart Types Buttons -->
            <div class="flex items-center gap-0.5 sm:gap-1">
              <button (click)="api.chartType.set('candlestick')"
                      [class]="api.chartType() === 'candlestick' ? 'bg-[var(--color-accent)] text-white shadow-md' : 'text-[var(--color-muted)] hover:text-[var(--color-frost)] hover:bg-[var(--color-surface)]'"
                      class="p-1 sm:p-1.5 rounded-lg transition-all shrink-0" title="Candles">
                <svg class="tv-icon tv-icon-sm" viewBox="0 0 24 24">
                  <line x1="9" y1="2" x2="9" y2="22"></line>
                  <rect x="6" y="6" width="6" height="11" rx="1" fill="currentColor"></rect>
                  <line x1="17" y1="4" x2="17" y2="20"></line>
                  <rect x="14" y="8" width="6" height="8" rx="1" fill="currentColor"></rect>
                </svg>
              </button>

              <button (click)="api.chartType.set('line')"
                      [class]="api.chartType() === 'line' ? 'bg-[var(--color-accent)] text-white shadow-md' : 'text-[var(--color-muted)] hover:text-[var(--color-frost)] hover:bg-[var(--color-surface)]'"
                      class="p-1 sm:p-1.5 rounded-lg transition-all shrink-0" title="Line">
                <svg class="tv-icon tv-icon-sm" viewBox="0 0 24 24">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </button>

              <button (click)="api.chartType.set('bar')"
                      [class]="api.chartType() === 'bar' ? 'bg-[var(--color-accent)] text-white shadow-md' : 'text-[var(--color-muted)] hover:text-[var(--color-frost)] hover:bg-[var(--color-surface)]'"
                      class="p-1 sm:p-1.5 rounded-lg transition-all shrink-0" title="OHLC Bars">
                <svg class="tv-icon tv-icon-sm" viewBox="0 0 24 24">
                  <line x1="12" y1="2" x2="12" y2="22"></line>
                  <line x1="12" y1="8" x2="8" y2="8"></line>
                  <line x1="12" y1="16" x2="16" y2="16"></line>
                </svg>
              </button>
            </div>
          </div>
        } @else if (isPrediction()) {
          <div class="flex items-center gap-2 border-x border-[var(--color-border)] px-3 py-1 text-xs font-mono-num text-[var(--color-muted)] shrink-0">
            <span class="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse"></span>
            <span>Forecast: <strong class="text-[var(--color-frost)]">50 Trading Days Forward</strong></span>
          </div>
        } @else if (isLeaderboard()) {
          <div class="flex items-center gap-2 border-x border-[var(--color-border)] px-3 py-1 text-xs font-mono-num text-[var(--color-muted)] shrink-0">
            <span class="w-2 h-2 rounded-full bg-[#089981] animate-pulse"></span>
            <span>Evaluation: <strong class="text-[#089981]">5 ML Regressors</strong></span>
          </div>
        }

        <!-- Right Section: Navigation Tabs, Theme Toggle & Watchlist (Horizontally Scrollable) -->
        <div class="flex items-center gap-1 sm:gap-2 shrink-0">
          <nav class="flex items-center gap-1 shrink-0">
            @for (tab of navTabs; track tab.path) {
              <a [routerLink]="tab.path"
                 [routerLinkActiveOptions]="{exact: tab.exact}"
                 routerLinkActive="tv-nav-tab-active"
                 class="tv-nav-tab">
                {{ tab.label }}
              </a>
            }
          </nav>

          <!-- Sun / Moon Theme Toggle Button -->
          <button (click)="api.toggleTheme()"
                  class="p-1.5 sm:p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-frost)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface)] transition-all duration-300 cursor-pointer flex items-center justify-center shrink-0"
                  aria-label="Toggle dark/light theme"
                  title="Toggle Dark/Light Mode">
            @if (api.isDarkMode()) {
              <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-accent)]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
              </svg>
            } @else {
              <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-accent)]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
              </svg>
            }
          </button>

          <!-- Watchlist Drawer Toggle Button (Hidden on Overview) -->
          @if (!isOverview()) {
            <button (click)="showWatchlist.set(!showWatchlist())"
                    [class]="showWatchlist() ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-frost)] border-[var(--color-border)]'"
                    class="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-[11px] sm:text-xs font-semibold transition-all shrink-0">
              <svg class="tv-icon tv-icon-sm" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
              <span>Watchlist</span>
            </button>
          }
        </div>
      </header>

      <!-- MAIN WORKSPACE: CONTEXTUAL DRAWING DOCK + CENTER CONTENT + WATCHLIST -->
      <div class="flex flex-1 w-full overflow-hidden relative">

        <!-- FUNCTIONAL LEFT DRAWING TOOLBAR (DESKTOP DOCK & HIDDEN ON NARROW SCREENS) -->
        @if (isSuperChart()) {
          <aside class="hidden md:flex w-11 bg-[var(--color-abyss)] border-r border-[var(--color-border)] flex-col items-center py-3 gap-2.5 z-20 flex-shrink-0 text-xs transition-colors duration-300">
            
            <!-- 1. Crosshair Mode -->
            <button (click)="api.setTool('crosshair')"
                    [class]="api.activeDrawingTool() === 'crosshair' ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-[var(--color-muted)] hover:text-[var(--color-frost)] hover:bg-[var(--color-surface)]'"
                    class="p-2 rounded-lg transition-all" title="Crosshair Mode">
              <svg class="tv-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="2" x2="12" y2="22"></line>
                <line x1="2" y1="12" x2="22" y2="12"></line>
              </svg>
            </button>

            <!-- 2. Trend Line Tool -->
            <button (click)="api.setTool('trendline')"
                    [class]="api.activeDrawingTool() === 'trendline' ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-[var(--color-muted)] hover:text-[var(--color-frost)] hover:bg-[var(--color-surface)]'"
                    class="p-2 rounded-lg transition-all" title="Trend Line Drawing">
              <svg class="tv-icon" viewBox="0 0 24 24">
                <line x1="4" y1="20" x2="20" y2="4"></line>
                <circle cx="4" cy="20" r="2" fill="currentColor"></circle>
                <circle cx="20" cy="4" r="2" fill="currentColor"></circle>
              </svg>
            </button>

            <!-- 3. Fibonacci Retracement Tool -->
            <button (click)="api.setTool('fibonacci')"
                    [class]="api.activeDrawingTool() === 'fibonacci' ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-[var(--color-muted)] hover:text-[var(--color-frost)] hover:bg-[var(--color-surface)]'"
                    class="p-2 rounded-lg transition-all" title="Fibonacci Retracement">
              <svg class="tv-icon" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            <!-- 4. Brush / Area Highlight Tool -->
            <button (click)="api.setTool('brush')"
                    [class]="api.activeDrawingTool() === 'brush' ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-[var(--color-muted)] hover:text-[var(--color-frost)] hover:bg-[var(--color-surface)]'"
                    class="p-2 rounded-lg transition-all" title="Highlight Area">
              <svg class="tv-icon" viewBox="0 0 24 24">
                <path d="M18.375 2.625a3.875 3.875 0 0 0-5.48 0L3 12.5v5.5h5.5l9.875-9.875a3.875 3.875 0 0 0 0-5.5z"></path>
              </svg>
            </button>

            <!-- 5. ML Target Tool -->
            <button (click)="onTargetClick()"
                    [class]="api.activeDrawingTool() === 'target' ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-[var(--color-muted)] hover:text-[var(--color-frost)] hover:bg-[var(--color-surface)]'"
                    class="p-2 rounded-lg transition-all" title="ML Target Forecast">
              <svg class="tv-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2" fill="currentColor"></circle>
              </svg>
            </button>

            <!-- 6. Distance & Measure Tool -->
            <button (click)="api.setTool('measure')"
                    [class]="api.activeDrawingTool() === 'measure' ? 'bg-[var(--color-accent)] text-white shadow-lg' : 'text-[var(--color-muted)] hover:text-[var(--color-frost)] hover:bg-[var(--color-surface)]'"
                    class="p-2 rounded-lg transition-all" title="Measure Tool">
              <svg class="tv-icon" viewBox="0 0 24 24">
                <path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4z"></path>
              </svg>
            </button>

            <!-- Bottom Utilities: Zoom In & Clear All Drawings -->
            <div class="mt-auto flex flex-col gap-2">
              <button (click)="api.setTool('zoom')"
                      class="p-2 text-[var(--color-muted)] hover:text-[var(--color-frost)] hover:bg-[var(--color-surface)] rounded-lg transition-all" title="Zoom Recent 30 Days">
                <svg class="tv-icon" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </button>
              
              <button (click)="api.triggerAction('clear')"
                      class="p-2 text-[var(--color-muted)] hover:text-[#f23645] hover:bg-[#f23645]/15 rounded-lg transition-all" title="Clear All Drawings">
                <svg class="tv-icon" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </aside>
        }

        <!-- CENTER VIEWPORT (Dynamic Angular Router Outlet) -->
        <main class="flex-1 bg-[var(--color-void)] overflow-y-auto relative transition-colors duration-300">
          <router-outlet></router-outlet>
        </main>

        <!-- WATCHLIST DRAWER: RESPONSIVE MODAL OVERLAY ON MOBILE, DOCKED PANEL ON DESKTOP -->
        @if (!isOverview() && showWatchlist()) {
          <!-- Backdrop for mobile screens -->
          <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" (click)="showWatchlist.set(false)"></div>

          <aside class="fixed inset-y-0 right-0 w-80 max-w-[85vw] md:relative md:inset-auto md:w-72 lg:w-80 bg-[var(--color-abyss)] border-l border-[var(--color-border)] flex flex-col z-50 md:z-20 flex-shrink-0 transition-colors duration-300 shadow-2xl md:shadow-none">
            
            <!-- Watchlist Header -->
            <div class="p-3 border-b border-[var(--color-border)] flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-[var(--color-frost)] tracking-wide">Watchlist</span>
                <span class="text-[10px] bg-[var(--color-surface)] text-[var(--color-muted)] border border-[var(--color-border)] px-2 py-0.5 rounded-full font-mono font-bold">
                  {{ api.companies().length }}
                </span>
              </div>
              <button (click)="showWatchlist.set(false)" class="text-[var(--color-muted)] hover:text-[var(--color-frost)] p-1 rounded-lg hover:bg-[var(--color-surface)] transition-colors">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <!-- Search Filter Input -->
            <div class="p-2.5 border-b border-[var(--color-border)]">
              <div class="relative">
                <input type="text"
                       [ngModel]="api.searchQuery()"
                       (ngModelChange)="api.searchQuery.set($event)"
                       placeholder="Filter symbol or company..."
                       class="w-full bg-[var(--color-void)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-frost)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)]">
              </div>
            </div>

            <!-- Watchlist Table Columns Header -->
            <div class="px-3 py-1.5 bg-[var(--color-void)] border-b border-[var(--color-border)] flex items-center justify-between text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-wider">
              <span>Symbol</span>
              <span>Last / Chg</span>
            </div>

            <!-- Watchlist Items List -->
            <div class="flex-1 overflow-y-auto divide-y divide-[var(--color-border)]/50">
              @for (c of api.filteredCompanies(); track c.ticker) {
                <div (click)="onSelectCompany(c.ticker, c.name)"
                     [class]="api.selectedTicker() === c.ticker ? 'bg-[var(--color-surface)] border-l-2 border-[var(--color-accent)]' : 'hover:bg-[var(--color-surface)]/60'"
                     class="px-3 py-2.5 flex items-center justify-between cursor-pointer transition-colors">
                  <div>
                    <div class="font-bold text-xs text-[var(--color-frost)] tracking-wide">{{ c.ticker }}</div>
                    <div class="text-[11px] text-[var(--color-muted)] truncate max-w-[140px]">{{ c.name }}</div>
                  </div>
                  <div class="text-right font-mono-num">
                    <span class="text-xs font-bold text-[var(--color-frost)]">USD</span>
                    <div class="text-[11px] text-[#089981] font-semibold">+0.50%</div>
                  </div>
                </div>
              }
            </div>

            <!-- Bottom Detail Widget: Technical Summary -->
            <div class="p-3.5 border-t border-[var(--color-border)] bg-[var(--color-void)] space-y-2.5">
              <div class="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider flex items-center justify-between">
                <span>Technical Rating</span>
                <span class="text-[#089981] font-bold font-mono">STRONG BUY</span>
              </div>
              <div class="flex items-center justify-between text-xs text-[var(--color-muted)]">
                <span>Oscillators (12):</span>
                <span class="text-[#089981] font-bold font-mono">BUY</span>
              </div>
              <div class="flex items-center justify-between text-xs text-[var(--color-muted)]">
                <span>Moving Averages (18):</span>
                <span class="text-[#089981] font-bold font-mono">STRONG BUY</span>
              </div>
              <div class="w-full bg-[var(--color-border)] h-1.5 rounded-full overflow-hidden flex">
                <div class="bg-[#f23645] w-[15%]"></div>
                <div class="bg-[var(--color-muted)] w-[20%]"></div>
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

  showWatchlist = signal<boolean>(false);
  showSymbolSearch = signal<boolean>(false);
  currentUrl = signal<string>(this.router.url);

  timeframes: Timeframe[] = ['1D', '5D', '1M', '3M', '6M', '1Y', 'ALL'];

  navTabs = [
    { path: '/analysis',      label: 'SuperChart',           exact: false },
    { path: '/prediction',    label: 'ML Forecasts',        exact: false },
    { path: '/best-analysis', label: 'Strategy Leaderboard', exact: false },
    { path: '/',              label: 'Market Overview',      exact: true },
  ];

  // Dynamic Route Evaluators
  isSuperChart = computed(() => this.currentUrl().startsWith('/analysis'));
  isPrediction = computed(() => this.currentUrl().startsWith('/prediction'));
  isLeaderboard = computed(() => this.currentUrl().startsWith('/best-analysis'));
  isOverview = computed(() => this.currentUrl() === '/' || this.currentUrl() === '');

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      this.currentUrl.set(e.urlAfterRedirects || e.url);
      // Auto-close search and watchlist on mobile page navigation
      this.showSymbolSearch.set(false);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        this.showWatchlist.set(false);
      }
    });
  }

  ngOnInit() {
    this.api.loadCompanies();
    this.currentUrl.set(this.router.url);
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      this.showWatchlist.set(true);
    }
  }

  toggleSymbolSearch() {
    this.showSymbolSearch.set(!this.showSymbolSearch());
  }

  onSelectCompany(ticker: string, name: string) {
    this.api.selectCompany(ticker, name);
    this.showSymbolSearch.set(false);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.showWatchlist.set(false);
    }
  }

  onSelectTimeframe(tf: Timeframe) {
    this.api.timeframe.set(tf);
  }

  onTargetClick() {
    this.api.setTool('target');
    this.router.navigate(['/prediction']);
  }
}
