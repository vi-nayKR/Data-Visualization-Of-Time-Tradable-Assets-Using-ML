import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-model-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="isWinner() 
           ? 'bg-[#1e222d] border-[#089981] shadow-lg shadow-[#089981]/10' 
           : 'bg-[#181b24] border-[#2a2e39] hover:border-[#363a45]'"
         class="relative rounded-lg border p-4 text-center transition-all flex flex-col justify-between">
      
      @if (isWinner()) {
        <span class="absolute -top-2.5 right-3 bg-[#089981] text-white font-bold text-[9px] tracking-wider uppercase px-2 py-0.5 rounded shadow">
          TOP STRATEGY 🏆
        </span>
      }

      <div class="text-[11px] font-semibold text-[#787b86] uppercase tracking-wider mb-2 truncate">
        {{ name() }}
      </div>

      <div class="text-2xl font-mono font-extrabold my-1"
           [class]="isWinner() ? 'text-[#089981]' : 'text-white'">
        {{ score() <= -900 ? 'N/A' : (score() * 100).toFixed(2) + '%' }}
      </div>

      <div class="w-full bg-[#131722] h-1.5 rounded-full overflow-hidden mt-2">
        <div [style.width.%]="score() > 0 ? Math.min(100, score() * 100) : 0"
             [class]="isWinner() ? 'bg-[#089981]' : 'bg-[#2962ff]'"
             class="h-full transition-all duration-500">
        </div>
      </div>
      
      <div class="text-[10px] text-[#787b86] font-mono mt-2">R² Accuracy Metric</div>
    </div>
  `
})
export class ModelCardComponent {
  name = input.required<string>();
  score = input.required<number>();
  isWinner = input<boolean>(false);
  Math = Math;
}
