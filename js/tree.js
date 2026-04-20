// ================================================================
//  V4: 스킬트리 — "3축 재정의"
//   누가/언제 공격하는가 축으로 재설계.
//  - 🗡️ 낙뢰 (atk): 클릭 빌드 — 내가 직접 정밀 타격
//  - 🌩️ 폭풍 (def): 자동 빌드 — 기계처럼 지속 처리
//  - 🌀 파편 (shard): 분리체 빌드 — 분신이 자율 전투 (SF: 전하 응축체)
//
//  설계 원칙: 3-5-7 법칙. 각 트리 T3/T5/T7에 Breakpoint 배치.
//  키스톤은 트리별 3개 (상호 배타) — 극적 트레이드오프.
//  필러(+수치)로 Breakpoint 사이를 채움.
// ================================================================

const TREE_NODES = [
  // ═══════════════════════════════════════════════════
  //  🗡️ 낙뢰 트리 (atk) — 클릭 빌드 17 노드
  //   col0: 데미지 라인   col1: 크리 라인   col2: HP·범위   col3: 쿨다운
  // ═══════════════════════════════════════════════════
  // Tier 1 — 필러 4
  {id:'damage',    tree:'atk', tier:1, row:0, maxRank:10, type:'basic', prereqs:[]},
  {id:'click_amp', tree:'atk', tier:1, row:1, maxRank:10, type:'basic', prereqs:[]},
  {id:'quick',     tree:'atk', tier:1, row:2, maxRank:10, type:'basic', prereqs:[]},
  {id:'bolt_size', tree:'atk', tier:1, row:3, maxRank:5,  type:'basic', prereqs:[]},
  // Tier 2 — 필러 3
  {id:'crit',       tree:'atk', tier:2, row:0, maxRank:5, type:'notable', prereqs:['damage']},
  {id:'double_tap', tree:'atk', tier:2, row:1, maxRank:5, type:'notable', prereqs:['click_amp']},
  {id:'precision',  tree:'atk', tier:2, row:2, maxRank:5, type:'notable', prereqs:['crit']},
  // ⭐ Tier 3 Breakpoint
  {id:'penetration_mastery', tree:'atk', tier:3, row:1, maxRank:5, type:'breakpoint',
   prereqs:['precision','double_tap'],
   nameOverride:'관통의 경지', nameOverrideEn:'Piercing Mastery',
   descOverride:'클릭이 일직선 상 적 관통 +1체/랭크 (각 추가 관통마다 피해 -15%)',
   descOverrideEn:'Clicks pierce +1 enemy/rank in a line (-15% dmg per pierce)',
   iconOverride:'🎯'},
  // Tier 4 — BP 보강 3
  {id:'crit_dmg',    tree:'atk', tier:4, row:0, maxRank:5, type:'notable', prereqs:['crit']},
  {id:'boss_hunter', tree:'atk', tier:4, row:2, maxRank:5, type:'notable', prereqs:['precision']},
  {id:'weak_point',  tree:'atk', tier:4, row:1, maxRank:5, type:'notable', prereqs:['crit_dmg','precision']},
  // ⭐ Tier 5 Breakpoint
  {id:'execution_mastery', tree:'atk', tier:5, row:1, maxRank:5, type:'breakpoint',
   prereqs:['weak_point','boss_hunter'],
   nameOverride:'처형의 경지', nameOverrideEn:'Execution Mastery',
   descOverride:'적 HP 20% 이하 시, 피해가 고정값 계산 (방어·감소 무시). 일반 크리 배율 -10%/랭크',
   descOverrideEn:'At HP<=20%, damage bypasses defense. -10%/rank crit multi on normal hits',
   iconOverride:'💀'},
  // Tier 6 — 지원 2
  {id:'final_strike', tree:'atk', tier:6, row:0, maxRank:5, type:'notable', prereqs:['execution_mastery']},
  {id:'rage',         tree:'atk', tier:6, row:2, maxRank:5, type:'notable', prereqs:['execution_mastery']},
  // ⭐ Tier 7 Keystones (3, 상호 배타)
  {id:'ks_clickmaster', tree:'atk', tier:7, row:0, maxRank:1, type:'keystone',
   prereqs:['final_strike','rage'],
   ksName:'천벌의 지배자', ksNameEn:'Heaven\'s Wrath', ksIcon:'🌩️',
   ksDesc:'클릭 CD 0초, 자동 비활성, 클릭당 HP -5, 처치당 HP +10',
   ksDescEn:'Click CD 0, auto disabled, click costs 5 HP, kill restores 10 HP',
   ksExclusive:'atk_ks'},
  {id:'ks_berserker',   tree:'atk', tier:7, row:1, maxRank:1, type:'keystone',
   prereqs:['rage','weak_point'],
   ksName:'광전사의 각성', ksNameEn:'Berserker', ksIcon:'🔥',
   ksDesc:'클릭 피해 ×2, 최대 HP -40%, 잃은 HP%만큼 추가 피해 (최대 ×2)',
   ksDescEn:'Click dmg ×2, -40% Max HP, lost HP% adds damage (up to ×2)',
   ksExclusive:'atk_ks'},
  {id:'ks_thunder_avatar', tree:'atk', tier:7, row:2, maxRank:1, type:'keystone',
   prereqs:['final_strike','boss_hunter'],
   ksName:'뇌전의 화신', ksNameEn:'Thunder Avatar', ksIcon:'⚡',
   ksDesc:'클릭 1회당 5연속 번개 (자동 유도), 자동 비활성, 클릭 CD +50%',
   ksDescEn:'Click fires 5 homing bolts, auto disabled, +50% click CD',
   ksExclusive:'atk_ks'},

  // ═══════════════════════════════════════════════════
  //  🌩️ 폭풍 트리 (def) — 자동 빌드 17 노드
  //   col0: 자동 속도   col1: 체인   col2: 범위   col3: 지속 효과
  // ═══════════════════════════════════════════════════
  // Tier 1 — 필러 4
  {id:'auto',     tree:'def', tier:1, row:0, maxRank:10, type:'basic', prereqs:[]},
  {id:'auto_acc', tree:'def', tier:1, row:1, maxRank:10, type:'basic', prereqs:[]},
  {id:'chain',    tree:'def', tier:1, row:2, maxRank:10, type:'basic', prereqs:[]},
  {id:'range',    tree:'def', tier:1, row:3, maxRank:10, type:'basic', prereqs:[]},
  // Tier 2 — 필러 3
  {id:'auto_dmg',    tree:'def', tier:2, row:0, maxRank:5, type:'notable', prereqs:['auto_acc']},
  {id:'chain_dmg',   tree:'def', tier:2, row:2, maxRank:5, type:'notable', prereqs:['chain']},
  {id:'chain_range', tree:'def', tier:2, row:3, maxRank:5, type:'notable', prereqs:['chain','range']},
  // ⭐ Tier 3 Breakpoint
  {id:'chain_awakening', tree:'def', tier:3, row:2, maxRank:1, type:'breakpoint',
   prereqs:['chain_dmg','chain_range'],
   nameOverride:'연쇄 각성', nameOverrideEn:'Chain Awakening',
   descOverride:'체인 연쇄마다 피해 감소(-25%) 대신 +15% 증가 (무제한)',
   descOverrideEn:'Chain hops now deal +15% more dmg per hop instead of -25%',
   iconOverride:'🔗'},
  // Tier 4 — BP 보강 3
  {id:'chain_crit',   tree:'def', tier:4, row:2, maxRank:5, type:'notable', prereqs:['chain_awakening']},
  {id:'rapid_fire',   tree:'def', tier:4, row:0, maxRank:5, type:'notable', prereqs:['auto_dmg']},
  {id:'field_expand', tree:'def', tier:4, row:3, maxRank:5, type:'notable', prereqs:['chain_range']},
  // ⭐ Tier 5 Breakpoint
  {id:'storm_eye', tree:'def', tier:5, row:1, maxRank:5, type:'breakpoint',
   prereqs:['rapid_fire','field_expand'],
   nameOverride:'폭풍의 눈', nameOverrideEn:'Eye of the Storm',
   descOverride:'코어 주변 반경 80+20×랭크 지속 피해 존. 초당 피해 = 피해력×0.15×랭크 + 3×랭크',
   descOverrideEn:'Damage zone around core (radius 80+20/rank, dps=dmg*0.15/rank + 3/rank)',
   iconOverride:'🌀'},
  // Tier 6 — 지원 2
  {id:'emp',   tree:'def', tier:6, row:0, maxRank:5, type:'notable', prereqs:['storm_eye']},
  {id:'surge', tree:'def', tier:6, row:2, maxRank:5, type:'notable', prereqs:['storm_eye','chain_crit']},
  // ⭐ Tier 7 Keystones (3, 상호 배타)
  {id:'ks_storm_heart', tree:'def', tier:7, row:0, maxRank:1, type:'keystone',
   prereqs:['emp','storm_eye'],
   ksName:'폭풍의 심장', ksNameEn:'Storm Heart', ksIcon:'🌪️',
   ksDesc:'자동 비활성, 3초마다 전체 적에 낙뢰 (피해 ×5). 클릭 쿨다운 +30%',
   ksDescEn:'Auto disabled, every 3s lightning strikes all enemies (×5 dmg), +30% click CD',
   ksExclusive:'def_ks'},
  {id:'ks_immortal', tree:'def', tier:7, row:1, maxRank:1, type:'keystone',
   prereqs:['storm_eye','surge'],
   ksName:'불멸의 코어', ksNameEn:'Immortal Core', ksIcon:'🛡️',
   ksDesc:'최대 HP ×2.5, 재생 ×3, 주는 피해 ×0.5',
   ksDescEn:'×2.5 Max HP, ×3 regen, ×0.5 damage dealt',
   ksExclusive:'def_ks'},
  {id:'ks_timelord', tree:'def', tier:7, row:2, maxRank:1, type:'keystone',
   prereqs:['surge','emp'],
   ksName:'시간의 주인', ksNameEn:'Timelord', ksIcon:'⏳',
   ksDesc:'적 속도 ×0.5, 본체 쿨다운 ×0.6, XP 획득 ×0.7',
   ksDescEn:'Enemies ×0.5 speed, own cooldowns ×0.6, XP ×0.7',
   ksExclusive:'def_ks'},

  // ═══════════════════════════════════════════════════
  //  🌀 파편 트리 (shard) — 분리체 빌드 17 노드 🆕
  //   "번개 에너지의 물리적 조각 — 전하 응축체" (SF 톤)
  //   col0: 기본 파편   col1: 속도/유도   col2: 크리/피해   col3: 유틸
  // ═══════════════════════════════════════════════════
  // Tier 1 — 필러 4 (파편 진입)
  {id:'shard_basic', tree:'shard', tier:1, row:0, maxRank:10, type:'basic', prereqs:[],
   nameOverride:'방전 잔해', nameOverrideEn:'Residual Charge',
   descOverride:'적 처치 시 파편 생성 (자동 유도). 랭크당 +1개',
   descOverrideEn:'On kill, spawn auto-homing shards (+1 per rank)',
   iconOverride:'✨'},
  {id:'shard_damage', tree:'shard', tier:1, row:1, maxRank:10, type:'basic', prereqs:[],
   nameOverride:'파편 위력', nameOverrideEn:'Shard Power',
   descOverride:'파편 피해 +10%/랭크',
   descOverrideEn:'+10% shard damage per rank',
   iconOverride:'💥'},
  {id:'shard_count', tree:'shard', tier:1, row:2, maxRank:5, type:'basic', prereqs:['shard_basic'],
   nameOverride:'확산 파편', nameOverrideEn:'Scatter Shards',
   descOverride:'처치당 파편 생성 수 +1/랭크 (최대 +5)',
   descOverrideEn:'+1 shard spawn per kill per rank (max +5)',
   iconOverride:'🌟'},
  {id:'shard_life', tree:'shard', tier:1, row:3, maxRank:5, type:'basic', prereqs:[],
   nameOverride:'파편 지속', nameOverrideEn:'Shard Endurance',
   descOverride:'파편 수명 +0.3초/랭크',
   descOverrideEn:'+0.3s shard lifetime per rank',
   iconOverride:'⏱️'},
  // Tier 2 — 필러 3
  {id:'shard_speed', tree:'shard', tier:2, row:1, maxRank:5, type:'notable', prereqs:['shard_damage'],
   nameOverride:'파편 가속', nameOverrideEn:'Shard Acceleration',
   descOverride:'파편 이동속도 +15%/랭크',
   descOverrideEn:'+15% shard speed per rank',
   iconOverride:'💨'},
  {id:'shard_range', tree:'shard', tier:2, row:2, maxRank:5, type:'notable', prereqs:['shard_basic','shard_count'],
   nameOverride:'파편 추적', nameOverrideEn:'Shard Homing',
   descOverride:'파편 유도 강도 +15%/랭크',
   descOverrideEn:'+15% shard homing strength per rank',
   iconOverride:'🧲'},
  {id:'shard_crit', tree:'shard', tier:2, row:0, maxRank:5, type:'notable', prereqs:['shard_damage'],
   nameOverride:'파편 예기', nameOverrideEn:'Shard Edge',
   descOverride:'파편 크리 확률 +3%/랭크',
   descOverrideEn:'+3% shard crit chance per rank',
   iconOverride:'🎯'},
  // ⭐ Tier 3 Breakpoint — 핵심 전환점
  {id:'shard_split', tree:'shard', tier:3, row:1, maxRank:1, type:'breakpoint',
   prereqs:['shard_count','shard_speed'],
   nameOverride:'연쇄 분열', nameOverrideEn:'Cascade Split',
   descOverride:'파편 적중 시 더 작은 파편 2개로 분열 (50% 피해, 최대 3세대)',
   descOverrideEn:'Shards split into 2 smaller shards on hit (50% dmg, max 3 gen)',
   iconOverride:'💫'},
  // Tier 4 — BP 보강 3
  {id:'shard_pierce', tree:'shard', tier:4, row:0, maxRank:5, type:'notable', prereqs:['shard_split'],
   nameOverride:'파편 관통', nameOverrideEn:'Shard Piercing',
   descOverride:'파편이 적 관통 +1회/랭크 (소멸 안 함)',
   descOverrideEn:'+1 pierce per rank (no despawn)',
   iconOverride:'🗡️'},
  {id:'shard_crit_dmg', tree:'shard', tier:4, row:1, maxRank:5, type:'notable', prereqs:['shard_crit'],
   nameOverride:'파편 치명', nameOverrideEn:'Shard Critical',
   descOverride:'파편 크리 배율 +0.2×/랭크',
   descOverrideEn:'+0.2× shard crit multiplier per rank',
   iconOverride:'💢'},
  {id:'shard_absorb', tree:'shard', tier:4, row:3, maxRank:5, type:'notable', prereqs:['shard_life'],
   nameOverride:'잔여 수거', nameOverrideEn:'Residual Harvest',
   descOverride:'미적중 파편 소멸 시 HP +1/랭크',
   descOverrideEn:'+1 HP per rank when unhit shard expires',
   iconOverride:'💚'},
  // ⭐ Tier 5 Breakpoint — 공명
  {id:'shard_resonance', tree:'shard', tier:5, row:1, maxRank:1, type:'breakpoint',
   prereqs:['shard_pierce','shard_crit_dmg'],
   nameOverride:'파편 공명', nameOverrideEn:'Shard Resonance',
   descOverride:'파편 2개가 근접(12px) 시 에너지 구체로 융합 (3배 크기, 피해 ×3.5, 관통)',
   descOverrideEn:'Shards within 12px fuse into an energy orb (3× size, ×3.5 dmg, piercing)',
   iconOverride:'🔷'},
  // Tier 6 — 지원 2
  {id:'shard_crit_chain', tree:'shard', tier:6, row:0, maxRank:5, type:'notable', prereqs:['shard_resonance'],
   nameOverride:'연쇄 치명', nameOverrideEn:'Critical Cascade',
   descOverride:'파편 크리 시 추가 파편 3개 생성 (50% 피해)',
   descOverrideEn:'On shard crit, spawn 3 extra shards (50% dmg)',
   iconOverride:'💠'},
  {id:'orb_boost', tree:'shard', tier:6, row:2, maxRank:5, type:'notable', prereqs:['shard_resonance'],
   nameOverride:'구체 증폭', nameOverrideEn:'Orb Amplify',
   descOverride:'공명 구체 피해 +25%/랭크',
   descOverrideEn:'+25% orb damage per rank',
   iconOverride:'🌐'},
  // ⭐ Tier 7 Keystones (3, 상호 배타)
  {id:'ks_shard_burst', tree:'shard', tier:7, row:0, maxRank:1, type:'keystone',
   prereqs:['shard_crit_chain','orb_boost'],
   ksName:'파편 폭발', ksNameEn:'Shard Burst', ksIcon:'🎆',
   ksDesc:'파편 적중 시 반경 60px 폭발 + 재파편 3개. 본체 클릭 피해 -30%',
   ksDescEn:'Shard hits trigger 60px blast + 3 new shards. -30% click dmg',
   ksExclusive:'shard_ks'},
  {id:'ks_lightning_deconstruct', tree:'shard', tier:7, row:1, maxRank:1, type:'keystone',
   prereqs:['orb_boost','shard_crit_chain'],
   ksName:'번개 해체', ksNameEn:'Lightning Deconstruction', ksIcon:'⚡',
   ksDesc:'본체 공격 제거. 모든 공격이 파편으로 발사 (피해 ×3, 생성 수 ×2)',
   ksDescEn:'Base attacks removed. All attacks fire as shards (×3 dmg, ×2 count)',
   ksExclusive:'shard_ks'},
  {id:'ks_core_split', tree:'shard', tier:7, row:2, maxRank:1, type:'keystone',
   prereqs:['shard_crit_chain','orb_boost'],
   ksName:'코어 분할', ksNameEn:'Core Split', ksIcon:'💠',
   ksDesc:'본체가 3개로 분할 (삼각 배치). 각자 자동 공격. 최대 HP ×1/3, 파편 생성 ×3',
   ksDescEn:'Core splits into 3 (triangle). Each auto-attacks. Max HP ×1/3, shard spawn ×3',
   ksExclusive:'shard_ks'}
];

// ================================================================
//  트리 헬퍼 함수 — 기존 v3 유지 + V4 트리 ID 확장
// ================================================================

function getTreeNode(id){ return TREE_NODES.find(n=>n.id===id); }

// 현재 랭크 (keystone은 G.keystones에서, 일반은 G.upgrades에서)
function getNodeRank(node){
  if(!node) return 0;
  if(node.type==='keystone') return G.keystones&&G.keystones[node.id]?1:0;
  return G.upgrades&&G.upgrades[node.id]?G.upgrades[node.id].level:0;
}

// 트리별 누적 포인트 (하위 티어의 투자량 합)
function getTreeInvestedBelow(treeId, tier){
  let sum=0;
  TREE_NODES.forEach(n=>{
    if(n.tree===treeId && n.tier<tier) sum+=getNodeRank(n);
  });
  return sum;
}

// Tier Gate — 다음 티어 해금 요구 포인트
function tierGateRequired(tier){
  if(tier<=1) return 0;
  if(tier===7) return 20;
  return (tier-1)*3;  // T2=3, T3=6, T4=9, T5=12, T6=15
}

// Prereq 최소 랭크 (기본: maxRank 절반, 올림)
function getPrereqRankReq(childNode, parentNode){
  if(!parentNode) return 1;
  if(childNode && typeof childNode.prereqRank==='number') return childNode.prereqRank;
  return Math.max(1, Math.ceil(parentNode.maxRank/2));
}

function isTierGateOpen(treeId, tier){
  return getTreeInvestedBelow(treeId,tier) >= tierGateRequired(tier);
}

function isNodeUnlocked(node){
  if(!node) return false;
  if(!isTierGateOpen(node.tree, node.tier)) return false;
  if(node.prereqs&&node.prereqs.length>0){
    const ok=node.prereqs.every(pid=>{
      const p=getTreeNode(pid);
      if(!p) return false;
      const req=getPrereqRankReq(node,p);
      return getNodeRank(p)>=req;
    });
    if(!ok) return false;
  }
  return true;
}

function getMissingPrereqs(node){
  if(!node||!node.prereqs) return [];
  const out=[];
  node.prereqs.forEach(pid=>{
    const p=getTreeNode(pid);
    if(!p) return;
    const cur=getNodeRank(p);
    const req=getPrereqRankReq(node,p);
    if(cur<req) out.push({id:pid,name:getNodeName(p),cur,req});
  });
  return out;
}

function isKeystoneBlocked(node){
  if(node.type!=='keystone'||!node.ksExclusive) return false;
  return TREE_NODES.some(n=>
    n!==node && n.type==='keystone' && n.ksExclusive===node.ksExclusive && getNodeRank(n)>0
  );
}

function canInvestNode(node){
  if(!node) return false;
  if(G.skillPoints<=0) return false;
  if(getNodeRank(node)>=node.maxRank) return false;
  if(!isNodeUnlocked(node)) return false;
  if(node.type==='keystone'&&isKeystoneBlocked(node)) return false;
  return true;
}

function investNode(node){
  if(!canInvestNode(node)) return false;
  G.skillPoints--;
  if(node.type==='keystone'){
    if(!G.keystones) G.keystones={};
    G.keystones[node.id]=true;
  }else{
    if(!G.upgrades[node.id]) G.upgrades[node.id]={level:0};
    G.upgrades[node.id].level++;
    if(!G.unlockedUpgrades.includes(node.id)) G.unlockedUpgrades.push(node.id);
    if(node.id==='hp') G.hp=Math.min(G.hp+20,100+upLv('hp')*20);
  }
  return true;
}

function nodesByTree(treeId){
  return TREE_NODES.filter(n=>n.tree===treeId);
}

// 트리 ID 목록 (UI 탭 순서)
const TREE_IDS = ['atk','def','shard'];
// 레거시 호환: v3의 'util' → 'shard'로 매핑 (세이브 마이그레이션용)
const TREE_LEGACY_MAP = {'util':'shard'};

function getTreeDisplayName(treeId){
  const names = {
    'atk':   {ko:'🗡️ 낙뢰', en:'🗡️ Lightning'},
    'def':   {ko:'🌩️ 폭풍', en:'🌩️ Storm'},
    'shard': {ko:'🌀 파편', en:'🌀 Shards'}
  };
  const n = names[treeId];
  if(!n) return treeId;
  return (typeof LANG!=='undefined' && LANG==='en') ? n.en : n.ko;
}

// 노드 이름/설명/아이콘 — override 우선, fallback UPGRADE_POOL/locale
function getNodeName(node){
  if(!node) return '?';
  if(typeof LANG!=='undefined' && LANG==='en'){
    if(node.nameOverrideEn) return node.nameOverrideEn;
    if(node.type==='keystone'&&node.ksNameEn) return node.ksNameEn;
  }
  if(node.nameOverride) return node.nameOverride;
  if(node.type==='keystone') return node.ksName||node.id;
  const u = (typeof UPGRADE_POOL!=='undefined') ? UPGRADE_POOL.find(u=>u.id===node.id) : null;
  return u ? (typeof t==='function' ? t('up.'+node.id) : u.name) : node.id;
}

function getNodeDesc(node){
  if(!node) return '';
  if(typeof LANG!=='undefined' && LANG==='en'){
    if(node.descOverrideEn) return node.descOverrideEn;
    if(node.type==='keystone'&&node.ksDescEn) return node.ksDescEn;
  }
  if(node.descOverride) return node.descOverride;
  if(node.type==='keystone') return node.ksDesc||'';
  return (typeof t==='function') ? t('up.'+node.id+'_d') : '';
}

function getNodeIcon(node){
  if(!node) return '❔';
  if(node.iconOverride) return node.iconOverride;
  if(node.type==='keystone') return node.ksIcon||'✨';
  const u = (typeof UPGRADE_POOL!=='undefined') ? UPGRADE_POOL.find(u=>u.id===node.id) : null;
  return u ? u.icon : '❔';
}

// 키스톤 효과 체크 도우미
function hasKeystone(id){ return !!(G.keystones&&G.keystones[id]); }

// Breakpoint 노드 여부 (UI 하이라이트용)
function isBreakpoint(node){ return node && node.type==='breakpoint'; }
