import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'retro' | 'modern' | 'vaporwave';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly KEY = 'portfolio-theme';
  theme = signal<Theme>(this.load());

  constructor() {
    effect(() => {
      const t = this.theme();
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem(this.KEY, t);
    });
  }

  set(t: Theme) { this.theme.set(t); }

  private load(): Theme {
    return (localStorage.getItem(this.KEY) as Theme) ?? 'vaporwave';
  }
}
