import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section id="contact">
      <p class="section-label">> Contact_</p>
      <h2 class="section-title">Travaillons ensemble</h2>
      <p class="intro">
        Mastère Architecture Logicielle en poche, je recherche de nouvelles opportunités
        en développement logiciel ou mobile. Réponse sous 24h garantie !
      </p>

      <div class="contact-grid">
        @for (item of contacts; track item.label) {
          <a [href]="item.url" [target]="item.ext ? '_blank' : '_self'" class="citem">
            <div class="cicon" [class]="item.cls">
              <svg [innerHTML]="item.svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"></svg>
            </div>
            <div class="ctext">
              <span class="clabel">{{ item.label }}</span>
              <span class="cval">{{ item.value }}</span>
            </div>
            <span class="carrow">→</span>
          </a>
        }
      </div>

      <div class="skills-wrap">
        <p class="section-label" style="margin-top:3rem">> Skills_</p>
        <div class="skills-cats">
          @for (cat of skills; track cat.label) {
            <div class="scat">
              <div class="scat-label">{{ cat.label }}</div>
              <div class="stags">
                @for (s of cat.items; track s) { <span class="tag">{{ s }}</span> }
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    section { background:var(--surface); }
    .intro { color:var(--muted); font-size:.95rem; max-width:540px; margin-bottom:3rem; font-family:var(--font-body); }

    .contact-grid { max-width:580px; display:flex; flex-direction:column; gap:1rem; }

    .citem {
      display:flex; align-items:center; gap:1.2rem; padding:1.1rem 1.4rem;
      background:var(--surface2); border:var(--pixel-border);
      text-decoration:none; color:var(--text);
      transition:transform .18s, box-shadow .18s, border-color .18s;
      &:hover { transform:translateX(6px); box-shadow:var(--shadow-pixel); .carrow { transform:translateX(4px); } }
    }
    [data-theme="modern"]    .citem { border-radius:var(--radius); border:1px solid var(--border); &:hover { box-shadow:none; border-color:rgba(255,255,255,.2); } }
    [data-theme="vaporwave"] .citem { border-color:var(--accent2); &:hover { border-color:var(--accent3); box-shadow:0 0 16px rgba(0,245,255,.2); } }

    .cicon { width:42px; height:42px; display:flex; align-items:center; justify-content:center; flex-shrink:0; border:var(--pixel-border); }
    [data-theme="modern"]    .cicon { border:none; border-radius:10px; }
    [data-theme="vaporwave"] .cicon { border-color:var(--accent2); }
    .ci-mail   { background:rgba(212,56,13,.1);  color:var(--accent1); }
    .ci-github { background:rgba(0,80,179,.1);   color:var(--accent2); }
    .ci-link   { background:rgba(212,177,6,.1);  color:var(--accent4); }
    [data-theme="vaporwave"] .ci-mail   { background:rgba(255,45,155,.1);  color:var(--accent1); }
    [data-theme="vaporwave"] .ci-github { background:rgba(160,32,240,.1);  color:var(--accent2); }

    .ctext { display:flex; flex-direction:column; gap:1px; flex:1; }
    .clabel { font-size:.7rem; color:var(--muted); text-transform:uppercase; letter-spacing:.08em; font-family:var(--font-body); }
    .cval   { font-weight:500; font-size:.92rem; font-family:var(--font-body); }
    .carrow { color:var(--muted); font-size:1.1rem; transition:transform .18s; }

    .skills-cats { display:flex; flex-direction:column; gap:1.5rem; max-width:680px; }
    .scat-label { font-family:var(--font-display); font-size:1rem; color:var(--accent1); margin-bottom:.6rem; }
    [data-theme="retro"]     .scat-label { font-size:1.2rem; text-transform:uppercase; }
    [data-theme="vaporwave"] .scat-label { color:var(--accent3); text-shadow:0 0 6px rgba(0,245,255,.4); }
    .stags { display:flex; flex-wrap:wrap; gap:8px; }
  `]
})
export class ContactComponent {
  contacts = [
    {
      label:'Email', value:'couly.guilhem@gmail.com',
      url:'mailto:couly.guilhem@gmail.com', cls:'ci-mail', ext:false,
      svg:'<path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>'
    },
    {
      label:'GitHub', value:'github.com/CoulyGuilhem',
      url:'https://github.com/CoulyGuilhem', cls:'ci-github', ext:true,
      svg:'<path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>'
    },
  ];

  skills = [
    { label:'Frontend / Mobile', items:['Angular','React','TypeScript','Flutter (Dart)','Ionic','HTML/CSS'] },
    { label:'Backend & Systèmes', items:['Node.js','Python (PyQT, Tkinter)','Java (JavaFX)','C / C#','Kotlin','PHP / SQL'] },
    { label:'DevOps & Méthodes', items:['Git','Docker','Tuleap','SCRUM','Design Patterns','POO','ISTQB'] },
    { label:'Langue', items:['Anglais B2 — TOEIC 925/990'] },
  ];
}
