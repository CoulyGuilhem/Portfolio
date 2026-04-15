import { Component, inject, OnInit } from '@angular/core';
import { NavComponent } from './components/nav/nav.component';
import { HeroComponent } from './components/hero/hero.component';
import { ExperiencesComponent } from './components/experiences/experiences.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { FootballGameComponent } from './components/football-game/football-game.component';
import { CyclingGameComponent } from './components/cycling-game/cycling-game.component';
import { ContactComponent } from './components/contact/contact.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NavComponent, HeroComponent, ExperiencesComponent,
    ProjectsComponent, FootballGameComponent, CyclingGameComponent, ContactComponent
  ],
  template: `
    <app-nav></app-nav>
    <main>
      <app-hero></app-hero>
      <app-experiences></app-experiences>
      <app-projects></app-projects>
      <app-football-game></app-football-game>
      <app-cycling-game></app-cycling-game>
      <app-contact></app-contact>
    </main>
    <footer>
      <span class="f-logo">[GC] Guilhem Couly</span>
      <span class="f-copy">{{ year }} · Made with Angular & ☕</span>
    </footer>
  `,
  styles: [`
    footer {
      padding:1.8rem 2.5rem;
      border-top:var(--pixel-border);
      display:flex; justify-content:space-between; align-items:center;
      flex-wrap:wrap; gap:1rem;
      color:var(--muted); font-size:.82rem; font-family:var(--font-body);
    }
    [data-theme="modern"] footer { border-top:1px solid var(--border); }
    .f-logo { font-family:var(--font-display); font-size:1.1rem; color:var(--accent1); }
  `]
})
export class AppComponent implements OnInit {
  ts = inject(ThemeService);
  year = new Date().getFullYear();

  ngOnInit() {
    // Apply saved/default theme immediately
    document.documentElement.setAttribute('data-theme', this.ts.theme());
  }
}
