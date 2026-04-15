import {
  Component, ElementRef, ViewChild, AfterViewInit,
  OnDestroy, signal, NgZone, inject, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-cycling-game',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="section">
      <div class="hobby-header">
        <span class="emoji">🚴</span>
        <div>
          <p class="section-label">> Sport_</p>
          <h2 class="section-title" style="margin-bottom:.4rem">Vélo · Mountain Rider</h2>
          <p class="hint">Maintenez clic / ↑ pour accélérer · Atterrissez droit !</p>
        </div>
      </div>
      <div class="game-wrap">
        <canvas #canvas class="game-canvas" [width]="W" [height]="H"
          (mousedown)="setGas(true)" (mouseup)="setGas(false)"
          (mouseleave)="setGas(false)"
          (touchstart)="setGas(true);$event.preventDefault()"
          (touchend)="setGas(false)"
          (keydown.ArrowUp)="setGas(true)" (keyup.ArrowUp)="setGas(false)"
          tabindex="0">
        </canvas>
        <div class="hud">
          <div class="hi"><span class="hl">Distance</span><span class="hv c1">{{ dist() }} m</span></div>
          <div class="hi"><span class="hl">Record</span><span class="hv c3">{{ best() }} m</span></div>
          <div class="hi"><span class="hl">Vitesse</span><span class="hv">{{ spd() }} km/h</span></div>
        </div>
        @if (!running()&&!over()) {
          <button class="btn btn-accent3 start-btn" (click)="start()">▶ Démarrer</button>
        }
        @if (over()) {
          <div class="over">
            <p class="over-t">Crash ! 💥</p>
            <p class="over-d">{{ dist() }} mètres parcourus</p>
            @if (newRec()) { <p class="over-r">🏆 Nouveau record !</p> }
            <button class="btn btn-primary" (click)="start()">Rejouer</button>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .section { background:var(--bg); padding:6rem 2.5rem; }
    .hobby-header { display:flex; align-items:flex-start; gap:1.5rem; margin-bottom:2.5rem; }
    .emoji { font-size:3rem; line-height:1; }
    .hint { color:var(--muted); font-size:.88rem; font-family:var(--font-body); }
    .game-wrap { max-width:700px; position:relative; display:flex; flex-direction:column; align-items:center; gap:1.2rem; }
    .game-canvas { width:100%; max-width:700px; height:auto; display:block; border:var(--pixel-border); cursor:pointer; outline:none; touch-action:none; user-select:none; }
    [data-theme="modern"]    .game-canvas { border-radius:16px; border:1px solid var(--border); }
    [data-theme="vaporwave"] .game-canvas { border-color:var(--accent2); box-shadow:0 0 24px rgba(160,32,240,.35); }
    .hud { display:flex; gap:2rem; background:var(--surface); border:var(--pixel-border); padding:.7rem 2rem; flex-wrap:wrap; justify-content:center; }
    [data-theme="modern"]    .hud { border-radius:999px; border:1px solid var(--border); }
    [data-theme="vaporwave"] .hud { border-color:var(--accent2); box-shadow:0 0 10px rgba(160,32,240,.2); }
    .hi { display:flex; flex-direction:column; align-items:center; gap:2px; }
    .hl { font-size:.68rem; color:var(--muted); text-transform:uppercase; letter-spacing:.08em; font-family:var(--font-body); }
    .hv { font-family:var(--font-display); font-size:1.5rem; font-weight:800; }
    .c1{color:var(--accent1);} .c3{color:var(--accent3);}
    .start-btn { font-size:1rem; padding:.8rem 2rem; }
    .over {
      position:absolute; top:0; left:0; right:0; height:calc(100% - 80px); max-width:700px; margin:0 auto;
      background:rgba(0,0,0,.85); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.8rem;
    }
    [data-theme="retro"]     .over { background:rgba(245,240,232,.93); }
    [data-theme="vaporwave"] .over { background:rgba(10,0,21,.9); border:1px solid var(--accent2); box-shadow:0 0 30px rgba(160,32,240,.4); }
    .over-t { font-family:var(--font-display); font-size:2.5rem; font-weight:800; color:var(--accent1); }
    [data-theme="vaporwave"] .over-t { text-shadow:0 0 10px var(--accent1); }
    .over-d { color:var(--muted); font-size:1rem; font-family:var(--font-body); }
    .over-r { color:var(--accent4); font-family:var(--font-display); font-size:1.3rem; }
    @media(max-width:600px) { .section{padding:4rem 1.25rem;} .hobby-header{flex-direction:column;gap:.8rem;} }
  `]
})
export class CyclingGameComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  ts = inject(ThemeService);

  W = 700; H = 320;
  running = signal(false); over = signal(false);
  dist = signal(0); best = signal(0); spd = signal(0); newRec = signal(false);

  private ctx!: CanvasRenderingContext2D;
  private animId = 0;

  // ── Terrain ───────────────────────────────────────────────────
  // We generate terrain as an array of y-values at every STEP pixels in world space
  private readonly STEP = 6;           // world pixels per terrain sample
  private terrain: number[] = [];      // terrain[i] = y at world x = i*STEP
  private camX = 0;                    // camera left edge in world px

  // ── Bike physics (Rider-style) ────────────────────────────────
  // Position in WORLD coordinates
  private bwx = 150;  // bike wheel contact x (world)
  private bwy = 0;    // bike y (world) — set to terrain on start
  private velX = 0;
  private velY = 0;
  private onGround = false;
  private bikeAngle = 0;       // visual tilt of whole bike
  private bikeAngularVel = 0;  // rotational velocity
  private wheelAngle = 0;      // spinning wheel rotation

  // ── Misc ──────────────────────────────────────────────────────
  private gas = false;
  private distVal = 0;
  private stars: {x:number,y:number,r:number,t:number}[] = [];
  private palms: {x:number,h:number}[] = [];

  constructor(private zone: NgZone) {
    effect(() => { this.ts.theme(); if (this.ctx && !this.running()) this.drawFrame(); });
  }

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.generateStars();
    this.buildTerrain(3000);
    this.bwy = this.terrainAt(this.bwx);
    this.drawFrame();
  }
  ngOnDestroy() { cancelAnimationFrame(this.animId); }

  setGas(on: boolean) {
    this.gas = on;
    if (on && !this.running() && !this.over()) this.start();
  }

  start() {
    cancelAnimationFrame(this.animId);
    this.terrain = []; this.buildTerrain(3000);
    this.camX = 0; this.bwx = 150;
    this.bwy = this.terrainAt(this.bwx);
    this.velX = 0; this.velY = 0;
    this.bikeAngle = 0; this.bikeAngularVel = 0; this.wheelAngle = 0;
    this.onGround = true; this.distVal = 0;
    this.dist.set(0); this.spd.set(0); this.newRec.set(false);
    this.over.set(false); this.running.set(true);
    this.zone.runOutsideAngular(() => this.loop());
  }

  // ── Terrain generation ────────────────────────────────────────
  private buildTerrain(count: number) {
    const base = this.H * 0.6;
    const startI = this.terrain.length;
    for (let i = startI; i < startI + count; i++) {
      const wx = i * this.STEP;
      // Compose several sine waves for organic hills
      const y = base
        + Math.sin(wx * 0.0035 + 0.8) * 50
        + Math.sin(wx * 0.008  + 2.1) * 30
        + Math.sin(wx * 0.018  + 0.4) * 18
        + Math.sin(wx * 0.042  + 1.7) * 10;
      this.terrain.push(Math.max(this.H * 0.30, Math.min(this.H * 0.82, y)));
    }
    // Generate palm trees for vaporwave along new terrain
    for (let i = startI; i < startI + count; i += 80 + Math.floor(Math.random()*60)) {
      this.palms.push({ x: i * this.STEP, h: 50 + Math.random() * 40 });
    }
  }

  // Smooth terrain y at world x (linear interpolation between samples)
  private terrainAt(wx: number): number {
    const i = wx / this.STEP;
    const i0 = Math.floor(i);
    const i1 = i0 + 1;
    if (i0 < 0) return this.H * 0.6;
    if (i1 >= this.terrain.length) { this.buildTerrain(500); }
    const t = i - i0;
    return (this.terrain[i0] ?? this.H*.6) * (1-t) + (this.terrain[i1] ?? this.H*.6) * t;
  }

  // Terrain surface angle (radians) at world x
  private terrainAngleAt(wx: number): number {
    const dy = this.terrainAt(wx + this.STEP) - this.terrainAt(wx - this.STEP);
    return Math.atan2(dy, this.STEP * 2);
  }

  // ── Stars (one-time init) ─────────────────────────────────────
  private generateStars() {
    this.stars = Array.from({length: 120}, () => ({
      x: Math.random() * this.W,
      y: Math.random() * this.H * 0.5,
      r: Math.random() * 1.6 + 0.2,
      t: Math.random() * Math.PI * 2
    }));
  }

  // ── Game loop ─────────────────────────────────────────────────
  private loop() {
    const maxVel = 7 + Math.min(this.distVal / 400, 5);

    // Throttle / coast
    if (this.gas) {
      this.velX = Math.min(this.velX + 0.25, maxVel);
    } else {
      this.velX = Math.max(this.velX - 0.10, 0.8);
    }

    // Advance position
    this.bwx += this.velX;
    this.distVal += this.velX * 0.055;
    this.wheelAngle += this.velX * 0.25;

    // Terrain height at current and next position
    const groundY   = this.terrainAt(this.bwx);
    const terrainSlope = this.terrainAngleAt(this.bwx);

    // ── Gravity / airborne ────────────────────────────────────────
    // The bike is airborne when it's above the terrain
    if (this.bwy < groundY - 2) {
      // In the air
      this.onGround = false;
      this.velY += 0.55; // gravity
      this.bwy += this.velY;

      // While airborne, bike rotates freely (nose tips forward/back)
      this.bikeAngularVel += 0.012; // slight forward rotation
      this.bikeAngle += this.bikeAngularVel;

      // Landed?
      if (this.bwy >= groundY) {
        this.bwy = groundY;
        this.velY = 0;
        this.onGround = true;

        // ── Crash check on landing ────────────────────────────────
        // Crash if angle difference between bike and slope is too large
        const angleDiff = Math.abs(this.bikeAngle - terrainSlope);
        if (angleDiff > 1.1 || Math.abs(this.bikeAngularVel) > 0.25) {
          this.doCrash();
          return;
        }
        // Smooth landing: snap angle toward slope
        this.bikeAngle = this.lerp(this.bikeAngle, terrainSlope, 0.6);
        this.bikeAngularVel *= 0.2;
      }
    } else {
      // On the ground
      this.onGround = true;
      this.bwy = groundY;
      this.velY = 0;
      // Align bike to slope smoothly
      this.bikeAngle = this.lerp(this.bikeAngle, terrainSlope, 0.18);
      this.bikeAngularVel = 0;

      // ── Launch off ramp ───────────────────────────────────────
      // If terrain drops away faster than bike, bike becomes airborne
      const nextGround = this.terrainAt(this.bwx + this.velX * 2);
      if (nextGround > groundY + 8) {
        // Terrain drops → launch
        this.velY = -Math.min(this.velX * 0.3, 4); // small upward kick
        this.bikeAngularVel = -terrainSlope * 0.5;
      }
    }

    // Camera follows bike, bike always at x=150 on screen
    this.camX = this.bwx - 150;

    // HUD
    this.zone.run(() => {
      this.dist.set(Math.round(this.distVal));
      this.spd.set(Math.round(this.velX * 11));
    });

    this.drawFrame();
    this.animId = requestAnimationFrame(() => this.loop());
  }

  private doCrash() {
    this.zone.run(() => {
      this.running.set(false); this.over.set(true);
      this.dist.set(Math.round(this.distVal));
      if (Math.round(this.distVal) > this.best()) {
        this.best.set(Math.round(this.distVal)); this.newRec.set(true);
      }
    });
    // Draw final crash frame
    this.bikeAngle += 1.5;
    this.drawFrame();
  }

  private lerp(a:number,b:number,t:number){return a+(b-a)*t;}
  private get vw(){return this.ts.theme()==='vaporwave';}

  // ═══════════════════════════════════════════════════════════════
  //  DRAW
  // ═══════════════════════════════════════════════════════════════
  private drawFrame() {
    const ctx = this.ctx, W = this.W, H = this.H, vw = this.vw;

    // ── SKY ───────────────────────────────────────────────────────
    // Always fill completely first (no artefacts from previous frame)
    if (vw) {
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.65);
      sky.addColorStop(0, '#03000e');
      sky.addColorStop(0.5, '#0d0028');
      sky.addColorStop(1, '#1a003a');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      // Stars (parallax: very slow)
      const starOffX = (this.camX * 0.02) % W;
      ctx.save();
      for (const s of this.stars) {
        const sx = ((s.x - starOffX % W) + W * 2) % W;
        const twinkle = 0.5 + 0.5 * Math.sin(s.t + performance.now() * 0.001);
        ctx.globalAlpha = 0.4 + 0.6 * twinkle;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(sx, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.restore();

      // Sun (retrowave half-circle, fixed in sky)
      const sunX = W * 0.72, sunY = H * 0.32, sunR = 55;
      // Sun body
      ctx.save();
      ctx.beginPath(); ctx.arc(sunX, sunY, sunR, Math.PI, 0); ctx.closePath();
      const sg = ctx.createLinearGradient(sunX, sunY-sunR, sunX, sunY);
      sg.addColorStop(0, '#ff9fff'); sg.addColorStop(1, '#ff2d9b');
      ctx.fillStyle = sg; ctx.fill();
      // Horizontal stripes across sun (iconic synthwave look)
      ctx.fillStyle = '#03000e';
      for (let i = 1; i <= 5; i++) {
        const sy2 = sunY - sunR + i * (sunR / 5.5);
        const halfW = Math.sqrt(Math.max(0, sunR*sunR - (sy2-sunY)*(sy2-sunY)));
        ctx.fillRect(sunX - halfW, sy2, halfW*2, sunR/11);
      }
      ctx.restore();

      // Horizon glow below sun
      const hg = ctx.createLinearGradient(0, sunY+10, 0, sunY+80);
      hg.addColorStop(0, 'rgba(255,45,155,.25)'); hg.addColorStop(1, 'transparent');
      ctx.fillStyle = hg; ctx.fillRect(0, sunY+10, W, 80);

      // City skyline silhouette (parallax layer, slow)
      const cityOff = (this.camX * 0.06) % (W + 200);
      ctx.fillStyle = '#0d0028';
      this.drawCitySilhouette(ctx, -cityOff, H * 0.52, W + 200);
      this.drawCitySilhouette(ctx, W - cityOff, H * 0.52, W + 200);

    } else {
      // Natural sky + mountains
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.55);
      sky.addColorStop(0, '#0a1628'); sky.addColorStop(1, '#1a3a5c');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      // Mountains (parallax)
      const mo = (this.camX * 0.10) % (W + 220);
      ctx.fillStyle = 'rgba(20,50,80,.75)';
      for (let i = -1; i < 3; i++) {
        const bx = i * 280 - mo;
        ctx.beginPath();
        ctx.moveTo(bx,H); ctx.lineTo(bx+80,H-110); ctx.lineTo(bx+160,H-140);
        ctx.lineTo(bx+240,H-90); ctx.lineTo(bx+280,H); ctx.fill();
      }
      ctx.fillStyle = 'rgba(200,230,255,.45)';
      for (let i = -1; i < 3; i++) {
        const bx = i * 280 - mo;
        ctx.beginPath(); ctx.moveTo(bx+130,H-118); ctx.lineTo(bx+160,H-140); ctx.lineTo(bx+190,H-118); ctx.fill();
      }
    }

    // ── TERRAIN FILL (ground) ─────────────────────────────────────
    // Sample visible terrain
    const startIdx = Math.max(0, Math.floor(this.camX / this.STEP) - 2);
    const endIdx   = Math.ceil((this.camX + W) / this.STEP) + 2;

    if (vw) {
      // Vaporwave ground gradient
      const gf = ctx.createLinearGradient(0, H*0.4, 0, H);
      gf.addColorStop(0, '#1a003a'); gf.addColorStop(1, '#07001a');
      ctx.fillStyle = gf;
    } else {
      const gf = ctx.createLinearGradient(0, H*0.4, 0, H);
      gf.addColorStop(0, '#2d6e1b'); gf.addColorStop(1, '#0f2008');
      ctx.fillStyle = gf;
    }

    ctx.beginPath();
    let firstPt = true;
    for (let i = startIdx; i <= endIdx; i++) {
      const wx = i * this.STEP;
      const sx = wx - this.camX;
      const sy = this.terrain[i] ?? H * 0.65;
      if (firstPt) { ctx.moveTo(sx, sy); firstPt = false; }
      else ctx.lineTo(sx, sy);
    }
    // Close to bottom
    ctx.lineTo((endIdx * this.STEP) - this.camX, H + 2);
    ctx.lineTo((startIdx * this.STEP) - this.camX, H + 2);
    ctx.closePath(); ctx.fill();

    // Terrain surface line
    if (vw) { ctx.shadowColor='#c060ff'; ctx.shadowBlur=10; ctx.strokeStyle='#c060ff'; }
    else     { ctx.shadowBlur=0; ctx.strokeStyle='rgba(120,200,80,.5)'; }
    ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    ctx.beginPath(); firstPt = true;
    for (let i = startIdx; i <= endIdx; i++) {
      const sx = i * this.STEP - this.camX;
      const sy = this.terrain[i] ?? H * 0.65;
      if (firstPt) { ctx.moveTo(sx, sy); firstPt = false; } else ctx.lineTo(sx, sy);
    }
    ctx.stroke(); ctx.shadowBlur = 0;

    // Vaporwave: vertical grid lines on ground + palm trees
    if (vw) {
      // Grid lines (perspective not needed — just vertical stripes)
      ctx.strokeStyle='rgba(160,32,240,.15)'; ctx.lineWidth=1;
      for (let gx = Math.floor(this.camX/50)*50; gx < this.camX+W; gx += 50) {
        const sx = gx - this.camX;
        const ty = this.terrainAt(gx);
        ctx.beginPath(); ctx.moveTo(sx, ty); ctx.lineTo(sx, H); ctx.stroke();
      }
      // Palm trees
      for (const p of this.palms) {
        const sx = p.x - this.camX;
        if (sx < -60 || sx > W + 60) continue;
        this.drawPalm(ctx, sx, this.terrainAt(p.x), p.h);
      }
    }

    // ── BIKE ──────────────────────────────────────────────────────
    // Screen x of bike = bwx - camX = 150 (always)
    const bikeScreenX = this.bwx - this.camX;
    const bikeScreenY = this.bwy;

    ctx.save();
    ctx.translate(bikeScreenX, bikeScreenY);
    ctx.rotate(this.bikeAngle);
    this.drawBike(ctx, vw, this.wheelAngle);
    ctx.restore();
  }

  // ── Vaporwave city silhouette ─────────────────────────────────
  private drawCitySilhouette(ctx: CanvasRenderingContext2D, offX: number, baseY: number, width: number) {
    ctx.save();
    ctx.fillStyle = '#0d0028';
    const rng = (seed: number) => Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1;
    for (let x = 0; x < width; x += 0) {
      const bw = 20 + rng(x) * 35;
      const bh = 30 + rng(x+1) * 80;
      ctx.fillRect(offX + x, baseY - bh, bw, bh);
      // Window lights
      ctx.fillStyle = 'rgba(0,245,255,.15)';
      for (let wy = 4; wy < bh - 4; wy += 10) {
        for (let wx2 = 4; wx2 < bw - 4; wx2 += 8) {
          if (rng(x + wy + wx2) > 0.5) ctx.fillRect(offX + x + wx2, baseY - bh + wy, 4, 5);
        }
      }
      ctx.fillStyle = '#0d0028';
      x += bw + 2 + rng(x+2) * 10;
    }
    ctx.restore();
  }

  // ── Vaporwave neon palm tree ──────────────────────────────────
  private drawPalm(ctx: CanvasRenderingContext2D, sx: number, sy: number, h: number) {
    ctx.save();
    ctx.shadowColor = '#00f5ff'; ctx.shadowBlur = 6;
    // Trunk
    ctx.strokeStyle = '#a020f0'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx-4, sy-h); ctx.stroke();
    // Leaves
    ctx.strokeStyle = '#00f5ff'; ctx.lineWidth = 2;
    const lx = sx - 4, ly = sy - h;
    const leaves = [[-25,-12],[-15,-20],[-5,-22],[10,-18],[20,-10]];
    for (const [dx,dy] of leaves) {
      ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(lx+dx,ly+dy); ctx.stroke();
    }
    ctx.shadowBlur = 0; ctx.restore();
  }

  // ── Draw bike (Rider-style, wheels spinning) ──────────────────
  private drawBike(ctx: CanvasRenderingContext2D, vw: boolean, wheelAngle: number) {
    const R   = 16;    // wheel radius
    const WB  = 44;    // wheelbase (rear wheel at -WB/2, front at +WB/2)
    const wc  = vw ? '#c060ff' : '#7c5cfc';   // wheel colour
    const fc  = vw ? '#ff2d9b' : '#7c5cfc';   // frame colour
    const ac  = vw ? '#00f5ff' : '#ff6b35';   // accent
    const sc  = vw ? 'rgba(0,245,255,.7)' : 'rgba(200,200,255,.7)'; // spoke colour

    if (vw) { ctx.shadowColor = fc; ctx.shadowBlur = 8; }

    const drawWheel = (cx: number, cy: number) => {
      ctx.strokeStyle = wc; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.stroke();
      // Hub
      ctx.fillStyle = wc;
      ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI*2); ctx.fill();
      // 8 spokes rotating
      ctx.strokeStyle = sc; ctx.lineWidth = 1.2;
      for (let s = 0; s < 8; s++) {
        const a = wheelAngle + s * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.stroke();
      }
    };

    // Wheels
    drawWheel(-WB/2, 0);
    drawWheel( WB/2, 0);

    // ── Frame ─────────────────────────────────────────────────────
    // Key geometry points (relative to bottom bracket = origin)
    const BB  = {x: 0,       y: -5};      // bottom bracket
    const RST = {x: -WB/2,   y: 0};       // rear axle
    const FST = {x:  WB/2,   y: 0};       // front axle
    const ST  = {x: -6,      y: -30};     // seat top
    const HT  = {x:  WB/2-2, y: -28};    // head tube top
    const HTb = {x:  WB/2,   y: -10};    // head tube bottom

    ctx.strokeStyle = fc; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    // Chain stays (rear triangle)
    ctx.beginPath();
    ctx.moveTo(RST.x, RST.y); ctx.lineTo(BB.x, BB.y); ctx.lineTo(ST.x, ST.y); ctx.stroke();
    // Seat stays
    ctx.beginPath(); ctx.moveTo(RST.x, RST.y); ctx.lineTo(ST.x, ST.y); ctx.stroke();
    // Main frame
    ctx.beginPath();
    ctx.moveTo(BB.x,  BB.y);
    ctx.lineTo(HT.x,  HT.y);   // top tube
    ctx.moveTo(BB.x,  BB.y);
    ctx.lineTo(HTb.x, HTb.y);  // down tube
    ctx.stroke();
    // Fork
    ctx.beginPath(); ctx.moveTo(HTb.x, HTb.y); ctx.lineTo(FST.x, FST.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(HT.x, HT.y);   ctx.lineTo(HTb.x, HTb.y); ctx.stroke();

    // Saddle
    ctx.fillStyle = '#333'; ctx.fillRect(ST.x-10, ST.y-3, 18, 4);

    // Handlebar
    ctx.strokeStyle = ac; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(HT.x-3, HT.y); ctx.lineTo(HT.x+9, HT.y+7); ctx.stroke();

    // Pedal crank
    ctx.save(); ctx.translate(BB.x, BB.y); ctx.rotate(wheelAngle * 1.1);
    ctx.strokeStyle = ac; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-10,0); ctx.lineTo(10,0); ctx.stroke();
    ctx.fillStyle='#555';
    ctx.beginPath();ctx.arc(-10,0,3,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(10,0,3,0,Math.PI*2);ctx.fill();
    ctx.restore();

    ctx.shadowBlur = 0;

    // ── Rider ─────────────────────────────────────────────────────
    const rc = vw ? '#ff2d9b' : '#cc0000';    // jersey (RAF red)
    const jac = vw ? '#00f5ff' : '#ffd700';   // jersey accent (RAF yellow)

    // Hips / shorts
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.ellipse(ST.x+5, ST.y+1, 7, 5, -0.15, 0, Math.PI*2); ctx.fill();

    // Torso (leaning forward)
    ctx.save();
    ctx.translate(ST.x+5, ST.y);
    ctx.rotate(-0.42);
    // RAF jersey body
    ctx.fillStyle = rc;
    ctx.beginPath(); ctx.roundRect(-6,-22,14,22,3); ctx.fill();
    // Yellow shoulder strip
    ctx.fillStyle = jac;
    ctx.fillRect(-6,-22,14,5);
    ctx.fillRect(-6,-22,4,22);
    ctx.fillRect(4,-22,4,22);
    ctx.restore();

    // Arms to handlebar
    ctx.strokeStyle = rc; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ST.x+8, ST.y-14);
    ctx.quadraticCurveTo(ST.x+24, ST.y-20, HT.x+5, HT.y+2);
    ctx.stroke();
    // Sleeve end
    ctx.strokeStyle = jac; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(HT.x+2, HT.y-2); ctx.lineTo(HT.x+6, HT.y+4); ctx.stroke();

    // Head
    const hx = ST.x+16, hy = ST.y-24;
    ctx.fillStyle = vw ? '#d0a0ff' : '#f5c8a0';
    ctx.beginPath(); ctx.arc(hx, hy, 9, 0, Math.PI*2); ctx.fill();
    // Helmet (RAF colours: red with yellow stripe)
    ctx.fillStyle = rc;
    ctx.beginPath(); ctx.arc(hx-1, hy-3, 10, Math.PI*.85, Math.PI*.1, true); ctx.fill();
    ctx.fillStyle = jac;
    ctx.beginPath(); ctx.arc(hx, hy-2, 10, Math.PI*0.3, Math.PI*0.7); ctx.fill();
    // Visor
    ctx.fillStyle = vw ? 'rgba(0,245,255,.45)' : 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(hx+3, hy+2, 6, 3, -0.3, 0, Math.PI); ctx.fill();
  }
}
