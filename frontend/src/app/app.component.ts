import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { StockApiService } from './core/services/stock-api.service';
@Component({
  selector: 'app-root', changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="topbar"><div class="nav-inner">
      <a routerLink="/" class="brand" aria-label="Asset Lab home">
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 24 10 14l6 5L29 6M22 6h7v7"/><path d="M3 3v26h26" opacity=".3"/></svg>
        <span>ASSET LAB<small>IEEE RESEARCH / 2023</small></span>
      </a>
      <nav class="navigation" aria-label="Main navigation">
        @for (link of links; track link.path) {
          <a [routerLink]="link.path" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" ariaCurrentWhenActive="page">{{ link.label }}</a>
        }
      </nav>
    </div></header>
    <main id="main" class="app-main"><router-outlet /></main>
    <footer class="footer"><span>Data Visualization of Time-Tradable Assets Using ML</span><span>Research demonstration · Not financial advice</span></footer>
  `
})
export class AppComponent implements OnInit {
  private api = inject(StockApiService);
  links = [{path:'/',label:'Overview'},{path:'/analysis',label:'Analysis'},{path:'/prediction',label:'Prediction'},{path:'/best-analysis',label:'Best model'}];
  ngOnInit() { this.api.loadCompanies(); }
}