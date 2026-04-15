import {
  Component, ElementRef, ViewChild, AfterViewInit,
  OnDestroy, signal, computed, NgZone, inject, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

type Phase = 'idle' | 'shooting' | 'result';

// Goal is divided into a 3x3 grid of zones
// Keeper dives to one zone, ball goes to clicked zone
interface Zone { col: 0|1|2; row: 0|1|2; }

@Component({
  selector: 'app-football-game',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section id="hobbies" class="section">
      <div class="hobby-header">
        <span class="emoji">⚽</span>
        <div>
          <p class="section-label">> Sport_</p>
          <h2 class="section-title" style="margin-bottom:.4rem">Football · Penalty RAF</h2>
          <p class="hint">Cliquez dans les buts pour tirer !</p>
        </div>
      </div>
      <div class="game-wrap">
        <canvas #canvas class="game-canvas" [width]="W" [height]="H"
          (mousemove)="onMove($event)"
          (click)="onClick($event)"
          (mouseleave)="onLeave()"
          [style.cursor]="phase()==='idle' ? 'crosshair' : 'default'">
        </canvas>
        <div class="hud">
          <div class="hud-item"><span class="hl">Buts</span><span class="hv c1">{{ goals() }}</span></div>
          <div class="hdiv">/</div>
          <div class="hud-item"><span class="hl">Tirs</span><span class="hv">{{ shots() }}</span></div>
          <div class="hud-item"><span class="hl">Précision</span><span class="hv c3">{{ precision() }}%</span></div>
        </div>
        @if (phase()==='result') {
          <div class="result-msg" [class.goal]="lastGoal()" [class.saved]="!lastGoal()">
            {{ lastGoal() ? '⚽ BUUUT !' : '🧤 Arrêté !' }}
          </div>
        }
        @if (phase()==='idle') {
          <p class="hint-aim">👆 Cliquez directement dans les buts</p>
        }
        <button class="btn btn-outline reset-btn" (click)="reset()">↺ Reset</button>
      </div>
    </section>
  `,
  styles: [`
    .section { background:var(--surface); padding:6rem 2.5rem; }
    .hobby-header { display:flex; align-items:flex-start; gap:1.5rem; margin-bottom:2.5rem; }
    .emoji { font-size:3rem; line-height:1; }
    .hint { color:var(--muted); font-size:.88rem; font-family:var(--font-body); }
    .game-wrap { max-width:640px; display:flex; flex-direction:column; align-items:center; gap:1.2rem; }
    .game-canvas { width:100%; max-width:640px; height:auto; display:block; border:var(--pixel-border); }
    [data-theme="modern"]    .game-canvas { border-radius:16px; border:1px solid var(--border); }
    [data-theme="vaporwave"] .game-canvas { border-color:var(--accent2); box-shadow:0 0 20px rgba(160,32,240,.35); }
    .hud { display:flex; align-items:center; gap:1.5rem; background:var(--surface2); border:var(--pixel-border); padding:.7rem 1.8rem; }
    [data-theme="modern"]    .hud { border-radius:999px; border:1px solid var(--border); }
    [data-theme="vaporwave"] .hud { border-color:var(--accent2); box-shadow:0 0 10px rgba(160,32,240,.2); }
    .hud-item { display:flex; flex-direction:column; align-items:center; gap:2px; }
    .hl { font-size:.68rem; color:var(--muted); text-transform:uppercase; letter-spacing:.08em; font-family:var(--font-body); }
    .hv { font-family:var(--font-display); font-size:1.6rem; font-weight:800; }
    .c1{color:var(--accent1);} .c3{color:var(--accent3);}
    .hdiv { color:var(--border); font-size:1.5rem; }
    .hint-aim { color:var(--muted); font-size:.82rem; font-family:var(--font-body); text-transform:uppercase; letter-spacing:.06em; }
    .result-msg {
      font-family:var(--font-display); font-size:2rem; font-weight:800;
      padding:.8rem 2.5rem; border:var(--pixel-border);
      animation:popIn .35s cubic-bezier(.175,.885,.32,1.275);
      &.goal  { background:rgba(35,120,4,.12); color:var(--accent3); }
      &.saved { background:rgba(212,56,13,.1);  color:var(--accent1); }
    }
    [data-theme="modern"]    .result-msg { border-radius:12px; border:none; }
    [data-theme="vaporwave"] .result-msg {
      &.goal  { background:rgba(0,245,255,.1); color:var(--accent3); border-color:var(--accent3); box-shadow:0 0 20px rgba(0,245,255,.4); }
      &.saved { background:rgba(255,45,155,.1); color:var(--accent1); border-color:var(--accent1); box-shadow:0 0 20px rgba(255,45,155,.4); }
    }
    @keyframes popIn { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
    .reset-btn { font-size:.8rem; padding:.5rem 1.2rem; }
    @media(max-width:600px) { .section{padding:4rem 1.25rem;} .hobby-header{flex-direction:column;gap:.8rem;} }
  `]
})
export class FootballGameComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  ts = inject(ThemeService);

  W = 640; H = 380;
  goals    = signal(0);
  shots    = signal(0);
  phase    = signal<Phase>('idle');
  lastGoal = signal(false);
  precision = computed(() => this.shots()===0 ? 0 : Math.round(this.goals()/this.shots()*100));

  // ── Goal geometry ─────────────────────────────────────────────
  private readonly GL = 100;   // left post x
  private readonly GR = 540;   // right post x
  private readonly GT = 55;    // crossbar y
  private readonly GB = 230;   // goal bottom y
  private get GW() { return this.GR - this.GL; }
  private get GH() { return this.GB - this.GT; }

  // ── Zone sizing (3 cols × 3 rows) ────────────────────────────
  // col: 0=left 1=center 2=right  |  row: 0=top 1=mid 2=low
  private zoneX(col: number) { return this.GL + col * this.GW/3; }
  private zoneY(row: number) { return this.GT + row * this.GH/3; }
  private zoneCX(col: number) { return this.zoneX(col) + this.GW/6; }
  private zoneCY(row: number) { return this.zoneY(row) + this.GH/6; }

  private ctx!: CanvasRenderingContext2D;
  private hX = -1; private hY = -1;
  private hZone: Zone|null = null;

  // Shot state
  private shotZone: Zone = { col:1, row:2 };
  private keeperZone: Zone = { col:1, row:1 };
  private keeperX = 320; private keeperY = 0;
  private progress = 0;
  private animId = 0;

  constructor(private zone: NgZone) {
    effect(() => { this.ts.theme(); if (this.ctx) this.drawFrame(); });
  }

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.keeperY = this.zoneCY(1);
    this.keeperX = this.zoneCX(1);
    this.startIdleLoop();
  }
  ngOnDestroy() { cancelAnimationFrame(this.animId); }

  private startIdleLoop() {
    const loop = () => {
      if (this.phase() === 'idle') {
        this.drawFrame();
        this.animId = requestAnimationFrame(loop);
      }
    };
    this.animId = requestAnimationFrame(loop);
  }

  onMove(e: MouseEvent) {
    if (this.phase() !== 'idle') return;
    const r = this.toCanvas(e);
    this.hX = r.x; this.hY = r.y;
    this.hZone = this.getZone(r.x, r.y);
  }
  onLeave() { this.hX=-1; this.hY=-1; this.hZone=null; }

  onClick(e: MouseEvent) {
    if (this.phase() !== 'idle') return;
    const r = this.toCanvas(e);
    const z = this.getZone(r.x, r.y);
    if (!z) return;
    this.shotZone = z;
    this.fireShot();
  }

  private toCanvas(e: MouseEvent) {
    const c = this.canvasRef.nativeElement, rc = c.getBoundingClientRect();
    return { x:(e.clientX-rc.left)*this.W/rc.width, y:(e.clientY-rc.top)*this.H/rc.height };
  }

  private getZone(px: number, py: number): Zone|null {
    if (px < this.GL || px > this.GR || py < this.GT || py > this.GB) return null;
    const col = Math.min(2, Math.floor((px - this.GL) / (this.GW/3))) as 0|1|2;
    const row = Math.min(2, Math.floor((py - this.GT) / (this.GH/3))) as 0|1|2;
    return { col, row };
  }

  private fireShot() {
    cancelAnimationFrame(this.animId);
    this.phase.set('shooting');

    // Keeper picks a random zone — weighted to NOT go to shot zone (realistic)
    const allZones: Zone[] = [];
    for (let col=0; col<3; col++) for (let row=0; row<3; row++) {
      allZones.push({col: col as 0|1|2, row: row as 0|1|2});
    }
    // 30% chance keeper gets the right zone
    if (Math.random() < 0.30) {
      this.keeperZone = { ...this.shotZone };
    } else {
      // Random zone that differs from shot
      const others = allZones.filter(z => !(z.col===this.shotZone.col && z.row===this.shotZone.row));
      this.keeperZone = others[Math.floor(Math.random()*others.length)];
    }
    this.progress = 0;
    this.zone.runOutsideAngular(() => this.animate());
  }

  private animate() {
    this.progress += 0.038;
    if (this.progress >= 1) {
      this.progress = 1;
      const scored = !(this.keeperZone.col===this.shotZone.col && this.keeperZone.row===this.shotZone.row);
      this.zone.run(() => {
        this.shots.update(s=>s+1);
        if (scored) this.goals.update(g=>g+1);
        this.lastGoal.set(scored);
        this.phase.set('result');
        this.drawFrame();
        setTimeout(() => {
          // Reset keeper to centre
          this.keeperX = this.zoneCX(1);
          this.keeperY = this.zoneCY(1);
          this.phase.set('idle');
          this.startIdleLoop();
        }, 1800);
      });
      return;
    }
    this.drawFrame();
    this.animId = requestAnimationFrame(() => this.animate());
  }

  reset() {
    cancelAnimationFrame(this.animId);
    this.goals.set(0); this.shots.set(0); this.lastGoal.set(false);
    this.keeperX = this.zoneCX(1); this.keeperY = this.zoneCY(1);
    this.progress = 0; this.phase.set('idle');
    this.startIdleLoop();
  }

  private lerp(a:number,b:number,t:number){return a+(b-a)*t;}
  private ease(t:number){return 1-Math.pow(1-t,3);}
  private get vw(){return this.ts.theme()==='vaporwave';}

  // ═══════════════════════════════════════════════════════════════
  //  DRAW
  // ═══════════════════════════════════════════════════════════════
  private drawFrame() {
    const ctx=this.ctx, W=this.W, H=this.H, vw=this.vw;
    const ep=this.ease(Math.min(this.progress,1));
    const phase=this.phase();

    // Background
    if (vw) {
      const bg=ctx.createLinearGradient(0,0,0,H);
      bg.addColorStop(0,'#0a0015'); bg.addColorStop(1,'#1a003a');
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
      const hg=ctx.createRadialGradient(W/2,H*.6,0,W/2,H*.6,W*.55);
      hg.addColorStop(0,'rgba(255,45,155,.14)'); hg.addColorStop(1,'transparent');
      ctx.fillStyle=hg; ctx.fillRect(0,0,W,H);
    } else {
      const sky=ctx.createLinearGradient(0,0,0,H*.52);
      sky.addColorStop(0,'#0e2a0e'); sky.addColorStop(1,'#1a4a1a');
      ctx.fillStyle=sky; ctx.fillRect(0,0,W,H*.52);
      const g2=ctx.createLinearGradient(0,H*.52,0,H);
      g2.addColorStop(0,'#2d6e1b'); g2.addColorStop(1,'#1a4010');
      ctx.fillStyle=g2; ctx.fillRect(0,H*.52,W,H*.48);
      ctx.globalAlpha=.05;
      for(let i=0;i<16;i++){ctx.fillStyle=i%2===0?'#fff':'#000';ctx.fillRect(i*W/16,0,W/16,H);}
      ctx.globalAlpha=1;
    }

    // Goal net bg
    ctx.fillStyle=vw?'rgba(5,0,20,.8)':'rgba(0,0,0,.3)';
    ctx.fillRect(this.GL,this.GT,this.GW,this.GH);

    // Zone hover highlight
    if (phase==='idle' && this.hZone) {
      const z=this.hZone;
      ctx.fillStyle=vw?'rgba(0,245,255,.12)':'rgba(255,255,255,.1)';
      ctx.fillRect(this.zoneX(z.col)+1, this.zoneY(z.row)+1, this.GW/3-2, this.GH/3-2);
    }

    // Zone grid (subtle)
    ctx.strokeStyle=vw?'rgba(160,32,240,.25)':'rgba(255,255,255,.08)'; ctx.lineWidth=1;
    ctx.setLineDash([4,4]);
    for(let c=1;c<3;c++){ctx.beginPath();ctx.moveTo(this.zoneX(c),this.GT);ctx.lineTo(this.zoneX(c),this.GB);ctx.stroke();}
    for(let r=1;r<3;r++){ctx.beginPath();ctx.moveTo(this.GL,this.zoneY(r));ctx.lineTo(this.GR,this.zoneY(r));ctx.stroke();}
    ctx.setLineDash([]);

    // Net lines
    ctx.strokeStyle=vw?'rgba(160,32,240,.18)':'rgba(255,255,255,.08)'; ctx.lineWidth=1;
    for(let x=this.GL;x<=this.GR;x+=18){ctx.beginPath();ctx.moveTo(x,this.GT);ctx.lineTo(x,this.GB);ctx.stroke();}
    for(let y=this.GT;y<=this.GB;y+=14){ctx.beginPath();ctx.moveTo(this.GL,y);ctx.lineTo(this.GR,y);ctx.stroke();}

    // Posts & crossbar
    if(vw){ctx.shadowColor='#00f5ff';ctx.shadowBlur=14;ctx.strokeStyle='#00f5ff';}
    else  {ctx.strokeStyle='#fff';}
    ctx.lineWidth=5; ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(this.GL,this.GT);ctx.lineTo(this.GR,this.GT);
    ctx.moveTo(this.GL,this.GT);ctx.lineTo(this.GL,this.GB);
    ctx.moveTo(this.GR,this.GT);ctx.lineTo(this.GR,this.GB);
    ctx.stroke(); ctx.shadowBlur=0;

    // Penalty spot
    const spotY=H-60;
    ctx.fillStyle=vw?'rgba(0,245,255,.4)':'rgba(255,255,255,.3)';
    ctx.beginPath();ctx.arc(W/2,spotY,5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=vw?'rgba(0,245,255,.15)':'rgba(255,255,255,.12)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(W/2,spotY,100,Math.PI,0);ctx.stroke();

    // ── Keeper ────────────────────────────────────────────────────
    // Keeper moves to keeperZone centre
    const kTargetX = this.zoneCX(this.keeperZone.col);
    const kTargetY = this.zoneCY(this.keeperZone.row);
    const kCurX = (phase==='shooting'||phase==='result')
      ? this.lerp(this.keeperX, kTargetX, Math.min(ep*1.6,1))
      : this.keeperX;
    const kCurY = (phase==='shooting'||phase==='result')
      ? this.lerp(this.keeperY, kTargetY, Math.min(ep*1.6,1))
      : this.keeperY;
    this.drawKeeper(ctx, kCurX, kCurY, vw);

    // ── Ball ──────────────────────────────────────────────────────
    const ballTargetX = this.zoneCX(this.shotZone.col);
    const ballTargetY = this.zoneCY(this.shotZone.row);
    let bx=W/2, by=spotY;
    if(phase==='shooting'||phase==='result'){
      bx=this.lerp(W/2, ballTargetX, ep);
      by=this.lerp(spotY, ballTargetY, ep);
    }
    const bs=(phase==='shooting')?1-ep*.35:(phase==='result'?.65:1);
    this.drawBall(ctx,bx,by,14*bs,vw);

    // ── RAF Player ────────────────────────────────────────────────
    this.drawRAFPlayer(ctx, W/2, spotY-8, vw);
  }

  private drawKeeper(ctx:CanvasRenderingContext2D, x:number, y:number, vw:boolean) {
    ctx.save();
    if(vw){ctx.shadowColor='#00f5ff';ctx.shadowBlur=10;}
    // body — keeper jersey (green/yellow in football tradition)
    ctx.fillStyle=vw?'#7000c0':'#2ecc40';
    ctx.beginPath();ctx.roundRect(x-14,y-16,28,34,3);ctx.fill();
    // head
    ctx.fillStyle=vw?'#d0a0ff':'#f5c8a0';
    ctx.beginPath();ctx.arc(x,y-24,12,0,Math.PI*2);ctx.fill();
    // arms (wide dive toward ball zone)
    ctx.fillStyle=vw?'#7000c0':'#2ecc40';
    ctx.fillRect(x-46,y-20,32,8); // left arm
    ctx.fillRect(x+14,y-20,32,8); // right arm
    // gloves
    ctx.fillStyle=vw?'#00f5ff':'#ffd700';
    if(vw){ctx.shadowColor='#00f5ff';ctx.shadowBlur=12;}
    ctx.beginPath();ctx.arc(x-46,y-16,10,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(x+46,y-16,10,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0; ctx.restore();
  }

  private drawBall(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,vw:boolean){
    ctx.save();
    ctx.shadowColor=vw?'#ff2d9b':'rgba(0,0,0,.5)';ctx.shadowBlur=vw?14:8;
    ctx.fillStyle=vw?'#ffb0ff':'#fff';
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=vw?'#a020f0':'#1a1a1a';
    ctx.beginPath();ctx.arc(x,y-r*.38,r*.36,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  private drawRAFPlayer(ctx:CanvasRenderingContext2D,x:number,y:number,vw:boolean){
    ctx.save();
    if(vw){ctx.shadowColor='#ff2d9b';ctx.shadowBlur=8;}
    // Shorts (black)
    ctx.fillStyle='#111';
    ctx.fillRect(x-12,y,10,20);
    ctx.fillRect(x+2,y,10,20);
    // Socks (yellow/red)
    ctx.fillStyle='#ffd700';
    ctx.fillRect(x-12,y+14,10,8);
    ctx.fillRect(x+2, y+14,10,8);
    ctx.fillStyle='#c00';
    ctx.fillRect(x-12,y+14,10,3);
    ctx.fillRect(x+2, y+14,10,3);
    // Shoes
    ctx.fillStyle='#111';
    ctx.beginPath();ctx.ellipse(x-7,y+23,7,3,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(x+7,y+23,7,3,0,0,Math.PI*2);ctx.fill();
    // Jersey body — RAF RED
    ctx.fillStyle='#cc0000';
    ctx.beginPath();ctx.roundRect(x-14,y-30,28,32,3);ctx.fill();
    // Yellow shoulders / collar stripe
    ctx.fillStyle='#ffd700';
    ctx.fillRect(x-14,y-30,28,6);
    ctx.fillRect(x-14,y-30,5,32);
    ctx.fillRect(x+9, y-30,5,32);
    // Number (white)
    ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.textAlign='center';
    ctx.fillText('10',x,y-12);
    // Crest (small RAF shield)
    this.drawRAFCrest(ctx,x-4,y-26,vw);
    // Arms
    ctx.fillStyle='#cc0000';
    ctx.fillRect(x-20,y-28,7,18);
    ctx.fillRect(x+13,y-28,7,18);
    // Yellow sleeve end
    ctx.fillStyle='#ffd700';
    ctx.fillRect(x-20,y-14,7,4);
    ctx.fillRect(x+13,y-14,7,4);
    // Hands
    ctx.fillStyle=vw?'#d0a0ff':'#f5c8a0';
    ctx.beginPath();ctx.arc(x-17,y-11,4,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(x+17,y-11,4,0,Math.PI*2);ctx.fill();
    // Head
    ctx.fillStyle=vw?'#d0a0ff':'#f5c8a0';
    ctx.beginPath();ctx.arc(x,y-42,11,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#3a2000';
    ctx.beginPath();ctx.arc(x,y-46,11,Math.PI*.85,Math.PI*.1,true);ctx.fill();
    ctx.shadowBlur=0; ctx.restore();
  }

  private drawRAFCrest(ctx:CanvasRenderingContext2D,x:number,y:number,_vw:boolean){
    ctx.save();
    // Shield shape
    ctx.fillStyle='#ffd700';
    ctx.beginPath();
    ctx.moveTo(x,y);ctx.lineTo(x+9,y);ctx.lineTo(x+9,y+9);
    ctx.lineTo(x+4.5,y+13);ctx.lineTo(x,y+9);ctx.closePath();ctx.fill();
    ctx.fillStyle='#cc0000';
    ctx.font='bold 6px sans-serif';ctx.textAlign='center';
    ctx.fillText('RAF',x+4.5,y+8);
    ctx.restore();
  }
}
