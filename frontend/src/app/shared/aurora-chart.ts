let plotly: Promise<any> | undefined;
export const loadPlotly = () => plotly ??= import('plotly.js-dist-min').then(module => module.default).catch(error => {plotly=undefined;throw error;});

export function chartPalette() {
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => css.getPropertyValue(`--${name}`).trim();
  return { accent: token('accent'), indigo: token('accent-glow'), text: token('text-primary'), muted: token('text-muted'),
    surface: token('bg-surface'), border: token('border-color'), grid: token('border-subtle'),
    green: token('success'), red: token('danger'), fill: token('forecast-fill'), mono: token('font-mono') };
}

export function chartLayout() {
  const p = chartPalette();
  return { paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', autosize: true,
    font: { color: p.muted, family: p.mono, size: 10 },
    hoverlabel: { bgcolor: p.surface, bordercolor: p.border, font: { color: p.text, family: p.mono } },
    xaxis: { gridcolor: p.grid, zeroline: false }, yaxis: { gridcolor: p.grid, zeroline: false } };
}
