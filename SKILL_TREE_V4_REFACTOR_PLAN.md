# 스킬 트리 V4 리팩토링 계획서

> 작성: 2026-04-20
> 기준 브랜치: `claude/keen-kare` (v3)
> 타겟: v4 — "Wow Moment 기반 3-Tree 재설계"

---

## 0. Executive Summary

**한 줄 요약**: v3의 선형 강화(Linear Power-up) 위주 65노드 트리를, "클릭 / 자동 / 파편" 3축에 **Breakpoint 노드 9개**(각 트리 T3·T5·T7)를 심은 구조로 재설계한다.

### 핵심 전환
| 항목 | v3 | **v4** |
|---|---|---|
| 트리 정체성 | atk(공격) / def(방어) / util(경제) | **낙뢰(클릭) / 폭풍(자동) / 파편(분리체)** |
| 노드 성격 | 95% 선형 강화 | **선형 필러 + Breakpoint 별(⭐)** |
| T7 키스톤 | 7개 (ks_* 평준) | **9개 키스톤 (트리당 2~3개)** — 모두 극적 트레이드오프 |
| 신규 시스템 | - | **파편(Shards) 엔진** — 분열·유도·공명·폭발 |
| 세계관 톤 | 혼재 | **SF 통일** (정령/마법 용어 배제) |

### 왜 지금 리팩토링인가
- v3는 플레이어가 "+1씩 계속 올리는" 느낌만 줄 뿐 "게임이 바뀌는 순간"이 없음 (Breakpoint Skill 부재).
- 3번째 트리(util)가 에너지→XP 테마 덮어쓰기로 만들어져 **정체성이 모호함**.
- 기존 `orbitals[]` / `bossProjectiles[]` 상태 변수가 이미 존재 → 파편 엔진의 **기반 인프라 재활용 가능**.

---

## 1. 현재 v3 진단

### 1.1 문제점 (대화 합의 기반)

| 진단 | 증거 | 영향 |
|---|---|---|
| **Breakpoint 부재** | 65노드 중 "찍는 순간 플레이가 바뀌는" 노드가 키스톤 7개뿐 | 레벨업 피로감, "+1 SP 또" |
| **util 트리 정체성 모호** | `harvest→XP수확`, `fortune→럭키` 등 덮어쓰기로 연명 | 플레이어가 "왜 이 트리를 찍지?" 답 못 함 |
| **트리 간 차별화 약함** | 세 트리 모두 "데미지 다른 방식" | 진짜 빌드 다양성 대신 숫자만 다른 동일 플레이 |
| **정령/마법 언어 침투** | v3 네이밍에 "정령" 같은 판타지 용어가 들어올 뻔함 | 진화명(플라즈마·이온·특이점)과 세계관 충돌 |

### 1.2 유지할 것 (v3 자산)
- **XP/레벨/SP 시스템** ([js/game.js:38-93](js/game.js#L38))
- **Tier Gate + Prereq 해금 로직** ([js/tree.js:175-213](js/tree.js#L175))
- **메타 프로그레션(RP)** ([js/game.js:98-179](js/game.js#L98))
- **난이도 4단계** ([js/config.js:5-11](js/config.js#L5))
- **진화 시스템 100단계** (순수 시각)
- **SKILL_POOL 30종** — 보스 드랍, 트리와 별개

### 1.3 버릴 것 (v3 잔재)
- util 트리의 `nameOverride` 덮어쓰기들 (설계 부채)
- `fortress`, `absorb`, `venom`, `mark` 등 SKILL_POOL 중 트리 노드와 중복·애매한 스킬
- 단순 % 곱만 주는 "필러 속 필러" 노드 (선형 강화는 유지하되 과잉 중복 제거)

---

## 2. 비전: 3-Tree 재정의

### 2.1 축 정의 — "언제 공격하는가"
v3의 atk/def/util은 "무엇에 쓰는가"였다면, v4는 **"공격 주체와 타이밍"** 으로 분리한다.

| 트리 | 누가 공격하나 | 언제 공격하나 | 플레이어 행동 |
|---|---|---|---|
| 🗡️ **낙뢰** (클릭) | 플레이어 본체 | 클릭 순간 | 능동 조작 (손맛) |
| 🌩️ **폭풍** (자동) | 본체 자동 쿨 | 쿨다운마다 규칙적 | 관망·관리 |
| 🌀 **파편** (분리체) | 분신/파편 자율 | 분신이 판단 | 배치·연쇄 관리 |

**핵심 원칙**: 세 트리가 서로 침범하지 않는다. 하나를 올인하면 다른 두 트리의 공격이 비활성화되거나 약화되는 **키스톤 선택**을 통해 진정한 빌드 다양성 확보.

### 2.2 각 트리의 시그니처 플레이
```
낙뢰 올인:  "보스 앞에서 광클로 3초 만에 녹임"
자동 올인:  "스웜 웨이브를 여유롭게 관망하며 청소"
파편 올인:  "화면 전체에 파편을 뿌려 전방위 압박"
```

---

## 3. Breakpoint 설계 원칙 (대화 합의)

### 3.1 3-5-7 법칙
각 트리에 **Breakpoint 3개**를 T3·T5·T7에 배치:
- **T3 (7~9 포인트 투자)**: 소형 Breakpoint — "오!" 순간
- **T5 (15~17 포인트)**: 중형 Breakpoint — "와!" 순간
- **T7 (20+ 포인트)**: Keystone — "이게 내 빌드 정체성" 순간

### 3.2 Breakpoint 3대 유형
| 유형 | 설명 | 예시 |
|---|---|---|
| **메커니즘 전환** | 게임 규칙 자체를 바꿈 | "자동 공격 비활성, 클릭 ×5" |
| **패시브 시너지 활성** | 잠자던 노드들을 깨움 | "체인이 길어질수록 강해짐" → chain_* 노드 전부 재평가 |
| **행동 유인 변환** | 플레이어가 다른 행동을 취하게 함 | "HP 30%에서 ×2" → 일부러 위험하게 |

### 3.3 설계 4원칙
1. **옵트인 아닌 옵트아웃**: 선택의 대가(trade-off)가 명시되어야 함. "+50%만" 주는 건 Breakpoint가 아님.
2. **기존 노드 의미 변화**: 가장 강력한 Breakpoint = 쓸모없던 것을 핵심으로 바꾸는 것.
3. **트레이드오프 명확성**: "A 얻고 B 잃음"이 한 문장으로 설명되어야 함.
4. **즉각 체감**: 찍은 후 5초 안에 플레이 변화 느낄 수 있어야 함.

---

## 4. 트리별 상세 설계

> 노드 총 수 목표: 낙뢰 21, 폭풍 21, 파편 21 = **63노드** (v3 65 → 소폭 축소하되 밀도 향상)

### 4.1 🗡️ 낙뢰 트리 (클릭) — 21 노드

**정체성**: 플레이어의 정밀 타격. 손끝에서 터지는 번개.

#### Tier 1 (4 노드, 필러)
| ID | 이름 | maxRank | 효과 |
|---|---|:---:|---|
| `damage` | 번개 위력 | 10 | 클릭 dmg +1/랭크 |
| `click_amp` | 클릭 강화 | 10 | 클릭 dmg +3/랭크 |
| `quick` | 신속 충전 | 10 | 클릭 CD -8ms/랭크 |
| `bolt_size` | 번개 확대 | 5 | 클릭 범위 +10/랭크 |

#### Tier 2 (3 노드, 필러)
| ID | 이름 | maxRank | prereqs |
|---|---|:---:|---|
| `crit` | 치명타 | 5 | damage |
| `double_tap` | 이중 타격 | 5 | click_amp |
| `precision` | 정밀 사격 | 5 | crit |

#### ⭐ Tier 3 Breakpoint (핵심 전환점 1)
```
🎯 "관통의 경지" (penetration_mastery)
  효과: 클릭 공격이 일직선 상의 모든 적을 관통한다.
        관통 횟수 +1/랭크 (최대 5)
        각 추가 관통마다 데미지 -15% (최대 -75%)
  maxRank: 5
  prereqs: [precision, double_tap] (T2 2개 요구)
  
  왜 극적인가:
  - "한 적 때리기" 게임이 "일렬로 세운 적 일점사"로 변환
  - 자동 트리의 chain과 완전히 다른 AoE 제공
  - 적 밀집 웨이브(swarm/chaos)에서 게임 체인지
  - 트레이드오프: 밀집 적엔 최강, 분산 적엔 약해짐
```

#### Tier 4 (3 노드, T3 보강)
| ID | 이름 | 효과 |
|---|---|---|
| `crit_dmg` | 치명 강화 | 크리 배율 +0.15/랭크 |
| `boss_hunter` | 보스 사냥꾼 | 보스 dmg +15%/랭크 |
| `weak_point` | 약점 공략 | 적 HP≤50% dmg +10%/랭크 |

#### ⭐ Tier 5 Breakpoint (핵심 전환점 2)
```
💀 "처형의 경지" (execution_mastery)
  효과: 적 HP 20% 이하 시, 피해가 "고정값"으로 계산된다.
        (크리티컬 배율 적용, 적 방어력·피해감소 무시)
        고정값 = (클릭 dmg + 최대 HP × 0.02)/랭크
  maxRank: 5
  prereqs: [execute, weak_point]  
  트레이드오프: 이 노드 투자 시 일반 공격 크리 배율 -10%/랭크
  
  왜 극적인가:
  - tank/shield_bearer/titan 등 고방어 적을 뚫는 유일한 길
  - 기존 execute(+50%) 와는 완전히 다른 메커닉
  - 크리 배율을 포기해야 한다는 명확한 대가
```

#### Tier 6 (2 노드, T5 지원)
| ID | 이름 | 효과 |
|---|---|---|
| `final_strike` | 최종 일격 | 모든 공격 +5 고정/랭크 |
| `rage` | 광전사 | 연속 처치 +10%/스택/랭크 |

#### ⭐ Tier 7 Keystone (최종 정체성, 택 1)

**KS-L1: 🌩️ "천벌의 지배자" (ks_clickmaster)**
```
- 클릭 쿨다운: 0초 (즉시 재사용 가능)
- 자동 공격: 비활성화
- 클릭당 자신 HP -5
- 처치 시 HP +10 회복
- 키워드: "연속 처치하는 한 살아있다"
```

**KS-L2: 🔥 "광전사의 각성" (ks_berserker)**
```
- 클릭 데미지 ×2
- 최대 HP -40%
- 잃은 HP%만큼 추가 데미지 (HP 10% → ×1.9)
- 키워드: "일부러 죽기 직전까지"
```

**KS-L3: ⚡ "뇌전의 화신" (ks_thunder_avatar)**
```
- 클릭 1회당 5번 연속 번개 발사 (0.1초 간격)
- 각 번개는 다른 적 자동 유도
- 자동 공격: 비활성화
- 클릭 CD +50%
- 키워드: "한 번 때리면 다섯 번 꽂힌다"
```

---

### 4.2 🌩️ 폭풍 트리 (자동) — 21 노드

**정체성**: 지속적 자동 처리. 내가 쉬는 동안도 돌아가는 번개 기계.

#### Tier 1 (4 노드, 필러)
| ID | 이름 | maxRank | 효과 |
|---|---|:---:|---|
| `auto` | 자동 번개 | 10 | 자동 속도 +0.35/초/랭크 |
| `auto_acc` | 조준 보정 | 10 | 자동 dmg +1/랭크 |
| `range` | 전자기장 | 10 | 공격 범위 +5/랭크 |
| `chain` | 체인 라이트닝 | 10 | 연쇄 타겟 +1/랭크 |

#### Tier 2 (3 노드, 필러)
| ID | 이름 | maxRank | prereqs |
|---|---|:---:|---|
| `auto_dmg` | 자동 강화 | 5 | auto_acc |
| `chain_dmg` | 체인 증폭 | 5 | chain |
| `chain_range` | 체인 범위 | 5 | range |

#### ⭐ Tier 3 Breakpoint
```
🔗 "연쇄 각성" (chain_awakening)
  효과: 체인 라이트닝이 연쇄할 때마다
        데미지 감소(-25%/hop) 대신 +15%/hop 증가 (무제한)
  maxRank: 1 (켜고 끄는 스위치)
  prereqs: [chain_dmg, chain_range]
  
  왜 극적인가:
  - v3에서 체인은 "chain_boost 스킬"이 있어야 간신히 쓸 만했음
  - 이거 찍는 순간 체인 4~5hop이 본체보다 강해짐
  - chain_range, chain_dmg, chain_crit, field_expand 노드가 
    전부 "의무 투자" 로 격상 (패시브 시너지 활성)
```

#### Tier 4 (3 노드, T3 보강)
| ID | 이름 | 효과 |
|---|---|---|
| `chain_crit` | 체인 크리 | 체인 크리 확률 +5%/랭크 |
| `rapid_fire` | 속사 | 자동 속도 +20%/랭크 |
| `field_expand` | 필드 확장 | 전체 범위 +8/랭크 |

#### ⭐ Tier 5 Breakpoint
```
🌀 "폭풍의 눈" (storm_eye)
  효과: 코어 주변 반경 80+20×랭크 지속 피해 존 생성.
        DPS = (본체 dmg × 0.15 × 랭크) + (랭크 × 3)
        존 안의 적은 감속 -20%
  maxRank: 5
  prereqs: [rapid_fire, field_expand]
  
  왜 극적인가:
  - "내가 클릭 안 해도 적이 죽는다" - 진정한 오토배틀러 감각
  - slow_aura, chain_range 같은 "범위" 노드가 급격히 중요해짐
  - 자동 트리의 아이들 정체성을 확정
```

#### Tier 6 (2 노드)
| ID | 이름 | 효과 |
|---|---|---|
| `emp` | EMP 펄스 | 10초마다 전체 30 dmg/랭크 |
| `surge` | 전류 급등 | 전체 dmg +6%/랭크 |

#### ⭐ Tier 7 Keystone (택 1)

**KS-S1: 🌪️ "폭풍의 심장" (ks_storm_heart)**
```
- 자동 공격 비활성화
- 대신 3초마다 화면 전체 적에게 낙뢰 (본체 dmg ×5)
- 클릭 쿨다운 +30%
- 키워드: "쌓였다가 한 번에 터진다"
```

**KS-S2: 🛡️ "불멸의 코어" (ks_immortal)**
```
- 최대 HP ×2.5
- HP 재생 ×3
- 주는 데미지 ×0.5
- 키워드: "오래 버텨서 이긴다"
```

**KS-S3: ❄️ "시간의 주인" (ks_timelord)**
```
- 적 이동 속도 ×0.5
- 본체 모든 쿨다운 ×0.6
- 처치 시 XP ×0.7 (시간 왜곡 대가)
- 키워드: "세계를 느리게"
```

---

### 4.3 🌀 파편 트리 (분리체) — 21 노드 🆕

**정체성**: 분리된 존재의 자율 전투. 내 번개가 내 곁에서 스스로 싸운다.

> 핀판넬 레퍼런스 + 번개 폭발 시 파편 튀기 비전 결합.
> 세계관: SF 통일 ("방전 잔해", "전하 응축", "입자 분열" — 정령/마법어 금지)

#### Tier 1 (4 노드, 필러)
| ID | 이름 | maxRank | 효과 |
|---|---|:---:|---|
| `shard_basic` | 방전 잔해 | 10 | 적 처치 시 파편 1개 생성, 가장 가까운 적 유도 |
| `shard_damage` | 파편 위력 | 10 | 파편 dmg +10%/랭크 |
| `shard_count` | 확산 파편 | 5 | 파편 동시 생성 수 +1/랭크 (기본 1→6) |
| `shard_life` | 파편 지속 | 5 | 파편 수명 +0.3초/랭크 (기본 1초→2.5초) |

#### Tier 2 (3 노드, 필러)
| ID | 이름 | maxRank | prereqs |
|---|---|:---:|---|
| `shard_speed` | 파편 가속 | 5 | shard_basic | 파편 이동속도 +15%/랭크 |
| `shard_range` | 파편 추적 | 5 | shard_speed | 파편 유도 강도 +20%/랭크 |
| `shard_crit` | 파편 예기 | 5 | shard_damage | 파편 크리 확률 +3%/랭크 |

#### ⭐ Tier 3 Breakpoint
```
💥 "연쇄 분열" (shard_split)
  효과: 파편이 적 적중 시 소멸 대신 
        더 작은 파편 2개로 분열 (각 50% dmg)
        분열 파편이 다시 적중 시 1개로 분열 (25% dmg)
        최대 3세대 연쇄
  maxRank: 1 (스위치)
  prereqs: [shard_count, shard_speed]
  
  왜 극적인가:
  - 1개 파편 → 2개 → 4개 → 총 7개 타격 (기하급수적)
  - shard_count 같은 수량 노드가 의무 투자로 격상
  - 화면이 파편으로 뒤덮이는 시각적 임팩트
  - 구현 안전장치: gen ≤ 3 하드캡으로 프레임 드롭 방지
```

#### Tier 4 (3 노드)
| ID | 이름 | 효과 |
|---|---|---|
| `shard_pierce` | 파편 관통 | 파편이 적 관통 +1/랭크 (소멸 X) |
| `shard_crit_dmg` | 파편 치명 | 파편 크리 배율 +0.2/랭크 |
| `shard_absorb` | 잔여 수거 | 미적중 파편 소멸 시 본체 HP +1/랭크 |

#### ⭐ Tier 5 Breakpoint
```
🔷 "파편 공명" (shard_resonance)
  효과: 파편 2개가 공중에서 10px 이내로 근접 시
        → 융합하여 "에너지 구체" 생성
        → 구체: 3배 크기, 기본 dmg ×5, 관통, 수명 2초
        → 구체끼리도 공명 가능 (더 큰 구체)
  maxRank: 1
  prereqs: [shard_pierce, shard_crit_dmg]
  
  왜 극적인가:
  - 파편 많을수록 공명 확률↑ → 수량 노드 재평가
  - 구체가 생성되는 순간의 비주얼 쾌감 (청백→보라로 변환)
  - "배치 전략" 이라는 새로운 축 등장
  - T3 분열과 조합 시 화면 전체가 파편-구체 춤
```

#### Tier 6 (2 노드)
| ID | 이름 | 효과 |
|---|---|---|
| `shard_crit_chain` | 연쇄 치명 | 크리 적중 시 파편 +3 추가 생성 |
| `orb_boost` | 구체 증폭 | 공명 구체 dmg +25%/랭크 |

#### ⭐ Tier 7 Keystone (택 1)

**KS-F1: 🎆 "파편 폭발" (ks_shard_burst) — 🌟 원본 비전**
```
- 파편이 적 적중 시 소멸 대신 그 자리에서 폭발 (반경 60px)
- 폭발은 또 작은 파편 3개 생성 (재분열)
- 키워드: "연쇄가 멈추지 않는다"
- 트레이드오프: 본체 클릭 dmg -30%
```

**KS-F2: ⚡ "번개 해체" (ks_lightning_deconstruct)**
```
- 본체 기본 공격 완전 사라짐 (클릭/자동 모두)
- 모든 공격이 파편 형태로만 발사
- 파편 기본 dmg ×3, 수 ×2
- 키워드: "나는 파편이다"
```

**KS-F3: 💠 "코어 분할" (ks_core_split)**
```
- 본체 코어가 3개로 분할 (삼각 배치)
- 각 코어가 독립적으로 자동 공격
- 최대 HP ×1/3
- 파편 생성량 ×3 (각 코어에서)
- 키워드: "나는 세 명이다"
```

---

## 5. Breakpoint 배치 매트릭스

```
           T1      T2      T3⭐       T4      T5⭐         T6      T7⭐⭐⭐
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗡️ 낙뢰    4필러   3필러   관통경지   3보강   처형경지     2지원   3 KS (택1)
🌩️ 폭풍    4필러   3필러   연쇄각성   3보강   폭풍의눈     2지원   3 KS (택1)
🌀 파편    4필러   3필러   연쇄분열   3유틸   파편공명     2응용   3 KS (택1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            12P     9P      1P       9P      1P          10P     1P
누적        12      21     22      31     32         42      43
게이트      0       3       6       9      12          15     20
```

- 각 트리 Breakpoint 3개 (T3/T5/T7) × 3트리 = **9 Breakpoint**
- T1~T2 필러는 "Breakpoint를 위한 투자" 성격 (투자량으로 T3 개방)
- T4 노드는 T3 Breakpoint를 강화하는 형태로 설계
- T6 노드는 T5 Breakpoint 뒷받침

---

## 6. 파편 시스템 기술 명세

### 6.1 데이터 구조
```js
// G 객체에 추가
G.shards = [];  // 활성 파편 배열

// 파편 객체
{
  id: number,          // 고유 ID
  x: number, y: number, // 현재 위치
  vx: number, vy: number, // 속도 벡터
  damage: number,      // 피해량
  life: number,        // 남은 수명 (초, 0 되면 소멸)
  maxLife: number,     // 최대 수명 (꼬리 알파용)
  generation: number,  // 분열 세대 (0=원본, 최대 3)
  isOrb: boolean,      // 공명 구체 여부 (T5)
  pierce: number,      // 남은 관통 횟수 (T4)
  targetId: number|null, // 유도 대상 적 ID
  color: string,       // 렌더링 색상
}
```

### 6.2 생성 함수
```js
function createShard(x, y, damage, options = {}) {
  const {
    direction = Math.random() * Math.PI * 2,
    speed = 3,
    generation = 0,
    isOrb = false,
    targetEnemy = null,
  } = options;
  
  G.shards.push({
    id: ++G._shardIdCounter,
    x, y,
    vx: Math.cos(direction) * speed,
    vy: Math.sin(direction) * speed,
    damage,
    life: isOrb ? 2.0 : (1.0 + upLv('shard_life') * 0.3),
    maxLife: isOrb ? 2.0 : (1.0 + upLv('shard_life') * 0.3),
    generation,
    isOrb,
    pierce: upLv('shard_pierce') || 0,
    targetId: targetEnemy ? targetEnemy.id : null,
    color: isOrb ? '#ff88ff' : '#ffee88',
  });
  
  // 동시 상한 (성능 안전장치)
  if (G.shards.length > 200) G.shards.shift();
}
```

### 6.3 매 프레임 업데이트
```js
function updateShards(dt) {
  const cx = gameCanvas.width / 2 / dpr;
  const cy = gameCanvas.height / 2 / dpr;
  
  for (let i = G.shards.length - 1; i >= 0; i--) {
    const s = G.shards[i];
    
    // 수명 감소
    s.life -= dt;
    if (s.life <= 0) {
      // T4: 잔여 수거
      if (upLv('shard_absorb') > 0) {
        G.hp = Math.min(G.maxHp, G.hp + upLv('shard_absorb'));
      }
      G.shards.splice(i, 1);
      continue;
    }
    
    // 유도 (T2 shard_range)
    const homing = upLv('shard_range') * 0.2;
    if (homing > 0) {
      const target = findNearestEnemy(s.x, s.y);
      if (target) {
        const dx = target.x - s.x, dy = target.y - s.y;
        const d = Math.hypot(dx, dy) || 1;
        s.vx = s.vx * (1 - homing) + (dx / d) * 3 * homing;
        s.vy = s.vy * (1 - homing) + (dy / d) * 3 * homing;
      }
    }
    
    // 이동
    const speedMult = 1 + upLv('shard_speed') * 0.15;
    s.x += s.vx * speedMult;
    s.y += s.vy * speedMult;
    
    // 적 충돌 판정
    for (const e of G.enemies) {
      if (e.hp <= 0) continue;
      const d = Math.hypot(e.x - s.x, e.y - s.y);
      if (d < e.size * 0.8) {
        // 데미지 (파편 크리 판정)
        let dmg = s.damage;
        const critChance = upLv('shard_crit') * 0.03;
        if (Math.random() < critChance) {
          dmg = Math.ceil(dmg * (3 + upLv('shard_crit_dmg') * 0.2));
          // T6: 연쇄 치명
          if (upLv('shard_crit_chain') > 0) {
            for (let k = 0; k < 3; k++) {
              createShard(e.x, e.y, s.damage * 0.5);
            }
          }
        }
        damageEnemy(e, dmg);
        
        // 관통 처리
        if (s.pierce > 0) {
          s.pierce--;
          break;  // 이 프레임은 한 적만
        }
        
        // 분열 (T3 Breakpoint)
        if (upLv('shard_split') > 0 && s.generation < 3 && !s.isOrb) {
          for (let k = 0; k < 2; k++) {
            createShard(s.x, s.y, s.damage * 0.5, {
              direction: Math.random() * Math.PI * 2,
              generation: s.generation + 1,
            });
          }
        }
        
        // 폭발 Keystone (ks_shard_burst)
        if (hasKeystone('ks_shard_burst')) {
          addShockwave(s.x, s.y, '#ffcc44', 60);
          G.enemies.forEach(e2 => {
            if (e2.hp > 0 && Math.hypot(e2.x - s.x, e2.y - s.y) < 60) {
              damageEnemy(e2, Math.floor(s.damage * 0.3));
            }
          });
          for (let k = 0; k < 3; k++) {
            createShard(s.x, s.y, s.damage * 0.3);
          }
        }
        
        G.shards.splice(i, 1);
        break;
      }
    }
    
    // 공명 체크 (T5 Breakpoint)
    if (upLv('shard_resonance') > 0 && !s.isOrb) {
      for (let j = i - 1; j >= 0; j--) {
        const s2 = G.shards[j];
        if (s2.isOrb) continue;
        const d = Math.hypot(s.x - s2.x, s.y - s2.y);
        if (d < 10) {
          // 융합!
          createShard((s.x + s2.x) / 2, (s.y + s2.y) / 2, 
            (s.damage + s2.damage) * 5, { isOrb: true });
          G.shards.splice(i, 1);
          G.shards.splice(j, 1);
          break;
        }
      }
    }
  }
}
```

### 6.4 렌더링
```js
function renderShards(ctx) {
  for (const s of G.shards) {
    const alpha = Math.min(1, s.life / s.maxLife);
    const size = s.isOrb ? 12 : (s.generation === 0 ? 4 : 3 - s.generation);
    
    // 꼬리 (단순 fade trail)
    ctx.globalAlpha = alpha * 0.4;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x - s.vx, s.y - s.vy, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
    
    // 본체
    ctx.globalAlpha = alpha;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // 공명 구체: 글로우
    if (s.isOrb) {
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, size * 2);
      g.addColorStop(0, s.color);
      g.addColorStop(1, 'transparent');
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, size * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
```

### 6.5 트리거 포인트
| 이벤트 | 조건 | 생성 파편 수 |
|---|---|---|
| 적 처치 | `shard_basic` 랭크≥1 | `upLv('shard_count')` |
| 크리 적중 | `shard_crit_chain` 랭크≥1 | 3 |
| 파편 적중 | `shard_split` 켜짐, gen<3 | 2 |
| 파편 소멸 | `shard_absorb` 랭크≥1 | - (HP 회복) |
| 파편 충돌 | `shard_resonance` 켜짐 | -2, +1 구체 |
| Keystone 폭발 | `ks_shard_burst` + 파편 적중 | 3 + 반경 폭발 |

---

## 7. 시각 디자인 가이드

### 7.1 색 팔레트 (계층 구분)
| 요소 | 색 | 용도 |
|---|---|---|
| 본체 번개 | `#88ccff` 청백 | 클릭·자동 공격 |
| 파편 (원본) | `#ffee88` 노란-청 | shard_basic 생성 |
| 분열 파편 | `#ffcc66` 주황 | gen ≥ 1 |
| 공명 구체 | `#ff88ff` 핑크-보라 | T5 fusion |
| 키스톤 효과 | `#ff44cc` 진홍보라 | ks_shard_burst 폭발 |

### 7.2 크기 계층
```
본체 번개 굵기:     3~8 px (진화별)
파편 (gen 0):       4~5 px
파편 (gen 1):       3 px
파편 (gen 2+):      2 px
공명 구체:          12~15 px (특별함 강조)
```

### 7.3 혼잡도 제어
- 파편 동시 상한 **200개** (성능 + 가독성)
- 파편 수명 최대 **2.5초** (잔해 누적 방지)
- 분열 세대 최대 **3 gen** (이론상 최대 1→2→4→8)
- 화면 하단에 **활성 파편 수 인디케이터** 표시 (선택)

### 7.4 이펙트 추가
- 파편 소멸 시: 작은 점 3개 흩어짐 (파티클)
- 공명 생성 시: 섬광 + 파편 둘이 빨려 들어가는 0.15초 애니
- Keystone 폭발 시: 작은 충격파 + 화면 미세 셰이크

---

## 8. 기존 노드 마이그레이션 맵 (v3 → v4)

### 8.1 유지 (이름·효과 그대로)
`damage`, `click_amp`, `quick`, `bolt_size`, `crit`, `double_tap`, `precision`, `crit_dmg`, `boss_hunter`, `weak_point`, `execute`, `rage`, `final_strike` → **낙뢰 트리**

`auto`, `auto_acc`, `range`, `chain`, `auto_dmg`, `chain_dmg`, `chain_range`, `chain_crit`, `rapid_fire`, `field_expand`, `emp`, `surge` → **폭풍 트리**

### 8.2 신규 (파편 트리 전용)
`shard_basic`, `shard_damage`, `shard_count`, `shard_life`, `shard_speed`, `shard_range`, `shard_crit`, `shard_pierce`, `shard_crit_dmg`, `shard_absorb`, `shard_crit_chain`, `orb_boost`, `shard_split` (T3), `shard_resonance` (T5)

### 8.3 Breakpoint 신규
`penetration_mastery` (낙뢰 T3), `execution_mastery` (낙뢰 T5),
`chain_awakening` (폭풍 T3), `storm_eye` (폭풍 T5 - 이름 유지, 효과 확장),
`shard_split` (파편 T3), `shard_resonance` (파편 T5)

### 8.4 키스톤 재배치 (9개)
| v3 키스톤 | → | v4 위치 | 비고 |
|---|---|---|---|
| `ks_berserker` | → | 낙뢰 T7 | 유지 |
| `ks_click_master` | → | 낙뢰 T7 | `ks_thunder_avatar`로 리뉴얼 |
| (신규) `ks_clickmaster` | → | 낙뢰 T7 | 천벌의 지배자 |
| `ks_immortal` | → | 폭풍 T7 | 유지 |
| `ks_storm_lord` | → | 폭풍 T7 | `ks_storm_heart`로 리뉴얼 |
| `ks_timelord` | → | 폭풍 T7 | util → 폭풍으로 이동 |
| `ks_glass_cannon` | → | **삭제** | HP=1 고정은 혼란 유발 |
| `ks_void` | → | **삭제** | 파편 트리가 대체 |
| `ks_collector` | → | **삭제** | XP 3배는 메타 시스템과 중복 |
| (신규) `ks_shard_burst` | → | 파편 T7 | 파편 폭발 |
| (신규) `ks_lightning_deconstruct` | → | 파편 T7 | 번개 해체 |
| (신규) `ks_core_split` | → | 파편 T7 | 코어 분할 |

### 8.5 폐기·이동
- **util 트리 전체** → 해체
  - XP 관련 노드(`harvest`, `energy_flat`, `fortune`, `elite_hunter`, `bonus_wave`) → **메타 업그레이드 또는 보스 스킬**로 이전
  - `vampiric`, `absorption`, `titan_guard` → 낙뢰/폭풍 T6 지원 노드로 편입
  - `magnet_pull` → 파편 트리 T4 파생 효과로 흡수 (또는 삭제)
- **SKILL_POOL 일부 정리**:
  - `bounty`, `lucky` → 메타 업그레이드로 편입 (기존 XP 2배 효과)
  - `fortress`, `absorb` → 폐기 (T6 지원 노드와 중복)

---

## 9. 구현 로드맵 (Phase 단위)

> 각 Phase는 git worktree에서 독립 브랜치로 작업. "작게, 자주 검증" 원칙.

### Phase 1: 파편 엔진 프로토타입 (1 세션, 2~3시간)
**목표**: 화면에 파편 튀기기만 되면 성공.
- [ ] `G.shards = []` 추가
- [ ] `createShard()` 함수 구현
- [ ] `updateShards(dt)` 프레임 루프 통합
- [ ] `renderShards(ctx)` 렌더링
- [ ] 임시 트리거: 적 처치 시 파편 3개 랜덤 방향 발사
- [ ] **체감 테스트**: "오, 뭔가 튕겨나가네" 정도면 OK

**Gate**: 직접 플레이 후 재미 판정. 별로면 컨셉 재고.

### Phase 2: 분열 시스템 (1 세션)
**목표**: T3 Breakpoint "연쇄 분열" 체감.
- [ ] `shard.generation` 필드 활용
- [ ] `MAX_GENERATION = 3` 하드캡
- [ ] 적 적중 시 분열 로직
- [ ] 분열 파편 크기/데미지 감소

**Gate**: "화면 전체에 파편이 퍼진다!" 감탄이 나오면 OK.

### Phase 3: 공명 시스템 (1 세션)
**목표**: T5 Breakpoint "파편 공명" 체감.
- [ ] 파편끼리 거리 체크
- [ ] 융합 시 구체 생성 (isOrb=true)
- [ ] 구체 전용 렌더링 (글로우)
- [ ] 구체끼리도 공명 가능

**Gate**: 우연히 공명이 발생할 때 비주얼 쾌감 확인.

### Phase 4: 트리 노드 통합 (1~2 세션)
**목표**: 파편 트리 21노드를 `TREE_NODES`에 추가.
- [ ] `tree.js`에 파편 노드 21개 정의
- [ ] Tier Gate 공식 파편 트리에도 적용
- [ ] 파편 관련 `upLv()` 체크를 `updateShards`에 반영
- [ ] UI: 트리 팝업에서 파편 트리 탭 추가

**Gate**: 트리 UI에서 파편 트리 찍어보기, 각 노드 효과 확인.

### Phase 5: 낙뢰 트리 리팩토링 (1 세션)
**목표**: 기존 atk 트리를 "클릭 전용"으로 재설계.
- [ ] 필러 노드 정리 (T1~T2 유지)
- [ ] T3 Breakpoint `penetration_mastery` 추가
- [ ] T5 Breakpoint `execution_mastery` 추가
- [ ] T7 키스톤 3개 재배치

### Phase 6: 폭풍 트리 리팩토링 (1 세션)
**목표**: 기존 def 트리를 "자동 전용"으로 재설계.
- [ ] chain/auto 관련 노드 이동
- [ ] T3 Breakpoint `chain_awakening` 추가
- [ ] T5 Breakpoint `storm_eye` 확장 (기존 노드 재활용)
- [ ] T7 키스톤 3개 재배치

### Phase 7: util 트리 해체 및 마이그레이션 (1~2 세션)
**목표**: XP 관련 노드를 메타로 이전.
- [ ] `harvest`, `fortune` 등 META_UPGRADES로 편입
- [ ] 영향받는 기존 세이브 마이그레이션 함수 작성
- [ ] util 트리 노드 완전 삭제 또는 파편/낙뢰/폭풍으로 재분류

### Phase 8: 밸런스 패스 + 체감 조정 (2~3 세션)
**목표**: 9 Breakpoint가 실제로 "와우" 모먼트인지 검증.
- [ ] 각 Breakpoint 찍기 전/후 플레이 영상 녹화
- [ ] 무력한 Breakpoint는 수치 상향 또는 효과 재설계
- [ ] 3가지 빌드(클릭올인/자동올인/파편올인) 각각 웨이브 50까지 클리어 가능 확인

### Phase 9: 시각 폴리싱 (1~2 세션)
- [ ] 파편 꼬리 이펙트
- [ ] 공명 생성 시 섬광
- [ ] 키스톤별 시그니처 비주얼 (ks_shard_burst 폭발, ks_core_split 3분할)
- [ ] 화면 하단 활성 파편 수 인디케이터

### 총 예상 기간
- **최소 9 세션 (9 Phase)**
- 세션당 2~3시간 가정 → **18~27 시간**
- 주말 취미 기준 **약 1개월**

---

## 10. 밸런스 체크포인트

### 10.1 Phase별 게이트 기준
| Phase | 통과 조건 |
|---|---|
| 1 | 파편이 화면에 보이고 적을 타격 |
| 2 | 파편 분열이 "오!" 모먼트가 됨 |
| 3 | 공명 구체가 생성될 때 감탄 |
| 4 | 트리 UI에서 파편 트리 찍기 가능 |
| 5~7 | 세 트리 각각 10 포인트 찍고 웨이브 10 클리어 |
| 8 | 세 빌드 모두 웨이브 30 클리어 가능 |

### 10.2 숫자 안전장치
- 파편 동시 상한 200
- 분열 세대 최대 3
- 공명 구체 상한 20
- FPS 모니터링 (개발자 모드) — 60 FPS 유지

### 10.3 빌드별 강도 검증
```
낙뢰 올인 웨이브 30 클리어 시간: 목표 3~4분
자동 올인 웨이브 30 클리어 시간: 목표 4~5분 (느긋함)
파편 올인 웨이브 30 클리어 시간: 목표 2~3분 (폭발력)
```
어느 하나가 압도적으로 빠르면 너프, 느리면 버프.

---

## 11. 파일 변경 계획

### 11.1 신규 생성
- `js/shards.js` — 파편 엔진 전체 (createShard, updateShards, renderShards)
- `docs/BREAKPOINT_DESIGN.md` — 각 Breakpoint의 설계 의도와 수치 근거

### 11.2 주요 수정
| 파일 | 수정 내용 | 예상 변경 라인 |
|---|---|---|
| `js/tree.js` | TREE_NODES 완전 재작성 (65→63), Breakpoint 노드 9개 추가 | ~+200 |
| `js/config.js` | SKILL_POOL 일부 정리, 파편 관련 locale 키 추가 | ~+30 |
| `js/game.js` | `recalcStats()` 키스톤 로직 확장, shard Keystone 효과 | ~+150 |
| `js/main.js` | 프레임 루프에 `updateShards(dt)` 삽입 | ~+20 |
| `js/render.js` | `renderShards(ctx)` 호출 삽입 | ~+10 |
| `js/ui.js` | 트리 탭 UI에 파편 트리 추가 (3 탭 구조 유지) | ~+50 |
| `js/locales.js` | 파편 노드 이름/설명 ko/en 추가 | ~+120 |

### 11.3 세이브 마이그레이션
```js
// main.js loadGame() 에 추가
if (save.version < 4) {
  // util 트리 노드를 적절히 이전
  if (save.upgrades.harvest) {
    save.metaUpgrades = save.metaUpgrades || {};
    save.metaUpgrades.m_xp = (save.metaUpgrades.m_xp || 0) + 
                              Math.min(5, save.upgrades.harvest.level);
    delete save.upgrades.harvest;
  }
  // ... fortune, energy_flat 등도 동일
  save.version = 4;
}
```

---

## 12. 리스크 및 대응

| 리스크 | 가능성 | 영향 | 대응 |
|---|:---:|:---:|---|
| 파편 엔진 프로토타입이 재미없음 | 중 | 치명 | Phase 1에서 바로 판정, 별로면 컨셉 재설계 |
| 화면 혼잡으로 가독성 붕괴 | 중 | 대 | 색 구분, 수 상한, 크기 계층, 꼬리 최소화 |
| FPS 드롭 (파편 많을 때) | 중 | 중 | 200개 하드캡, 분열 세대 3 하드캡, 프로파일링 |
| 밸런스 패스 장기화 | 높 | 중 | Phase 8 예산 2~3세션으로 제한, 이후는 라이브 패치 |
| 세이브 깨짐 | 중 | 대 | 버전 필드 + 마이그레이션 함수, 실패 시 백업 복원 |
| 세 빌드 중 하나가 압도적 강함 | 높 | 중 | Phase 8에서 필수 검증, 너프 먼저 |
| 취미 시간 부족으로 중단 | 중 | 대 | Phase 1~3만 완성해도 독립적으로 재미있는 게임이 됨 (파편 프로토타입 자체가 즐거움) |

---

## 13. 의사결정 포인트 (확정 필요)

리팩토링 시작 전 확정 필요한 질문들:

1. **파편 트리 Keystone 3개 모두 넣을 것인가?**
   - 권장: 전부 넣기 (상호 배타로 빌드 다양성 확보)
   
2. **util 트리를 완전 삭제할 것인가, 아니면 축소해서 유지할 것인가?**
   - 권장: 완전 삭제 → XP/편의성 노드는 메타 프로그레션으로 이전

3. **SKILL_POOL 30종은 어떻게 할 것인가?**
   - 권장: 20종으로 축소 + 트리와 명확히 다른 역할(보스 드랍 보상)로 유지

4. **파편 트리 네이밍 최종 선택**
   - 후보: 파편 / 방출 / 산란 / 분열 / 잔광 / 폭산
   - 권장: **"파편" 또는 "방출"** (SF 톤 유지)

5. **기존 세이브 호환성 vs 완전 초기화**
   - 권장: 마이그레이션 함수로 최대한 호환, 깨지면 자동 리셋

6. **Phase 1 프로토타입 테스트 후 "재미없음" 판정 시 플랜 B?**
   - 옵션 A: 2-Tree 구조로 축소 (클릭 + 자동만)
   - 옵션 B: 파편 → 영역/룬 시스템으로 전환
   - 권장: **Phase 1 끝나고 결정** (지금 미리 정하지 말 것)

---

## 14. 시작점 — 다음 세션 체크리스트

**즉시 착수 가능한 최소 작업**:
1. [ ] `F:/MoneyPJ/01/Second/.claude/worktrees/` 에 새 워크트리 생성 (`v4-shards`)
2. [ ] `js/shards.js` 파일 생성
3. [ ] `G.shards = []` + `_shardIdCounter = 0` 상태 추가
4. [ ] `createShard(x, y, damage, options)` 구현 (50줄 이내)
5. [ ] `updateShards(dt)` 기본 버전 구현 (수명·이동·충돌만, 50줄 이내)
6. [ ] `renderShards(ctx)` 기본 점 렌더링 (20줄 이내)
7. [ ] `main.js`의 게임 루프에 `updateShards(dt)` / `renderShards(ctx)` 호출 삽입
8. [ ] `damageEnemy()` 처치 후 임시로 `createShard()` 3회 호출
9. [ ] 브라우저에서 플레이하며 확인

**총 코드 약 150줄, 예상 2~3시간.**

이 1개 세션의 결과가 v4 전체 계획의 Go/No-Go를 결정한다.

---

## 15. 요약 대시보드

| 지표 | v3 (현재) | **v4 (목표)** |
|---|---:|---:|
| 트리 총 노드 | 65 | **63** |
| 트리 개수 | 3 (atk/def/util) | **3 (낙뢰/폭풍/파편)** |
| Breakpoint 노드 | 0 (키스톤 외) | **6 + 9 키스톤 = 15** |
| T3/T5 Breakpoint | 0 | **6 (트리당 2개)** |
| 키스톤 총 | 7 | **9 (트리당 3개)** |
| 신규 시스템 | - | **파편 엔진** |
| 시그니처 빌드 | 모호 | **3가지 명확** (클릭/자동/파편) |
| 세계관 일관성 | 혼재 | **SF 통일** |
| 예상 작업량 | - | **9 Phase, 약 1개월** |
| 리스크 관리 | - | **Phase 1 Gate로 조기 중단 가능** |

---

## 부록 A: 대화 맥락 요약

이 계획서는 다음 설계 토론을 바탕으로 작성됨:
1. "v3의 극적 순간 부재" 진단 → Breakpoint 개념 도입
2. 3-Tree 중 세 번째 정체성 고민 (7개 축 후보 검토)
3. 건담 핀판넬 레퍼런스 → "파편" 컨셉 확정
4. "정령"은 세계관 충돌 → "파편"으로 단일화
5. T1~T7 성장 서사 "생성→증가→자가증식→지능화→시너지→통합→변환"
6. 시각 디자인 가이드 (색 계층, 크기 계층, 혼잡도 제어)
7. 구현 로드맵 Phase 1 "프로토타입 먼저" 원칙 합의

## 부록 B: 실행 선언

> "머리로 설계하다 보면 끝이 없으니, Week 1의 '튕겨나가는 파편 1개' 부터 만들어보고 거기서 출발한다."
> — 대화 최종 합의 2026-04-20
