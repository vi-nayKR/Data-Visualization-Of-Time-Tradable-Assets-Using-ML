import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-model-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="isWinner() 
           ? 'bg-[#1e222d] border-[#089981] shadow-xl shadow-[#089981]/10 ring-1 ring-[#089981]/50' 
           : 'bg-[#181b24] border-[#2a2e39] hover:border-[#363c4e]'"
         class="relative rounded-lg border p-4 text-center transition-all flex flex-col justify-between">
      
      @if (isWinner()) {
        <span class="absolute -top-2.5 right-3 bg-[#089981] text-white font-bold text-[9px] tracking-wider uppercase px-2 py-0.5 rounded shadow flex items-center gap-1">
          <svg class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          TOP STRATEGY
        </span>
      }

      <div class="text-xs font-bold text-[#9db2c6] uppercase tracking-wider mb-2 truncate">
        {{ name() }}
      </div>

      <div class="text-2xl font-mono-num font-extrabold my-1"
           [class]="isWinner() ? 'text-[#089981]' : 'text-white'">
        {{ score() <= -900 ? 'N/A' : (score() * 100).toFixed(2) + '%' }}
      </div>

      <div class="w-full bg-[#131722] h-2 rounded-full overflow-hidden mt-2">
        <div [style.width.%]="score() > 0 ? Math.min(100, score() * 100) : 0"
             [class]="isWinner() ? 'bg-[#089981]' : 'bg-[#2962ff]'"
             class="h-full transition-all duration-500 rounded-full">
        </div>
      </div>
      
      <div class="text-[11px] text-[#9db2c6] font-mono-num mt-2 font-medium">R² Accuracy Metric</div>
    </div>
  `
})
export class ModelCardComponent {
  name = input.required<string>();
  score = input.required<number>();
  isWinner = input<boolean>(false);
  Math = Math;
}
