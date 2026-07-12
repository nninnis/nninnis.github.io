---
layout: post
title: "Sonnet 5 뜯어보기 — 뭐가 달라졌고, 어떻게 프롬프트해야 하나"
date: 2026-07-02
category: ai
---

Sonnet 5가 나왔다. Opus 4.8을 대체하는 모델이 아니라, "속도와 지능의 최적 조합"이라는 포지션으로 Sonnet 4.6 자리에 들어왔다. 공식 문서를 정리하면서 실제로 뭐가 달라졌고 어떻게 프롬프트를 조정해야 하는지 남긴다.

---

## API 레벨 변화

Sonnet 4.6에서 갈아탄다면 코드 변경 없이 모델 ID만 바꿔도 동작하지만, 다음 세 가지는 동작이 달라진다.

**Adaptive Thinking 기본 켜짐**
Sonnet 4.6은 `thinking` 필드 없이 요청하면 생각 없이 바로 답했다. Sonnet 5는 같은 요청이 기본으로 Adaptive Thinking을 켜고 들어간다. 끄려면 `thinking: {type: "disabled"}`을 명시해야 한다. `max_tokens`가 사고 토큰 + 응답 토큰을 합친 하드 리밋이라, 이전에 thinking 없이 돌리던 워크로드는 토큰 예산을 다시 잡아야 한다.

**수동 extended thinking 제거**
`thinking: {type: "enabled", budget_tokens: N}` 방식은 이제 400 에러를 던진다. Opus 4.7/4.8과 동일하게, 사고 깊이는 `effort` 파라미터로 조절하는 방식으로 완전히 넘어갔다.

**샘플링 파라미터 거부**
`temperature`, `top_p`, `top_k`를 기본값이 아닌 값으로 설정하면 400 에러다. Sonnet 계열에는 처음 적용되는 제약이다. 스타일 다양성이 필요하면 이제 시스템 프롬프트로 지시해야 한다.

**새 토크나이저**
같은 텍스트가 이전보다 약 30% 더 많은 토큰으로 쪼개진다. 단가는 백만 토큰당 입력 $3 / 출력 $15로 4.6과 동일하지만(8월 말까지 도입가 $2/$10), 토큰 수 자체가 늘어서 실질 비용은 그만큼 오른다. `max_tokens`를 4.6 기준으로 빠듯하게 잡아뒀다면 응답이 잘릴 수 있다.

---

## 프롬프팅 가이드 — 실제로 뭘 조정해야 하나

Anthropic이 공개한 [Sonnet 5 프롬프팅 가이드](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5)에서 실무에 바로 걸리는 부분만 추렸다.

### 응답 길이가 과제 난이도에 따라 자동 조정된다

고정된 장황함 대신 과제 복잡도에 맞춰 답변 길이를 스스로 정한다. 단순 조회는 짧게, 열린 분석은 길게. 특정 스타일이나 분량이 필요한 제품이라면 프롬프트로 명시해야 한다.

```text
Provide concise, focused responses. Skip non-essential context, and keep examples minimal.
```

과잉 설명 같은 특정 장황함 패턴이 보이면, 하지 말라는 지시보다 원하는 간결함의 좋은 예시를 보여주는 쪽이 더 잘 먹힌다.

### 지시를 문자 그대로 따른다 — 일반화하지 않는다

Sonnet 5는 특히 낮은 effort에서 지시를 곧이곧대로 해석한다. 한 항목에 적용한 규칙을 다른 항목까지 알아서 확장하지 않는다. 이건 API 파이프라인이나 구조화 추출처럼 예측 가능한 동작이 필요한 작업엔 장점이지만, 범위를 넓게 적용하고 싶다면 명시해야 한다.

```text
Apply this formatting to every section, not just the first one.
```

### 도구 사용 트리거링이 달라졌다

Sonnet 4.6보다 기본적으로 더 에이전틱해서 도구를 더 적극적으로 쓰고 자체 검증 루프를 더 자주 돈다. 반대로 thinking을 꺼두면 도구 호출 자체를 덜 고려하는 경향이 있어서, thinking off 상태로 도구 의존적인 워크플로우를 돌린다면 시스템 프롬프트에 명시적으로 지시를 넣어야 한다.

### 코드 리뷰 하네스는 recall이 떨어져 보일 수 있다

"중요한 것만 보고해라", "보수적으로 판단해라" 같은 지시를 Sonnet 4.6보다 훨씬 충실히 따른다. 코드는 똑같이 깊게 파고들어 버그를 찾아내고도, 기준 미달이라고 판단하면 보고하지 않는다. 탐지 능력은 그대로인데 보고율만 떨어지는 것처럼 보이는 이유다. 커버리지가 목적이면 이렇게 지시한다.

```text
Report every issue you find, including ones you are uncertain about
or consider low-severity. Do not filter for importance or confidence
at this stage - a separate verification step will do that.
```

### 프론트엔드 기본 스타일이 하나로 수렴하는 경향

열린 디자인 요청에는 특정 하우스 스타일로 자꾸 수렴한다. "그 색 쓰지 마라" 식의 애매한 지시는 결국 또 다른 고정 팔레트로 옮겨갈 뿐이다. 구체적인 대안을 주거나, 여러 방향을 먼저 제안하게 시키는 쪽이 확실하다.

```text
Before building, propose 4 distinct visual directions tailored to
this brief (each as: bg hex / accent hex / typeface, plus a
one-line rationale). Ask the user to pick one, then implement
only that direction.
```

---

## effort 레벨 — 모델 교체보다 체감에 더 크게 작동하는 레버

여기가 이번 정리에서 가장 중요한 부분이다. **effort는 텍스트 답변뿐 아니라 사고 깊이, 도구 호출 방식까지 전부 바꾼다.** [공식 문서](https://platform.claude.com/docs/en/build-with-claude/effort)에 명시된 내용이다.

| 레벨 | 설명 | 용도 |
|------|------|------|
| `max` | 토큰 소비 제약 없는 최대 성능 | 가장 깊은 추론이 필요한 프론티어급 문제 |
| `xhigh` | 장시간 에이전틱 작업용 확장 성능 | 30분 넘는 코딩/에이전트 작업, 토큰 예산 수백만 단위 |
| `high` (기본값) | 높은 성능 | 복잡한 추론, 어려운 코딩, 에이전틱 작업 |
| `medium` | 균형, 토큰 절약 | 속도·비용·성능 균형이 필요한 에이전틱 작업 |
| `low` | 가장 효율적 | 서브에이전트처럼 단순한 작업, 속도·비용 최우선 |

Sonnet 5는 effort를 4.6보다 엄격하게 지킨다. 특히 low/medium에서는 요청받은 만큼만 하고 그 이상 나아가지 않는다. 교차 매핑을 참고하면: **Sonnet 5의 medium ≈ Sonnet 4.6의 high**, **Sonnet 5의 high ≈ Sonnet 4.6의 max**. 지능 수준을 effort 이름이 아니라 실제 사고 길이로 비교해야 한다는 뜻이다.

### 도구 사용 방식까지 바뀐다

이게 흔히 체감하는 "장황함"의 진짜 원인일 가능성이 높다. effort는 텍스트만이 아니라 도구 호출에도 그대로 적용된다.

**낮은 effort일 때:**
- 여러 작업을 적은 도구 호출로 합침
- 도구 호출 횟수 자체가 줄어듦
- 사전 설명 없이 바로 실행
- 완료 후 확인 메시지도 짧게

**높은 effort일 때:**
- 도구 호출 횟수가 늘어남
- 실행 전에 계획을 설명함
- 변경 사항을 상세하게 요약함
- 코드 주석도 더 자세하게 붙임

즉 같은 모델이라도 `low`로 돌리면 GPT류 모델처럼 바로 실행하고 짧게 확인하는 스타일이 나오고, `high`나 `xhigh`로 돌리면 설명과 헤징이 늘어난 "투머치 토커" 스타일이 나온다. 모델을 바꾸기 전에 effort부터 낮춰보는 게 먼저다.

Claude Code에서는 설정의 `effortLevel` 값이나 상태줄의 effort 메뉴가 이 API 파라미터에 대응한다. 참고로 메뉴에 뜨는 **ultracode**는 API가 받는 별도의 effort 값이 아니라, `xhigh` effort에 멀티에이전트 워크플로우 실행 권한을 얹은 Claude Code 전용 모드다.

---

## 정리

| 구분 | 핵심 |
|------|------|
| API 변화 | Adaptive Thinking 기본 on, 수동 thinking 제거, 샘플링 파라미터 거부, 토큰 +30% |
| 프롬프팅 | 간결함은 긍정 예시로 유도, 지시는 범위까지 명시, 도구 트리거링 재확인 |
| effort | 모델 선택 못지않은 체감 변수. 장황함이 거슬리면 effort부터 낮춰본다 |

Sources:
- [Introducing Claude Sonnet 5 — Anthropic](https://www.anthropic.com/news/claude-sonnet-5)
- [What's new in Claude Sonnet 5 — Claude Platform Docs](https://platform.claude.com/docs/en/about-claude/models/whats-new-sonnet-5)
- [Prompting Claude Sonnet 5 — Claude Platform Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5)
- [Effort — Claude Platform Docs](https://platform.claude.com/docs/en/build-with-claude/effort)
