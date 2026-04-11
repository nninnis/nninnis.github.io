---
layout: post
title: "Claude Code 소스 유출로 드러난 하네스 엔지니어링"
date: 2026-04-12
category: claude-code
---

2026년 3월 31일, Anthropic이 실수 하나로 Claude Code의 내부를 통째로 공개했다.

---

## 어떻게 유출됐나

원인은 단순하다. `@anthropic-ai/claude-code` v2.1.88 npm 패키지에 59.8MB짜리 JavaScript 소스맵 파일(`cli.js.map`)이 그대로 포함됐다. Bun 런타임은 기본적으로 소스맵을 생성한다. 누군가 `.npmignore`에 `*.map` 한 줄을 빠뜨렸다.

소스맵은 Anthropic의 Cloudflare R2 버킷에 공개 상태로 올라가 있었다. Solayer Labs 인턴 Chaofan Shou가 X에 올리고 몇 시간 만에 전 세계에 퍼졌다. 512,000줄, 1,906개 파일의 TypeScript 코드베이스 전체가 GitHub에 미러됐다. 포스트는 2,800만 뷰를 넘겼다. Claude Code 헤드 엔지니어 Boris Cherny는 "단순 개발자 실수"라고 인정했다.

참고로 이게 두 번째다. 첫 번째는 Claude Code 출시일(2025년 2월 24일)에도 같은 방식으로 인라인 소스맵이 유출됐다.

---

## 지금 소스코드를 볼 수 있나

결론부터: **직접 다운로드나 GitHub 미러는 권장하지 않는다.** 이유는 아래에 있다.

### 접근 방법별 현황

**GitHub 미러** — Anthropic이 DMCA 발송을 시작했다. 84,000 스타, 82,000 포크까지 갔던 원본 저장소와 포크 네트워크 8,100개 이상이 내려갔다. 아직 살아있는 미러가 있지만 법적으로 회색 지대다.

**시스템 프롬프트** — 소스코드 전체가 아닌 시스템 프롬프트만 따로 정리한 저장소는 남아있다. `asgeirtj/system_prompts_leaks` 리포가 대표적이다. 아키텍처 분석 목적이라면 이 쪽이 낫다.

**분석 아티클** — 가장 안전한 방법이다. Engineers Codex, Alex Kim's blog, Sabrina.dev 등에서 핵심 내용을 이미 분석했다. 직접 소스를 받지 않아도 설계를 파악하는 데 충분하다.

### 리스크

**보안 리스크가 심각하다.**

유출이 퍼진 지 24시간도 안 돼 "leaked Claude Code source"를 검색하면 악성 저장소가 상위에 뜨기 시작했다. 그럴듯한 README, 가짜 다운로드 버튼, GitHub Releases에 올린 트로이목마 아카이브. `ClaudeCode_x64.exe` 형태의 Rust 드로퍼를 실행하면 **Vidar Stealer**와 **GhostSocks** 악성코드가 설치된다. Zscaler와 Trend Micro가 이 캠페인을 공식 분석했다.

별도의 공급망 공격도 있었다. **3월 31일 00:21~03:29 UTC 사이에 npm으로 Claude Code를 설치하거나 업데이트했다면** axios 악성 버전(1.14.1 또는 0.30.4)이 같이 설치됐을 수 있다. 이 버전에는 RAT(원격 접근 트로이목마)가 포함돼 있다.

npm 타이포스쿼팅도 발생했다. 유출 소스를 직접 빌드하려는 사람을 노리고, 내부 패키지명을 선점한 빈 스텁 패키지들이 등록됐다. 이후 악성 업데이트를 푸시하는 방식이다.

**법적 리스크도 있다.** Anthropic은 적극적으로 DMCA를 발송 중이다. 미러를 직접 호스팅하면 저작권 침해 위험이 있다.

### 요약

| 방법 | 보안 리스크 | 법적 리스크 | 권장 여부 |
|------|-------------|-------------|-----------|
| 분석 아티클 읽기 | 없음 | 없음 | O |
| system_prompts_leaks 참고 | 낮음 | 낮음 | 조건부 |
| GitHub 미러 직접 클론 | **높음** | 중간 | X |
| "leaked Claude Code" 검색 후 다운로드 | **매우 높음** | 높음 | **절대 X** |

v2.1.88을 쓰고 있다면 삭제하고 v2.1.89 이상으로 올린다. 또는 npm 대신 공식 네이티브 인스톨러를 쓴다.

```bash
# 공식 네이티브 인스톨러 (Anthropic 권장 방식)
curl -fsSL https://claude.ai/install.sh | bash
```

---

## 하네스 엔지니어링이란

유출본이 보여준 것은 "Claude에 툴 몇 개 붙인 것"이 아니다.

AI 개발의 흐름은 이렇게 왔다.

| 시기 | 패러다임 | 핵심 질문 |
|------|----------|-----------|
| 2023–2024 | 프롬프트 엔지니어링 | 모델에게 어떻게 물을 것인가 |
| 2025 | 컨텍스트 엔지니어링 | 모델에게 무엇을 줄 것인가 |
| 2026 | 하네스 엔지니어링 | 모델 주변 시스템 전체를 어떻게 설계할 것인가 |

**하네스(harness)**는 모델과 현실 세계 사이의 모든 것이다. 툴, 권한 시스템, 메모리, 컨텍스트 관리, 비용 제어, 재시도 로직. 모델이 텍스트를 생성하면 하네스가 그 텍스트가 무엇을 건드릴 수 있는지 결정한다.

Claude Code의 하네스는 46,000줄짜리 쿼리 엔진이 LLM API 호출, 토큰 캐싱, 컨텍스트 관리, 재시도를 처리하고, 40개의 권한 제어 툴이 파일 조작, bash 실행, 웹 요청, LSP 연동을 담당한다.

---

## 유출로 드러난 핵심 설계

### 프롬프트를 반으로 나눈다

`SYSTEM_PROMPT_DYNAMIC_BOUNDARY`라는 마커가 프롬프트를 두 구간으로 나눈다.

- **앞 구간 (정적)**: 행동 규칙, 코딩 스타일, 안전 지침 → 전역 캐시
- **뒤 구간 (동적)**: CLAUDE.md, MCP 서버 지시, 세션별 환경 → 매번 주입

정적 구간은 `scope: 'global'`로 API에서 캐시된다. 대략 3,000 토큰이 전역 캐시에 올라가 세션 간에 재사용된다. `DANGEROUS_uncachedSystemPromptSection`으로 태그된 섹션은 명시적으로 캐시를 깨는 것으로 표시된다. 엔지니어가 수정 전에 비용을 인지하게 만드는 구조다.

### 캐시 무효화를 14가지로 추적한다

`promptCacheBreakDetection.ts`는 캐시를 무효화할 수 있는 상태 필드를 14가지 추적한다. 시스템 프롬프트 해시, 툴 스키마 해시, 모델 변경, 베타 헤더, effort 값 등. "스티키 래치(sticky latch)"로 모드 전환이 캐시 프리픽스를 깨는 것을 방지한다.

### autoDream: 메모리를 잠자는 동안 정리한다

24시간 이상 비활성 + 5회 이상 세션이 쌓이면 `autoDream` 서브에이전트가 백그라운드에서 깨어난다. 프로젝트 메모리 디렉터리를 읽고, 학습 내용을 통합하고, 모순을 삭제하고, 메모리 인덱스를 다시 쓴다.

### KAIROS: 공개되지 않은 상시 백그라운드 에이전트

`PROACTIVE`, `KAIROS` 피처 플래그 뒤에 숨겨진 자율 에이전트 모드가 있다. 몇 초마다 "지금 할 일이 있나?" 하트비트 프롬프트를 받는다. GitHub 웹훅을 구독하고, 추가 지시 없이 에러 수정, 파일 업데이트, 작업 실행이 가능하도록 설계됐다. 아직 공개된 기능이 아니다.

### Undercover Mode

Anthropic 직원이 공개 오픈소스 저장소에 기여할 때 Claude Code가 내부 정보를 노출하지 않도록 설계된 서브시스템(`undercover.ts`, 약 90줄)이다. 내부 코드명, 미공개 버전 번호, 내부 Slack 채널명 등을 커밋 메시지에 포함시키지 않도록 지시한다. AI라는 사실도 언급하지 않게 한다.

아이러니하게도, 내부 정보 유출을 막으려고 설계한 서브시스템이 있는 코드베이스가 빌드 설정 실수로 통째로 공개됐다.

### 경쟁사 학습 차단

`ANTI_DISTILLATION_CC` 플래그가 활성화되면 API 요청에 가짜 툴 정의를 주입한다. 경쟁사가 API 트래픽을 수집해서 Claude Code의 동작을 자사 모델에 학습시키려 할 때 오염된 데이터를 먹이는 구조다.

---

## 내 Claude Code 설정에 바로 적용하는 것들

유출본을 보고 나서 실제로 바꿀 수 있는 것들이다.

### CLAUDE.md를 진지하게 쓴다

하네스가 CLAUDE.md를 매 턴마다 프롬프트에 주입한다는 게 확인됐다. 40,000자까지 쓸 수 있다. 아키텍처 결정, 코딩 컨벤션, 자주 쓰는 명령어, 피해야 할 패턴 — 세션이 끊겨도 Claude가 다시 읽는다.

```markdown
## 절대 하지 말 것
- @Transactional 없이 DB 쓰기 작업
- Optional.get() 직접 호출
- 커밋 전 테스트 미실행

## 자주 쓰는 명령어
- 빌드: ./gradlew build
- 테스트: ./gradlew test
- 로컬 실행: ./gradlew bootRun
```

중요한 결정이 생기면 대화 중에 바로 CLAUDE.md에 추가한다. `/compact` 이후에도 남는다.

### /compact를 능동적으로 쓴다

자동 컴팩션을 기다리지 않는다. 컨텍스트가 쌓이기 전에 `/compact`로 먼저 정리한다. 컴팩션 직전에 CLAUDE.md에 없는 중요한 결정사항은 거기 먼저 기록한다.

### 세션을 이어 쓴다

`claude --continue`로 이전 세션을 재개한다. 새 세션에서 시작하면 쌓인 컨텍스트가 다 날아간다.

### 권한을 미리 설정한다

매번 권한 확인 다이얼로그가 뜨는 건 설정 실패다. `settings.json`에 허용할 명령어를 미리 정의한다.

```json
{
  "permissions": {
    "allow": [
      "Bash(git diff:*)",
      "Bash(./gradlew test:*)",
      "Bash(./gradlew build:*)"
    ]
  }
}
```

### 독립적인 작업은 서브에이전트로 분리한다

유출된 코드는 처음부터 병렬 에이전트를 상정하고 설계됐다. 서로 독립적인 작업은 단일 에이전트에 몰아넣지 않는다. git worktree와 함께 서브에이전트를 쓰면 브랜치 충돌 없이 병렬로 처리된다.

---

유출은 사고였다. 그런데 512,000줄이 증명한 것이 있다.

모델은 부품이다. 하네스가 제품이다.

---

## 출처

- [Claude Code's Entire Source Code Got Leaked via a Sourcemap in npm](https://kuber.studio/blog/AI/Claude-Code's-Entire-Source-Code-Got-Leaked-via-a-Sourcemap-in-npm,-Let's-Talk-About-it)
- [Diving into Claude Code's Source Code Leak - Engineers Codex](https://read.engineerscodex.com/p/diving-into-claude-codes-source-code)
- [The Claude Code Source Leak: fake tools, frustration regexes, undercover mode, and more](https://alex000kim.com/posts/2026-03-31-claude-code-source-leak/)
- [Comprehensive Analysis of Claude Code Source Leak - Sabrina.dev](https://www.sabrina.dev/p/claude-code-source-leak-analysis)
- [Claude Code source code accidentally leaked in NPM package - BleepingComputer](https://www.bleepingcomputer.com/news/artificial-intelligence/claude-code-source-code-accidentally-leaked-in-npm-package/)
- [Claude Code Leak Exploited to Spread Vidar and GhostSocks - GBHackers](https://gbhackers.com/claude-code-leak/)
- [Anthropic Claude Code Leak - Zscaler ThreatLabz](https://www.zscaler.com/blogs/security-research/anthropic-claude-code-leak)
- [Weaponizing Trust Signals: Claude Code Lures and GitHub Release Payloads - Trend Micro](https://www.trendmicro.com/en_us/research/26/d/weaponizing-trust-claude-code-lures-and-github-release-payloads.html)
- [GitHub enforces Anthropic DMCA notices on leaked code - Piunikaweb](https://piunikaweb.com/2026/04/01/anthropic-dmca-claude-code-leak-github/)
- [Why harness engineering is becoming the new AI moat - TechTalks](https://bdtechtalks.com/2026/04/06/ai-harness-engineering-claude-code-leak/)
