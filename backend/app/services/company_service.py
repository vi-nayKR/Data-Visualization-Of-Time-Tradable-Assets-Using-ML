import os
import xlrd
from typing import Dict, List

class CompanyService:
    def __init__(self):
        self.companies: Dict[str, str] = {}
        self._load_companies()

    def _load_companies(self):
        # Look for cname.xls in parent directory or backend data dir
        possible_paths = [
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "cname.xls"),
            os.path.join(os.path.dirname(__file__), "..", "data", "cname.xls"),
            "cname.xls"
        ]
        
        filepath = None
        for p in possible_paths:
            if os.path.exists(p):
                filepath = p
                break
                
        if filepath:
            try:
                xls = xlrd.open_workbook(filepath)
                sh = xls.sheet_by_index(0)
                for i in range(sh.nrows):
                    c_name = str(sh.cell(i, 0).value).strip()
                    c_id = str(sh.cell(i, 1).value).strip()
                    if c_name and c_id:
                        self.companies[c_name] = c_id
            except Exception as e:
                print(f"Error loading {filepath}: {e}")
        
        # Fallback list if file unavailable
        if not self.companies:
            self.companies = {
                "Apple Inc.": "AAPL",
                "Microsoft Corporation": "MSFT",
                "Amazon.com Inc.": "AMZN",
                "Alphabet Inc.": "GOOGL",
                "Meta Platforms, Inc.": "META",
                "Tesla, Inc.": "TSLA",
                "NVIDIA Corporation": "NVDA"
            }

    def get_all_companies(self) -> List[Dict[str, str]]:
        return [{"name": name, "ticker": ticker} for name, ticker in self.companies.items()]

    def get_ticker(self, company_name: str) -> str:
        return self.companies.get(company_name, company_name)
