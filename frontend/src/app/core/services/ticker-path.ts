export const tickerResourcePath = (resource: string, ticker: string, action: string): string =>
  `${resource}/${encodeURIComponent(ticker)}/${action}`;
