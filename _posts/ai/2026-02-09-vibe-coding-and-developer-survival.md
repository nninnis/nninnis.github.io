---
layout: post
title: "Vibe Coding의 진실과 AI 시대 개발자 생존법"
date: 2026-02-09
category: ai
---

"코드를 잊어버려라. 바이브에 몸을 맡겨라."

2025년 2월, OpenAI 공동창업자이자 전 Tesla AI 리더 Andrej Karpathy가 트위터에 올린 말이다. [Vibe Coding](https://en.wikipedia.org/wiki/Vibe_coding)이라는 용어가 탄생한 순간이다. Collins 영어사전은 이 단어를 2025년 올해의 단어로 선정했다.

그런데 정작 Karpathy 본인은 최신 프로젝트를 **손으로 직접 코딩했다.**

---

## Vibe Coding이란

AI에게 원하는 것을 말하고, 생성된 코드를 읽지 않고, diff도 확인하지 않고, "Accept All"만 누르는 방식이다.

Karpathy의 원문:

> "I 'Accept All' always, I don't read the diffs anymore. When I get error messages I just copy paste them in with no comment, usually that fixes it."

그는 Cursor + Claude + SuperWhisper 조합으로 키보드를 거의 만지지 않고 앱을 만들었다. MenuGen이라는 메뉴 사진을 찍으면 음식 이미지를 생성해주는 앱이다.

결과는?

> "Vibe coding full web apps today is kind of messy and not a good idea for anything of actual importance."
>
> — Karpathy, [Vibe coding MenuGen](https://karpathy.bearblog.dev/vibe-coding-menugen/)

로컬 데모로는 재밌지만, 실제 배포하니 고통스러웠다고 한다.

---

## Karpathy도 손코딩으로 돌아갔다

그의 최신 프로젝트 Nanochat은 어떨까.

> "It's basically entirely hand-written. I tried to use Claude/Codex agents a few times but they just didn't work well enough at all and net unhelpful."
>
> — [Futurism 인터뷰](https://futurism.com/artificial-intelligence/inventor-vibe-coding-doesnt-work)

Vibe Coding을 만든 사람이 "잘 안 됐다"고 말한다. 레포가 일반적인 데이터 분포에서 벗어나면 AI가 제대로 작동하지 않았다고.

---

## Andrew Ng의 반박: "이름부터 잘못됐다"

Stanford 교수이자 Google Brain 공동창업자 Andrew Ng는 [LangChain Interrupt 컨퍼런스](https://www.klover.ai/andrew-ng-pushes-back-ai-vibe-coding-hard-work-not-hype/)에서 이렇게 말했다:

> "It's unfortunate that that's called vibe coding. It's misleading a lot of people into thinking, just go with the vibes."
>
> "When I'm coding for a day with AI coding assistance, I'm frankly exhausted by the end of the day."

바이브가 아니다. **깊은 지적 작업**이다. 하루 종일 AI와 코딩하면 녹초가 된다고.

그럼에도 그는 AI 코딩 도구에 긍정적이다. 다만 "배우지 마라"는 조언에는 반대한다:

> "One of the most important skills of the future is the ability to tell a computer exactly what you want so it will do it for you."

컴퓨터에게 정확히 원하는 것을 전달하는 능력. 그게 미래 핵심 스킬이라고.

---

## 충격적인 연구 결과: AI가 오히려 느리게 만든다

여기서부터 진짜 유니크한 정보다.

### METR 연구 (2025)

AI 안전 연구 기관 [METR](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)이 경험 많은 오픈소스 개발자 16명을 대상으로 실험했다. 평균 22,000+ 스타, 100만 줄 이상의 대형 레포지토리에서 평균 5년 이상 기여한 시니어들이다.

246개 태스크를 AI 사용/비사용 그룹으로 무작위 배정했다.

결과:

| 항목 | 수치 |
|------|------|
| AI 사용 시 실제 소요 시간 | **19% 더 느림** |
| 개발자 본인 예상 | 24% 빨라질 것 |
| 실험 후 개발자 체감 | 20% 빨라졌다고 착각 |

**AI를 쓰면 느려지는데, 본인은 빨라졌다고 믿는다.**

이유:
- AI가 "경험 없는 팀원"처럼 행동. 하위 호환성 무시, 엉뚱한 위치에 수정 제안
- 생성된 코드 리뷰에 9% 시간 소모
- 생성 대기에 4% 시간 소모
- 수락률 44% 미만. 나머지는 검토하고 테스트하고 결국 버림

단, 3/4이 느려졌지만 1/4은 빨라졌다. Cursor 경험이 많은 개발자일수록 성과가 좋았다.

---

## 코드 리뷰가 새로운 병목이다

AI가 코드 생성을 빠르게 만들었다. 그런데 다른 곳에서 막혔다.

### GitHub Octoverse 2025

- 월간 코드 푸시: 8,200만 건
- 머지된 PR: 4,300만 건
- AI 지원 코드 비율: 41%

### Faros AI 분석 (10,000+ 개발자)

| 지표 | 변화 |
|------|------|
| PR 볼륨 | **98% 증가** |
| PR 리뷰 시간 | **91% 증가** |

코드는 빨리 나오는데 **리뷰할 게 너무 많아졌다.**

시니어 엔지니어가 AI 코드 리뷰하는 데 평균 4.3분. 사람이 쓴 코드는 1.2분. **3.6배 차이.**

---

## AI 코드 신뢰도는 오히려 떨어졌다

| 연도 | AI 코드 신뢰도 |
|------|---------------|
| 2024 | 40% |
| 2025 | **29%** |

모델이 정교해지고 자신감 있는 톤으로 답변할수록, 검증은 더 어려워졌다.

[Qodo 설문](https://www.qodo.ai/blog/best-ai-code-review-tools-2026/): 시니어 엔지니어 68%가 AI로 품질 향상을 경험했지만, **리뷰 없이 AI 코드를 배포하겠다는 사람은 26%뿐.**

---

## 주니어 개발자 채용이 줄고 있다

Harvard 연구진이 6,200만 명의 근로자 데이터를 분석했다. [World Economic Forum 보도](https://www.weforum.org/stories/2026/01/software-developers-ai-work/):

> "When companies adopt generative AI, junior developer employment drops by about 9-10% within six quarters, while senior employment barely budges."

AI 도입 6분기 후:
- 주니어 개발자 고용: **9-10% 감소**
- 시니어 개발자 고용: 거의 변화 없음

경쟁 상대가 바뀌었다. 다른 주니어가 아니다. **AI + AI를 잘 쓰는 시니어**다.

---

## 그래서 어떻게 살아남나

남들 다 아는 "AI 배워라" 말고, 연구에서 드러난 구체적인 방향.

### 1. 코드 읽기 능력을 쓰기보다 중요하게

METR 연구 참여자 [Domenic Denicola의 회고](https://domenic.me/metr-ai-productivity/):

> "AI will outwrite you. But it can't yet out-understand you."

AI는 당신보다 빨리 쓴다. 하지만 이해는 못 한다. **읽고 판단하는 능력**이 차별점이 된다.

### 2. T자형 엔지니어가 살아남는다

한 가지만 깊이 아는 I자형은 위험하다. 그 분야가 자동화되면 끝이다.

[World Economic Forum](https://www.weforum.org/stories/2026/01/software-developers-ai-work/)이 제시하는 모델:

> "T-shaped engineers—broad adaptability with one or two deep skills—will be the bare minimum."

넓은 적응력 + 한두 개의 깊은 전문성. 프레임워크와 도구는 빠르게 바뀐다. 특정 기술 스택에 커리어를 걸지 마라.

### 3. AI 도구 숙련도가 성과를 가른다

METR 연구에서 1/4은 AI로 빨라졌다. 공통점: **Cursor 사용 경험이 많았다.**

도구를 쓰는 것과 **잘 쓰는 것**은 다르다. 11주 정도의 학습 기간이 필요하다고 Microsoft 연구는 말한다. 초반에는 오히려 생산성이 떨어진다.

### 4. 시스템 사고력이 진입 장벽이 됐다

[DEV Community 분석](https://dev.to/adamthedeveloper/only-the-strong-survive-breaking-into-software-engineering-in-2026-44cm):

> "Systems thinking, debugging skills, code reading ability, architectural judgment. These used to be senior skills. Now they're entry requirements."

예전에는 시니어 스킬이었던 것들이 이제 **신입 요구사항**이다.

### 5. 쓰기 vs 검증, 비용이 역전됐다

코드 작성 비용은 거의 0에 가까워졌다. 대신 **검증 비용이 폭발했다.**

> "Software engineering is not typing; it is thinking."

타이핑 가속기를 복잡한 사고 작업에 적용하면, **사고 감속기**가 된다. 디버깅, 검증, 컨텍스트 스위칭 비용이 경험 많은 팀의 속도를 19% 깎아먹었다.

---

## 요약

| 통념 | 현실 |
|------|------|
| AI 쓰면 빨라진다 | 시니어도 19% 느려질 수 있다 (METR) |
| Vibe Coding이 미래다 | 만든 사람도 손코딩으로 돌아갔다 |
| 코딩 안 배워도 된다 | Andrew Ng: "미래 핵심 스킬이다" |
| 코드 생성이 병목이다 | 리뷰가 새 병목이다 (91% 증가) |
| 주니어도 AI로 경쟁력 생긴다 | 주니어 채용 9-10% 감소 |

**AI를 쓰는 개발자가 안 쓰는 개발자를 대체한다.** 하지만 **AI를 잘 쓰는 개발자가 그냥 쓰는 개발자를 대체한다.**

"바이브"에 몸을 맡기지 마라. 검증하고, 이해하고, 판단하라.

---

## 출처

- [METR: Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)
- [Karpathy: Vibe coding MenuGen](https://karpathy.bearblog.dev/vibe-coding-menugen/)
- [Futurism: Inventor of Vibe Coding Admits He Hand-Coded His New Project](https://futurism.com/artificial-intelligence/inventor-vibe-coding-doesnt-work)
- [Klover.ai: Andrew Ng Pushes Back on AI "Vibe Coding"](https://www.klover.ai/andrew-ng-pushes-back-ai-vibe-coding-hard-work-not-hype/)
- [World Economic Forum: Software developers are the vanguard of how AI is redefining work](https://www.weforum.org/stories/2026/01/software-developers-ai-work/)
- [Wikipedia: Vibe coding](https://en.wikipedia.org/wiki/Vibe_coding)
- [LogRocket: Why AI coding tools shift the real bottleneck to review](https://blog.logrocket.com/ai-coding-tools-shift-bottleneck-to-review/)
- [Qodo: Best AI Code Review Tools 2026](https://www.qodo.ai/blog/best-ai-code-review-tools-2026/)
- [DEV Community: Only The Strong Survive](https://dev.to/adamthedeveloper/only-the-strong-survive-breaking-into-software-engineering-in-2026-44cm)
- [Domenic Denicola: My Participation in the METR AI Productivity Study](https://domenic.me/metr-ai-productivity/)

