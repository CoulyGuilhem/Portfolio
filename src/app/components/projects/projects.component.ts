import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section id="projects">
      <p class="section-label">> Réalisations_</p>
      <h2 class="section-title">Projets</h2>

      <div class="projects-grid">
        @for (p of projects; track p.title) {
          <div class="pcard" [class]="p.accent">
            <div class="pcard-top"></div>
            <div class="picon" [class]="p.iconBg">{{ p.icon }}</div>
            <h3 class="ptitle">{{ p.title }}</h3>
            <p class="pdesc">{{ p.description }}</p>
            <div class="ptags">
              @for (tag of p.tags; track tag) { <span class="tag">{{ tag }}</span> }
            </div>
            <div class="pfoot">
              @if (p.githubUrl) {
                <a [href]="p.githubUrl" target="_blank" class="plink github-link">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                  GitHub
                </a>
              }
              @if (!p.githubUrl && p.confidential) {
                <span class="plink confidential">🔒 Projet confidentiel</span>
              }
            </div>
          </div>
        }
      </div>

      <!-- Formations -->
      <div class="formations">
        <p class="section-label" style="margin-top:4rem">> Formations_</p>
        <h2 class="section-title">Diplômes & Certifications</h2>
        <div class="formations-grid">
          @for (f of formations; track f.title) {
            <div class="fcard">
              <span class="fyear">{{ f.year }}</span>
              <div class="ftitle">{{ f.title }}</div>
              <div class="fschool">{{ f.school }}</div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    section { background:var(--bg); }

    .projects-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1.5rem; }

    .pcard {
      background:var(--surface); border:var(--pixel-border); padding:1.8rem;
      position:relative; overflow:hidden;
      transition:transform .2s, box-shadow .2s;
      display:flex; flex-direction:column;
      &:hover { transform:translateY(-4px); box-shadow:var(--shadow-pixel); .pcard-top { width:100%; } }
    }
    [data-theme="modern"]    .pcard { border-radius:var(--radius); border:1px solid var(--border); &:hover { box-shadow:none; border-color:rgba(255,255,255,.16); } }
    [data-theme="vaporwave"] .pcard { border-color:var(--accent2); &:hover { box-shadow:0 0 24px rgba(160,32,240,.35); border-color:var(--accent3); } }

    .pcard-top { position:absolute; top:0; left:0; height:4px; width:40%; transition:width .4s ease; }
    [data-theme="modern"] .pcard-top { height:3px; border-radius:2px; }
    .ac-orange .pcard-top { background:var(--accent1); }
    .ac-blue   .pcard-top { background:var(--accent2); }
    .ac-green  .pcard-top { background:var(--accent3); }
    .ac-yellow .pcard-top { background:var(--accent4); }
    [data-theme="vaporwave"] .ac-orange .pcard-top { background:linear-gradient(90deg,var(--accent1),var(--accent2)); }
    [data-theme="vaporwave"] .ac-blue   .pcard-top { background:linear-gradient(90deg,var(--accent2),var(--accent3)); }
    [data-theme="vaporwave"] .ac-green  .pcard-top { background:linear-gradient(90deg,var(--accent3),var(--accent1)); }
    [data-theme="vaporwave"] .ac-yellow .pcard-top { background:linear-gradient(90deg,var(--accent4),var(--accent2)); }

    .picon {
      width:48px; height:48px; display:flex; align-items:center; justify-content:center; font-size:1.5rem;
      margin-bottom:1.2rem; border:var(--pixel-border); background:var(--surface2);
    }
    [data-theme="modern"] .picon { border-radius:12px; border:none; }
    [data-theme="vaporwave"] .picon { border-color:var(--accent2); background:rgba(160,32,240,.1); }
    .bg-orange { background:rgba(212,56,13,.12) !important; }
    .bg-blue   { background:rgba(0,80,179,.12) !important; }
    .bg-green  { background:rgba(35,120,4,.12) !important; }
    .bg-yellow { background:rgba(212,177,6,.12) !important; }

    .ptitle { font-family:var(--font-display); font-weight:700; font-size:1.15rem; margin-bottom:.5rem; }
    [data-theme="retro"]     .ptitle { font-size:1.4rem; text-transform:uppercase; }
    [data-theme="vaporwave"] .ptitle { letter-spacing:.04em; }
    .pdesc { color:var(--muted); font-size:.88rem; flex:1; margin-bottom:1rem; font-family:var(--font-body); }
    .ptags { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:1.2rem; }

    .pfoot { border-top:var(--pixel-border); padding-top:.8rem; display:flex; gap:1rem; flex-wrap:wrap; align-items:center; }
    [data-theme="modern"]    .pfoot { border-top:1px solid var(--border); }
    [data-theme="vaporwave"] .pfoot { border-top-color:var(--accent2); }

    .plink {
      display:flex; align-items:center; gap:5px; font-size:.78rem; color:var(--muted);
      text-decoration:none; font-family:var(--font-body); text-transform:uppercase; letter-spacing:.04em;
      transition:color .2s;
      &:hover { color:var(--accent1); }
    }
    [data-theme="vaporwave"] .plink:hover { color:var(--accent3); text-shadow:0 0 6px var(--accent3); }
    .confidential { cursor:default; font-size:.75rem; color:var(--muted); opacity:.6; }

    /* Formations */
    .formations-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:1rem; }
    .fcard {
      background:var(--surface); border:var(--pixel-border); padding:1.2rem 1.5rem;
      display:flex; flex-direction:column; gap:.3rem;
      transition:transform .15s, box-shadow .15s;
      &:hover { transform:translateY(-3px); box-shadow:var(--shadow-pixel); }
    }
    [data-theme="modern"]    .fcard { border-radius:var(--radius); border:1px solid var(--border); &:hover { box-shadow:none; } }
    [data-theme="vaporwave"] .fcard { border-color:var(--accent2); &:hover { box-shadow:0 0 14px rgba(160,32,240,.3); } }
    .fyear  { font-size:.72rem; color:var(--accent1); text-transform:uppercase; letter-spacing:.1em; font-family:var(--font-body); }
    [data-theme="vaporwave"] .fyear { color:var(--accent3); }
    .ftitle { font-family:var(--font-display); font-weight:700; font-size:1.05rem; }
    [data-theme="retro"]     .ftitle { font-size:1.2rem; text-transform:uppercase; }
    [data-theme="vaporwave"] .ftitle { letter-spacing:.03em; }
    .fschool { font-size:.82rem; color:var(--muted); font-family:var(--font-body); }
  `]
})
export class ProjectsComponent {
  projects = [
    {
      icon: '🗃️',
      title: 'Lockerz — Gestion de casiers',
      description: 'Application mobile Flutter développée pour l\'ESGI permettant la gestion et la réservation de casiers étudiants.',
      tags: ['Flutter', 'Dart'],
      githubUrl: 'https://github.com/HugoM38/lockerz',
      confidential: false,
      accent: 'ac-blue', iconBg: 'bg-blue'
    },
    {
      icon: '🏷️',
      title: 'InfoTag',
      description: 'Application Ionic de gestion et consultation de tags d\'information. Interface mobile cross-platform développée à l\'ESGI.',
      tags: ['Ionic', 'TypeScript', 'Angular'],
      githubUrl: 'https://github.com/CoulyGuilhem/InfoTag',
      confidential: false,
      accent: 'ac-orange', iconBg: 'bg-orange'
    },
    {
      icon: '🧠',
      title: 'Snake Deep Learning',
      description: 'Agent IA entraîné par deep reinforcement learning pour jouer au Snake. Réseau de neurones qui apprend à maximiser son score de façon autonome.',
      tags: ['Python', 'Deep Learning', 'PyTorch', 'Reinforcement Learning'],
      githubUrl: 'https://github.com/CoulyGuilhem/Snake_DeepLearning',
      confidential: false,
      accent: 'ac-green', iconBg: 'bg-green'
    },
    {
      icon: '🔬',
      title: 'Pilotage de microscope — CEA',
      description: 'Interface de contrôle d\'instruments de laboratoire développée en alternance au CEA. Librairie Python de pilotage et GUI de microscope.',
      tags: ['Python', 'PyQT', 'Tuleap'],
      githubUrl: null,
      confidential: true,
      accent: 'ac-yellow', iconBg: 'bg-yellow'
    }
  ];

  formations = [
    { year:'2023–2025', title:'Mastère Architecture Logicielle',         school:'ESGI · Grenoble' },
    { year:'2023',      title:'Certification ISTQB — Testeur logiciel',   school:'EPSI · Saint-Martin-d\'Hères' },
    { year:'2023',      title:'Formation Testeur logiciel',               school:'EPSI · Saint-Martin-d\'Hères' },
    { year:'2021–2022', title:'Licence Pro SMIN',                         school:'IUT1 · Grenoble' },
    { year:'2019–2021', title:'DUT Informatique',                         school:'IUT · Rodez' },
    { year:'2018–2019', title:'Bac S · Science de l\'Ingénieur + MOOC ANSSI', school:'Lycée Vaucanson · Grenoble' },
  ];
}
