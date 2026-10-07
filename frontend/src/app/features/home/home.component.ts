import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StockApiService } from '../../core/services/stock-api.service';
import { UI } from '../../shared/ui';
@Component({ selector:'app-home', changeDetection:ChangeDetectionStrategy.OnPush, imports:[RouterLink,...UI],
  template:`
    <section uiCard class="hero hud">
      <div><p class="eyebrow">// IEEE NMITCON 2023 · RESEARCH DEMONSTRATION</p>
        <h1>Data Visualization of <span class="gradient-text">Time-Tradable Assets</span> Using ML</h1>
        <p class="hero-copy">Explore India and US markets. Compare five machine learning models with three simple baselines, inspect historical prices, and see how forecasts perform on data held out of training.</p>
        <div class="hero-actions"><a uiButton class="primary" routerLink="/analysis">Explore the data <span aria-hidden="true">↗</span></a><a uiButton href="https://doi.org/10.1109/NMITCON58196.2023.10275962" target="_blank" rel="noopener">Read the paper <span aria-hidden="true">↗</span></a></div>
      </div>
      <div class="hero-visual"><div class="eyebrow">// FROM DATA TO INSIGHT</div>
        <svg viewBox="0 0 360 190" fill="none" aria-hidden="true"><g class="hero-grid"><path d="M0 40h360M0 80h360M0 120h360M0 160h360M40 0v190M100 0v190M160 0v190M220 0v190M280 0v190M340 0v190"/></g><path d="M0 155 28 145 55 150 84 110 108 127 140 82 169 94 193 56 220 79 244 46 275 60 309 25 340 35 360 12" stroke="currentColor" stroke-width="2"/><path class="hero-forecast" d="M0 170C60 130 110 145 170 115S270 85 360 44" stroke-width="2" stroke-dasharray="5 6"/></svg>
        <div class="visual-footer mono"><span>HISTORICAL SIGNAL</span><span>MODEL COMPARISON</span></div>
        <div class="hero-meta"><span uiBadge>{{ api.sourceLabel('companies') }}</span><span>Not financial advice</span></div>
      </div>
    </section>
    @if (api.sources()['companies'] === 'snapshot') { <div class="snapshot-banner home-snapshot">A saved research snapshot is available while the live API reconnects.</div> }
    <div class="section-heading"><div><p class="eyebrow">// CHOOSE YOUR EXPLORATION</p><h2>Three ways to explore the research.</h2></div><p>Two markets. Eight models and baselines.</p></div>
    <div class="entry-grid">
      <a uiCard class="entry-card" routerLink="/analysis"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 3v18M18 3v18"/><rect x="3" y="7" width="6" height="8" rx="1"/><rect x="15" y="5" width="6" height="11" rx="1"/></svg><p class="eyebrow">01 / OBSERVE</p><h3>Market analysis</h3><p>Explore price, volume, and technical indicators in an interactive chart. Find patterns in the historical data.</p><span class="entry-link">OPEN ANALYSIS ↗</span></a>
      <a uiCard class="entry-card" routerLink="/prediction"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 19 7 13l4 3 5-9 6-4M16 3h6v6"/></svg><p class="eyebrow">02 / EXPERIMENT</p><h3>Model predictions</h3><p>Switch between linear regression, decision trees, support vector machines, and LSTM to compare model outputs.</p><span class="entry-link">EXPLORE PREDICTIONS ↗</span></a>
      <a uiCard class="entry-card" routerLink="/best-analysis"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 20h16M7 16V9h3v7M14 16V4h3v12"/></svg><p class="eyebrow">03 / COMPARE</p><h3>Best model</h3><p>Rank all eight models and baselines by validation error. Check whether the winner beats naive on held-out data.</p><span class="entry-link">COMPARE MODELS ↗</span></a>
    </div>
    <section uiCard class="research-note"><div><p class="eyebrow">// OPEN RESEARCH</p><h3>Built to explore, not to advise.</h3><p>Model outputs are research experiments, not guarantees of future prices. Read the paper for context, or explore the implementation on GitHub.</p></div><a uiButton href="https://github.com/vi-nayKR/Data-Visualization-Of-Time-Tradable-Assets-Using-ML" target="_blank" rel="noopener">View source <span aria-hidden="true">↗</span></a></section>
  ` })
export class HomeComponent { api=inject(StockApiService); }
