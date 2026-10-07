import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';
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
export const UI = [UiButton, UiCard, UiBadge, UiSegmented, UiSelect, UiSkeleton, UiPageHeader];
