// ================================================================
//  V4 Shards Engine — 파편 시스템
//  "분리된 존재의 자율 전투" — 건담 핀판넬 + 번개 파편 컨셉
//
//  3번째 트리 (파편 트리)의 핵심 엔진.
//  - createShard: 파편 생성
//  - updateShards: 프레임별 업데이트 (이동·유도·충돌·분열·공명·소멸)
//  - renderShards: 렌더링 (점·꼬리·공명 구체 글로우)
//  - spawnShardsOnKill: killEnemy에서 호출 훅
//
//  세계관 톤: SF ("방전 잔해", "전하 응축") — 정령/마법 용어 금지
// ================================================================

// 성능/가독성 안전장치
const SHARD_MAX_TOTAL = 200;     // 동시 존재 상한
const SHARD_MAX_GEN = 3;          // 분열 세대 (0=원본, 최대 3세대)
const SHARD_BASE_LIFE = 1.0;      // 기본 수명 (초)
const SHARD_BASE_SPEED = 3.5;     // 기본 이동 속도 (px/frame)
const SHARD_ORB_LIFE = 2.0;       // 공명 구체 수명
const SHARD_RESONANCE_DIST = 12;  // 공명 발동 거리 (px)

// 색 팔레트 (계층 구분)
const SHARD_COLOR_BASE  = '#ffee88';  // 원본 파편: 노란-청
const SHARD_COLOR_SPLIT = '#ffcc66';  // 분열: 주황
const SHARD_COLOR_ORB   = '#ff88ff';  // 공명 구체: 핑크-보라
const SHARD_COLOR_BURST = '#ff44cc';  // Keystone 폭발: 진홍보라

// ================================================================
//  생성
// ================================================================
function createShard(x, y, damage, options){
  options = options || {};
  const direction = options.direction != null ? options.direction : Math.random()*Math.PI*2;
  const speed = options.speed || SHARD_BASE_SPEED;
  const generation = options.generation || 0;
  const isOrb = !!options.isOrb;
  const targetEnemy = options.targetEnemy || null;

  // 수명: 구체는 고정, 일반은 shard_life 랭크로 연장
  const life = isOrb
    ? SHARD_ORB_LIFE
    : (SHARD_BASE_LIFE + (upLv('shard_life')||0)*0.3);

  // 색상: 세대/구체에 따라 구분
  let color;
  if(isOrb) color = SHARD_COLOR_ORB;
  else if(generation >= 1) color = SHARD_COLOR_SPLIT;
  else color = SHARD_COLOR_BASE;
  if(options.color) color = options.color;

  const shard = {
    id: ++G._shardIdCounter,
    x: x, y: y,
    vx: Math.cos(direction)*speed,
    vy: Math.sin(direction)*speed,
    damage: damage,
    life: life,
    maxLife: life,
    generation: generation,
    isOrb: isOrb,
    pierce: isOrb ? 99 : (upLv('shard_pierce')||0),
    targetId: targetEnemy ? targetEnemy.id : null,
    color: color,
    size: isOrb ? 12 : Math.max(2, 4 - generation)  // gen에 따라 축소
  };
  if(!G.shards) G.shards = [];
  G.shards.push(shard);

  // 성능 가드: 상한 초과 시 가장 오래된 것 제거
  while(G.shards.length > SHARD_MAX_TOTAL) G.shards.shift();
  return shard;
}

// ================================================================
//  처치 시 파편 스폰 (killEnemy에서 호출)
// ================================================================
function spawnShardsOnKill(enemy){
  if(!G.shards) G.shards=[];
  // shard_basic 랭크 ≥ 1이어야 작동
  const basicLv = upLv('shard_basic')||0;
  if(basicLv <= 0) return;

  // 생성 수 = shard_count (1~6, 기본 1)
  const count = 1 + (upLv('shard_count')||0);
  // ks_core_split: 코어 분할은 파편 수 ×3
  const mult = hasKeystone('ks_core_split') ? 3 : 1;

  // 기본 피해 = 본체 클릭 데미지 × 0.3 × (1 + shard_damage×0.1)
  const baseDmg = Math.max(1, Math.floor(
    G.damage * 0.3 * (1 + (upLv('shard_damage')||0)*0.1)
  ));

  for(let i=0;i<count*mult;i++){
    const angle = (i/(count*mult))*Math.PI*2 + Math.random()*0.3;
    createShard(enemy.x, enemy.y, baseDmg, {direction: angle});
  }
}

// ================================================================
//  매 프레임 업데이트
// ================================================================
function updateShards(dt){
  if(!G.shards || G.shards.length===0) return;

  const w = gameCanvas.width/dpr, h = gameCanvas.height/dpr;

  // ks_lightning_deconstruct: 파편 기본 데미지 ×3 (런타임 배수)
  const ksDeconMult = hasKeystone('ks_lightning_deconstruct') ? 3 : 1;

  // homing 강도 (shard_range 랭크)
  const homingStrength = (upLv('shard_range')||0)*0.15;
  // speed mult (shard_speed 랭크)
  const speedMult = 1 + (upLv('shard_speed')||0)*0.15;

  for(let i=G.shards.length-1;i>=0;i--){
    const s = G.shards[i];

    // 수명 감소
    s.life -= dt;
    if(s.life <= 0){
      // shard_absorb: 소멸 시 HP 회복
      const absorbLv = upLv('shard_absorb')||0;
      if(absorbLv > 0){
        G.hp = Math.min(G.maxHp, G.hp + absorbLv);
      }
      G.shards.splice(i,1);
      continue;
    }

    // 유도 (shard_range)
    if(homingStrength > 0){
      // 가장 가까운 살아있는 적
      let target = null, bestD = Infinity;
      for(const e of G.enemies){
        if(e.hp <= 0) continue;
        const d = Math.hypot(e.x-s.x, e.y-s.y);
        if(d < bestD){ bestD = d; target = e; }
      }
      if(target && bestD < 400){
        const dx = target.x - s.x, dy = target.y - s.y;
        const d = Math.hypot(dx,dy) || 1;
        // 속도 벡터를 목표 방향으로 보간
        s.vx = s.vx*(1-homingStrength) + (dx/d)*SHARD_BASE_SPEED*homingStrength;
        s.vy = s.vy*(1-homingStrength) + (dy/d)*SHARD_BASE_SPEED*homingStrength;
      }
    }

    // 이동
    s.x += s.vx * speedMult;
    s.y += s.vy * speedMult;

    // 화면 밖으로 벗어나면 수명 급감 (파편이 무한 돌아다니지 않도록)
    if(s.x < -50 || s.x > w+50 || s.y < -50 || s.y > h+50){
      s.life = Math.min(s.life, 0.1);
    }

    // 적 충돌 판정 (한 프레임 1적)
    let hitIndex = -1;
    for(let j=0;j<G.enemies.length;j++){
      const e = G.enemies[j];
      if(e.hp <= 0) continue;
      const d = Math.hypot(e.x-s.x, e.y-s.y);
      if(d < (e.size||18)*0.9){
        hitIndex = j;
        break;
      }
    }

    if(hitIndex >= 0){
      const e = G.enemies[hitIndex];
      // 데미지 계산 (파편 크리 판정)
      let dmg = s.damage * ksDeconMult;
      const critChance = (upLv('shard_crit')||0)*0.03;
      let isCrit = false;
      if(critChance > 0 && Math.random() < critChance){
        const critMult = 2 + (upLv('shard_crit_dmg')||0)*0.2;
        dmg = Math.ceil(dmg * critMult);
        isCrit = true;
        // shard_crit_chain: 크리 시 추가 파편 3개
        if((upLv('shard_crit_chain')||0) > 0){
          for(let k=0;k<3;k++){
            createShard(e.x, e.y, Math.max(1,Math.floor(s.damage*0.5)), {
              direction: Math.random()*Math.PI*2
            });
          }
        }
      }
      // 구체 증폭 (orb_boost): 공명 구체에만 적용
      if(s.isOrb && (upLv('orb_boost')||0) > 0){
        dmg = Math.ceil(dmg * (1 + (upLv('orb_boost')||0)*0.25));
      }

      damageEnemy(e, Math.ceil(dmg), null, null, false, isCrit);
      addSparks(e.x, e.y, s.isOrb?6:3, s.color);

      // 관통 처리
      if(s.pierce > 0){
        s.pierce--;
        // 관통 후 해당 적을 한동안 재타격 안 하도록 위치 보정
        s.x += s.vx*3; s.y += s.vy*3;
        continue;  // 이 파편은 다음 프레임에도 살아있음
      }

      // 분열 (shard_split Breakpoint)
      if((upLv('shard_split')||0) > 0 && s.generation < SHARD_MAX_GEN && !s.isOrb){
        for(let k=0;k<2;k++){
          createShard(s.x, s.y, Math.max(1, Math.floor(s.damage*0.5)), {
            direction: Math.random()*Math.PI*2,
            generation: s.generation + 1
          });
        }
      }

      // ks_shard_burst: 폭발 + 재파편
      if(hasKeystone('ks_shard_burst')){
        addShockwave(s.x, s.y, SHARD_COLOR_BURST, 60);
        // 반경 폭발
        const burstDmg = Math.max(1, Math.floor(s.damage*0.3));
        for(const e2 of G.enemies){
          if(e2.hp <= 0) continue;
          if(Math.hypot(e2.x-s.x, e2.y-s.y) < 60){
            damageEnemy(e2, burstDmg, null, null, true);
          }
        }
        // 재파편 3개
        for(let k=0;k<3;k++){
          createShard(s.x, s.y, Math.max(1,Math.floor(s.damage*0.3)), {
            direction: Math.random()*Math.PI*2,
            generation: Math.min(SHARD_MAX_GEN, s.generation+1)
          });
        }
      }

      // 파편 소멸
      G.shards.splice(i,1);
      continue;
    }

    // 공명 체크 (shard_resonance Breakpoint)
    if((upLv('shard_resonance')||0) > 0 && !s.isOrb){
      for(let j=i-1; j>=0; j--){
        const s2 = G.shards[j];
        if(s2.isOrb) continue;
        if(Math.abs(s2.x-s.x) > SHARD_RESONANCE_DIST) continue;
        const d = Math.hypot(s.x-s2.x, s.y-s2.y);
        if(d < SHARD_RESONANCE_DIST){
          // 융합 → 공명 구체
          const fx = (s.x+s2.x)/2, fy = (s.y+s2.y)/2;
          const fdmg = Math.ceil((s.damage + s2.damage) * 3.5);
          // 진행 방향은 두 파편 속도 합산
          const fvx = (s.vx + s2.vx)*0.5;
          const fvy = (s.vy + s2.vy)*0.5;
          const fdir = Math.atan2(fvy, fvx);
          createShard(fx, fy, fdmg, {isOrb:true, direction: fdir});
          addShockwave(fx, fy, SHARD_COLOR_ORB, 40);
          // 원본 두 파편 제거
          G.shards.splice(i,1);
          G.shards.splice(j,1);
          // i 보정 (j < i 이므로 하나 줄임)
          break;
        }
      }
    }
  }
}

// ================================================================
//  렌더링
// ================================================================
function renderShards(ctx){
  if(!G.shards || G.shards.length===0) return;

  for(const s of G.shards){
    const alpha = Math.min(1, s.life / s.maxLife);

    // 꼬리 (이전 위치 1프레임분)
    ctx.globalAlpha = alpha * 0.35;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x - s.vx*0.8, s.y - s.vy*0.8, s.size*0.7, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s.x - s.vx*1.6, s.y - s.vy*1.6, s.size*0.4, 0, Math.PI*2);
    ctx.fill();

    // 공명 구체: 외곽 글로우
    if(s.isOrb){
      ctx.globalAlpha = alpha * 0.5;
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size*2.4);
      g.addColorStop(0, s.color);
      g.addColorStop(0.5, s.color+'60');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size*2.4, 0, Math.PI*2);
      ctx.fill();
    }

    // 본체
    ctx.globalAlpha = alpha;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
    ctx.fill();

    // 중심 하이라이트 (흰색 하일라이트)
    ctx.globalAlpha = alpha * 0.8;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size*0.4, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ================================================================
//  디버그 헬퍼 (선택) — 콘솔에서 G.shards.length로 활성 수 확인
// ================================================================
function _shardDebugInfo(){
  if(!G.shards) return 'shards: 0';
  let orbs=0, gens=[0,0,0,0];
  for(const s of G.shards){
    if(s.isOrb) orbs++;
    gens[Math.min(3,s.generation)]++;
  }
  return `shards: ${G.shards.length} (orbs=${orbs}, gen=[${gens.join(',')}])`;
}
