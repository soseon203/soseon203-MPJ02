// ================================================================
//  특수 스킬 UI
// ================================================================
function showSkillSelection(){
  const available=SKILL_POOL.filter(s=>!G.specialSkills.includes(s.id));
  if(available.length===0)return;
  const picks=[];
  const pool=[...available];
  while(picks.length<Math.min(4,pool.length)){
    const idx=Math.floor(Math.random()*pool.length);
    picks.push(pool.splice(idx,1)[0]);
  }

  G.skillSelecting=true;
  const container=document.getElementById('skill-choices');
  container.innerHTML='';
  picks.forEach(skill=>{
    const card=document.createElement('div');
    card.className='skill-card';
    card.innerHTML=`<div class="skill-icon">${skill.icon}</div><div class="skill-info"><div class="skill-name">${skill.name}</div><div class="skill-desc">${skill.desc}</div></div>`;
    card.addEventListener('click',()=>selectSkill(skill.id));
    container.appendChild(card);
  });
  document.getElementById('skill-popup').classList.add('show');
}

function selectSkill(id){
  G.specialSkills.push(id);
  // fortress: 즉시 HP +50
  if(id==='fortress'){
    G.maxHp+=50;
    G.hp=Math.min(G.hp+50,G.maxHp);
  }
  G.skillSelecting=false;
  document.getElementById('skill-popup').classList.remove('show');
  sfx.evolution();
  screenFlash('evo');
  updateSkillDisplay();
  saveGame();
}

function updateSkillDisplay(){
  const el=document.getElementById('active-skills');
  el.innerHTML='';
  G.specialSkills.forEach(id=>{
    const skill=SKILL_POOL.find(s=>s.id===id);
    if(skill){
      const badge=document.createElement('span');
      badge.className='mini-skill';
      badge.textContent=skill.icon+' '+skill.name;
      badge.title=skill.desc;
      el.appendChild(badge);
    }
  });
}

// ================================================================
//  업그레이드 선택 팝업 (신규 — 로그라이크 스타일)
// ================================================================
function showUpgradeSelection(){
  const available=UPGRADE_POOL.filter(u=>
    !G.unlockedUpgrades.includes(u.id)&&u.unlockWave<=G.wave
  );
  if(available.length===0)return;

  const picks=[];
  const pool=[...available];
  while(picks.length<Math.min(4,pool.length)){
    const idx=Math.floor(Math.random()*pool.length);
    picks.push(pool.splice(idx,1)[0]);
  }

  G.upgradeSelecting=true;
  const container=document.getElementById('upgrade-choices');
  container.innerHTML='';
  container.classList.add('no-interact');
  picks.forEach(upg=>{
    const catLabel=upg.cat==='atk'?'공격':upg.cat==='def'?'방어':'유틸';
    const catColor=upg.cat==='atk'?'#ff6644':upg.cat==='def'?'#44bbff':'#ffcc00';
    const card=document.createElement('div');
    card.className='upgrade-choice';
    card.dataset.id=upg.id;
    card.innerHTML=`
      <div class="upgrade-choice-icon">${upg.icon}</div>
      <div class="upgrade-choice-info">
        <div class="upgrade-choice-name">${upg.name}</div>
        <div class="upgrade-choice-desc">${upg.desc}</div>
      </div>
      <div class="upgrade-choice-cat" style="color:${catColor};border-color:${catColor}">${catLabel}</div>`;
    card.addEventListener('click',()=>selectNewUpgrade(upg.id,card));
    container.appendChild(card);
  });
  const popup=document.getElementById('upgrade-popup');
  popup.classList.remove('closing');
  document.getElementById('upgrade-content').classList.add('entering');
  popup.classList.add('show');
  // 클릭 보호: 600ms 후 상호작용 허용
  setTimeout(()=>container.classList.remove('no-interact'),600);
}

function selectNewUpgrade(id,card){
  // 중복 클릭 방지
  if(document.getElementById('upgrade-choices').classList.contains('no-interact'))return;
  document.getElementById('upgrade-choices').classList.add('no-interact');
  // 선택된 카드 하이라이트, 나머지 페이드아웃
  document.querySelectorAll('.upgrade-choice').forEach(c=>{
    c.classList.add(c===card?'selected':'not-selected');
  });
  sfx.upgrade();
  // 애니메이션 후 팝업 닫기
  setTimeout(()=>{
    const popup=document.getElementById('upgrade-popup');
    popup.classList.add('closing');
    setTimeout(()=>{
      popup.classList.remove('show','closing');
      document.getElementById('upgrade-content').classList.remove('entering');
      G.unlockedUpgrades.push(id);
      G.upgrades[id]={level:0};
      G.upgradeSelecting=false;
      screenFlash('evo');
      rebuildUpgradeGrid();
      updateUI();
      saveGame();
    },350);
  },300);
}

// ================================================================
//  업그레이드 그리드 동적 생성
// ================================================================
function rebuildUpgradeGrid(){
  const grid=document.getElementById('upgrades-grid');
  grid.innerHTML='';
  G.unlockedUpgrades.forEach((id,idx)=>{
    const data=getUpgradeData(id);
    if(!data)return;
    const btn=document.createElement('button');
    btn.className='upgrade-btn';
    btn.dataset.upgrade=id;
    const hotkey=idx<10?((idx+1)%10).toString():'';
    btn.innerHTML=`
      ${hotkey?`<span class="hotkey-badge">${hotkey}</span>`:''}
      <div class="upgrade-name">${data.icon} ${data.name}</div>
      <div class="upgrade-desc">${data.desc}</div>
      <div class="upgrade-bottom">
        <span class="upgrade-cost">${formatNum(getCost(id))}</span>
        <span class="upgrade-level">Lv.${upLv(id)}</span>
      </div>`;
    btn.addEventListener('click',e=>{e.stopPropagation();buyUpgrade(id)});
    grid.appendChild(btn);
  });
}

// ================================================================
//  적 출현 목록 — 미니 암석 캔버스 아이콘
// ================================================================
const _ROSTER_COLORS={
  normal:['#ccaa88','#aa7755','#774433','#442211'],
  zigzag:['#99bbdd','#5577aa','#334466','#1a2233'],
  spiral:['#cc99dd','#8855aa','#553377','#2a1144'],
  charger:['#ffbb88','#dd5522','#992200','#551100'],
  tank:['#aabbcc','#778899','#556677','#334455'],
  splitter:['#99dd99','#558855','#336633','#1a3a1a'],
  dodger:['#ffee88','#ddaa22','#886611','#443300'],
  bomber:['#ffcc66','#ee7722','#aa3300','#551100'],
  healer:['#88ffcc','#44aa77','#227744','#113322'],
  phaser:['#dd99ff','#9944cc','#662299','#331155'],
  teleporter:['#88eeff','#44aacc','#226688','#113344'],
  shield_bearer:['#99bbdd','#6688aa','#445577','#223344'],
  comet:['#ffcc88','#ff8844','#cc4400','#661100'],
  pulse:['#ff88cc','#dd44aa','#992266','#551133'],
  swarm_mother:['#aaddaa','#66aa44','#447722','#223311'],
  freezer:['#aaeeff','#55bbdd','#337799','#1a3344'],
  mirror:['#eeeeff','#aabbcc','#778899','#445566'],
  absorber:['#dd6666','#aa2222','#771111','#440808'],
  orbiter:['#ffcc88','#ddaa44','#886611','#443300'],
  titan:['#ddaa77','#aa6633','#773311','#441a08'],
  boss:['#ffcc88','#ff6633','#cc2200','#330800'],
  elite:['#ffcc88','#dd8844','#995522','#442211']
};

function _rosterSeed(s){let h=0;for(let i=0;i<s.length;i++)h=((h<<5)-h)+s.charCodeAt(i)|0;return Math.abs(h)}

function createRosterCanvas(pattern,isBoss,isElite){
  const s=18,dp=2;
  const c=document.createElement('canvas');
  c.width=s*dp;c.height=s*dp;
  c.style.width=s+'px';c.style.height=s+'px';
  c.style.verticalAlign='middle';c.style.flexShrink='0';
  const x=c.getContext('2d');
  x.setTransform(dp,0,0,dp,0,0);
  const cx2=s/2,cy2=s/2,rad=s*0.38;

  // 시드 기반 의사 난수 (패턴마다 일정한 모양)
  let sd=_rosterSeed(pattern);
  function sr(){sd=(sd*16807)%2147483647;return(sd&0x7fffffff)/2147483647}

  const vCount=isBoss?12:pattern==='tank'||pattern==='titan'?8:isElite?7:6+Math.floor(sr()*2);
  const shape=[];
  for(let v=0;v<vCount;v++) shape.push(0.65+sr()*0.4);

  x.save();
  x.translate(cx2,cy2);

  // 글로우
  const glowCol=isBoss?'rgba(255,80,20,0.25)':isElite?'rgba(255,136,68,0.2)':null;
  if(glowCol||(PAT_INFO[pattern]&&PAT_INFO[pattern].color)){
    const gc=glowCol||PAT_INFO[pattern].color+'30';
    const gg=x.createRadialGradient(0,0,rad*0.5,0,0,rad*1.8);
    gg.addColorStop(0,gc);gg.addColorStop(1,'transparent');
    x.fillStyle=gg;x.beginPath();x.arc(0,0,rad*1.8,0,Math.PI*2);x.fill();
  }

  // 바위 외곽
  x.beginPath();
  for(let v=0;v<vCount;v++){
    const a=v/vCount*Math.PI*2;
    const rv=rad*shape[v];
    if(v===0)x.moveTo(Math.cos(a)*rv,Math.sin(a)*rv);
    else x.lineTo(Math.cos(a)*rv,Math.sin(a)*rv);
  }
  x.closePath();

  // 그라데이션 채우기 (render.js와 동일)
  const key=isBoss?'boss':isElite?'elite':pattern;
  const cols=_ROSTER_COLORS[key]||_ROSTER_COLORS.normal;
  const rg=x.createRadialGradient(-rad*0.2,-rad*0.25,0,0,0,rad*1.1);
  rg.addColorStop(0,cols[0]);rg.addColorStop(0.3,cols[1]);rg.addColorStop(0.7,cols[2]);rg.addColorStop(1,cols[3]);
  x.fillStyle=rg;x.fill();

  // 외곽선
  x.strokeStyle='rgba(0,0,0,0.35)';x.lineWidth=1;x.stroke();

  // 하이라이트 테두리
  x.beginPath();
  for(let v=0;v<vCount;v++){
    const a=v/vCount*Math.PI*2;
    const rv=rad*shape[v]*0.88;
    if(v===0)x.moveTo(Math.cos(a)*rv,Math.sin(a)*rv);
    else x.lineTo(Math.cos(a)*rv,Math.sin(a)*rv);
  }
  x.closePath();
  x.strokeStyle='rgba(255,220,180,0.12)';x.lineWidth=0.8;x.stroke();

  // 크레이터
  const crN=isBoss?3:1;
  for(let ci=0;ci<crN;ci++){
    const ca=(ci/crN)*Math.PI*2+0.5;
    const cd=rad*(0.2+ci*0.12);
    const crr=rad*(isBoss?0.12:0.15);
    const crx=Math.cos(ca)*cd,cry=Math.sin(ca)*cd;
    const cg=x.createRadialGradient(crx,cry,0,crx,cry,crr);
    cg.addColorStop(0,isBoss?'rgba(255,50,0,0.3)':'rgba(0,0,0,0.3)');
    cg.addColorStop(1,'transparent');
    x.fillStyle=cg;x.beginPath();x.arc(crx,cry,crr,0,Math.PI*2);x.fill();
  }

  // 패턴별 디테일 (게임 내 렌더링과 동일)
  if(isBoss){
    // 용암 코어
    const bcG=x.createRadialGradient(0,0,0,0,0,rad*0.4);
    bcG.addColorStop(0,'rgba(255,200,80,0.6)');bcG.addColorStop(0.5,'rgba(255,100,20,0.3)');bcG.addColorStop(1,'transparent');
    x.fillStyle=bcG;x.beginPath();x.arc(0,0,rad*0.4,0,Math.PI*2);x.fill();
    // 균열
    x.strokeStyle='rgba(255,100,20,0.5)';x.lineWidth=1;
    for(let cr2=0;cr2<3;cr2++){
      const sa=cr2/3*Math.PI*2+0.7;
      x.beginPath();x.moveTo(0,0);
      let px2=0,py2=0;
      for(let s2=0;s2<2;s2++){px2+=Math.cos(sa+s2*0.3)*(rad*0.3);py2+=Math.sin(sa+s2*0.3)*(rad*0.3);x.lineTo(px2,py2)}
      x.stroke();
    }
    // 두꺼운 테두리
    x.beginPath();for(let v=0;v<vCount;v++){const a=v/vCount*Math.PI*2;const rv=rad*shape[v];if(v===0)x.moveTo(Math.cos(a)*rv,Math.sin(a)*rv);else x.lineTo(Math.cos(a)*rv,Math.sin(a)*rv)}x.closePath();
    x.strokeStyle='rgba(180,60,10,0.5)';x.lineWidth=2;x.stroke();
  }else if(pattern==='splitter'){
    x.strokeStyle='rgba(68,255,68,0.5)';x.lineWidth=1;
    for(let cr2=0;cr2<2;cr2++){const cra=cr2/2*Math.PI*2+0.8;x.beginPath();x.moveTo(0,0);let cpx=0,cpy=0;for(let s2=0;s2<2;s2++){cpx+=Math.cos(cra+s2*0.4)*(rad*0.35);cpy+=Math.sin(cra+s2*0.4)*(rad*0.35);x.lineTo(cpx,cpy)}x.stroke()}
  }else if(pattern==='tank'){
    x.beginPath();for(let v=0;v<vCount;v++){const a=v/vCount*Math.PI*2;const rv=rad*shape[v];if(v===0)x.moveTo(Math.cos(a)*rv,Math.sin(a)*rv);else x.lineTo(Math.cos(a)*rv,Math.sin(a)*rv)}x.closePath();
    x.strokeStyle='rgba(150,170,190,0.5)';x.lineWidth=2;x.stroke();
  }else if(pattern==='healer'){
    x.strokeStyle='rgba(68,255,170,0.7)';x.lineWidth=1.5;
    x.beginPath();x.moveTo(0,-rad*0.35);x.lineTo(0,rad*0.35);x.stroke();
    x.beginPath();x.moveTo(-rad*0.35,0);x.lineTo(rad*0.35,0);x.stroke();
  }else if(pattern==='bomber'){
    const bg=x.createRadialGradient(0,0,0,0,0,rad*0.4);
    bg.addColorStop(0,'rgba(255,150,0,0.6)');bg.addColorStop(1,'transparent');
    x.fillStyle=bg;x.beginPath();x.arc(0,0,rad*0.4,0,Math.PI*2);x.fill();
  }else if(pattern==='shield_bearer'){
    x.strokeStyle='rgba(100,136,204,0.6)';x.lineWidth=1.5;
    x.beginPath();x.arc(0,-rad*0.1,rad*0.3,Math.PI,0);x.lineTo(0,rad*0.35);x.closePath();x.stroke();
  }else if(pattern==='teleporter'){
    x.fillStyle='rgba(34,221,255,0.5)';x.beginPath();x.arc(0,0,rad*0.25,0,Math.PI*2);x.fill();
  }else if(pattern==='comet'){
    const cmG=x.createRadialGradient(0,0,0,0,0,rad*0.5);
    cmG.addColorStop(0,'rgba(255,200,100,0.6)');cmG.addColorStop(1,'transparent');
    x.fillStyle=cmG;x.beginPath();x.arc(0,0,rad*0.5,0,Math.PI*2);x.fill();
  }else if(pattern==='pulse'){
    x.strokeStyle='rgba(255,68,170,0.5)';x.lineWidth=0.8;
    x.beginPath();x.arc(0,0,rad*0.5,0,Math.PI*2);x.stroke();
    x.beginPath();x.moveTo(0,-rad*0.5);x.lineTo(0,rad*0.5);x.stroke();
    x.beginPath();x.moveTo(-rad*0.5,0);x.lineTo(rad*0.5,0);x.stroke();
  }else if(pattern==='swarm_mother'){
    for(let eg=0;eg<3;eg++){const ea=eg/3*Math.PI*2;const er=rad*0.4;
    x.fillStyle='rgba(170,255,100,0.5)';x.beginPath();x.arc(Math.cos(ea)*er,Math.sin(ea)*er,rad*0.12,0,Math.PI*2);x.fill()}
  }else if(pattern==='freezer'){
    x.strokeStyle='rgba(68,204,255,0.7)';x.lineWidth=1;
    for(let fl=0;fl<3;fl++){const fa=fl/3*Math.PI*2;
    x.beginPath();x.moveTo(Math.cos(fa)*rad*0.45,Math.sin(fa)*rad*0.45);x.lineTo(Math.cos(fa+Math.PI)*rad*0.45,Math.sin(fa+Math.PI)*rad*0.45);x.stroke()}
  }else if(pattern==='mirror'){
    x.fillStyle='rgba(255,255,255,0.15)';x.beginPath();x.arc(-rad*0.2,-rad*0.2,rad*0.3,0,Math.PI*2);x.fill();
  }else if(pattern==='absorber'){
    const abG=x.createRadialGradient(0,0,0,0,0,rad*0.35);
    abG.addColorStop(0,'rgba(255,50,50,0.5)');abG.addColorStop(1,'transparent');
    x.fillStyle=abG;x.beginPath();x.arc(0,0,rad*0.35,0,Math.PI*2);x.fill();
  }else if(pattern==='orbiter'){
    x.strokeStyle='rgba(255,170,68,0.5)';x.lineWidth=0.8;
    x.beginPath();x.arc(0,0,rad*0.6,0,Math.PI*1.5);x.stroke();
  }else if(pattern==='titan'){
    x.strokeStyle='rgba(204,102,51,0.5)';x.lineWidth=1.5;
    for(let cr3=0;cr3<3;cr3++){const cra3=cr3/3*Math.PI*2+0.3;x.beginPath();x.moveTo(0,0);let cpx3=0,cpy3=0;for(let s3=0;s3<3;s3++){cpx3+=Math.cos(cra3+s3*0.35)*(rad*0.25);cpy3+=Math.sin(cra3+s3*0.35)*(rad*0.25);x.lineTo(cpx3,cpy3)}x.stroke()}
    x.beginPath();for(let v=0;v<vCount;v++){const a=v/vCount*Math.PI*2;const rv=rad*shape[v];if(v===0)x.moveTo(Math.cos(a)*rv,Math.sin(a)*rv);else x.lineTo(Math.cos(a)*rv,Math.sin(a)*rv)}x.closePath();
    x.strokeStyle='rgba(170,85,40,0.5)';x.lineWidth=2;x.stroke();
  }else if(pattern==='charger'){
    // 충전 표시 — 붉은 코어
    const chG=x.createRadialGradient(0,0,0,0,0,rad*0.3);
    chG.addColorStop(0,'rgba(255,50,0,0.4)');chG.addColorStop(1,'transparent');
    x.fillStyle=chG;x.beginPath();x.arc(0,0,rad*0.3,0,Math.PI*2);x.fill();
  }else if(pattern==='phaser'){
    // 위상 링
    x.strokeStyle='rgba(200,100,255,0.4)';x.lineWidth=0.8;
    x.beginPath();x.arc(0,0,rad*0.7,0,Math.PI*2);x.stroke();
  }else if(pattern==='dodger'){
    // 잔상 라인
    x.strokeStyle='rgba(255,238,68,0.3)';x.lineWidth=0.8;
    x.beginPath();x.moveTo(-rad*0.6,-rad*0.2);x.lineTo(rad*0.6,-rad*0.2);x.stroke();
    x.beginPath();x.moveTo(-rad*0.5,rad*0.2);x.lineTo(rad*0.5,rad*0.2);x.stroke();
  }

  if(isElite&&!isBoss){
    // 정예: 밝은 테두리
    x.beginPath();for(let v=0;v<vCount;v++){const a=v/vCount*Math.PI*2;const rv=rad*shape[v];if(v===0)x.moveTo(Math.cos(a)*rv,Math.sin(a)*rv);else x.lineTo(Math.cos(a)*rv,Math.sin(a)*rv)}x.closePath();
    x.strokeStyle='rgba(255,170,68,0.5)';x.lineWidth=1.5;x.stroke();
  }

  x.restore();
  return c;
}

let _rosterWave=0,_rosterType='';
function updateEnemyRoster(){
  const wt=G.currentWaveType||'normal';
  if(_rosterWave===G.wave&&_rosterType===wt)return;
  _rosterWave=G.wave;_rosterType=wt;
  const el=document.getElementById('enemy-roster');
  el.innerHTML='';
  const title=document.createElement('div');
  title.className='roster-title';
  title.textContent='출현 적';
  el.appendChild(title);
  const patterns=getWavePatterns(G.wave,wt);
  patterns.forEach(p=>{
    if(p==='elite'){
      const item=document.createElement('div');item.className='roster-item';
      item.style.borderColor='rgba(255,136,68,.3)';
      const icon=createRosterCanvas('normal',false,true);
      item.appendChild(icon);
      const nm=document.createElement('span');nm.className='roster-name';nm.style.color='#ff8844';nm.textContent='정예';item.appendChild(nm);
      const tr=document.createElement('span');tr.className='roster-trait';tr.textContent='강화형';item.appendChild(tr);
      el.appendChild(item);return;
    }
    if(p==='boss'){
      const item=document.createElement('div');item.className='roster-item';
      item.style.borderColor='rgba(255,34,68,.3)';
      const icon=createRosterCanvas('boss',true,false);
      item.appendChild(icon);
      const nm=document.createElement('span');nm.className='roster-name';nm.style.color='#ff2244';nm.textContent='보스';item.appendChild(nm);
      const tr=document.createElement('span');tr.className='roster-trait';tr.textContent='지진파';item.appendChild(tr);
      el.appendChild(item);return;
    }
    const info=PAT_INFO[p];
    if(!info)return;
    const item=document.createElement('div');item.className='roster-item';
    item.style.borderColor=info.color+'30';
    const icon=createRosterCanvas(p,false,false);
    item.appendChild(icon);
    const nm=document.createElement('span');nm.className='roster-name';nm.style.color=info.color;nm.textContent=info.name;item.appendChild(nm);
    const tr=document.createElement('span');tr.className='roster-trait';tr.textContent=info.trait;item.appendChild(tr);
    el.appendChild(item);
  });
}

// ================================================================
//  UI 업데이트
// ================================================================
function updateUI(){
  document.getElementById('energy-value').textContent=formatNum(G.energy);
  document.getElementById('stat-dmg').textContent=G.damage;
  document.getElementById('stat-auto').textContent=G.autoRate.toFixed(1);
  document.getElementById('stat-kills').textContent=G.totalKills;

  document.getElementById('wave-badge').textContent='WAVE '+G.wave;
  const alive=G.enemies.filter(e=>e.hp>0).length;
  document.getElementById('enemy-count').textContent=G.waveState==='active'?`적: ${alive}/${G.enemiesToSpawn-G.enemiesKilled}`:'대기 중...';
  updateEnemyRoster();

  const hpPct=Math.max(0,G.hp/G.maxHp*100);
  document.getElementById('hp-bar').style.width=hpPct+'%';
  document.getElementById('hp-bar').style.background=hpPct>50?'linear-gradient(90deg,#44ff44,#88ff44)':hpPct>25?'linear-gradient(90deg,#ffaa00,#ff6600)':'linear-gradient(90deg,#ff4444,#ff0000)';
  document.getElementById('hp-text').textContent=Math.ceil(G.hp)+' / '+G.maxHp;

  const evo=EVOLUTIONS[G.evolutionStage];
  document.getElementById('evolution-badge').textContent=`Lv.${G.evolutionStage+1} ${evo.name}`;
  document.getElementById('evolution-badge').style.color=evo.color;

  // 업그레이드 버튼 갱신 (동적)
  document.querySelectorAll('.upgrade-btn').forEach(btn=>{
    const t=btn.dataset.upgrade;
    if(!t||!G.upgrades[t])return;
    const cost=getCost(t);
    const lv=upLv(t);
    const ok=G.energy>=cost;
    btn.classList.toggle('affordable',ok);
    btn.disabled=!ok;
    btn.querySelector('.upgrade-cost').textContent=formatNum(cost);
    btn.querySelector('.upgrade-level').textContent='Lv.'+lv;
    btn.querySelector('.upgrade-desc').textContent=getUpgradeDesc(t);
  });
}

function buyUpgrade(type){
  sfx.init();sfx.resume();
  if(!G.upgrades[type])return;
  const cost=getCost(type);
  if(G.energy<cost)return;
  G.energy-=cost;
  G.upgrades[type].level++;
  if(type==='hp') G.hp=Math.min(G.hp+20,100+upLv('hp')*20);
  recalcStats();
  sfx.upgrade();
  const btn=document.querySelector(`[data-upgrade="${type}"]`);
  if(btn){btn.classList.remove('just-bought');void btn.offsetWidth;btn.classList.add('just-bought')}
  updateUI();saveGame();
}

// ================================================================
//  팝업 & 진화
// ================================================================
function showWavePopup(text){
  const el=document.getElementById('wave-popup');
  const tx=document.getElementById('wave-popup-text');
  tx.textContent=text;
  let col='#ffee00';
  if(text.includes('BOSS'))col='#ff4444';
  else if(text.includes('CLEAR'))col='#00ffaa';
  else if(text.includes('악몽'))col='#cc44ff';
  else if(text.includes('혼돈'))col='#ff6644';
  else if(text.includes('정예'))col='#ff8844';
  else if(text.includes('요새'))col='#8899cc';
  else if(text.includes('돌격'))col='#44ddff';
  tx.style.color=col;
  el.classList.remove('show');void el.offsetWidth;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),1200);
}

function checkEvolution(){
  for(let i=EVOLUTIONS.length-1;i>=0;i--){
    if(G.totalKills>=EVOLUTIONS[i].threshold&&G.evolutionStage<i){
      G.evolutionStage=i;
      showEvolution(EVOLUTIONS[i]);
      break;
    }
  }
}

function showEvolution(evo){
  sfx.evolution();
  screenFlash('evo');
  screenShake(true);
  const w=fxCanvas.width/dpr,h=fxCanvas.height/dpr;
  addExplosion(w/2,h/2,40,evo.color);

  document.getElementById('evo-name').textContent=evo.name;
  document.getElementById('evo-name').style.color=evo.color;
  document.getElementById('evo-name').style.textShadow=`0 0 30px ${evo.color}`;
  document.getElementById('evo-desc').textContent=`총 처치 ${EVOLUTIONS[G.evolutionStage].threshold}체 달성!`;
  document.getElementById('evolution-popup').classList.add('show');
}
