// ================================================================
//  게임 루프
// ================================================================
const TICK=1/60;
let lastTime=0;

function gameLoop(ts){
  const dt=Math.min((ts-lastTime)/1000,0.1);
  lastTime=ts;

  update(dt);
  render();
  renderFx();
  renderBg();

  requestAnimationFrame(gameLoop);
}

function update(dt){
  if(G.hp<=0||G.skillSelecting||G.upgradeSelecting||G.paused)return;

  // rage: 광전사 스택 감소
  if(G.rageTimer>0){G.rageTimer-=dt;if(G.rageTimer<=0){G.rageStacks=0;G.rageTimer=0}}
  // combo: 콤보 타이머 감소
  if(G.comboTimer>0){G.comboTimer-=dt;if(G.comboTimer<=0){G.comboCount=0;G.comboTimer=0}}
  // emp: EMP 펄스
  if(upLv('emp')>0){
    G.empTimer+=dt;
    const empCd=Math.max(4,10-upLv('cooldown'));
    if(G.empTimer>=empCd){
      G.empTimer=0;
      const empDmg=Math.max(1,Math.floor(G.damage*upLv('emp')*0.3));
      G.enemies.forEach(e2=>{if(e2.hp>0)damageEnemy(e2,empDmg)});
      const sw=gameCanvas.width/dpr,sh=gameCanvas.height/dpr;
      addShockwave(sw/2,sh/2,'#44ccff',200);
      screenFlash();
    }
  }
  // auto_shield: 에너지 실드 충전
  if(upLv('auto_shield')>0){
    G.upgradeShieldTimer+=dt;
    const shieldCd=Math.max(3,12-upLv('auto_shield')-upLv('cooldown'));
    if(G.upgradeShieldTimer>=shieldCd&&!G.upgradeShieldActive){
      G.upgradeShieldActive=true;G.upgradeShieldTimer=0;
    }
  }

  // 실드 충전 (스킬)
  if(hasSkill('shield')){
    G.shieldTimer+=dt;
    if(G.shieldTimer>=10&&!G.shieldActive){G.shieldActive=true;G.shieldTimer=0}
  }
  // 정전기 필드
  if(hasSkill('static_field')){
    G.staticTimer+=dt;
    if(G.staticTimer>=1){
      G.staticTimer=0;
      const sw=gameCanvas.width/dpr,sh=gameCanvas.height/dpr;
      const scx=sw/2,scy=sh/2;
      G.enemies.forEach(e2=>{
        if(e2.hp>0&&Math.hypot(e2.x-scx,e2.y-scy)<100){
          damageEnemy(e2,Math.max(1,Math.floor(G.damage*0.3)));
          addSparks(e2.x,e2.y,2,'#44aaff');
        }
      });
    }
  }
  // 에너지 폭풍
  if(hasSkill('storm')){
    G.stormTimer+=dt;
    if(G.stormTimer>=8){
      G.stormTimer=0;
      const stormDmg=Math.max(1,Math.floor(G.damage*0.5));
      G.enemies.forEach(e2=>{
        if(e2.hp>0)damageEnemy(e2,stormDmg);
      });
      screenFlash();
      const sw=gameCanvas.width/dpr,sh=gameCanvas.height/dpr;
      addShockwave(sw/2,sh/2,evoColor(),200);
    }
  }

  // HP 재생 (hpRegen = hp업 레벨 + regen업 * 0.5)
  if(G.hpRegen>0||upLv('recover')>0){
    G.regenTimer+=dt;
    const regenInterval=hasSkill('regen_boost')?0.5:1;
    if(G.regenTimer>=regenInterval){
      G.regenTimer=0;
      let regenAmt=G.hpRegen;
      // recover: HP 30% 이하 시 추가 재생
      if(upLv('recover')>0&&G.hp<=G.maxHp*0.3) regenAmt+=upLv('recover')*2;
      // resilience: HP 50% 이하 시 재생 2배
      if(upLv('resilience')>0&&G.hp<=G.maxHp*0.5) regenAmt*=2;
      G.hp=Math.min(G.maxHp,G.hp+regenAmt);
    }
  }

  // 자동 공격
  if(G.autoRate>0){
    G.autoTimer+=dt;
    let autoSpeedMult=hasSkill('auto_boost')?1.5:1;
    if(upLv('rapid_fire')>0) autoSpeedMult*=(1+upLv('rapid_fire')*0.2);
    // freezer debuff: 프리저가 코어 근처에 있으면 자동공격 감속
    let freezerSlow=1;
    const _fw=gameCanvas.width/dpr,_fh=gameCanvas.height/dpr;
    const _fcx=_fw/2,_fcy=_fh/2;
    G.enemies.forEach(fe=>{
      if(fe.hp>0&&fe.pattern==='freezer'){
        const fd=Math.hypot(fe.x-_fcx,fe.y-_fcy);
        if(fd<150) freezerSlow=Math.min(freezerSlow,0.4);
        else if(fd<250) freezerSlow=Math.min(freezerSlow,0.7);
      }
    });
    const interval=1/(G.autoRate*autoSpeedMult*freezerSlow);
    if(G.autoTimer>=interval){
      G.autoTimer-=interval;
      autoAttack();
    }
  }

  // 웨이브 상태 머신
  if(G.waveState==='ready'){
    G.waveTimer+=dt;
    if(G.waveTimer>=2){
      startWave();
    }
  }else if(G.waveState==='active'){
    const wc=getWaveConfig(G.wave);
    // 적 스폰
    if(G.enemiesSpawned<G.enemiesToSpawn){
      G.spawnTimer+=dt;
      const spawnInterval=Math.max(0.12,0.55-G.wave*0.025);
      if(G.spawnTimer>=spawnInterval){
        G.spawnTimer=0;
        spawnEnemy();
      }
    }
    // 적 이동 + 충돌
    const w=gameCanvas.width/dpr,h=gameCanvas.height/dpr;
    const cx=w/2,cy=h/2;

    for(let i=G.enemies.length-1;i>=0;i--){
      const e=G.enemies[i];
      if(e.hp<=0){G.enemies.splice(i,1);continue}

      // 패턴별 이동
      const angle=Math.atan2(cy-e.y,cx-e.x);
      const dist0=Math.hypot(e.x-cx,e.y-cy);

      if(e.pattern==='zigzag'){
        e.zigTimer++;
        const perp=angle+Math.PI/2;
        const zig=Math.sin(e.zigTimer*0.08)*2.5;
        e.vx=Math.cos(angle)*e.speed+Math.cos(perp)*zig;
        e.vy=Math.sin(angle)*e.speed+Math.sin(perp)*zig;
      }else if(e.pattern==='spiral'){
        const tangent=angle+Math.PI/2*e.spiralDir;
        e.vx=Math.cos(tangent)*e.speed*0.7+Math.cos(angle)*e.speed*0.35;
        e.vy=Math.sin(tangent)*e.speed*0.7+Math.sin(angle)*e.speed*0.35;
      }else if(e.pattern==='charger'){
        if(!e.charging&&dist0<150){
          e.charging=true;e.chargeTimer=50;e.chargeAngle=angle;
        }
        if(e.charging){
          if(e.chargeTimer>0){e.chargeTimer--;e.vx*=0.85;e.vy*=0.85}
          else{e.vx=Math.cos(e.chargeAngle)*e.speed*5;e.vy=Math.sin(e.chargeAngle)*e.speed*5}
        }else{
          e.vx=Math.cos(angle)*e.speed*0.5;
          e.vy=Math.sin(angle)*e.speed*0.5;
        }
      }else if(e.pattern==='dodger'){
        // 회피형: 일반 이동 + 주기적으로 순간이동
        e.dodgeTimer+=dt;
        if(e.dodgeTimer>=2.5&&e.dodgeCooldown<=0){
          e.dodgeTimer=0;e.dodgeCooldown=1;
          const da=Math.random()*Math.PI*2;
          const dd=30+Math.random()*40;
          e.x+=Math.cos(da)*dd;e.y+=Math.sin(da)*dd;
          addSparks(e.x,e.y,4,'#ffdd22');
        }
        if(e.dodgeCooldown>0)e.dodgeCooldown-=dt;
        e.vx=Math.cos(angle)*e.speed;
        e.vy=Math.sin(angle)*e.speed;
      }else if(e.pattern==='bomber'){
        // 폭탄형: 코어를 향해 직진 (느리지만 꾸준히)
        e.vx=Math.cos(angle)*e.speed;
        e.vy=Math.sin(angle)*e.speed;
      }else if(e.pattern==='healer'){
        // 치유형: 느리게 접근, 주변 적 체력 회복
        e.healTimer+=dt;
        if(e.healTimer>=2){
          e.healTimer=0;
          G.enemies.forEach(e2=>{
            if(e2!==e&&e2.hp>0&&e2.hp<e2.maxHp&&Math.hypot(e2.x-e.x,e2.y-e.y)<80){
              e2.hp=Math.min(e2.maxHp,e2.hp+Math.ceil(e2.maxHp*0.1));
              addSparks(e2.x,e2.y,2,'#44ffaa');
            }
          });
          addShockwave(e.x,e.y,'#44ffaa',50);
        }
        e.vx=Math.cos(angle)*e.speed;
        e.vy=Math.sin(angle)*e.speed;
      }else if(e.pattern==='phaser'){
        e.phaseTimer+=dt;
        if(e.phaseTimer>=3){e.phaseTimer=0;e.phased=!e.phased}
        e.vx=Math.cos(angle)*e.speed;
        e.vy=Math.sin(angle)*e.speed;
      }else if(e.pattern==='teleporter'){
        e.teleportTimer+=dt;
        if(e.teleportTimer>=2.5){
          e.teleportTimer=0;
          const ta=Math.random()*Math.PI*2,td=40+Math.random()*60;
          addSparks(e.x,e.y,4,'#22ddff');
          e.x=Math.max(0,Math.min(w,e.x+Math.cos(ta)*td));
          e.y=Math.max(0,Math.min(h,e.y+Math.sin(ta)*td));
          addSparks(e.x,e.y,4,'#22ddff');
        }
        e.vx=Math.cos(angle)*e.speed;e.vy=Math.sin(angle)*e.speed;
      }else if(e.pattern==='shield_bearer'){
        e.vx=Math.cos(angle)*e.speed;e.vy=Math.sin(angle)*e.speed;
      }else if(e.pattern==='comet'){
        if(!e.cometPassed){
          if(dist0<40) e.cometPassed=true;
        }
        if(e.cometPassed&&(e.x<-60||e.x>w+60||e.y<-60||e.y>h+60)){
          e.hp=0;G.enemies.splice(i,1);G.enemiesKilled++;continue;
        }
      }else if(e.pattern==='pulse'){
        e.pulseTimer+=dt;
        if(dist0>140){e.vx=Math.cos(angle)*e.speed;e.vy=Math.sin(angle)*e.speed}
        else if(dist0<100){e.vx=-Math.cos(angle)*e.speed*0.5;e.vy=-Math.sin(angle)*e.speed*0.5}
        else{const tg=angle+Math.PI/2;e.vx=Math.cos(tg)*e.speed*0.5;e.vy=Math.sin(tg)*e.speed*0.5}
        if(e.pulseTimer>=3){
          e.pulseTimer=0;
          G.bossProjectiles.push({x:e.x,y:e.y,vx:Math.cos(angle)*2,vy:Math.sin(angle)*2,size:4,damage:2+Math.floor(G.wave/5),trail:[]});
          addSparks(e.x,e.y,3,'#ff44aa');addShockwave(e.x,e.y,'#ff44aa',30);
        }
      }else if(e.pattern==='swarm_mother'){
        e.motherTimer+=dt;
        if(e.motherTimer>=4){
          e.motherTimer=0;
          for(let sc=0;sc<2;sc++){
            const sa2=Math.random()*Math.PI*2;
            const cv2=5+Math.floor(Math.random()*3);const cs2=[];
            for(let v2=0;v2<cv2;v2++)cs2.push(0.65+Math.random()*0.45);
            G.enemies.push({
              x:e.x+Math.cos(sa2)*20,y:e.y+Math.sin(sa2)*20,
              hp:Math.ceil(e.maxHp*0.15),maxHp:Math.ceil(e.maxHp*0.15),
              speed:e.speed*2.5,size:e.size*0.4,reward:Math.ceil(e.reward*0.2),
              vx:Math.cos(sa2)*2,vy:Math.sin(sa2)*2,
              isBoss:false,isElite:false,pattern:'normal',isSplitChild:true,
              flash:0,color:'#aaee66',glowColor:'#88dd44',
              wobble:Math.random()*Math.PI*2,shape:cs2,vertices:cv2,
              rot:Math.random()*Math.PI*2,rotSpeed:(Math.random()-.5)*0.03,
              attackTimer:0,charging:false,chargeTimer:0,chargeAngle:0,
              zigTimer:0,spiralDir:1,dodgeTimer:0,dodgeCooldown:0,
              phaseTimer:0,phased:false,healTimer:0,teleportTimer:0,
              shieldHp:0,maxShieldHp:0,cometPassed:false,pulseTimer:0,
              motherTimer:0,mirrorCount:0,absorbCount:0,orbitAngle:0,orbitRadius:0
            });
          }
          G.enemiesToSpawn+=2;
          addShockwave(e.x,e.y,'#88dd44',40);
        }
        e.vx=Math.cos(angle)*e.speed;e.vy=Math.sin(angle)*e.speed;
      }else if(e.pattern==='freezer'){
        e.vx=Math.cos(angle)*e.speed;e.vy=Math.sin(angle)*e.speed;
      }else if(e.pattern==='mirror'||e.pattern==='absorber'){
        e.vx=Math.cos(angle)*e.speed;e.vy=Math.sin(angle)*e.speed;
      }else if(e.pattern==='orbiter'){
        e.orbitAngle+=e.speed*0.02;
        e.orbitRadius=Math.max(25,e.orbitRadius-0.15);
        e.x=cx+Math.cos(e.orbitAngle)*e.orbitRadius;
        e.y=cy+Math.sin(e.orbitAngle)*e.orbitRadius;
        e.vx=0;e.vy=0;
      }else if(e.pattern==='titan'){
        e.vx=Math.cos(angle)*e.speed;e.vy=Math.sin(angle)*e.speed;
      }else{
        e.vx=Math.cos(angle)*e.speed;
        e.vy=Math.sin(angle)*e.speed;
      }
      // gravity: 코어 근처 감속
      if(hasSkill('gravity')&&dist0<120){
        const gf=0.5+0.5*(dist0/120);
        e.vx*=gf;e.vy*=gf;
      }
      // 화면 밖 적: 최소 속도 보장 (빠르게 화면 진입)
      if(!e.isBoss&&(e.x<0||e.x>w||e.y<0||e.y>h)){
        const spd=Math.hypot(e.vx,e.vy);
        if(spd>0&&spd<1.2){e.vx*=1.2/spd;e.vy*=1.2/spd}
      }
      e.x+=e.vx;e.y+=e.vy;

      // 코어 충돌
      const dist=Math.hypot(e.x-cx,e.y-cy);
      if(dist<30+e.size){
        let dmg=e.isBoss?8+Math.floor(G.wave*0.5):3+Math.floor(G.wave/2);
        if(upLv('barrier')>0) dmg=Math.max(1,dmg-upLv('barrier'));
        // titan_guard: 고정 피해 감소
        if(upLv('titan_guard')>0) dmg=Math.max(1,dmg-upLv('titan_guard')*2);
        // shield_wall: 퍼센트 피해 감소
        if(upLv('shield_wall')>0) dmg=Math.max(1,Math.ceil(dmg*(1-upLv('shield_wall')*0.08)));
        // iron_core: 퍼센트 피해 감소
        if(upLv('iron_core')>0) dmg=Math.max(1,Math.ceil(dmg*(1-upLv('iron_core')*0.05)));
        // energy_shield: 에너지 100 이상 시 피해 감소
        if(upLv('energy_shield')>0&&G.energy>=100) dmg=Math.max(1,Math.ceil(dmg*(1-upLv('energy_shield')*0.15)));
        // dodge: 15% 회피 (스킬) + dodge_up 업그레이드
        const totalDodge=(hasSkill('dodge')?0.15:0)+upLv('dodge_up')*0.03;
        if(totalDodge>0&&Math.random()<totalDodge){
          showFloatText(cx,cy-20,'회피!','chain');
          addSparks(cx,cy,4,'#44ddff');
          sfx.hit();
        }else if(G.upgradeShieldActive){
          G.upgradeShieldActive=false;G.upgradeShieldTimer=0;
          showFloatText(cx,cy-20,'실드!','chain');
          addShockwave(cx,cy,'#6644ff',80);
          sfx.hit();
        }else if(G.shieldActive){
          G.shieldActive=false;G.shieldTimer=0;
          showFloatText(cx,cy-20,'실드!','chain');
          addShockwave(cx,cy,'#4488ff',80);
          sfx.hit();
        }else{
          G.hp-=dmg;
          sfx.hit();
          screenShake(true);
          showFloatText(cx,cy-20,'-'+dmg,'critical');
          // absorb: 피해의 30%를 에너지로 (스킬)
          if(hasSkill('absorb')){
            const absorbed=Math.ceil(dmg*0.3);
            G.energy+=absorbed;G.totalEnergy+=absorbed;
            showFloatText(cx,cy-35,'+'+absorbed,'energy-gain');
          }
          // absorption: 업그레이드 에너지 변환
          if(upLv('absorption')>0){
            const abAmt=Math.ceil(dmg*upLv('absorption')*0.05);
            G.energy+=abAmt;G.totalEnergy+=abAmt;
            showFloatText(cx,cy-45,'+'+abAmt,'energy-gain');
          }
        }
        // thorns: 반사 번개 (스킬)
        if(hasSkill('thorns')){
          const thornTargets=G.enemies.filter(e2=>e2!==e&&e2.hp>0);
          if(thornTargets.length>0){
            thornTargets.sort((a,b)=>Math.hypot(a.x-cx,a.y-cy)-Math.hypot(b.x-cx,b.y-cy));
            const tt=thornTargets[0];
            const thornDmg=Math.max(1,Math.floor(G.damage*0.5));
            zapBolts.push(createZapBolt(cx,cy,tt.x,tt.y));
            damageEnemy(tt,thornDmg);
            addSparks(tt.x,tt.y,3,'#ff44ff');
          }
        }
        // thorns_up: 업그레이드 반사
        if(upLv('thorns_up')>0){
          const thornTargets2=G.enemies.filter(e2=>e2!==e&&e2.hp>0);
          if(thornTargets2.length>0){
            thornTargets2.sort((a,b)=>Math.hypot(a.x-cx,a.y-cy)-Math.hypot(b.x-cx,b.y-cy));
            const tt2=thornTargets2[0];
            const tDmg=Math.max(1,Math.floor(G.damage*upLv('thorns_up')*0.2));
            zapBolts.push(createZapBolt(cx,cy,tt2.x,tt2.y));
            damageEnemy(tt2,tDmg);
            addSparks(tt2.x,tt2.y,2,'#aa44ff');
          }
        }

        addExplosion(e.x,e.y,8,e.color);
        G.enemies.splice(i,1);
        G.enemiesKilled++;

        if(G.hp<=0){
          G.hp=0;
          gameOver();
          return;
        }
      }
    }

    // venom: 독 데미지 틱
    if(hasSkill('venom')){
      G.enemies.forEach(ve=>{
        if(ve.poisonTimer>0&&ve.hp>0){
          ve.poisonTimer-=dt;
          ve.poisonTick=(ve.poisonTick||0)+dt;
          if(ve.poisonTick>=0.5){
            ve.poisonTick=0;
            damageEnemy(ve,ve.poisonDmg||1);
            addSparks(ve.x,ve.y,1,'#44ff00');
          }
        }
      });
    }
    // mark: 타이머 감소
    G.enemies.forEach(me=>{
      if(me.markTimer>0) me.markTimer-=dt;
    });

    // 보스 압박 - 가까워지면 지진파 (투사체 대신)
    G.enemies.forEach(e=>{
      if(e.isBoss&&e.hp>0){
        e.attackTimer=(e.attackTimer||0)+dt;
        const bossDist=Math.hypot(e.x-cx,e.y-cy);
        // 일정 간격으로 충격파 (가까울수록 자주)
        const interval=bossDist<150?2:bossDist<300?3.5:5;
        if(e.attackTimer>=interval){
          e.attackTimer=0;
          // 충격파: 가까울수록 데미지 높음
          let quakeDmg=bossDist<100?Math.floor(3+G.wave*0.3):Math.floor(1+G.wave*0.15);
          if(upLv('barrier')>0) quakeDmg=Math.max(1,quakeDmg-upLv('barrier'));
          if(upLv('titan_guard')>0) quakeDmg=Math.max(1,quakeDmg-upLv('titan_guard')*2);
          if(upLv('shield_wall')>0) quakeDmg=Math.max(1,Math.ceil(quakeDmg*(1-upLv('shield_wall')*0.08)));
          if(upLv('iron_core')>0) quakeDmg=Math.max(1,Math.ceil(quakeDmg*(1-upLv('iron_core')*0.05)));
          if(upLv('energy_shield')>0&&G.energy>=100) quakeDmg=Math.max(1,Math.ceil(quakeDmg*(1-upLv('energy_shield')*0.15)));
          if(bossDist<250){
            const _bDodge=(hasSkill('dodge')?0.15:0)+upLv('dodge_up')*0.03;
            if(_bDodge>0&&Math.random()<_bDodge){
              showFloatText(cx,cy-20,'회피!','chain');
            }else if(G.upgradeShieldActive){
              G.upgradeShieldActive=false;G.upgradeShieldTimer=0;
              showFloatText(cx,cy-20,'실드!','chain');
              addShockwave(cx,cy,'#6644ff',80);
            }else if(G.shieldActive){
              G.shieldActive=false;G.shieldTimer=0;
              showFloatText(cx,cy-20,'실드!','chain');
              addShockwave(cx,cy,'#4488ff',80);
            }else{
              G.hp-=quakeDmg;
              showFloatText(cx,cy-20,'-'+quakeDmg,'critical');
              screenShake(true);
              if(G.hp<=0){G.hp=0;gameOver();return}
            }
          }
          addShockwave(e.x,e.y,'#ff4400',bossDist<200?120:80);
          addSparks(e.x,e.y,6,'#ff6622');
        }
      }
    });
    // 보스 투사체 업데이트
    for(let i=G.bossProjectiles.length-1;i>=0;i--){
      const p=G.bossProjectiles[i];
      p.x+=p.vx;p.y+=p.vy;
      p.trail.push({x:p.x,y:p.y});
      if(p.trail.length>6)p.trail.shift();
      const pd=Math.hypot(p.x-cx,p.y-cy);
      if(pd<30){
        const _pDodge=(hasSkill('dodge')?0.15:0)+upLv('dodge_up')*0.03;
        if(_pDodge>0&&Math.random()<_pDodge){
          showFloatText(cx,cy-20,'회피!','chain');
          addSparks(cx,cy,3,'#44ddff');
        }else if(G.upgradeShieldActive){
          G.upgradeShieldActive=false;G.upgradeShieldTimer=0;
          showFloatText(cx,cy-20,'실드!','chain');
          addShockwave(cx,cy,'#6644ff',60);
        }else if(G.shieldActive){
          G.shieldActive=false;G.shieldTimer=0;
          showFloatText(cx,cy-20,'실드!','chain');
          addShockwave(cx,cy,'#4488ff',60);
        }else{
          let pDmg=Math.max(1,p.damage-upLv('barrier'));
          if(upLv('titan_guard')>0) pDmg=Math.max(1,pDmg-upLv('titan_guard')*2);
          if(upLv('shield_wall')>0) pDmg=Math.max(1,Math.ceil(pDmg*(1-upLv('shield_wall')*0.08)));
          if(upLv('iron_core')>0) pDmg=Math.max(1,Math.ceil(pDmg*(1-upLv('iron_core')*0.05)));
          if(upLv('energy_shield')>0&&G.energy>=100) pDmg=Math.max(1,Math.ceil(pDmg*(1-upLv('energy_shield')*0.15)));
          G.hp-=pDmg;
          screenShake(true);
          showFloatText(cx,cy-20,'-'+pDmg,'critical');
          if(hasSkill('absorb')){
            const absorbed=Math.ceil(pDmg*0.3);
            G.energy+=absorbed;G.totalEnergy+=absorbed;
            showFloatText(cx,cy-35,'+'+absorbed,'energy-gain');
          }
          if(upLv('absorption')>0){
            const abAmt=Math.ceil(pDmg*upLv('absorption')*0.05);
            G.energy+=abAmt;G.totalEnergy+=abAmt;
          }
        }
        sfx.hit();
        addExplosion(p.x,p.y,6,'#ff4422');
        G.bossProjectiles.splice(i,1);
        if(G.hp<=0){G.hp=0;gameOver();return}
      }else if(p.x<-50||p.x>w+50||p.y<-50||p.y>h+50){
        G.bossProjectiles.splice(i,1);
      }
    }

    // 웨이브 클리어 체크
    if(G.enemiesKilled>=G.enemiesToSpawn&&G.enemies.filter(e=>e.hp>0).length===0){
      waveClear();
    }
  }

  updateUI();
}

function startWave(){
  G.currentWaveType=getWaveType(G.wave);
  const wc=getWaveConfig(G.wave);
  G.waveState='active';
  G.enemies=[];
  G.enemiesSpawned=0;
  G.enemiesKilled=0;
  G.enemiesToSpawn=wc.count;
  G.spawnTimer=0;
  G.bossProjectiles=[];

  if(wc.isBoss){
    sfx.bossAlert();
    showWavePopup('⚠ BOSS WAVE '+G.wave);
    const bw=gameCanvas.width/dpr,bh=gameCanvas.height/dpr;
    screenShake(true);
    addShockwave(bw/2,bh/2,'#ff2244',200);
    addShockwave(bw/2,bh/2,'#ff6622',140);
    screenFlash('big');
    for(let i=0;i<20;i++){
      const a=Math.random()*Math.PI*2;
      const r=40+Math.random()*70;
      addSparks(bw/2+Math.cos(a)*r,bh/2+Math.sin(a)*r,3,'#ff4422');
    }
  }else{
    sfx.waveStart();
    const WAVE_NAMES={swarm:'떼거지',elite:'정예',rush:'돌격',fortress:'요새',mixed:'혼합',chaos:'혼돈',nightmare:'악몽',normal:''};
    const label=WAVE_NAMES[wc.waveType]||'';
    showWavePopup('WAVE '+G.wave+(label?' ['+label+']':''));
  }
}

function waveClear(){
  G.waveState='ready';
  G.waveTimer=0;
  G.currentWaveType='normal';
  // wave_bonus: 승전 보상 (스킬)
  if(hasSkill('wave_bonus')){
    const bonus=Math.floor(5+G.wave*3);
    G.energy+=bonus;G.totalEnergy+=bonus;
    const bw=gameCanvas.width/dpr,bh=gameCanvas.height/dpr;
    showFloatText(bw/2,bh/2-40,'+'+bonus+' 보너스','energy-gain');
  }
  // wave_heal: 웨이브 클리어 시 HP 회복
  if(upLv('wave_heal')>0){
    const healAmt=upLv('wave_heal')*10;
    G.hp=Math.min(G.maxHp,G.hp+healAmt);
    const bw2=gameCanvas.width/dpr,bh2=gameCanvas.height/dpr;
    showFloatText(bw2/2,bh2/2-70,'+'+healAmt+' HP','energy-gain');
  }
  // victory: 승전 보상 (업그레이드)
  if(upLv('victory')>0){
    const vBonus=upLv('victory')*15;
    G.energy+=vBonus;G.totalEnergy+=vBonus;
    const bw=gameCanvas.width/dpr,bh=gameCanvas.height/dpr;
    showFloatText(bw/2,bh/2-55,'+'+vBonus+' 승전','energy-gain');
  }
  // 업그레이드 선택 (홀수 웨이브 클리어 시)
  const shouldSelect=G.wave%2===1||G.wave===1;
  G.wave++;
  G.bossProjectiles=[];
  sfx.waveClear();
  showWavePopup('WAVE CLEAR!');
  checkEvolution();
  saveGame();
  // 업그레이드 선택 팝업 (웨이브 증가 후)
  if(shouldSelect){
    const available=UPGRADE_POOL.filter(u=>!G.unlockedUpgrades.includes(u.id)&&u.unlockWave<=G.wave);
    if(available.length>0) setTimeout(()=>showUpgradeSelection(),800);
  }
}

function gameOver(){
  // rebirth: 부활 (전투당 1회)
  if(upLv('rebirth')>0&&!G.rebirthUsed){
    G.rebirthUsed=true;
    G.hp=Math.ceil(G.maxHp*upLv('rebirth')*0.2);
    const bw=gameCanvas.width/dpr,bh=gameCanvas.height/dpr;
    showFloatText(bw/2,bh/2-30,'REBIRTH!','chain');
    addShockwave(bw/2,bh/2,'#ffdd00',200);
    addShockwave(bw/2,bh/2,'#ff8800',140);
    screenFlash('big');
    sfx.waveClear();
    return;
  }
  sfx.gameOver();
  screenFlash('big');

  const evo=EVOLUTIONS[G.evolutionStage];
  // 호칭
  document.getElementById('go-evo-name').textContent=evo.name;
  document.getElementById('go-evo-name').style.color=evo.color;
  // 핵심 스탯
  document.getElementById('go-wave').textContent=G.wave;
  document.getElementById('go-kills').textContent=formatNum(G.totalKills);
  document.getElementById('go-energy').textContent=formatNum(G.totalEnergy);
  document.getElementById('go-evo-stage').textContent=`Lv.${G.evolutionStage+1}`;
  document.getElementById('go-dmg').textContent=G.damage;
  document.getElementById('go-auto').textContent=G.autoRate.toFixed(1);
  // 업그레이드 상세
  const upgEl=document.getElementById('go-upgrade-detail');
  upgEl.innerHTML='';
  G.unlockedUpgrades.forEach(id=>{
    const lv=upLv(id);
    if(lv===0)return;
    const data=getUpgradeData(id);
    if(!data)return;
    const d=document.createElement('div');d.className='go-upg-item';
    d.innerHTML=`<span class="go-upg-name">${data.icon} ${data.name}</span><span class="go-upg-lv">Lv.${lv}</span>`;
    upgEl.appendChild(d);
  });
  // 획득 스킬
  const skillEl=document.getElementById('go-skill-list');
  skillEl.innerHTML='';
  if(G.specialSkills.length===0){
    skillEl.innerHTML='<span style="font-size:.7em;color:rgba(255,255,255,.3)">없음</span>';
  }else{
    G.specialSkills.forEach(id=>{
      const sk=SKILL_POOL.find(s=>s.id===id);
      if(!sk)return;
      const tag=document.createElement('span');tag.className='go-skill-tag';
      tag.textContent=sk.icon+' '+sk.name;
      tag.title=sk.desc;
      skillEl.appendChild(tag);
    });
  }

  // 닉네임 입력 초기화
  const nickInput=document.getElementById('go-nickname');
  const saveBtn=document.getElementById('go-save-rank');
  const savedMsg=document.getElementById('go-rank-saved');
  nickInput.value='';
  nickInput.disabled=false;
  saveBtn.disabled=false;
  savedMsg.style.display='none';

  document.getElementById('game-over').classList.add('show');
  setTimeout(()=>nickInput.focus(),400);
}

function togglePause(){
  if(G.hp<=0)return;// 게임오버 상태에서는 무시
  G.paused=!G.paused;
  document.getElementById('pause-popup').classList.toggle('show',G.paused);
}

function resetGame(){
  // 모든 팝업 강제 닫기
  ['pause-popup','game-over','skill-popup','upgrade-popup','evolution-popup','ranking-popup'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.classList.remove('show');
  });
  // 모든 블로킹 상태 해제
  G.paused=false;
  G.skillSelecting=false;
  G.upgradeSelecting=false;
  // 게임 상태 초기화
  G.energy=0;G.totalEnergy=0;G.kills=0;G.totalKills=0;
  G.hp=100;G.maxHp=100;G.hpRegen=0;
  G.damage=1;G.autoRate=0;G.chainCount=0;
  G.specialSkills=[];G.shieldActive=false;G.shieldTimer=0;G.stormTimer=0;G.staticTimer=0;
  G.wave=1;G.waveState='ready';G.waveTimer=0;G.currentWaveType='normal';
  G.enemies=[];G.enemiesSpawned=0;G.enemiesToSpawn=0;G.enemiesKilled=0;
  G.autoTimer=0;G.regenTimer=0;G.evolutionStage=0;
  // 업그레이드 초기화
  G.unlockedUpgrades=['damage'];
  G.upgrades={damage:{level:0}};
  G.rageStacks=0;G.rageTimer=0;G.comboCount=0;G.comboTimer=0;
  G.upgradeShieldActive=false;G.upgradeShieldTimer=0;G.empTimer=0;
  G.rebirthUsed=false;
  zapBolts=[];fxEffects=[];G.bossProjectiles=[];G.orbitals=[];
  // 화면 흔들림 제거
  const gameArea=document.getElementById('game-area');
  if(gameArea)gameArea.style.transform='';
  localStorage.removeItem('lightningGame2');
  rebuildUpgradeGrid();
  updateSkillDisplay();
  updateUI();
}
// 콘솔에서 강제 리셋: forceReset()
window.forceReset=function(){
  localStorage.removeItem('lightningGame2');
  location.reload();
};

// ================================================================
//  클릭 처리
// ================================================================
function handleClick(px,py){
  sfx.init();sfx.resume();
  if(G.hp<=0||G.skillSelecting||G.upgradeSelecting)return;

  const now=Date.now();
  const baseCd=hasSkill('quickcharge')?90:150;
  const cd=Math.max(50,baseCd-upLv('quick')*8);
  if(now-G.lastClickTime<cd)return;
  G.lastClickTime=now;

  // 근접 타게팅: 커서 원 범위 내 가장 가까운 적 자동 선택
  const rangeBonus=upLv('range')*5+upLv('bolt_size')*10+upLv('field_expand')*8;
  const clickBonus=hasSkill('aoe_click')?1.6:1;
  const CLICK_RADIUS=(BASE_CLICK_RADIUS+rangeBonus)*clickBonus;
  let hit=null;
  let minDist=Infinity;
  G.enemies.forEach(e=>{
    if(e.hp<=0)return;
    const d=Math.hypot(e.x-px,e.y-py);
    if(d<CLICK_RADIUS&&d<minDist){minDist=d;hit=e}
  });

  let hitProj=-1;
  if(!hit){
    for(let i=0;i<G.bossProjectiles.length;i++){
      const p=G.bossProjectiles[i];
      if(Math.hypot(p.x-px,p.y-py)<p.size+15){hitProj=i;break}
    }
  }

  if(hit){
    strikeEnemy(hit,true);
    if(hasSkill('multishot')){
      const nearby=G.enemies.filter(e=>e!==hit&&e.hp>0)
        .sort((a,b)=>Math.hypot(a.x-hit.x,a.y-hit.y)-Math.hypot(b.x-hit.x,b.y-hit.y));
      for(let m=0;m<Math.min(2,nearby.length);m++){
        if(Math.hypot(nearby[m].x-hit.x,nearby[m].y-hit.y)<150){
          const mdmg=Math.max(1,Math.floor(G.damage*0.4));
          zapBolts.push(createZapBolt(hit.x,hit.y,nearby[m].x,nearby[m].y));
          damageEnemy(nearby[m],mdmg);
          addSparks(nearby[m].x,nearby[m].y,3,'#ffee00');
        }
      }
    }
    if(hasSkill('pierce')){
      const w2=gameCanvas.width/dpr,h2=gameCanvas.height/dpr;
      const cx2=w2/2,cy2=h2/2;
      const hitAngle=Math.atan2(hit.y-cy2,hit.x-cx2);
      const behind=G.enemies.filter(e=>e!==hit&&e.hp>0)
        .filter(e=>{const ea=Math.atan2(e.y-cy2,e.x-cx2);return Math.abs(ea-hitAngle)<0.5})
        .sort((a,b)=>Math.hypot(a.x-cx2,a.y-cy2)-Math.hypot(b.x-cx2,b.y-cy2));
      if(behind.length>0){
        const pdmg=Math.ceil(G.damage*0.5);
        zapBolts.push(createZapBolt(hit.x,hit.y,behind[0].x,behind[0].y));
        damageEnemy(behind[0],pdmg);
        addSparks(behind[0].x,behind[0].y,4,evoColor());
      }
    }
    // multi: 다중 낙뢰 업그레이드
    if(upLv('multi')>0){
      const multiTargets=G.enemies.filter(e=>e!==hit&&e.hp>0)
        .sort((a,b)=>Math.hypot(a.x-hit.x,a.y-hit.y)-Math.hypot(b.x-hit.x,b.y-hit.y));
      for(let m=0;m<Math.min(upLv('multi'),multiTargets.length);m++){
        if(Math.hypot(multiTargets[m].x-hit.x,multiTargets[m].y-hit.y)<120){
          const mDmg=Math.max(1,Math.floor(G.damage*0.5));
          zapBolts.push(createZapBolt(hit.x,hit.y,multiTargets[m].x,multiTargets[m].y));
          damageEnemy(multiTargets[m],mDmg);
          addSparks(multiTargets[m].x,multiTargets[m].y,3,evoColor());
        }
      }
    }
  }else if(hitProj>=0){
    const p=G.bossProjectiles[hitProj];
    addExplosion(p.x,p.y,8,'#ff8844');
    sfx.zap(0.5);
    G.bossProjectiles.splice(hitProj,1);
    showFloatText(px,py,'파괴!','chain');
  }else{
    const alive=G.enemies.filter(e=>e.hp>0);
    if(alive.length===0){
      G.energy+=1;G.totalEnergy+=1;
      sfx.zap(0.3);
      const w=gameCanvas.width/dpr,h=gameCanvas.height/dpr;
      addSparks(w/2,h/2,3,evoColor());
      showFloatText(px,py,'+1','energy-gain');
    }else{
      sfx.zap(0.1);
      addSparks(px,py,2,'#555555');
    }
  }

  const ev=document.getElementById('energy-value');
  ev.classList.remove('bump');void ev.offsetWidth;ev.classList.add('bump');
  updateUI();
}

// ================================================================
//  세이브/로드
// ================================================================
function saveGame(){
  try{
    const save={energy:G.energy,totalEnergy:G.totalEnergy,kills:G.kills,totalKills:G.totalKills,
      hp:G.hp,maxHp:G.maxHp,hpRegen:G.hpRegen,damage:G.damage,autoRate:G.autoRate,
      chainCount:G.chainCount,wave:G.wave,evolutionStage:G.evolutionStage,
      upgrades:G.upgrades,unlockedUpgrades:G.unlockedUpgrades,
      specialSkills:G.specialSkills,rebirthUsed:G.rebirthUsed};
    localStorage.setItem('lightningGame2',JSON.stringify(save));
  }catch(e){}
}

function loadGame(){
  try{
    const d=localStorage.getItem('lightningGame2');
    if(d){
      const s=JSON.parse(d);Object.assign(G,s);
      G.waveState='ready';G.waveTimer=0;G.enemies=[];G.enemiesSpawned=0;G.enemiesKilled=0;G.enemiesToSpawn=0;
      // 구세이브 마이그레이션 (unlockedUpgrades 없는 경우)
      if(!G.unlockedUpgrades){
        G.unlockedUpgrades=[];
        const oldKeys=['damage','auto','chain','hp','crit','range','quick','barrier','overload','harvest'];
        oldKeys.forEach(k=>{if(G.upgrades[k])G.unlockedUpgrades.push(k)});
        if(G.unlockedUpgrades.length===0)G.unlockedUpgrades=['damage'];
        // 구 형식에서 baseCost/mult 제거 (level만 유지)
        const cleaned={};
        G.unlockedUpgrades.forEach(k=>{cleaned[k]={level:G.upgrades[k]?G.upgrades[k].level:0}});
        G.upgrades=cleaned;
      }
      // 해금된 업그레이드 엔트리 보장
      G.unlockedUpgrades.forEach(id=>{if(!G.upgrades[id])G.upgrades[id]={level:0}});
      // 신규 상태 초기화
      G.upgradeSelecting=false;
      G.rageStacks=G.rageStacks||0;G.rageTimer=0;
      G.comboCount=G.comboCount||0;G.comboTimer=0;
      G.upgradeShieldActive=false;G.upgradeShieldTimer=0;
      G.empTimer=G.empTimer||0;
      G.rebirthUsed=G.rebirthUsed||false;
      recalcStats();
    }
  }catch(e){}
}

// ================================================================
//  이벤트
// ================================================================
function initEvents(){
  const area=document.getElementById('game-area');
  area.addEventListener('click',e=>{
    const r=area.getBoundingClientRect();
    handleClick(e.clientX-r.left,e.clientY-r.top);
  });
  // 마우스 위치 추적 (타게팅 원 표시용)
  area.addEventListener('mousemove',e=>{
    const r=area.getBoundingClientRect();
    mouseX=e.clientX-r.left;mouseY=e.clientY-r.top;
  });
  area.addEventListener('mouseleave',()=>{mouseX=-999;mouseY=-999});
  area.addEventListener('touchstart',e=>{
    e.preventDefault();
    const t=e.touches[0];const r=area.getBoundingClientRect();
    mouseX=t.clientX-r.left;mouseY=t.clientY-r.top;
    handleClick(mouseX,mouseY);
  },{passive:false});
  area.addEventListener('touchend',()=>{mouseX=-999;mouseY=-999});

  // 업그레이드 버튼은 rebuildUpgradeGrid에서 동적으로 이벤트 바인딩

  document.getElementById('sound-btn').addEventListener('click',e=>{
    e.stopPropagation();sfx.init();
    const on=sfx.toggle();
    document.getElementById('sound-btn').querySelector('.top-btn-icon').textContent=on?'🔊':'🔇';
    document.getElementById('sound-btn').classList.toggle('muted',!on);
  });

  document.getElementById('evo-ok').addEventListener('click',()=>{
    document.getElementById('evolution-popup').classList.remove('show');saveGame();
  });
  document.getElementById('evolution-popup').addEventListener('click',()=>{
    document.getElementById('evolution-popup').classList.remove('show');saveGame();
  });

  document.getElementById('go-retry').addEventListener('click',()=>resetGame());

  // 랭킹: 닉네임 저장
  document.getElementById('go-save-rank').addEventListener('click',()=>{
    const nick=document.getElementById('go-nickname').value.trim();
    if(!nick){document.getElementById('go-nickname').focus();return}
    addRankEntry(nick);
    document.getElementById('go-nickname').disabled=true;
    document.getElementById('go-save-rank').disabled=true;
    document.getElementById('go-rank-saved').style.display='block';
  });
  document.getElementById('go-nickname').addEventListener('keydown',e=>{
    if(e.key==='Enter'){
      e.preventDefault();
      document.getElementById('go-save-rank').click();
    }
  });

  // 랭킹: 게임오버에서 랭킹 보기
  document.getElementById('go-view-rank').addEventListener('click',()=>showRankingPopup());

  // 랭킹: 상단 버튼
  document.getElementById('ranking-btn').addEventListener('click',e=>{
    e.stopPropagation();
    if(!G.paused&&G.hp>0&&G.waveState!=='ready'){togglePause()}
    showRankingPopup();
  });

  // 랭킹: 탭 전환
  document.querySelectorAll('.rank-tab').forEach(tab=>{
    tab.addEventListener('click',()=>showRankingPopup(tab.dataset.sort));
  });

  // 랭킹: 닫기
  document.getElementById('ranking-close').addEventListener('click',()=>hideRankingPopup());

  // 랭킹: 기록 초기화
  document.getElementById('ranking-clear').addEventListener('click',()=>{
    if(confirm('모든 랭킹 기록을 삭제하시겠습니까?')){
      clearRanking();
      renderRanking('wave');
    }
  });

  document.getElementById('pause-btn').addEventListener('click',()=>togglePause());

  document.getElementById('pause-resume').addEventListener('click',()=>togglePause());
  document.getElementById('pause-reset').addEventListener('click',()=>{
    togglePause();
    resetGame();
  });

  window.addEventListener('keydown',(e)=>{
    if(e.key==='Escape'){
      if(document.getElementById('ranking-popup').classList.contains('show')){
        hideRankingPopup();return;
      }
      togglePause();
      return;
    }
    if(G.paused)return;
    // 스페이스바: 진화 팝업 닫기 또는 공격
    if(e.key===' '||e.code==='Space'){
      e.preventDefault();
      const evoPop=document.getElementById('evolution-popup');
      if(evoPop.classList.contains('show')){
        evoPop.classList.remove('show');saveGame();
        return;
      }
      sfx.init();sfx.resume();
      handleClick(mouseX>=0?mouseX:gameCanvas.width/dpr/2,mouseY>=0?mouseY:gameCanvas.height/dpr/2);
      return;
    }
    // 동적 핫키: 1~9,0 → unlockedUpgrades 순서
    const num=parseInt(e.key);
    if(!isNaN(num)){
      const idx=num===0?9:num-1;
      if(idx<G.unlockedUpgrades.length){
        const type=G.unlockedUpgrades[idx];
        buyUpgrade(type);
        const btn=document.querySelector('.upgrade-btn[data-upgrade="'+type+'"]');
        if(btn){btn.classList.add('hotkey-flash');setTimeout(()=>btn.classList.remove('hotkey-flash'),150)}
      }
    }
  });

  window.addEventListener('resize',resize);
  document.addEventListener('click',()=>{sfx.init();sfx.resume()},{once:true});
}

// ================================================================
//  시작
// ================================================================
function init(){
  loadGame();
  recalcStats();
  rebuildUpgradeGrid();
  resize();
  initEvents();
  initOrbitals();
  updateSkillDisplay();
  updateUI();
  // 브라우저 닫을 때 세이브 삭제 (항상 처음부터 시작)
  window.addEventListener('beforeunload',()=>{localStorage.removeItem('lightningGame2')});
  setInterval(saveGame,30000);
  requestAnimationFrame(gameLoop);
}
init();
