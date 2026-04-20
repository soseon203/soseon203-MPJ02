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

  // ── 운석 생성 (Storm Eye 시네마틱 크기) ──
  function makeMeteor(){
    const size=Math.random()*60+42;   // 42~102 (기존 16~44 대비 2~3배)
    const edge=Math.random()*4|0;
    let x,y;
    if(edge===0){x=Math.random()*W;y=-size*2;}
    else if(edge===1){x=W+size*2;y=Math.random()*H;}
    else if(edge===2){x=Math.random()*W;y=H+size*2;}
    else{x=-size*2;y=Math.random()*H;}
    const tx=W*0.35+Math.random()*W*0.3;
    const ty=H*0.35+Math.random()*H*0.3;
    const dx=tx-x,dy=ty-y;
    const dist=Math.sqrt(dx*dx+dy*dy);
    const speed=Math.random()*0.35+0.18;
    const vx=(dx/dist)*speed;
    const vy=(dy/dist)*speed;
    const vertices=[];
    const pts=Math.floor(Math.random()*4)+7;
    for(let i=0;i<pts;i++){
      const a=(Math.PI*2/pts)*i;
      const r=size*(0.72+Math.random()*0.32);
      vertices.push({a,r});
    }
    // 조명 각도: 화면 좌상단(태양/폭풍의 눈 글로우) 방향에서 옴
    const litAngle=Math.atan2(y-H*0.15, x-W*0.12);
    return{x,y,vx,vy,size,rot:Math.random()*Math.PI*2,rotV:(Math.random()-0.5)*0.006,
      vertices,life:400+Math.random()*300,age:0, litAngle,
      trail:[], // 이전 위치 히스토리
      color:`hsl(${16+Math.random()*24},${38+Math.random()*18}%,${24+Math.random()*10}%)`,
      bright:`hsl(${20+Math.random()*22},${62+Math.random()*18}%,${52+Math.random()*12}%)`,
      rim:`hsl(${14+Math.random()*16},${78+Math.random()*12}%,${62+Math.random()*10}%)`};
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

  // ── 그리기: 운석 (3D 시네마틱 셰이딩) ──
  function drawMeteor(m){
    // 1. 후광 (뜨거운 코로나 — 더 넓게)
    const corona=ctx.createRadialGradient(m.x,m.y,m.size*0.8,m.x,m.y,m.size*2.3);
    corona.addColorStop(0,'rgba(255,140,60,0.14)');
    corona.addColorStop(0.5,'rgba(255,100,40,0.06)');
    corona.addColorStop(1,'transparent');
    ctx.fillStyle=corona;
    ctx.beginPath();
    ctx.arc(m.x,m.y,m.size*2.3,0,Math.PI*2);
    ctx.fill();

    // 2. 트레일 (잔상 — 이전 위치에 희미한 점)
    for(let i=0;i<m.trail.length;i++){
      const t=m.trail[i];
      const age=(m.trail.length-i)/m.trail.length;
      const a=age*0.35;
      ctx.fillStyle=`rgba(255,140,60,${a})`;
      ctx.beginPath();
      ctx.arc(t.x,t.y,m.size*age*0.4,0,Math.PI*2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(m.x,m.y);
    ctx.rotate(m.rot);

    // 3. 운석 본체 실루엣 (다각형 shape)
    ctx.beginPath();
    m.vertices.forEach((v,i)=>{
      const px=Math.cos(v.a)*v.r,py=Math.sin(v.a)*v.r;
      if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    });
    ctx.closePath();

    // 4. 어두운 베이스 (그림자측 먼저)
    ctx.fillStyle=m.color;
    ctx.fill();

    // 5. 조명측 그라디언트 (좌상단 태양 방향에서 빛)
    const lightOff=m.size*0.55;
    const lightX=Math.cos(m.litAngle-m.rot)*lightOff;
    const lightY=Math.sin(m.litAngle-m.rot)*lightOff;
    const lit=ctx.createRadialGradient(lightX,lightY,0,lightX,lightY,m.size*1.3);
    lit.addColorStop(0,m.bright);
    lit.addColorStop(0.45,m.color);
    lit.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=lit;
    ctx.fill();

    // 6. 뜨거운 림 라이트 (빛 받는 외곽선)
    ctx.save();
    ctx.clip();
    ctx.strokeStyle=m.rim;
    ctx.lineWidth=2.5;
    ctx.shadowColor=m.rim;
    ctx.shadowBlur=12;
    // 림을 조명쪽으로만 그리기 위해 클리핑 후 라인 반복 offset
    ctx.beginPath();
    m.vertices.forEach((v,i)=>{
      const px=Math.cos(v.a)*v.r+lightX*0.35,py=Math.sin(v.a)*v.r+lightY*0.35;
      if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // 7. 기본 외곽선 (부드럽게)
    ctx.strokeStyle='rgba(20,8,4,0.55)';
    ctx.lineWidth=1.2;
    ctx.stroke();

    // 8. 크레이터 (2-3개) — 조명 반대쪽에 그림자
    for(let c=0;c<3;c++){
      const ca=(c/3)*Math.PI*2+m.rot*0.3;
      const cr=m.size*(0.3+c*0.08);
      const cx=Math.cos(ca)*cr;
      const cy=Math.sin(ca)*cr;
      const cs=m.size*(0.12+(c%2)*0.05);
      ctx.beginPath();
      ctx.arc(cx,cy,cs,0,Math.PI*2);
      ctx.fillStyle='rgba(0,0,0,0.32)';
      ctx.fill();
      // 크레이터 내부 반사광
      ctx.beginPath();
      ctx.arc(cx+cs*0.2,cy+cs*0.2,cs*0.5,0,Math.PI*2);
      ctx.fillStyle='rgba(255,180,120,0.12)';
      ctx.fill();
    }

    // 9. 하이라이트 스페큘러 (조명쪽 작은 밝은 점)
    ctx.beginPath();
    ctx.arc(lightX*0.9,lightY*0.9,m.size*0.1,0,Math.PI*2);
    ctx.fillStyle='rgba(255,230,180,0.7)';
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

  // ── 성운 배경 (시네마틱 딥 네뷸러) ──
  function drawNebula(){
    // 좌상단 폭풍의 눈 태양 — 주황/붉은 거대 글로우
    const sun=ctx.createRadialGradient(W*0.14,H*0.18,0,W*0.14,H*0.18,W*0.55);
    sun.addColorStop(0,'rgba(255,160,80,0.38)');
    sun.addColorStop(0.18,'rgba(255,110,60,0.22)');
    sun.addColorStop(0.42,'rgba(220,60,100,0.12)');
    sun.addColorStop(0.7,'rgba(120,40,140,0.06)');
    sun.addColorStop(1,'transparent');
    ctx.fillStyle=sun;
    ctx.fillRect(0,0,W,H);

    // 보라 네뷸러 (좌측 중앙~우측)
    const neb1=ctx.createRadialGradient(W*0.45,H*0.45,0,W*0.45,H*0.45,W*0.65);
    neb1.addColorStop(0,'rgba(70,30,120,0.24)');
    neb1.addColorStop(0.4,'rgba(50,25,100,0.12)');
    neb1.addColorStop(1,'transparent');
    ctx.fillStyle=neb1;
    ctx.fillRect(0,0,W,H);

    // 파란 네뷸러 (우하단)
    const neb2=ctx.createRadialGradient(W*0.78,H*0.72,0,W*0.78,H*0.72,W*0.55);
    neb2.addColorStop(0,'rgba(30,70,140,0.22)');
    neb2.addColorStop(0.5,'rgba(20,50,110,0.1)');
    neb2.addColorStop(1,'transparent');
    ctx.fillStyle=neb2;
    ctx.fillRect(0,0,W,H);

    // 가운데 어두운 심연 (폭풍의 눈 중심)
    const core=ctx.createRadialGradient(W*0.5,H*0.5,0,W*0.5,H*0.5,W*0.35);
    core.addColorStop(0,'rgba(5,8,25,0.55)');
    core.addColorStop(0.5,'rgba(5,8,25,0.25)');
    core.addColorStop(1,'transparent');
    ctx.fillStyle=core;
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
      // 이전 위치를 트레일로 기록 (매 3프레임마다)
      if(m.age%3===0){
        m.trail.push({x:m.x,y:m.y});
        if(m.trail.length>8) m.trail.shift();
      }
      m.x+=m.vx;m.y+=m.vy;
      m.rot+=m.rotV;m.age++;
      // 조명 각도 업데이트 (위치 변할 때마다 태양 쪽으로 재계산)
      m.litAngle=Math.atan2(m.y-H*0.18, m.x-W*0.14);
      const inView=m.x>-50&&m.x<W+50&&m.y>-50&&m.y<H+50;
      if(m.age>m.life){
        if(inView){
          // 수명 다한 운석: 번개 낙뢰로 파괴
          const strikeY=Math.max(0,m.y-200-Math.random()*150);
          spawnBolt(m.x+(Math.random()-0.5)*30,strikeY,m.x,m.y);
          spawnBolt(m.x+(Math.random()-0.5)*20,strikeY-40,m.x,m.y);
          spawnDebris(m.x,m.y,m.bright,10);
          spawnFlash(m.x,m.y);
        }
        Object.assign(m,makeMeteor());
      }else if(!inView&&m.age>100){
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
