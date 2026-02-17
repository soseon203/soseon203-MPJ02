// ================================================================
//  Landing Animation — 우주 운석 충돌 & 번개 & 파편 애니메이션
// ================================================================
(function(){
  const cvs=document.getElementById('landing-canvas');
  if(!cvs)return;
  const ctx=cvs.getContext('2d');
  let W,H,dpr,animId;
  const stars=[];
  const meteors=[];
  const debris=[];
  const flashes=[];
  const bolts=[];
  const STAR_COUNT=120;
  const METEOR_COUNT=6;

  // ── 리사이즈 ──
  function resize(){
    dpr=window.devicePixelRatio||1;
    W=cvs.clientWidth;H=cvs.clientHeight;
    cvs.width=W*dpr;cvs.height=H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize',resize);
  resize();

  // ── 별 배경 ──
  for(let i=0;i<STAR_COUNT;i++){
    stars.push({x:Math.random()*2000,y:Math.random()*2000,r:Math.random()*1.5+0.3,a:Math.random(),sp:Math.random()*0.005+0.002});
  }

  // ── 운석 생성 ──
  function makeMeteor(){
    const size=Math.random()*28+16;
    const edge=Math.random()*4|0;
    let x,y;
    if(edge===0){x=Math.random()*W;y=-size;}
    else if(edge===1){x=W+size;y=Math.random()*H;}
    else if(edge===2){x=Math.random()*W;y=H+size;}
    else{x=-size;y=Math.random()*H;}
    const tx=W*0.3+Math.random()*W*0.4;
    const ty=H*0.3+Math.random()*H*0.4;
    const dx=tx-x,dy=ty-y;
    const dist=Math.sqrt(dx*dx+dy*dy);
    const speed=Math.random()*0.3+0.15;
    const vx=(dx/dist)*speed;
    const vy=(dy/dist)*speed;
    const vertices=[];
    const pts=Math.floor(Math.random()*4)+6;
    for(let i=0;i<pts;i++){
      const a=(Math.PI*2/pts)*i;
      const r=size*(0.7+Math.random()*0.3);
      vertices.push({a,r});
    }
    return{x,y,vx,vy,size,rot:Math.random()*Math.PI*2,rotV:(Math.random()-0.5)*0.01,
      vertices,life:600+Math.random()*400,age:0,
      color:`hsl(${20+Math.random()*30},${40+Math.random()*20}%,${35+Math.random()*20}%)`,
      bright:`hsl(${15+Math.random()*25},${60+Math.random()*20}%,${55+Math.random()*15}%)`};
  }

  function initMeteors(){
    meteors.length=0;
    for(let i=0;i<METEOR_COUNT;i++) meteors.push(makeMeteor());
  }
  initMeteors();

  // ── 파편 생성 ──
  function spawnDebris(x,y,color,count){
    for(let i=0;i<count;i++){
      const angle=Math.random()*Math.PI*2;
      const speed=Math.random()*2.5+0.8;
      const size=Math.random()*5+2;
      debris.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
        size,rot:Math.random()*Math.PI*2,rotV:(Math.random()-0.5)*0.1,
        life:80+Math.random()*60,age:0,color});
    }
  }

  // ── 충돌 플래시 ──
  function spawnFlash(x,y){
    flashes.push({x,y,r:5,maxR:80+Math.random()*50,age:0,life:35});
  }

  // ── 번개 생성 ──
  function spawnBolt(x1,y1,x2,y2){
    const segments=[];
    const steps=8+Math.floor(Math.random()*6);
    let px=x1,py=y1;
    for(let i=1;i<=steps;i++){
      const t=i/steps;
      let nx=x1+(x2-x1)*t;
      let ny=y1+(y2-y1)*t;
      if(i<steps){
        const spread=30+Math.random()*20;
        nx+=(Math.random()-0.5)*spread;
        ny+=(Math.random()-0.5)*spread;
      }
      segments.push({x1:px,y1:py,x2:nx,y2:ny});
      // 분기 번개 (30% 확률)
      if(i>1&&i<steps&&Math.random()<0.3){
        const bLen=20+Math.random()*30;
        const bAngle=Math.atan2(ny-py,nx-px)+(Math.random()-0.5)*1.2;
        segments.push({x1:nx,y1:ny,
          x2:nx+Math.cos(bAngle)*bLen,
          y2:ny+Math.sin(bAngle)*bLen,branch:true});
      }
      px=nx;py=ny;
    }
    bolts.push({segments,age:0,life:18+Math.random()*10,
      color:`hsl(${200+Math.random()*40},100%,${75+Math.random()*20}%)`});
  }

  // ── 충돌 시 방사형 번개 ──
  function spawnRadialBolts(cx,cy,count){
    for(let i=0;i<count;i++){
      const angle=Math.random()*Math.PI*2;
      const len=60+Math.random()*80;
      spawnBolt(cx,cy,cx+Math.cos(angle)*len,cy+Math.sin(angle)*len);
    }
  }

  // ── 충돌 감지 ──
  function checkCollisions(){
    for(let i=0;i<meteors.length;i++){
      for(let j=i+1;j<meteors.length;j++){
        const a=meteors[i],b=meteors[j];
        const dx=a.x-b.x,dy=a.y-b.y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        const minDist=(a.size+b.size)*0.6;
        if(dist<minDist){
          const cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;
          // 번개 이펙트: 두 운석 사이 + 방사형
          spawnBolt(a.x,a.y,b.x,b.y);
          spawnBolt(b.x,b.y,a.x,a.y);
          spawnRadialBolts(cx,cy,4);
          // 파편 & 플래시
          spawnDebris(cx,cy,a.bright,12);
          spawnDebris(cx,cy,b.bright,12);
          spawnFlash(cx,cy);
          meteors[i]=makeMeteor();
          meteors[j]=makeMeteor();
        }
      }
    }
  }

  // ── 그리기: 별 ──
  function drawStars(){
    stars.forEach(s=>{
      s.a+=s.sp;
      const alpha=0.3+Math.sin(s.a)*0.4;
      ctx.beginPath();
      ctx.arc(s.x%W,s.y%H,s.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,255,255,${alpha})`;
      ctx.fill();
    });
  }

  // ── 그리기: 운석 ──
  function drawMeteor(m){
    ctx.save();
    ctx.translate(m.x,m.y);
    ctx.rotate(m.rot);
    ctx.beginPath();
    m.vertices.forEach((v,i)=>{
      const px=Math.cos(v.a)*v.r,py=Math.sin(v.a)*v.r;
      if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    });
    ctx.closePath();
    const g=ctx.createRadialGradient(0,0,0,0,0,m.size);
    g.addColorStop(0,m.bright);
    g.addColorStop(1,m.color);
    ctx.fillStyle=g;
    ctx.fill();
    ctx.strokeStyle='rgba(255,200,150,0.3)';
    ctx.lineWidth=1;
    ctx.stroke();
    // 크레이터
    ctx.beginPath();
    ctx.arc(m.size*0.2,-m.size*0.15,m.size*0.18,0,Math.PI*2);
    ctx.fillStyle='rgba(0,0,0,0.25)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-m.size*0.25,m.size*0.2,m.size*0.12,0,Math.PI*2);
    ctx.fillStyle='rgba(0,0,0,0.2)';
    ctx.fill();
    // 글로우
    ctx.beginPath();
    ctx.arc(0,0,m.size*1.2,0,Math.PI*2);
    const glow=ctx.createRadialGradient(0,0,m.size*0.5,0,0,m.size*1.2);
    glow.addColorStop(0,'rgba(255,180,100,0.08)');
    glow.addColorStop(1,'transparent');
    ctx.fillStyle=glow;
    ctx.fill();
    ctx.restore();
  }

  // ── 그리기: 파편 ──
  function drawDebris(d){
    const alpha=1-d.age/d.life;
    ctx.save();
    ctx.translate(d.x,d.y);
    ctx.rotate(d.rot);
    ctx.globalAlpha=alpha;
    ctx.beginPath();
    ctx.moveTo(-d.size,-d.size*0.6);
    ctx.lineTo(d.size*0.4,-d.size*0.3);
    ctx.lineTo(d.size*0.6,d.size*0.5);
    ctx.lineTo(-d.size*0.3,d.size*0.7);
    ctx.closePath();
    ctx.fillStyle=d.color;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(-d.vx*4,-d.vy*4);
    ctx.strokeStyle=`rgba(255,200,100,${alpha*0.5})`;
    ctx.lineWidth=1;
    ctx.stroke();
    ctx.globalAlpha=1;
    ctx.restore();
  }

  // ── 그리기: 충돌 플래시 ──
  function drawFlash(f){
    const t=f.age/f.life;
    const r=f.maxR*t;
    const alpha=(1-t)*0.8;
    const g=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,r);
    g.addColorStop(0,`rgba(200,230,255,${alpha})`);
    g.addColorStop(0.2,`rgba(100,180,255,${alpha*0.6})`);
    g.addColorStop(0.5,`rgba(150,100,255,${alpha*0.3})`);
    g.addColorStop(1,'transparent');
    ctx.beginPath();
    ctx.arc(f.x,f.y,r,0,Math.PI*2);
    ctx.fillStyle=g;
    ctx.fill();
  }

  // ── 그리기: 번개 ──
  function drawBolt(b){
    const alpha=1-b.age/b.life;
    b.segments.forEach(s=>{
      ctx.save();
      ctx.globalAlpha=alpha;
      // 글로우 레이어
      ctx.beginPath();
      ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);
      ctx.strokeStyle=b.color;
      ctx.lineWidth=s.branch?2:4;
      ctx.shadowColor=b.color;
      ctx.shadowBlur=s.branch?8:20;
      ctx.stroke();
      // 밝은 코어
      ctx.beginPath();
      ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);
      ctx.strokeStyle='rgba(255,255,255,'+alpha*0.9+')';
      ctx.lineWidth=s.branch?0.5:1.5;
      ctx.shadowBlur=0;
      ctx.stroke();
      ctx.globalAlpha=1;
      ctx.restore();
    });
  }

  // ── 성운 배경 ──
  function drawNebula(){
    const g1=ctx.createRadialGradient(W*0.3,H*0.4,0,W*0.3,H*0.4,W*0.5);
    g1.addColorStop(0,'rgba(60,20,80,0.12)');
    g1.addColorStop(1,'transparent');
    ctx.fillStyle=g1;
    ctx.fillRect(0,0,W,H);
    const g2=ctx.createRadialGradient(W*0.7,H*0.6,0,W*0.7,H*0.6,W*0.4);
    g2.addColorStop(0,'rgba(20,40,100,0.1)');
    g2.addColorStop(1,'transparent');
    ctx.fillStyle=g2;
    ctx.fillRect(0,0,W,H);
  }

  // ── 메인 루프 ──
  function frame(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#05051a';
    ctx.fillRect(0,0,W,H);
    drawNebula();
    drawStars();

    // 운석 업데이트 & 그리기
    meteors.forEach(m=>{
      m.x+=m.vx;m.y+=m.vy;
      m.rot+=m.rotV;m.age++;
      if(m.age>m.life||m.x<-100||m.x>W+100||m.y<-100||m.y>H+100){
        Object.assign(m,makeMeteor());
      }
      drawMeteor(m);
    });

    checkCollisions();

    // 번개 업데이트 & 그리기
    for(let i=bolts.length-1;i>=0;i--){
      const b=bolts[i];
      b.age++;
      if(b.age>=b.life){bolts.splice(i,1);continue;}
      drawBolt(b);
    }

    // 파편 업데이트 & 그리기
    for(let i=debris.length-1;i>=0;i--){
      const d=debris[i];
      d.x+=d.vx;d.y+=d.vy;
      d.vx*=0.97;d.vy*=0.97;
      d.rot+=d.rotV;d.age++;
      if(d.age>=d.life){debris.splice(i,1);continue;}
      drawDebris(d);
    }

    // 플래시 업데이트 & 그리기
    for(let i=flashes.length-1;i>=0;i--){
      const f=flashes[i];
      f.age++;
      if(f.age>=f.life){flashes.splice(i,1);continue;}
      drawFlash(f);
    }

    animId=requestAnimationFrame(frame);
  }

  // ── 시작/중지 ──
  window.startLandingAnim=function(){resize();frame()};
  window.stopLandingAnim=function(){if(animId){cancelAnimationFrame(animId);animId=null;}};
})();
