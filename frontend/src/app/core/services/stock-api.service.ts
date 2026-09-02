import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Company, OHLCVRecord, PredictionResponse, BestModelResponse } from '../models/stock.model';

@Injectable({ providedIn: 'root' })
export class StockApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  selectedTicker = signal<string>('AAPL');
  selectedCompanyName = signal<string>('Apple Inc.');
  companies = signal<Company[]>([]);

  async loadCompanies(): Promise<Company[]> {
    try {
      const data = await firstValueFrom(this.http.get<Company[]>(`${this.baseUrl}/companies`));
      this.companies.set(data);
      if (data.length > 0 && !this.selectedTicker()) {
        this.selectedTicker.set(data[0].ticker);
        this.selectedCompanyName.set(data[0].name);
      }
      return data;
    } catch (e) {
      console.error('Failed to load companies:', e);
      return [];
    }
  }

  async getOHLCV(ticker: string, period = '180d'): Promise<OHLCVRecord[]> {
    return firstValueFrom(
      this.http.get<OHLCVRecord[]>(`${this.baseUrl}/stocks/${ticker}/ohlcv?period=${period}`)
    );
  }

  async getMovingAverage(ticker: string, days = 50, period = '180d'): Promise<OHLCVRecord[]> {
    return firstValueFrom(
      this.http.get<OHLCVRecord[]>(`${this.baseUrl}/stocks/${ticker}/moving-average?days=${days}&period=${period}`)
    );
  }

  async getPrediction(ticker: string, model = 'linear_regression'): Promise<PredictionResponse> {
    return firstValueFrom(
      this.http.get<PredictionResponse>(`${this.baseUrl}/predictions/${ticker}/predict?model=${model}`)
    );
  }

  async getBestModel(ticker: string): Promise<BestModelResponse> {
    return firstValueFrom(
      this.http.get<BestModelResponse>(`${this.baseUrl}/predictions/${ticker}/best-model`)
    );
  }

  async getCompanyInfo(ticker: string): Promise<any> {
    return firstValueFrom(
      this.http.get<any>(`${this.baseUrl}/companies/${ticker}/info`)
    );
  }
}
