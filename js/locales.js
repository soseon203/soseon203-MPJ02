// ================================================================
//  i18n 시스템
// ================================================================
let LANG=localStorage.getItem('lang')||'ko';

const I18N={ko:{},en:{}};

function t(key){return I18N[LANG][key]||I18N.ko[key]||key}
function tf(key,v){
  let s=t(key);
  if(v)Object.keys(v).forEach(k=>{s=s.replace(new RegExp('\\{'+k+'\\}','g'),v[k])});
  return s;
}
function setLang(lang){
  LANG=lang;
  localStorage.setItem('lang',lang);
  document.documentElement.lang=lang;
}

// ================================================================
//  UI 라벨
// ================================================================
I18N.ko['ui.title']='라이트닝 키우기';
I18N.ko['ui.sound']='사운드';
I18N.ko['ui.pause']='일시정지';
I18N.ko['ui.damage']='데미지';
I18N.ko['ui.auto_per_sec']='자동/초';
I18N.ko['ui.kills']='처치';
I18N.ko['ui.energy']='에너지';
I18N.ko['ui.enemy_prefix']='적: ';
I18N.ko['ui.enemy_count']='{alive}/{remain}';
I18N.ko['ui.wave_waiting']='대기 중...';
I18N.ko['ui.none']='없음';
I18N.ko['ui.enemy_roster']='출현 적';
I18N.ko['ui.retry']='다시 시작';

I18N.en['ui.title']='Lightning Raising';
I18N.en['ui.sound']='Sound';
I18N.en['ui.pause']='Pause';
I18N.en['ui.damage']='Damage';
I18N.en['ui.auto_per_sec']='Auto/s';
I18N.en['ui.kills']='Kills';
I18N.en['ui.energy']='Energy';
I18N.en['ui.enemy_prefix']='Foe: ';
I18N.en['ui.enemy_count']='{alive}/{remain}';
I18N.en['ui.wave_waiting']='Waiting...';
I18N.en['ui.none']='None';
I18N.en['ui.enemy_roster']='Enemies';
I18N.en['ui.retry']='Retry';

// ================================================================
//  Game Over 라벨
// ================================================================
I18N.ko['go.wave']='웨이브';
I18N.ko['go.kills']='처치';
I18N.ko['go.energy']='에너지';
I18N.ko['go.evo']='진화';
I18N.ko['go.damage']='데미지';
I18N.ko['go.auto']='자동/초';
I18N.ko['go.upgrades']='업그레이드 현황';
I18N.ko['go.skills']='획득 스킬';

I18N.en['go.wave']='Wave';
I18N.en['go.kills']='Kills';
I18N.en['go.energy']='Energy';
I18N.en['go.evo']='Evolution';
I18N.en['go.damage']='Damage';
I18N.en['go.auto']='Auto/s';
I18N.en['go.upgrades']='Upgrades';
I18N.en['go.skills']='Skills';

// ================================================================
//  팝업 텍스트
// ================================================================
I18N.ko['pop.evo_title']='⚡ 진화!';
I18N.ko['pop.evo_desc']='총 처치 {count}체 달성!';
I18N.ko['pop.evo_ok']='계속하기';
I18N.ko['pop.skill_title']='⚡ 특수 스킬 획득!';
I18N.ko['pop.skill_sub']='보스를 처치했습니다! 스킬 1개를 선택하세요.';
I18N.ko['pop.upg_title']='⚡ 새 업그레이드 해금!';
I18N.ko['pop.upg_sub']='업그레이드 1개를 선택하여 슬롯에 추가하세요.';
I18N.ko['pop.pause_resume']='계속하기';
I18N.ko['pop.pause_reset']='처음부터';

I18N.en['pop.evo_title']='⚡ Evolution!';
I18N.en['pop.evo_desc']='Total {count} kills reached!';
I18N.en['pop.evo_ok']='Continue';
I18N.en['pop.skill_title']='⚡ Special Skill!';
I18N.en['pop.skill_sub']='Boss defeated! Choose 1 skill.';
I18N.en['pop.upg_title']='⚡ New Upgrade!';
I18N.en['pop.upg_sub']='Choose 1 upgrade to add to your slots.';
I18N.en['pop.pause_resume']='Resume';
I18N.en['pop.pause_reset']='Restart';

// ================================================================
//  전투 메시지 (showFloatText)
// ================================================================
I18N.ko['msg.shield']='실드!';
I18N.ko['msg.dodge']='회피!';
I18N.ko['msg.shield_block']='방패!';
I18N.ko['msg.absorb']='흡수!';
I18N.ko['msg.destroy']='파괴!';
I18N.ko['msg.bonus']='보너스';
I18N.ko['msg.victory']='승전';

I18N.en['msg.shield']='SHIELD!';
I18N.en['msg.dodge']='DODGE!';
I18N.en['msg.shield_block']='BLOCKED!';
I18N.en['msg.absorb']='ABSORB!';
I18N.en['msg.destroy']='DESTROY!';
I18N.en['msg.bonus']='Bonus';
I18N.en['msg.victory']='Victory';

// ================================================================
//  카테고리
// ================================================================
I18N.ko['cat.atk']='공격';
I18N.ko['cat.def']='방어';
I18N.ko['cat.util']='유틸';

I18N.en['cat.atk']='ATK';
I18N.en['cat.def']='DEF';
I18N.en['cat.util']='UTIL';

// ================================================================
//  웨이브 타입 이름
// ================================================================
I18N.ko['wave.swarm']='떼거지';
I18N.ko['wave.elite']='정예';
I18N.ko['wave.rush']='돌격';
I18N.ko['wave.fortress']='요새';
I18N.ko['wave.mixed']='혼합';
I18N.ko['wave.chaos']='혼돈';
I18N.ko['wave.nightmare']='악몽';
I18N.ko['wave.normal']='';

I18N.en['wave.swarm']='Swarm';
I18N.en['wave.elite']='Elite';
I18N.en['wave.rush']='Rush';
I18N.en['wave.fortress']='Fortress';
I18N.en['wave.mixed']='Mixed';
I18N.en['wave.chaos']='Chaos';
I18N.en['wave.nightmare']='Nightmare';
I18N.en['wave.normal']='';

// ================================================================
//  적 패턴 이름 / 특성
// ================================================================
I18N.ko['pt.normal']='일반';    I18N.ko['pt.normal_t']='기본';
I18N.ko['pt.zigzag']='지그재그';I18N.ko['pt.zigzag_t']='좌우 흔들림';
I18N.ko['pt.spiral']='나선';    I18N.ko['pt.spiral_t']='나선 접근';
I18N.ko['pt.charger']='돌격';   I18N.ko['pt.charger_t']='돌진';
I18N.ko['pt.tank']='탱크';      I18N.ko['pt.tank_t']='고HP 저속';
I18N.ko['pt.splitter']='분열';  I18N.ko['pt.splitter_t']='사망시 분열';
I18N.ko['pt.dodger']='회피';    I18N.ko['pt.dodger_t']='고속 회피';
I18N.ko['pt.bomber']='폭격';    I18N.ko['pt.bomber_t']='원거리 공격';
I18N.ko['pt.healer']='치유';    I18N.ko['pt.healer_t']='아군 회복';
I18N.ko['pt.phaser']='위상';    I18N.ko['pt.phaser_t']='면역 전환';
I18N.ko['pt.teleporter']='순이동';I18N.ko['pt.teleporter_t']='순간이동';
I18N.ko['pt.shield_bearer']='방패';I18N.ko['pt.shield_bearer_t']='보호막';
I18N.ko['pt.comet']='혜성';     I18N.ko['pt.comet_t']='초고속 관통';
I18N.ko['pt.pulse']='펄스';     I18N.ko['pt.pulse_t']='원거리 탄';
I18N.ko['pt.swarm_mother']='군단모';I18N.ko['pt.swarm_mother_t']='적 소환';
I18N.ko['pt.freezer']='냉동';   I18N.ko['pt.freezer_t']='공속 감소';
I18N.ko['pt.mirror']='분신';    I18N.ko['pt.mirror_t']='사망시 복제';
I18N.ko['pt.absorber']='흡수';  I18N.ko['pt.absorber_t']='동료 흡수';
I18N.ko['pt.orbiter']='궤도';   I18N.ko['pt.orbiter_t']='코어 공전';
I18N.ko['pt.titan']='타이탄';   I18N.ko['pt.titan_t']='초고HP';
I18N.ko['pt.elite']='정예';     I18N.ko['pt.elite_t']='강화형';
I18N.ko['pt.boss']='보스';      I18N.ko['pt.boss_t']='지진파';

I18N.en['pt.normal']='Normal';    I18N.en['pt.normal_t']='Basic';
I18N.en['pt.zigzag']='Zigzag';   I18N.en['pt.zigzag_t']='Swerves';
I18N.en['pt.spiral']='Spiral';   I18N.en['pt.spiral_t']='Spiral path';
I18N.en['pt.charger']='Charger'; I18N.en['pt.charger_t']='Charges';
I18N.en['pt.tank']='Tank';       I18N.en['pt.tank_t']='High HP, slow';
I18N.en['pt.splitter']='Splitter';I18N.en['pt.splitter_t']='Splits on death';
I18N.en['pt.dodger']='Dodger';   I18N.en['pt.dodger_t']='Fast dodge';
I18N.en['pt.bomber']='Bomber';   I18N.en['pt.bomber_t']='Ranged attack';
I18N.en['pt.healer']='Healer';   I18N.en['pt.healer_t']='Heals allies';
I18N.en['pt.phaser']='Phaser';   I18N.en['pt.phaser_t']='Phase shift';
I18N.en['pt.teleporter']='Teleporter';I18N.en['pt.teleporter_t']='Teleports';
I18N.en['pt.shield_bearer']='Shielder';I18N.en['pt.shield_bearer_t']='Has shield';
I18N.en['pt.comet']='Comet';     I18N.en['pt.comet_t']='Ultra fast';
I18N.en['pt.pulse']='Pulse';     I18N.en['pt.pulse_t']='Ranged shots';
I18N.en['pt.swarm_mother']='Swarm Mother';I18N.en['pt.swarm_mother_t']='Spawns foes';
I18N.en['pt.freezer']='Freezer'; I18N.en['pt.freezer_t']='Slows attack';
I18N.en['pt.mirror']='Mirror';   I18N.en['pt.mirror_t']='Clones on death';
I18N.en['pt.absorber']='Absorber';I18N.en['pt.absorber_t']='Absorbs allies';
I18N.en['pt.orbiter']='Orbiter'; I18N.en['pt.orbiter_t']='Orbits core';
I18N.en['pt.titan']='Titan';     I18N.en['pt.titan_t']='Massive HP';
I18N.en['pt.elite']='Elite';     I18N.en['pt.elite_t']='Enhanced';
I18N.en['pt.boss']='Boss';       I18N.en['pt.boss_t']='Quake';

// ================================================================
//  진화 이름 (100)
// ================================================================
const _EVO_KO=[
  '전기 불꽃','작은 스파크','정전기','찌릿한 감전','전류의 씨앗',
  '번개 새싹','방전체','작은 번개','날카로운 전격','번개 수련생',
  '번개','강한 번개','연쇄 번개','번개 전사','뇌격수',
  '뇌전','폭풍 전조','천둥 울림','전격 사냥꾼','벼락 술사',
  '천둥폭풍','낙뢰 소환사','폭풍 인도자','번개 군주','뇌신의 축복',
  '전격 폭풍','라이트닝 마스터','슈퍼 라이트닝','뇌운의 지배자','번개 대공',
  '플라즈마 각성','플라즈마 전사','이온 폭풍','전자기 제왕','하늘의 분노',
  '썬더 로드','폭풍의 왕','메가 라이트닝','진공 방전','천계 뇌신',
  '코스믹 스파크','성간 번개','오로라 스톰','태양풍 라이더','항성 방전',
  '초신성 전격','네뷸라 스톰','퀘이사 번개','갤럭시 스톰','은하 뇌제',
  '차원 균열','시공 전격','공간 붕괴 번개','다차원 뇌전','평행 우주 폭풍',
  '특이점 방전','웜홀 라이트닝','차원 제왕','시간의 번개','무한 뇌신',
  '제우스의 창','토르의 분노','인드라의 벼락','라이진의 북','뇌공의 심판',
  '천상 뇌격','신들의 폭풍','올림포스 번개','발할라 스톰','만신전의 뇌왕',
  '카오스 스파크','혼돈의 전격','엔트로피 폭풍','암흑 번개','보이드 라이트닝',
  '절멸의 뇌전','소멸자의 번개','파괴신 뇌격','종말의 폭풍','카오스 뇌제',
  '창세의 불꽃','원초의 전류','빅뱅 스파크','우주 탄생의 빛','만물의 전격',
  '시원의 번개','창조의 뇌전','빅뱅 라이트닝','세계수 번개','데미우르고스',
  '절대 전격','초월자의 번개','영겁의 뇌전','무한 번개','전지전능 뇌신',
  '아카식 스톰','에테르 라이트닝','오메가 번개','근원의 뇌격','⚡ THE LIGHTNING GOD ⚡'
];
const _EVO_EN=[
  'Electric Spark','Tiny Spark','Static Charge','Mild Shock','Current Seed',
  'Lightning Sprout','Discharger','Small Bolt','Sharp Strike','Lightning Trainee',
  'Lightning','Strong Lightning','Chain Lightning','Lightning Warrior','Thunderer',
  'Thunder Bolt','Storm Herald','Thunder Roar','Storm Hunter','Lightning Mage',
  'Thunderstorm','Lightning Summoner','Storm Guide','Lightning Lord','Thunder Blessing',
  'Electric Storm','Lightning Master','Super Lightning','Cloud Sovereign','Lightning Archduke',
  'Plasma Awakening','Plasma Warrior','Ion Storm','EM Emperor','Wrath of Sky',
  'Thunder Lord','Storm King','Mega Lightning','Vacuum Discharge','Celestial Thunder God',
  'Cosmic Spark','Interstellar Bolt','Aurora Storm','Solar Wind Rider','Stellar Discharge',
  'Supernova Strike','Nebula Storm','Quasar Lightning','Galaxy Storm','Galactic Emperor',
  'Dimension Rift','Spacetime Strike','Spatial Collapse','Multidimensional Bolt','Parallel Storm',
  'Singularity Discharge','Wormhole Lightning','Dimension Emperor','Time Lightning','Infinite Thunder God',
  'Spear of Zeus','Wrath of Thor','Bolt of Indra','Drum of Raijin','Judgment of Thunder',
  'Celestial Strike','Storm of Gods','Olympus Lightning','Valhalla Storm','King of Pantheon',
  'Chaos Spark','Chaotic Strike','Entropy Storm','Dark Lightning','Void Lightning',
  'Annihilation Bolt','Destroyer Lightning','God-Slayer Strike','Apocalypse Storm','Chaos Emperor',
  'Genesis Flame','Primal Current','Big Bang Spark','Light of Creation','Universal Strike',
  'Origin Lightning','Creation Thunder','Big Bang Lightning','World Tree Bolt','Demiurge',
  'Absolute Strike','Transcendent Bolt','Eternal Thunder','Infinite Lightning','Omnipotent Thunder God',
  'Akashic Storm','Aether Lightning','Omega Lightning','Source Thunder','⚡ THE LIGHTNING GOD ⚡'
];
_EVO_KO.forEach((n,i)=>{I18N.ko['evo.'+i]=n});
_EVO_EN.forEach((n,i)=>{I18N.en['evo.'+i]=n});

// ================================================================
//  스킬 이름 / 설명 (31)
// ================================================================
// 공격
I18N.ko['sk.pierce']='관통 번개';        I18N.ko['sk.pierce_d']='번개가 같은 방향 적 1체 추가 관통 (50%)';
I18N.ko['sk.critical']='과부하';          I18N.ko['sk.critical_d']='15% 확률로 3배 크리티컬 데미지';
I18N.ko['sk.multishot']='번개 분산';      I18N.ko['sk.multishot_d']='클릭 시 주변 2체 추가 공격 (40%)';
I18N.ko['sk.double_strike']='이중 낙뢰';  I18N.ko['sk.double_strike_d']='공격 시 20% 확률로 한 번 더 타격';
I18N.ko['sk.executioner']='처형자';       I18N.ko['sk.executioner_d']='HP 30% 이하 적에게 데미지 2배';
I18N.ko['sk.chain_boost']='체인 증폭';   I18N.ko['sk.chain_boost_d']='체인 라이트닝 데미지 +50%';
I18N.ko['sk.sniper']='원거리 저격';       I18N.ko['sk.sniper_d']='먼 적일수록 데미지 최대 +80%';
I18N.ko['sk.explosion']='연쇄 폭발';     I18N.ko['sk.explosion_d']='적 처치 시 주변에 스플래시 데미지';
I18N.ko['sk.overcharge']='과충전';        I18N.ko['sk.overcharge_d']='자동 공격 데미지 2배';
I18N.ko['sk.venom']='독전류';            I18N.ko['sk.venom_d']='공격 시 3초간 독 데미지 부여';
I18N.ko['sk.berserk']='광폭';            I18N.ko['sk.berserk_d']='HP 30% 이하일 때 데미지 2배';
I18N.ko['sk.mark']='약점 분석';          I18N.ko['sk.mark_d']='공격한 적이 3초간 받는 데미지 +30%';
// 방어
I18N.ko['sk.shield']='코어 실드';        I18N.ko['sk.shield_d']='10초마다 피해 1회 무시';
I18N.ko['sk.lifesteal']='흡수 장막';     I18N.ko['sk.lifesteal_d']='적 처치 시 HP 3 회복';
I18N.ko['sk.thorns']='반사 번개';        I18N.ko['sk.thorns_d']='피해 시 가장 가까운 적에게 반격';
I18N.ko['sk.dodge']='위상 변환';         I18N.ko['sk.dodge_d']='15% 확률로 피해 무시';
I18N.ko['sk.fortress']='요새화';         I18N.ko['sk.fortress_d']='최대 HP +50, 즉시 회복';
I18N.ko['sk.regen_boost']='생명력 파동'; I18N.ko['sk.regen_boost_d']='HP 재생 속도 2배';
I18N.ko['sk.absorb']='에너지 변환';      I18N.ko['sk.absorb_d']='받는 피해의 30%를 에너지로 변환';
// 유틸
I18N.ko['sk.slow']='시간 왜곡';          I18N.ko['sk.slow_d']='적 이동 속도 20% 감소';
I18N.ko['sk.static_field']='정전기 필드';I18N.ko['sk.static_field_d']='코어 주변 적에게 초당 데미지';
I18N.ko['sk.storm']='에너지 폭풍';       I18N.ko['sk.storm_d']='8초마다 전체 적에게 데미지';
I18N.ko['sk.magnet']='자석 필드';        I18N.ko['sk.magnet_d']='가까운 적일수록 데미지 최대 +50%';
I18N.ko['sk.quickcharge']='빠른 충전';   I18N.ko['sk.quickcharge_d']='클릭 쿨다운 40% 감소';
I18N.ko['sk.bounty']='현상금 사냥';      I18N.ko['sk.bounty_d']='에너지 획득량 +50%';
I18N.ko['sk.lucky']='행운의 번개';       I18N.ko['sk.lucky_d']='에너지 획득 시 25% 확률로 2배';
I18N.ko['sk.aoe_click']='확장 전격';     I18N.ko['sk.aoe_click_d']='클릭 적중 범위 +60%';
I18N.ko['sk.auto_boost']='터보 충전';    I18N.ko['sk.auto_boost_d']='자동 공격 속도 +50%';
I18N.ko['sk.wave_bonus']='승전 보상';    I18N.ko['sk.wave_bonus_d']='웨이브 클리어 시 보너스 에너지';
I18N.ko['sk.gravity']='중력장';          I18N.ko['sk.gravity_d']='코어 근처 적 이동 속도 대폭 감소';

I18N.en['sk.pierce']='Piercing Bolt';       I18N.en['sk.pierce_d']='Lightning pierces 1 extra enemy in same direction (50%)';
I18N.en['sk.critical']='Overload';          I18N.en['sk.critical_d']='15% chance for 3x critical damage';
I18N.en['sk.multishot']='Multishot';        I18N.en['sk.multishot_d']='Click hits 2 extra nearby enemies (40%)';
I18N.en['sk.double_strike']='Double Strike';I18N.en['sk.double_strike_d']='20% chance to strike twice';
I18N.en['sk.executioner']='Executioner';    I18N.en['sk.executioner_d']='2x damage to enemies below 30% HP';
I18N.en['sk.chain_boost']='Chain Boost';    I18N.en['sk.chain_boost_d']='Chain lightning damage +50%';
I18N.en['sk.sniper']='Sniper';             I18N.en['sk.sniper_d']='Up to +80% damage to distant enemies';
I18N.en['sk.explosion']='Chain Explosion';  I18N.en['sk.explosion_d']='Splash damage on enemy kill';
I18N.en['sk.overcharge']='Overcharge';      I18N.en['sk.overcharge_d']='Auto-attack damage x2';
I18N.en['sk.venom']='Venom Current';       I18N.en['sk.venom_d']='Attacks apply poison for 3s';
I18N.en['sk.berserk']='Berserk';           I18N.en['sk.berserk_d']='2x damage when HP below 30%';
I18N.en['sk.mark']='Weakness Analysis';    I18N.en['sk.mark_d']='Attacked enemies take +30% damage for 3s';
I18N.en['sk.shield']='Core Shield';        I18N.en['sk.shield_d']='Block 1 hit every 10s';
I18N.en['sk.lifesteal']='Life Drain';      I18N.en['sk.lifesteal_d']='Recover 3 HP on kill';
I18N.en['sk.thorns']='Reflect Lightning';  I18N.en['sk.thorns_d']='Counter-attack nearest enemy on hit';
I18N.en['sk.dodge']='Phase Shift';         I18N.en['sk.dodge_d']='15% chance to dodge damage';
I18N.en['sk.fortress']='Fortify';          I18N.en['sk.fortress_d']='Max HP +50, instant heal';
I18N.en['sk.regen_boost']='Vitality Wave'; I18N.en['sk.regen_boost_d']='HP regen speed x2';
I18N.en['sk.absorb']='Energy Convert';     I18N.en['sk.absorb_d']='Convert 30% of damage taken to energy';
I18N.en['sk.slow']='Time Warp';           I18N.en['sk.slow_d']='Enemy move speed -20%';
I18N.en['sk.static_field']='Static Field'; I18N.en['sk.static_field_d']='Damage nearby enemies per second';
I18N.en['sk.storm']='Energy Storm';        I18N.en['sk.storm_d']='Damage all enemies every 8s';
I18N.en['sk.magnet']='Magnet Field';       I18N.en['sk.magnet_d']='Up to +50% damage to close enemies';
I18N.en['sk.quickcharge']='Quick Charge';  I18N.en['sk.quickcharge_d']='Click cooldown -40%';
I18N.en['sk.bounty']='Bounty Hunter';     I18N.en['sk.bounty_d']='Energy gain +50%';
I18N.en['sk.lucky']='Lucky Lightning';     I18N.en['sk.lucky_d']='25% chance for double energy';
I18N.en['sk.aoe_click']='Expanded Strike'; I18N.en['sk.aoe_click_d']='Click range +60%';
I18N.en['sk.auto_boost']='Turbo Charge';  I18N.en['sk.auto_boost_d']='Auto-attack speed +50%';
I18N.en['sk.wave_bonus']='Wave Reward';    I18N.en['sk.wave_bonus_d']='Bonus energy on wave clear';
I18N.en['sk.gravity']='Gravity Well';     I18N.en['sk.gravity_d']='Greatly slow enemies near core';

// ================================================================
//  업그레이드 이름 / 설명 (60+)
// ================================================================
// Tier 1
I18N.ko['up.damage']='번개 위력';     I18N.ko['up.damage_d']='번개 데미지 +1';
I18N.ko['up.auto']='자동 번개';       I18N.ko['up.auto_d']='자동 공격 속도 +0.35/초';
I18N.ko['up.hp']='코어 강화';         I18N.ko['up.hp_d']='최대 HP +20, 재생 +1';
I18N.ko['up.harvest']='에너지 수확';  I18N.ko['up.harvest_d']='에너지 획득량 +10%';
I18N.ko['up.click_amp']='클릭 강화';  I18N.ko['up.click_amp_d']='클릭 데미지 +3';
I18N.ko['up.tough_skin']='강화 외피'; I18N.ko['up.tough_skin_d']='최대 HP +15';
I18N.ko['up.wave_heal']='전투 회복';  I18N.ko['up.wave_heal_d']='웨이브 클리어 시 HP 10 회복';
I18N.ko['up.energy_flat']='에너지 증폭';I18N.ko['up.energy_flat_d']='적 처치 시 에너지 +2';
I18N.ko['up.auto_acc']='조준 보정';   I18N.ko['up.auto_acc_d']='자동 공격 데미지 +1';
// Tier 2
I18N.ko['up.chain']='체인 라이트닝';  I18N.ko['up.chain_d']='추가 적 1체 연쇄 타격';
I18N.ko['up.range']='전자기장';       I18N.ko['up.range_d']='공격 범위 +5';
I18N.ko['up.quick']='신속 충전';      I18N.ko['up.quick_d']='클릭 쿨다운 -8ms';
I18N.ko['up.regen']='재생력 강화';    I18N.ko['up.regen_d']='초당 HP 재생 +0.5';
I18N.ko['up.precision']='정밀 사격';  I18N.ko['up.precision_d']='크리티컬 배율 +0.15';
I18N.ko['up.shield_wall']='보호벽';   I18N.ko['up.shield_wall_d']='받는 피해 -8%';
I18N.ko['up.boss_hunter']='보스 사냥꾼';I18N.ko['up.boss_hunter_d']='보스 데미지 +15%';
I18N.ko['up.bolt_size']='번개 확대';  I18N.ko['up.bolt_size_d']='클릭 적중 범위 +10';
I18N.ko['up.recover']='긴급 복구';    I18N.ko['up.recover_d']='HP 30% 이하 시 재생 +2/초';
// Tier 3
I18N.ko['up.crit']='치명타';          I18N.ko['up.crit_d']='크리티컬 확률 +3%';
I18N.ko['up.barrier']='보호막';       I18N.ko['up.barrier_d']='받는 피해 감소 +1';
I18N.ko['up.overload']='전력 증폭';   I18N.ko['up.overload_d']='전체 데미지 +8%';
I18N.ko['up.splash']='충격파';        I18N.ko['up.splash_d']='공격 시 주변 5% 스플래시';
I18N.ko['up.slow_aura']='감속장';     I18N.ko['up.slow_aura_d']='적 이동속도 -5%';
I18N.ko['up.double_tap']='이중 타격'; I18N.ko['up.double_tap_d']='클릭 12% 확률 2회 공격';
I18N.ko['up.resilience']='회복 탄성'; I18N.ko['up.resilience_d']='HP 50% 이하 시 재생 2배';
I18N.ko['up.weak_point']='약점 공략'; I18N.ko['up.weak_point_d']='적 HP 50% 이하 데미지 +15%';
I18N.ko['up.elite_hunter']='엘리트 사냥';I18N.ko['up.elite_hunter_d']='엘리트 처치 에너지 +50%';
I18N.ko['up.iron_core']='철벽 코어';  I18N.ko['up.iron_core_d']='피해 감소 +5%';
// Tier 4
I18N.ko['up.crit_dmg']='치명 강화';   I18N.ko['up.crit_dmg_d']='크리티컬 배율 +0.25';
I18N.ko['up.chain_dmg']='체인 증폭';  I18N.ko['up.chain_dmg_d']='체인 데미지 비율 +10%';
I18N.ko['up.auto_dmg']='자동 강화';   I18N.ko['up.auto_dmg_d']='자동 공격 데미지 +15%';
I18N.ko['up.vampiric']='흡혈';        I18N.ko['up.vampiric_d']='적 처치 시 HP +2 회복';
I18N.ko['up.dodge_up']='회피 본능';   I18N.ko['up.dodge_up_d']='피해 회피 확률 +3%';
I18N.ko['up.victory']='승전 보상';    I18N.ko['up.victory_d']='웨이브 클리어 보너스 에너지';
I18N.ko['up.chain_crit']='체인 크리'; I18N.ko['up.chain_crit_d']='체인 크리티컬 확률 +5%';
I18N.ko['up.hp_boost']='체력 증강';   I18N.ko['up.hp_boost_d']='최대 HP +30';
I18N.ko['up.splash_range']='충격파 확대';I18N.ko['up.splash_range_d']='스플래시 범위 +20%';
I18N.ko['up.cooldown']='축전기';      I18N.ko['up.cooldown_d']='실드·EMP 쿨다운 -1초';
I18N.ko['up.energy_shield']='에너지 보호';I18N.ko['up.energy_shield_d']='에너지 100 이상 시 피해 -15%';
// Tier 5
I18N.ko['up.multi']='다중 낙뢰';     I18N.ko['up.multi_d']='클릭 시 추가 1체 타격';
I18N.ko['up.rage']='광전사';          I18N.ko['up.rage_d']='연속 처치 시 데미지 +10%/스택';
I18N.ko['up.absorption']='에너지 변환';I18N.ko['up.absorption_d']='받는 피해 5%를 에너지로';
I18N.ko['up.thorns_up']='반사 번개';  I18N.ko['up.thorns_up_d']='피격 시 반사 데미지 20%';
I18N.ko['up.fortune']='행운';         I18N.ko['up.fortune_d']='2배 에너지 확률 +5%';
I18N.ko['up.chain_range']='체인 범위';I18N.ko['up.chain_range_d']='체인 사거리 +30';
I18N.ko['up.execute']='처형';         I18N.ko['up.execute_d']='적 HP 20% 이하 데미지 +50%';
I18N.ko['up.lifeline']='생명선';      I18N.ko['up.lifeline_d']='크리티컬 적중 시 HP 2 회복';
I18N.ko['up.surge']='전류 급등';      I18N.ko['up.surge_d']='전체 데미지 +6%';
I18N.ko['up.field_expand']='필드 확장';I18N.ko['up.field_expand_d']='전체 공격 범위 +8';
I18N.ko['up.bonus_wave']='추가 보상'; I18N.ko['up.bonus_wave_d']='보스 처치 에너지 +80%';
// Tier 6
I18N.ko['up.penetrate']='관통';       I18N.ko['up.penetrate_d']='보호막 추가 데미지 +20%';
I18N.ko['up.emp']='EMP 펄스';         I18N.ko['up.emp_d']='10초마다 전체 적에게 데미지';
I18N.ko['up.combo']='콤보 마스터';    I18N.ko['up.combo_d']='연속 처치 보너스 에너지 +3';
I18N.ko['up.auto_shield']='에너지 실드';I18N.ko['up.auto_shield_d']='12초마다 피해 1회 무시';
I18N.ko['up.rapid_fire']='속사';      I18N.ko['up.rapid_fire_d']='자동 공격 속도 +20%';
I18N.ko['up.plasma']='플라즈마';      I18N.ko['up.plasma_d']='공격 15% 확률 범위 폭발';
I18N.ko['up.rebirth']='부활';         I18N.ko['up.rebirth_d']='HP 0 시 20% 부활 (전투당 1회)';
I18N.ko['up.final_strike']='최종 일격';I18N.ko['up.final_strike_d']='모든 공격에 고정 데미지 +5';
I18N.ko['up.energy_storm']='에너지 폭풍';I18N.ko['up.energy_storm_d']='에너지 200 이상 시 데미지 +15%';
I18N.ko['up.titan_guard']='타이탄 가드';I18N.ko['up.titan_guard_d']='최대 HP +50, 피해 감소 +2';

// English upgrades
I18N.en['up.damage']='Lightning Power';  I18N.en['up.damage_d']='Lightning damage +1';
I18N.en['up.auto']='Auto Lightning';     I18N.en['up.auto_d']='Auto-attack speed +0.35/s';
I18N.en['up.hp']='Core Fortify';         I18N.en['up.hp_d']='Max HP +20, regen +1';
I18N.en['up.harvest']='Energy Harvest';  I18N.en['up.harvest_d']='Energy gain +10%';
I18N.en['up.click_amp']='Click Amp';     I18N.en['up.click_amp_d']='Click damage +3';
I18N.en['up.tough_skin']='Tough Skin';   I18N.en['up.tough_skin_d']='Max HP +15';
I18N.en['up.wave_heal']='Battle Heal';   I18N.en['up.wave_heal_d']='Recover 10 HP on wave clear';
I18N.en['up.energy_flat']='Energy Amp';  I18N.en['up.energy_flat_d']='Energy +2 per kill';
I18N.en['up.auto_acc']='Aim Assist';     I18N.en['up.auto_acc_d']='Auto-attack damage +1';
I18N.en['up.chain']='Chain Lightning';   I18N.en['up.chain_d']='Chain hit 1 extra enemy';
I18N.en['up.range']='EM Field';          I18N.en['up.range_d']='Attack range +5';
I18N.en['up.quick']='Quick Charge';      I18N.en['up.quick_d']='Click cooldown -8ms';
I18N.en['up.regen']='Regeneration';      I18N.en['up.regen_d']='HP regen +0.5/s';
I18N.en['up.precision']='Precision';     I18N.en['up.precision_d']='Critical multiplier +0.15';
I18N.en['up.shield_wall']='Shield Wall'; I18N.en['up.shield_wall_d']='Damage taken -8%';
I18N.en['up.boss_hunter']='Boss Hunter'; I18N.en['up.boss_hunter_d']='Boss damage +15%';
I18N.en['up.bolt_size']='Bolt Expand';   I18N.en['up.bolt_size_d']='Click hit range +10';
I18N.en['up.recover']='Emergency Heal';  I18N.en['up.recover_d']='Regen +2/s when HP below 30%';
I18N.en['up.crit']='Critical Hit';       I18N.en['up.crit_d']='Critical chance +3%';
I18N.en['up.barrier']='Barrier';         I18N.en['up.barrier_d']='Damage reduction +1';
I18N.en['up.overload']='Power Surge';    I18N.en['up.overload_d']='All damage +8%';
I18N.en['up.splash']='Shockwave';        I18N.en['up.splash_d']='5% splash on attack';
I18N.en['up.slow_aura']='Slow Aura';     I18N.en['up.slow_aura_d']='Enemy speed -5%';
I18N.en['up.double_tap']='Double Tap';   I18N.en['up.double_tap_d']='12% chance to attack twice';
I18N.en['up.resilience']='Resilience';   I18N.en['up.resilience_d']='x2 regen when HP below 50%';
I18N.en['up.weak_point']='Weak Point';   I18N.en['up.weak_point_d']='Damage +15% to enemies below 50% HP';
I18N.en['up.elite_hunter']='Elite Hunter';I18N.en['up.elite_hunter_d']='Elite kill energy +50%';
I18N.en['up.iron_core']='Iron Core';     I18N.en['up.iron_core_d']='Damage reduction +5%';
I18N.en['up.crit_dmg']='Critical Boost'; I18N.en['up.crit_dmg_d']='Critical multiplier +0.25';
I18N.en['up.chain_dmg']='Chain Boost';   I18N.en['up.chain_dmg_d']='Chain damage ratio +10%';
I18N.en['up.auto_dmg']='Auto Boost';     I18N.en['up.auto_dmg_d']='Auto-attack damage +15%';
I18N.en['up.vampiric']='Vampiric';       I18N.en['up.vampiric_d']='Recover 2 HP on kill';
I18N.en['up.dodge_up']='Dodge Instinct'; I18N.en['up.dodge_up_d']='Dodge chance +3%';
I18N.en['up.victory']='Victory Reward';  I18N.en['up.victory_d']='Bonus energy on wave clear';
I18N.en['up.chain_crit']='Chain Crit';   I18N.en['up.chain_crit_d']='Chain critical chance +5%';
I18N.en['up.hp_boost']='HP Boost';       I18N.en['up.hp_boost_d']='Max HP +30';
I18N.en['up.splash_range']='Shockwave+'; I18N.en['up.splash_range_d']='Splash range +20%';
I18N.en['up.cooldown']='Capacitor';      I18N.en['up.cooldown_d']='Shield/EMP cooldown -1s';
I18N.en['up.energy_shield']='E-Shield';  I18N.en['up.energy_shield_d']='Damage -15% when energy 100+';
I18N.en['up.multi']='Multi Strike';      I18N.en['up.multi_d']='Click hits 1 extra enemy';
I18N.en['up.rage']='Berserker';          I18N.en['up.rage_d']='Kill streak +10% damage/stack';
I18N.en['up.absorption']='Absorption';   I18N.en['up.absorption_d']='Convert 5% damage to energy';
I18N.en['up.thorns_up']='Reflect Bolt';  I18N.en['up.thorns_up_d']='Reflect 20% damage on hit';
I18N.en['up.fortune']='Fortune';         I18N.en['up.fortune_d']='Double energy chance +5%';
I18N.en['up.chain_range']='Chain Range'; I18N.en['up.chain_range_d']='Chain range +30';
I18N.en['up.execute']='Execute';         I18N.en['up.execute_d']='Damage +50% to enemies below 20% HP';
I18N.en['up.lifeline']='Lifeline';       I18N.en['up.lifeline_d']='Recover 2 HP on critical hit';
I18N.en['up.surge']='Power Surge';       I18N.en['up.surge_d']='All damage +6%';
I18N.en['up.field_expand']='Field Expand';I18N.en['up.field_expand_d']='All attack range +8';
I18N.en['up.bonus_wave']='Boss Bounty';  I18N.en['up.bonus_wave_d']='Boss kill energy +80%';
I18N.en['up.penetrate']='Penetrate';     I18N.en['up.penetrate_d']='Shield bonus damage +20%';
I18N.en['up.emp']='EMP Pulse';           I18N.en['up.emp_d']='Damage all enemies every 10s';
I18N.en['up.combo']='Combo Master';      I18N.en['up.combo_d']='Kill streak bonus energy +3';
I18N.en['up.auto_shield']='Energy Shield';I18N.en['up.auto_shield_d']='Block 1 hit every 12s';
I18N.en['up.rapid_fire']='Rapid Fire';   I18N.en['up.rapid_fire_d']='Auto-attack speed +20%';
I18N.en['up.plasma']='Plasma';           I18N.en['up.plasma_d']='15% chance area explosion';
I18N.en['up.rebirth']='Rebirth';         I18N.en['up.rebirth_d']='Revive at 20% HP (once per battle)';
I18N.en['up.final_strike']='Final Strike';I18N.en['up.final_strike_d']='All attacks +5 flat damage';
I18N.en['up.energy_storm']='Energy Storm';I18N.en['up.energy_storm_d']='Damage +15% when energy 200+';
I18N.en['up.titan_guard']='Titan Guard'; I18N.en['up.titan_guard_d']='Max HP +50, damage reduction +2';

// ================================================================
//  업그레이드 동적 설명 (getUpgradeDesc용)
// ================================================================
I18N.ko['ud.damage']='데미지 {cur} → {next}';
I18N.ko['ud.auto']='초당 {cur} → {next}회';
I18N.ko['ud.chain']='체인 {cur} → {next}체';
I18N.ko['ud.hp']='HP {cur} → {next}';
I18N.ko['ud.crit']='크리 {cur}% → {next}%';
I18N.ko['ud.range']='범위 +{cur} → +{next}';
I18N.ko['ud.quick']='쿨타임 -{cur}ms → -{next}ms';
I18N.ko['ud.barrier']='감소 {cur} → {next}';
I18N.ko['ud.overload']='데미지 +{cur}% → +{next}%';
I18N.ko['ud.harvest']='에너지 +{cur}% → +{next}%';
I18N.ko['ud.regen']='재생 +{cur} → +{next}/초';
I18N.ko['ud.splash']='스플래시 {cur}% → {next}%';
I18N.ko['ud.slow_aura']='감속 {cur}% → {next}%';
I18N.ko['ud.crit_dmg']='크리 배율 +{cur} → +{next}';
I18N.ko['ud.chain_dmg']='체인 +{cur}% → +{next}%';
I18N.ko['ud.auto_dmg']='자동 +{cur}% → +{next}%';
I18N.ko['ud.vampiric']='회복 {cur} → {next}/킬';
I18N.ko['ud.dodge_up']='회피 {cur}% → {next}%';
I18N.ko['ud.victory']='보너스 +{cur} → +{next}';
I18N.ko['ud.multi']='추가 {cur} → {next}체';
I18N.ko['ud.rage']='+{cur}%/스택 → +{next}%/스택';
I18N.ko['ud.absorption']='변환 {cur}% → {next}%';
I18N.ko['ud.thorns_up']='반사 {cur}% → {next}%';
I18N.ko['ud.fortune']='행운 {cur}% → {next}%';
I18N.ko['ud.chain_range']='범위 +{cur} → +{next}';
I18N.ko['ud.penetrate']='관통 {cur}% → {next}%';
I18N.ko['ud.emp']='EMP {cur}% → {next}%';
I18N.ko['ud.combo']='보너스 +{cur} → +{next}/콤보';
I18N.ko['ud.auto_shield']='충전 {cur}초 → {next}초';
I18N.ko['ud.rapid_fire']='속도 +{cur}% → +{next}%';
I18N.ko['ud.click_amp']='클릭 +{cur} → +{next}';
I18N.ko['ud.tough_skin']='HP +{cur} → +{next}';
I18N.ko['ud.wave_heal']='회복 {cur} → {next}/웨이브';
I18N.ko['ud.energy_flat']='에너지 +{cur} → +{next}/킬';
I18N.ko['ud.auto_acc']='자동 +{cur} → +{next}';
I18N.ko['ud.precision']='크리배율 +{cur} → +{next}';
I18N.ko['ud.shield_wall']='감소 {cur}% → {next}%';
I18N.ko['ud.boss_hunter']='보스 +{cur}% → +{next}%';
I18N.ko['ud.bolt_size']='범위 +{cur} → +{next}';
I18N.ko['ud.recover']='재생 +{cur} → +{next}/초';
I18N.ko['ud.double_tap']='확률 {cur}% → {next}%';
I18N.ko['ud.resilience']='재생 {cur}배 → {next}배';
I18N.ko['ud.weak_point']='+{cur}% → +{next}%';
I18N.ko['ud.elite_hunter']='에너지 +{cur}% → +{next}%';
I18N.ko['ud.iron_core']='감소 {cur}% → {next}%';
I18N.ko['ud.chain_crit']='크리 {cur}% → {next}%';
I18N.ko['ud.hp_boost']='HP +{cur} → +{next}';
I18N.ko['ud.splash_range']='범위 +{cur}% → +{next}%';
I18N.ko['ud.cooldown']='쿨다운 -{cur}초 → -{next}초';
I18N.ko['ud.energy_shield']='감소 {cur}% → {next}%';
I18N.ko['ud.execute']='+{cur}% → +{next}%';
I18N.ko['ud.lifeline']='회복 {cur} → {next}/크리';
I18N.ko['ud.surge']='데미지 +{cur}% → +{next}%';
I18N.ko['ud.field_expand']='범위 +{cur} → +{next}';
I18N.ko['ud.bonus_wave']='보스 +{cur}% → +{next}%';
I18N.ko['ud.plasma']='폭발 {cur}% → {next}%';
I18N.ko['ud.rebirth']='부활 HP {cur}% → {next}%';
I18N.ko['ud.final_strike']='고정 +{cur} → +{next}';
I18N.ko['ud.energy_storm']='데미지 +{cur}% → +{next}%';
I18N.ko['ud.titan_guard']='HP +{cur}, 감소 +{curR} → HP +{next}, 감소 +{nextR}';

I18N.en['ud.damage']='Damage {cur} → {next}';
I18N.en['ud.auto']='Rate {cur} → {next}/s';
I18N.en['ud.chain']='Chain {cur} → {next}';
I18N.en['ud.hp']='HP {cur} → {next}';
I18N.en['ud.crit']='Crit {cur}% → {next}%';
I18N.en['ud.range']='Range +{cur} → +{next}';
I18N.en['ud.quick']='CD -{cur}ms → -{next}ms';
I18N.en['ud.barrier']='Reduce {cur} → {next}';
I18N.en['ud.overload']='Dmg +{cur}% → +{next}%';
I18N.en['ud.harvest']='Energy +{cur}% → +{next}%';
I18N.en['ud.regen']='Regen +{cur} → +{next}/s';
I18N.en['ud.splash']='Splash {cur}% → {next}%';
I18N.en['ud.slow_aura']='Slow {cur}% → {next}%';
I18N.en['ud.crit_dmg']='Crit mult +{cur} → +{next}';
I18N.en['ud.chain_dmg']='Chain +{cur}% → +{next}%';
I18N.en['ud.auto_dmg']='Auto +{cur}% → +{next}%';
I18N.en['ud.vampiric']='Heal {cur} → {next}/kill';
I18N.en['ud.dodge_up']='Dodge {cur}% → {next}%';
I18N.en['ud.victory']='Bonus +{cur} → +{next}';
I18N.en['ud.multi']='Extra {cur} → {next}';
I18N.en['ud.rage']='+{cur}%/stack → +{next}%/stack';
I18N.en['ud.absorption']='Convert {cur}% → {next}%';
I18N.en['ud.thorns_up']='Reflect {cur}% → {next}%';
I18N.en['ud.fortune']='Luck {cur}% → {next}%';
I18N.en['ud.chain_range']='Range +{cur} → +{next}';
I18N.en['ud.penetrate']='Pierce {cur}% → {next}%';
I18N.en['ud.emp']='EMP {cur}% → {next}%';
I18N.en['ud.combo']='Bonus +{cur} → +{next}/combo';
I18N.en['ud.auto_shield']='Charge {cur}s → {next}s';
I18N.en['ud.rapid_fire']='Speed +{cur}% → +{next}%';
I18N.en['ud.click_amp']='Click +{cur} → +{next}';
I18N.en['ud.tough_skin']='HP +{cur} → +{next}';
I18N.en['ud.wave_heal']='Heal {cur} → {next}/wave';
I18N.en['ud.energy_flat']='Energy +{cur} → +{next}/kill';
I18N.en['ud.auto_acc']='Auto +{cur} → +{next}';
I18N.en['ud.precision']='Crit mult +{cur} → +{next}';
I18N.en['ud.shield_wall']='Reduce {cur}% → {next}%';
I18N.en['ud.boss_hunter']='Boss +{cur}% → +{next}%';
I18N.en['ud.bolt_size']='Range +{cur} → +{next}';
I18N.en['ud.recover']='Regen +{cur} → +{next}/s';
I18N.en['ud.double_tap']='Chance {cur}% → {next}%';
I18N.en['ud.resilience']='Regen {cur}x → {next}x';
I18N.en['ud.weak_point']='+{cur}% → +{next}%';
I18N.en['ud.elite_hunter']='Energy +{cur}% → +{next}%';
I18N.en['ud.iron_core']='Reduce {cur}% → {next}%';
I18N.en['ud.chain_crit']='Crit {cur}% → {next}%';
I18N.en['ud.hp_boost']='HP +{cur} → +{next}';
I18N.en['ud.splash_range']='Range +{cur}% → +{next}%';
I18N.en['ud.cooldown']='CD -{cur}s → -{next}s';
I18N.en['ud.energy_shield']='Reduce {cur}% → {next}%';
I18N.en['ud.execute']='+{cur}% → +{next}%';
I18N.en['ud.lifeline']='Heal {cur} → {next}/crit';
I18N.en['ud.surge']='Dmg +{cur}% → +{next}%';
I18N.en['ud.field_expand']='Range +{cur} → +{next}';
I18N.en['ud.bonus_wave']='Boss +{cur}% → +{next}%';
I18N.en['ud.plasma']='Explode {cur}% → {next}%';
I18N.en['ud.rebirth']='Revive HP {cur}% → {next}%';
I18N.en['ud.final_strike']='Flat +{cur} → +{next}';
I18N.en['ud.energy_storm']='Dmg +{cur}% → +{next}%';
I18N.en['ud.titan_guard']='HP +{cur}, Red +{curR} → HP +{next}, Red +{nextR}';

// ================================================================
//  HTML 정적 텍스트 갱신
// ================================================================
function applyI18nHTML(){
  document.title=t('ui.title');
  const s=id=>document.getElementById(id);
  s('sound-btn').querySelector('.top-btn-label').textContent=t('ui.sound');
  s('sound-btn').title=t('ui.sound');
  s('pause-btn').querySelector('.top-btn-label').textContent=t('ui.pause');
  s('pause-btn').title=t('ui.pause');
  // stats row
  document.querySelectorAll('.stat-label').forEach(el=>{
    const map={'데미지':'ui.damage','자동/초':'ui.auto_per_sec','처치':'ui.kills',
               'Damage':'ui.damage','Auto/s':'ui.auto_per_sec','Kills':'ui.kills'};
    const k=map[el.textContent];
    if(k) el.textContent=t(k);
  });
  s('energy-unit').textContent=t('ui.energy');
  // game over labels
  document.querySelectorAll('.go-stat-label').forEach(el=>{
    const map={'웨이브':'go.wave','처치':'go.kills','에너지':'go.energy','진화':'go.evo','데미지':'go.damage','자동/초':'go.auto',
               'Wave':'go.wave','Kills':'go.kills','Energy':'go.energy','Evolution':'go.evo','Damage':'go.damage','Auto/s':'go.auto'};
    const k=map[el.textContent];
    if(k) el.textContent=t(k);
  });
  document.querySelectorAll('.go-section-title').forEach(el=>{
    const map={'업그레이드 현황':'go.upgrades','획득 스킬':'go.skills','Upgrades':'go.upgrades','Skills':'go.skills'};
    const k=map[el.textContent];
    if(k) el.textContent=t(k);
  });
  s('go-retry').textContent=t('ui.retry');
  // popups
  s('evolution-content').querySelector('h2').textContent=t('pop.evo_title');
  s('evo-ok').textContent=t('pop.evo_ok');
  s('skill-content').querySelector('h2').textContent=t('pop.skill_title');
  s('skill-subtitle').textContent=t('pop.skill_sub');
  s('upgrade-content').querySelector('h2').textContent=t('pop.upg_title');
  s('upgrade-subtitle').textContent=t('pop.upg_sub');
  s('pause-resume').textContent=t('pop.pause_resume');
  s('pause-reset').textContent=t('pop.pause_reset');
}
