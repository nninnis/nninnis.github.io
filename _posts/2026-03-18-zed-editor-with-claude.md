---
layout: post
title: "Zed: Cursor를 대체하게 된 에디터"
date: 2026-03-18
category: dev
---

Cursor를 쓰다 Zed로 갈아탔다. 처음엔 반신반의했는데, 지금은 거의 주력이다.

빠른 에디터는 많다. Zed가 특별한 건 빠름과 AI 에이전트를 동시에 잘 한다는 거다.

---

## Zed가 뭔가

Zed는 Rust로 만든 코드 에디터다. Atom과 Tree-sitter를 만든 팀이 처음부터 다시 썼다. Electron 기반이 아니다.

숫자로 보면 체감이 온다.

| 항목 | Zed | Cursor (Electron) |
|------|-----|-------------------|
| 시작 시간 | ~0.12초 | ~1.2초 |
| 메모리 (중간 규모 프로젝트) | ~142MB | 500~800MB |
| 입력 지연 | 2ms | 12ms |
| GPU 렌더링 | ✅ (120 FPS) | ❌ |

8시간 코딩하다 보면 2ms vs 12ms 차이가 쌓인다. 처음엔 플라시보인가 싶었는데, 아니다.

---

## AI 에이전트 구조

Zed의 AI는 두 층으로 나뉜다.

**Zed AI (퍼스트파티 에이전트)**
기본으로 설정된 Zed 자체 에이전트다. Agent Panel에서 파일 읽기, 코드 편집, 터미널 명령 실행을 처리한다. 스레드 기록 복원, 체크포인트, 토큰 사용량 표시 등 에디터 통합 기능이 전부 붙어있다. 처음 설치하면 Pro 2주 무료 트라이얼로 쓸 수 있다.

**External Agents**
Claude Agent, Gemini CLI, Codex 등이 여기 해당한다. Zed가 만든 **ACP(Agent Client Protocol)**이라는 오픈 표준으로 연결된다. 에디터 UI 안에서 돌아가지만, 과금은 각 제공자에게 따로 한다. Claude Agent를 쓴다면 Anthropic에 직접 내는 거다.

External Agent는 Zed 자체 에이전트에 비해 일부 기능이 빠져있다. 스레드 히스토리 복원이나 체크포인트가 안 되는 식이다. 대신 에이전트 자체의 추론 품질을 그대로 가져온다.

> "Claude로 작업한 결과는 터미널에서 Claude Code를 쓸 때와 동일했다. 같은 추론 패턴, 같은 복잡한 지시 이해력."

나는 Claude Agent를 고정으로 쓴다. Claude Max 구독을 이미 하고 있고, 코딩에서 Claude를 가장 신뢰하기 때문에 다른 에이전트로 바꿀 이유가 없다. Zed에 따로 돈 낼 필요도 없다. Personal 플랜으로 충분하고, 과금은 Anthropic에만 한다.

---

## 요금제

| 플랜 | 가격 | 주요 내용 |
|------|------|----------|
| Personal | 무료 | Edit Prediction 2,000회, 자체 API 키나 External Agent는 무제한 |
| Pro | $10/월 | 2주 무료 트라이얼, Edit Prediction 무제한, 토큰 $5 포함, 초과분 API 가격 +10% |
| Enterprise | 별도 문의 | SSO, 감사 로그, 보안 기능 |

External Agent를 쓴다면 Personal 플랜으로도 충분하다. Zed에 돈 안 내고 Anthropic이나 Google에만 내는 구조가 된다.

---

## IntelliJ 유저가 Zed를 쓰는 이유

나는 업무 주력은 IntelliJ다. Spring/Java 개발에서 IntelliJ의 프레임워크 통합은 대체가 안 된다.

무거운 건 IntelliJ 하나로 충분하다. 거기에 Cursor까지 무거운 걸 하나 더 얹고 싶지 않았다.

같은 이유로 Zed를 쓰는 사람이 꽤 있다. JetBrains 플러그인 마켓플레이스에는 **Switch2Zed**라는 플러그인도 있다. IntelliJ에서 Zed로 커서 위치를 유지한 채 전환하는 플러그인이다. 수요가 있으니까 만들어진 거다.

AI 기능도 충분하다. 무거운 IDE 하나 + 가벼운 에디터 + Claude. 이 조합으로 된다.

---

## Cursor와 비교

솔직히 Cursor가 AI 기능 자체는 더 성숙하다. 특히 `@codebase`로 레포 전체를 인덱싱해서 질문하는 기능은 Zed엔 아직 없다.

| 항목 | Zed | Cursor |
|------|-----|--------|
| 에디터 성능 | ✅ 압도적 (Rust + GPU) | ⚠️ 무거움 (Electron) |
| AI 에이전트 선택 | ✅ 자체 + External 자유 선택 | ⚠️ 자체 에이전트 중심 |
| 멀티플레이어 협업 | ✅ 기본 내장 | ❌ 없음 |
| 코드베이스 인덱싱 | ❌ 미지원 | ✅ `@codebase` 지원 |
| 익스텐션 생태계 | ⚠️ 아직 성장 중 | ✅ VS Code 전체 호환 |
| 요금 | Free / Pro $10/월 | Free / Pro $20/월 |
| 프라이버시 | ✅ 데이터 공유 옵트인 | ⚠️ 별도 확인 필요 |

**Cursor에서 생긴 불만들**

Cursor는 2025년 7월에 요금 정책을 바꿨다. "무제한"이라고 홍보하던 Auto 모드가 크레딧 차감 방식으로 변경됐다. Pro $20/월에서 실제 사용 가능한 요청 수가 크게 줄었고, 복잡한 프롬프트 한 번이 요청 여러 개를 잡아먹는 구조다.

Reddit과 Hacker News 반응:

> "그들은 '그런 시스템은 존재하지 않았다'며 가스라이팅하고 있다."

요금 자체보다 **불투명함**이 문제였다. 내가 지금 얼마나 쓰는지 예측이 안 됐다.

---

## 단점도 있다

- **익스텐션 생태계가 아직 작다.** VS Code 기반 도구에 익숙한 사람은 필요한 플러그인이 없을 수 있다.
- **코드베이스 인덱싱 없다.** "이 레포에서 인증은 어디서 처리해?" 같은 질문을 AI에게 던지는 게 Cursor만큼 자연스럽지 않다.
- **External Agent는 기능 제한이 있다.** 스레드 복원, 체크포인트 등 일부 기능은 Zed 자체 에이전트에서만 된다.
- **안정성 이슈가 남아있다.** 젊은 프로젝트다. 업데이트 후 CPU 스파이크, 프리즈 보고가 간헐적으로 올라온다.

---

## 정리

Cursor가 더 잘 맞는 경우:
- `@codebase` 인덱싱이 필요한 큰 레포
- VS Code 익스텐션 생태계에 의존하는 경우
- AI 기능 성숙도가 최우선인 경우

Zed가 더 잘 맞는 경우:
- 에디터 무거운 거 못 참는 경우
- Claude / Gemini / Codex 중 골라 쓰고 싶은 경우
- Claude Max / Pro 구독이 있는 경우 — Zed에 추가 비용 없이 Claude Agent를 그대로 쓸 수 있다
- IntelliJ 같은 무거운 IDE를 이미 주력으로 쓰고 있는 경우
- 실시간 협업이 필요한 경우

나는 후자였다. 에디터 자체가 빠른 게 먼저고, 그 위에 Claude가 올라가는 구조가 마음에 든다.

---

## 출처
- [Zed AI Overview 공식 문서](https://zed.dev/docs/ai/overview)
- [Zed External Agents 공식 문서](https://zed.dev/docs/ai/external-agents)
- [Zed Pricing](https://zed.dev/pricing)
- [Claude Code in Zed - Zed 공식 블로그](https://zed.dev/blog/claude-code-via-acp)
- [Switch2Zed - JetBrains Plugin](https://plugins.jetbrains.com/plugin/28140-switch2zed)
- [Zed vs Cursor 2026 - Morph](https://www.morphllm.com/comparisons/zed-vs-cursor)
- [Cursor 요금 정책 논란 - AI매터스](https://aimatters.co.kr/news-report/25867/)
