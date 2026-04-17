// ================================================================
//  R2: 스킬트리 데이터 (3트리 × 각 ~20노드 + 키스톤)
//  - 기본 노드는 UPGRADE_POOL의 기존 id를 참조 (upLv 메커니즘 재활용)
//  - 키스톤은 새 효과. G.keystones 플래그로 전투 로직에서 체크
//  - 각 노드: tree, tier, row, maxRank, prereqs(any), type
// ================================================================

const TREE_NODES = [
  // ═══════════════════════════════════════════════════
  //  공격 트리 (ATK) — 26 nodes + 2 keystones
  // ═══════════════════════════════════════════════════
  // Tier 1 (시작)
  {id:'damage',    tree:'atk', tier:1, row:0, maxRank:10, type:'basic',    prereqs:[]},
  {id:'auto',      tree:'atk', tier:1, row:1, maxRank:10, type:'basic',    prereqs:[]},
  {id:'click_amp', tree:'atk', tier:1, row:2, maxRank:10, type:'basic',    prereqs:[]},
  {id:'auto_acc',  tree:'atk', tier:1, row:3, maxRank:10, type:'basic',    prereqs:[]},
  // Tier 2
  {id:'chain',       tree:'atk', tier:2, row:0, maxRank:5,  type:'notable', prereqs:['damage']},
  {id:'precision',   tree:'atk', tier:2, row:1, maxRank:5,  type:'notable', prereqs:['damage','click_amp']},
  {id:'boss_hunter', tree:'atk', tier:2, row:2, maxRank:5,  type:'notable', prereqs:['damage']},
  // Tier 3
  {id:'crit',        tree:'atk', tier:3, row:0, maxRank:5,  type:'notable', prereqs:['precision']},
  {id:'overload',    tree:'atk', tier:3, row:1, maxRank:5,  type:'notable', prereqs:['damage']},
  {id:'splash',      tree:'atk', tier:3, row:2, maxRank:5,  type:'notable', prereqs:['chain']},
  {id:'double_tap',  tree:'atk', tier:3, row:3, maxRank:5,  type:'notable', prereqs:['click_amp']},
  {id:'weak_point',  tree:'atk', tier:3, row:4, maxRank:5,  type:'notable', prereqs:['precision']},
  // Tier 4
  {id:'crit_dmg',     tree:'atk', tier:4, row:0, maxRank:5, type:'notable', prereqs:['crit']},
  {id:'chain_dmg',    tree:'atk', tier:4, row:1, maxRank:5, type:'notable', prereqs:['chain']},
  {id:'auto_dmg',     tree:'atk', tier:4, row:2, maxRank:5, type:'notable', prereqs:['auto','auto_acc']},
  {id:'chain_crit',   tree:'atk', tier:4, row:3, maxRank:5, type:'notable', prereqs:['chain','crit']},
  {id:'splash_range', tree:'atk', tier:4, row:4, maxRank:5, type:'notable', prereqs:['splash']},
  // Tier 5
  {id:'multi',   tree:'atk', tier:5, row:0, maxRank:3, type:'notable', prereqs:['double_tap']},
  {id:'rage',    tree:'atk', tier:5, row:1, maxRank:5, type:'notable', prereqs:['overload']},
  {id:'execute', tree:'atk', tier:5, row:2, maxRank:5, type:'notable', prereqs:['weak_point']},
  {id:'surge',   tree:'atk', tier:5, row:3, maxRank:5, type:'notable', prereqs:['overload']},
  // Tier 6
  {id:'penetrate',    tree:'atk', tier:6, row:0, maxRank:5, type:'notable', prereqs:['boss_hunter']},
  {id:'emp',          tree:'atk', tier:6, row:1, maxRank:5, type:'notable', prereqs:['surge']},
  {id:'rapid_fire',   tree:'atk', tier:6, row:2, maxRank:5, type:'notable', prereqs:['auto_dmg']},
  {id:'plasma',       tree:'atk', tier:6, row:3, maxRank:5, type:'notable', prereqs:['splash_range']},
  {id:'final_strike', tree:'atk', tier:6, row:4, maxRank:5, type:'notable', prereqs:['execute']},
  // Keystones (T7, 상호 배타적)
  {id:'ks_berserker',   tree:'atk', tier:7, row:0, maxRank:1, type:'keystone', prereqs:['rage'],
   ksName:'광전사', ksIcon:'🔥', ksDesc:'공격력 +100%, 최대 HP -40%', ksExclusive:'atk_ks'},
  {id:'ks_click_master', tree:'atk', tier:7, row:2, maxRank:1, type:'keystone', prereqs:['multi'],
   ksName:'뇌전의 화신', ksIcon:'⚡', ksDesc:'클릭 데미지 +200%, 자동 공격 비활성화', ksExclusive:'atk_ks'},

  // ═══════════════════════════════════════════════════
  //  방어 트리 (DEF) — 19 nodes + 2 keystones
  // ═══════════════════════════════════════════════════
  // Tier 1
  {id:'hp',         tree:'def', tier:1, row:0, maxRank:10, type:'basic', prereqs:[]},
  {id:'tough_skin', tree:'def', tier:1, row:1, maxRank:10, type:'basic', prereqs:[]},
  {id:'wave_heal',  tree:'def', tier:1, row:2, maxRank:10, type:'basic', prereqs:[]},
  // Tier 2
  {id:'regen',       tree:'def', tier:2, row:0, maxRank:5, type:'notable', prereqs:['hp']},
  {id:'shield_wall', tree:'def', tier:2, row:1, maxRank:5, type:'notable', prereqs:['tough_skin']},
  {id:'recover',     tree:'def', tier:2, row:2, maxRank:5, type:'notable', prereqs:['wave_heal']},
  // Tier 3
  {id:'barrier',    tree:'def', tier:3, row:0, maxRank:5, type:'notable', prereqs:['shield_wall']},
  {id:'resilience', tree:'def', tier:3, row:1, maxRank:5, type:'notable', prereqs:['recover']},
  {id:'iron_core',  tree:'def', tier:3, row:2, maxRank:5, type:'notable', prereqs:['tough_skin','shield_wall']},
  // Tier 4
  {id:'vampiric',      tree:'def', tier:4, row:0, maxRank:5, type:'notable', prereqs:['regen']},
  {id:'dodge_up',      tree:'def', tier:4, row:1, maxRank:5, type:'notable', prereqs:['resilience']},
  {id:'hp_boost',      tree:'def', tier:4, row:2, maxRank:5, type:'notable', prereqs:['hp']},
  {id:'energy_shield', tree:'def', tier:4, row:3, maxRank:5, type:'notable', prereqs:['barrier']},
  // Tier 5
  {id:'absorption', tree:'def', tier:5, row:0, maxRank:5, type:'notable', prereqs:['energy_shield']},
  {id:'thorns_up',  tree:'def', tier:5, row:1, maxRank:5, type:'notable', prereqs:['iron_core']},
  {id:'lifeline',   tree:'def', tier:5, row:2, maxRank:5, type:'notable', prereqs:['vampiric']},
  // Tier 6
  {id:'auto_shield', tree:'def', tier:6, row:0, maxRank:5, type:'notable', prereqs:['absorption']},
  {id:'rebirth',     tree:'def', tier:6, row:1, maxRank:3, type:'notable', prereqs:['lifeline']},
  {id:'titan_guard', tree:'def', tier:6, row:2, maxRank:5, type:'notable', prereqs:['hp_boost']},
  // Keystones
  {id:'ks_immortal',     tree:'def', tier:7, row:0, maxRank:1, type:'keystone', prereqs:['titan_guard'],
   ksName:'불멸의 코어', ksIcon:'🛡️', ksDesc:'최대 HP +150%, 재생 2배, 주는 데미지 -30%', ksExclusive:'def_ks'},
  {id:'ks_glass_cannon', tree:'def', tier:7, row:2, maxRank:1, type:'keystone', prereqs:['rebirth'],
   ksName:'유리 대포', ksIcon:'💎', ksDesc:'최대 HP 고정 1, 모든 데미지 ×5', ksExclusive:'def_ks'},

  // ═══════════════════════════════════════════════════
  //  유틸 트리 (UTIL) — 8 nodes + 2 keystones
  //  (순수 에너지 노드 7개 제거: harvest/energy_flat/fortune/
  //   bonus_wave/victory/combo/elite_hunter — 스킬트리 전환으로 무의미)
  // ═══════════════════════════════════════════════════
  // Tier 1 (시작)
  {id:'range',     tree:'util', tier:1, row:0, maxRank:5, type:'basic',   prereqs:[]},
  {id:'quick',     tree:'util', tier:1, row:1, maxRank:5, type:'basic',   prereqs:[]},
  // Tier 2
  {id:'bolt_size', tree:'util', tier:2, row:0, maxRank:5, type:'notable', prereqs:['range']},
  {id:'slow_aura', tree:'util', tier:2, row:1, maxRank:5, type:'notable', prereqs:['range']},
  // Tier 3
  {id:'cooldown',  tree:'util', tier:3, row:0, maxRank:5, type:'notable', prereqs:['quick']},
  // Tier 4
  {id:'chain_range',  tree:'util', tier:4, row:0, maxRank:5, type:'notable', prereqs:['range']},
  {id:'field_expand', tree:'util', tier:4, row:1, maxRank:5, type:'notable', prereqs:['bolt_size']},
  // Tier 5
  {id:'energy_storm', tree:'util', tier:5, row:0, maxRank:5, type:'notable', prereqs:['field_expand']},
  // Keystones
  {id:'ks_collector', tree:'util', tier:7, row:0, maxRank:1, type:'keystone', prereqs:['energy_storm'],
   ksName:'수집가', ksIcon:'💰', ksDesc:'XP 획득 +200%, 최대 HP -30%', ksExclusive:'util_ks'},
  {id:'ks_timelord',  tree:'util', tier:7, row:1, maxRank:1, type:'keystone', prereqs:['slow_aura'],
   ksName:'시간의 주인', ksIcon:'⏳', ksDesc:'적 이동속도 -40%, XP 획득 -25%', ksExclusive:'util_ks'}
];

// 노드 조회 헬퍼
function getTreeNode(id){ return TREE_NODES.find(n=>n.id===id); }

// 현재 랭크 (keystone은 G.keystones에서, 일반은 G.upgrades에서)
function getNodeRank(node){
  if(!node) return 0;
  if(node.type==='keystone') return G.keystones&&G.keystones[node.id]?1:0;
  return G.upgrades&&G.upgrades[node.id]?G.upgrades[node.id].level:0;
}

// 특정 트리의 주어진 티어 "이하"(<)에 투자된 포인트 총합 — 티어 게이트 계산용
function getTreeInvestedBelow(treeId, tier){
  let sum=0;
  TREE_NODES.forEach(n=>{
    if(n.tree===treeId && n.tier<tier) sum+=getNodeRank(n);
  });
  return sum;
}
// 티어 T 진입에 필요한 누적 포인트 (T1 무료, T2+ 가중)
function tierGateRequired(tier){
  if(tier<=1) return 0;
  if(tier===7) return 14;           // 키스톤: 14포인트 필요
  return (tier-1)*2;                 // T2=2, T3=4, T4=6, T5=8, T6=10
}

// 티어 게이트 통과 여부
function isTierGateOpen(treeId, tier){
  return getTreeInvestedBelow(treeId,tier) >= tierGateRequired(tier);
}

// 선행 조건 충족 여부 (any 만족 + 티어 게이트)
function isNodeUnlocked(node){
  if(!node) return false;
  // 티어 게이트 먼저 체크
  if(!isTierGateOpen(node.tree, node.tier)) return false;
  // prereq 체크 (있다면 최소 하나가 1랭크 이상)
  if(node.prereqs&&node.prereqs.length>0){
    const ok=node.prereqs.some(pid=>{
      const p=getTreeNode(pid);
      return p && getNodeRank(p)>0;
    });
    if(!ok) return false;
  }
  return true;
}

// 같은 배타 그룹의 다른 키스톤이 이미 찍혔으면 선택 불가
function isKeystoneBlocked(node){
  if(node.type!=='keystone'||!node.ksExclusive) return false;
  return TREE_NODES.some(n=>
    n!==node && n.type==='keystone' && n.ksExclusive===node.ksExclusive && getNodeRank(n)>0
  );
}

// SP 투자 가능 여부
function canInvestNode(node){
  if(!node) return false;
  if(G.skillPoints<=0) return false;
  if(getNodeRank(node)>=node.maxRank) return false;
  if(!isNodeUnlocked(node)) return false;
  if(node.type==='keystone'&&isKeystoneBlocked(node)) return false;
  return true;
}

// SP 투자 실행
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

// 특정 트리의 tier별 노드 그룹
function nodesByTree(treeId){
  return TREE_NODES.filter(n=>n.tree===treeId);
}

// 노드 이름/설명 (기존 locale 우선, 없으면 keystone 필드 사용)
function getNodeName(node){
  if(node.type==='keystone') return node.ksName||node.id;
  const u=UPGRADE_POOL.find(u=>u.id===node.id);
  return u?t('up.'+node.id):node.id;
}
function getNodeDesc(node){
  if(node.type==='keystone') return node.ksDesc||'';
  return t('up.'+node.id+'_d');
}
function getNodeIcon(node){
  if(node.type==='keystone') return node.ksIcon||'✨';
  const u=UPGRADE_POOL.find(u=>u.id===node.id);
  return u?u.icon:'❔';
}

// 키스톤 효과가 전투 로직에 영향을 미치도록 도우미 플래그
function hasKeystone(id){ return !!(G.keystones&&G.keystones[id]); }
