import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-model-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="isWinner() 
           ? 'bg-gradient-to-br from-green-950/80 to-emerald-950/80 border-green-500 shadow-xl shadow-green-500/10' 
           : 'bg-slate-800/60 border-slate-700/60'"
         class="relative rounded-2xl border-2 p-5 text-center transition-all hover:scale-105">
      @if (isWinner()) {
        <span class="absolute -top-3 right-4 bg-green-500 text-slate-950 font-black text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full">
          WINNER 🏆
        </span>
      }
      <div class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 truncate">
        {{ name() }}
      </div>
      <div class="text-3xl font-extrabold font-mono"
           [class]="isWinner() ? 'text-green-300' : 'text-slate-100'">
        {{ score() <= -900 ? 'N/A' : (score() * 100).toFixed(2) + '%' }}
      </div>
      <div class="text-xs text-slate-400 mt-2">R² Accuracy Score</div>
    </div>
  `
})
export class ModelCardComponent {
  name = input.required<string>();
  score = input.required<number>();
  isWinner = input<boolean>(false);
}
