// ================================================================
//  렌더링
// ================================================================
const gameCanvas=document.getElementById('game-canvas');
const ctx=gameCanvas.getContext('2d');
const fxCanvas=document.getElementById('fx-canvas');
const fxCtx=fxCanvas.getContext('2d');
const bgCanvas=document.getElementById('bg-canvas');
const bgCtx=bgCanvas.getContext('2d');
let dpr=devicePixelRatio;

let fxEffects=[];
let frameCount=0;
let stars=[];

function resize(){
  dpr=devicePixelRatio;
  const areas=[
    [gameCanvas,'game-area'],
    [fxCanvas,'game-area']
  ];
  areas.forEach(([c,id])=>{
    const r=document.getElementById(id).getBoundingClientRect();
    c.width=r.width*dpr;c.height=r.height*dpr;
    c.style.width=r.width+'px';c.style.height=r.height+'px';
    c.getContext('2d').setTransform(dpr,0,0,dpr,0,0);
  });
  bgCanvas.width=innerWidth*dpr;bgCanvas.height=innerHeight*dpr;
  bgCanvas.style.width=innerWidth+'px';bgCanvas.style.height=innerHeight+'px';
  bgCtx.setTransform(dpr,0,0,dpr,0,0);
  initStars();
}

function initStars(){
  stars=[];
  for(let i=0;i<80;i++) stars.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,s:Math.random()*1.5+.5,t:Math.random()*6.28,sp:.02+Math.random()*.03});
}

// -- 메인 렌더 --
function render(){
  const w=gameCanvas.width/dpr, h=gameCanvas.height/dpr;
  const cx=w/2, cy=h/2;
  ctx.clearRect(0,0,w,h);
  const evo=EVOLUTIONS[G.evolutionStage];
  const evoTier=evo.evoTier||0;

  // 중앙 글로우
  const g1=ctx.createRadialGradient(cx,cy,0,cx,cy,h*0.35);
  g1.addColorStop(0,evo.color+'12');g1.addColorStop(1,'transparent');
  ctx.fillStyle=g1;ctx.fillRect(0,0,w,h);

  // 에너지 오브
  const orbSize=25+evoTier*6;
  const pulse=Math.sin(frameCount*0.04)*3;
  const og=ctx.createRadialGradient(cx,cy,0,cx,cy,orbSize+pulse);
  og.addColorStop(0,evo.color+'55');og.addColorStop(.6,evo.color+'15');og.addColorStop(1,'transparent');
  ctx.fillStyle=og;ctx.beginPath();ctx.arc(cx,cy,orbSize+pulse,0,Math.PI*2);ctx.fill();
  // 코어
  const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,orbSize*0.25);
  cg.addColorStop(0,'#ffffffaa');cg.addColorStop(1,evo.color+'33');
  ctx.fillStyle=cg;ctx.beginPath();ctx.arc(cx,cy,orbSize*0.25+pulse*.3,0,Math.PI*2);ctx.fill();

  // 에너지 궤도 파티클
  if(!G.orbitals||G.orbitals.length===0)initOrbitals();
  const targetCount=8+Math.floor(evoTier*4);
  while(G.orbitals.length<targetCount)G.orbitals.push(createOrbital());

  G.orbitals.forEach(p=>{
    p.angle+=p.speed;
    const r=p.radius+Math.sin(frameCount*0.02+p.phase)*8;
    const px=cx+Math.cos(p.angle)*r;
    const py=cy+Math.sin(p.angle)*r;
    p.trail.push({x:px,y:py});
    if(p.trail.length>10)p.trail.shift();
    for(let t=0;t<p.trail.length;t++){
      const ta=t/p.trail.length*p.alpha*0.4;
      const hex=Math.max(0,Math.min(255,Math.floor(ta*255))).toString(16).padStart(2,'0');
      ctx.fillStyle=evo.color+hex;
      ctx.beginPath();ctx.arc(p.trail[t].x,p.trail[t].y,p.size*(t/p.trail.length),0,Math.PI*2);ctx.fill();
    }
    const hex=Math.max(0,Math.min(255,Math.floor(p.alpha*255))).toString(16).padStart(2,'0');
    ctx.fillStyle=evo.color+hex;
    ctx.beginPath();ctx.arc(px,py,p.size,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffffff'+Math.max(0,Math.min(255,Math.floor(p.alpha*0.6*255))).toString(16).padStart(2,'0');
    ctx.beginPath();ctx.arc(px,py,p.size*0.4,0,Math.PI*2);ctx.fill();
  });

  // 에너지 링
  const ringCount=2+Math.floor(evoTier/2);
  for(let i=0;i<ringCount;i++){
    const phase=frameCount*0.015+i*Math.PI*2/ringCount;
    const ringR=50+Math.sin(phase)*15+i*30;
    const ringA=Math.max(0,Math.min(255,Math.floor((0.08+Math.sin(phase+1)*0.04)*255)));
    ctx.strokeStyle=evo.color+ringA.toString(16).padStart(2,'0');
    ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(cx,cy,ringR,0,Math.PI*2);ctx.stroke();
  }

  // 적 렌더링
  G.enemies.forEach(e=>{
    if(e.hp<=0)return;
    e.wobble+=0.05;
    e.rot+=e.rotSpeed;
    const wobX=Math.sin(e.wobble)*2;
    const ex=e.x+wobX, ey=e.y;

    // 글로우
    if(e.isBoss){
      // === 메테오 보스 ===
      const bPulse=0.6+Math.sin(frameCount*0.05)*0.15;
      // tailAngle = 이동 반대(뒤쪽)
      const tailAngle=Math.atan2(-(e.vy||0.01),-(e.vx||0.01));

      // ① 뒤쪽 충격파 링 (보스 뒤편에서 확산)
      for(let ring=0;ring<4;ring++){
        const ringPhase=(frameCount*0.025+ring*1.57)%6.28;
        const ringExpand=ringPhase/6.28;// 0~1
        const ringR=e.size*(1.5+ringExpand*5);
        const ringA=Math.max(0,0.2*(1-ringExpand));
        // 뒤쪽으로 멀리 배치
        const ringDist=e.size*(1+ringExpand*3);
        const rx=ex+Math.cos(tailAngle)*ringDist;
        const ry=ey+Math.sin(tailAngle)*ringDist;
        ctx.strokeStyle='rgba(255,'+Math.floor(80+ring*30)+',0,'+ringA+')';
        ctx.lineWidth=2.5-ring*0.5;
        ctx.beginPath();ctx.arc(rx,ry,ringR,0,Math.PI*2);ctx.stroke();
      }

      // ② 외곽 열기 글로우
      const heatG=ctx.createRadialGradient(ex,ey,e.size*0.5,ex,ey,e.size*4);
      heatG.addColorStop(0,'rgba(255,80,20,'+bPulse*0.15+')');
      heatG.addColorStop(0.4,'rgba(255,40,0,'+bPulse*0.07+')');
      heatG.addColorStop(1,'transparent');
      ctx.fillStyle=heatG;ctx.beginPath();ctx.arc(ex,ey,e.size*4,0,Math.PI*2);ctx.fill();

      // ③ 뒤쪽 잔광 (짧은 글로우, 꼬리 아님)
      for(let t=0;t<6;t++){
        const tOff=(t+1)/7;
        const wobble=Math.sin(frameCount*0.1+t*0.8)*0.2;
        const dist=e.size*(0.8+tOff*1.5);
        const tx=ex+Math.cos(tailAngle+wobble)*dist;
        const ty=ey+Math.sin(tailAngle+wobble)*dist;
        const tR=e.size*(0.7-tOff*0.3);
        const tA=0.15*(1-tOff);
        const tg=ctx.createRadialGradient(tx,ty,0,tx,ty,tR);
        tg.addColorStop(0,'rgba(255,'+Math.floor(100-tOff*60)+',0,'+tA+')');
        tg.addColorStop(1,'transparent');
        ctx.fillStyle=tg;ctx.beginPath();ctx.arc(tx,ty,tR,0,Math.PI*2);ctx.fill();
      }

      // ④ 중심 코어 글로우 (맥동)
      const coreG=ctx.createRadialGradient(ex,ey,0,ex,ey,e.size*1.8);
      coreG.addColorStop(0,'rgba(255,220,120,'+bPulse*0.5+')');
      coreG.addColorStop(0.3,'rgba(255,100,20,'+bPulse*0.3+')');
      coreG.addColorStop(0.7,'rgba(200,30,0,'+bPulse*0.1+')');
      coreG.addColorStop(1,'transparent');
      ctx.fillStyle=coreG;ctx.beginPath();ctx.arc(ex,ey,e.size*1.8,0,Math.PI*2);ctx.fill();
    }else{
      const eg=ctx.createRadialGradient(ex,ey,0,ex,ey,e.size*2.2);
      eg.addColorStop(0,(e.glowColor||'#ff8844')+'30');eg.addColorStop(1,'transparent');
      ctx.fillStyle=eg;ctx.beginPath();ctx.arc(ex,ey,e.size*2.2,0,Math.PI*2);ctx.fill();

      // 빠른 적: 유성 꼬리 이펙트
      const spd=Math.hypot(e.vx||0,e.vy||0);
      if(spd>0.6||(e.pattern==='comet'||e.pattern==='charger'&&e.charging)){
        const mTail=Math.atan2(-(e.vy||0),-(e.vx||0));
        const tailN=e.pattern==='comet'?8:5;
        const tailL=e.size*(e.pattern==='comet'?4:2.5)*Math.min(spd/1.5,1.5);
        const col=e.color||'#ff8844';
        // hex to rgb
        const cr=parseInt(col.slice(1,3),16),cg=parseInt(col.slice(3,5),16),cb=parseInt(col.slice(5,7),16);
        for(let mt=0;mt<tailN;mt++){
          const mtOff=mt/tailN;
          const mtWob=Math.sin(frameCount*0.15+mt*0.9)*0.3;
          const mtx=ex+Math.cos(mTail+mtWob)*(tailL*mtOff);
          const mty=ey+Math.sin(mTail+mtWob)*(tailL*mtOff);
          const mtR=e.size*(0.8-mtOff*0.5)*(0.4+Math.random()*0.2);
          const mtA=0.25*(1-mtOff*mtOff);
          const mtg=ctx.createRadialGradient(mtx,mty,0,mtx,mty,mtR);
          mtg.addColorStop(0,'rgba('+cr+','+cg+','+cb+','+mtA+')');
          mtg.addColorStop(1,'transparent');
          ctx.fillStyle=mtg;ctx.beginPath();ctx.arc(mtx,mty,mtR,0,Math.PI*2);ctx.fill();
        }
      }
    }

    // 위상형 투명화 글로우
    if(e.pattern==='phaser'&&e.phased){
      const phG=ctx.createRadialGradient(ex,ey,0,ex,ey,e.size*2.5);
      phG.addColorStop(0,'rgba(200,100,255,0.2)');phG.addColorStop(1,'transparent');
      ctx.fillStyle=phG;ctx.beginPath();ctx.arc(ex,ey,e.size*2.5,0,Math.PI*2);ctx.fill();
    }
    // 치유형 힐 오라
    if(e.pattern==='healer'){
      const healPulse=0.15+Math.sin(frameCount*0.06)*0.08;
      const hRing=ctx.createRadialGradient(ex,ey,e.size*1.5,ex,ey,e.size*3);
      hRing.addColorStop(0,'rgba(68,255,170,'+healPulse+')');hRing.addColorStop(1,'transparent');
      ctx.fillStyle=hRing;ctx.beginPath();ctx.arc(ex,ey,e.size*3,0,Math.PI*2);ctx.fill();
    }
    // 폭탄형 위험 글로우
    if(e.pattern==='bomber'){
      const bGlow=0.15+Math.sin(frameCount*0.1)*0.1;
      const bmG=ctx.createRadialGradient(ex,ey,0,ex,ey,e.size*2.8);
      bmG.addColorStop(0,'rgba(255,120,0,'+bGlow+')');bmG.addColorStop(1,'transparent');
      ctx.fillStyle=bmG;ctx.beginPath();ctx.arc(ex,ey,e.size*2.8,0,Math.PI*2);ctx.fill();
    }
    // 차저 충전 이펙트
    if(e.pattern==='charger'&&e.charging&&e.chargeTimer>0){
      const pulse2=0.5+Math.sin(frameCount*0.3)*0.3;
      const cg2=ctx.createRadialGradient(ex,ey,0,ex,ey,e.size*3);
      cg2.addColorStop(0,'rgba(255,0,0,'+pulse2*0.3+')');
      cg2.addColorStop(1,'transparent');
      ctx.fillStyle=cg2;ctx.beginPath();ctx.arc(ex,ey,e.size*3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,50,0,'+pulse2+')';
      ctx.font='bold '+Math.floor(e.size)+'px sans-serif';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('!',ex,ey-e.size*1.8);
    }
    // teleporter: 텔레포트 잔상 글로우
    if(e.pattern==='teleporter'){
      const tpP=0.12+Math.sin(frameCount*0.08)*0.08;
      const tpG=ctx.createRadialGradient(ex,ey,e.size,ex,ey,e.size*2.5);
      tpG.addColorStop(0,'rgba(34,221,255,'+tpP+')');tpG.addColorStop(1,'transparent');
      ctx.fillStyle=tpG;ctx.beginPath();ctx.arc(ex,ey,e.size*2.5,0,Math.PI*2);ctx.fill();
    }
    // shield_bearer: 보호막 링
    if(e.pattern==='shield_bearer'&&e.shieldHp>0){
      const shR=e.shieldHp/e.maxShieldHp;
      const shA=0.2+shR*0.3;
      ctx.strokeStyle='rgba(100,136,204,'+shA+')';ctx.lineWidth=2+shR*2;
      ctx.beginPath();ctx.arc(ex,ey,e.size*1.6,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='rgba(136,170,238,'+(shA+0.1)+')';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(ex,ey,e.size*1.6,-Math.PI/2,-Math.PI/2+Math.PI*2*shR);ctx.stroke();
    }
    // comet: 화염 꼬리
    if(e.pattern==='comet'){
      const cmG=ctx.createRadialGradient(ex,ey,0,ex,ey,e.size*3);
      cmG.addColorStop(0,'rgba(255,136,85,0.3)');cmG.addColorStop(0.5,'rgba(255,68,0,0.1)');cmG.addColorStop(1,'transparent');
      ctx.fillStyle=cmG;ctx.beginPath();ctx.arc(ex,ey,e.size*3,0,Math.PI*2);ctx.fill();
    }
    // pulse: 맥동 오라
    if(e.pattern==='pulse'){
      const plP=0.15+Math.sin(frameCount*0.07)*0.1;
      const plR=e.size*(2+Math.sin(frameCount*0.05)*0.5);
      ctx.strokeStyle='rgba(255,68,170,'+plP+')';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(ex,ey,plR,0,Math.PI*2);ctx.stroke();
    }
    // swarm_mother: 산란 오라
    if(e.pattern==='swarm_mother'){
      const smP=0.1+Math.sin(frameCount*0.04)*0.06;
      const smG=ctx.createRadialGradient(ex,ey,e.size*1.5,ex,ey,e.size*3.5);
      smG.addColorStop(0,'rgba(136,221,68,'+smP+')');smG.addColorStop(1,'transparent');
      ctx.fillStyle=smG;ctx.beginPath();ctx.arc(ex,ey,e.size*3.5,0,Math.PI*2);ctx.fill();
    }
    // freezer: 빙결 오라
    if(e.pattern==='freezer'){
      const frP=0.15+Math.sin(frameCount*0.06)*0.08;
      const frG=ctx.createRadialGradient(ex,ey,e.size,ex,ey,e.size*2.8);
      frG.addColorStop(0,'rgba(68,204,255,'+frP+')');frG.addColorStop(1,'transparent');
      ctx.fillStyle=frG;ctx.beginPath();ctx.arc(ex,ey,e.size*2.8,0,Math.PI*2);ctx.fill();
    }
    // absorber: 흡수 오라
    if(e.pattern==='absorber'){
      const abP=0.15+Math.sin(frameCount*0.08)*0.1;
      const abR=e.size*(2+(e.absorbCount||0)*0.3);
      const abG=ctx.createRadialGradient(ex,ey,e.size,ex,ey,abR);
      abG.addColorStop(0,'rgba(170,34,34,'+abP+')');abG.addColorStop(1,'transparent');
      ctx.fillStyle=abG;ctx.beginPath();ctx.arc(ex,ey,abR,0,Math.PI*2);ctx.fill();
    }
    // titan: 거대 위압 글로우
    if(e.pattern==='titan'){
      const tiG=ctx.createRadialGradient(ex,ey,e.size*0.5,ex,ey,e.size*3);
      tiG.addColorStop(0,'rgba(204,102,51,0.15)');tiG.addColorStop(0.6,'rgba(170,51,0,0.08)');tiG.addColorStop(1,'transparent');
      ctx.fillStyle=tiG;ctx.beginPath();ctx.arc(ex,ey,e.size*3,0,Math.PI*2);ctx.fill();
    }

    const flash=e.flash>0;

    ctx.save();
    ctx.translate(ex,ey);
    ctx.rotate(e.rot);

    // 바위 외곽
    ctx.beginPath();
    for(let v=0;v<e.vertices;v++){
      const a=v/e.vertices*Math.PI*2;
      const r2=e.size*e.shape[v];
      if(v===0) ctx.moveTo(Math.cos(a)*r2,Math.sin(a)*r2);
      else ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);
    }
    ctx.closePath();

    if(flash){
      ctx.fillStyle='rgba(255,255,255,0.6)';
      ctx.fill();
    }else{
      const rg=ctx.createRadialGradient(-e.size*0.2,-e.size*0.25,0,0,0,e.size*1.1);
      if(e.isBoss){
        rg.addColorStop(0,'#ffcc88');rg.addColorStop(0.2,'#ff6633');
        rg.addColorStop(0.5,'#cc2200');rg.addColorStop(0.8,'#661100');rg.addColorStop(1,'#330800');
      }else if(e.pattern==='zigzag'){
        rg.addColorStop(0,'#99bbdd');rg.addColorStop(0.3,'#5577aa');
        rg.addColorStop(0.7,'#334466');rg.addColorStop(1,'#1a2233');
      }else if(e.pattern==='spiral'){
        rg.addColorStop(0,'#cc99dd');rg.addColorStop(0.3,'#8855aa');
        rg.addColorStop(0.7,'#553377');rg.addColorStop(1,'#2a1144');
      }else if(e.pattern==='charger'){
        rg.addColorStop(0,'#ffbb88');rg.addColorStop(0.3,'#dd5522');
        rg.addColorStop(0.7,'#992200');rg.addColorStop(1,'#551100');
      }else if(e.pattern==='splitter'||e.isSplitChild){
        rg.addColorStop(0,'#99dd99');rg.addColorStop(0.3,'#558855');
        rg.addColorStop(0.7,'#336633');rg.addColorStop(1,'#1a3a1a');
      }else if(e.pattern==='tank'){
        rg.addColorStop(0,'#aabbcc');rg.addColorStop(0.3,'#778899');
        rg.addColorStop(0.7,'#556677');rg.addColorStop(1,'#334455');
      }else if(e.pattern==='dodger'){
        rg.addColorStop(0,'#ffee88');rg.addColorStop(0.3,'#ddaa22');
        rg.addColorStop(0.7,'#886611');rg.addColorStop(1,'#443300');
      }else if(e.pattern==='bomber'){
        rg.addColorStop(0,'#ffcc66');rg.addColorStop(0.3,'#ee7722');
        rg.addColorStop(0.7,'#aa3300');rg.addColorStop(1,'#551100');
      }else if(e.pattern==='healer'){
        rg.addColorStop(0,'#88ffcc');rg.addColorStop(0.3,'#44aa77');
        rg.addColorStop(0.7,'#227744');rg.addColorStop(1,'#113322');
      }else if(e.pattern==='phaser'){
        rg.addColorStop(0,'#dd99ff');rg.addColorStop(0.3,'#9944cc');
        rg.addColorStop(0.7,'#662299');rg.addColorStop(1,'#331155');
      }else if(e.pattern==='teleporter'){
        rg.addColorStop(0,'#88eeff');rg.addColorStop(0.3,'#44aacc');
        rg.addColorStop(0.7,'#226688');rg.addColorStop(1,'#113344');
      }else if(e.pattern==='shield_bearer'){
        rg.addColorStop(0,'#99bbdd');rg.addColorStop(0.3,'#6688aa');
        rg.addColorStop(0.7,'#445577');rg.addColorStop(1,'#223344');
      }else if(e.pattern==='comet'){
        rg.addColorStop(0,'#ffcc88');rg.addColorStop(0.3,'#ff8844');
        rg.addColorStop(0.7,'#cc4400');rg.addColorStop(1,'#661100');
      }else if(e.pattern==='pulse'){
        rg.addColorStop(0,'#ff88cc');rg.addColorStop(0.3,'#dd44aa');
        rg.addColorStop(0.7,'#992266');rg.addColorStop(1,'#551133');
      }else if(e.pattern==='swarm_mother'){
        rg.addColorStop(0,'#aaddaa');rg.addColorStop(0.3,'#66aa44');
        rg.addColorStop(0.7,'#447722');rg.addColorStop(1,'#223311');
      }else if(e.pattern==='freezer'){
        rg.addColorStop(0,'#aaeeff');rg.addColorStop(0.3,'#55bbdd');
        rg.addColorStop(0.7,'#337799');rg.addColorStop(1,'#1a3344');
      }else if(e.pattern==='mirror'){
        rg.addColorStop(0,'#eeeeff');rg.addColorStop(0.3,'#aabbcc');
        rg.addColorStop(0.7,'#778899');rg.addColorStop(1,'#445566');
      }else if(e.pattern==='absorber'){
        rg.addColorStop(0,'#dd6666');rg.addColorStop(0.3,'#aa2222');
        rg.addColorStop(0.7,'#771111');rg.addColorStop(1,'#440808');
      }else if(e.pattern==='orbiter'){
        rg.addColorStop(0,'#ffcc88');rg.addColorStop(0.3,'#ddaa44');
        rg.addColorStop(0.7,'#886611');rg.addColorStop(1,'#443300');
      }else if(e.pattern==='titan'){
        rg.addColorStop(0,'#ddaa77');rg.addColorStop(0.3,'#aa6633');
        rg.addColorStop(0.7,'#773311');rg.addColorStop(1,'#441a08');
      }else{
        rg.addColorStop(0,'#ccaa88');rg.addColorStop(0.3,'#aa7755');
        rg.addColorStop(0.7,'#774433');rg.addColorStop(1,'#442211');
      }
      ctx.fillStyle=rg;
      ctx.fill();

      ctx.strokeStyle='rgba(0,0,0,0.35)';
      ctx.lineWidth=1.5;
      ctx.stroke();

      // 밝은 가장자리 하이라이트
      ctx.beginPath();
      for(let v=0;v<e.vertices;v++){
        const a=v/e.vertices*Math.PI*2;
        const r2=e.size*e.shape[v]*0.92;
        if(v===0) ctx.moveTo(Math.cos(a)*r2,Math.sin(a)*r2);
        else ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);
      }
      ctx.closePath();
      ctx.strokeStyle='rgba(255,220,180,0.12)';
      ctx.lineWidth=1;
      ctx.stroke();

      // 크레이터
      const craterCount=e.isBoss?7:2;
      for(let c2=0;c2<craterCount;c2++){
        const ca=(c2/craterCount)*Math.PI*2+0.5;
        const cd=e.size*(0.2+c2*0.1);
        const cr=e.size*(e.isBoss?0.1+Math.sin(c2*1.5)*0.05:0.12+c2*0.03);
        const crx=Math.cos(ca)*cd;
        const cry=Math.sin(ca)*cd;
        const cGrad=ctx.createRadialGradient(crx,cry,0,crx,cry,cr);
        cGrad.addColorStop(0,e.isBoss?'rgba(255,50,0,0.25)':'rgba(0,0,0,0.3)');
        cGrad.addColorStop(0.5,e.isBoss?'rgba(100,0,0,0.15)':'rgba(0,0,0,0.15)');
        cGrad.addColorStop(1,'transparent');
        ctx.fillStyle=cGrad;
        ctx.beginPath();ctx.arc(crx,cry,cr,0,Math.PI*2);ctx.fill();
      }

      // 보스: 용암 코어 + 균열
      if(e.isBoss){
        const bCorePulse=0.5+Math.sin(frameCount*0.06)*0.2;
        const coreG=ctx.createRadialGradient(0,0,0,0,0,e.size*0.45);
        coreG.addColorStop(0,'rgba(255,200,80,'+bCorePulse+')');
        coreG.addColorStop(0.3,'rgba(255,100,20,'+bCorePulse*0.7+')');
        coreG.addColorStop(0.7,'rgba(200,30,0,'+bCorePulse*0.3+')');
        coreG.addColorStop(1,'transparent');
        ctx.fillStyle=coreG;
        ctx.beginPath();ctx.arc(0,0,e.size*0.45,0,Math.PI*2);ctx.fill();

        const crackAlpha=0.4+Math.sin(frameCount*0.08)*0.2;
        ctx.strokeStyle='rgba(255,100,20,'+crackAlpha+')';
        ctx.lineWidth=2.5;
        for(let cr2=0;cr2<5;cr2++){
          const sa=cr2/5*Math.PI*2+0.7;
          ctx.beginPath();ctx.moveTo(0,0);
          let px2=0,py2=0;
          for(let s2=0;s2<4;s2++){
            px2+=Math.cos(sa+s2*0.25)*(e.size*0.22);
            py2+=Math.sin(sa+s2*0.25)*(e.size*0.22);
            ctx.lineTo(px2,py2);
          }
          ctx.stroke();
        }
        // 외곽 두꺼운 테두리
        ctx.beginPath();
        for(let bv=0;bv<e.vertices;bv++){
          const ba2=bv/e.vertices*Math.PI*2;
          const br=e.size*e.shape[bv];
          if(bv===0)ctx.moveTo(Math.cos(ba2)*br,Math.sin(ba2)*br);
          else ctx.lineTo(Math.cos(ba2)*br,Math.sin(ba2)*br);
        }
        ctx.closePath();
        ctx.strokeStyle='rgba(180,60,10,0.5)';ctx.lineWidth=4;ctx.stroke();
      }
      // 분열형 균열
      if((e.pattern==='splitter')&&!e.isSplitChild){
        ctx.strokeStyle='rgba(68,255,68,0.4)';ctx.lineWidth=1.5;
        for(let cr2=0;cr2<2;cr2++){
          const cra=cr2/2*Math.PI*2+0.8;
          ctx.beginPath();ctx.moveTo(0,0);
          let cpx=0,cpy=0;
          for(let s2=0;s2<3;s2++){
            cpx+=Math.cos(cra+s2*0.4)*(e.size*0.3);
            cpy+=Math.sin(cra+s2*0.4)*(e.size*0.3);
            ctx.lineTo(cpx,cpy);
          }
          ctx.stroke();
        }
      }
      // 탱크 두꺼운 테두리
      if(e.pattern==='tank'){
        ctx.beginPath();
        for(let tv=0;tv<e.vertices;tv++){
          const ta2=tv/e.vertices*Math.PI*2;
          const tr=e.size*e.shape[tv];
          if(tv===0)ctx.moveTo(Math.cos(ta2)*tr,Math.sin(ta2)*tr);
          else ctx.lineTo(Math.cos(ta2)*tr,Math.sin(ta2)*tr);
        }
        ctx.closePath();
        ctx.strokeStyle='rgba(150,170,190,0.4)';ctx.lineWidth=3;ctx.stroke();
      }
      // 폭탄형: 내부 발광 코어 + 경고 아이콘
      if(e.pattern==='bomber'){
        const bPulse=0.5+Math.sin(frameCount*0.15)*0.3;
        const bomberG=ctx.createRadialGradient(0,0,0,0,0,e.size*0.4);
        bomberG.addColorStop(0,'rgba(255,150,0,'+bPulse+')');
        bomberG.addColorStop(1,'transparent');
        ctx.fillStyle=bomberG;
        ctx.beginPath();ctx.arc(0,0,e.size*0.4,0,Math.PI*2);ctx.fill();
      }
      // 치유형: 십자가 마크 + 힐 오라
      if(e.pattern==='healer'){
        ctx.strokeStyle='rgba(68,255,170,0.6)';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(0,-e.size*0.35);ctx.lineTo(0,e.size*0.35);ctx.stroke();
        ctx.beginPath();ctx.moveTo(-e.size*0.35,0);ctx.lineTo(e.size*0.35,0);ctx.stroke();
      }
      // 위상형: 투명화 중 반투명 처리
      if(e.pattern==='phaser'&&e.phased){
        ctx.globalAlpha=0.3;
      }
      // 회피형: 잔상 이펙트 (깜빡임)
      if(e.pattern==='dodger'&&e.dodgeCooldown>0.5){
        ctx.globalAlpha=0.4+Math.sin(frameCount*0.5)*0.3;
      }
      // teleporter: 중앙 텔레포트 코어
      if(e.pattern==='teleporter'){
        const tpF=0.4+Math.sin(frameCount*0.15)*0.3;
        ctx.fillStyle='rgba(34,221,255,'+tpF+')';
        ctx.beginPath();ctx.arc(0,0,e.size*0.25,0,Math.PI*2);ctx.fill();
      }
      // shield_bearer: 방패 아이콘
      if(e.pattern==='shield_bearer'){
        ctx.strokeStyle='rgba(100,136,204,0.5)';ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(0,-e.size*0.1,e.size*0.3,Math.PI,0);
        ctx.lineTo(0,e.size*0.35);ctx.closePath();ctx.stroke();
      }
      // comet: 화염 코어
      if(e.pattern==='comet'){
        const cmC=ctx.createRadialGradient(0,0,0,0,0,e.size*0.5);
        cmC.addColorStop(0,'rgba(255,200,100,0.6)');cmC.addColorStop(1,'transparent');
        ctx.fillStyle=cmC;ctx.beginPath();ctx.arc(0,0,e.size*0.5,0,Math.PI*2);ctx.fill();
      }
      // pulse: 조준 십자
      if(e.pattern==='pulse'){
        ctx.strokeStyle='rgba(255,68,170,0.5)';ctx.lineWidth=1;
        ctx.beginPath();ctx.arc(0,0,e.size*0.5,0,Math.PI*2);ctx.stroke();
        ctx.beginPath();ctx.moveTo(0,-e.size*0.6);ctx.lineTo(0,e.size*0.6);ctx.stroke();
        ctx.beginPath();ctx.moveTo(-e.size*0.6,0);ctx.lineTo(e.size*0.6,0);ctx.stroke();
      }
      // swarm_mother: 알 마크
      if(e.pattern==='swarm_mother'){
        for(let eg=0;eg<3;eg++){
          const ea2=eg/3*Math.PI*2+frameCount*0.01;
          const er=e.size*0.4;
          ctx.fillStyle='rgba(170,255,100,0.4)';
          ctx.beginPath();ctx.arc(Math.cos(ea2)*er,Math.sin(ea2)*er,e.size*0.12,0,Math.PI*2);ctx.fill();
        }
      }
      // freezer: 눈꽃 마크
      if(e.pattern==='freezer'){
        ctx.strokeStyle='rgba(68,204,255,0.6)';ctx.lineWidth=1.5;
        for(let fl=0;fl<3;fl++){
          const fa=fl/3*Math.PI*2;
          ctx.beginPath();ctx.moveTo(Math.cos(fa)*e.size*0.5,Math.sin(fa)*e.size*0.5);
          ctx.lineTo(Math.cos(fa+Math.PI)*e.size*0.5,Math.sin(fa+Math.PI)*e.size*0.5);ctx.stroke();
        }
      }
      // mirror: 반사 광택
      if(e.pattern==='mirror'){
        const mrF=0.1+Math.sin(frameCount*0.08)*0.1;
        ctx.fillStyle='rgba(255,255,255,'+mrF+')';
        ctx.beginPath();ctx.arc(-e.size*0.2,-e.size*0.2,e.size*0.35,0,Math.PI*2);ctx.fill();
      }
      // absorber: 흡수 코어
      if(e.pattern==='absorber'){
        const abC=ctx.createRadialGradient(0,0,0,0,0,e.size*0.35);
        abC.addColorStop(0,'rgba(255,50,50,'+(0.4+(e.absorbCount||0)*0.1)+')');abC.addColorStop(1,'transparent');
        ctx.fillStyle=abC;ctx.beginPath();ctx.arc(0,0,e.size*0.35,0,Math.PI*2);ctx.fill();
      }
      // orbiter: 궤도 호
      if(e.pattern==='orbiter'){
        ctx.strokeStyle='rgba(255,170,68,0.4)';ctx.lineWidth=1;
        ctx.beginPath();ctx.arc(0,0,e.size*0.7,frameCount*0.05,frameCount*0.05+Math.PI*1.5);ctx.stroke();
      }
      // titan: 거대 균열 + 두꺼운 테두리
      if(e.pattern==='titan'){
        ctx.strokeStyle='rgba(204,102,51,0.4)';ctx.lineWidth=2;
        for(let cr3=0;cr3<4;cr3++){
          const cra3=cr3/4*Math.PI*2+0.3;
          ctx.beginPath();ctx.moveTo(0,0);
          let cpx3=0,cpy3=0;
          for(let s3=0;s3<4;s3++){
            cpx3+=Math.cos(cra3+s3*0.35)*(e.size*0.22);
            cpy3+=Math.sin(cra3+s3*0.35)*(e.size*0.22);
            ctx.lineTo(cpx3,cpy3);
          }
          ctx.stroke();
        }
        ctx.beginPath();
        for(let tv2=0;tv2<e.vertices;tv2++){
          const ta4=tv2/e.vertices*Math.PI*2;
          const tr3=e.size*e.shape[tv2];
          if(tv2===0)ctx.moveTo(Math.cos(ta4)*tr3,Math.sin(ta4)*tr3);
          else ctx.lineTo(Math.cos(ta4)*tr3,Math.sin(ta4)*tr3);
        }
        ctx.closePath();
        ctx.strokeStyle='rgba(170,85,40,0.5)';ctx.lineWidth=4;ctx.stroke();
      }
    }

    ctx.restore();

    // HP바
    if(e.hp<e.maxHp){
      if(e.isBoss){
        // 보스: 큰 HP바 + 텍스트
        const bw=e.size*3;
        const bh=6;
        const bx=ex-bw/2;
        const by=ey-e.size*1.3-10;
        ctx.fillStyle='rgba(0,0,0,0.7)';
        ctx.fillRect(bx-2,by-2,bw+4,bh+4);
        const hpRatio=e.hp/e.maxHp;
        const hpGrad=ctx.createLinearGradient(bx,by,bx+bw*hpRatio,by);
        hpGrad.addColorStop(0,'#ff2200');hpGrad.addColorStop(1,'#ff8800');
        ctx.fillStyle=hpGrad;
        ctx.fillRect(bx,by,bw*hpRatio,bh);
        ctx.strokeStyle='rgba(255,100,0,0.4)';ctx.lineWidth=1;
        ctx.strokeRect(bx-1,by-1,bw+2,bh+2);
        ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';
        ctx.textAlign='center';ctx.textBaseline='bottom';
        ctx.fillText(Math.ceil(e.hp)+'/'+e.maxHp,ex,by-3);
      }else{
        const bw=e.size*2.5;
        const bh=3;
        const bx=ex-bw/2;
        const by=ey-e.size*1.2-6;
        ctx.fillStyle='rgba(0,0,0,0.6)';
        ctx.fillRect(bx-1,by-1,bw+2,bh+2);
        ctx.fillStyle='#ff8844';
        ctx.fillRect(bx,by,bw*(e.hp/e.maxHp),bh);
      }
    }

    e.flash=Math.max(0,e.flash-0.1);
  });

  // 공격 번개 볼트
  for(let i=zapBolts.length-1;i>=0;i--){
    const z=zapBolts[i];
    z.life-=z.decay;
    if(z.life<=0){zapBolts.splice(i,1);continue}
    const a=z.life;
    const zCol=z.color||evo.color;
    ctx.strokeStyle=zCol+Math.floor(a*80).toString(16).padStart(2,'0');
    ctx.lineWidth=6*a;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();
    z.points.forEach((p,j)=>{if(j===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)});
    ctx.stroke();
    ctx.strokeStyle=(z.color?'#ccf0ff':'#ffffff')+Math.floor(a*220).toString(16).padStart(2,'0');
    ctx.lineWidth=2*a;
    ctx.beginPath();
    z.points.forEach((p,j)=>{if(j===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)});
    ctx.stroke();
    ctx.strokeStyle=zCol+Math.floor(a*200).toString(16).padStart(2,'0');
    ctx.lineWidth=3*a;
    ctx.beginPath();
    z.points.forEach((p,j)=>{if(j===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)});
    ctx.stroke();
  }

  // 보스 투사체 렌더링
  G.bossProjectiles.forEach(p=>{
    for(let t=0;t<p.trail.length;t++){
      const ta=t/p.trail.length*0.4;
      ctx.fillStyle='#ff6622'+Math.max(0,Math.min(255,Math.floor(ta*255))).toString(16).padStart(2,'0');
      ctx.beginPath();ctx.arc(p.trail[t].x,p.trail[t].y,p.size*(t/p.trail.length),0,Math.PI*2);ctx.fill();
    }
    const pg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size*2.5);
    pg.addColorStop(0,'#ffcc44');pg.addColorStop(0.3,'#ff6622');pg.addColorStop(1,'transparent');
    ctx.fillStyle=pg;ctx.beginPath();ctx.arc(p.x,p.y,p.size*2.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffeecc';ctx.beginPath();ctx.arc(p.x,p.y,p.size*0.7,0,Math.PI*2);ctx.fill();
  });

  // 타게팅 원 (마우스 커서 주변)
  if(mouseX>0&&mouseY>0&&G.hp>0&&!G.skillSelecting&&!G.upgradeSelecting){
    const rangeBonus=upLv('range')*5+upLv('bolt_size')*10+upLv('field_expand')*8;
    const clickBonus=hasSkill('aoe_click')?1.6:1;
    const cr=(BASE_CLICK_RADIUS+rangeBonus)*clickBonus;
    // 범위 안에 적이 있으면 밝게, 없으면 어둡게
    let hasTarget=false;
    G.enemies.forEach(e=>{
      if(e.hp>0&&Math.hypot(e.x-mouseX,e.y-mouseY)<cr) hasTarget=true;
    });
    const alpha=hasTarget?0.7:0.4;
    const col=hasTarget?evoColor():'#aaddff';
    ctx.strokeStyle=col;
    ctx.globalAlpha=alpha;
    ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(mouseX,mouseY,cr,0,Math.PI*2);ctx.stroke();
    // 중심 점
    ctx.globalAlpha=Math.min(1,alpha*1.5);
    ctx.fillStyle=col;
    ctx.beginPath();ctx.arc(mouseX,mouseY,3,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
  }

  // 보스 접근 시 화면 붉어짐 + 진동
  const boss=G.enemies.find(e=>e.isBoss&&e.hp>0);
  if(boss){
    const bDist=Math.hypot(boss.x-cx,boss.y-cy);
    const maxD=Math.max(w,h)*0.6;
    const danger=Math.max(0,1-bDist/maxD);// 0(먼)~1(코어)
    if(danger>0.05){
      const d2=danger*danger;
      // 화면 전체 붉은 비네팅
      const vg=ctx.createRadialGradient(cx,cy,w*0.1,cx,cy,Math.max(w,h)*0.7);
      vg.addColorStop(0,'rgba(100,0,0,'+(d2*0.15)+')');
      vg.addColorStop(0.5,'rgba(150,0,0,'+(d2*0.25)+')');
      vg.addColorStop(1,'rgba(200,10,0,'+(d2*0.4)+')');
      ctx.fillStyle=vg;ctx.fillRect(0,0,w,h);
      // 가장자리 맥동
      const pulse=Math.sin(frameCount*0.06)*0.5+0.5;
      ctx.fillStyle='rgba(255,0,0,'+(d2*0.08*pulse)+')';
      ctx.fillRect(0,0,w,h);
    }
    // 지속 진동: 가까울수록 강하게
    const shakeAmt=danger*danger*6;// 최대 6px
    if(shakeAmt>0.3){
      const sx=(Math.random()-0.5)*shakeAmt*2;
      const sy=(Math.random()-0.5)*shakeAmt*2;
      document.getElementById('game-area').style.transform='translate('+sx+'px,'+sy+'px)';
    }else{
      document.getElementById('game-area').style.transform='';
    }
  }else{
    document.getElementById('game-area').style.transform='';
  }

  frameCount++;
}

function renderFx(){
  const w=fxCanvas.width/dpr,h=fxCanvas.height/dpr;
  fxCtx.clearRect(0,0,w,h);
  for(let i=fxEffects.length-1;i>=0;i--){
    const fx=fxEffects[i];
    fx.life-=fx.decay||0.04;
    if(fx.life<=0){fxEffects.splice(i,1);continue}
    if(fx.type==='shockwave'){
      const p=1-fx.life;
      fx.radius=p*fx.maxR;
      fxCtx.strokeStyle=fx.color+Math.floor(fx.life*0.5*255).toString(16).padStart(2,'0');
      fxCtx.lineWidth=2*fx.life;
      fxCtx.beginPath();fxCtx.arc(fx.x,fx.y,fx.radius,0,Math.PI*2);fxCtx.stroke();
    }else if(fx.type==='spark'){
      fx.x+=fx.vx;fx.y+=fx.vy;fx.vy+=0.15;fx.vx*=0.98;
      const a=fx.life/fx.maxL;const sz=fx.size*a;
      fxCtx.fillStyle=fx.color+Math.floor(a*180).toString(16).padStart(2,'0');
      fxCtx.beginPath();fxCtx.arc(fx.x,fx.y,sz,0,Math.PI*2);fxCtx.fill();
      fxCtx.fillStyle='#ffffff'+Math.floor(a*200).toString(16).padStart(2,'0');
      fxCtx.beginPath();fxCtx.arc(fx.x,fx.y,sz*.4,0,Math.PI*2);fxCtx.fill();
    }
  }
}

function renderBg(){
  const w=innerWidth,h=innerHeight;
  bgCtx.clearRect(0,0,w,h);
  const grad=bgCtx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0,'#050520');grad.addColorStop(.5,'#0a0a35');grad.addColorStop(1,'#08081a');
  bgCtx.fillStyle=grad;bgCtx.fillRect(0,0,w,h);
  if(G.evolutionStage>0){
    const et=EVOLUTIONS[G.evolutionStage].evoTier||0;
    const sg=bgCtx.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.max(w,h)*.6);
    sg.addColorStop(0,evoColor()+Math.floor(Math.min(et*2,12)).toString(16).padStart(2,'0'));
    sg.addColorStop(1,'transparent');bgCtx.fillStyle=sg;bgCtx.fillRect(0,0,w,h);
  }
  stars.forEach(s=>{
    s.t+=s.sp;
    bgCtx.fillStyle=`rgba(200,220,255,${.3+Math.sin(s.t)*.3})`;
    bgCtx.beginPath();bgCtx.arc(s.x,s.y,s.s,0,Math.PI*2);bgCtx.fill();
  });
}

function createOrbital(){
  return{
    angle:Math.random()*Math.PI*2,
    radius:35+Math.random()*90,
    speed:(0.004+Math.random()*0.012)*(Math.random()>.5?1:-1),
    size:1+Math.random()*2.5,
    alpha:0.25+Math.random()*0.45,
    phase:Math.random()*Math.PI*2,
    trail:[]
  };
}

function initOrbitals(){
  G.orbitals=[];
  const et=EVOLUTIONS[G.evolutionStage].evoTier||0;
  const count=8+Math.floor(et*4);
  for(let i=0;i<count;i++)G.orbitals.push(createOrbital());
}

// FX helpers
function addShockwave(x,y,c,r){fxEffects.push({type:'shockwave',x,y,color:c,radius:0,maxR:r||80,life:1,decay:1/20})}
function addSparks(x,y,n,c){
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2;const sp=3+Math.random()*4;
    fxEffects.push({type:'spark',x,y,color:c||'#ffee00',vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1,life:.4+Math.random()*.3,maxL:.4+Math.random()*.3,size:1.5+Math.random()*2,decay:1/30});
  }
}
function addExplosion(x,y,n,c){addSparks(x,y,n,c);addShockwave(x,y,c,n>15?120:60)}

function showFloatText(x,y,text,cls){
  const el=document.createElement('div');
  el.className='float-text '+(cls||'damage');
  el.textContent=typeof text==='number'?text:text;
  el.style.left=(x+(Math.random()-.5)*15)+'px';
  el.style.top=(y-10)+'px';
  document.getElementById('click-feedback').appendChild(el);
  setTimeout(()=>el.remove(),900);
}

function screenFlash(type){
  const f=document.createElement('div');
  f.className='screen-flash'+(type==='big'?' big':type==='evo'?' evo':'');
  document.body.appendChild(f);
  setTimeout(()=>f.remove(),type==='evo'?500:250);
}

function screenShake(big){
  const c=document.getElementById('game-container');
  c.classList.remove('shake','big-shake');void c.offsetWidth;
  c.classList.add(big?'big-shake':'shake');
  setTimeout(()=>c.classList.remove('shake','big-shake'),big?250:120);
}
