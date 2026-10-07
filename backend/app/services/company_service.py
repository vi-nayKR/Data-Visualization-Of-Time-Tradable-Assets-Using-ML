import json
from pathlib import Path

DATA = Path(__file__).resolve().parents[1] / "data"

class CompanyService:
    def __init__(self):
        self.markets = json.loads((DATA / "markets.json").read_text())
        self.companies = {}
        for market in self.markets:
            catalog = json.loads((DATA / f"tickers_{market['id']}.json").read_text())
            items = catalog["tickers"] if isinstance(catalog, dict) else catalog
            self.companies[market["id"]] = [
                {"name": item["name"], "ticker": item["symbol"], "sector": item["sector"],
                 "market": market["id"], "currency": market["currency"]} for item in items]

    def get_all_companies(self, market="us"):
        return self.companies[market]

    def get_ticker(self, company_name):
        return next((c["ticker"] for items in self.companies.values() for c in items
                     if c["name"] == company_name), company_name)

    def lookup(self, symbol):
        return next((c for items in self.companies.values() for c in items
                     if c["ticker"] == symbol), None)
