---
name: game-dev
description: "HTML5 게임 프로토타입을 제작하고 games/ 디렉토리에 추가한다. 새 게임 만들기, 게임 아이디어 구현, HTML5 게임 추가, 플레이어블 프로토타입 제작 요청 시 반드시 이 스킬을 사용하라. 게임 제작·구현·프로토타입 관련 모든 요청에 트리거."
---

## 실행 모드: 서브 에이전트 (순차 파이프라인)
game-designer → game-developer 순서로 순차 실행.

에이전트 정의:
- `.claude/agents/game-designer.md`
- `.claude/agents/game-developer.md`

## 워크플로우

### Phase 0: 컨텍스트 확인
- `games/` 디렉토리 확인 → slug 중복 여부 파악
- `_workspace/` 존재 시 → 이전 작업인지 신규인지 판단
  - 이전 작업 + 부분 수정 요청 → game-developer만 재실행
  - 새 아이디어 → `_workspace/` 내용 유지하되 새 spec 작성

### Phase 1: 스펙 설계

game-designer 에이전트를 호출한다:
```
Agent({
  subagent_type: "general-purpose",
  description: "게임 스펙 설계",
  prompt: "당신은 game-designer 에이전트입니다. .claude/agents/game-designer.md를 읽고 역할을 수행하세요.
  
  게임 아이디어: {사용자 아이디어}
  
  games/space-cat/index.html을 읽어 패턴을 파악한 뒤 _workspace/game-spec.md를 생성하세요.",
  model: "opus"
})
```

### Phase 2: 구현

game-developer 에이전트를 호출한다 (Phase 1 완료 후):
```
Agent({
  subagent_type: "general-purpose",
  description: "HTML5 게임 구현",
  prompt: "당신은 game-developer 에이전트입니다. .claude/agents/game-developer.md를 읽고 역할을 수행하세요.
  
  _workspace/game-spec.md를 읽고 지정된 경로에 index.html을 구현하세요.
  games/space-cat/index.html을 반드시 참고하세요.",
  model: "opus"
})
```

### Phase 3: 블로그 포스트 (선택)
사용자가 포스트도 원하면 `blog-post` 스킬을 사용하여 `_posts/game/` 포스트 작성.

### Phase 4: 결과 보고
- 생성된 파일 경로
- 로컬 확인 URL: `/games/{slug}/`
- 블로그 포스트 작성 여부 확인

## 에러 처리
- Phase 1 실패 시: 사용자 아이디어를 직접 Phase 2 prompt에 포함하여 재시도
- Phase 2 실패 시: 실패 이유 보고 후 특정 부분만 재시도
- slug 충돌: 사용자에게 확인 후 진행

## 테스트 시나리오
**정상**: 새 게임 아이디어 → spec → 구현 → 결과 보고
**에러**: 기존 slug 충돌 → 보고 → 확인 → 새 slug 진행
