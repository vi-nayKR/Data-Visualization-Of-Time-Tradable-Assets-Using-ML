export function testSkillLabel(skill: number | null): string {
  if (skill === null) return 'Test skill vs naive: N/A';
  const percent = new Intl.NumberFormat('en-US', {style:'percent', maximumFractionDigits:1}).format(skill === 0 ? 0 : skill).replace('-', '\u2212');
  return `${skill > 0 ? 'beats' : skill < 0 ? "doesn't beat" : 'matches'} the naive baseline on test, ${percent}`;
}

export function hasForecastDirection(model: string, forecastReturn: number): boolean {
  return model !== 'naive' && Number.isFinite(forecastReturn) && forecastReturn !== 0;
}
