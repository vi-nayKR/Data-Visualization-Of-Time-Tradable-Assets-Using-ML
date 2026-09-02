import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'analysis',
    loadComponent: () => import('./features/data-analysis/data-analysis.component').then(m => m.DataAnalysisComponent)
  },
  {
    path: 'prediction',
    loadComponent: () => import('./features/prediction/prediction.component').then(m => m.PredictionComponent)
  },
  {
    path: 'best-analysis',
    loadComponent: () => import('./features/best-analysis/best-analysis.component').then(m => m.BestAnalysisComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
