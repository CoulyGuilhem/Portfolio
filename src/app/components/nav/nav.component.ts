import { Component, HostListener, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav [class.scrolled]="scrolled()">
      <div class="nav-logo">
        <span class="bracket">[</span>GC<span class="bracket">]</span>
      </div>
      <ul class="nav-links">
        <li><a href="#experiences">Expériences</a></li>
        <li><a href="#projects">Projets</a></li>
        <li><a href="#hobbies">Intérêts</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
      <div class="nav-right">
        <div class="theme-switcher">
          <button class="tbtn" [class.active]="ts.theme()==='retro'"     (click)="ts.set('retro')">👾 Rétro</button>
          <button class="tbtn" [class.active]="ts.theme()==='modern'"    (click)="ts.set('modern')">🌙 Modern</button>
          <button class="tbtn" [class.active]="ts.theme()==='vaporwave'" (click)="ts.set('vaporwave')">🌸 Vaporwave</button>
        </div>
        <button class="burger" (click)="open.set(!open())"><span></span><span></span><span></span></button>
      </div>
      <div class="mob-menu" [class.open]="open()">
        <a href="#experiences" (click)="open.set(false)">Expériences</a>
        <a href="#projects"    (click)="open.set(false)">Projets</a>
        <a href="#hobbies"     (click)="open.set(false)">Intérêts</a>
        <a href="#contact"     (click)="open.set(false)">Contact</a>
        <div class="mob-theme">
          <button class="tbtn" [class.active]="ts.theme()==='retro'"     (click)="ts.set('retro')">👾 Rétro</button>
          <button class="tbtn" [class.active]="ts.theme()==='modern'"    (click)="ts.set('modern')">🌙 Modern</button>
          <button class="tbtn" [class.active]="ts.theme()==='vaporwave'" (click)="ts.set('vaporwave')">🌸 Vapor</button>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    nav {
      position: fixed; top:0; left:0; right:0; z-index:100;
      display:flex; justify-content:space-between; align-items:center;
      padding:1rem 2.5rem;
      transition: background .3s, border-color .3s, box-shadow .3s;
      border-bottom: 2px solid transparent;
    }
    nav.scrolled { background:var(--bg); border-bottom-color:var(--text); }
    [data-theme="modern"]    nav.scrolled { background:rgba(13,13,13,.92); backdrop-filter:blur(14px); border-bottom-color:var(--border); }
    [data-theme="vaporwave"] nav.scrolled { background:rgba(10,0,21,.92); backdrop-filter:blur(14px); border-bottom-color:var(--accent2); box-shadow:0 1px 20px rgba(160,32,240,.25); }

    .nav-logo { font-family:var(--font-display); font-size:1.6rem; font-weight:800; letter-spacing:.05em; }
    .bracket { color:var(--accent1); }
    [data-theme="vaporwave"] .bracket { color:var(--accent3); text-shadow:0 0 8px var(--accent3); }

    .nav-links { display:flex; gap:2rem; list-style:none;
      a { text-decoration:none; color:var(--muted); font-size:.82rem; text-transform:uppercase; letter-spacing:.08em; font-family:var(--font-body); transition:color .2s;
        &:hover { color:var(--accent1); }
      }
    }
    [data-theme="vaporwave"] .nav-links a:hover { color:var(--accent3); text-shadow:0 0 8px var(--accent3); }

    .nav-right { display:flex; align-items:center; gap:1rem; }

    .theme-switcher { display:flex; background:var(--surface); border:var(--pixel-border); overflow:hidden; }
    [data-theme="modern"]    .theme-switcher { border-radius:999px; border:1px solid var(--border); }
    [data-theme="vaporwave"] .theme-switcher { border-color:var(--accent2); box-shadow:0 0 10px rgba(160,32,240,.3); }

    .tbtn {
      padding:5px 12px; font-family:var(--font-body); font-size:.7rem; text-transform:uppercase; letter-spacing:.04em;
      border:none; background:transparent; color:var(--muted); cursor:pointer; transition:background .2s,color .2s; white-space:nowrap;
      &.active { background:var(--accent1); color:#fff; }
      &:not(.active):hover { color:var(--text); }
    }
    [data-theme="modern"]    .tbtn.active { background:var(--accent2); }
    [data-theme="vaporwave"] .tbtn.active { background:linear-gradient(90deg,var(--accent1),var(--accent2)); box-shadow:0 0 10px rgba(255,45,155,.5); color:#fff; }

    .burger { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:4px;
      span { display:block; width:24px; height:2px; background:var(--text); } }

    .mob-menu {
      display:none; position:fixed; top:58px; left:0; right:0;
      background:var(--bg); border-bottom:var(--pixel-border);
      flex-direction:column; padding:1.5rem 2rem; gap:1.2rem; z-index:99;
      &.open { display:flex; }
      a { text-decoration:none; color:var(--text); font-size:1rem; text-transform:uppercase; letter-spacing:.06em; font-family:var(--font-body); }
    }
    .mob-theme { display:flex; gap:8px; flex-wrap:wrap; padding-top:.8rem; border-top:2px solid var(--border); }

    @media(max-width:900px) {
      .nav-links { display:none; }
      .burger { display:flex; }
      .theme-switcher { display:none; }
      nav { padding:1rem 1.25rem; }
    }
  `]
})
export class NavComponent {
  ts = inject(ThemeService);
  scrolled = signal(false);
  open = signal(false);
  @HostListener('window:scroll') onScroll() { this.scrolled.set(window.scrollY > 40); }
}
