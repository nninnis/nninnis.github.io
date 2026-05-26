---
name: blog-post
description: "nninnis.github.io Jekyll 블로그에 새 포스트를 작성하고 파일을 생성한다. 블로그 글 쓰기, 새 포스트 추가, ai/game/painting-star 카테고리 포스트 생성, 기존 포스트 수정, 블로그 업데이트 요청 시 반드시 이 스킬을 사용하라. 포스트 작성과 관련된 모든 작업에 트리거."
---

## 빠른 참고

**파일 경로**: `_posts/{category}/YYYY-MM-DD-{slug}.md`
**카테고리**: `ai` | `game` | `painting-star`

## Frontmatter 템플릿

```yaml
---
layout: post
title: "제목"
date: YYYY-MM-DD
category: {ai|game|painting-star}
---
```

`description` 필드는 game 카테고리 포스트에서 선택적으로 추가 (space-cat 포스트 참고).

## 글쓰기 스타일

작성 전 같은 카테고리의 최근 포스트 1개를 Read로 읽어 스타일을 확인한다.

핵심 패턴:
- 한국어, 직접적, 군더더기 없음
- 1인칭 서술 ("써왔다", "정리할 때가 됐다", "확인했다")
- 섹션 구분: `---` + `## 헤딩`
- 이모지는 헤딩에 사용하지 않음, 본문에서도 최소화
- 코드 블록은 언어 명시

스타일 레퍼런스: `_posts/ai/2026-05-07-claude-code-codex-plugin-workflow.md`

## 게임 임베드 (game 카테고리 전용)

```html
<div style="position: relative; width: 100%; max-width: 400px; margin: 1.5rem auto; padding-top: min(700px, 175%); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.3);">
  <iframe
    src="/games/{game-slug}/"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
    allow="autoplay"
    loading="lazy">
  </iframe>
</div>

<p style="text-align: center; margin-top: 0.5rem;">
  <a href="/games/{game-slug}/" target="_blank">전체 화면으로 플레이 &rarr;</a>
</p>
```

## 워크플로우

### 1. 컨텍스트 확인
같은 카테고리 최근 포스트 1개 Read → 스타일 파악.

### 2. 메타데이터 확정
카테고리, 날짜(미지정 시 오늘), 제목, URL slug 결정.

### 3. 포스트 파일 생성
사용자가 제공한 내용을 바탕으로 Write 도구로 직접 파일 생성.

### 4. 결과 보고
생성된 파일 경로 확인.

## 기존 포스트 편집 시
Read로 읽고 Edit으로 수정. Frontmatter(날짜 포함)는 변경하지 않는다.
