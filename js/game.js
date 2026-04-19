// ================================================================
//  게임 상태
// ================================================================
const G={
  kills:0, totalKills:0,
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
  // R4: 키스톤 + R5: 메타 프로그레션
  keystones:{}, treeOpen:false,
  rp:0, metaUpgrades:{}, achievements:{},
  // B-리팩토링: 빌드별 기믹 상태
  bloodlustStacks:0, blackholeTimer:5,
  // 난이도 (영구 설정 — localStorage 복원)
  difficulty:(localStorage.getItem('lightningDifficulty')||'normal'),
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
  let base=Math.max(1, Math.ceil((enemy.reward||1)/8));
  if(enemy.isBoss) base*=8;
  else if(enemy.isElite) base*=2;
  // 난이도 XP 배율
  const diff=DIFFICULTY_CONFIG[G.difficulty]||DIFFICULTY_CONFIG.normal;
  base=Math.ceil(base*diff.rewardMult);
  // 유틸 트리 XP 노드 (energy_flat=XP 증폭, harvest=XP 수확, elite_hunter=엘리트 XP, bonus_wave=보스 XP, fortune=럭키)
  if(upLv('energy_flat')>0) base+=upLv('energy_flat')*2;
  if(upLv('harvest')>0) base=Math.ceil(base*(1+upLv('harvest')*0.1));
  if(upLv('elite_hunter')>0&&enemy.isElite) base=Math.ceil(base*(1+upLv('elite_hunter')*0.5));
  if(upLv('bonus_wave')>0&&enemy.isBoss) base=Math.ceil(base*(1+upLv('bonus_wave')*0.8));
  if(upLv('fortune')>0&&Math.random()<upLv('fortune')*0.05){ base*=2; }
  // 보스 스킬 (bounty/lucky) — 에너지 배수에서 XP 배수로 전환
  if(hasSkill('bounty')) base=Math.ceil(base*1.5);
  if(hasSkill('lucky')&&Math.random()<0.25) base*=2;
  // combo: 콤보 카운트에 비례한 XP 보너스
  if(upLv('combo')>0&&G.comboCount>1) base+=Math.floor(G.comboCount*upLv('combo')*0.5);
  // R5: 메타 XP 배율
  const xpMult=(typeof getMetaEffect==='function'?getMetaEffect('xpMult'):0);
  if(xpMult>0) base=Math.ceil(base*(1+xpMult));
  // R4: 키스톤 XP 효과 (B-리팩토링: 수집가 +200%, Timelord 패널티 제거 — 쿨다운으로 대체)
  if(hasKeystone('ks_collector')) base=Math.ceil(base*3);
  return base;
}
// XP 획득 + 레벨업 체크
function gainXP(amount){
  if(amount<=0) return;
  G.xp += amount;
  let leveled=false;
  while(G.xp >= xpNeeded()){
    G.xp -= xpNeeded();
    G.level++;
    G.totalLevels++;
    G.skillPoints++;
    G.levelUpQueue++;
    leveled=true;
  }
  // U4: 레벨업 시 대형 배너 + 화면 플래시 (게임은 계속 진행, 트리는 수동 오픈)
  if(leveled){
    if(typeof showLevelUpBanner==='function') showLevelUpBanner(G.level);
    if(typeof screenFlash==='function') screenFlash('evo');
    if(typeof sfx!=='undefined'&&sfx.upgrade) sfx.upgrade();
    // 트리 버튼 SP 강조 — UI 업데이트로 has-sp 펄스 자동 반영
    G.levelUpQueue=0; // 큐 소진 (자동 오픈 안 함)
    if(typeof updateUI==='function') updateUI();
  }
}

// ================================================================
//  R5: 메타 업그레이드 정의 (RP 해금)
// ================================================================
const META_UPGRADES=[
  {id:'m_hp',    name:'시작 체력',    nameEn:'Starter HP',    desc:'시작 시 최대 HP +15',  descEn:'Start with +15 Max HP',       icon:'❤️', maxRank:5, costBase:3, costMult:1.8, effect:(r)=>({maxHp:r*15})},
  {id:'m_sp',    name:'시작 스킬포인트', nameEn:'Starter SP',   desc:'시작 시 스킬포인트 +1', descEn:'Start with +1 Skill Point',  icon:'⭐', maxRank:5, costBase:8, costMult:2.2, effect:(r)=>({sp:r})},
  {id:'m_xp',    name:'경험 증폭',    nameEn:'XP Amplify',    desc:'XP 획득 +8%',          descEn:'+8% XP gain',                   icon:'📘', maxRank:5, costBase:5, costMult:2.0, effect:(r)=>({xpMult:r*0.08})},
  {id:'m_dmg',   name:'시작 데미지',  nameEn:'Starter Damage',desc:'시작 데미지 +1',       descEn:'Start with +1 Damage',          icon:'⚡', maxRank:5, costBase:4, costMult:1.9, effect:(r)=>({damage:r})},
  {id:'m_eng',   name:'시작 자동 공격', nameEn:'Starter Auto',  desc:'시작 시 자동 공격 +0.2/초', descEn:'Start with +0.2/s auto attack', icon:'🔋', maxRank:5, costBase:5, costMult:2.0, effect:(r)=>({autoRate:r*0.2})},
  {id:'m_revive',name:'부활 부적',    nameEn:'Revival Charm', desc:'런당 1회 HP 30%로 부활', descEn:'Once per run, revive at 30% HP',icon:'✨', maxRank:1, costBase:50, costMult:1, effect:(r)=>({revive:r>0})}
];
function metaName(mu){ return LANG==='en'&&mu.nameEn?mu.nameEn:mu.name; }
function metaDesc(mu){ return LANG==='en'&&mu.descEn?mu.descEn:mu.desc; }
function metaCost(mu){ const r=(G.metaUpgrades&&G.metaUpgrades[mu.id])||0; return Math.ceil(mu.costBase*Math.pow(mu.costMult,r)); }
function metaRank(id){ return (G.metaUpgrades&&G.metaUpgrades[id])||0; }
function canBuyMeta(mu){ return G.rp>=metaCost(mu)&&metaRank(mu.id)<mu.maxRank; }
function buyMetaUpgrade(id){
  const mu=META_UPGRADES.find(m=>m.id===id);
  if(!mu||!canBuyMeta(mu)) return false;
  G.rp-=metaCost(mu);
  if(!G.metaUpgrades) G.metaUpgrades={};
  G.metaUpgrades[id]=(G.metaUpgrades[id]||0)+1;
  saveMeta();
  return true;
}
// 메타 효과 누적 계산
function getMetaEffect(field){
  let total=0;
  META_UPGRADES.forEach(mu=>{
    const r=metaRank(mu.id);
    if(r>0){ const e=mu.effect(r); if(e[field]!==undefined) total+=e[field]; }
  });
  return total;
}
function getMetaFlag(field){
  let v=false;
  META_UPGRADES.forEach(mu=>{
    const r=metaRank(mu.id);
    if(r>0){ const e=mu.effect(r); if(e[field]!==undefined) v=e[field]||v; }
  });
  return v;
}
// 메타 저장/로드 (영구)
function saveMeta(){
  try{ localStorage.setItem('lightningMeta',JSON.stringify({rp:G.rp,metaUpgrades:G.metaUpgrades||{},achievements:G.achievements||{}})); }catch(e){}
}
function loadMeta(){
  try{
    const d=localStorage.getItem('lightningMeta');
    if(d){
      const s=JSON.parse(d);
      G.rp=s.rp||0;
      G.metaUpgrades=s.metaUpgrades||{};
      G.achievements=s.achievements||{};
    }
  }catch(e){}
}

// ================================================================
//  R6: 업적 (5개)
// ================================================================
const ACHIEVEMENTS=[
  {id:'first_blood',  name:'첫 처치',  nameEn:'First Blood',   desc:'적 1체 처치',     descEn:'Kill 1 enemy',      rp:1,  check:()=>G.totalKills>=1},
  {id:'wave10',       name:'10 웨이브',nameEn:'Wave 10',       desc:'웨이브 10 도달',  descEn:'Reach wave 10',     rp:3,  check:()=>G.wave>=10},
  {id:'wave30',       name:'30 웨이브',nameEn:'Wave 30',       desc:'웨이브 30 도달',  descEn:'Reach wave 30',     rp:8,  check:()=>G.wave>=30},
  {id:'wave50',       name:'50 웨이브',nameEn:'Wave 50',       desc:'웨이브 50 도달',  descEn:'Reach wave 50',     rp:15, check:()=>G.wave>=50},
  {id:'level40',      name:'각성자',   nameEn:'Awakened',      desc:'레벨 40 달성',    descEn:'Reach level 40',    rp:10, check:()=>G.level>=40}
];
function checkAchievements(){
  let gained=0;
  ACHIEVEMENTS.forEach(a=>{
    if(!G.achievements) G.achievements={};
    if(G.achievements[a.id]) return;
    if(a.check()){ G.achievements[a.id]=true; gained+=a.rp; G.rp+=a.rp; }
  });
  if(gained>0){ saveMeta(); if(typeof showFloatText==='function'){ const el=document.getElementById('game-canvas'); if(el) showFloatText(el.width/(2*dpr),el.height/(2*dpr)-60,'+'+gained+' RP 🌟','chain'); } }
  return gained;
}
// 런당 RP 계산
function computeRunRP(){
  let rp=Math.floor(G.wave/5);             // 웨이브 도달 (5당 1 RP)
  rp+=Math.floor(G.totalKills/50);         // 처치 (50당 1 RP)
  rp+=Math.floor(G.totalLevels/5);         // 레벨 (5당 1 RP)
  return rp;
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
    level:G.level||1,
    evoStage:G.evolutionStage,
    damage:G.damage,
    autoRate:G.autoRate,
    skills:G.specialSkills.length,
    difficulty:G.difficulty||'normal',   // 난이도별 랭킹 구분
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
  // 정렬 타이브레이커: wave → kills → level (energy 제거됨)
  list.sort((a,b)=>b.wave-a.wave||b.kills-a.kills||(b.level||0)-(a.level||0));
  if(list.length>RANKING_MAX)list.length=RANKING_MAX;
  _localSave(list);
  return entry;
}

// Firestore에서 랭킹 로드 — 로컬 캐시와 병합해 이름+시간 기준 dedup
async function fetchRanking(sortBy){
  if(!isFirebaseReady()) return _localLoad();
  try{
    const field=sortBy==='kills'?'kills':sortBy==='level'?'level':'wave';
    const diffFilter=G._rankDiffFilter||G.difficulty||'normal';
    // 난이도별로 top N 따로 쿼리 (Firestore where + orderBy)
    let query=_db.collection(RANKING_COLLECTION)
      .where('difficulty','==',diffFilter)
      .orderBy(field,'desc')
      .limit(RANKING_MAX);
    const snap=await query.get();
    const remote=[];
    snap.forEach(doc=>remote.push(doc.data()));
    // 로컬 + 원격 병합 (키: name+date) — Firestore 쓰기 실패한 로컬 엔트리 보존
    const local=_localLoad();
    const seen=new Map();
    [...remote, ...local].forEach(e=>{
      if(!e||typeof e.wave!=='number') return;
      const key=(e.name||'?')+'_'+(e.date||0);
      if(!seen.has(key)) seen.set(key,e);
    });
    const merged=Array.from(seen.values());
    if(merged.length>RANKING_MAX) merged.length=RANKING_MAX;
    _localSave(merged);
    return merged;
  }catch(e){
    console.warn('Firestore read failed:',e.message);
    return _localLoad();
  }
}

// 랭킹 목록 렌더링 — 현재 선택된 난이도로 필터
function _renderRankList(list,sortBy){
  const container=document.getElementById('ranking-list');
  const curDiff=G._rankDiffFilter||G.difficulty||'normal';
  const filtered=(list||[]).filter(e=>(e.difficulty||'normal')===curDiff);
  if(filtered.length===0){
    container.innerHTML='<div class="rank-empty">'+t('ui.no_records')+'</div>';
    return;
  }
  const sorted=[...filtered];
  if(sortBy==='kills')sorted.sort((a,b)=>b.kills-a.kills||b.wave-a.wave);
  else if(sortBy==='level')sorted.sort((a,b)=>(b.level||0)-(a.level||0)||b.wave-a.wave);
  else sorted.sort((a,b)=>b.wave-a.wave||b.kills-a.kills);

  const scoreKey=sortBy==='kills'?'kills':sortBy==='level'?'level':'wave';
  const scoreLabel=sortBy==='kills'?t('go.kills'):sortBy==='level'?'레벨':t('go.wave');

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
  // 난이도 필터 현재값으로 설정
  if(!G._rankDiffFilter) G._rankDiffFilter=G.difficulty||'normal';
  document.querySelectorAll('.rank-diff-tab').forEach(t=>{
    t.classList.toggle('active',t.dataset.diff===G._rankDiffFilter);
  });
  document.querySelectorAll('.rank-tab').forEach(t=>{
    t.classList.toggle('active',t.dataset.sort===sortBy);
  });
  renderRanking(sortBy);
  document.getElementById('ranking-popup').classList.add('show');
}
function setRankDiffFilter(diff){
  G._rankDiffFilter=diff;
  document.querySelectorAll('.rank-diff-tab').forEach(t=>{
    t.classList.toggle('active',t.dataset.diff===diff);
  });
  // 현재 sort 유지하며 재렌더
  const activeTab=document.querySelector('.rank-tab.active');
  const sortBy=activeTab?activeTab.dataset.sort:'wave';
  renderRanking(sortBy);
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
  // R5: 메타 보너스 HP 추가 (런 시작 시 적용되지만, 업글 사서 maxHp 재계산 시 유지)
  const metaHp=(typeof getMetaEffect==='function'?getMetaEffect('maxHp'):0);
  if(metaHp>0) G.maxHp+=metaHp;
  // R4-B: 키스톤 로직 — 각 빌드마다 결정적 트레이드오프
  if(G.keystones){
    // 🔥 광전사 (Berserker): 기본 ×2 데미지 + HP -40%. getKeystoneBonus()에서 HP 낮을수록 추가 스케일링
    if(G.keystones['ks_berserker']){ G.damage=Math.ceil(G.damage*2); G.maxHp=Math.floor(G.maxHp*0.6); }
    // ⚡ 뇌신의 화신 (Thunder Avatar): 클릭 극대화, 자동 공격 비활성, 클릭마다 HP -3 (handleClick에서 처리)
    if(G.keystones['ks_click_master']){ G.damage=Math.ceil(G.damage*5); G.autoRate=0; }
    // 🛡️ 불멸의 코어 (Immortal): 탱커 빌드 - HP ×2.5, 재생 ×3, 데미지 -50%
    if(G.keystones['ks_immortal']){ G.maxHp=Math.floor(G.maxHp*2.5); G.hpRegen*=3; G.damage=Math.ceil(G.damage*0.5); }
    // 💎 유리 대포 (Glass Cannon): 고정 HP 1, 데미지 ×5
    if(G.keystones['ks_glass_cannon']){ G.maxHp=1; G.damage*=5; }
    // 💰 수집가 (Collector): XP/에너지 ×3, HP -50% (XP 배수는 xpFromEnemy에서)
    if(G.keystones['ks_collector']){ G.maxHp=Math.floor(G.maxHp*0.5); }
    // ⏳ 시간의 주인 (Timelord): 적 속도 -50% (spawnEnemy), 자신 쿨다운 -40% (getClickCd)
    if(G.keystones['ks_timelord']){ /* spawnEnemy + click에서 처리 */ }
  }
  if(G.hp>G.maxHp) G.hp=G.maxHp;
}

// ================================================================
//  B-리팩토링: 빌드별 시그니처 메커니즘
// ================================================================

// 🩸 피의 의지 (bloodlust): HP 소모 스택 — 1 스택당 다음 클릭 +50% dmg, 최대 3스택
//   G.bloodlustStacks (0-3), handleClick이 consume+restock
function consumeBloodlust(){
  const s=G.bloodlustStacks||0;
  G.bloodlustStacks=0;
  return 1 + s*0.5;   // x1.0 ~ x2.5
}
// bloodlust 스택 추가 (최대 3) — 특정 업글/스킬이 trigger
function addBloodlustStack(){
  const max=3;
  G.bloodlustStacks=Math.min((G.bloodlustStacks||0)+1,max);
}

// 광전사 보너스: HP % 낮을수록 데미지 증가 (HP 50%에서 ×1.5, HP 10%에서 ×2.0)
function getBerserkerBonus(){
  if(!hasKeystone('ks_berserker')) return 1;
  const hpPct=G.hp/G.maxHp;
  return 1 + (1 - hpPct); // x1.0 ~ x2.0 scaling
}
// 폭풍의 왕 (Storm Lord) 자동 체인 수 추가
function getStormLordChainBonus(){
  if(!hasKeystone('ks_storm_lord')) return 0;
  return 5;
}
// 수집가 XP 배수 (이미 xpFromEnemy에서 ks_collector 체크)
// 시간의 주인 쿨다운 배수 (click cd에서 체크)
function getClickCdMult(){
  if(hasKeystone('ks_timelord')) return 0.6; // -40%
  return 1;
}
// 자석 효과: 적을 코어로 끌어당김 (update()에서 호출)
function applyMagnetPull(enemies, coreX, coreY, dt){
  const lv=upLv('magnet_pull')||0;
  const skillMag=hasSkill('magnet')?0.5:0;
  const force=lv*0.08 + skillMag;
  if(force<=0) return;
  enemies.forEach(e=>{
    if(e.hp<=0) return;
    const dx=coreX-e.x, dy=coreY-e.y;
    const d=Math.sqrt(dx*dx+dy*dy)||1;
    e.x += (dx/d)*force*60*dt;
    e.y += (dy/d)*force*60*dt;
  });
}
// 폭풍의 눈 (storm_eye): 코어 주변 지속 데미지 존
function applyStormEye(enemies, coreX, coreY, dt){
  const lv=upLv('storm_eye')||0;
  if(lv<=0) return;
  const radius=80+lv*20;
  const dps=lv*3 + G.damage*0.15*lv;
  enemies.forEach(e=>{
    if(e.hp<=0) return;
    const dx=e.x-coreX, dy=e.y-coreY;
    const d=Math.sqrt(dx*dx+dy*dy);
    if(d<=radius){
      const dmg=Math.max(1, Math.floor(dps*dt));
      if(typeof damageEnemy==='function') damageEnemy(e, dmg);
    }
  });
}
// 블랙홀 (blackhole): 주기적으로 모든 적을 중앙으로 당기고 데미지
function applyBlackhole(enemies, coreX, coreY, dt){
  if(!hasKeystone('ks_void')) return;
  G.blackholeTimer=(G.blackholeTimer||0)-dt;
  if(G.blackholeTimer<=0){
    G.blackholeTimer=5;  // 5초마다
    enemies.forEach(e=>{
      if(e.hp<=0) return;
      e.x += (coreX-e.x)*0.7;
      e.y += (coreY-e.y)*0.7;
      if(typeof damageEnemy==='function') damageEnemy(e, Math.max(5, G.damage*2));
    });
    if(typeof addShockwave==='function') addShockwave(coreX,coreY,'#aa44ff',220);
  }
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
    overload:{cur:lv*6,next:(lv+1)*6},
    harvest:{cur:lv*10,next:(lv+1)*10},
    regen:{cur:(lv*0.5).toFixed(1),next:((lv+1)*0.5).toFixed(1)},
    splash:{cur:lv*5,next:(lv+1)*5},
    slow_aura:{cur:lv*5,next:(lv+1)*5},
    crit_dmg:{cur:(lv*0.15).toFixed(2),next:((lv+1)*0.15).toFixed(2)},
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
    precision:{cur:lv*4,next:(lv+1)*4},
    shield_wall:{cur:lv*8,next:(lv+1)*8},
    boss_hunter:{cur:lv*15,next:(lv+1)*15},
    bolt_size:{cur:lv*10,next:(lv+1)*10},
    recover:{cur:lv*2,next:(lv+1)*2},
    double_tap:{cur:lv*12,next:(lv+1)*12},
    resilience:{cur:lv>0?'2':'1',next:(lv+1)>0?'2':'1'},
    weak_point:{cur:lv*10,next:(lv+1)*10},
    elite_hunter:{cur:lv*50,next:(lv+1)*50},
    iron_core:{cur:lv*5,next:(lv+1)*5},
    chain_crit:{cur:lv*5,next:(lv+1)*5},
    hp_boost:{cur:lv*30,next:(lv+1)*30},
    splash_range:{cur:lv*20,next:(lv+1)*20},
    cooldown:{cur:lv,next:lv+1},
    energy_shield:{cur:lv*15,next:(lv+1)*15},
    execute:{cur:lv*20,next:(lv+1)*20},
    lifeline:{cur:lv*2,next:(lv+1)*2},
    surge:{cur:lv*5,next:(lv+1)*5},
    field_expand:{cur:lv*8,next:(lv+1)*8},
    bonus_wave:{cur:lv*80,next:(lv+1)*80},
    plasma:{cur:lv*20,next:(lv+1)*20},
    rebirth:{cur:lv*20,next:(lv+1)*20},
    final_strike:{cur:lv*3,next:(lv+1)*3},
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

// 단일 진실의 원천 (SSOT): 웨이브 타입별 스폰 풀
//   spawnEnemy와 getWavePatterns 둘 다 이 함수를 사용 → 로스터와 실제 스폰 항상 일치
function buildSpawnPool(wave, wt){
  let pats;
  if(wt==='boss'){
    pats=['normal','normal','zigzag','charger','spiral','comet','comet'];
    if(wave>=10)pats.push('tank','splitter','dodger','orbiter','freezer');
    if(wave>=15)pats.push('bomber','shield_bearer','teleporter','pulse');
    if(wave>=20)pats.push('phaser','healer','mirror','absorber','swarm_mother','titan');
  }else if(wt==='swarm'){
    pats=['normal','normal','zigzag','zigzag'];
    if(wave>=4)pats.push('spiral');
    if(wave>=5)pats.push('comet','comet');
    if(wave>=7)pats.push('splitter','splitter');
    if(wave>=8)pats.push('orbiter');
    if(wave>=12)pats.push('swarm_mother');
  }else if(wt==='rush'){
    pats=['charger','charger','zigzag','normal'];
    if(wave>=4)pats.push('comet','comet');
    if(wave>=6)pats.push('dodger','teleporter');
    if(wave>=8)pats.push('orbiter');
    if(wave>=10)pats.push('dodger','phaser');
  }else if(wt==='fortress'){
    pats=['tank','tank','tank','normal'];
    if(wave>=7)pats.push('shield_bearer','shield_bearer');
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
    if(wave>=8)pats.push('dodger','dodger');
    if(wave>=9)pats.push('pulse','mirror');
    if(wave>=10)pats.push('bomber','bomber');
    if(wave>=11)pats.push('absorber','swarm_mother');
    if(wave>=12)pats.push('healer');
    if(wave>=14)pats.push('titan');
    if(wave>=15)pats.push('phaser','phaser');
  }else if(wt==='nightmare'){
    pats=['charger','tank','splitter','dodger','bomber','spiral'];
    if(wave>=16)pats.push('healer','healer','teleporter','shield_bearer','freezer','pulse','comet');
    if(wave>=18)pats.push('phaser','phaser','phaser','mirror','absorber','orbiter','swarm_mother');
    if(wave>=20)pats.push('titan','titan');
  }else{
    pats=['normal','normal'];
    if(wave>=2)pats.push('zigzag','zigzag');
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
  return pats;
}

function getWavePatterns(wave,waveType){
  const wt=waveType||G.currentWaveType||'normal';
  const result=new Set(buildSpawnPool(wave, wt));
  // 보스 웨이브는 본체(boss)도 로스터에 표시
  if(wt==='boss') result.add('boss');
  // 엘리트는 보스 웨이브에서만 실제 스폰됨 — 해당 경우만 표시
  if(wt==='boss') result.add('elite');
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
  // 난이도 배수
  const diff=DIFFICULTY_CONFIG[G.difficulty]||DIFFICULTY_CONFIG.normal;
  // 초반 완만 + 후반 가속 (플레이어 곱셈 데미지 성장에 맞춤)
  const baseHp=1+Math.max(0,wave-1)*0.55+(wave>=1?0.1:0);
  const lateBonus=Math.pow(Math.max(0,wave-10)/8,2.3);
  const hpMult=(baseHp+lateBonus)*diff.hpMult;
  const speedMult=(1+Math.max(0,wave-1)*0.03)*diff.speedMult;
  const reward=Math.floor((4+wave*2)*diff.rewardMult);
  let count,extraHp=1,extraSpeed=1;

  switch(waveType){
    case'swarm':
      count=Math.floor(18+wave*5); extraHp=0.5; break;
    case'elite':
      count=Math.floor(8+wave*1.8); extraHp=2.0; break;
    case'rush':
      count=Math.floor(12+wave*3.5); extraSpeed=1.6; extraHp=0.65; break;
    case'fortress':
      count=Math.floor(10+wave*2.2); extraHp=2.5; extraSpeed=0.7; break;
    case'mixed':
      count=Math.floor(14+wave*4); break;
    case'chaos':
      count=Math.floor(22+wave*5); extraHp=1.3; extraSpeed=1.3; break;
    case'nightmare':
      count=Math.floor(18+wave*4); extraHp=2.0; extraSpeed=1.4; break;
    case'boss':
      // 보스 웨이브: 잡몹은 일반보다 적고 살짝 약함 — 보스 본체에 집중
      count=Math.floor(12+wave*3); extraHp=0.7; break;
    default:
      // 웨이브 1: 8마리, 2: 12, 3: 16, 10: 40 — 초반 완만, 후반 유지
      count=Math.floor(6+wave*4); break;
  }
  if(count>120)count=120;

  // B-리팩토링: 키스톤 — 시간의 주인 -50% (강화)
  let speedMod=speedMult*extraSpeed;
  if(hasKeystone('ks_timelord')) speedMod*=0.5;
  // 🌪️ 폭풍 군주: 자동 공격 범위 극대화 (damage에 반영 안 됨, main.js auto 처리에서 체크)
  return{count,hpMult:hpMult*extraHp,speedMult:speedMod,reward,isBoss,waveType};
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

  // 패턴 선택 — buildSpawnPool 공유 (로스터와 완전 일치 보장)
  let pattern='normal';
  if(!isBossEnemy){
    const wt=wc.waveType||'normal';
    const pats=buildSpawnPool(G.wave, wt);
    pattern=pats[Math.floor(Math.random()*pats.length)];
  }

  let baseHp,speed,size,reward;
  if(isBossEnemy){
    // 보스 HP: 웨이브 5에서 ~130, 10에서 ~350, 20에서 ~1000 (전보다 완만)
    baseHp=Math.floor(25*G.wave+G.wave*G.wave*0.8);
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

  // 에너지 시스템 제거 — 이전 에너지 업글은 XP 배율로 재활용됨 (xpFromEnemy 참조)
  // lucky/fortune: 행운 알림 이펙트만 유지 (XP 2배는 xpFromEnemy에서 처리)
  if(hasSkill('lucky')&&Math.random()<0.25) showFloatText(enemy.x,enemy.y-30,'LUCKY!','chain');
  if(upLv('fortune')>0&&Math.random()<upLv('fortune')*0.05) showFloatText(enemy.x,enemy.y-30,'FORTUNE!','chain');
  // combo: 카운트는 계속 돌림 (UI 표시 + energy_storm 대체 조건용)
  G.comboCount=(G.comboCount||0)+1;
  G.comboTimer=2;
  if(upLv('combo')>0&&G.comboCount>1&&G.comboCount%5===0){
    showFloatText(enemy.x,enemy.y-40,G.comboCount+'COMBO!','chain');
  }
  if(typeof updateComboDisplay==='function') updateComboDisplay();
  // R1: XP 획득 & 레벨업 체크
  const xpGain=xpFromEnemy(enemy);
  gainXP(xpGain);
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

  // 처치 플로팅 텍스트: 에너지 대신 XP 표시 (스킬트리의 실제 진행 지표)
  // 보스만 표시, 일반 적은 숨김 (시각적 노이즈 감소)
  if(enemy.isBoss||enemy.isElite) showFloatText(enemy.x,enemy.y-15,'+'+xpGain+' XP','energy-gain');

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
    let splashed=false;
    G.enemies.forEach(e2=>{
      if(e2.hp>0&&Math.hypot(e2.x-ex,e2.y-ey)<80){
        damageEnemy(e2,splashDmg);
        addSparks(e2.x,e2.y,2,'#ff8800');
        splashed=true;
      }
    });
    addShockwave(ex,ey,'#ff6600',80);
    if(splashed) showFloatText(ex,ey-30,'폭발!','chain');
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

  // ─────── 1단계: 키스톤 곱배수 (밸런스 설계상 유지) ───────
  if(typeof getBerserkerBonus==='function') dmg*=getBerserkerBonus();
  if(isDirect&&typeof consumeBloodlust==='function'){
    const mult=consumeBloodlust();
    if(mult>1) dmg*=mult;
  }

  // ─────── 2단계: 가산 보너스 (base에 직접 더함) ───────
  if(isDirect&&upLv('click_amp')>0) dmg+=upLv('click_amp')*3;
  if(upLv('final_strike')>0) dmg+=upLv('final_strike')*3; // 5→3 완화

  // ─────── 3단계: "조건부 가산 멀티플라이어" — 전부 한 번에 합산 후 곱 ───────
  // (이전: 각 조건마다 독립 곱셈 → 중첩 시 수십배 폭주)
  // (현재: 전부 가산 → 최대 조건 중첩 시에도 통제 가능한 범위)
  let condMult=1;
  // 보스 스킬 조건부 (가산 +1 each, 기존 ×2씩 → 가산)
  if(hasSkill('berserk')&&G.hp<=G.maxHp*0.3){
    condMult+=1;
    if(isDirect&&Math.random()<0.3) showFloatText(enemy.x,enemy.y-35,'광폭!','chain');
  }
  if(hasSkill('executioner')&&enemy.hp<=enemy.maxHp*0.3){
    condMult+=1;
    if(isDirect&&Math.random()<0.3) showFloatText(enemy.x,enemy.y-35,'처형!','chain');
  }
  // 업그레이드 조건부 (계수 대폭 하향)
  if(upLv('weak_point')>0&&enemy.hp<=enemy.maxHp*0.5) condMult+=upLv('weak_point')*0.1;  // lv10: +1 (was +1.5)
  if(upLv('execute')>0&&enemy.hp<=enemy.maxHp*0.2) condMult+=upLv('execute')*0.2;        // lv10: +2 (was +5)
  if(upLv('boss_hunter')>0&&enemy.isBoss) condMult+=upLv('boss_hunter')*0.12;
  // 거리/위치 기반
  if(hasSkill('sniper')){
    const sd=Math.hypot(enemy.x-cx,enemy.y-cy);
    const maxD=Math.max(w,h)/2;
    condMult+=(sd/maxD)*0.8;
  }
  if(hasSkill('magnet')){
    const md=Math.hypot(enemy.x-cx,enemy.y-cy);
    const maxD=Math.max(w,h)/2;
    condMult+=(1-md/maxD)*0.5;
  }
  // rage (연속 처치 스택)
  if(G.rageStacks>0&&upLv('rage')>0) condMult+=G.rageStacks*upLv('rage')*0.08;  // 0.1→0.08
  dmg*=condMult;

  // ─────── 4단계: 전역 % 증폭 (overload/surge/energy_storm) — 가산 통합 ───────
  let globalMult=1;
  if(upLv('overload')>0) globalMult+=upLv('overload')*0.06;      // lv10: +0.6 (was ×1.8)
  if(upLv('surge')>0) globalMult+=upLv('surge')*0.05;            // lv10: +0.5
  if(upLv('energy_storm')>0&&G.hp>=G.maxHp*0.8) globalMult+=upLv('energy_storm')*0.12;
  dmg*=globalMult;

  // ─────── 5단계: 크리티컬 (대폭 하향) ───────
  let isCrit=false;
  let critChance=upLv('crit')*0.03;
  if(isDirect&&upLv('precision')>0) critChance+=upLv('precision')*0.04;
  if(hasSkill('critical')) critChance+=0.15;
  if(critChance>0&&Math.random()<critChance){
    // 기본 2x (3→2), 상승폭도 하향
    const critMult=2+upLv('crit')*0.1+upLv('crit_dmg')*0.15;  // lv10: 2+1+1.5 = 4.5x (was 9.5x)
    dmg*=critMult;
    isCrit=true;
  }
  if(isCrit&&upLv('lifeline')>0) G.hp=Math.min(G.maxHp,G.hp+upLv('lifeline')*2);

  // 최종 반올림 (Math.ceil 체이닝 제거 → 누적 오차 해소)
  dmg=Math.max(1,Math.ceil(dmg));

  zapBolts.push(createZapBolt(cx,cy,enemy.x,enemy.y));

  sfx.zap(G.damage);
  damageEnemy(enemy,dmg,null,null,false,isCrit);

  addSparks(enemy.x,enemy.y,6,evoColor());

  // mark: 약점 표시 (이후 공격 +30%)
  if(hasSkill('mark')){
    if(!enemy.markTimer) showFloatText(enemy.x,enemy.y-30,'표식!','chain');
    enemy.markTimer=3;
  }
  // venom: 독 부여
  if(hasSkill('venom')){
    if(!enemy.poisonTimer) showFloatText(enemy.x,enemy.y-30,'중독!','chain');
    enemy.poisonTimer=3;
    enemy.poisonDmg=Math.max(1,Math.floor(G.damage*0.2));
    enemy.poisonTick=0;
  }

  // double_strike: 20% 확률 2회 공격
  if(hasSkill('double_strike')&&isDirect&&Math.random()<0.2){
    showFloatText(enemy.x,enemy.y-30,'2연타!','chain');
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
  if(upLv('energy_storm')>0&&G.hp>=G.maxHp*0.8) autoDmg=Math.ceil(autoDmg*(1+upLv('energy_storm')*0.15));
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
