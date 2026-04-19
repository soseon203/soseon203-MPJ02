// ================================================================
//  R2: 스킬트리 데이터 — "3 공격 트리" 컨셉
//  - 낙뢰(atk): 단일 극딜 · 크리티컬 · 처형 (클릭 빌드)
//  - 폭풍(def): 체인 · 광역 · 스플래시 (AoE 빌드)
//  - 전격(util): 자동 · 지속 · 회복 · XP (아이들 빌드)
//  각 트리는 모두 데미지 극대화가 목표, 플레이 방식만 다름.
//  nameOverride/iconOverride로 노드 표시 재정의 가능 (에너지→XP 테마 변경)
// ================================================================

const TREE_NODES = [
  // ═══════════════════════════════════════════════════
  //  🗡️ 낙뢰 (atk) — 22 nodes (20 + 2 keystones)
  //   col0: 데미지 라인   col1: 크리·클릭   col2: HP·탱커   col3: 쿨다운·범위
  // ═══════════════════════════════════════════════════
  // Tier 1
  {id:'damage',    tree:'atk', tier:1, row:0, maxRank:10, type:'basic',   prereqs:[]},
  {id:'click_amp', tree:'atk', tier:1, row:1, maxRank:10, type:'basic',   prereqs:[]},
  {id:'hp',        tree:'atk', tier:1, row:2, maxRank:10, type:'basic',   prereqs:[]},
  {id:'quick',     tree:'atk', tier:1, row:3, maxRank:10, type:'basic',   prereqs:[]},
  // Tier 2
  {id:'crit',        tree:'atk', tier:2, row:0, maxRank:5, type:'notable', prereqs:['damage']},
  {id:'double_tap',  tree:'atk', tier:2, row:1, maxRank:5, type:'notable', prereqs:['click_amp']},
  {id:'tough_skin',  tree:'atk', tier:2, row:2, maxRank:10,type:'basic',   prereqs:['hp']},
  // Tier 3
  {id:'crit_dmg',    tree:'atk', tier:3, row:0, maxRank:5, type:'notable', prereqs:['crit']},
  {id:'precision',   tree:'atk', tier:3, row:1, maxRank:5, type:'notable', prereqs:['double_tap']},
  {id:'boss_hunter', tree:'atk', tier:3, row:2, maxRank:5, type:'notable', prereqs:['tough_skin']},
  {id:'bolt_size',   tree:'atk', tier:3, row:3, maxRank:5, type:'notable', prereqs:['quick']},
  // Tier 4 — cross-chain AND 시작: 티어4부터 다른 기둥 노드와의 결합 요구
  {id:'weak_point',  tree:'atk', tier:4, row:0, maxRank:5, type:'notable', prereqs:['crit_dmg','precision']}, // 크리+정밀
  {id:'multi',       tree:'atk', tier:4, row:1, maxRank:3, type:'notable', prereqs:['precision']},
  {id:'iron_core',   tree:'atk', tier:4, row:2, maxRank:5, type:'notable', prereqs:['boss_hunter']},
  {id:'barrier',     tree:'atk', tier:4, row:3, maxRank:5, type:'notable', prereqs:['bolt_size','tough_skin']}, // 빠름+튼튼
  // Tier 5 — cross-chain 심화
  {id:'execute',     tree:'atk', tier:5, row:0, maxRank:5, type:'notable', prereqs:['weak_point','boss_hunter']}, // 크리+보스
  {id:'rage',        tree:'atk', tier:5, row:1, maxRank:5, type:'notable', prereqs:['multi','crit_dmg']}, // 클릭+크리
  {id:'penetrate',   tree:'atk', tier:5, row:2, maxRank:5, type:'notable', prereqs:['iron_core','barrier']}, // 탱커 양쪽
  // Tier 6 — 아펙스: 두 데미지 기둥 모두 필요
  {id:'final_strike',tree:'atk', tier:6, row:0, maxRank:5, type:'notable', prereqs:['execute','rage']},
  {id:'energy_shield',tree:'atk',tier:6, row:2, maxRank:5, type:'notable', prereqs:['penetrate'],
   nameOverride:'뇌전 방벽', nameOverrideEn:'Storm Bulwark',
   descOverride:'HP 80% 이상일 때 피해 -15%/랭크', descOverrideEn:'At 80%+ HP, damage taken -15%/rank',
   iconOverride:'🛡️'},
  // 🆕 B: 피의 의지 (bloodlust) — T3 level
  {id:'bloodlust',   tree:'atk', tier:3, row:4, maxRank:5, type:'notable', prereqs:['crit_dmg'],
   nameOverride:'피의 의지', nameOverrideEn:'Bloodlust',
   descOverride:'클릭 시 HP 5% 소모, 다음 클릭 데미지 +50% (스택 3)', descOverrideEn:'Clicks cost 5% HP, next click +50% dmg (3 stacks)',
   iconOverride:'🩸'},
  // Keystones — 세 빌드 라인 융합 요구 (B-리팩토링: 트레이드오프 심화)
  {id:'ks_berserker',   tree:'atk', tier:7, row:0, maxRank:1, type:'keystone', prereqs:['final_strike','penetrate'],
   ksName:'광전사', ksNameEn:'Berserker', ksIcon:'🔥',
   ksDesc:'공격력 ×2, HP -40%, 잃은 HP%만큼 데미지 추가', ksDescEn:'×2 damage, -40% HP, lost HP% adds more damage', ksExclusive:'atk_ks'},
  {id:'ks_click_master',tree:'atk', tier:7, row:1, maxRank:1, type:'keystone', prereqs:['rage','multi'],
   ksName:'뇌전의 화신', ksNameEn:'Thunder Avatar', ksIcon:'⚡',
   ksDesc:'클릭 데미지 ×5, 자동 공격 비활성, 클릭당 HP -3', ksDescEn:'×5 click damage, auto disabled, -3 HP per click', ksExclusive:'atk_ks'},

  // ═══════════════════════════════════════════════════
  //  🌩️ 폭풍 (def) — 22 nodes (20 + 2 keystones)
  //   col0: 체인 라인   col1: 폭풍 데미지   col2: 스플래시   col3: 보호막·회피
  // ═══════════════════════════════════════════════════
  // Tier 1
  {id:'chain',       tree:'def', tier:1, row:0, maxRank:10, type:'basic',   prereqs:[]},
  {id:'range',       tree:'def', tier:1, row:1, maxRank:10, type:'basic',   prereqs:[]},
  {id:'splash',      tree:'def', tier:1, row:2, maxRank:10, type:'basic',   prereqs:[]},
  {id:'shield_wall', tree:'def', tier:1, row:3, maxRank:10, type:'basic',   prereqs:[]},
  // Tier 2
  {id:'chain_dmg',    tree:'def', tier:2, row:0, maxRank:5, type:'notable', prereqs:['chain']},
  {id:'chain_range',  tree:'def', tier:2, row:1, maxRank:5, type:'notable', prereqs:['range']},
  {id:'splash_range', tree:'def', tier:2, row:2, maxRank:5, type:'notable', prereqs:['splash']},
  {id:'recover',      tree:'def', tier:2, row:3, maxRank:5, type:'notable', prereqs:['shield_wall']},
  // Tier 3
  {id:'chain_crit',   tree:'def', tier:3, row:0, maxRank:5, type:'notable', prereqs:['chain_dmg','chain_range']}, // 체인 양쪽
  {id:'field_expand', tree:'def', tier:3, row:1, maxRank:5, type:'notable', prereqs:['chain_range']},
  {id:'overload',     tree:'def', tier:3, row:2, maxRank:5, type:'notable', prereqs:['chain_dmg','splash_range']}, // 체인+스플래시
  {id:'resilience',   tree:'def', tier:3, row:3, maxRank:5, type:'notable', prereqs:['recover']},
  // Tier 4 — cross-chain 심화
  {id:'surge',      tree:'def', tier:4, row:0, maxRank:5, type:'notable', prereqs:['chain_crit','overload']}, // 체인크리+전체증폭
  {id:'plasma',     tree:'def', tier:4, row:1, maxRank:5, type:'notable', prereqs:['field_expand','overload']}, // 범위+폭발
  {id:'thorns_up',  tree:'def', tier:4, row:2, maxRank:5, type:'notable', prereqs:['overload','resilience']}, // 공격+방어 융합
  {id:'dodge_up',   tree:'def', tier:4, row:3, maxRank:5, type:'notable', prereqs:['resilience']},
  // Tier 5 — 폭풍 아펙스
  {id:'emp',        tree:'def', tier:5, row:0, maxRank:5, type:'notable', prereqs:['surge','plasma']}, // EMP는 체인+폭발
  {id:'lifeline',   tree:'def', tier:5, row:1, maxRank:5, type:'notable', prereqs:['plasma','thorns_up']}, // 폭발+반사
  {id:'auto_shield',tree:'def', tier:5, row:3, maxRank:5, type:'notable', prereqs:['dodge_up','thorns_up']}, // 회피+반사
  // Tier 6 — 양쪽 방어 라인 모두
  {id:'rebirth',    tree:'def', tier:6, row:3, maxRank:3, type:'notable', prereqs:['auto_shield','lifeline']},
  // 🆕 B: 폭풍의 눈 (storm_eye) — 자동화 빌드 시그니처
  {id:'storm_eye',  tree:'def', tier:6, row:1, maxRank:5, type:'notable', prereqs:['plasma','emp'],
   nameOverride:'폭풍의 눈', nameOverrideEn:'Eye of the Storm',
   descOverride:'코어 주변 지속 데미지 존 (반경 +20/랭크, DPS +3/랭크)', descOverrideEn:'Damage zone around core (radius +20/rank, dps +3/rank)',
   iconOverride:'🌀'},
  // Keystones — 극적 트레이드오프
  {id:'ks_immortal',    tree:'def', tier:7, row:0, maxRank:1, type:'keystone', prereqs:['emp','rebirth'],
   ksName:'불멸의 코어', ksNameEn:'Immortal Core', ksIcon:'🛡️',
   ksDesc:'HP ×2.5, 재생 ×3, 주는 데미지 -50%', ksDescEn:'×2.5 HP, ×3 regen, -50% damage dealt', ksExclusive:'def_ks'},
  {id:'ks_storm_lord',  tree:'def', tier:7, row:2, maxRank:1, type:'keystone', prereqs:['storm_eye','rebirth'],
   ksName:'폭풍 군주', ksNameEn:'Storm Lord', ksIcon:'🌪️',
   ksDesc:'자동 공격 범위 +100%, 체인 5체 추가, 데미지 -70%', ksDescEn:'Auto range +100%, +5 chain, -70% damage', ksExclusive:'def_ks'},
  {id:'ks_glass_cannon',tree:'def', tier:7, row:3, maxRank:1, type:'keystone', prereqs:['rebirth','emp'],
   ksName:'유리 대포', ksNameEn:'Glass Cannon', ksIcon:'💎',
   ksDesc:'최대 HP 고정 1, 모든 데미지 ×5', ksDescEn:'Max HP fixed at 1, all damage ×5', ksExclusive:'def_ks'},

  // ═══════════════════════════════════════════════════
  //  🔋 전격 (util) — 21 nodes (19 + 2 keystones)
  //   col0: 자동 공격   col1: 지속/회복   col2: XP 성장   col3: 슬로우·지역
  // ═══════════════════════════════════════════════════
  // Tier 1
  {id:'auto',        tree:'util', tier:1, row:0, maxRank:10, type:'basic', prereqs:[]},
  {id:'regen',       tree:'util', tier:1, row:1, maxRank:10, type:'basic', prereqs:[]},
  {id:'harvest',     tree:'util', tier:1, row:2, maxRank:10, type:'basic', prereqs:[],
   nameOverride:'경험 흡수', nameOverrideEn:'XP Siphon',
   descOverride:'적 처치 시 XP +10%/랭크', descOverrideEn:'+10% XP per kill per rank', iconOverride:'📘'},
  {id:'slow_aura',   tree:'util', tier:1, row:3, maxRank:10, type:'basic', prereqs:[]},
  // Tier 2
  {id:'auto_acc',    tree:'util', tier:2, row:0, maxRank:10,type:'basic', prereqs:['auto']},
  {id:'hp_boost',    tree:'util', tier:2, row:1, maxRank:5, type:'notable', prereqs:['regen']},
  {id:'energy_flat', tree:'util', tier:2, row:2, maxRank:10,type:'basic', prereqs:['harvest'],
   nameOverride:'뇌전 각인', nameOverrideEn:'Thunder Mark',
   descOverride:'적 처치 시 XP +2/랭크', descOverrideEn:'+2 XP per kill per rank', iconOverride:'✨'},
  {id:'cooldown',    tree:'util', tier:2, row:3, maxRank:5, type:'notable', prereqs:['slow_aura']},
  // Tier 3
  {id:'auto_dmg',    tree:'util', tier:3, row:0, maxRank:5, type:'notable', prereqs:['auto_acc']},
  {id:'vampiric',    tree:'util', tier:3, row:1, maxRank:5, type:'notable', prereqs:['hp_boost','regen']}, // HP 체계 양쪽
  {id:'fortune',     tree:'util', tier:3, row:2, maxRank:5, type:'notable', prereqs:['energy_flat','harvest'], // XP 체계 양쪽
   nameOverride:'행운의 번개', nameOverrideEn:'Lucky Bolt',
   descOverride:'적 처치 시 +5%/랭크 확률 XP 2배', descOverrideEn:'+5%/rank chance to double XP on kill', iconOverride:'🍀'},
  {id:'wave_heal',   tree:'util', tier:3, row:3, maxRank:5, type:'notable', prereqs:['cooldown']},
  // Tier 4 — 라인 교차
  {id:'rapid_fire',  tree:'util', tier:4, row:0, maxRank:5, type:'notable', prereqs:['auto_dmg','auto_acc']}, // 자동 양쪽
  {id:'absorption',  tree:'util', tier:4, row:1, maxRank:5, type:'notable', prereqs:['vampiric','hp_boost']}, // HP 심화
  {id:'elite_hunter',tree:'util', tier:4, row:2, maxRank:5, type:'notable', prereqs:['fortune','energy_flat'], // XP 심화
   nameOverride:'정예 처단', nameOverrideEn:'Elite Slayer',
   descOverride:'엘리트 처치 시 XP +50%/랭크', descOverrideEn:'+50%/rank XP from elites', iconOverride:'🎖️'},
  // Tier 5 — 자동+HP 융합 / XP+쿨다운 융합
  {id:'titan_guard', tree:'util', tier:5, row:1, maxRank:5, type:'notable', prereqs:['absorption','vampiric']},
  {id:'bonus_wave',  tree:'util', tier:5, row:2, maxRank:5, type:'notable', prereqs:['elite_hunter','wave_heal'], // 보스처단 + 쿨회복
   nameOverride:'보스 처단', nameOverrideEn:'Boss Slayer',
   descOverride:'보스 처치 시 XP +80%/랭크', descOverrideEn:'+80%/rank XP from bosses', iconOverride:'💀'},
  // Tier 6
  {id:'energy_storm',tree:'util', tier:6, row:0, maxRank:5, type:'notable', prereqs:['rapid_fire','titan_guard'], // 자동+탱커 융합
   nameOverride:'뇌전 폭발', nameOverrideEn:'Thunder Burst',
   descOverride:'처치 시 +15%/랭크 확률 주변 번쩍', descOverrideEn:'+15%/rank chance to flash nearby on kill', iconOverride:'🌩️'},
  {id:'combo',       tree:'util', tier:6, row:2, maxRank:5, type:'notable', prereqs:['bonus_wave','elite_hunter'],
   nameOverride:'연쇄 각성', nameOverrideEn:'Chain Awakening',
   descOverride:'콤보당 XP 보너스 +3/랭크', descOverrideEn:'+3/rank XP per combo stack', iconOverride:'🔢'},
  // 🆕 B: 자석 (magnet_pull) — 유틸 시그니처, T4로 이동 (T3 5칸 conflict 해소)
  {id:'magnet_pull', tree:'util', tier:4, row:3, maxRank:5, type:'notable', prereqs:['wave_heal'],
   nameOverride:'자기장 견인', nameOverrideEn:'Magnet Pull',
   descOverride:'적을 코어로 천천히 끌어당김 (끌림 +8%/랭크)', descOverrideEn:'Slowly pulls enemies toward core (+8%/rank)',
   iconOverride:'🧲'},
  // Keystones — 극적 트레이드오프
  {id:'ks_timelord', tree:'util', tier:7, row:0, maxRank:1, type:'keystone', prereqs:['energy_storm','combo'],
   ksName:'시간의 주인', ksNameEn:'Timelord', ksIcon:'⏳',
   ksDesc:'적 속도 -50%, 자신 쿨다운 -40%', ksDescEn:'Enemies -50% speed, own cooldowns -40%', ksExclusive:'util_ks'},
  {id:'ks_void',     tree:'util', tier:7, row:1, maxRank:1, type:'keystone', prereqs:['energy_storm','bonus_wave'],
   ksName:'공허의 지배자', ksNameEn:'Void Master', ksIcon:'🕳️',
   ksDesc:'5초마다 블랙홀: 모든 적을 중앙으로 흡수 + 데미지', ksDescEn:'Every 5s, blackhole pulls all enemies in + deals damage', ksExclusive:'util_ks'},
  {id:'ks_collector',tree:'util', tier:7, row:2, maxRank:1, type:'keystone', prereqs:['combo','energy_storm'],
   ksName:'수집가', ksNameEn:'Collector', ksIcon:'💰',
   ksDesc:'XP 획득 ×3, 에너지 ×3, 최대 HP -50%', ksDescEn:'×3 XP, ×3 Energy, -50% Max HP', ksExclusive:'util_ks'}
];

// 노드 조회 헬퍼
function getTreeNode(id){ return TREE_NODES.find(n=>n.id===id); }

// 현재 랭크 (keystone은 G.keystones에서, 일반은 G.upgrades에서)
function getNodeRank(node){
  if(!node) return 0;
  if(node.type==='keystone') return G.keystones&&G.keystones[node.id]?1:0;
  return G.upgrades&&G.upgrades[node.id]?G.upgrades[node.id].level:0;
}

// WoW 스타일: 하위 티어 "포인트 합계"로 다음 티어 해금
//  (개별 노드 prereq는 별도로 랭크 요구)
function getTreeInvestedBelow(treeId, tier){
  let sum=0;
  TREE_NODES.forEach(n=>{
    if(n.tree===treeId && n.tier<tier) sum+=getNodeRank(n);
  });
  return sum;
}
function tierGateRequired(tier){
  if(tier<=1) return 0;
  if(tier===7) return 20;           // 키스톤: 20포인트 누적
  return (tier-1)*3;                 // T2=3, T3=6, T4=9, T5=12, T6=15
}
// 선행 노드에 요구되는 최소 랭크 — 기본은 절반, 노드별 prereqRank로 오버라이드 가능
function getPrereqRankReq(childNode, parentNode){
  if(!parentNode) return 1;
  if(childNode && typeof childNode.prereqRank==='number') return childNode.prereqRank;
  // maxRank 절반 (올림): 10→5, 5→3, 3→2, 1→1
  return Math.max(1, Math.ceil(parentNode.maxRank/2));
}

function isTierGateOpen(treeId, tier){
  return getTreeInvestedBelow(treeId,tier) >= tierGateRequired(tier);
}

function isNodeUnlocked(node){
  if(!node) return false;
  if(!isTierGateOpen(node.tree, node.tier)) return false;
  if(node.prereqs&&node.prereqs.length>0){
    // WoW식: 모든 선행 노드가 요구 랭크(기본 maxRank의 절반) 이상
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
// prereq 중 아직 충족되지 않은 것들 {id, name, cur, req} 반환 (툴팁용)
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

// 노드 이름/설명/아이콘 (override → keystone 필드 → locale 순, EN 지원)
function getNodeName(node){
  if(LANG==='en'){
    if(node.nameOverrideEn) return node.nameOverrideEn;
    if(node.type==='keystone'&&node.ksNameEn) return node.ksNameEn;
  }
  if(node.nameOverride) return node.nameOverride;
  if(node.type==='keystone') return node.ksName||node.id;
  const u=UPGRADE_POOL.find(u=>u.id===node.id);
  return u?t('up.'+node.id):node.id;
}
function getNodeDesc(node){
  if(LANG==='en'){
    if(node.descOverrideEn) return node.descOverrideEn;
    if(node.type==='keystone'&&node.ksDescEn) return node.ksDescEn;
  }
  if(node.descOverride) return node.descOverride;
  if(node.type==='keystone') return node.ksDesc||'';
  return t('up.'+node.id+'_d');
}
function getNodeIcon(node){
  if(node.iconOverride) return node.iconOverride;
  if(node.type==='keystone') return node.ksIcon||'✨';
  const u=UPGRADE_POOL.find(u=>u.id===node.id);
  return u?u.icon:'❔';
}

// 키스톤 효과 체크 도우미
function hasKeystone(id){ return !!(G.keystones&&G.keystones[id]); }
