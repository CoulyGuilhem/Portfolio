import {
  Component, ElementRef, ViewChild, AfterViewInit,
  OnDestroy, signal, NgZone, inject, effect, HostListener
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
          <p class="controls-hint">
            <span class="key">↑</span> Accélérer &nbsp;
            <span class="key">Z</span> Sauter &nbsp;
            <span class="key">←</span><span class="key">→</span> Incliner (en vol)
          </p>
          <p class="hint">Ou maintenez clic pour accélérer · Boutons touch ci-dessous</p>
        </div>
      </div>

      <div class="game-wrap">
        <canvas #canvas class="game-canvas" [width]="W" [height]="H"
          tabindex="0"
          (keydown)="onKey($event, true)"
          (keyup)="onKey($event, false)"
          (focus)="canvasFocused=true"
          (blur)="canvasFocused=false"
          (click)="canvasRef.nativeElement.focus()">
        </canvas>

        <!-- Touch / mouse controls -->
        <div class="touch-controls">
          <div class="touch-row">
            <button class="tbtn" (mousedown)="setKey('left',true)"  (mouseup)="setKey('left',false)"  (touchstart)="setKey('left',true);$event.preventDefault()"  (touchend)="setKey('left',false)">◄ Incliner</button>
            <button class="tbtn jump-btn" (mousedown)="setKey('jump',true)" (mouseup)="setKey('jump',false)" (touchstart)="setKey('jump',true);$event.preventDefault()" (touchend)="setKey('jump',false)">⬆ Sauter</button>
            <button class="tbtn gas-btn"  (mousedown)="setKey('gas',true)"  (mouseup)="setKey('gas',false)"  (touchstart)="setKey('gas',true);$event.preventDefault()"  (touchend)="setKey('gas',false)">▶ Gaz</button>
            <button class="tbtn" (mousedown)="setKey('right',true)" (mouseup)="setKey('right',false)" (touchstart)="setKey('right',true);$event.preventDefault()" (touchend)="setKey('right',false)">Incliner ►</button>
          </div>
        </div>

        <div class="hud">
          <div class="hi"><span class="hl">Distance</span><span class="hv c1">{{ dist() }} m</span></div>
          <div class="hi"><span class="hl">Record</span><span class="hv c3">{{ best() }} m</span></div>
          <div class="hi"><span class="hl">Vitesse</span><span class="hv">{{ spd() }} km/h</span></div>
        </div>

        @if (!running() && !over()) {
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
    .hobby-header { display:flex; align-items:flex-start; gap:1.5rem; margin-bottom:2rem; }
    .emoji { font-size:3rem; line-height:1; flex-shrink:0; }
    .controls-hint { display:flex; flex-wrap:wrap; gap:.4rem; align-items:center; margin-bottom:.4rem; font-size:.85rem; font-family:var(--font-body); color:var(--text); }
    .key { display:inline-flex; align-items:center; justify-content:center; padding:2px 8px; border:var(--pixel-border); font-family:var(--font-body); font-size:.78rem; background:var(--surface2); min-width:28px; }
    [data-theme="modern"]    .key { border-radius:4px; border:1px solid var(--border); }
    [data-theme="vaporwave"] .key { border-color:var(--accent2); color:var(--accent3); }
    .hint { color:var(--muted); font-size:.8rem; font-family:var(--font-body); }

    .game-wrap { max-width:700px; position:relative; display:flex; flex-direction:column; align-items:center; gap:.8rem; }

    .game-canvas { width:100%; max-width:700px; height:auto; display:block; border:var(--pixel-border); cursor:pointer; outline:2px solid transparent; touch-action:none; user-select:none; }
    .game-canvas:focus { outline-color:var(--accent2); }
    [data-theme="modern"]    .game-canvas { border-radius:16px; border:1px solid var(--border); }
    [data-theme="vaporwave"] .game-canvas { border-color:var(--accent2); box-shadow:0 0 24px rgba(160,32,240,.35); }

    .touch-controls { width:100%; max-width:700px; }
    .touch-row { display:flex; gap:.6rem; justify-content:center; flex-wrap:wrap; }
    .tbtn {
      padding:.6rem 1.1rem; font-family:var(--font-body); font-size:.78rem; text-transform:uppercase;
      letter-spacing:.04em; border:var(--pixel-border); background:var(--surface2);
      color:var(--text); cursor:pointer; transition:background .15s, box-shadow .15s;
      user-select:none; touch-action:none;
      &:active { background:var(--accent2); color:#fff; box-shadow:var(--shadow-pixel); }
    }
    [data-theme="modern"]    .tbtn { border-radius:8px; border:1px solid var(--border); }
    [data-theme="vaporwave"] .tbtn { border-color:var(--accent2); &:active { background:var(--accent1); box-shadow:0 0 12px rgba(255,45,155,.5); } }
    .jump-btn:active { background:var(--accent3) !important; }
    .gas-btn:active  { background:var(--accent1) !important; }

    .hud { display:flex; gap:2rem; background:var(--surface); border:var(--pixel-border); padding:.7rem 2rem; flex-wrap:wrap; justify-content:center; }
    [data-theme="modern"]    .hud { border-radius:999px; border:1px solid var(--border); }
    [data-theme="vaporwave"] .hud { border-color:var(--accent2); box-shadow:0 0 10px rgba(160,32,240,.2); }
    .hi { display:flex; flex-direction:column; align-items:center; gap:2px; }
    .hl { font-size:.68rem; color:var(--muted); text-transform:uppercase; letter-spacing:.08em; font-family:var(--font-body); }
    .hv { font-family:var(--font-display); font-size:1.5rem; font-weight:800; }
    .c1{color:var(--accent1);} .c3{color:var(--accent3);}

    .start-btn { font-size:1rem; padding:.8rem 2rem; }

    .over {
      position:absolute; top:0; left:0; right:0; height:calc(100% - 160px); max-width:700px; margin:0 auto;
      background:rgba(0,0,0,.88); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.8rem;
    }
    [data-theme="retro"]     .over { background:rgba(245,240,232,.95); }
    [data-theme="vaporwave"] .over { background:rgba(10,0,21,.92); border:1px solid var(--accent2); box-shadow:0 0 30px rgba(160,32,240,.4); }
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

  W = 700; H = 300;
  running = signal(false); over = signal(false);
  dist = signal(0); best = signal(0); spd = signal(0); newRec = signal(false);

  canvasFocused = false;

  private ctx!: CanvasRenderingContext2D;
  private animId = 0;

  // ── Input state ───────────────────────────────────────────────
  private keys = { gas: false, jump: false, left: false, right: false };
  private jumpPressed = false;  // single-press latch

  // ── Terrain ───────────────────────────────────────────────────
  private readonly STEP = 5;
  private terrain: number[] = [];
  private camX = 0;

  // ── Obstacles ────────────────────────────────────────────────
  private obstacles: { wx: number; type: 'rock'|'log' }[] = [];

  // ── Bike physics ──────────────────────────────────────────────
  private bwx      = 150;    // bike world x
  private bwy      = 0;      // bike world y (screen coords, increases downward)
  private velX     = 0;
  private velY     = 0;
  private onGround = true;
  private bikeAngle= 0;      // tilt angle (rad)
  private angVel   = 0;      // angular velocity (rad/frame)
  private wheelRot = 0;      // wheel spin accumulator
  private jumpCooldown = 0;

  private distVal  = 0;
  private stars: {x:number,y:number,r:number,p:number}[] = [];
  private palms:  {wx:number,h:number}[] = [];

  constructor(private zone: NgZone) {
    effect(() => { this.ts.theme(); if (this.ctx && !this.running()) this.drawFrame(); });
  }

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.genStars();
    this.buildTerrain(2000);
    this.bwy = this.terrainY(this.bwx);
    this.drawFrame();
  }
  ngOnDestroy() { cancelAnimationFrame(this.animId); }

  // ── Key handling (canvas-focused AND document-level fallback) ─
  @HostListener('document:keydown', ['$event'])
  onDocKey(e: KeyboardEvent) { this.handleKey(e.key, true,  e); }
  @HostListener('document:keyup',   ['$event'])
  onDocKeyUp(e: KeyboardEvent) { this.handleKey(e.key, false, e); }

  onKey(e: KeyboardEvent, down: boolean) { this.handleKey(e.key, down, e); }

  private handleKey(key: string, down: boolean, e?: KeyboardEvent) {
    switch (key) {
      case 'ArrowUp':   case 'w': case 'W':
        if (e) e.preventDefault();
        this.keys.gas = down;
        if (down && !this.running() && !this.over()) this.start();
        break;
      case 'z': case 'Z':
        if (e) e.preventDefault();
        if (down && !this.keys.jump) this.jumpPressed = true;
        this.keys.jump = down;
        break;
      case 'ArrowLeft':  case 'a': case 'A':
        if (e) e.preventDefault();
        this.keys.left  = down; break;
      case 'ArrowRight': case 'd': case 'D':
        if (e) e.preventDefault();
        this.keys.right = down; break;
    }
  }

  setKey(k: 'gas'|'jump'|'left'|'right', down: boolean) {
    this.keys[k] = down;
    if (k === 'jump' && down) this.jumpPressed = true;
    if (k === 'gas' && down && !this.running() && !this.over()) this.start();
  }

  // ── Terrain ───────────────────────────────────────────────────
  private buildTerrain(n: number) {
    const base = this.H * 0.60;
    const start = this.terrain.length;
    for (let i = start; i < start + n; i++) {
      const wx = i * this.STEP;
      // Flat opening ~2s, then hills
      const blend = Math.min((wx - 500) / 400, 1);
      const h = base
        + Math.sin(wx * 0.0040 + 0.8) * 44 * blend
        + Math.sin(wx * 0.0095 + 2.1) * 26 * blend
        + Math.sin(wx * 0.0210 + 0.4) * 14 * blend
        + Math.sin(wx * 0.0500 + 1.7) * 7  * blend;
      this.terrain.push(Math.max(this.H * 0.28, Math.min(this.H * 0.80, h)));
    }
    // Obstacles every ~350 px world, starting after warm-up
    for (let i = start; i < start + n; i += Math.floor(350/this.STEP + Math.random()*200/this.STEP)) {
      const wx = i * this.STEP;
      if (wx < 900) continue;  // no obstacles in warm-up
      this.obstacles.push({ wx, type: Math.random() > 0.5 ? 'rock' : 'log' });
    }
    // Palms
    for (let wx2 = start * this.STEP; wx2 < (start + n) * this.STEP; wx2 += 120 + Math.random()*80) {
      this.palms.push({ wx: wx2, h: 45 + Math.random()*35 });
    }
  }

  private terrainY(wx: number): number {
    const idx = wx / this.STEP;
    const i0 = Math.floor(idx), i1 = i0 + 1;
    if (i0 < 0) return this.H * 0.6;
    if (i1 >= this.terrain.length) this.buildTerrain(800);
    const t = idx - i0;
    return (this.terrain[i0]??this.H*.6)*(1-t) + (this.terrain[i1]??this.H*.6)*t;
  }

  private terrainAngle(wx: number): number {
    return Math.atan2(this.terrainY(wx + this.STEP*2) - this.terrainY(wx - this.STEP*2), this.STEP*4);
  }

  // ── Stars ─────────────────────────────────────────────────────
  private genStars() {
    this.stars = Array.from({length:130}, ()=>({
      x: Math.random()*this.W, y: Math.random()*this.H*0.52,
      r: Math.random()*1.5+0.2, p: Math.random()*Math.PI*2
    }));
  }

  // ── Main loop ─────────────────────────────────────────────────
  start() {
    cancelAnimationFrame(this.animId);
    this.terrain=[]; this.obstacles=[]; this.palms=[];
    this.buildTerrain(2000);
    this.camX=0; this.bwx=150;
    this.bwy=this.terrainY(this.bwx);
    this.velX=0; this.velY=0;
    this.bikeAngle=0; this.angVel=0; this.wheelRot=0;
    this.onGround=true; this.distVal=0; this.jumpCooldown=0;
    this.jumpPressed=false;
    this.keys={gas:false,jump:false,left:false,right:false};
    this.dist.set(0); this.spd.set(0); this.newRec.set(false);
    this.over.set(false); this.running.set(true);
    this.zone.runOutsideAngular(()=>this.loop());
  }

  private loop() {
    // ── Throttle / coast ────────────────────────────────────────
    const maxV = 5.5 + Math.min(this.distVal/500, 3.5);
    if (this.keys.gas) {
      this.velX = Math.min(this.velX + 0.22, maxV);
    } else {
      this.velX = Math.max(this.velX - 0.09, 1.0);
    }

    this.bwx += this.velX;
    this.distVal += this.velX * 0.05;
    this.wheelRot += this.velX * 0.28;
    if (this.jumpCooldown > 0) this.jumpCooldown--;

    const groundY = this.terrainY(this.bwx);
    const slope   = this.terrainAngle(this.bwx);

    if (this.onGround) {
      // ── On the ground ────────────────────────────────────────
      this.bwy = groundY;
      this.velY = 0;

      // Align angle to slope gently
      this.bikeAngle = this.lerp(this.bikeAngle, slope, 0.14);
      this.angVel = 0;

      // Jump
      if (this.jumpPressed && this.jumpCooldown === 0) {
        // Jump force along surface normal (perpendicular to slope)
        this.velY  = -6.5 - Math.abs(slope) * 2;   // always upward
        this.velX *= 1.05;
        this.angVel = slope * -0.5;  // inherit ramp angle as spin
        this.onGround = false;
        this.jumpCooldown = 20;
      }

      // Natural ramp launch: terrain drops sharply away
      const aheadGround = this.terrainY(this.bwx + this.velX * 4);
      if (aheadGround > groundY + 10) {
        this.velY  = -1.5;
        this.angVel = slope * -0.35;
        this.onGround = false;
      }
    } else {
      // ── In the air ───────────────────────────────────────────
      // Gentle gravity — matches Rider feel
      this.velY += 0.22;

      this.bwy += this.velY;

      // Manual rotation: ← / →
      if (this.keys.left)  this.angVel -= 0.018;
      if (this.keys.right) this.angVel += 0.018;

      // Damping — stronger so angle settles quickly when key released
      this.angVel *= 0.88;
      this.bikeAngle += this.angVel;

      // Clamp to avoid full 360 (optional — remove for wild tricks)
      // this.bikeAngle = Math.max(-Math.PI*.9, Math.min(Math.PI*.9, this.bikeAngle));

      // Landing check
      if (this.bwy >= groundY) {
        this.bwy = groundY;
        this.velY = 0;
        this.onGround = true;
        this.jumpCooldown = 8;

        // Normalize bikeAngle to [-π, π] before landing check
        // This prevents the "upside-down for a few frames" glitch after loopings
        this.bikeAngle = Math.atan2(Math.sin(this.bikeAngle), Math.cos(this.bikeAngle));

        // Crash if bike angle is too far from slope at landing
        const angleDiff = this.bikeAngle - slope;
        const normDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        if (Math.abs(normDiff) > 1.05) {
          this.doCrash();
          return;
        }
        // Smooth landing — snap directly to slope, no lerp frame delay
        this.bikeAngle = slope;
        this.angVel = 0;
      }
    }

    this.jumpPressed = false;

    // ── Obstacle collision ───────────────────────────────────────
    const bikeScreenX = this.bwx - this.camX; // always ~150
    for (const obs of this.obstacles) {
      const osx = obs.wx - this.camX;
      if (Math.abs(osx - bikeScreenX) < 22 && this.bwy >= this.terrainY(obs.wx) - 5) {
        this.doCrash();
        return;
      }
    }

    // Camera
    this.camX = this.bwx - 150;

    this.zone.run(()=>{
      this.dist.set(Math.round(this.distVal));
      this.spd.set(Math.round(this.velX*10));
    });

    this.drawFrame();
    this.animId = requestAnimationFrame(()=>this.loop());
  }

  private doCrash() {
    this.bikeAngle += this.velY > 0 ? 1.8 : -1.8;
    this.drawFrame();
    this.zone.run(()=>{
      this.running.set(false); this.over.set(true);
      this.dist.set(Math.round(this.distVal));
      if (Math.round(this.distVal) > this.best()) {
        this.best.set(Math.round(this.distVal)); this.newRec.set(true);
      }
    });
  }

  private lerp(a:number,b:number,t:number){return a+(b-a)*t;}
  private get vw(){return this.ts.theme()==='vaporwave';}

  // ═══════════════════════════════════════════════════════════════
  //  DRAW
  // ═══════════════════════════════════════════════════════════════
  private drawFrame() {
    const ctx=this.ctx, W=this.W, H=this.H, vw=this.vw;
    const now = performance.now();

    // ── Full background clear + sky ──────────────────────────────
    if (vw) {
      const sky=ctx.createLinearGradient(0,0,0,H);
      sky.addColorStop(0,'#02000a'); sky.addColorStop(0.55,'#0e0028'); sky.addColorStop(1,'#180038');
      ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);

      // Stars (parallax: 2% of camera speed)
      const sOff=(this.camX*0.02)%W;
      for(const s of this.stars){
        const sx=((s.x-sOff)+W*4)%W;
        const tw=0.55+0.45*Math.sin(s.p+now*0.0008);
        ctx.globalAlpha=0.3+0.7*tw;
        ctx.fillStyle='#fff';
        ctx.beginPath(); ctx.arc(sx,s.y,s.r,0,Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha=1;

      // Retrowave SUN (fixed position in sky)
      const sx=W*0.74, sy=H*0.28, sr=52;
      ctx.save();
      ctx.beginPath(); ctx.arc(sx,sy,sr,Math.PI,0); ctx.closePath();
      const sg=ctx.createLinearGradient(sx,sy-sr,sx,sy);
      sg.addColorStop(0,'#ffaaff'); sg.addColorStop(0.5,'#ff2d9b'); sg.addColorStop(1,'#ff6600');
      ctx.fillStyle=sg; ctx.fill();
      // Stripes
      ctx.fillStyle='#02000a';
      for(let i=1;i<=5;i++){
        const sy2=sy-sr+i*(sr/5.5);
        const hw=Math.sqrt(Math.max(0,sr*sr-(sy2-sy)*(sy2-sy)));
        ctx.fillRect(sx-hw,sy2,hw*2,sr/11);
      }
      // Glow halo
      const halo=ctx.createRadialGradient(sx,sy,sr*.8,sx,sy,sr*2.5);
      halo.addColorStop(0,'rgba(255,45,155,.18)'); halo.addColorStop(1,'transparent');
      ctx.fillStyle=halo; ctx.fillRect(0,0,W,H);
      ctx.restore();

      // Horizon line
      ctx.strokeStyle='rgba(255,45,155,.4)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(0,H*0.54); ctx.lineTo(W,H*0.54); ctx.stroke();

      // City silhouette (parallax ~6%)
      const cOff=(this.camX*0.06)%(W+300);
      ctx.fillStyle='#0b001e';
      this.drawCity(ctx,-cOff,H*0.54,W+300);
      this.drawCity(ctx,W+300-cOff,H*0.54,W+300);

    } else {
      // Natural sky
      const sky=ctx.createLinearGradient(0,0,0,H*.55);
      sky.addColorStop(0,'#0a1628'); sky.addColorStop(1,'#1a3a5c');
      ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
      // Mountains (parallax ~10%)
      const mo=(this.camX*0.10)%(W+300);
      ctx.fillStyle='rgba(20,50,80,.75)';
      for(let i=-1;i<3;i++){
        const bx=i*300-mo;
        ctx.beginPath(); ctx.moveTo(bx,H); ctx.lineTo(bx+90,H-115); ctx.lineTo(bx+165,H-145); ctx.lineTo(bx+250,H-95); ctx.lineTo(bx+300,H); ctx.fill();
      }
      ctx.fillStyle='rgba(200,230,255,.45)';
      for(let i=-1;i<3;i++){
        const bx=i*300-mo;
        ctx.beginPath(); ctx.moveTo(bx+135,H-122); ctx.lineTo(bx+165,H-145); ctx.lineTo(bx+195,H-122); ctx.fill();
      }
    }

    // ── Terrain ───────────────────────────────────────────────────
    const i0=Math.max(0, Math.floor(this.camX/this.STEP)-1);
    const i1=Math.ceil((this.camX+W)/this.STEP)+1;

    if(vw){
      const gf=ctx.createLinearGradient(0,H*.38,0,H);
      gf.addColorStop(0,'#220050'); gf.addColorStop(1,'#0a001a');
      ctx.fillStyle=gf;
    } else {
      const gf=ctx.createLinearGradient(0,H*.38,0,H);
      gf.addColorStop(0,'#2d6e1b'); gf.addColorStop(1,'#0f2008');
      ctx.fillStyle=gf;
    }

    ctx.beginPath();
    let fp=true;
    for(let i=i0;i<=i1;i++){
      const sx=i*this.STEP-this.camX, sy=this.terrain[i]??H*.65;
      if(fp){ctx.moveTo(sx,sy);fp=false;}else ctx.lineTo(sx,sy);
    }
    ctx.lineTo(i1*this.STEP-this.camX,H+2);
    ctx.lineTo(i0*this.STEP-this.camX,H+2);
    ctx.closePath(); ctx.fill();

    // Surface line
    if(vw){ctx.shadowColor='#c060ff';ctx.shadowBlur=9;ctx.strokeStyle='#c060ff';}
    else  {ctx.shadowBlur=0;ctx.strokeStyle='rgba(130,210,80,.55)';}
    ctx.lineWidth=2.5; ctx.lineJoin='round';
    ctx.beginPath(); fp=true;
    for(let i=i0;i<=i1;i++){
      const sx=i*this.STEP-this.camX, sy=this.terrain[i]??H*.65;
      if(fp){ctx.moveTo(sx,sy);fp=false;}else ctx.lineTo(sx,sy);
    }
    ctx.stroke(); ctx.shadowBlur=0;

    // Vaporwave vertical grid on ground + palms
    if(vw){
      ctx.strokeStyle='rgba(160,32,240,.13)'; ctx.lineWidth=1;
      for(let gx=Math.floor(this.camX/50)*50;gx<this.camX+W;gx+=50){
        const sx=gx-this.camX;
        const ty=this.terrainY(gx);
        ctx.beginPath(); ctx.moveTo(sx,ty); ctx.lineTo(sx,H); ctx.stroke();
      }
      for(const p of this.palms){
        const sx=p.wx-this.camX;
        if(sx<-80||sx>W+80) continue;
        this.drawPalm(ctx,sx,this.terrainY(p.wx),p.h);
      }
    }

    // ── Obstacles ────────────────────────────────────────────────
    for(const obs of this.obstacles){
      const sx=obs.wx-this.camX;
      if(sx<-60||sx>W+60) continue;
      const ty=this.terrainY(obs.wx);
      this.drawObstacle(ctx,sx,ty,obs.type,vw);
    }

    // ── Bike ─────────────────────────────────────────────────────
    const bikeScreenX=this.bwx-this.camX; // ~150
    ctx.save();
    ctx.translate(bikeScreenX, this.bwy);
    ctx.rotate(this.bikeAngle);
    this.drawBike(ctx,vw,this.wheelRot);
    ctx.restore();
  }

  // ── Obstacle ─────────────────────────────────────────────────
  private drawObstacle(ctx:CanvasRenderingContext2D, sx:number, ty:number, type:'rock'|'log', vw:boolean){
    ctx.save();
    if(type==='rock'){
      if(vw){ctx.shadowColor='#a020f0';ctx.shadowBlur=8;ctx.fillStyle='#7030a0';}
      else  {ctx.fillStyle='#888';}
      ctx.beginPath(); ctx.ellipse(sx,ty-10,16,11,0,0,Math.PI*2); ctx.fill();
      if(vw){ctx.fillStyle='#c060d0';}else{ctx.fillStyle='#aaa';}
      ctx.beginPath(); ctx.ellipse(sx-4,ty-14,8,6,-0.3,0,Math.PI*2); ctx.fill();
    } else {
      // log / barrier
      if(vw){ctx.shadowColor='#ff2d9b';ctx.shadowBlur=8;ctx.fillStyle='#ff2d9b';}
      else  {ctx.fillStyle='#8B4513';}
      ctx.fillRect(sx-18,ty-18,36,10);
      if(vw){ctx.fillStyle='rgba(255,45,155,.3)';}else{ctx.fillStyle='rgba(255,255,255,.15)';}
      ctx.fillRect(sx-18,ty-18,36,4);
    }
    ctx.shadowBlur=0; ctx.restore();
  }

  // ── City silhouette ──────────────────────────────────────────
  private drawCity(ctx:CanvasRenderingContext2D, offX:number, baseY:number, width:number){
    ctx.save();
    const rng=(s:number)=>Math.abs(Math.sin(s*127.1+311.7)*43758.5453)%1;
    let x=0;
    while(x<width){
      const bw=18+rng(x)*32, bh=28+rng(x+1)*75;
      ctx.fillStyle='#0b001e';
      ctx.fillRect(offX+x,baseY-bh,bw,bh);
      ctx.fillStyle='rgba(0,245,255,.13)';
      for(let wy=4;wy<bh-4;wy+=9){
        for(let wx2=3;wx2<bw-3;wx2+=7){
          if(rng(x+wy+wx2)>0.48) ctx.fillRect(offX+x+wx2,baseY-bh+wy,3,4);
        }
      }
      x+=bw+1+rng(x+2)*8;
    }
    ctx.restore();
  }

  // ── Palm tree ────────────────────────────────────────────────
  private drawPalm(ctx:CanvasRenderingContext2D, sx:number, sy:number, h:number){
    ctx.save();
    ctx.shadowColor='#00f5ff'; ctx.shadowBlur=5;
    ctx.strokeStyle='#8020c0'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx-3,sy-h); ctx.stroke();
    ctx.strokeStyle='#00f5ff'; ctx.lineWidth=1.8;
    const lx=sx-3, ly=sy-h;
    for(const [dx,dy] of [[-22,-10],[-14,-18],[-5,-21],[9,-17],[18,-9]]){
      ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(lx+dx,ly+dy); ctx.stroke();
    }
    ctx.shadowBlur=0; ctx.restore();
  }

  // ── Bike ─────────────────────────────────────────────────────
  private drawBike(ctx:CanvasRenderingContext2D, vw:boolean, wa:number){
    const R=15, WB=42;
    const wc=vw?'#c060ff':'#7c5cfc';
    const fc=vw?'#ff2d9b':'#7c5cfc';
    const ac=vw?'#00f5ff':'#ff6b35';
    const sc=vw?'rgba(0,245,255,.65)':'rgba(200,200,255,.65)';
    if(vw){ctx.shadowColor=fc;ctx.shadowBlur=7;}

    const drawWheel=(cx:number,cy:number)=>{
      ctx.strokeStyle=wc; ctx.lineWidth=3.5;
      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle=wc; ctx.beginPath(); ctx.arc(cx,cy,3,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=sc; ctx.lineWidth=1.1;
      for(let s=0;s<8;s++){
        const a=wa+s*Math.PI/4;
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R); ctx.stroke();
      }
    };
    drawWheel(-WB/2,0);
    drawWheel( WB/2,0);

    // Frame geometry
    const BB={x:0,y:-4}, ST={x:-5,y:-28}, HT={x:WB/2-2,y:-26}, HTb={x:WB/2,y:-9};
    ctx.strokeStyle=fc; ctx.lineWidth=2.8; ctx.lineJoin='round';
    ctx.beginPath();
    ctx.moveTo(-WB/2,0); ctx.lineTo(BB.x,BB.y); ctx.lineTo(ST.x,ST.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-WB/2,0); ctx.lineTo(ST.x,ST.y); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(BB.x,BB.y); ctx.lineTo(HT.x,HT.y);
    ctx.moveTo(BB.x,BB.y); ctx.lineTo(HTb.x,HTb.y);
    ctx.moveTo(HT.x,HT.y); ctx.lineTo(HTb.x,HTb.y);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(HTb.x,HTb.y); ctx.lineTo(WB/2,0); ctx.stroke();

    // Saddle + handlebar
    ctx.fillStyle='#333'; ctx.fillRect(ST.x-9,ST.y-3,16,4);
    ctx.strokeStyle=ac; ctx.lineWidth=2.2;
    ctx.beginPath(); ctx.moveTo(HT.x-2,HT.y); ctx.lineTo(HT.x+8,HT.y+6); ctx.stroke();

    // Crank
    ctx.save(); ctx.translate(BB.x,BB.y); ctx.rotate(wa*1.1);
    ctx.strokeStyle=ac; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(9,0); ctx.stroke();
    ctx.fillStyle='#555';
    ctx.beginPath(); ctx.arc(-9,0,2.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(9,0,2.5,0,Math.PI*2);   ctx.fill();
    ctx.restore();

    ctx.shadowBlur=0;

    // Rider
    const rc=vw?'#ff2d9b':'#cc0000', jac=vw?'#00f5ff':'#ffd700';
    // hips
    ctx.fillStyle='#111';
    ctx.beginPath(); ctx.ellipse(ST.x+4,ST.y+1,6,4,-0.15,0,Math.PI*2); ctx.fill();
    // torso leaning
    ctx.save(); ctx.translate(ST.x+4,ST.y); ctx.rotate(-0.4);
    ctx.fillStyle=rc; ctx.beginPath(); ctx.roundRect(-5,-20,13,20,2); ctx.fill();
    ctx.fillStyle=jac; ctx.fillRect(-5,-20,13,4); ctx.fillRect(-5,-20,3,20); ctx.fillRect(5,-20,3,20);
    ctx.restore();
    // arms
    ctx.strokeStyle=rc; ctx.lineWidth=4; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(ST.x+7,ST.y-13); ctx.quadraticCurveTo(ST.x+20,ST.y-18,HT.x+4,HT.y+2); ctx.stroke();
    ctx.strokeStyle=jac; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(HT.x+2,HT.y); ctx.lineTo(HT.x+6,HT.y+4); ctx.stroke();
    // head
    const hx=ST.x+14, hy=ST.y-22;
    ctx.fillStyle=vw?'#d0a0ff':'#f5c8a0';
    ctx.beginPath(); ctx.arc(hx,hy,8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=rc; ctx.beginPath(); ctx.arc(hx-1,hy-2,9,Math.PI*.85,Math.PI*.1,true); ctx.fill();
    ctx.fillStyle=jac; ctx.beginPath(); ctx.arc(hx,hy-1,9,Math.PI*.3,Math.PI*.7); ctx.fill();
    ctx.fillStyle=vw?'rgba(0,245,255,.4)':'rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(hx+2,hy+2,5,2.5,-0.3,0,Math.PI); ctx.fill();
  }
}
