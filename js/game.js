// ================================================================
//  게임 상태
// ================================================================
const G={
  energy:0, totalEnergy:0, kills:0, totalKills:0,
  hp:100, maxHp:100, hpRegen:0,
  damage:1, autoRate:0, chainCount:0,
  wave:1, waveState:'ready',
  enemies:[], enemiesSpawned:0, enemiesToSpawn:0, enemiesKilled:0,
  spawnTimer:0, waveTimer:0, autoTimer:0, regenTimer:0,
  lastClickTime:0, bossProjectiles:[],
  evolutionStage:0, orbitals:[],
  specialSkills:[], shieldActive:false, shieldTimer:0,
  stormTimer:0, staticTimer:0, skillSelecting:false, paused:false,
  currentWaveType:'normal',
  // 업그레이드 시스템 (동적)
  unlockedUpgrades:['damage','auto'],
  upgrades:{damage:{level:0},auto:{level:0}},
  upgradeSelecting:false,
  // R1: XP/레벨업 시스템 (로그라이크 스킬트리 기반)
  xp:0, level:1, skillPoints:0, totalLevels:0,
  levelUpQueue:0, levelUpSelecting:false,
  // 신규 업그레이드 전용 상태
  rageStacks:0, rageTimer:0,
  comboCount:0, comboTimer:0,
  upgradeShieldActive:false, upgradeShieldTimer:0,
  empTimer:0,
  rebirthUsed:false
};

// ================================================================
//  R1: XP / 레벨업 공식
// ================================================================
// 레벨 n → n+1 에 필요한 XP
function xpForLevel(n){ return Math.floor(8 + n*4 + n*n*0.35); }
// 현재 레벨의 경험치 요구량
function xpNeeded(){ return xpForLevel(G.level); }
// 적 처치 시 획득 XP (보상액 기반, 최소 1)
function xpFromEnemy(enemy){
  const base=Math.max(1, Math.ceil((enemy.reward||1)/8));
  if(enemy.isBoss) return base*8;
  if(enemy.isElite) return base*2;
  return base;
}
// XP 획득 + 레벨업 체크
function gainXP(amount){
  if(amount<=0) return;
  G.xp += amount;
  while(G.xp >= xpNeeded()){
    G.xp -= xpNeeded();
    G.level++;
    G.totalLevels++;
    G.skillPoints++;
    G.levelUpQueue++;
  }
  // 레벨업 큐가 있고, 현재 아무 팝업도 안 열려있으면 선택 팝업 트리거
  if(G.levelUpQueue>0 && !G.skillSelecting && !G.upgradeSelecting && !G.levelUpSelecting && !G.paused && G.hp>0){
    if(typeof showLevelUpSelection==='function') showLevelUpSelection();
  }
}

// ================================================================
//  랭킹 시스템 (Firebase Firestore + localStorage 캐시)
// ================================================================
const RANKING_KEY='lightningRanking';
const RANKING_MAX=50;
const RANKING_COLLECTION='rankings';

// localStorage 캐시 (오프라인 폴백)
function _localLoad(){
  try{const d=localStorage.getItem(RANKING_KEY);return d?JSON.parse(d):[];}catch(e){return[]}
}
function _localSave(list){
  try{localStorage.setItem(RANKING_KEY,JSON.stringify(list))}catch(e){}
}

// Firestore에 기록 추가
async function addRankEntry(nickname){
  const entry={
    name:nickname.trim()||'???',
    wave:G.wave,
    kills:G.totalKills,
    energy:G.totalEnergy,
    evoStage:G.evolutionStage,
    damage:G.damage,
    autoRate:G.autoRate,
    skills:G.specialSkills.length,
    date:Date.now()
  };
  // Firestore 저장
  if(isFirebaseReady()){
    try{
      await _db.collection(RANKING_COLLECTION).add(entry);
    }catch(e){console.warn('Firestore write failed:',e.message)}
  }
  // localStorage 캐시에도 저장
  const list=_localLoad();
  list.push(entry);
  list.sort((a,b)=>b.wave-a.wave||b.kills-a.kills||b.energy-a.energy);
  if(list.length>RANKING_MAX)list.length=RANKING_MAX;
  _localSave(list);
  return entry;
}

// Firestore에서 랭킹 로드
async function fetchRanking(sortBy){
  if(!isFirebaseReady()) return _localLoad();
  try{
    const field=sortBy==='kills'?'kills':sortBy==='energy'?'energy':'wave';
    const snap=await _db.collection(RANKING_COLLECTION)
      .orderBy(field,'desc')
      .limit(RANKING_MAX)
      .get();
    const list=[];
    snap.forEach(doc=>list.push(doc.data()));
    _localSave(list);
    return list;
  }catch(e){
    console.warn('Firestore read failed:',e.message);
    return _localLoad();
  }
}

// 랭킹 목록 렌더링
function _renderRankList(list,sortBy){
  const container=document.getElementById('ranking-list');
  if(!list||list.length===0){
    container.innerHTML='<div class="rank-empty">'+t('ui.no_records')+'</div>';
    return;
  }
  const sorted=[...list];
  if(sortBy==='kills')sorted.sort((a,b)=>b.kills-a.kills||b.wave-a.wave);
  else if(sortBy==='energy')sorted.sort((a,b)=>b.energy-a.energy||b.wave-a.wave);
  else sorted.sort((a,b)=>b.wave-a.wave||b.kills-a.kills);

  const scoreKey=sortBy==='kills'?'kills':sortBy==='energy'?'energy':'wave';
  const scoreLabel=sortBy==='kills'?t('go.kills'):sortBy==='energy'?t('go.energy'):t('go.wave');

  container.innerHTML='';
  sorted.forEach((e,i)=>{
    const pos=i+1;
    const posClass=pos===1?'gold':pos===2?'silver':pos===3?'bronze':'';
    const topClass=pos===1?'top1':pos===2?'top2':pos===3?'top3':'';
    const evo=EVOLUTIONS[Math.min(e.evoStage||0,EVOLUTIONS.length-1)];
    const d=new Date(e.date);
    const dateStr=`${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
    const div=document.createElement('div');
    div.className='rank-entry '+topClass;
    div.innerHTML=`
      <div class="rank-pos ${posClass}">${pos<=3?['🥇','🥈','🥉'][pos-1]:pos}</div>
      <div class="rank-info">
        <div class="rank-name" style="color:${evo.color}">${escapeHtml(e.name)}</div>
        <div class="rank-detail">${tf('ui.rank_detail',{wave:e.wave,kills:formatNum(e.kills),evo:(e.evoStage||0)+1,skills:e.skills||0,date:dateStr})}</div>
      </div>
      <div class="rank-score">
        <div class="rank-score-value">${formatNum(e[scoreKey])}</div>
        <div class="rank-score-label">${scoreLabel}</div>
      </div>`;
    container.appendChild(div);
  });
}

// renderRanking: Firestore에서 비동기 로드 후 렌더링
async function renderRanking(sortBy){
  const container=document.getElementById('ranking-list');
  container.innerHTML='<div class="rank-empty rank-loading">'+t('ui.loading')+'</div>';
  const list=await fetchRanking(sortBy);
  _renderRankList(list,sortBy);
}

function escapeHtml(str){
  const d=document.createElement('div');
  d.textContent=str;
  return d.innerHTML;
}

function showRankingPopup(sortBy){
  sortBy=sortBy||'wave';
  document.querySelectorAll('.rank-tab').forEach(t=>{
    t.classList.toggle('active',t.dataset.sort===sortBy);
  });
  renderRanking(sortBy);
  document.getElementById('ranking-popup').classList.add('show');
}

function hideRankingPopup(){
  document.getElementById('ranking-popup').classList.remove('show');
}

// 타게팅 원 설정
const BASE_CLICK_RADIUS=40;
let mouseX=-999,mouseY=-999; // 마우스 커서 위치 (게임 영역 기준)

// ================================================================
//  유틸리티
// ================================================================
function formatNum(n){
  if(n<1000)return Math.floor(n).toLocaleString();
  const u=['','K','M','B','T'];
  let i=0,v=n;
  while(v>=1000&&i<u.length-1){v/=1000;i++}
  return v.toFixed(v<10?1:0)+u[i];
}
function evoColor(){return EVOLUTIONS[G.evolutionStage].color}
function getUpgradeData(id){return UPGRADE_POOL.find(u=>u.id===id)}
function upLv(id){return G.upgrades[id]?G.upgrades[id].level:0}
function getCost(type){const d=getUpgradeData(type);if(!d)return Infinity;return Math.floor(d.baseCost*Math.pow(d.mult,upLv(type)))}
function hasSkill(id){return G.specialSkills.includes(id)}
function recalcStats(){
  G.damage=1+upLv('damage');
  G.autoRate=upLv('auto')*0.35;
  G.chainCount=upLv('chain');
  G.maxHp=100+upLv('hp')*20+upLv('tough_skin')*15+upLv('hp_boost')*30+upLv('titan_guard')*50;
  G.hpRegen=upLv('hp')+upLv('regen')*0.5;
}
function getUpgradeDesc(id){
  const lv=upLv(id);
  const _V={
    damage:{cur:1+lv,next:2+lv},
    auto:{cur:(lv*0.35).toFixed(1),next:((lv+1)*0.35).toFixed(1)},
    chain:{cur:lv,next:lv+1},
    hp:{cur:100+lv*20,next:100+(lv+1)*20},
    crit:{cur:lv*3,next:(lv+1)*3},
    range:{cur:lv*5,next:(lv+1)*5},
    quick:{cur:lv*8,next:(lv+1)*8},
    barrier:{cur:lv,next:lv+1},
    overload:{cur:lv*8,next:(lv+1)*8},
    harvest:{cur:lv*10,next:(lv+1)*10},
    regen:{cur:(lv*0.5).toFixed(1),next:((lv+1)*0.5).toFixed(1)},
    splash:{cur:lv*5,next:(lv+1)*5},
    slow_aura:{cur:lv*5,next:(lv+1)*5},
    crit_dmg:{cur:(lv*0.25).toFixed(2),next:((lv+1)*0.25).toFixed(2)},
    chain_dmg:{cur:lv*10,next:(lv+1)*10},
    auto_dmg:{cur:lv*15,next:(lv+1)*15},
    vampiric:{cur:lv*2,next:(lv+1)*2},
    dodge_up:{cur:lv*3,next:(lv+1)*3},
    victory:{cur:lv*15,next:(lv+1)*15},
    multi:{cur:lv,next:lv+1},
    rage:{cur:lv*10,next:(lv+1)*10},
    absorption:{cur:lv*5,next:(lv+1)*5},
    thorns_up:{cur:lv*20,next:(lv+1)*20},
    fortune:{cur:lv*5,next:(lv+1)*5},
    chain_range:{cur:lv*30,next:(lv+1)*30},
    penetrate:{cur:lv*20,next:(lv+1)*20},
    emp:{cur:lv*30,next:(lv+1)*30},
    combo:{cur:lv*3,next:(lv+1)*3},
    auto_shield:{cur:Math.max(5,12-lv),next:Math.max(5,12-(lv+1))},
    rapid_fire:{cur:lv*20,next:(lv+1)*20},
    click_amp:{cur:lv*3,next:(lv+1)*3},
    tough_skin:{cur:lv*15,next:(lv+1)*15},
    wave_heal:{cur:lv*10,next:(lv+1)*10},
    energy_flat:{cur:lv*2,next:(lv+1)*2},
    auto_acc:{cur:lv,next:lv+1},
    precision:{cur:(lv*0.15).toFixed(2),next:((lv+1)*0.15).toFixed(2)},
    shield_wall:{cur:lv*8,next:(lv+1)*8},
    boss_hunter:{cur:lv*15,next:(lv+1)*15},
    bolt_size:{cur:lv*10,next:(lv+1)*10},
    recover:{cur:lv*2,next:(lv+1)*2},
    double_tap:{cur:lv*12,next:(lv+1)*12},
    resilience:{cur:lv>0?'2':'1',next:(lv+1)>0?'2':'1'},
    weak_point:{cur:lv*15,next:(lv+1)*15},
    elite_hunter:{cur:lv*50,next:(lv+1)*50},
    iron_core:{cur:lv*5,next:(lv+1)*5},
    chain_crit:{cur:lv*5,next:(lv+1)*5},
    hp_boost:{cur:lv*30,next:(lv+1)*30},
    splash_range:{cur:lv*20,next:(lv+1)*20},
    cooldown:{cur:lv,next:lv+1},
    energy_shield:{cur:lv*15,next:(lv+1)*15},
    execute:{cur:lv*50,next:(lv+1)*50},
    lifeline:{cur:lv*2,next:(lv+1)*2},
    surge:{cur:lv*6,next:(lv+1)*6},
    field_expand:{cur:lv*8,next:(lv+1)*8},
    bonus_wave:{cur:lv*80,next:(lv+1)*80},
    plasma:{cur:lv*20,next:(lv+1)*20},
    rebirth:{cur:lv*20,next:(lv+1)*20},
    final_strike:{cur:lv*5,next:(lv+1)*5},
    energy_storm:{cur:lv*15,next:(lv+1)*15},
    titan_guard:{cur:lv*50,next:(lv+1)*50,curR:lv*2,nextR:(lv+1)*2}
  };
  const v=_V[id];
  if(!v)return'';
  return tf('ud.'+id,v);
}

const PAT_INFO={
  normal:{name:'일반',color:'#ff6644',icon:'●',trait:'기본'},
  zigzag:{name:'지그재그',color:'#4488ff',icon:'〰',trait:'좌우 흔들림'},
  spiral:{name:'나선',color:'#aa44ff',icon:'◎',trait:'나선 접근'},
  charger:{name:'돌격',color:'#ff4400',icon:'▶',trait:'돌진'},
  tank:{name:'탱크',color:'#8899aa',icon:'■',trait:'고HP 저속'},
  splitter:{name:'분열',color:'#44dd44',icon:'◆',trait:'사망시 분열'},
  dodger:{name:'회피',color:'#ffdd22',icon:'◇',trait:'고속 회피'},
  bomber:{name:'폭격',color:'#ff6600',icon:'✸',trait:'원거리 공격'},
  healer:{name:'치유',color:'#44ffaa',icon:'✚',trait:'아군 회복'},
  phaser:{name:'위상',color:'#cc44ff',icon:'◐',trait:'면역 전환'},
  teleporter:{name:'순이동',color:'#22ddff',icon:'⊕',trait:'순간이동'},
  shield_bearer:{name:'방패',color:'#6688cc',icon:'◈',trait:'보호막'},
  comet:{name:'혜성',color:'#ff8855',icon:'✦',trait:'초고속 관통'},
  pulse:{name:'펄스',color:'#ff44aa',icon:'◉',trait:'원거리 탄'},
  swarm_mother:{name:'군단모',color:'#88dd44',icon:'♕',trait:'적 소환'},
  freezer:{name:'냉동',color:'#44ccff',icon:'❄',trait:'공속 감소'},
  mirror:{name:'분신',color:'#ccccdd',icon:'◑',trait:'사망시 복제'},
  absorber:{name:'흡수',color:'#aa2222',icon:'⊛',trait:'동료 흡수'},
  orbiter:{name:'궤도',color:'#ffaa44',icon:'○',trait:'코어 공전'},
  titan:{name:'타이탄',color:'#cc6633',icon:'⬟',trait:'초고HP'}
};

function getWavePatterns(wave,waveType){
  const wt=waveType||G.currentWaveType||'normal';
  const result=new Set();
  if(wt==='boss'){result.add('boss');result.add('normal');return result}
  // 패턴 목록 (spawnEnemy 로직과 동일)
  let pats;
  if(wt==='swarm'){
    pats=['normal','zigzag'];
    if(wave>=4)pats.push('spiral');
    if(wave>=5)pats.push('comet');
    if(wave>=7)pats.push('splitter');
    if(wave>=8)pats.push('orbiter');
    if(wave>=12)pats.push('swarm_mother');
  }else if(wt==='rush'){
    pats=['charger','zigzag','normal'];
    if(wave>=4)pats.push('comet');
    if(wave>=6)pats.push('dodger','teleporter');
    if(wave>=8)pats.push('orbiter');
    if(wave>=10)pats.push('phaser');
  }else if(wt==='fortress'){
    pats=['tank','normal'];
    if(wave>=7)pats.push('shield_bearer');
    if(wave>=8)pats.push('bomber');
    if(wave>=9)pats.push('freezer');
    if(wave>=12)pats.push('healer');
    if(wave>=14)pats.push('titan');
  }else if(wt==='elite'){
    pats=['charger','tank','spiral','zigzag'];
    if(wave>=6)pats.push('dodger','shield_bearer');
    if(wave>=8)pats.push('pulse');
    if(wave>=9)pats.push('bomber');
    if(wave>=10)pats.push('teleporter','mirror');
    if(wave>=12)pats.push('healer');
    if(wave>=14)pats.push('absorber');
    if(wave>=15)pats.push('phaser');
    if(wave>=16)pats.push('titan');
  }else if(wt==='mixed'||wt==='chaos'){
    pats=['normal','zigzag','spiral','charger','tank','splitter'];
    if(wave>=5)pats.push('comet','orbiter');
    if(wave>=7)pats.push('teleporter','shield_bearer','freezer');
    if(wave>=8)pats.push('dodger');
    if(wave>=9)pats.push('pulse','mirror');
    if(wave>=10)pats.push('bomber');
    if(wave>=11)pats.push('absorber','swarm_mother');
    if(wave>=12)pats.push('healer');
    if(wave>=14)pats.push('titan');
    if(wave>=15)pats.push('phaser');
  }else if(wt==='nightmare'){
    pats=['charger','tank','splitter','dodger','bomber','spiral'];
    if(wave>=16)pats.push('healer','teleporter','shield_bearer','freezer','pulse','comet');
    if(wave>=18)pats.push('phaser','mirror','absorber','orbiter','swarm_mother');
    if(wave>=20)pats.push('titan');
  }else{
    pats=['normal'];
    if(wave>=2)pats.push('zigzag');
    if(wave>=3)pats.push('spiral','comet');
    if(wave>=4)pats.push('charger','orbiter');
    if(wave>=5)pats.push('teleporter');
    if(wave>=6)pats.push('tank','shield_bearer');
    if(wave>=7)pats.push('splitter','freezer');
    if(wave>=8)pats.push('dodger','pulse');
    if(wave>=9)pats.push('mirror');
    if(wave>=10)pats.push('bomber');
    if(wave>=11)pats.push('absorber');
    if(wave>=12)pats.push('healer','swarm_mother');
    if(wave>=14)pats.push('titan');
    if(wave>=15)pats.push('phaser');
  }
  pats.forEach(p=>result.add(p));
  result.add('elite');
  return result;
}

// ================================================================
//  웨이브 / 적 시스템
// ================================================================
let zapBolts=[];

// 웨이브 타입 결정
function getWaveType(wave){
  if(wave%5===0)return 'boss';
  if(wave<2)return 'normal';
  const types=['normal'];
  if(wave>=2)types.push('swarm');        // 다수 약체
  if(wave>=3)types.push('rush');         // 빠른 적
  if(wave>=4)types.push('elite');        // 소수 정예
  if(wave>=6)types.push('fortress');     // 탱크 다수
  if(wave>=8)types.push('mixed');        // 모든 패턴
  if(wave>=11)types.push('chaos');       // 고밀도 혼합
  if(wave>=16)types.push('nightmare');   // 극한 난이도
  return types[Math.floor(Math.random()*types.length)];
}

function getWaveConfig(wave){
  const waveType=G.currentWaveType||getWaveType(wave);
  const isBoss=waveType==='boss';
  const hpMult=1+wave*0.7;
  const speedMult=1+wave*0.035;
  const reward=Math.floor(4+wave*2);
  let count,extraHp=1,extraSpeed=1;

  switch(waveType){
    case'swarm':
      count=Math.floor(22+wave*6); extraHp=0.5; break;
    case'elite':
      count=Math.floor(8+wave*1.8); extraHp=2.2; break;
    case'rush':
      count=Math.floor(14+wave*4); extraSpeed=1.7; extraHp=0.65; break;
    case'fortress':
      count=Math.floor(10+wave*2.2); extraHp=2.8; extraSpeed=0.7; break;
    case'mixed':
      count=Math.floor(14+wave*4); break;
    case'chaos':
      count=Math.floor(22+wave*5); extraHp=1.3; extraSpeed=1.3; break;
    case'nightmare':
      count=Math.floor(18+wave*4); extraHp=2.0; extraSpeed=1.4; break;
    case'boss':
      count=Math.floor(25+wave*5); break;
    default:
      count=Math.floor(12+wave*5); break;
  }
  if(count>120)count=120;

  return{count,hpMult:hpMult*extraHp,speedMult:speedMult*extraSpeed,reward,isBoss,waveType};
}

function spawnEnemy(){
  const w=gameCanvas.width/dpr, h=gameCanvas.height/dpr;
  const cx=w/2, cy=h/2;
  const wc=getWaveConfig(G.wave);

  // 스폰 위치: 상(30%), 하(20%), 좌(25%), 우(25%)
  const side=Math.random();
  let x,y;
  if(side<0.3){x=Math.random()*w;y=-30}
  else if(side<0.5){x=Math.random()*w;y=h+30}
  else if(side<0.75){x=w+30;y=Math.random()*h}
  else{x=-30;y=Math.random()*h}

  const isBossEnemy=wc.isBoss&&G.enemiesSpawned===0;
  const isElite=wc.isBoss&&!isBossEnemy;

  // 패턴 선택 (웨이브 타입에 따라 가중치 변경)
  let pattern='normal';
  if(!isBossEnemy){
    const wt=wc.waveType||'normal';
    let pats;

    if(wt==='boss'){
      // 보스 웨이브 잡몹: 다양한 패턴 혼합
      pats=['normal','normal','zigzag','charger','spiral','comet','comet'];
      if(G.wave>=10)pats.push('tank','splitter','dodger','orbiter','freezer');
      if(G.wave>=15)pats.push('bomber','shield_bearer','teleporter','pulse');
      if(G.wave>=20)pats.push('phaser','healer','mirror','absorber','swarm_mother','titan');
    }else if(wt==='swarm'){
      pats=['normal','normal','zigzag','zigzag'];
      if(G.wave>=4)pats.push('spiral');
      if(G.wave>=5)pats.push('comet','comet');
      if(G.wave>=7)pats.push('splitter','splitter');
      if(G.wave>=8)pats.push('orbiter');
      if(G.wave>=12)pats.push('swarm_mother');
    }else if(wt==='rush'){
      pats=['charger','charger','zigzag','normal'];
      if(G.wave>=4)pats.push('comet','comet');
      if(G.wave>=6)pats.push('dodger','teleporter');
      if(G.wave>=8)pats.push('orbiter');
      if(G.wave>=10)pats.push('dodger','phaser');
    }else if(wt==='fortress'){
      pats=['tank','tank','tank','normal'];
      if(G.wave>=7)pats.push('shield_bearer','shield_bearer');
      if(G.wave>=8)pats.push('bomber');
      if(G.wave>=9)pats.push('freezer');
      if(G.wave>=12)pats.push('healer');
      if(G.wave>=14)pats.push('titan');
    }else if(wt==='elite'){
      pats=['charger','tank','spiral','zigzag'];
      if(G.wave>=6)pats.push('dodger','shield_bearer');
      if(G.wave>=8)pats.push('pulse');
      if(G.wave>=9)pats.push('bomber');
      if(G.wave>=10)pats.push('teleporter','mirror');
      if(G.wave>=12)pats.push('healer');
      if(G.wave>=14)pats.push('absorber');
      if(G.wave>=15)pats.push('phaser');
      if(G.wave>=16)pats.push('titan');
    }else if(wt==='mixed'||wt==='chaos'){
      pats=['normal','zigzag','spiral','charger','tank','splitter'];
      if(G.wave>=5)pats.push('comet','orbiter');
      if(G.wave>=7)pats.push('teleporter','shield_bearer','freezer');
      if(G.wave>=8)pats.push('dodger','dodger');
      if(G.wave>=9)pats.push('pulse','mirror');
      if(G.wave>=10)pats.push('bomber','bomber');
      if(G.wave>=11)pats.push('absorber','swarm_mother');
      if(G.wave>=12)pats.push('healer');
      if(G.wave>=14)pats.push('titan');
      if(G.wave>=15)pats.push('phaser','phaser');
    }else if(wt==='nightmare'){
      pats=['charger','tank','splitter','dodger','bomber','spiral'];
      if(G.wave>=16)pats.push('healer','healer','teleporter','shield_bearer','freezer','pulse','comet');
      if(G.wave>=18)pats.push('phaser','phaser','phaser','mirror','absorber','orbiter','swarm_mother');
      if(G.wave>=20)pats.push('titan','titan');
    }else{
      // normal
      pats=['normal','normal'];
      if(G.wave>=2)pats.push('zigzag','zigzag');
      if(G.wave>=3)pats.push('spiral','comet');
      if(G.wave>=4)pats.push('charger','orbiter');
      if(G.wave>=5)pats.push('teleporter');
      if(G.wave>=6)pats.push('tank','shield_bearer');
      if(G.wave>=7)pats.push('splitter','freezer');
      if(G.wave>=8)pats.push('dodger','pulse');
      if(G.wave>=9)pats.push('mirror');
      if(G.wave>=10)pats.push('bomber');
      if(G.wave>=11)pats.push('absorber');
      if(G.wave>=12)pats.push('healer','swarm_mother');
      if(G.wave>=14)pats.push('titan');
      if(G.wave>=15)pats.push('phaser');
    }
    pattern=pats[Math.floor(Math.random()*pats.length)];
  }

  let baseHp,speed,size,reward;
  if(isBossEnemy){
    baseHp=60*G.wave+G.wave*G.wave*2;
    speed=0.1;
    size=Math.min(60+G.wave*2.5,120);
    reward=wc.reward*10;
  }else if(isElite){
    baseHp=Math.ceil(4*wc.hpMult);
    speed=(0.4+Math.random()*0.2)*wc.speedMult;
    size=10+Math.random()*5;
    reward=Math.floor(wc.reward*1.5);
  }else{
    baseHp=Math.ceil(2*wc.hpMult);
    speed=(0.3+Math.random()*0.2)*wc.speedMult;
    size=8+Math.random()*6;
    reward=wc.reward;
  }

  if(pattern==='tank'){baseHp=Math.ceil(baseHp*2.5);speed*=0.6;size*=1.4;reward=Math.ceil(reward*1.8)}
  if(pattern==='charger'){speed*=0.8;baseHp=Math.ceil(baseHp*1.2)}
  if(pattern==='splitter'){baseHp=Math.ceil(baseHp*1.5);size*=1.1}
  if(pattern==='zigzag'){speed*=1.15}
  if(pattern==='spiral'){speed*=0.9;baseHp=Math.ceil(baseHp*1.3)}
  if(pattern==='dodger'){speed*=1.3;baseHp=Math.ceil(baseHp*0.8);size*=0.85;reward=Math.ceil(reward*1.5)}
  if(pattern==='bomber'){baseHp=Math.ceil(baseHp*1.8);speed*=0.7;size*=1.3;reward=Math.ceil(reward*2)}
  if(pattern==='healer'){baseHp=Math.ceil(baseHp*1.4);speed*=0.65;size*=1.1;reward=Math.ceil(reward*2.5)}
  if(pattern==='phaser'){baseHp=Math.ceil(baseHp*1.6);speed*=1.1;reward=Math.ceil(reward*2)}
  // 신규 10종
  if(pattern==='teleporter'){speed*=0.9;baseHp=Math.ceil(baseHp*1.1);reward=Math.ceil(reward*1.8)}
  if(pattern==='shield_bearer'){baseHp=Math.ceil(baseHp*1.3);speed*=0.75;size*=1.15;reward=Math.ceil(reward*2)}
  if(pattern==='comet'){speed*=3.5;baseHp=Math.ceil(baseHp*0.6);size*=0.7;reward=Math.ceil(reward*1.5)}
  if(pattern==='pulse'){baseHp=Math.ceil(baseHp*1.5);speed*=0.4;reward=Math.ceil(reward*2.5)}
  if(pattern==='swarm_mother'){baseHp=Math.ceil(baseHp*3);speed*=0.35;size*=1.6;reward=Math.ceil(reward*3)}
  if(pattern==='freezer'){baseHp=Math.ceil(baseHp*1.4);speed*=0.7;size*=1.1;reward=Math.ceil(reward*2)}
  if(pattern==='mirror'){baseHp=Math.ceil(baseHp*1.2);speed*=0.95;reward=Math.ceil(reward*1.5)}
  if(pattern==='absorber'){baseHp=Math.ceil(baseHp*1.6);speed*=0.8;size*=1.1;reward=Math.ceil(reward*2)}
  if(pattern==='orbiter'){speed*=1.2;baseHp=Math.ceil(baseHp*1.1);reward=Math.ceil(reward*1.5)}
  if(pattern==='titan'){baseHp=Math.ceil(baseHp*4);speed*=0.3;size*=1.8;reward=Math.ceil(reward*3.5)}
  if(hasSkill('slow')){speed*=0.8}
  if(upLv('slow_aura')>0) speed*=(1-upLv('slow_aura')*0.05);

  const angle=Math.atan2(cy-y,cx-x);
  const vertices=isBossEnemy?18:pattern==='tank'?10:isElite?9:7+Math.floor(Math.random()*4);
  const shape=[];
  for(let v=0;v<vertices;v++){
    shape.push(0.65+Math.random()*0.45);
  }

  const PAT_COL={normal:'#ff6644',zigzag:'#4488ff',spiral:'#aa44ff',charger:'#ff4400',splitter:'#44dd44',tank:'#8899aa',
    dodger:'#ffdd22',bomber:'#ff6600',healer:'#44ffaa',phaser:'#cc44ff',
    teleporter:'#22ddff',shield_bearer:'#6688cc',comet:'#ff8855',pulse:'#ff44aa',
    swarm_mother:'#88dd44',freezer:'#44ccff',mirror:'#ccccdd',absorber:'#aa2222',
    orbiter:'#ffaa44',titan:'#cc6633'};
  const PAT_GLOW={normal:'#ff8844',zigzag:'#44aaff',spiral:'#bb66ff',charger:'#ff2200',splitter:'#44ff44',tank:'#667788',
    dodger:'#ffee44',bomber:'#ff8800',healer:'#66ffcc',phaser:'#dd66ff',
    teleporter:'#44eeff',shield_bearer:'#88aaee',comet:'#ffaa77',pulse:'#ff66cc',
    swarm_mother:'#aaff66',freezer:'#66ddff',mirror:'#ddddee',absorber:'#dd4444',
    orbiter:'#ffcc66',titan:'#ee8844'};

  G.enemies.push({
    x,y,hp:baseHp,maxHp:baseHp,speed,size,reward,
    vx:Math.cos(angle)*speed,
    vy:Math.sin(angle)*speed,
    isBoss:isBossEnemy,isElite,pattern,
    flash:0,
    color:isBossEnemy?'#ff4400':isElite?'#ff8844':(PAT_COL[pattern]||'#ff6644'),
    glowColor:isBossEnemy?'#ff6620':isElite?'#ff6633':(PAT_GLOW[pattern]||'#ff8844'),
    wobble:Math.random()*Math.PI*2,
    shape, vertices, rot:Math.random()*Math.PI*2,
    rotSpeed:isBossEnemy?(Math.random()-.5)*0.005:(Math.random()-.5)*0.02,
    attackTimer:0,
    charging:false,chargeTimer:0,chargeAngle:0,
    zigTimer:0,spiralDir:Math.random()>.5?1:-1,
    // 패턴 전용
    dodgeTimer:0, dodgeCooldown:0,
    phaseTimer:0, phased:false,
    healTimer:0,
    teleportTimer:0,
    shieldHp:pattern==='shield_bearer'?Math.ceil(baseHp*0.6):0,
    maxShieldHp:pattern==='shield_bearer'?Math.ceil(baseHp*0.6):0,
    cometPassed:false,
    pulseTimer:0,
    motherTimer:0,
    mirrorCount:0,
    absorbCount:0,
    orbitAngle:Math.random()*Math.PI*2,
    orbitRadius:pattern==='orbiter'?(150+Math.random()*100):0
  });
  G.enemiesSpawned++;
}

let _splashActive=false; // 연쇄 폭발 무한루프 방지

function damageEnemy(enemy,dmg,x,y,isChain,isCrit){
  // 페이저: 위상 상태일 때 면역
  if(enemy.phased){
    showFloatText(x||enemy.x,y||enemy.y,'MISS','chain');
    return;
  }
  // shield_bearer: 보호막이 먼저 흡수
  if(enemy.shieldHp>0){
    // penetrate: 보호막 추가 데미지
    if(upLv('penetrate')>0){
      const penBonus=Math.ceil(dmg*upLv('penetrate')*0.2);
      enemy.shieldHp-=penBonus;
    }
    const absorbed=Math.min(enemy.shieldHp,dmg);
    enemy.shieldHp-=absorbed;
    dmg-=absorbed;
    if(enemy.shieldHp<=0){enemy.shieldHp=0;addShockwave(enemy.x,enemy.y,'#6688cc',50)}
    if(dmg<=0){
      enemy.flash=1;
      showFloatText(x||enemy.x,y||enemy.y,t('msg.shield_block'),'chain');
      return;
    }
  }
  // mark: 마킹된 적에게 +30%
  if(enemy.markTimer>0) dmg=Math.ceil(dmg*1.3);
  enemy.hp-=dmg;
  enemy.flash=1;
  showFloatText(x||enemy.x,y||enemy.y,dmg,isCrit?'critical':isChain?'chain':'damage');
  if(enemy.hp<=0){
    killEnemy(enemy);
  }
}

function killEnemy(enemy){
  G.enemiesKilled++;
  G.kills++;
  G.totalKills++;

  let reward=enemy.reward;
  // energy_flat: 고정 에너지 추가
  if(upLv('energy_flat')>0) reward+=upLv('energy_flat')*2;
  // harvest: 에너지 수확 업그레이드
  if(upLv('harvest')>0) reward=Math.ceil(reward*(1+upLv('harvest')*0.1));
  // elite_hunter: 엘리트 처치 에너지 +50%
  if(upLv('elite_hunter')>0&&enemy.isElite) reward=Math.ceil(reward*(1+upLv('elite_hunter')*0.5));
  // bonus_wave: 보스 처치 에너지 +80%
  if(upLv('bonus_wave')>0&&enemy.isBoss) reward=Math.ceil(reward*(1+upLv('bonus_wave')*0.8));
  // bounty: +50% 에너지
  if(hasSkill('bounty')) reward=Math.ceil(reward*1.5);
  // lucky: 25% 확률 2배 (스킬)
  if(hasSkill('lucky')&&Math.random()<0.25){ reward*=2; showFloatText(enemy.x,enemy.y-30,'LUCKY!','chain'); }
  // fortune: 업그레이드 행운 (5%/레벨 확률 2배)
  if(upLv('fortune')>0&&Math.random()<upLv('fortune')*0.05){ reward*=2; showFloatText(enemy.x,enemy.y-30,'FORTUNE!','chain'); }
  // combo: 연속 처치 보너스
  if(upLv('combo')>0){
    G.comboCount++;G.comboTimer=2;
    if(G.comboCount>1){
      const comboBonus=G.comboCount*upLv('combo')*3;
      reward+=comboBonus;
      if(G.comboCount%5===0) showFloatText(enemy.x,enemy.y-40,G.comboCount+'COMBO!','chain');
    }
  }
  G.energy+=reward;
  G.totalEnergy+=reward;
  // R1: XP 획득 & 레벨업 체크
  gainXP(xpFromEnemy(enemy));
  // rage: 광전사 스택
  if(upLv('rage')>0){
    const maxStacks=upLv('rage')*3;
    if(G.rageStacks<maxStacks) G.rageStacks++;
    G.rageTimer=5;
  }

  sfx.explode(enemy.isBoss?2:1);

  addExplosion(enemy.x,enemy.y,enemy.isBoss?60:12,enemy.color);
  addShockwave(enemy.x,enemy.y,enemy.color,enemy.isBoss?250:60);
  if(enemy.isBoss){addShockwave(enemy.x,enemy.y,'#ff8800',180);addShockwave(enemy.x,enemy.y,'#ffcc00',120)}

  showFloatText(enemy.x,enemy.y-15,'+'+reward,'energy-gain');

  if(enemy.isBoss){
    screenFlash('big');
    screenShake(true);
    setTimeout(()=>showSkillSelection(),600);
  }

  // 폭탄형: 죽으면 코어 주변에 폭발 데미지
  if(enemy.pattern==='bomber'){
    const bw=gameCanvas.width/dpr,bh=gameCanvas.height/dpr;
    const bcx=bw/2,bcy=bh/2;
    const bd=Math.hypot(enemy.x-bcx,enemy.y-bcy);
    if(bd<120){
      const bDmg=2+Math.floor(G.wave/4);
      if(G.shieldActive){
        G.shieldActive=false;G.shieldTimer=0;
        showFloatText(bcx,bcy-20,'실드!','chain');
        addShockwave(bcx,bcy,'#4488ff',80);
      }else{
        G.hp-=bDmg;
        showFloatText(bcx,bcy-20,'-'+bDmg,'critical');
        screenShake(false);
      }
    }
    addShockwave(enemy.x,enemy.y,'#ff8800',100);
    addSparks(enemy.x,enemy.y,12,'#ff6600');
  }

  if(enemy.pattern==='splitter'&&!enemy.isSplitChild){
    for(let s=0;s<2;s++){
      const sa=Math.random()*Math.PI*2;
      const cv=6+Math.floor(Math.random()*3);
      const cs=[];
      for(let v=0;v<cv;v++)cs.push(0.65+Math.random()*0.45);
      G.enemies.push({
        x:enemy.x+Math.cos(sa)*15,y:enemy.y+Math.sin(sa)*15,
        hp:Math.ceil(enemy.maxHp*0.35),maxHp:Math.ceil(enemy.maxHp*0.35),
        speed:enemy.speed*1.4,size:enemy.size*0.55,
        reward:Math.ceil(enemy.reward*0.3),
        vx:Math.cos(sa)*2,vy:Math.sin(sa)*2,
        isBoss:false,isElite:false,pattern:'normal',
        flash:0,color:'#66ee66',glowColor:'#44ff44',
        wobble:Math.random()*Math.PI*2,
        shape:cs,vertices:cv,rot:Math.random()*Math.PI*2,
        rotSpeed:(Math.random()-.5)*0.03,
        attackTimer:0,charging:false,chargeTimer:0,chargeAngle:0,
        zigTimer:0,spiralDir:1,isSplitChild:true
      });
    }
    G.enemiesToSpawn+=2;
  }

  // mirror: 피격 사망 시 복제본 생성 (최대 2회)
  if(enemy.pattern==='mirror'&&enemy.mirrorCount<2&&!enemy.isMirrorClone){
    const ma=Math.random()*Math.PI*2;
    const cv=6+Math.floor(Math.random()*3);const cs=[];
    for(let v=0;v<cv;v++)cs.push(0.65+Math.random()*0.45);
    G.enemies.push({
      x:enemy.x+Math.cos(ma)*20,y:enemy.y+Math.sin(ma)*20,
      hp:Math.ceil(enemy.maxHp*0.4),maxHp:Math.ceil(enemy.maxHp*0.4),
      speed:enemy.speed*1.2,size:enemy.size*0.7,reward:Math.ceil(enemy.reward*0.3),
      vx:Math.cos(ma)*2,vy:Math.sin(ma)*2,
      isBoss:false,isElite:false,pattern:'mirror',isMirrorClone:true,mirrorCount:2,
      flash:0,color:'#ccccdd',glowColor:'#ddddee',
      wobble:Math.random()*Math.PI*2,shape:cs,vertices:cv,
      rot:Math.random()*Math.PI*2,rotSpeed:(Math.random()-.5)*0.03,
      attackTimer:0,charging:false,chargeTimer:0,chargeAngle:0,
      zigTimer:0,spiralDir:1,dodgeTimer:0,dodgeCooldown:0,
      phaseTimer:0,phased:false,healTimer:0,teleportTimer:0,
      shieldHp:0,maxShieldHp:0,cometPassed:false,pulseTimer:0,
      motherTimer:0,absorbCount:0,orbitAngle:0,orbitRadius:0
    });
    G.enemiesToSpawn+=1;
    addSparks(enemy.x,enemy.y,6,'#ccccff');
  }

  // absorber: 주변 흡수형 적이 강화됨
  G.enemies.forEach(e2=>{
    if(e2!==enemy&&e2.hp>0&&e2.pattern==='absorber'&&Math.hypot(e2.x-enemy.x,e2.y-enemy.y)<100){
      e2.absorbCount++;
      e2.hp=Math.min(e2.maxHp*2,e2.hp+Math.ceil(enemy.maxHp*0.2));
      e2.size=Math.min(e2.size*1.05,e2.size>30?e2.size:30);
      addSparks(e2.x,e2.y,3,'#dd4444');
      showFloatText(e2.x,e2.y-10,t('msg.absorb'),'critical');
    }
  });

  if(hasSkill('lifesteal'))G.hp=Math.min(G.maxHp,G.hp+3);
  // vampiric: 업그레이드 흡혈
  if(upLv('vampiric')>0) G.hp=Math.min(G.maxHp,G.hp+upLv('vampiric')*2);

  // explosion: 연쇄 폭발 스플래시
  if(hasSkill('explosion')&&!_splashActive){
    _splashActive=true;
    const splashDmg=Math.max(1,Math.floor(G.damage*0.3));
    const ex=enemy.x,ey=enemy.y;
    G.enemies.forEach(e2=>{
      if(e2.hp>0&&Math.hypot(e2.x-ex,e2.y-ey)<80){
        damageEnemy(e2,splashDmg);
        addSparks(e2.x,e2.y,2,'#ff8800');
      }
    });
    addShockwave(ex,ey,'#ff6600',80);
    _splashActive=false;
  }

  checkEvolution();
}

// ================================================================
//  전투 — 번개 공격
// ================================================================
function strikeEnemy(enemy,isDirect){
  const w=gameCanvas.width/dpr, h=gameCanvas.height/dpr;
  const cx=w/2, cy=h/2;
  let dmg=G.damage;

  // click_amp: 클릭 공격 보너스
  if(isDirect&&upLv('click_amp')>0) dmg+=upLv('click_amp')*3;
  // final_strike: 고정 데미지 추가
  if(upLv('final_strike')>0) dmg+=upLv('final_strike')*5;
  // berserk: HP 30% 이하일 때 2배
  if(hasSkill('berserk')&&G.hp<=G.maxHp*0.3) dmg*=2;
  // executioner: 적 HP 30% 이하일 때 2배
  if(hasSkill('executioner')&&enemy.hp<=enemy.maxHp*0.3) dmg*=2;
  // weak_point: 적 HP 50% 이하 데미지 +15%
  if(upLv('weak_point')>0&&enemy.hp<=enemy.maxHp*0.5) dmg=Math.ceil(dmg*(1+upLv('weak_point')*0.15));
  // execute: 적 HP 20% 이하 데미지 +50%
  if(upLv('execute')>0&&enemy.hp<=enemy.maxHp*0.2) dmg=Math.ceil(dmg*(1+upLv('execute')*0.5));
  // boss_hunter: 보스 데미지 +15%
  if(upLv('boss_hunter')>0&&enemy.isBoss) dmg=Math.ceil(dmg*(1+upLv('boss_hunter')*0.15));
  // sniper: 먼 적일수록 +80%
  if(hasSkill('sniper')){
    const sd=Math.hypot(enemy.x-cx,enemy.y-cy);
    const maxD=Math.max(w,h)/2;
    dmg=Math.ceil(dmg*(1+(sd/maxD)*0.8));
  }
  // rage: 광전사 버프
  if(G.rageStacks>0&&upLv('rage')>0) dmg=Math.ceil(dmg*(1+G.rageStacks*upLv('rage')*0.1));
  // critical (스킬 + 업그레이드)
  let isCrit=false;
  let critChance=upLv('crit')*0.03;
  if(hasSkill('critical')) critChance+=0.15;
  if(critChance>0&&Math.random()<critChance){
    const critMult=3+upLv('crit')*0.25+upLv('crit_dmg')*0.25+upLv('precision')*0.15;
    dmg=Math.ceil(dmg*critMult);isCrit=true;
  }
  // lifeline: 크리티컬 적중 시 HP 회복
  if(isCrit&&upLv('lifeline')>0) G.hp=Math.min(G.maxHp,G.hp+upLv('lifeline')*2);
  // overload: 전체 데미지 증폭
  if(upLv('overload')>0) dmg=Math.ceil(dmg*(1+upLv('overload')*0.08));
  // surge: 전류 급등
  if(upLv('surge')>0) dmg=Math.ceil(dmg*(1+upLv('surge')*0.06));
  // energy_storm: 에너지 200 이상 시 데미지 +15%
  if(upLv('energy_storm')>0&&G.energy>=200) dmg=Math.ceil(dmg*(1+upLv('energy_storm')*0.15));
  // magnet
  if(hasSkill('magnet')){
    const md=Math.hypot(enemy.x-cx,enemy.y-cy);
    const maxD=Math.max(w,h)/2;
    dmg=Math.ceil(dmg*(1+(1-md/maxD)*0.5));
  }

  zapBolts.push(createZapBolt(cx,cy,enemy.x,enemy.y));

  sfx.zap(G.damage);
  damageEnemy(enemy,dmg,null,null,false,isCrit);

  addSparks(enemy.x,enemy.y,6,evoColor());

  // mark: 약점 표시 (이후 공격 +30%)
  if(hasSkill('mark')) enemy.markTimer=3;
  // venom: 독 부여
  if(hasSkill('venom')){
    enemy.poisonTimer=3;
    enemy.poisonDmg=Math.max(1,Math.floor(G.damage*0.2));
    enemy.poisonTick=0;
  }

  // double_strike: 20% 확률 2회 공격
  if(hasSkill('double_strike')&&isDirect&&Math.random()<0.2){
    setTimeout(()=>{
      if(enemy.hp<=0)return;
      zapBolts.push(createZapBolt(cx,cy,enemy.x,enemy.y));
      damageEnemy(enemy,dmg,null,null,false,false);
      addSparks(enemy.x,enemy.y,4,'#ffcc00');
      sfx.zap(0.5);
    },80);
  }
  // double_tap: 12% 확률 2회 공격 (업그레이드)
  if(upLv('double_tap')>0&&isDirect&&Math.random()<upLv('double_tap')*0.12){
    setTimeout(()=>{
      if(enemy.hp<=0)return;
      zapBolts.push(createZapBolt(cx,cy,enemy.x,enemy.y));
      damageEnemy(enemy,Math.ceil(dmg*0.8),null,null,false,false);
      addSparks(enemy.x,enemy.y,4,'#44eeff');
      sfx.zap(0.5);
    },100);
  }
  // plasma: 15% 확률 범위 폭발
  if(upLv('plasma')>0&&Math.random()<0.15){
    const plasmaDmg=Math.max(1,Math.ceil(dmg*upLv('plasma')*0.2));
    G.enemies.forEach(e2=>{
      if(e2!==enemy&&e2.hp>0&&Math.hypot(e2.x-enemy.x,e2.y-enemy.y)<80){
        damageEnemy(e2,plasmaDmg,null,null,true);
        addSparks(e2.x,e2.y,2,'#ff44aa');
      }
    });
    addShockwave(enemy.x,enemy.y,'#ff44aa',80);
  }

  // chain lightning
  if(G.chainCount>0){
    let chainMult=hasSkill('chain_boost')?0.75:0.5;
    chainMult+=upLv('chain_dmg')*0.1;
    const chainRange=200+upLv('chain_range')*30;
    const nearEnemies=[...G.enemies]
      .filter(e=>e!==enemy&&e.hp>0)
      .sort((a,b)=>{
        const da=Math.hypot(a.x-enemy.x,a.y-enemy.y);
        const db=Math.hypot(b.x-enemy.x,b.y-enemy.y);
        return da-db;
      });

    for(let i=0;i<Math.min(G.chainCount,nearEnemies.length);i++){
      const target=nearEnemies[i];
      const dist=Math.hypot(target.x-enemy.x,target.y-enemy.y);
      if(dist>chainRange)break;
      setTimeout(()=>{
        if(target.hp<=0)return;
        zapBolts.push(createZapBolt(enemy.x,enemy.y,target.x,target.y));
        sfx.chain();
        let chainDmg=Math.ceil(dmg*chainMult);
        // chain_crit: 체인 크리티컬
        if(upLv('chain_crit')>0&&Math.random()<upLv('chain_crit')*0.05){
          chainDmg=Math.ceil(chainDmg*2);
          showFloatText(target.x,target.y-20,'CHAIN CRIT!','critical');
        }
        damageEnemy(target,chainDmg,null,null,true);
        addSparks(target.x,target.y,4,'#b44aff');
      },(i+1)*60);
    }
  }

  // splash: 충격파 스플래시
  if(upLv('splash')>0){
    const splDmg=Math.max(1,Math.ceil(dmg*upLv('splash')*0.05));
    const splashDist=60*(1+upLv('splash_range')*0.2);
    G.enemies.forEach(e2=>{
      if(e2!==enemy&&e2.hp>0&&Math.hypot(e2.x-enemy.x,e2.y-enemy.y)<splashDist){
        damageEnemy(e2,splDmg,null,null,true);
      }
    });
  }

  screenFlash();
  screenShake(false);
}

function createZapBolt(x1,y1,x2,y2){
  const pts=[{x:x1,y:y1}];
  const steps=6+Math.floor(Math.random()*4);
  const dx=x2-x1,dy=y2-y1;
  for(let i=1;i<steps;i++){
    const t=i/steps;
    pts.push({
      x:x1+dx*t+(Math.random()-0.5)*40,
      y:y1+dy*t+(Math.random()-0.5)*20
    });
  }
  pts.push({x:x2,y:y2});
  return{points:pts,life:1,decay:1/12,color:null};
}

function autoAttack(){
  if(G.autoRate<=0||G.enemies.length===0)return;
  const w=gameCanvas.width/dpr, h=gameCanvas.height/dpr;
  const cx=w/2,cy=h/2;
  const alive=G.enemies.filter(e=>e.hp>0&&e.x>=0&&e.x<=w&&e.y>=0&&e.y<=h);
  if(alive.length===0)return;
  alive.sort((a,b)=>Math.hypot(a.x-cx,a.y-cy)-Math.hypot(b.x-cx,b.y-cy));
  const target=alive[0];
  const autoMult=hasSkill('overcharge')?1.0:0.5;
  let autoDmg=Math.max(1,Math.floor(G.damage*autoMult));
  // auto_acc: 자동 공격 고정 데미지
  if(upLv('auto_acc')>0) autoDmg+=upLv('auto_acc');
  // final_strike: 고정 데미지 추가
  if(upLv('final_strike')>0) autoDmg+=upLv('final_strike')*5;
  if(upLv('overload')>0) autoDmg=Math.ceil(autoDmg*(1+upLv('overload')*0.08));
  if(upLv('auto_dmg')>0) autoDmg=Math.ceil(autoDmg*(1+upLv('auto_dmg')*0.15));
  if(G.rageStacks>0&&upLv('rage')>0) autoDmg=Math.ceil(autoDmg*(1+G.rageStacks*upLv('rage')*0.1));
  // surge: 전류 급등
  if(upLv('surge')>0) autoDmg=Math.ceil(autoDmg*(1+upLv('surge')*0.06));
  // energy_storm: 에너지 200 이상 시 데미지 +15%
  if(upLv('energy_storm')>0&&G.energy>=200) autoDmg=Math.ceil(autoDmg*(1+upLv('energy_storm')*0.15));
  // weak_point: 적 HP 50% 이하 데미지 +15%
  if(upLv('weak_point')>0&&target.hp<=target.maxHp*0.5) autoDmg=Math.ceil(autoDmg*(1+upLv('weak_point')*0.15));
  // execute: 적 HP 20% 이하 데미지 +50%
  if(upLv('execute')>0&&target.hp<=target.maxHp*0.2) autoDmg=Math.ceil(autoDmg*(1+upLv('execute')*0.5));
  // boss_hunter: 보스 데미지 +15%
  if(upLv('boss_hunter')>0&&target.isBoss) autoDmg=Math.ceil(autoDmg*(1+upLv('boss_hunter')*0.15));
  const ab=createZapBolt(cx,cy,target.x,target.y);
  ab.color='#44ccff';
  zapBolts.push(ab);
  sfx.zap(0.5);
  damageEnemy(target,autoDmg);
  addSparks(target.x,target.y,3,'#44ccff');
}
