---
layout: post
title: "Claude Code Remote Control - 내 머신 세션을 폰과 브라우저로 이어 쓰는 법"
date: 2026-05-26
category: claude-code
---

결론부터 말하면 Remote Control은 클라우드 실행이 아니다. 내 노트북에서 돌고 있는 `claude` 프로세스를 폰이나 다른 브라우저에서 그대로 조종하는 기능이다. 세션은 로컬에 남아 있고, 웹/모바일은 그 세션을 들여다보는 창일 뿐이다.

리서치 프리뷰 단계지만 Pro/Max 사용자라면 바로 켜볼 수 있다. 직접 며칠 써보고 한계까지 같이 정리한다.

---

## 이게 푸는 문제, 못 푸는 문제

**푸는 문제**

- 책상에서 시작한 세션을 외출 중에 폰으로 이어가기
- 회의실 노트북 옆에서 폰으로 메시지 한 줄 던지기
- 로컬 MCP, CLAUDE.md, `.env` 같은 환경을 그대로 들고 가기

**못 푸는 문제**

- 노트북 끄고 출근하기 → 로컬 프로세스 죽으면 끝
- 인터랙티브 picker가 필요한 명령 (`/mcp`, `/plugin`, `/resume`) 원격 조작
- API 키만 가진 환경에서 쓰기 → claude.ai OAuth 로그인 필수

클라우드에서 통째로 돌리고 싶으면 그건 [Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web) 영역이다. Remote Control은 어디까지나 **내 머신을 원격 조종하는 채널**이다.

---

## 작동 원리 — Outbound Polling

핵심은 inbound 포트를 열지 않는다는 점이다.

```
내 노트북                       Anthropic API                 폰 / 브라우저
   │                                 │                              │
   │  outbound HTTPS (polling)       │                              │
   ├────────────────────────────────►│                              │
   │                                 │◄─────────────────────────────┤
   │                                 │     메시지 입력              │
   │◄────────────────────────────────┤                              │
   │   작업 지시 수신                │                              │
   │                                 │                              │
   │  결과 push                      │                              │
   ├────────────────────────────────►├─────────────────────────────►│
```

내 머신이 Anthropic API에 폴링하면서 일감을 받아간다. 방화벽 뚫을 필요 없고, 포트포워딩도 없고, ngrok도 없다. TLS 위에서 짧은 수명의 자격증명이 목적별로 따로 발급된다.

---

## 활성화 조건

| 항목 | 요구사항 |
|------|----------|
| **버전** | Claude Code v2.1.51 이상 (`claude --version`으로 확인) |
| **플랜** | Pro, Max, Team, Enterprise — Team/Enterprise는 관리자가 admin settings에서 토글 ON 필요 |
| **인증** | claude.ai OAuth 로그인 필수. `claude setup-token`이나 `CLAUDE_CODE_OAUTH_TOKEN`으로 발급한 inference-only 토큰은 불가 |
| **환경변수** | `ANTHROPIC_API_KEY` 설정돼 있으면 unset해야 함 |
| **워크스페이스** | 프로젝트 디렉토리에서 `claude` 한 번 실행해서 trust dialog 수락 |
| **로컬 프로세스** | 세션 동안 노트북 깨어 있어야 함 (sleep은 자동 재연결, 네트워크 끊김 약 10분 넘으면 타임아웃 후 프로세스 종료) |
| **호환 안 되는 백엔드** | `CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_VERTEX`, `CLAUDE_CODE_USE_FOUNDRY` 등 서드파티 프로바이더 사용 시 동작 안 함 |

API 키로 Claude Code 쓰던 환경이라면 한 번은 `claude auth login`으로 claude.ai OAuth 로그인 거쳐야 한다.

---

## 시작 방법 — 세 가지 모드

### 1. 서버 모드 (병렬 세션 가능)

```bash
claude remote-control
```

터미널이 서버 모드로 대기 상태에 들어간다. 세션 URL이 표시되고, 스페이스바를 누르면 QR 코드가 토글된다. 폰 카메라로 QR 찍으면 Claude 앱에서 바로 열린다.

주요 플래그:

| 플래그 | 동작 |
|--------|------|
| `--name "My Project"` | claude.ai/code 세션 목록에 보일 제목 |
| `--spawn same-dir` | 기본값. 모든 원격 세션이 동일한 작업 디렉토리 공유 (파일 충돌 가능) |
| `--spawn worktree` | 원격에서 새 세션 만들 때마다 별도 git worktree 생성. git 저장소 필요 |
| `--spawn session` | 단일 세션 모드. 추가 연결 거부. 시작 시점에만 지정 가능 |
| `--capacity N` | 동시 세션 수 (기본 32). `--spawn=session`과 함께 못 씀 |
| `--sandbox` / `--no-sandbox` | 파일시스템/네트워크 격리 토글. 기본 OFF |
| `--verbose` | 상세 연결 로그 |

런타임에 `w` 키 누르면 `same-dir` ↔ `worktree` 전환 가능하다.

### 2. 인터랙티브 + 원격 동시

```bash
claude --remote-control
# 또는 짧게
claude --rc
```

평소처럼 터미널에서 채팅하면서 동시에 원격에서도 같은 세션에 접속 가능한 모드다. 책상에 앉아서 일하다가 자리 비울 때 폰으로 이어받는 시나리오에 어울린다.

```bash
claude --remote-control "My Project"
```

이름 인자도 받는다.

### 3. 진행 중인 세션에 붙이기

이미 세션에 들어와 있는 상태라면 슬래시 명령으로 변환 가능하다.

```text
/remote-control
/rc My Project
```

기존 대화 히스토리를 그대로 가져간다. 단, 이 방식은 `--verbose`, `--sandbox`, `--no-sandbox` 플래그를 못 받는다.

### 4. VS Code 확장 (v2.1.79 이상)

VS Code 프롬프트 박스에서 `/remote-control` 또는 `/rc`. 배너에 상태가 뜨고, **Open in browser**로 바로 이동할 수 있다. CLI와 달리 이름 인자나 QR 코드는 지원 안 한다.

### 모든 세션에 자동으로 켜기

```text
/config
```

→ **Enable Remote Control for all sessions** = true.

이렇게 하면 매 인터랙티브 세션이 자동으로 원격 세션 1개씩 등록한다. Desktop 앱은 **Settings → Claude Code → Enable remote control by default**에서도 토글 가능하다.

---

## 클라이언트 매트릭스

| 클라이언트 | 연결 방식 | 비고 |
|------------|----------|------|
| 브라우저 (claude.ai/code) | 세션 URL 직접 열거나 세션 목록에서 선택 | 공식 지원 |
| Claude iOS 앱 | QR 스캔 또는 Code 탭 → 세션 목록 | 공식 지원 |
| Claude Android 앱 | 동일 | 공식 지원 |
| VS Code 확장 | `/rc`로 자기 세션을 원격 등록 (호스트로 동작) | 공식 지원 |
| Claude Desktop 앱 | Settings → Claude Code → Enable remote control by default 토글로 활성화 | **클라이언트로 접속 가능** (공식 문서 명시). 단, Desktop 앱 자체를 호스트로 세션을 시작하는 건 현재 불가 (알려진 미지원 사항) |

세션 목록에서 원격 세션은 컴퓨터 아이콘 + 초록 점으로 표시된다.

폰에 앱이 없다면 세션 안에서 `/mobile` 치면 다운로드 QR이 뜬다.

---

## 로컬 환경이 그대로 따라가는가

이게 클라우드 실행과의 결정적 차이다.

| 항목 | Remote Control | Claude Code on the web |
|------|----------------|------------------------|
| 파일시스템 | 내 로컬 그대로 | 클라우드 컨테이너 |
| MCP 서버 | 로컬 설정 그대로 | 별도 설정 필요 |
| `CLAUDE.md` | 로컬 프로젝트 그대로 | 클라우드 환경 기준 |
| `.env`, 시크릿 | 로컬 환경변수 그대로 | 별도 주입 필요 |
| `@` 파일 자동완성 | 로컬 프로젝트 경로 | 클라우드 워크스페이스 |
| 설치된 도구/CLI | 내 머신에 깔린 거 전부 | 컨테이너 이미지 한정 |
| 데이터 이동 | 코드/파일 클라우드로 안 감 | 클라우드에서 실행 |

회사 보안 정책이 빡세서 코드가 클라우드 컨테이너로 못 나가는 환경이라면 Remote Control이 거의 유일한 외부 조작 옵션이다.

---

## tmux와 결합 — 실무 영속 세팅

`claude remote-control`은 터미널 프로세스가 죽으면 끝난다. 외출하면서 노트북 ssh로 접속해서 다시 띄울 수도 있지만 매번 번거롭다. tmux로 영속화해두면 깔끔하다.

```bash
# 세션 시작
tmux new -s rc
cd ~/projects/my-app
claude remote-control --name "my-app" --spawn worktree

# Ctrl-b d 로 detach
# 노트북 닫지 않고 외출

# 돌아와서 attach
tmux attach -t rc
```

ssh로 자기 머신에 들어가서 attach 하는 흐름까지 갖춰두면 모바일에서 세션 끊겼을 때 복구가 빠르다. 세션 명명은 `--name` 일관되게 쓰는 게 낫다 — 휴대폰 세션 목록에서 헷갈리는 게 의외로 큰 마찰이다.

토큰을 아끼면서 긴 세션을 끌고 가는 노하우는 [Claude Code 토큰 절약 실전 가이드](/claude-code/2026/02/14/claude-code-token-saving/)에 따로 정리해뒀다. 원격에서 폰으로 끄적이는 메시지가 의외로 컨텍스트를 빠르게 갉아먹기 때문에, `/compact`나 `/clear`를 원격에서도 쓸 수 있다는 점을 적극 활용하는 게 좋다.

---

## 다른 원격 접근법과의 비교

| 방식 | Trigger | 실행 위치 | 셋업 | 어울리는 케이스 |
|------|---------|-----------|------|-----------------|
| **Remote Control** | claude.ai/code, 모바일 앱에서 메시지 | 내 머신 | `claude remote-control` | 진행 중 작업을 다른 기기에서 조종 |
| Dispatch | 모바일 앱에서 태스크 보내기 | 내 머신 (Desktop) | Desktop ↔ 모바일 페어링 | 외출 중 작업 위임, 셋업 최소 |
| Claude Code on the web | 브라우저에서 태스크 시작 | 클라우드 | 별도 셋업 거의 없음 | 클론도 안 한 레포에서 작업, 병렬 태스크 |
| SSH + tmux로 자기 노트북 접속 | 폰 SSH 클라이언트 | 내 머신 | DDNS, 키 관리, 방화벽 | 자유도 최대지만 셋업 무거움 |
| Channels (Telegram/Discord) | 외부 채팅 이벤트 | 내 머신 | 채널 플러그인 설치 | CI 실패 알림 등 이벤트 기반 |

**고르는 기준**

- 진행 중인 작업을 폰으로 잠깐 이어가려는 거면 → Remote Control
- 노트북도 안 켜고 클라우드에서 돌리고 싶다 → Claude Code on the web
- SSH 키랑 DDNS 다 갖췄고 자유도가 필요하다 → SSH + tmux

[Claude Code 에이전트 협력사와 일하기](/claude-code/2026/05/16/claude-code-agent-teams/)에서 다뤘던 멀티 에이전트 구성을 원격에서 조종하고 싶을 때는 Remote Control + `--spawn worktree`가 짝이 맞는다. 서브에이전트 워크트리들이 충돌하지 않게 분리되니까.

---

## 한계와 함정

솔직하게 정리한다.

### 1. 로컬 프로세스 죽으면 끝

터미널 닫거나 노트북 셧다운하면 세션 종료. sleep은 괜찮지만 셧다운/터미널 종료는 회복 불가다. tmux로 백업 띄워두는 게 사실상 필수.

### 2. 약 10분 네트워크 타임아웃

머신이 깨어 있는데 네트워크만 약 10분 이상 끊기면 프로세스가 알아서 종료된다. 카페에서 노트북 두고 나갔는데 와이파이 끊긴 시나리오에서 당한다. 다시 `claude remote-control`로 재시작 필요.

### 3. 인터랙티브 picker 명령 로컬 전용

| 원격에서 가능 | 로컬에서만 가능 |
|---------------|-----------------|
| `/compact` | `/mcp` |
| `/clear` | `/plugin` |
| `/context` | `/resume` |
| `/usage` | |
| `/exit` | |
| `/usage-credits` | |
| `/recap` | |
| `/reload-plugins` | |

MCP 서버 새로 붙이거나 플러그인 설치하는 작업은 폰에서 못 한다. 외출 중 환경 재구성은 안 된다는 뜻이다.

### 4. Ultraplan 시작하면 끊긴다

`ultraplan` 세션을 시작하는 순간 Remote Control 연결이 끊긴다. claude.ai/code 인터페이스를 둘이 동시에 못 쓰는 구조 때문이다. 외출 중 ultraplan 띄울 거면 미리 결정해야 한다.

### 5. 모바일 키보드의 현실

폰에서 긴 프롬프트 작성은 솔직히 고역이다. 짧은 지시("계속 진행", "이쪽으로 가지 마", "리뷰 결과 정리해줘") 위주로 굴리고, 본격 작업은 데스크탑에서 한다. 음성 입력이 의외로 쓸 만하지만 코드 토큰 인식은 여전히 거칠다.

### 6. 한 프로세스당 원격 세션 1개

서버 모드(`claude remote-control`)가 아닌 일반 모드(`claude --rc`)에서는 프로세스당 원격 세션 1개로 제한된다. 한 머신에서 여러 프로젝트를 병렬로 원격 조작하려면 서버 모드를 쓰거나 프로세스를 여러 개 띄워야 한다.

### 7. Team/Enterprise 기본 OFF

회사 계정이면 관리자가 admin settings에서 토글 켜기 전엔 못 쓴다. 데이터 보존 정책에 따라 토글 자체가 회색 처리되어 있을 수도 있다.

---

## 실무 워크플로우 예시

### 시나리오 A: 외출 전 활성화

```bash
# 출근 전 책상에서
cd ~/projects/my-shop
tmux new -s rc-shop
claude remote-control --name "shop-prod-fix" --spawn worktree

# Ctrl-b d 로 detach
# 노트북 그대로 두고 외근
```

지하철에서 폰으로 claude.ai/code 열어서 "어제 그 결제 버그 재현 테스트 작성해줘" 한 줄. 회사 도착해서 결과 확인.

### 시나리오 B: 회의 중 백그라운드 지시

회의실에서 노트북으로 발표하면서 폰으로 "방금 받은 피드백대로 인보이스 PDF 레이아웃 수정 시작해줘"를 메시지 하나로 던지기. 회의 끝나고 노트북 돌아오면 diff가 준비돼 있다.

### 시나리오 C: 침대에서 마무리

저녁에 침대에서 폰으로 "오늘 PR 리뷰 코멘트 다 반영했나 확인하고, 안 됐으면 정리해서 알려줘". 결과 보고 OK면 푸시 알림 켜놓고 잠들기 (`/config` → **Push when Claude decides**, v2.1.110 이상 필요).

---

## 정리

Remote Control은 **로컬 세션을 다른 기기로 연장하는 채널**이다. 클라우드 실행 대안이 아니라, 내 머신에 묶여 있던 Claude Code를 시공간적으로 자유롭게 만드는 기능에 가깝다.

| 적합 | 부적합 |
|------|--------|
| 로컬 환경 그대로 외부에서 조작 | 노트북 끄고 클라우드에서 돌리고 싶음 |
| MCP/CLAUDE.md/시크릿이 로컬에 있음 | 모바일에서 긴 프롬프트 자주 작성 |
| Pro/Max 플랜, claude.ai OAuth 로그인 | API 키 기반 환경 |
| 짧은 외출, 회의 중 백그라운드 지시 | 며칠 단위 자리 비움 (네트워크/프로세스 끊김 리스크) |
| tmux 운영에 익숙함 | 환경 재구성(MCP, 플러그인 설치) 원격으로 필요 |

리서치 프리뷰라 깔끔하지 않은 부분이 있다. GitHub 이슈 트래커에 서버 모드 worktree 관련 버그도 올라와 있다 (#45975). 핵심 기능은 충분히 쓸 만하지만, **로컬 프로세스가 죽으면 끝**이라는 본질적 제약은 인지하고 들어가야 한다.

---

## 출처

- [Claude Code Remote Control 공식 문서](https://code.claude.com/docs/en/remote-control) — 모든 플래그/명령/제약 1차 확인
- [docs.anthropic.com Remote Control 미러](https://docs.anthropic.com/en/docs/claude-code/remote-control) — 동일 문서로 리다이렉트
- [Claude Code Desktop 공식 문서](https://code.claude.com/docs/en/desktop) — Desktop 앱의 Dispatch/Code 탭 역할 확인
- [How to Control Claude Code from Your Phone — wmedia.es](https://wmedia.es/en/tips/claude-code-remote-control-from-phone) — 서버 모드 동작 교차 확인
- [GitHub Issue #45975 — Server mode session creation 400](https://github.com/anthropics/claude-code/issues/45975) — 알려진 버그 참조
