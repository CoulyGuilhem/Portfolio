import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-experiences',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section id="experiences">
      <p class="section-label">> Parcours_</p>
      <h2 class="section-title">Expériences</h2>

      <div class="timeline">
        @for (exp of experiences; track exp.company; let i = $index) {
          <div class="exp-item">
            <div class="exp-date">{{ exp.period }}</div>
            <div class="exp-connector">
              <div class="dot"></div>
              <div class="line"></div>
            </div>
            <div class="exp-content">
              <div class="exp-role">{{ exp.role }}</div>
              <div class="exp-company">{{ exp.company }}</div>
              <p class="exp-desc">{{ exp.description }}</p>
              <div class="exp-tags">
                @for (tag of exp.tags; track tag) {
                  <span class="tag">{{ tag }}</span>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    section { background:var(--surface); }

    .section-label { font-family:var(--font-body); }
    [data-theme="modern"] .section-label { font-family:var(--font-display); }

    .timeline { max-width:820px; }

    .exp-item {
      display:grid; grid-template-columns:160px 36px 1fr; gap:0 1rem;
      padding-bottom:3rem;
      &:last-child { padding-bottom:0; }
      &:last-child .line { display:none; }
    }

    .exp-date { color:var(--muted); font-size:.78rem; padding-top:3px; font-family:var(--font-body); text-align:right; }

    .exp-connector { display:flex; flex-direction:column; align-items:center; }
    .dot {
      width:14px; height:14px; border-radius:var(--radius);
      background:var(--accent1); border:2px solid var(--bg);
      box-shadow:0 0 0 2px var(--accent1); flex-shrink:0; margin-top:3px;
    }
    [data-theme="retro"] .dot { border-radius:0; width:12px; height:12px; }
    .line { width:2px; flex:1; background:var(--border); min-height:40px; margin-top:4px; }

    .exp-content { padding-left:.5rem; }
    .exp-role { font-family:var(--font-display); font-weight:700; font-size:1.2rem; margin-bottom:.2rem; }
    [data-theme="retro"] .exp-role { font-size:1.5rem; text-transform:uppercase; color:var(--text); }
    .exp-company { color:var(--accent2); font-size:.88rem; font-weight:600; margin-bottom:.8rem; font-family:var(--font-body); text-transform:uppercase; letter-spacing:.04em; }
    .exp-desc { color:var(--muted); font-size:.9rem; margin-bottom:1rem; font-family:var(--font-body); }
    .exp-tags { display:flex; flex-wrap:wrap; gap:8px; }

    @media(max-width:600px) {
      .exp-item { grid-template-columns:1fr; padding-left:1.5rem; border-left:2px solid var(--border); position:relative;
        &::before { content:''; position:absolute; left:-7px; top:3px; width:12px; height:12px; background:var(--accent1); }
      }
      .exp-date { text-align:left; color:var(--accent3); font-size:.75rem; }
      .exp-connector { display:none; }
    }
  `]
})
export class ExperiencesComponent {
  experiences = [
    {
      period: 'Oct. 2023 — Sept. 2025',
      role: 'Développeur — Alternance',
      company: 'CEA · Grenoble',
      description: 'Gestion des codes et environnements de programmation. Mise en place d\'un environnement de code avec Tuleap. Réalisation d\'une librairie de pilotage d\'instrument en Python. Développement d\'une interface de pilotage de microscope.',
      tags: ['Python', 'Tuleap', 'Git', 'Docker', 'PyQT']
    },
    {
      period: 'Oct. 2021 — Août 2022',
      role: 'Développeur Full-Stack — Alternance',
      company: 'AGP · Domène',
      description: 'Développement sur l\'application mobile et le site web de Politeia France (suivi de l\'actualité des collectivités). Ajout de fonctionnalités : export PDF, upload/gestion de fichiers, conversion HTML → widget Flutter.',
      tags: ['Flutter', 'Dart', 'React', 'TypeScript', 'Angular']
    },
    {
      period: 'Été 2021',
      role: 'Développeur Android — Stage IUT',
      company: 'Symotronic · Villeurbanne',
      description: 'Stage de 10 semaines. Réalisation de la structure d\'un nouveau projet d\'application Android natif.',
      tags: ['Kotlin', 'Android', 'Java']
    },
    {
      period: 'Été 2020–2021',
      role: 'Emplois d\'été',
      company: 'Centre des Finances Publiques · Isère',
      description: 'Vacataire au Centre des Finances Publiques d\'Échirolles (2020) puis au Service des Impôts des Entreprises de Grenoble (2021).',
      tags: ['Administration', 'Gestion']
    }
  ];
}
