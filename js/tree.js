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
  // Tier 4
  {id:'weak_point',  tree:'atk', tier:4, row:0, maxRank:5, type:'notable', prereqs:['crit_dmg']},
  {id:'multi',       tree:'atk', tier:4, row:1, maxRank:3, type:'notable', prereqs:['precision']},
  {id:'iron_core',   tree:'atk', tier:4, row:2, maxRank:5, type:'notable', prereqs:['boss_hunter']},
  {id:'barrier',     tree:'atk', tier:4, row:3, maxRank:5, type:'notable', prereqs:['bolt_size']},
  // Tier 5
  {id:'execute',     tree:'atk', tier:5, row:0, maxRank:5, type:'notable', prereqs:['weak_point']},
  {id:'rage',        tree:'atk', tier:5, row:1, maxRank:5, type:'notable', prereqs:['multi']},
  {id:'penetrate',   tree:'atk', tier:5, row:2, maxRank:5, type:'notable', prereqs:['iron_core']},
  // Tier 6
  {id:'final_strike',tree:'atk', tier:6, row:0, maxRank:5, type:'notable', prereqs:['execute']},
  {id:'energy_shield',tree:'atk',tier:6, row:2, maxRank:5, type:'notable', prereqs:['penetrate'],
   nameOverride:'뇌전 방벽', descOverride:'HP 80% 이상일 때 피해 -15%/랭크', iconOverride:'🛡️'},
  // Keystones
  {id:'ks_berserker',   tree:'atk', tier:7, row:0, maxRank:1, type:'keystone', prereqs:['final_strike'],
   ksName:'광전사', ksIcon:'🔥', ksDesc:'공격력 +100%, 최대 HP -40%', ksExclusive:'atk_ks'},
  {id:'ks_click_master',tree:'atk', tier:7, row:1, maxRank:1, type:'keystone', prereqs:['rage'],
   ksName:'뇌전의 화신', ksIcon:'⚡', ksDesc:'클릭 데미지 +200%, 자동 공격 비활성화', ksExclusive:'atk_ks'},

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
  {id:'chain_crit',   tree:'def', tier:3, row:0, maxRank:5, type:'notable', prereqs:['chain_dmg']},
  {id:'field_expand', tree:'def', tier:3, row:1, maxRank:5, type:'notable', prereqs:['chain_range']},
  {id:'overload',     tree:'def', tier:3, row:2, maxRank:5, type:'notable', prereqs:['splash_range']},
  {id:'resilience',   tree:'def', tier:3, row:3, maxRank:5, type:'notable', prereqs:['recover']},
  // Tier 4
  {id:'surge',      tree:'def', tier:4, row:0, maxRank:5, type:'notable', prereqs:['chain_crit']},
  {id:'plasma',     tree:'def', tier:4, row:1, maxRank:5, type:'notable', prereqs:['field_expand']},
  {id:'thorns_up',  tree:'def', tier:4, row:2, maxRank:5, type:'notable', prereqs:['overload']},
  {id:'dodge_up',   tree:'def', tier:4, row:3, maxRank:5, type:'notable', prereqs:['resilience']},
  // Tier 5
  {id:'emp',        tree:'def', tier:5, row:0, maxRank:5, type:'notable', prereqs:['surge']},
  {id:'lifeline',   tree:'def', tier:5, row:1, maxRank:5, type:'notable', prereqs:['plasma']},
  {id:'auto_shield',tree:'def', tier:5, row:3, maxRank:5, type:'notable', prereqs:['dodge_up']},
  // Tier 6
  {id:'rebirth',    tree:'def', tier:6, row:3, maxRank:3, type:'notable', prereqs:['auto_shield']},
  // Keystones
  {id:'ks_immortal',    tree:'def', tier:7, row:0, maxRank:1, type:'keystone', prereqs:['emp'],
   ksName:'불멸의 코어', ksIcon:'🛡️', ksDesc:'최대 HP +150%, 재생 2배, 주는 데미지 -30%', ksExclusive:'def_ks'},
  {id:'ks_glass_cannon',tree:'def', tier:7, row:3, maxRank:1, type:'keystone', prereqs:['rebirth'],
   ksName:'유리 대포', ksIcon:'💎', ksDesc:'최대 HP 고정 1, 모든 데미지 ×5', ksExclusive:'def_ks'},

  // ═══════════════════════════════════════════════════
  //  🔋 전격 (util) — 21 nodes (19 + 2 keystones)
  //   col0: 자동 공격   col1: 지속/회복   col2: XP 성장   col3: 슬로우·지역
  // ═══════════════════════════════════════════════════
  // Tier 1
  {id:'auto',        tree:'util', tier:1, row:0, maxRank:10, type:'basic', prereqs:[]},
  {id:'regen',       tree:'util', tier:1, row:1, maxRank:10, type:'basic', prereqs:[]},
  {id:'harvest',     tree:'util', tier:1, row:2, maxRank:10, type:'basic', prereqs:[],
   nameOverride:'경험 흡수', descOverride:'적 처치 시 XP +10%/랭크', iconOverride:'📘'},
  {id:'slow_aura',   tree:'util', tier:1, row:3, maxRank:10, type:'basic', prereqs:[]},
  // Tier 2
  {id:'auto_acc',    tree:'util', tier:2, row:0, maxRank:10,type:'basic', prereqs:['auto']},
  {id:'hp_boost',    tree:'util', tier:2, row:1, maxRank:5, type:'notable', prereqs:['regen']},
  {id:'energy_flat', tree:'util', tier:2, row:2, maxRank:10,type:'basic', prereqs:['harvest'],
   nameOverride:'뇌전 각인', descOverride:'적 처치 시 XP +2/랭크', iconOverride:'✨'},
  {id:'cooldown',    tree:'util', tier:2, row:3, maxRank:5, type:'notable', prereqs:['slow_aura']},
  // Tier 3
  {id:'auto_dmg',    tree:'util', tier:3, row:0, maxRank:5, type:'notable', prereqs:['auto_acc']},
  {id:'vampiric',    tree:'util', tier:3, row:1, maxRank:5, type:'notable', prereqs:['hp_boost']},
  {id:'fortune',     tree:'util', tier:3, row:2, maxRank:5, type:'notable', prereqs:['energy_flat'],
   nameOverride:'행운의 번개', descOverride:'적 처치 시 +5%/랭크 확률 XP 2배', iconOverride:'🍀'},
  {id:'wave_heal',   tree:'util', tier:3, row:3, maxRank:5, type:'notable', prereqs:['cooldown']},
  // Tier 4
  {id:'rapid_fire',  tree:'util', tier:4, row:0, maxRank:5, type:'notable', prereqs:['auto_dmg']},
  {id:'absorption',  tree:'util', tier:4, row:1, maxRank:5, type:'notable', prereqs:['vampiric']},
  {id:'elite_hunter',tree:'util', tier:4, row:2, maxRank:5, type:'notable', prereqs:['fortune'],
   nameOverride:'정예 처단', descOverride:'엘리트 처치 시 XP +50%/랭크', iconOverride:'🎖️'},
  // Tier 5
  {id:'titan_guard', tree:'util', tier:5, row:1, maxRank:5, type:'notable', prereqs:['absorption']},
  {id:'bonus_wave',  tree:'util', tier:5, row:2, maxRank:5, type:'notable', prereqs:['elite_hunter'],
   nameOverride:'보스 처단', descOverride:'보스 처치 시 XP +80%/랭크', iconOverride:'💀'},
  // Tier 6
  {id:'energy_storm',tree:'util', tier:6, row:0, maxRank:5, type:'notable', prereqs:['rapid_fire'],
   nameOverride:'뇌전 폭발', descOverride:'처치 시 +15%/랭크 확률 주변 번쩍', iconOverride:'🌩️'},
  {id:'combo',       tree:'util', tier:6, row:2, maxRank:5, type:'notable', prereqs:['bonus_wave'],
   nameOverride:'연쇄 각성', descOverride:'콤보당 XP 보너스 +3/랭크', iconOverride:'🔢'},
  // Keystones
  {id:'ks_timelord', tree:'util', tier:7, row:0, maxRank:1, type:'keystone', prereqs:['energy_storm'],
   ksName:'시간의 주인', ksIcon:'⏳', ksDesc:'적 이동속도 -40%, XP 획득 -25%', ksExclusive:'util_ks'},
  {id:'ks_collector',tree:'util', tier:7, row:2, maxRank:1, type:'keystone', prereqs:['combo'],
   ksName:'수집가', ksIcon:'💰', ksDesc:'XP 획득 +200%, 최대 HP -30%', ksExclusive:'util_ks'}
];

// 노드 조회 헬퍼
function getTreeNode(id){ return TREE_NODES.find(n=>n.id===id); }

// 현재 랭크 (keystone은 G.keystones에서, 일반은 G.upgrades에서)
function getNodeRank(node){
  if(!node) return 0;
  if(node.type==='keystone') return G.keystones&&G.keystones[node.id]?1:0;
  return G.upgrades&&G.upgrades[node.id]?G.upgrades[node.id].level:0;
}

// 특정 트리의 주어진 티어 "이하"(<)에 투자된 포인트 총합
function getTreeInvestedBelow(treeId, tier){
  let sum=0;
  TREE_NODES.forEach(n=>{
    if(n.tree===treeId && n.tier<tier) sum+=getNodeRank(n);
  });
  return sum;
}
// 티어 T 진입에 필요한 누적 포인트
function tierGateRequired(tier){
  if(tier<=1) return 0;
  if(tier===7) return 14;
  return (tier-1)*2;
}

function isTierGateOpen(treeId, tier){
  return getTreeInvestedBelow(treeId,tier) >= tierGateRequired(tier);
}

function isNodeUnlocked(node){
  if(!node) return false;
  if(!isTierGateOpen(node.tree, node.tier)) return false;
  if(node.prereqs&&node.prereqs.length>0){
    const ok=node.prereqs.some(pid=>{
      const p=getTreeNode(pid);
      return p && getNodeRank(p)>0;
    });
    if(!ok) return false;
  }
  return true;
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

// 노드 이름/설명/아이콘 (override → keystone 필드 → locale 순)
function getNodeName(node){
  if(node.nameOverride) return node.nameOverride;
  if(node.type==='keystone') return node.ksName||node.id;
  const u=UPGRADE_POOL.find(u=>u.id===node.id);
  return u?t('up.'+node.id):node.id;
}
function getNodeDesc(node){
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
