// ================================================================
//  상수 & 설정
// ================================================================
// 난이도 설정 — 적 HP / 획득 자원 배수
const DIFFICULTY_CONFIG={
  easy:     {name:'쉬움',       nameEn:'Easy',      hpMult:0.7, speedMult:0.9, rewardMult:1.2, color:'#44ff88'},
  normal:   {name:'보통',       nameEn:'Normal',    hpMult:1.0, speedMult:1.0, rewardMult:1.0, color:'#ffee00'},
  hard:     {name:'어려움',     nameEn:'Hard',      hpMult:1.4, speedMult:1.1, rewardMult:0.9, color:'#ff8844'},
  nightmare:{name:'악몽',       nameEn:'Nightmare', hpMult:2.2, speedMult:1.25,rewardMult:0.8, color:'#ff4488'}
};
const DIFFICULTY_ORDER=['easy','normal','hard','nightmare'];

const EVOLUTIONS=(()=>{
  const list=[
    // Tier 1: 전기 입문 (1~10)
    {name:'전기 불꽃',threshold:0},
    {name:'작은 스파크',threshold:10},
    {name:'정전기',threshold:25},
    {name:'찌릿한 감전',threshold:45},
    {name:'전류의 씨앗',threshold:70},
    {name:'번개 새싹',threshold:100},
    {name:'방전체',threshold:140},
    {name:'작은 번개',threshold:190},
    {name:'날카로운 전격',threshold:250},
    {name:'번개 수련생',threshold:320},
    // Tier 2: 번개 성장 (11~20)
    {name:'번개',threshold:400},
    {name:'강한 번개',threshold:500},
    {name:'연쇄 번개',threshold:620},
    {name:'번개 전사',threshold:760},
    {name:'뇌격수',threshold:920},
    {name:'뇌전',threshold:1100},
    {name:'폭풍 전조',threshold:1300},
    {name:'천둥 울림',threshold:1520},
    {name:'전격 사냥꾼',threshold:1760},
    {name:'벼락 술사',threshold:2020},
    // Tier 3: 폭풍 (21~30)
    {name:'천둥폭풍',threshold:2300},
    {name:'낙뢰 소환사',threshold:2600},
    {name:'폭풍 인도자',threshold:2920},
    {name:'번개 군주',threshold:3260},
    {name:'뇌신의 축복',threshold:3620},
    {name:'전격 폭풍',threshold:4000},
    {name:'라이트닝 마스터',threshold:4400},
    {name:'슈퍼 라이트닝',threshold:4820},
    {name:'뇌운의 지배자',threshold:5260},
    {name:'번개 대공',threshold:5720},
    // Tier 4: 초월 번개 (31~40)
    {name:'플라즈마 각성',threshold:6200},
    {name:'플라즈마 전사',threshold:6700},
    {name:'이온 폭풍',threshold:7220},
    {name:'전자기 제왕',threshold:7760},
    {name:'하늘의 분노',threshold:8320},
    {name:'썬더 로드',threshold:8900},
    {name:'폭풍의 왕',threshold:9500},
    {name:'메가 라이트닝',threshold:10120},
    {name:'진공 방전',threshold:10760},
    {name:'천계 뇌신',threshold:11420},
    // Tier 5: 우주 전격 (41~50)
    {name:'코스믹 스파크',threshold:12100},
    {name:'성간 번개',threshold:12800},
    {name:'오로라 스톰',threshold:13520},
    {name:'태양풍 라이더',threshold:14260},
    {name:'항성 방전',threshold:15020},
    {name:'초신성 전격',threshold:15800},
    {name:'네뷸라 스톰',threshold:16600},
    {name:'퀘이사 번개',threshold:17420},
    {name:'갤럭시 스톰',threshold:18260},
    {name:'은하 뇌제',threshold:19120},
    // Tier 6: 차원 번개 (51~60)
    {name:'차원 균열',threshold:20000},
    {name:'시공 전격',threshold:21000},
    {name:'공간 붕괴 번개',threshold:22020},
    {name:'다차원 뇌전',threshold:23060},
    {name:'평행 우주 폭풍',threshold:24120},
    {name:'특이점 방전',threshold:25200},
    {name:'웜홀 라이트닝',threshold:26300},
    {name:'차원 제왕',threshold:27420},
    {name:'시간의 번개',threshold:28560},
    {name:'무한 뇌신',threshold:29720},
    // Tier 7: 신화 (61~70)
    {name:'제우스의 창',threshold:30900},
    {name:'토르의 분노',threshold:32100},
    {name:'인드라의 벼락',threshold:33320},
    {name:'라이진의 북',threshold:34560},
    {name:'뇌공의 심판',threshold:35820},
    {name:'천상 뇌격',threshold:37100},
    {name:'신들의 폭풍',threshold:38400},
    {name:'올림포스 번개',threshold:39720},
    {name:'발할라 스톰',threshold:41060},
    {name:'만신전의 뇌왕',threshold:42420},
    // Tier 8: 카오스 (71~80)
    {name:'카오스 스파크',threshold:43800},
    {name:'혼돈의 전격',threshold:45200},
    {name:'엔트로피 폭풍',threshold:46620},
    {name:'암흑 번개',threshold:48060},
    {name:'보이드 라이트닝',threshold:49520},
    {name:'절멸의 뇌전',threshold:51000},
    {name:'소멸자의 번개',threshold:52500},
    {name:'파괴신 뇌격',threshold:54020},
    {name:'종말의 폭풍',threshold:55560},
    {name:'카오스 뇌제',threshold:57120},
    // Tier 9: 창세 (81~90)
    {name:'창세의 불꽃',threshold:58700},
    {name:'원초의 전류',threshold:60300},
    {name:'빅뱅 스파크',threshold:61920},
    {name:'우주 탄생의 빛',threshold:63560},
    {name:'만물의 전격',threshold:65220},
    {name:'시원의 번개',threshold:66900},
    {name:'창조의 뇌전',threshold:68600},
    {name:'빅뱅 라이트닝',threshold:70320},
    {name:'세계수 번개',threshold:72060},
    {name:'데미우르고스',threshold:73820},
    // Tier 10: 절대자 (91~100)
    {name:'절대 전격',threshold:75600},
    {name:'초월자의 번개',threshold:77400},
    {name:'영겁의 뇌전',threshold:79220},
    {name:'무한 번개',threshold:81060},
    {name:'전지전능 뇌신',threshold:82920},
    {name:'아카식 스톰',threshold:84800},
    {name:'에테르 라이트닝',threshold:86700},
    {name:'오메가 번개',threshold:88620},
    {name:'근원의 뇌격',threshold:90560},
    {name:'⚡ THE LIGHTNING GOD ⚡',threshold:92520}
  ];
  // 색상 그라데이션: 노랑→시안→보라→핑크→빨강→금→흰
  const colors=[
    '#ffee00','#ffe033','#ffd700','#eedd22','#ccdd00',
    '#aaee22','#66ee44','#33dd77','#22ddaa','#22ddcc',
    '#44ddff','#33ccff','#22bbff','#22aaff','#3399ff',
    '#4488ff','#5577ff','#6666ff','#7755ff','#8844ff',
    '#8866ff','#9955ff','#aa44ff','#b44aff','#bb44ee',
    '#cc44dd','#dd44cc','#ee44bb','#ff44aa','#ff3399',
    '#ff2288','#ff2277','#ff2266','#ff3355','#ff4444',
    '#ff5533','#ff6622','#ff7711','#ff8800','#ff9900',
    '#ffaa00','#ffbb11','#ffcc22','#ffdd33','#ffee44',
    '#eeff55','#ddff66','#ccff77','#bbff88','#aaffaa',
    '#99ffcc','#88ffdd','#77ffee','#66ffff','#77eeff',
    '#88ddff','#99ccff','#aabbff','#bbaafe','#cc99fe',
    '#dd88fe','#ee77fe','#ff66fe','#ff55ee','#ff44dd',
    '#ff33cc','#ff22bb','#ff33aa','#ff4499','#ff5588',
    '#ff6677','#ff7766','#ff8855','#ff9944','#ffaa33',
    '#ffbb22','#ffcc11','#ffdd00','#eeee00','#ddff00',
    '#ccff22','#bbff44','#aaff66','#99ff88','#88ffaa',
    '#77ffcc','#66ffee','#88eeff','#aaddff','#ccccff',
    '#ddbbff','#eeaaff','#ff99ff','#ffaaff','#ffbbff',
    '#ffccff','#ffddff','#ffeeff','#ffffff','#ffffee'
  ];
  return list.map((e,i)=>{
    const t=Math.min(i/12,8);// evoTier: 0~8 범위로 제한
    return{
      name:e.name,
      threshold:e.threshold,
      color:colors[i]||'#ffffff',
      branches:Math.min(2+Math.floor(t*1.6),15),
      thick:Math.min(2+t*0.75,8),
      evoTier:t
    };
  });
})();

const SKILL_POOL=[
  // ── 공격 ──
  {id:'pierce',name:'관통 번개',desc:'번개가 같은 방향 적 1체 추가 관통 (50%)',icon:'⚡',cat:'atk'},
  {id:'critical',name:'과부하',desc:'15% 확률로 3배 크리티컬 데미지',icon:'💥',cat:'atk'},
  {id:'multishot',name:'번개 분산',desc:'클릭 시 주변 2체 추가 공격 (40%)',icon:'🔱',cat:'atk'},
  {id:'double_strike',name:'이중 낙뢰',desc:'공격 시 20% 확률로 한 번 더 타격',icon:'🔂',cat:'atk'},
  {id:'executioner',name:'처형자',desc:'HP 30% 이하 적에게 데미지 2배',icon:'🗡️',cat:'atk'},
  {id:'chain_boost',name:'체인 증폭',desc:'체인 라이트닝 데미지 +50%',icon:'🔗',cat:'atk'},
  {id:'sniper',name:'원거리 저격',desc:'먼 적일수록 데미지 최대 +80%',icon:'🎯',cat:'atk'},
  {id:'explosion',name:'연쇄 폭발',desc:'적 처치 시 주변에 스플래시 데미지',icon:'💣',cat:'atk'},
  {id:'overcharge',name:'과충전',desc:'자동 공격 데미지 2배',icon:'🔋',cat:'atk'},
  {id:'venom',name:'독전류',desc:'공격 시 3초간 독 데미지 부여',icon:'☠️',cat:'atk'},
  {id:'berserk',name:'광폭',desc:'HP 30% 이하일 때 데미지 2배',icon:'🔥',cat:'atk'},
  {id:'mark',name:'약점 분석',desc:'공격한 적이 3초간 받는 데미지 +30%',icon:'🔍',cat:'atk'},
  // ── 방어 ──
  {id:'shield',name:'코어 실드',desc:'10초마다 피해 1회 무시',icon:'🛡️',cat:'def'},
  {id:'lifesteal',name:'흡수 장막',desc:'적 처치 시 HP 3 회복',icon:'💚',cat:'def'},
  {id:'thorns',name:'반사 번개',desc:'피해 시 가장 가까운 적에게 반격',icon:'↩️',cat:'def'},
  {id:'dodge',name:'위상 변환',desc:'15% 확률로 피해 무시',icon:'💨',cat:'def'},
  {id:'fortress',name:'요새화',desc:'최대 HP +50, 즉시 회복',icon:'🏰',cat:'def'},
  {id:'regen_boost',name:'생명력 파동',desc:'HP 재생 속도 2배',icon:'💗',cat:'def'},
  {id:'absorb',name:'에너지 변환',desc:'받는 피해의 30%를 에너지로 변환',icon:'🔄',cat:'def'},
  // ── 유틸 ──
  {id:'slow',name:'시간 왜곡',desc:'적 이동 속도 20% 감소',icon:'⏳',cat:'util'},
  {id:'static_field',name:'정전기 필드',desc:'코어 주변 적에게 초당 데미지',icon:'🌀',cat:'util'},
  {id:'storm',name:'에너지 폭풍',desc:'8초마다 전체 적에게 데미지',icon:'🌩️',cat:'util'},
  {id:'magnet',name:'자석 필드',desc:'가까운 적일수록 데미지 최대 +50%',icon:'🧲',cat:'util'},
  {id:'quickcharge',name:'빠른 충전',desc:'클릭 쿨다운 40% 감소',icon:'⚡',cat:'util'},
  {id:'bounty',name:'현상금 사냥',desc:'에너지 획득량 +50%',icon:'💰',cat:'util'},
  {id:'lucky',name:'행운의 번개',desc:'에너지 획득 시 25% 확률로 2배',icon:'🍀',cat:'util'},
  {id:'aoe_click',name:'확장 전격',desc:'클릭 적중 범위 +60%',icon:'🎆',cat:'util'},
  {id:'auto_boost',name:'터보 충전',desc:'자동 공격 속도 +50%',icon:'⏩',cat:'util'},
  {id:'wave_bonus',name:'승전 보상',desc:'웨이브 클리어 시 보너스 에너지',icon:'🏆',cat:'util'},
  {id:'gravity',name:'중력장',desc:'코어 근처 적 이동 속도 대폭 감소',icon:'🌑',cat:'util'}
];

// ================================================================
//  업그레이드 풀 (30종) — 웨이브별 해금
// ================================================================
const UPGRADE_POOL=[
  // ─── Tier 1: 웨이브 1+ ───
  {id:'damage',    name:'번개 위력',     icon:'⚡', desc:'번개 데미지 +1',              baseCost:8,   mult:1.35, unlockWave:1,  cat:'atk'},
  {id:'auto',      name:'자동 번개',     icon:'🔋', desc:'자동 공격 속도 +0.35/초',     baseCost:30,  mult:1.45, unlockWave:1,  cat:'atk'},
  {id:'hp',        name:'코어 강화',     icon:'❤️', desc:'최대 HP +20, 재생 +1',        baseCost:60,  mult:1.35, unlockWave:1,  cat:'def'},
  {id:'harvest',   name:'에너지 수확',   icon:'🌀', desc:'에너지 획득량 +10%',          baseCost:50,  mult:1.4,  unlockWave:1,  cat:'util'},
  {id:'click_amp', name:'클릭 강화',     icon:'👆', desc:'클릭 데미지 +3',              baseCost:12,  mult:1.35, unlockWave:1,  cat:'atk'},
  {id:'tough_skin',name:'강화 외피',     icon:'🦴', desc:'최대 HP +15',                 baseCost:25,  mult:1.3,  unlockWave:1,  cat:'def'},
  {id:'wave_heal', name:'전투 회복',     icon:'💊', desc:'웨이브 클리어 시 HP 10 회복', baseCost:35,  mult:1.35, unlockWave:1,  cat:'def'},
  {id:'energy_flat',name:'에너지 증폭',  icon:'💎', desc:'적 처치 시 에너지 +2',        baseCost:20,  mult:1.3,  unlockWave:1,  cat:'util'},
  {id:'auto_acc',  name:'조준 보정',     icon:'📌', desc:'자동 공격 데미지 +1',         baseCost:18,  mult:1.35, unlockWave:1,  cat:'atk'},
  // ─── Tier 2: 웨이브 3+ ───
  {id:'chain',     name:'체인 라이트닝', icon:'🔗', desc:'추가 적 1체 연쇄 타격',       baseCost:120, mult:1.7,  unlockWave:3,  cat:'atk'},
  {id:'range',     name:'전자기장',      icon:'🧲', desc:'공격 범위 +5',                baseCost:100, mult:1.4,  unlockWave:3,  cat:'util'},
  {id:'quick',     name:'신속 충전',     icon:'💨', desc:'클릭 쿨다운 -8ms',            baseCost:80,  mult:1.35, unlockWave:3,  cat:'util'},
  {id:'regen',     name:'재생력 강화',   icon:'💚', desc:'초당 HP 재생 +0.5',           baseCost:70,  mult:1.4,  unlockWave:3,  cat:'def'},
  {id:'precision', name:'정밀 사격',     icon:'🔬', desc:'크리티컬 배율 +0.15',         baseCost:95,  mult:1.45, unlockWave:3,  cat:'atk'},
  {id:'shield_wall',name:'보호벽',       icon:'🧱', desc:'받는 피해 -8%',               baseCost:90,  mult:1.45, unlockWave:3,  cat:'def'},
  {id:'boss_hunter',name:'보스 사냥꾼',  icon:'💀', desc:'보스 데미지 +15%',            baseCost:110, mult:1.5,  unlockWave:3,  cat:'atk'},
  {id:'bolt_size', name:'번개 확대',     icon:'💫', desc:'클릭 적중 범위 +10',          baseCost:100, mult:1.45, unlockWave:3,  cat:'util'},
  {id:'recover',   name:'긴급 복구',     icon:'💗', desc:'HP 30% 이하 시 재생 +2/초',   baseCost:75,  mult:1.4,  unlockWave:3,  cat:'def'},
  // ─── Tier 3: 웨이브 5+ ───
  {id:'crit',      name:'치명타',        icon:'🎯', desc:'크리티컬 확률 +3%',           baseCost:150, mult:1.5,  unlockWave:5,  cat:'atk'},
  {id:'barrier',   name:'보호막',        icon:'🛡️', desc:'받는 피해 감소 +1',           baseCost:200, mult:1.55, unlockWave:5,  cat:'def'},
  {id:'overload',  name:'전력 증폭',     icon:'⚡', desc:'전체 데미지 +8%',             baseCost:250, mult:1.6,  unlockWave:5,  cat:'atk'},
  {id:'splash',    name:'충격파',        icon:'💥', desc:'공격 시 주변 5% 스플래시',    baseCost:180, mult:1.5,  unlockWave:5,  cat:'atk'},
  {id:'slow_aura', name:'감속장',        icon:'⏳', desc:'적 이동속도 -5%',             baseCost:120, mult:1.45, unlockWave:5,  cat:'util'},
  {id:'double_tap',name:'이중 타격',     icon:'🔂', desc:'클릭 12% 확률 2회 공격',      baseCost:200, mult:1.5,  unlockWave:5,  cat:'atk'},
  {id:'resilience',name:'회복 탄성',     icon:'🩹', desc:'HP 50% 이하 시 재생 2배',     baseCost:160, mult:1.45, unlockWave:5,  cat:'def'},
  {id:'weak_point',name:'약점 공략',     icon:'🔍', desc:'적 HP 50% 이하 데미지 +15%',  baseCost:210, mult:1.55, unlockWave:5,  cat:'atk'},
  {id:'elite_hunter',name:'엘리트 사냥', icon:'🏅', desc:'엘리트 처치 에너지 +50%',     baseCost:170, mult:1.45, unlockWave:5,  cat:'util'},
  {id:'iron_core', name:'철벽 코어',     icon:'🔰', desc:'피해 감소 +5%',               baseCost:180, mult:1.5,  unlockWave:5,  cat:'def'},
  // ─── Tier 4: 웨이브 8+ ───
  {id:'crit_dmg',  name:'치명 강화',     icon:'💢', desc:'크리티컬 배율 +0.25',         baseCost:200, mult:1.55, unlockWave:8,  cat:'atk'},
  {id:'chain_dmg', name:'체인 증폭',     icon:'⛓️', desc:'체인 데미지 비율 +10%',       baseCost:180, mult:1.5,  unlockWave:8,  cat:'atk'},
  {id:'auto_dmg',  name:'자동 강화',     icon:'🤖', desc:'자동 공격 데미지 +15%',       baseCost:160, mult:1.45, unlockWave:8,  cat:'atk'},
  {id:'vampiric',  name:'흡혈',          icon:'🩸', desc:'적 처치 시 HP +2 회복',       baseCost:200, mult:1.5,  unlockWave:8,  cat:'def'},
  {id:'dodge_up',  name:'회피 본능',     icon:'💫', desc:'피해 회피 확률 +3%',          baseCost:220, mult:1.55, unlockWave:8,  cat:'def'},
  {id:'victory',   name:'승전 보상',     icon:'🏆', desc:'웨이브 클리어 보너스 에너지', baseCost:150, mult:1.4,  unlockWave:8,  cat:'util'},
  {id:'chain_crit',name:'체인 크리',     icon:'💠', desc:'체인 크리티컬 확률 +5%',      baseCost:240, mult:1.55, unlockWave:8,  cat:'atk'},
  {id:'hp_boost',  name:'체력 증강',     icon:'♥️', desc:'최대 HP +30',                  baseCost:200, mult:1.5,  unlockWave:8,  cat:'def'},
  {id:'splash_range',name:'충격파 확대', icon:'🌊', desc:'스플래시 범위 +20%',          baseCost:230, mult:1.55, unlockWave:8,  cat:'atk'},
  {id:'cooldown',  name:'축전기',        icon:'⏱️', desc:'실드·EMP 쿨다운 -1초',        baseCost:190, mult:1.5,  unlockWave:8,  cat:'util'},
  {id:'energy_shield',name:'에너지 보호',icon:'💜', desc:'에너지 100 이상 시 피해 -15%',baseCost:220, mult:1.55, unlockWave:8,  cat:'def'},
  // ─── Tier 5: 웨이브 12+ ───
  {id:'multi',     name:'다중 낙뢰',     icon:'🔱', desc:'클릭 시 추가 1체 타격',       baseCost:300, mult:1.6,  unlockWave:12, cat:'atk'},
  {id:'rage',      name:'광전사',        icon:'🔥', desc:'연속 처치 시 데미지 +10%/스택',baseCost:250, mult:1.55, unlockWave:12, cat:'atk'},
  {id:'absorption',name:'에너지 변환',   icon:'🔄', desc:'받는 피해 5%를 에너지로',     baseCost:280, mult:1.55, unlockWave:12, cat:'def'},
  {id:'thorns_up', name:'반사 번개',     icon:'↩️', desc:'피격 시 반사 데미지 20%',     baseCost:260, mult:1.5,  unlockWave:12, cat:'def'},
  {id:'fortune',   name:'행운',          icon:'🍀', desc:'2배 에너지 확률 +5%',         baseCost:200, mult:1.45, unlockWave:12, cat:'util'},
  {id:'chain_range',name:'체인 범위',    icon:'📡', desc:'체인 사거리 +30',             baseCost:220, mult:1.5,  unlockWave:12, cat:'util'},
  {id:'execute',   name:'처형',          icon:'☠️', desc:'적 HP 20% 이하 데미지 +50%',   baseCost:320, mult:1.6,  unlockWave:12, cat:'atk'},
  {id:'lifeline',  name:'생명선',        icon:'💖', desc:'크리티컬 적중 시 HP 2 회복',  baseCost:280, mult:1.55, unlockWave:12, cat:'def'},
  {id:'surge',     name:'전류 급등',     icon:'🌠', desc:'전체 데미지 +6%',             baseCost:300, mult:1.55, unlockWave:12, cat:'atk'},
  {id:'field_expand',name:'필드 확장',   icon:'🔭', desc:'전체 공격 범위 +8',           baseCost:250, mult:1.5,  unlockWave:12, cat:'util'},
  {id:'bonus_wave',name:'추가 보상',     icon:'🎁', desc:'보스 처치 에너지 +80%',       baseCost:260, mult:1.5,  unlockWave:12, cat:'util'},
  // ─── Tier 6: 웨이브 16+ ───
  {id:'penetrate', name:'관통',          icon:'🗡️', desc:'보호막 추가 데미지 +20%',     baseCost:350, mult:1.6,  unlockWave:16, cat:'atk'},
  {id:'emp',       name:'EMP 펄스',      icon:'🌩️', desc:'10초마다 전체 적에게 데미지', baseCost:400, mult:1.65, unlockWave:16, cat:'atk'},
  {id:'combo',     name:'콤보 마스터',   icon:'🔢', desc:'연속 처치 보너스 에너지 +3',  baseCost:300, mult:1.5,  unlockWave:16, cat:'util'},
  {id:'auto_shield',name:'에너지 실드',  icon:'🔮', desc:'12초마다 피해 1회 무시',      baseCost:380, mult:1.6,  unlockWave:16, cat:'def'},
  {id:'rapid_fire',name:'속사',          icon:'⏩', desc:'자동 공격 속도 +20%',         baseCost:320, mult:1.55, unlockWave:16, cat:'atk'},
  {id:'plasma',    name:'플라즈마',      icon:'☄️', desc:'공격 15% 확률 범위 폭발',     baseCost:380, mult:1.6,  unlockWave:16, cat:'atk'},
  {id:'rebirth',   name:'부활',          icon:'✨', desc:'HP 0 시 20% 부활 (전투당 1회)',baseCost:420, mult:1.65, unlockWave:16, cat:'def'},
  {id:'final_strike',name:'최종 일격',   icon:'⚔️', desc:'모든 공격에 고정 데미지 +5',  baseCost:360, mult:1.6,  unlockWave:16, cat:'atk'},
  {id:'energy_storm',name:'에너지 폭풍', icon:'🌪️', desc:'에너지 200 이상 시 데미지 +15%',baseCost:350, mult:1.55, unlockWave:16, cat:'util'},
  {id:'titan_guard',name:'타이탄 가드',  icon:'🏛️', desc:'최대 HP +50, 피해 감소 +2',  baseCost:400, mult:1.6,  unlockWave:16, cat:'def'}
];
