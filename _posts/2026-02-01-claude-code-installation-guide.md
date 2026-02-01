---
layout: post
title: "Claude Code 설치 가이드 - Mac, Windows, IDE 연동까지"
date: 2026-02-01
category: claude-code
---

AI 코딩 어시스턴트 시대가 본격적으로 열렸다. GitHub Copilot, Cursor AI에 이어 Anthropic에서 공식 CLI 도구인 **Claude Code**를 출시했다. 터미널 기반으로 동작하며, VS Code, IntelliJ, Cursor 등 주요 IDE와 연동된다.

이 글에서는 Claude Code의 설치부터 IDE 연동까지 다룬다.

## 설치 방법

### macOS / Linux

터미널에서 한 줄로 설치한다.

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Homebrew를 선호한다면:

```bash
brew install --cask claude-code
```

### Windows

**PowerShell** (관리자 권한):

```powershell
irm https://claude.ai/install.ps1 | iex
```

**CMD**:

```batch
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

**WinGet**:

```powershell
winget install Anthropic.ClaudeCode
```

> npm으로도 설치할 수 있지만 deprecated 되었다. 네이티브 설치를 권장한다.

### 버전 관리

```bash
# 최신 버전 (기본)
curl -fsSL https://claude.ai/install.sh | bash

# 안정 버전
curl -fsSL https://claude.ai/install.sh | bash -s stable

# 특정 버전
curl -fsSL https://claude.ai/install.sh | bash -s 1.0.58
```

설치 후 자동 업데이트가 활성화된다.

## 시작하기

```bash
cd /your/project
claude
```

처음 실행하면 로그인을 요청한다. Anthropic 계정으로 인증하면 된다.

## 필수 명령어

### 슬래시 명령어

| 명령어 | 설명 |
|--------|------|
| `/help` | 사용 가능한 명령어 목록 |
| `/init` | 프로젝트 초기 설정 (CLAUDE.md 생성) |
| `/compact` | 대화 컨텍스트 압축 |
| `/clear` | 대화 기록 초기화 |
| `/config` | 설정 메뉴 |
| `/cost` | 토큰 사용량 확인 |
| `/memory` | 메모리 및 CLAUDE.md 편집 |

### CLI 옵션

```bash
# 대화형 모드
claude

# 질문과 함께 시작
claude "이 프로젝트 구조 설명해줘"

# 이전 대화 이어서
claude -c

# 특정 세션 재개
claude -r "auth-refactor"

# 업데이트
claude update
```

## IDE 연동

### VS Code

1. `Cmd+Shift+X` (Mac) / `Ctrl+Shift+X` (Windows)로 Extensions 열기
2. "Claude Code" 검색 후 설치
3. 상태바의 **Claude Code** 클릭 또는 `Cmd+Shift+P` → "Claude Code"

주요 기능:
- 인라인 diff 뷰어 (변경사항 승인/거부)
- `@`로 파일/폴더 참조
- Plan 모드로 변경사항 미리 검토

### IntelliJ / WebStorm / PyCharm

1. **Settings → Plugins → Marketplace**
2. "Claude Code" 검색 후 설치
3. IDE 재시작
4. `Cmd+Esc` (Mac) / `Ctrl+Esc` (Windows)로 실행

파일 참조 단축키: `Cmd+Option+K` (Mac) / `Alt+Ctrl+K` (Windows)

### Cursor

VS Code 기반이라 동일한 익스텐션이 동작한다. Cursor의 AI 기능과 Claude Code를 함께 사용할 수 있다.

## 설정 파일 위치

```
~/.claude/
├── settings.json    # 사용자 설정
└── keybindings.json # 단축키 설정

프로젝트/
├── .claude/         # 프로젝트별 설정
├── .mcp.json        # MCP 서버 설정
└── CLAUDE.md        # 프로젝트 문서 (AI가 참조)
```

## 시스템 요구사항

- **macOS**: 13.0 이상
- **Windows**: 10 1809 이상
- **Linux**: Ubuntu 20.04+ / Debian 10+
- **RAM**: 4GB 이상
- **네트워크**: 인터넷 연결 필수

