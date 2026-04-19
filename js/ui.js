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
    card.innerHTML=`<div class="skill-icon">${skill.icon}</div><div class="skill-info"><div class="skill-name">${t('sk.'+skill.id)}</div><div class="skill-desc">${t('sk.'+skill.id+'_d')}</div></div>`;
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
  // U3: 활성 스킬 아이콘 표시 (우하단 패널)
  const el=document.getElementById('active-skills');
  if(!el) return;
  el.innerHTML='';
  G.specialSkills.forEach(id=>{
    const skill=SKILL_POOL.find(s=>s.id===id);
    if(skill){
      const icon=document.createElement('span');
      icon.className='active-skill-icon';
      icon.textContent=skill.icon;
      icon.title=t('sk.'+skill.id)+'\n'+t('sk.'+skill.id+'_d');
      el.appendChild(icon);
    }
  });
  updateActiveKeystones();
}

// U3: 키스톤 활성 표시
function updateActiveKeystones(){
  const el=document.getElementById('active-keystones');
  if(!el) return;
  el.innerHTML='';
  if(!G.keystones) return;
  Object.keys(G.keystones).forEach(kid=>{
    if(!G.keystones[kid]) return;
    const node=TREE_NODES.find(n=>n.id===kid);
    if(!node) return;
    const badge=document.createElement('div');
    badge.className='keystone-badge';
    badge.title=node.ksDesc;
    badge.innerHTML=`
      <span class="keystone-badge-ico">${node.ksIcon}</span>
      <div class="keystone-badge-info">
        <div class="keystone-badge-name">${node.ksName}</div>
        <div class="keystone-badge-desc">${node.ksDesc}</div>
      </div>`;
    el.appendChild(badge);
  });
}

// U4: 콤보 표시 (processKill에서 호출)
function updateComboDisplay(){
  const el=document.getElementById('active-combo');
  if(!el) return;
  if(G.comboCount&&G.comboCount>=3){
    el.textContent='🔥 '+G.comboCount+' '+t('ui.combo');
    el.classList.remove('hidden');
  }else{
    el.classList.add('hidden');
  }
}

// U4: 레벨업 대형 텍스트 연출
function showLevelUpBanner(level){
  const area=document.getElementById('game-area');
  if(!area) return;
  const el=document.createElement('div');
  el.className='level-up-banner';
  const hint=LANG==='en'?'Skill Point acquired — check 🧬':'🧬 스킬 포인트 획득';
  el.innerHTML=`<div class="lub-main">${t('ui.level_up')}</div><div class="lub-sub">Lv.${level}</div><div class="lub-hint">${hint}</div>`;
  area.appendChild(el);
  setTimeout(()=>el.remove(),1600);
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
    const catLabel=upg.cat==='atk'?t('cat.atk'):upg.cat==='def'?t('cat.def'):t('cat.util');
    const catColor=upg.cat==='atk'?'#ff6644':upg.cat==='def'?'#44bbff':'#ffcc00';
    const card=document.createElement('div');
    card.className='upgrade-choice';
    card.dataset.id=upg.id;
    card.innerHTML=`
      <div class="upgrade-choice-icon">${upg.icon}</div>
      <div class="upgrade-choice-info">
        <div class="upgrade-choice-name">${t('up.'+upg.id)}</div>
        <div class="upgrade-choice-desc">${t('up.'+upg.id+'_d')}</div>
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
      <div class="upgrade-name">${data.icon} ${t('up.'+id)}</div>
      <div class="upgrade-desc">${t('up.'+id+'_d')}</div>
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

let _rosterWave=0,_rosterType='',_rosterLang='';
function updateEnemyRoster(){
  const wt=G.currentWaveType||'normal';
  if(_rosterWave===G.wave&&_rosterType===wt&&_rosterLang===LANG)return;
  _rosterWave=G.wave;_rosterType=wt;_rosterLang=LANG;
  const el=document.getElementById('enemy-roster');
  el.innerHTML='';
  const title=document.createElement('div');
  title.className='roster-title';
  title.textContent=t('ui.enemy_roster');
  el.appendChild(title);
  const patterns=getWavePatterns(G.wave,wt);
  patterns.forEach(p=>{
    if(p==='elite'){
      const item=document.createElement('div');item.className='roster-item';
      item.style.borderColor='rgba(255,136,68,.3)';
      const icon=createRosterCanvas('normal',false,true);
      item.appendChild(icon);
      const nm=document.createElement('span');nm.className='roster-name';nm.style.color='#ff8844';nm.textContent=t('pt.elite');item.appendChild(nm);
      const tr=document.createElement('span');tr.className='roster-trait';tr.textContent=t('pt.elite_t');item.appendChild(tr);
      el.appendChild(item);return;
    }
    if(p==='boss'){
      const item=document.createElement('div');item.className='roster-item';
      item.style.borderColor='rgba(255,34,68,.3)';
      const icon=createRosterCanvas('boss',true,false);
      item.appendChild(icon);
      const nm=document.createElement('span');nm.className='roster-name';nm.style.color='#ff2244';nm.textContent=t('pt.boss');item.appendChild(nm);
      const tr=document.createElement('span');tr.className='roster-trait';tr.textContent=t('pt.boss_t');item.appendChild(tr);
      el.appendChild(item);return;
    }
    const info=PAT_INFO[p];
    if(!info)return;
    const item=document.createElement('div');item.className='roster-item';
    item.style.borderColor=info.color+'30';
    const icon=createRosterCanvas(p,false,false);
    item.appendChild(icon);
    const nm=document.createElement('span');nm.className='roster-name';nm.style.color=info.color;nm.textContent=t('pt.'+p);item.appendChild(nm);
    const tr=document.createElement('span');tr.className='roster-trait';tr.textContent=t('pt.'+p+'_t');item.appendChild(tr);
    el.appendChild(item);
  });
}

// ================================================================
//  UI 업데이트
// ================================================================
function updateUI(){
  // energy-value DOM 업데이트 생략 — 하단 패널 제거됨 (legacy hidden)
  document.getElementById('stat-dmg').textContent=G.damage;
  document.getElementById('stat-auto').textContent=G.autoRate.toFixed(1);
  document.getElementById('stat-kills').textContent=G.totalKills;

  document.getElementById('wave-badge').textContent='WAVE '+G.wave;
  const alive=G.enemies.filter(e=>e.hp>0).length;
  document.getElementById('enemy-count').textContent=G.waveState==='active'?t('ui.enemy_prefix')+tf('ui.enemy_count',{alive:alive,remain:G.enemiesToSpawn-G.enemiesKilled}):t('ui.wave_waiting');
  updateEnemyRoster();

  const hpPct=Math.max(0,G.hp/G.maxHp*100);
  const _hpBar=document.getElementById('hp-bar');
  if(_hpBar){
    _hpBar.style.width=hpPct+'%';
    _hpBar.style.background=hpPct>50?'linear-gradient(90deg,#44ff44,#88ff44)':hpPct>25?'linear-gradient(90deg,#ffaa00,#ff6600)':'linear-gradient(90deg,#ff4444,#ff0000)';
  }
  const _hpTx=document.getElementById('hp-text'); if(_hpTx) _hpTx.textContent=Math.ceil(G.hp)+' / '+G.maxHp;
  // U2: HP 링 갱신
  const ring=document.getElementById('hp-ring');
  const ringFg=ring&&ring.querySelector('.hp-ring-fg');
  if(ringFg){
    const circ=2*Math.PI*44; // ≈ 276.46
    ringFg.setAttribute('stroke-dashoffset',circ*(1-hpPct/100));
    ring.classList.toggle('low',hpPct<=50&&hpPct>25);
    ring.classList.toggle('critical',hpPct<=25);
    const ringTx=document.getElementById('hp-ring-text');
    if(ringTx) ringTx.textContent=Math.ceil(G.hp)+' / '+G.maxHp;
  }
  // U4: 트리 버튼 SP 뱃지 펄스
  const spBadge=document.getElementById('tree-sp-badge');
  const treeBtn=document.getElementById('tree-btn');
  if(spBadge){
    if(G.skillPoints>0){
      spBadge.textContent=G.skillPoints;
      spBadge.classList.remove('hidden');
      if(treeBtn) treeBtn.classList.add('has-sp');
    }else{
      spBadge.classList.add('hidden');
      if(treeBtn) treeBtn.classList.remove('has-sp');
    }
  }

  // R1: XP 바 갱신
  const xpNeed=xpNeeded();
  const xpPct=Math.min(100,(G.xp/xpNeed)*100);
  const xpBar=document.getElementById('xp-bar');
  if(xpBar){
    xpBar.style.width=xpPct+'%';
    document.getElementById('level-text').textContent='Lv.'+G.level+(G.skillPoints>0?' (+'+G.skillPoints+' SP)':'');
    document.getElementById('xp-progress').textContent=G.xp+' / '+xpNeed;
  }

  const evo=EVOLUTIONS[G.evolutionStage];
  // 진화 배지: XP 바의 Lv.N과 중복되므로 진화 이름만 표시
  document.getElementById('evolution-badge').textContent=`⚡ ${t('evo.'+G.evolutionStage)}`;
  document.getElementById('evolution-badge').style.color=evo.color;

  // 업그레이드 버튼 갱신 — 하단 패널은 숨김 상태이지만 DOM이 남아있을 수 있어 방어적 처리
  document.querySelectorAll('.upgrade-btn').forEach(btn=>{
    const uid=btn.dataset.upgrade;
    if(!uid||!G.upgrades[uid])return;
    const lv=upLv(uid);
    // 에너지 구매 비활성화 — 항상 disabled로 (트리에서만 투자)
    btn.classList.remove('affordable');
    btn.disabled=true;
    btn.querySelector('.upgrade-level').textContent='Lv.'+lv;
    btn.querySelector('.upgrade-desc').textContent=getUpgradeDesc(uid);
  });
}

function buyUpgrade(type){
  // R1: 에너지 구매 비활성화 — 업그레이드는 레벨업 시 선택으로만 획득
  // (R4에서 에너지/구매 시스템 완전 제거 예정)
  return;
}

// ================================================================
//  R4: 레벨업 → 트리 팝업 자동 오픈 (하이브리드 — 선택 or 닫기)
// ================================================================
function openTreeOnLevelUp(){
  if(G.levelUpQueue>0){
    G.levelUpQueue=0; // 트리를 열면 큐는 소진 (포인트는 누적되어 있음)
  }
  openTreePopup(true); // levelUp 모드: 안내 메시지 바꿈
}

// ================================================================
//  R3/R4: 스킬 트리 팝업 렌더링
// ================================================================
function openTreePopup(isLevelUp){
  const popup=document.getElementById('tree-popup');
  if(!popup) return;
  G.treeOpen=true;
  if(typeof G.paused!=='undefined') G.paused=true; // 트리 열면 게임 일시정지
  document.getElementById('tree-title').textContent=isLevelUp?('⚡ '+t('ui.tree_lvup')):('🧬 '+t('ui.tree'));
  // 컬럼 헤더/서브타이틀 재생성
  const colTitles=document.querySelectorAll('.tree-col-title');
  const colMap=[['atk','🗡️','ui.col_atk','ui.col_atk_sub'],['def','🌩️','ui.col_def','ui.col_def_sub'],['util','🔋','ui.col_util','ui.col_util_sub']];
  colTitles.forEach(el=>{
    const tree=el.parentElement.dataset.tree;
    const m=colMap.find(x=>x[0]===tree);
    if(m) el.innerHTML=`${m[1]} ${t(m[2])} <span class="tree-col-sub">${t(m[3])}</span>`;
  });
  renderTree();
  popup.classList.add('show');
}
function closeTreePopup(){
  const popup=document.getElementById('tree-popup');
  if(!popup) return;
  popup.classList.remove('show');
  hideTreeTooltip();
  G.treeOpen=false;
  G.paused=false;
  saveGame();
  updateUI();
}
function renderTree(){
  document.getElementById('tree-sp').textContent=G.skillPoints;
  ['atk','def','util'].forEach(treeId=>{
    const container=document.getElementById('tree-col-'+treeId);
    if(!container) return;
    container.innerHTML='';
    // SVG 연결선 오버레이 (노드 위에 그리지 않도록 맨 아래 배치)
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class','tree-svg');
    container.appendChild(svg);

    const nodes=nodesByTree(treeId);
    const byTier={};
    nodes.forEach(n=>{ (byTier[n.tier]=byTier[n.tier]||[]).push(n); });
    // 테크트리 스타일: T7(키스톤)이 위, T1(시작)이 아래 — 내림차순 렌더링
    Object.keys(byTier).sort((a,b)=>+b-+a).forEach(tier=>{
      const tierBlock=document.createElement('div');
      tierBlock.className='tree-tier';
      const gateOpen=isTierGateOpen(treeId,+tier);
      if(!gateOpen) tierBlock.classList.add('gate-locked');
      // 티어 라벨 + 게이트 상태
      const label=document.createElement('div');
      label.className='tree-tier-label';
      const req=tierGateRequired(+tier);
      const inv=getTreeInvestedBelow(treeId,+tier);
      const labelText=(+tier===7)?('◆ '+t('ui.tier_keystone').toUpperCase()):((t('ui.tier')+' '+tier).toUpperCase());
      if(req>0){
        label.innerHTML=`<span>${labelText}</span><span class="tree-gate-info ${gateOpen?'ok':''}">${gateOpen?'✓':'🔒'} ${Math.min(inv,req)}/${req}</span>`;
      }else{
        label.textContent=labelText;
      }
      tierBlock.appendChild(label);
      // 노드 그리드 (최대 5 col)
      const grid=document.createElement('div');
      grid.className='tree-tier-grid';
      byTier[tier].sort((a,b)=>a.row-b.row).forEach(node=>{
        const el=buildTreeNodeEl(node);
        el.style.gridColumn=(node.row+1)+'/ span 1';
        grid.appendChild(el);
      });
      tierBlock.appendChild(grid);
      container.appendChild(tierBlock);
    });
  });
  // 레이아웃 완료 후 연결선 그리기 (rAF + setTimeout 2중 안전망)
  requestAnimationFrame(()=>{
    drawTreeConnections();
    // 스크롤/이미지 로딩 후 최종 위치 보정
    setTimeout(drawTreeConnections,60);
  });
}

// SVG 연결선 그리기 — Manhattan 라우팅 (직각 ㄱ자)
function drawTreeConnections(){
  ['atk','def','util'].forEach(treeId=>{
    const container=document.getElementById('tree-col-'+treeId);
    if(!container) return;
    const svg=container.querySelector('.tree-svg');
    if(!svg) return;
    svg.innerHTML='';
    const cRect=container.getBoundingClientRect();
    svg.setAttribute('width',cRect.width);
    svg.setAttribute('height',container.scrollHeight);
    svg.style.height=container.scrollHeight+'px';
    const nodes=nodesByTree(treeId);
    nodes.forEach(node=>{
      if(!node.prereqs||node.prereqs.length===0) return;
      const childEl=container.querySelector('[data-node-id="'+node.id+'"]');
      if(!childEl) return;
      const cr=childEl.getBoundingClientRect();
      const cx=cr.left-cRect.left+cr.width/2;
      const ctop=cr.top-cRect.top+container.scrollTop;    // 자식 상단
      const cy=ctop+cr.height/2;
      node.prereqs.forEach(pid=>{
        const pEl=container.querySelector('[data-node-id="'+pid+'"]');
        if(!pEl) return;
        const pr=pEl.getBoundingClientRect();
        const px=pr.left-cRect.left+pr.width/2;
        const ptop=pr.top-cRect.top+container.scrollTop;  // 부모 상단
        const py=ptop+pr.height/2;
        const parent=getTreeNode(pid);
        const parentInvested=getNodeRank(parent)>0;
        const childInvested=getNodeRank(node)>0;
        let cls='tree-line-locked';
        if(childInvested) cls='tree-line-active';
        else if(parentInvested) cls='tree-line-available';
        // 같은 col이면 직선, 다른 col이면 ㄱ자 경로
        if(Math.abs(px-cx)<2){
          // 수직 직선
          const ln=document.createElementNS('http://www.w3.org/2000/svg','line');
          ln.setAttribute('x1',px);ln.setAttribute('y1',py);
          ln.setAttribute('x2',cx);ln.setAttribute('y2',cy);
          ln.setAttribute('class',cls);
          svg.appendChild(ln);
        }else{
          // ㄱ자: 자식 중심에서 위로 나와 중간 Y에서 가로, 부모 중심으로 수직 연결
          const midY=(ptop+cr.bottom-cRect.top+container.scrollTop)/2;
          const path=document.createElementNS('http://www.w3.org/2000/svg','path');
          const d=`M ${cx} ${cy} L ${cx} ${midY} L ${px} ${midY} L ${px} ${py}`;
          path.setAttribute('d',d);
          path.setAttribute('class',cls);
          path.setAttribute('fill','none');
          svg.appendChild(path);
        }
      });
    });
  });
}
function buildTreeNodeEl(node){
  const rank=getNodeRank(node);
  const unlocked=isNodeUnlocked(node);
  const maxed=rank>=node.maxRank;
  const ksBlocked=node.type==='keystone'&&isKeystoneBlocked(node);
  const canInvest=canInvestNode(node);

  const el=document.createElement('div');
  el.className='tree-node';
  el.dataset.nodeId=node.id;
  if(node.type==='keystone') el.classList.add('keystone');
  if(rank>0) el.classList.add('invested');
  if(maxed) el.classList.add('maxed');
  else if(canInvest) el.classList.add('available');
  else if(!unlocked||ksBlocked) el.classList.add('locked');

  el.innerHTML=`
    <div class="tree-node-icon">${getNodeIcon(node)}</div>
    <div class="tree-node-rank">${rank}/${node.maxRank}</div>
  `;
  el.addEventListener('click',()=>{
    if(investNode(node)){
      sfx.upgrade();
      recalcStats();
      renderTree();
      saveGame();
    }
  });
  // 호버 툴팁
  el.addEventListener('mouseenter',e=>showTreeTooltip(node,e.currentTarget));
  el.addEventListener('mouseleave',hideTreeTooltip);
  el.addEventListener('touchstart',e=>{ showTreeTooltip(node,e.currentTarget); });
  return el;
}

// ================================================================
//  트리 노드 호버 툴팁
// ================================================================
function showTreeTooltip(node,anchor){
  const tip=document.getElementById('tree-tooltip');
  if(!tip) return;
  const rank=getNodeRank(node);
  const maxed=rank>=node.maxRank;
  const unlocked=isNodeUnlocked(node);
  const ksBlocked=node.type==='keystone'&&isKeystoneBlocked(node);
  const icon=getNodeIcon(node);
  const name=getNodeName(node);

  let html='';
  html+=`<div class="tt-header"><span class="tt-ico">${icon}</span><span class="tt-name">${name}</span></div>`;
  const tierLabel=(node.tier===7)?('◆ '+t('ui.tier_keystone')):(t('ui.tier')+' '+node.tier);
  html+=`<div class="tt-meta">${tierLabel} · ${t('ui.rank')} <b>${rank}/${node.maxRank}</b></div>`;
  html+=`<div class="tt-desc">${getNodeDesc(node)}</div>`;

  if(node.type!=='keystone'){
    if(maxed){
      html+=`<div class="tt-progress tt-max">✦ ${t('ui.max_rank')}</div>`;
    }else if(G.skillPoints>0 && canInvestNode(node)){
      const progDesc=getUpgradeDesc(node.id);
      if(progDesc){
        html+=`<div class="tt-progress">
          <div class="tt-arrow-label">⚡ ${t('ui.sp_invest')}</div>
          <div class="tt-change">${progDesc}</div>
        </div>`;
      }
    }else if(!unlocked){
      const req=tierGateRequired(node.tier);
      const inv=getTreeInvestedBelow(node.tree,node.tier);
      if(inv<req){
        html+=`<div class="tt-locked">🔒 ${tf('ui.locked_tier',{tier:node.tier,inv,req})}</div>`;
      }else if(node.prereqs&&node.prereqs.length>0){
        const missing=getMissingPrereqs(node);
        if(missing.length>0){
          const detail=missing.map(m=>`${m.name} (${m.cur}/${m.req})`).join(' + ');
          html+=`<div class="tt-locked">🔒 ${tf('ui.locked_prereq',{name:detail})}</div>`;
        }
      }
    }else if(G.skillPoints<=0){
      html+=`<div class="tt-locked">⚠️ ${t('ui.no_sp')}</div>`;
    }
  }else{
    if(rank>0){
      html+=`<div class="tt-progress tt-max">✦ ${t('ui.ks_active')}</div>`;
    }else if(ksBlocked){
      html+=`<div class="tt-locked">🔒 ${t('ui.ks_blocked')}</div>`;
    }else if(!unlocked){
      const req=tierGateRequired(7);
      const inv=getTreeInvestedBelow(node.tree,7);
      if(inv<req){
        html+=`<div class="tt-locked">🔒 ${inv}/${req}</div>`;
      }
    }
    html+=`<div class="tt-warn">⚠ ${t('ui.ks_warn')}</div>`;
  }

  tip.innerHTML=html;
  tip.classList.add('show');
  // 위치 계산 — 노드 오른쪽 or 왼쪽
  const rect=anchor.getBoundingClientRect();
  const tipW=260;
  const tipH=tip.offsetHeight||140;
  let left=rect.right+8;
  if(left+tipW>window.innerWidth-8) left=rect.left-tipW-8;
  if(left<8) left=8;
  let top=rect.top+rect.height/2-tipH/2;
  if(top<8) top=8;
  if(top+tipH>window.innerHeight-8) top=window.innerHeight-tipH-8;
  tip.style.left=left+'px';
  tip.style.top=top+'px';
}
function hideTreeTooltip(){
  const tip=document.getElementById('tree-tooltip');
  if(tip) tip.classList.remove('show');
}

// ================================================================
//  R5: 메타 팝업 (영구 성장)
// ================================================================
function showMetaPopup(){
  const popup=document.getElementById('meta-popup');
  if(!popup) return;
  // 팝업 헤더 i18n
  const h2=popup.querySelector('h2');
  if(h2) h2.textContent='🌟 '+t('ui.meta_growth');
  const sub=document.getElementById('meta-subtitle');
  if(sub) sub.textContent=t('ui.meta_prompt');
  renderMeta();
  popup.classList.add('show');
}
function hideMetaPopup(){
  document.getElementById('meta-popup').classList.remove('show');
}
function renderMeta(){
  document.getElementById('meta-rp').textContent=G.rp||0;
  const grid=document.getElementById('meta-grid');
  grid.innerHTML='';
  META_UPGRADES.forEach(mu=>{
    const r=metaRank(mu.id);
    const maxed=r>=mu.maxRank;
    const cost=metaCost(mu);
    const canBuy=!maxed&&G.rp>=cost;
    const item=document.createElement('div');
    item.className='meta-item';
    if(maxed) item.classList.add('maxed');
    else if(!canBuy) item.classList.add('locked');
    item.innerHTML=`
      <div class="meta-item-name">${mu.icon} ${metaName(mu)}</div>
      <div class="meta-item-desc">${metaDesc(mu)}</div>
      <div class="meta-item-footer">
        <span class="meta-item-rank">${r}/${mu.maxRank}</span>
        <span class="meta-item-cost">${maxed?'MAX':('💠 '+cost)}</span>
      </div>`;
    item.addEventListener('click',()=>{
      if(buyMetaUpgrade(mu.id)){ sfx.upgrade(); renderMeta(); }
    });
    grid.appendChild(item);
  });
}

// ================================================================
//  팝업 & 진화
// ================================================================
function showWavePopup(text,waveType){
  const el=document.getElementById('wave-popup');
  const tx=document.getElementById('wave-popup-text');
  tx.textContent=text;
  const _wpColors={boss:'#ff4444',nightmare:'#cc44ff',chaos:'#ff6644',elite:'#ff8844',fortress:'#8899cc',rush:'#44ddff'};
  let col='#ffee00';
  if(text.includes('BOSS'))col='#ff4444';
  else if(text.includes('CLEAR'))col='#00ffaa';
  else if(waveType&&_wpColors[waveType])col=_wpColors[waveType];
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

  document.getElementById('evo-name').textContent=t('evo.'+G.evolutionStage);
  document.getElementById('evo-name').style.color=evo.color;
  document.getElementById('evo-name').style.textShadow=`0 0 30px ${evo.color}`;
  document.getElementById('evo-desc').textContent=tf('pop.evo_desc',{count:EVOLUTIONS[G.evolutionStage].threshold});
  const popup=document.getElementById('evolution-popup');
  // 여러 번 빠르게 진화 시 이전 타이머/class 정리
  popup.classList.remove('closing');
  popup.classList.remove('show');
  void popup.offsetWidth;
  popup.classList.add('show');
  if(G._evoToastTimer) clearTimeout(G._evoToastTimer);
  G._evoToastTimer=setTimeout(()=>{
    popup.classList.add('closing');
    setTimeout(()=>{
      popup.classList.remove('show','closing');
      if(typeof saveGame==='function') saveGame();
    },500);
  },3200);
}
