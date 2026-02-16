---
name: verify-js-deps
description: JS 파일 간 전역 함수/변수 참조 무결성을 검증합니다. 함수 추가/삭제/이름 변경 후 사용.
---

# JS 의존성 검증

## Purpose

1. JS 파일 간 전역 함수/변수 참조가 실제 정의와 일치하는지 검증
2. 스크립트 로딩 순서가 의존성 방향을 위반하지 않는지 검증
3. `hasSkill()` 호출에 사용되는 스킬 ID가 `SKILL_POOL`에 존재하는지 검증
4. `G` 객체에서 사용되는 속성이 초기 선언에 존재하는지 검증

## When to Run

- 전역 함수/변수를 추가, 삭제, 이름 변경한 후
- `SKILL_POOL`에 새 스킬을 추가하거나 ID를 변경한 후
- `index.html`의 스크립트 로딩 순서를 변경한 후
- `G` 객체에 새 상태 속성을 추가한 후

## Related Files

| File | Purpose |
|------|---------|
| `index.html` | 스크립트 로딩 순서 정의 |
| `js/sound.js` | SFX 클래스 및 `sfx` 인스턴스 정의 |
| `js/config.js` | `EVOLUTIONS`, `SKILL_POOL` 상수 정의 |
| `js/game.js` | `G` 게임 상태, 유틸 함수, 전투 시스템 정의 |
| `js/render.js` | 캔버스 요소, 렌더링/이펙트 함수 정의 |
| `js/ui.js` | UI 함수 (스킬 선택, 업그레이드, 웨이브 팝업) 정의 |
| `js/main.js` | 게임 루프, 이벤트, 세이브/로드, 초기화 정의 |

## Workflow

### Step 1: 스크립트 로딩 순서 확인

**파일:** `index.html`

**검사:** 스크립트 태그의 순서가 의존성 방향과 일치하는지 확인합니다.

올바른 순서: sound.js -> config.js -> game.js -> render.js -> ui.js -> main.js

```bash
grep -n "src=\"js/" index.html
```

**PASS:** 위 순서대로 6개 스크립트가 로드됨
**FAIL:** 순서가 다르거나 파일이 누락됨

### Step 2: hasSkill() 호출 ID 검증

**파일:** `js/config.js`, `js/game.js`, `js/render.js`, `js/ui.js`, `js/main.js`

**검사:** `hasSkill('...')` 호출에 사용된 모든 ID가 `SKILL_POOL`의 `id` 필드에 존재하는지 확인합니다.

1. `js/config.js`에서 `SKILL_POOL`의 모든 `id` 값을 추출합니다:

```bash
grep -oP "id:'[^']+'" js/config.js
```

2. 모든 JS 파일에서 `hasSkill('...')` 호출을 추출합니다:

```bash
grep -ohP "hasSkill\('[^']+'\)" js/*.js
```

3. 두 목록을 비교하여 `SKILL_POOL`에 없는 ID가 `hasSkill()`에서 사용되는지 확인합니다.

**PASS:** 모든 `hasSkill()` 호출의 ID가 `SKILL_POOL`에 존재
**FAIL:** `SKILL_POOL`에 없는 ID로 `hasSkill()`을 호출
**수정:** 누락된 ID를 `SKILL_POOL`에 추가하거나, 오타를 수정

### Step 3: upLv() 호출 ID 검증

**파일:** `js/config.js`, `js/game.js`, `js/render.js`, `js/ui.js`, `js/main.js`

**검사:** `upLv('...')` 호출에 사용된 모든 ID가 `UPGRADE_POOL`의 `id` 필드에 존재하는지 확인합니다.

1. `js/config.js`에서 `UPGRADE_POOL`의 모든 `id` 값을 추출합니다:

```bash
grep -oP "id:'[^']+'" js/config.js | grep -v "SKILL_POOL" | sort -u
```

2. 모든 JS 파일에서 `upLv('...')` 호출을 추출합니다:

```bash
grep -ohP "upLv\('[^']+'\)" js/*.js | sort -u
```

3. 두 목록을 비교하여 `UPGRADE_POOL`에 없는 ID가 `upLv()`에서 사용되는지 확인합니다.

**PASS:** 모든 `upLv()` 호출의 ID가 `UPGRADE_POOL`에 존재
**FAIL:** `UPGRADE_POOL`에 없는 ID로 `upLv()`를 호출
**수정:** 누락된 ID를 `UPGRADE_POOL`에 추가하거나, 오타를 수정

### Step 4: 전역 함수 참조 무결성

**파일:** 모든 `js/*.js` 파일

**검사:** 각 파일에서 호출하는 전역 함수가 이전 로딩 순서의 파일에 정의되어 있는지 확인합니다.

핵심 전역 함수 매핑:

| 정의 파일 | 함수 |
|-----------|------|
| `js/sound.js` | `sfx` (인스턴스) |
| `js/config.js` | `EVOLUTIONS`, `SKILL_POOL`, `UPGRADE_POOL` |
| `js/game.js` | `G`, `formatNum`, `evoColor`, `getCost`, `hasSkill`, `zapBolts`, `getWaveType`, `getWaveConfig`, `spawnEnemy`, `damageEnemy`, `killEnemy`, `strikeEnemy`, `createZapBolt`, `autoAttack` |
| `js/render.js` | `gameCanvas`, `ctx`, `fxCanvas`, `fxCtx`, `bgCanvas`, `bgCtx`, `dpr`, `fxEffects`, `frameCount`, `stars`, `resize`, `render`, `renderFx`, `renderBg`, `initOrbitals`, `addShockwave`, `addSparks`, `addExplosion`, `showFloatText`, `screenFlash`, `screenShake` |
| `js/ui.js` | `showSkillSelection`, `selectSkill`, `updateSkillDisplay`, `updateUI`, `buyUpgrade`, `showWavePopup`, `checkEvolution` |
| `js/main.js` | `gameLoop`, `update`, `startWave`, `waveClear`, `gameOver`, `resetGame`, `handleClick`, `saveGame`, `loadGame`, `initEvents`, `init` |

각 파일에서 위 함수 호출을 검색하여 정의 파일보다 앞서 로드되는 파일에서 호출하지 않는지 확인합니다.

**PASS:** 모든 함수 호출이 정의 파일 이후에 로드되는 파일에서만 발생
**FAIL:** 정의 파일보다 먼저 로드되는 파일에서 함수를 호출
**수정:** 함수 정의를 적절한 파일로 이동하거나 로딩 순서를 변경

### Step 5: G 객체 속성 무결성

**파일:** `js/game.js` (정의), 모든 `js/*.js` (사용)

**검사:** `G.xxx` 형태로 참조되는 속성이 `G` 객체 초기 선언에 존재하거나 런타임에 추가되는 것이 의도된 것인지 확인합니다.

1. `G` 객체 선언에서 모든 속성 키를 추출합니다:

```bash
grep -oP "G\.\w+" js/game.js | head -30
```

2. 모든 JS 파일에서 `G.xxx` 참조를 추출합니다:

```bash
grep -oP "G\.\w+" js/*.js | sort -u
```

3. 선언에 없는 새 속성이 사용되는 경우, 해당 파일에서 적절히 초기화되는지 확인합니다.

**PASS:** 모든 `G.xxx` 참조가 초기 선언 또는 명시적 초기화와 일치
**FAIL:** 선언되지 않고 초기화도 없는 `G.xxx` 참조 존재
**수정:** `G` 객체 초기 선언에 속성을 추가하거나, `resetGame()`에 초기화 추가

## Output Format

```markdown
| # | 검사 | 상태 | 상세 |
|---|------|------|------|
| 1 | 로딩 순서 | PASS/FAIL | ... |
| 2 | hasSkill ID | PASS/FAIL | 불일치 N개 |
| 3 | upLv ID | PASS/FAIL | 불일치 N개 |
| 4 | 함수 참조 | PASS/FAIL | 미정의 함수 N개 |
| 5 | G 속성 | PASS/FAIL | 미선언 속성 N개 |
```

## Exceptions

1. **DOM API 호출** — `document.getElementById()` 등 브라우저 내장 API는 검증 대상이 아님
2. **콜백 내부 참조** — `setTimeout`, `addEventListener` 내부에서 참조하는 함수는 실행 시점에 이미 정의되어 있으므로 로딩 순서 위반이 아님
3. **적 객체의 동적 속성** — `spawnEnemy()`에서 적 객체에 추가되는 속성(예: `e.dodgeTimer`, `e.phased`)은 `G` 객체 검증 대상이 아님
4. **`_splashActive` 등 모듈 내부 플래그** — 파일 내부에서만 사용되는 `_` 접두사 변수는 교차 파일 검증 불필요