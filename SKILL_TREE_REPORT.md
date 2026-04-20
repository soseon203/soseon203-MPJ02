# 게임 스킬/테크 트리 상세 보고서 (v3 — 대규모 개편 반영판)

> 작성: 2026-04-20
> 소스 브랜치: `claude/keen-kare` (대규모 개편 브랜치)
> 핵심 추출 파일: [js/config.js](js/config.js), [js/tree.js](js/tree.js), [js/game.js](js/game.js), [js/main.js](js/main.js), [js/ui.js](js/ui.js)

## 🔥 v2 → v3 주요 변경 요약

| 영역 | v2 | v3 (대규모 개편) |
|---|---|---|
| **자원** | 에너지 (처치 → 에너지 → 업그레이드 구매) | **XP → 레벨업 → 스킬포인트(SP)** — 에너지 시스템 완전 제거 |
| **업그레이드 구조** | 60종 평면 리스트, 웨이브 해금 | **3-Tree WoW 스타일 스킬트리** (65 노드, Tier 1~7) |
| **해금 방식** | 웨이브 클리어마다 4택1 랜덤 | **Tier Gate (하위 포인트 합)** + **Prereq (선행 노드 랭크 절반)** |
| **특수 스킬** | 진화 단계마다 4택1 | **보스 처치** 시 4택1 (SKILL_POOL 30종 유지) |
| **최종 티어** | T6 업그레이드 | **T7 Keystone** (7개, 상호 배타 + 극적 트레이드오프) |
| **메타 프로그레션** | 없음 | **RP / 메타 업그레이드 / 업적** (영구 저장) |
| **난이도** | 단일 | **4단계** (쉬움/보통/어려움/악몽) |
| **시그니처 빌드** | 없음 | **bloodlust, storm_eye, magnet_pull, 7 keystone** |
| **밸런스** | - | additive → 일부 계수 너프 (crit_dmg 0.25→0.15, overload 8→6%, execute 50→20%, weak_point 15→10%, precision 구조 변경) |

---

## 1. 전체 시스템 개요

```
[적 처치] ──► XP 획득 ──► 레벨업 ──► 스킬포인트(SP) +1
                                          │
                                          ▼
                           [스킬 트리 3 Tree — 65 노드]
                               │              │            │
                     🗡️ 낙뢰(atk)   🌩️ 폭풍(def)   🔋 전격(util)
                          22 노드        22 노드        21 노드
                               └──── T7 Keystone ────┘
                                  (2+3+3 = 7개, 빌드당 1개)

[보스 처치] ──► SKILL_POOL 4택1 (특수 스킬 30종)

[런 종료] ──► RP 획득 (웨이브/5 + 처치/50 + 레벨/5 + 업적)
                         │
                         ▼
                [메타 업그레이드 6종] — 영구 시작 보정
```

**상태 객체** `G` ([js/game.js:4-36](js/game.js#L4)):
```
kills, totalKills, hp, maxHp, hpRegen, damage, autoRate, chainCount,
wave, waveState, enemies[], evolutionStage, orbitals[],
specialSkills[], shieldActive/Timer, stormTimer, staticTimer,
unlockedUpgrades:['damage','auto'], upgrades{},
xp, level, skillPoints, totalLevels,           ← NEW R1
levelUpQueue, levelUpSelecting,
keystones{}, treeOpen,                          ← NEW R4
rp, metaUpgrades{}, achievements{},             ← NEW R5/R6
bloodlustStacks, blackholeTimer,                ← NEW B-리팩토링
difficulty,                                     ← NEW 난이도
rageStacks, comboCount, empTimer, rebirthUsed, ...
```

---

## 2. XP / 레벨업 시스템 (R1)

[js/game.js:38-93](js/game.js#L38)

### 2.1 경험치 공식

```
xpForLevel(n) = floor(8 + n×4 + n² × 0.35)
xpNeeded() = xpForLevel(G.level)
```

| 레벨 | 필요 XP (누적) |
|:---:|---:|
| 1→2 | 12 |
| 5→6 | 37 |
| 10→11 | 83 |
| 20→21 | 228 |
| 40→41 | 728 |

### 2.2 처치 시 XP (`xpFromEnemy`)

```
base = max(1, ceil(reward / 8))
      × (isBoss ? 8 : isElite ? 2 : 1)
      × difficulty.rewardMult
      + energy_flat_lv × 2         (XP 각인)
      × (1 + harvest_lv × 0.1)      (XP 수확)
      × (1 + elite_hunter_lv × 0.5)  if 엘리트
      × (1 + bonus_wave_lv × 0.8)    if 보스
      × (2 if fortune roll, fortune_lv × 5% 확률)
      × (1.5 if bounty 스킬)
      × (2 if lucky 스킬 & 25% 확률)
      + combo_lv × 0.5 × comboCount  (콤보 유지 시)
      × (1 + metaEffect.xpMult)     (메타 효과)
      × (3 if ks_collector 키스톤)
```

### 2.3 레벨업 처리 (`gainXP`)

```
while G.xp >= xpNeeded():
  G.xp -= xpNeeded()
  G.level++
  G.skillPoints++    ← 1 레벨당 1 SP
  showLevelUpBanner()
  screenFlash('evo')
```

**트리는 수동 오픈** (자동 팝업 아님, 트리 버튼 `has-sp` 펄스 효과).

---

## 3. 스킬 트리 시스템 (R2) — 3 Tree · 65 Nodes

[js/tree.js](js/tree.js) 전체가 트리 데이터/로직.

### 3.1 트리 구성

| 트리 | ID | 컨셉 | 빌드 방향성 | 노드 수 | 키스톤 |
|---|:---:|---|---|:---:|:---:|
| 🗡️ **낙뢰 (atk)** | `atk` | 단일 극딜·크리·처형 | 클릭 빌드 | 20+2 | 2 |
| 🌩️ **폭풍 (def)** | `def` | 체인·광역·스플래시 | AoE 빌드 | 20+2 | 3 |
| 🔋 **전격 (util)** | `util` | 자동·지속·회복·XP | 아이들 빌드 | 19+2 | 2 |

### 3.2 해금 룰 (WoW 스타일)

[js/tree.js:175-213](js/tree.js#L175)

**A. Tier Gate (트리별 누적 포인트)**
```
tierGateRequired(tier):
  T1 → 0
  T2 → 3
  T3 → 6
  T4 → 9
  T5 → 12
  T6 → 15
  T7(Keystone) → 20
```

**B. Prereq Rank (선행 노드 랭크)**
```
getPrereqRankReq(child, parent):
  = child.prereqRank (명시된 경우)
  = max(1, ceil(parent.maxRank / 2))   (기본값)
  → maxRank 10 → 5 요구
  → maxRank 5  → 3 요구
  → maxRank 3  → 2 요구
  → maxRank 1  → 1 요구
```

**C. Keystone 배타** — 같은 `ksExclusive` 그룹 내 1개만 투자 가능.

**D. 투자 판정** ([tree.js:235-242](js/tree.js#L235)):
```
canInvestNode(node):
  G.skillPoints > 0
  AND getNodeRank(node) < node.maxRank
  AND isNodeUnlocked(node)       # Tier Gate + Prereq 모두 통과
  AND !isKeystoneBlocked(node)    # 키스톤 배타 확인
```

### 3.3 🗡️ 낙뢰 트리 (atk) — 22 노드

| Tier | 노드 | maxRank | prereqs | 비고 |
|:---:|---|:---:|---|---|
| 1 | `damage` | 10 | - | 번개 데미지 +1/랭크 |
| 1 | `click_amp` | 10 | - | 클릭 데미지 +3/랭크 |
| 1 | `hp` | 10 | - | 최대 HP +20, 재생 +1 |
| 1 | `quick` | 10 | - | 클릭 쿨다운 -8ms |
| 2 | `crit` | 5 | damage | 크리티컬 확률 +3%/랭크 |
| 2 | `double_tap` | 5 | click_amp | 12%/랭크 확률 2회 공격 |
| 2 | `tough_skin` | 10 | hp | 최대 HP +15/랭크 |
| 3 | `crit_dmg` | 5 | crit | 크리 배율 +0.15×/랭크 (너프됨) |
| 3 | `precision` | 5 | double_tap | 정밀 사격 (계수 변경) |
| 3 | `boss_hunter` | 5 | tough_skin | 보스 데미지 +15%/랭크 |
| 3 | `bolt_size` | 5 | quick | 클릭 적중 범위 +10/랭크 |
| 3 | **`bloodlust`** 🆕 | 5 | crit_dmg | 클릭 시 HP 5% 소모, 다음 클릭 +50% dmg (3스택) |
| 4 | `weak_point` | 5 | crit_dmg+precision | 크로스체인: 크리+정밀 (HP≤50% +10%/랭크) |
| 4 | `multi` | 3 | precision | 클릭 시 추가 타겟 |
| 4 | `iron_core` | 5 | boss_hunter | 피해 감소 +5%/랭크 |
| 4 | `barrier` | 5 | bolt_size+tough_skin | 크로스체인: 빠름+튼튼 (피해 고정 감소) |
| 5 | `execute` | 5 | weak_point+boss_hunter | 크리+보스. HP≤20% +20%/랭크 |
| 5 | `rage` | 5 | multi+crit_dmg | 클릭+크리. 연속 처치 +10%/스택/랭크 |
| 5 | `penetrate` | 5 | iron_core+barrier | 탱커 양쪽. 보호막 추가 dmg +20%/랭크 |
| 6 | `final_strike` | 5 | execute+rage | 아펙스. 모든 공격 +5 고정/랭크 |
| 6 | **`energy_shield`** ※ | 5 | penetrate | 재명명 → **뇌전 방벽**: HP 80%+ 시 피해 -15%/랭크 |
| 7 | 🔥 **`ks_berserker`** | 1 | final_strike+penetrate | `×2 dmg, -40% HP, 잃은 HP%만큼 dmg 추가` |
| 7 | ⚡ **`ks_click_master`** | 1 | rage+multi | `×5 클릭, 자동 비활성, 클릭당 HP -3` |

### 3.4 🌩️ 폭풍 트리 (def) — 22 노드

| Tier | 노드 | maxRank | prereqs | 비고 |
|:---:|---|:---:|---|---|
| 1 | `chain` | 10 | - | 추가 연쇄 +1/랭크 |
| 1 | `range` | 10 | - | 공격 범위 +5/랭크 |
| 1 | `splash` | 10 | - | 스플래시 비율 +5%/랭크 |
| 1 | `shield_wall` | 10 | - | 받는 피해 -8%/랭크 |
| 2 | `chain_dmg` | 5 | chain | 체인 데미지 +10%/랭크 |
| 2 | `chain_range` | 5 | range | 체인 사거리 +30/랭크 |
| 2 | `splash_range` | 5 | splash | 스플래시 범위 +20%/랭크 |
| 2 | `recover` | 5 | shield_wall | HP 30% 이하 시 재생 +2/랭크 |
| 3 | `chain_crit` | 5 | chain_dmg+chain_range | 체인 양쪽. 체인 크리 +5%/랭크 |
| 3 | `field_expand` | 5 | chain_range | 전체 범위 +8/랭크 |
| 3 | `overload` | 5 | chain_dmg+splash_range | 체인+스플래시. 전체 dmg +6%/랭크 (너프됨) |
| 3 | `resilience` | 5 | recover | HP 50% 이하 시 재생 ×2 |
| 4 | `surge` | 5 | chain_crit+overload | 체인크리+전체증폭. 전체 dmg +6%/랭크 |
| 4 | `plasma` | 5 | field_expand+overload | 범위+폭발. 15% 확률 범위 폭발 |
| 4 | `thorns_up` | 5 | overload+resilience | 공격+방어 융합. 반사 dmg +20%/랭크 |
| 4 | `dodge_up` | 5 | resilience | 회피 확률 +3%/랭크 |
| 5 | `emp` | 5 | surge+plasma | EMP. 10초마다 전체 30 dmg/랭크 |
| 5 | `lifeline` | 5 | plasma+thorns_up | 크리 시 HP +2/랭크 |
| 5 | `auto_shield` | 5 | dodge_up+thorns_up | 회피+반사. 쿨다운 `max(5, 12-lv)`초 |
| 6 | `rebirth` | 3 | auto_shield+lifeline | 아펙스. HP=0 시 20% 부활 (런당 1회) |
| 6 | **`storm_eye`** 🆕 | 5 | plasma+emp | 폭풍의 눈. 반경 +20/랭크, DPS +3/랭크 존 |
| 7 | 🛡️ **`ks_immortal`** | 1 | emp+rebirth | `HP ×2.5, 재생 ×3, 주는 dmg -50%` |
| 7 | 🌪️ **`ks_storm_lord`** | 1 | storm_eye+rebirth | `자동 범위 +100%, 체인 +5, dmg -70%` |
| 7 | 💎 **`ks_glass_cannon`** | 1 | rebirth+emp | `HP=1 고정, 모든 dmg ×5` |

### 3.5 🔋 전격 트리 (util) — 21 노드

| Tier | 노드 | maxRank | prereqs | 비고 (XP 테마로 재명명) |
|:---:|---|:---:|---|---|
| 1 | `auto` | 10 | - | 자동 공격 속도 +0.35/초/랭크 |
| 1 | `regen` | 10 | - | HP 재생 +0.5/초/랭크 |
| 1 | **`harvest`** ※ | 10 | - | → **경험 흡수**: XP +10%/랭크 |
| 1 | `slow_aura` | 10 | - | 적 이속 -5%/랭크 |
| 2 | `auto_acc` | 10 | auto | 자동 +1 고정 dmg/랭크 |
| 2 | `hp_boost` | 5 | regen | 최대 HP +30/랭크 |
| 2 | **`energy_flat`** ※ | 10 | harvest | → **뇌전 각인**: XP +2/킬/랭크 |
| 2 | `cooldown` | 5 | slow_aura | 실드/EMP 쿨 -1초 |
| 3 | `auto_dmg` | 5 | auto_acc | 자동 dmg +15%/랭크 |
| 3 | `vampiric` | 5 | hp_boost+regen | HP 체계 양쪽. 처치 시 HP +2/랭크 |
| 3 | **`fortune`** ※ | 5 | energy_flat+harvest | → **행운의 번개**: 5%/랭크 확률 XP 2배 |
| 3 | `wave_heal` | 5 | cooldown | 웨이브 클리어 HP +10/랭크 |
| 4 | `rapid_fire` | 5 | auto_dmg+auto_acc | 자동 양쪽. 자동 속도 +20%/랭크 |
| 4 | `absorption` | 5 | vampiric+hp_boost | HP 심화. 피해 5%/랭크 회복 |
| 4 | **`elite_hunter`** ※ | 5 | fortune+energy_flat | → **정예 처단**: 엘리트 XP +50%/랭크 |
| 4 | **`magnet_pull`** 🆕 | 5 | wave_heal | 자석 견인. 적 끌림 +8%/랭크 |
| 5 | `titan_guard` | 5 | absorption+vampiric | 자동+HP 융합. HP +50, 감소 +2 |
| 5 | **`bonus_wave`** ※ | 5 | elite_hunter+wave_heal | → **보스 처단**: 보스 XP +80%/랭크 |
| 6 | **`energy_storm`** ※ | 5 | rapid_fire+titan_guard | → **뇌전 폭발**: 15%/랭크 처치 시 번쩍 |
| 6 | **`combo`** ※ | 5 | bonus_wave+elite_hunter | → **연쇄 각성**: 콤보당 XP +3/랭크 |
| 7 | ⏳ **`ks_timelord`** | 1 | energy_storm+combo | `적 속도 -50%, 쿨다운 -40%` |
| 7 | 🕳️ **`ks_void`** | 1 | energy_storm+bonus_wave | `5초마다 블랙홀: 모든 적 흡수+dmg` |
| 7 | 💰 **`ks_collector`** | 1 | combo+energy_storm | `XP ×3, 에너지 ×3, HP -50%` |

> ※ 표시 = `nameOverride` 적용 (에너지→XP 테마 리네이밍)
> 🆕 = B-리팩토링으로 새로 추가된 시그니처 노드

### 3.6 노드 타입

| type | 의미 |
|---|---|
| `basic` | 기본 노드 (maxRank 10, 일반 통로) |
| `notable` | 주목 노드 (maxRank 3~5, 의미 있는 효과) |
| `keystone` | 키스톤 (maxRank 1, 트레이드오프) |

---

## 4. 키스톤 효과 상세 (R4)

[js/game.js:370-383, 404-419, 451-465](js/game.js#L370)

| Keystone | 트리 | 효과 (구현) | Exclusive |
|---|:---:|---|:---:|
| 🔥 **광전사** `ks_berserker` | atk | `damage ×2, maxHp ×0.6, HP% 낮을수록 dmg ×1.0~2.0 추가 스케일` | `atk_ks` |
| ⚡ **뇌전의 화신** `ks_click_master` | atk | `damage ×5, autoRate=0, 클릭당 HP -3` | `atk_ks` |
| 🛡️ **불멸의 코어** `ks_immortal` | def | `maxHp ×2.5, hpRegen ×3, damage ×0.5` | `def_ks` |
| 🌪️ **폭풍 군주** `ks_storm_lord` | def | `자동 체인 +5체, 범위 +100% (미구현분 있음), damage -70%` | `def_ks` |
| 💎 **유리 대포** `ks_glass_cannon` | def | `maxHp=1 고정, damage ×5` | `def_ks` |
| ⏳ **시간의 주인** `ks_timelord` | util | `적 속도 ×0.5, 자신 click CD ×0.6 (-40%)` | `util_ks` |
| 🕳️ **공허의 지배자** `ks_void` | util | `5초마다 블랙홀: 모든 적을 (cx,cy) 방향 70%, max(5, damage×2) dmg` | `util_ks` |
| 💰 **수집가** `ks_collector` | util | `maxHp ×0.5, xpFromEnemy ×3` | `util_ks` |

**주의**:
- 배타 그룹은 **트리별** (`atk_ks` / `def_ks` / `util_ks`) — 다른 트리 키스톤은 동시 장착 가능.
- Berserker 스케일링: `getBerserkerBonus() = 1 + (1 - hp/maxHp)` → HP 10%에서 **×1.9** 추가.

---

## 5. B-리팩토링: 빌드 시그니처 메커니즘

[js/game.js:389-449](js/game.js#L389)

| 기믹 | 소유 노드 | 로직 |
|---|---|---|
| **Bloodlust (피의 의지)** | `bloodlust` (atk T3) | 클릭마다 HP 5% 소모 → `bloodlustStacks++` (최대 3). 다음 클릭에서 `consumeBloodlust() → ×(1+0.5×stacks)` (최대 ×2.5) |
| **Storm Eye (폭풍의 눈)** | `storm_eye` (def T6) | 반경 `80 + lv×20`, DPS `lv×3 + damage×0.15×lv` 존. 프레임마다 범위 내 적에게 `floor(dps × dt)` |
| **Magnet Pull (자기장 견인)** | `magnet_pull` (util T4) + skill `magnet` | 힘 = `lv×0.08 + (0.5 if magnet)` → 매 프레임 적을 코어 방향 `force × 60 × dt` 만큼 끌기 |
| **Blackhole (블랙홀)** | `ks_void` (util T7) | 5초마다 모든 적 좌표를 `(cx, cy)` 방향 70% 당기고 `max(5, damage×2)` dmg |

---

## 6. 보스 특수 스킬 (SKILL_POOL 30종)

구조는 v2와 동일하지만 **획득 타이밍이 변경됨**:

- **v2**: 진화 단계 도달 시 4택1
- **v3**: **보스 처치 시** 4택1 ([js/game.js:893-897](js/game.js#L893))
  ```
  if(enemy.isBoss){
    screenFlash('big'); screenShake(true);
    setTimeout(() => showSkillSelection(), 600);
  }
  ```

SKILL_POOL 내용은 v2 보고서와 동일 (atk 12 / def 7 / util 11 = 30종). 단, 몇몇 스킬의 역할은 트리와 중복되거나 재정의됨:
- `bounty`, `lucky` → 이제 **XP 배수** (에너지 배수에서 변경) — [js/game.js:60-61](js/game.js#L60)
- `magnet` → 트리 `magnet_pull`과 합산되어 pull force 기여

5웨이브마다 보스 → 최대 획득 수는 웨이브 진행에 비례 (중복 방지로 30 상한).

---

## 7. 메타 프로그레션 (R5)

[js/game.js:98-151](js/game.js#L98)

### 7.1 RP (Run Point) 획득 공식

```
computeRunRP():
  = floor(wave / 5)       # 웨이브 도달 (5웨이브당 1 RP)
  + floor(totalKills / 50) # 처치 (50킬당 1 RP)
  + floor(totalLevels / 5) # 누적 레벨 (5레벨당 1 RP)
  + 업적 RP (획득 시 즉시 가산)
```

### 7.2 메타 업그레이드 6종 (`META_UPGRADES`)

영구 저장 (`localStorage['lightningMeta']`), 런마다 적용.

| ID | 이름 | 효과 | maxRank | costBase | costMult |
|---|---|---|:---:|---:|---:|
| `m_hp` | 시작 체력 | 시작 시 Max HP +15/랭크 | 5 | 3 | 1.8 |
| `m_sp` | 시작 스킬포인트 | 시작 SP +1/랭크 | 5 | 8 | 2.2 |
| `m_xp` | 경험 증폭 | XP 획득 +8%/랭크 | 5 | 5 | 2.0 |
| `m_dmg` | 시작 데미지 | 시작 dmg +1/랭크 | 5 | 4 | 1.9 |
| `m_eng` | 시작 자동 공격 | 시작 autoRate +0.2/초/랭크 | 5 | 5 | 2.0 |
| `m_revive` | 부활 부적 | 런당 1회 HP 30%로 부활 | 1 | 50 | - |

비용 공식: `ceil(costBase × costMult^currentRank)`

### 7.3 업적 (R6) — 5종

[js/game.js:156-172](js/game.js#L156)

| ID | 조건 | RP |
|---|---|:---:|
| `first_blood` | 적 1체 처치 | 1 |
| `wave10` | 웨이브 10 도달 | 3 |
| `wave30` | 웨이브 30 도달 | 8 |
| `wave50` | 웨이브 50 도달 | 15 |
| `level40` | 레벨 40 달성 | 10 |

---

## 8. 난이도 시스템

[js/config.js:5-11](js/config.js#L5)

| ID | 이름 | hpMult | speedMult | rewardMult | color |
|---|---|:---:|:---:|:---:|:---:|
| `easy` | 쉬움 | 0.7 | 0.9 | 1.2 | 녹색 |
| `normal` | 보통 | 1.0 | 1.0 | 1.0 | 노랑 |
| `hard` | 어려움 | 1.4 | 1.1 | 0.9 | 주황 |
| `nightmare` | 악몽 | 2.2 | 1.25 | 0.8 | 분홍 |

- 영구 설정 (`localStorage['lightningDifficulty']`)
- **난이도별 독립 랭킹**: Firestore `where('difficulty','==',...)` 쿼리로 분리 ([js/game.js:233-236](js/game.js#L233))
- `rewardMult`는 **XP 배수**로 적용 (`xpFromEnemy` 내부).

---

## 9. 스탯 재계산 파이프라인 (R4 개편)

[js/game.js:360-385](js/game.js#L360) `recalcStats()`:

```
# 1. 기본
damage = 1 + upLv('damage')
autoRate = upLv('auto') × 0.35
chainCount = upLv('chain')
maxHp = 100 + hp×20 + tough_skin×15 + hp_boost×30 + titan_guard×50
hpRegen = upLv('hp') + upLv('regen')×0.5

# 2. 메타 보너스 (영구)
maxHp += getMetaEffect('maxHp')

# 3. 키스톤 적용 (순서대로 누적)
if ks_berserker:    damage ×= 2,   maxHp ×= 0.6
if ks_click_master: damage ×= 5,   autoRate = 0
if ks_immortal:     maxHp ×= 2.5,  hpRegen ×= 3,  damage ×= 0.5
if ks_glass_cannon: maxHp = 1,     damage ×= 5
if ks_collector:    maxHp ×= 0.5

# 4. HP 캡
if hp > maxHp: hp = maxHp
```

**추가 런타임 훅**:
- `getBerserkerBonus()` → HP% 추가 스케일 (데미지 계산 시)
- `getStormLordChainBonus() = 5` (자동 공격 체인 추가)
- `getClickCdMult()` → ks_timelord 시 `×0.6`
- 적 속도: `spawnEnemy` 시 ks_timelord면 `×0.5`

---

## 10. 밸런스 패스 (수치 변경)

`Balance pass per math analysis: additive conditional multipliers` 커밋 기준.

| 업그레이드 | v2 증분 | **v3 증분** | 변경 |
|---|:---:|:---:|:---:|
| `crit_dmg` | `+0.25×/랭크` | `+0.15×/랭크` | 🔻 -40% |
| `overload` | `+8%/랭크` | `+6%/랭크` | 🔻 -25% |
| `execute` | `+50%/랭크` | `+20%/랭크` | 🔻 -60% |
| `weak_point` | `+15%/랭크` | `+10%/랭크` | 🔻 -33% |
| `precision` | `+0.15×/랭크` | `+4 (구조 변경)` | 🔧 리워크 |

목적: 곱셈 중첩으로 인한 지수 폭발 완화 → 덧셈형 조건부 배수로 안정화.

---

## 11. 진화 시스템 (변경 없음)

v2와 동일 — 100 단계 · 10 티어. [js/config.js:13-160](js/config.js#L13)

- 초기 단계: `전기 불꽃` (0 kills) → 최종: `⚡ THE LIGHTNING GOD ⚡` (92,520 kills)
- 시각 효과만 담당 (스탯 영향 X). 스탯 성장은 **전부 스킬트리/XP 기반**으로 전환.

---

## 12. 웨이브 / 적 시스템 (변경 없음)

v2와 동일:
- 9 웨이브 타입 (normal/swarm/rush/elite/fortress/mixed/chaos/nightmare/boss)
- 20 적 패턴 (normal~titan)
- 5웨이브마다 보스 → **v3에서는 보스 처치 시 SKILL_POOL 선택 팝업**

단, `hpMult`와 `speedMult`에 난이도 보정이 곱해짐.

---

## 13. 성장 곡선 상호작용

```
───────────────── 런 시작 ─────────────────
 메타 효과 적용 → 시작 HP/SP/dmg/autoRate +
 │
 ├─ 처치 ──► XP ──► 레벨 ──► SP +1
 │                               │
 │                               ▼
 │                     [스킬트리] SP 투자
 │                   Tier Gate + Prereq 검증
 │                               │
 │                    ┌──────────┼──────────┐
 │                atk 빌드    def 빌드    util 빌드
 │                    └──────────┬──────────┘
 │                               ▼
 │                      T7 Keystone (1개)
 │
 ├─ 보스 처치 ──► SKILL_POOL 4택1 (특수 스킬)
 │
 ├─ 업적 달성 ──► RP +
 │
 └─ 런 종료 ──► computeRunRP() ──► 메타 업그레이드 구매
```

---

## 14. 파일 참조 인덱스

| 시스템 | 파일:라인 | 핵심 심볼 |
|---|---|---|
| 게임 상태 | [js/game.js:4-36](js/game.js#L4) | `G` 객체 (XP/SP/keystones/rp 추가) |
| XP/레벨 공식 | [js/game.js:38-93](js/game.js#L38) | `xpForLevel`, `xpFromEnemy`, `gainXP` |
| 메타 업그레이드 | [js/game.js:98-136](js/game.js#L98) | `META_UPGRADES`, `getMetaEffect` |
| 업적 | [js/game.js:156-172](js/game.js#L156) | `ACHIEVEMENTS`, `checkAchievements` |
| RP 계산 | [js/game.js:174-179](js/game.js#L174) | `computeRunRP` |
| 난이도 | [js/config.js:5-11](js/config.js#L5) | `DIFFICULTY_CONFIG` |
| 진화 데이터 | [js/config.js:13-160](js/config.js#L13) | `EVOLUTIONS` (100단계) |
| 스킬 풀 | [js/config.js:162-196](js/config.js#L162) | `SKILL_POOL` (30종, 보스 드랍) |
| 업그레이드 풀 | [js/config.js:201-268](js/config.js#L201) | `UPGRADE_POOL` (데이터만, 트리가 소비) |
| **스킬 트리 데이터** | [js/tree.js:10-161](js/tree.js#L10) | `TREE_NODES` (65 노드) |
| 트리 해금 로직 | [js/tree.js:175-213](js/tree.js#L175) | `tierGateRequired`, `isNodeUnlocked` |
| 노드 투자 | [js/tree.js:235-257](js/tree.js#L235) | `canInvestNode`, `investNode` |
| 스탯 재계산 | [js/game.js:360-385](js/game.js#L360) | `recalcStats()` (키스톤 통합) |
| 빌드 시그니처 | [js/game.js:389-449](js/game.js#L389) | `consumeBloodlust`, `applyStormEye`, `applyMagnetPull`, `applyBlackhole` |
| 키스톤 보너스 | [js/game.js:404-419](js/game.js#L404) | `getBerserkerBonus`, `getStormLordChainBonus`, `getClickCdMult` |
| 보스→스킬 팝업 | [js/game.js:893-897](js/game.js#L893) | 보스 처치 트리거 |
| 스킬 선택 UI | [js/ui.js:4-40](js/ui.js#L4) | `showSkillSelection` (유지) |

---

## 15. 요약 수치 대시보드 (v3)

| 지표 | v2 | **v3** |
|---|---:|---:|
| 주 자원 | 에너지 | **XP** |
| 레벨업 시스템 | - | **O (Level 1~∞, SP 1/레벨)** |
| 트리 노드 총 | 60 업그레이드 | **65 노드 (22+22+21)** |
| 트리 개수 | 1 (평면) | **3 (atk/def/util)** |
| 최고 티어 | T6 | **T7 Keystone** |
| 키스톤 | 0 | **7 (2+3+3, 트리별 1개 제약)** |
| Tier Gate | 웨이브 | **누적 포인트 합 (0/3/6/9/12/15/20)** |
| Prereq 요구 랭크 | X | **O (maxRank 절반)** |
| 특수 스킬 획득 | 진화 시 | **보스 처치 시** |
| 특수 스킬 수 | 30 | 30 (동일) |
| 메타 업그레이드 | 0 | **6 (RP 구매)** |
| 업적 | 0 | **5 (RP 보상)** |
| 난이도 | 1 | **4** |
| 시그니처 빌드 노드 | 0 | **3 (bloodlust/storm_eye/magnet_pull)** |
| 랭킹 분리 | 단일 | **난이도별 독립** |
| 밸런스 | 원본 | **additive 재조정 (5개 계수 너프)** |
| 진화 단계 | 100 | 100 (변경 없음) |
| 적 패턴 | 20 | 20 (변경 없음) |
| 웨이브 타입 | 9 | 9 (변경 없음) |
