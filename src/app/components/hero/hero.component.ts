import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section id="hero">
      <div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div>
      <div class="retro-grid"></div>
      <div class="vw-grid"></div>
      <div class="vw-sun"></div>

      <div class="hero-tag">
        <span class="dot"></span>
        Mastère Architecture Logicielle · Disponible
      </div>

      <h1>
        <span class="line">Guilhem</span>
        <span class="line accent1">COULY</span>
        <span class="line sub gradient-text">Développeur Full-Stack</span>
      </h1>

      <p class="hero-desc">
        Développeur passionné, spécialisé en architecture logicielle avec une appétence
        pour le développement mobile. Actuellement en alternance au CEA Grenoble,
        je cherche à rejoindre une équipe ambitieuse.
      </p>

      <div class="hero-ctas">
        <a href="#projects" class="btn btn-primary">Voir mes projets</a>
        <a href="#contact" class="btn btn-outline">Me contacter →</a>
        <a href="mailto:couly.guilhem@gmail.com" class="btn btn-accent3">couly.guilhem&#64;gmail.com</a>
      </div>

      <div class="hero-stack">
        @for (t of stack; track t) { <span class="stack-badge">{{ t }}</span> }
      </div>

      <div class="hero-scroll"><span class="scroll-line"></span><span>Scroll</span></div>
    </section>
  `,
  styles: [`
    section {
      min-height:100vh; display:flex; flex-direction:column; justify-content:center;
      padding:8rem 2.5rem 4rem; position:relative; overflow:hidden;
    }

    /* Modern blobs */
    .blob { position:absolute; border-radius:50%; filter:blur(90px); opacity:.15; pointer-events:none; transition:opacity .4s; }
    .b1{width:550px;height:550px;background:var(--accent2);top:-120px;right:-120px;}
    .b2{width:420px;height:420px;background:var(--accent1);bottom:-100px;left:-100px;}
    .b3{width:320px;height:320px;background:var(--accent3);top:35%;left:42%;}
    [data-theme="retro"]     .blob { opacity:0; }
    [data-theme="vaporwave"] .blob { opacity:0; }

    /* Retro grid */
    .retro-grid {
      position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .4s;
      background-image:linear-gradient(rgba(0,80,179,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(0,80,179,.12) 1px,transparent 1px);
      background-size:40px 40px;
    }
    [data-theme="retro"] .retro-grid { opacity:1; }

    /* Vaporwave grid + sun */
    .vw-grid {
      position:absolute;bottom:0;left:0;right:0;height:45%;pointer-events:none;opacity:0;transition:opacity .4s;
      background-image:
        linear-gradient(rgba(160,32,240,.3) 1px,transparent 1px),
        linear-gradient(90deg,rgba(160,32,240,.15) 1px,transparent 1px);
      background-size:60px 30px;
      transform:perspective(300px) rotateX(45deg);
      transform-origin:bottom;
    }
    [data-theme="vaporwave"] .vw-grid { opacity:1; }
    .vw-sun {
      position:absolute;bottom:40%;left:50%;transform:translateX(-50%);
      width:220px;height:110px;border-radius:110px 110px 0 0;
      background:linear-gradient(180deg,#ff2d9b 0%,#a020f0 50%,transparent 100%);
      opacity:0;transition:opacity .4s;pointer-events:none;
      box-shadow:0 0 60px rgba(255,45,155,.5),0 0 120px rgba(160,32,240,.3);
    }
    [data-theme="vaporwave"] .vw-sun { opacity:.7; }

    .hero-tag {
      display:inline-flex;align-items:center;gap:10px;
      background:rgba(0,80,179,.08);border:2px solid rgba(0,80,179,.28);
      color:var(--accent2);font-size:.8rem;font-family:var(--font-body);
      font-weight:500;letter-spacing:.08em;text-transform:uppercase;
      padding:7px 16px;border-radius:var(--radius);margin-bottom:2rem;width:fit-content;
    }
    [data-theme="vaporwave"] .hero-tag {
      background:rgba(0,245,255,.08);border-color:rgba(0,245,255,.3);
      color:var(--accent3);box-shadow:0 0 10px rgba(0,245,255,.2);
    }
    .dot{width:7px;height:7px;background:var(--accent3);border-radius:50%;animation:pulse 2s infinite;}
    @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.75)}}

    h1 {
      font-family:var(--font-display);line-height:1;
      font-size:clamp(2.8rem,9vw,7rem);font-weight:800;
      letter-spacing:-.02em;margin-bottom:1.8rem;display:flex;flex-direction:column;
    }
    [data-theme="retro"]     h1 { font-size:clamp(3rem,9vw,7.5rem);letter-spacing:.02em; }
    [data-theme="vaporwave"] h1 { font-size:clamp(2rem,6vw,5rem);letter-spacing:.06em; }

    .line { display:block; }
    .accent1 { color:var(--accent1); }
    .sub { font-size:clamp(1.2rem,3.5vw,2.2rem); }
    [data-theme="retro"]     .sub { font-size:clamp(1rem,2.5vw,1.6rem);color:var(--accent2); }
    [data-theme="vaporwave"] .sub { font-size:clamp(.9rem,2.2vw,1.4rem);color:var(--accent3); }

    .gradient-text {
      background:linear-gradient(90deg,var(--accent2),var(--accent3));
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }
    [data-theme="retro"] .gradient-text { background:none;-webkit-text-fill-color:var(--accent2);color:var(--accent2); }
    [data-theme="vaporwave"] .gradient-text {
      background:linear-gradient(90deg,var(--accent3),var(--accent1));
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
      filter:drop-shadow(0 0 8px rgba(0,245,255,.4));
    }

    .hero-desc { max-width:540px;color:var(--muted);font-size:1rem;margin-bottom:2.5rem;font-family:var(--font-body); }

    .hero-ctas { display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:2.5rem; }

    .hero-stack { display:flex;flex-wrap:wrap;gap:8px; }
    .stack-badge {
      font-size:.75rem;padding:4px 12px;border-radius:var(--radius);
      background:var(--surface);border:var(--pixel-border);color:var(--muted);font-family:var(--font-body);
    }
    [data-theme="vaporwave"] .stack-badge { border-color:var(--accent2);background:rgba(160,32,240,.1);color:var(--accent3); }

    .hero-scroll { position:absolute;bottom:2.5rem;left:2.5rem;display:flex;align-items:center;gap:10px;color:var(--muted);font-size:.78rem;letter-spacing:.06em; }
    .scroll-line { display:block;width:40px;height:1px;background:var(--muted);animation:scrollAnim 2s infinite; }
    @keyframes scrollAnim{0%,100%{width:40px;opacity:1}50%{width:18px;opacity:.4}}

    @media(max-width:600px) { section{padding:6rem 1.25rem 3rem;} .hero-scroll{left:1.25rem;} }
  `]
})
export class HeroComponent {
  ts = inject(ThemeService);
  stack = ['Angular','TypeScript','React','Flutter','Python','Node.js','Docker','Git','SCRUM'];
}
