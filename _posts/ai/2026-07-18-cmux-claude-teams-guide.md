---
layout: post
title: "iTerm2에서 cmux로 갈아탄 뒤 정리한 사용 설명서 — claude-teams, 멀티 페인, 세션 복원"
date: 2026-07-18
category: claude-code
---

터미널을 iTerm2에서 cmux로 옮긴 지 좀 됐다. 그냥 예쁜 터미널로 쓰다가 손해 보는 부분이 많아서, 제대로 쓰는 법을 정리한다.

---

## cmux가 뭔데

Ghostty 기반의 네이티브 macOS 터미널이다. 포지셔닝이 명확하다. **여러 AI 코딩 에이전트를 동시에 돌리기 위한 터미널.** 일반 터미널 기능에 더해서 이런 게 붙어 있다.

- 에이전트 페인 자동 분할·관리
- 사이드바에서 페인별 상태·알림 확인
- 내장 브라우저 (에이전트가 결과물을 직접 띄워서 검증 가능)
- 세션 스냅샷 저장·복원

iTerm2에서 탭 여러 개 띄워놓고 알트탭 하던 걸 생각하면, 방향 자체가 다르다.

---

## claude-teams — 갈아탄 결정적 이유

```bash
cmux claude-teams
```

이 한 줄이 하는 일이 생각보다 많다.

1. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 환경변수를 자동으로 설정한다
2. PATH에 tmux shim을 깔아서, Claude Code가 날리는 tmux 명령(`split-window`, `send-keys`, `capture-pane`)을 cmux 네이티브 분할 API로 번역한다
3. `claude --teammate-mode auto`로 진입한다

결과: Claude가 팀메이트 에이전트를 스폰하면 **각 에이전트가 네이티브 페인으로 화면에 뜬다.** 설계 담당, 구현 담당, QA 담당이 각자 페인에서 동시에 일하는 걸 실시간으로 본다. tmux 설정 한 줄 안 만지고 이게 된다.

옆에서 보면 화면이 바둑판처럼 갈라지면서 에이전트들이 각자 일하는 것처럼 보이는데, 실제로 그게 맞다.

---

## 기존 `claude -n 작업명` 습관은 어떻게 되나

`claude-teams` 뒤의 **모든 인자는 Claude Code로 그대로 포워딩된다.** 그래서 기존에 쓰던 옵션을 전부 그대로 쓴다.

```bash
cmux claude-teams -n 결제모듈-리팩토링
cmux claude-teams --continue
cmux claude-teams --model sonnet
```

즉 `claude ...` 자리에 `cmux claude-teams ...`를 넣는다고 생각하면 끝이다. 갈아타면서 커맨드 습관을 버릴 필요가 없다.

여기에 더해 cmux 쪽에도 이름 개념이 있다. 워크스페이스 단위로 이름을 붙일 수 있어서, 나는 **워크스페이스 이름 = 프로젝트, `-n` = 세션 작업명**으로 이원화해서 쓴다. 사이드바에서 프로젝트별로 묶여 보이니까 세션이 몇 개든 안 헷갈린다.

---

## 페인 레이아웃 — 자동 배치와 커스텀

팀메이트 페인의 기본 배치는 이렇다.

- 메인 Claude 세션이 왼쪽
- 팀메이트들이 **오른쪽 컬럼에 세로로 스택**
- 에이전트가 스폰되거나 종료될 때마다 **자동으로 균등 분할(auto-equalize)**

즉 팀메이트 페인은 일일이 손댈 필요가 없다. 에이전트가 3개면 오른쪽이 3등분, 하나 끝나면 2등분으로 알아서 재조정된다.

일반 작업용 레이아웃은 0.64.18부터 **named layout**이 생겼다. 현재 분할 상태를 이름 붙여 저장하고, 새 워크스페이스 메뉴에서 불러온다. 기본 레이아웃 지정도 된다.

```
현재 분할 상태 → 이름 붙여 저장
새 워크스페이스 → 저장한 레이아웃으로 시작
기본 레이아웃 지정 → 모든 새 워크스페이스에 적용
```

"에디터 넓게 + 오른쪽에 로그 2개" 같은 자기 패턴이 있으면 한 번 저장해두고 계속 재사용한다. 매번 손으로 쪼개던 iTerm2 시절이랑 비교하면 이게 체감이 크다.

---

## "세션이 살아있는 터미널"의 실체

cmux를 검색하면 세션 지속성 얘기가 많이 나오는데, 개념을 정확히 알아야 한다. tmux처럼 서버 프로세스가 백그라운드에서 계속 도는 방식이 **아니다.**

cmux는 Application Support 밑에 JSON 스냅샷을 계속 기록한다. 여기 들어가는 것:

- 윈도우·워크스페이스·페인 레이아웃
- 각 페인의 작업 디렉토리
- 터미널 스크롤백 (best effort)
- 내장 브라우저의 URL과 네비게이션 히스토리

앱을 재시작하면 이 스냅샷에서 화면을 통째로 재구성한다. 레이아웃, cwd, 스크롤백, 브라우저까지 어제 마지막 화면 그대로 돌아온다.

### 그럼 프로세스는?

공식 문서 표현이 정확하다. "cmux restores what it owns and what supported tools expose through their own resume APIs. It does not checkpoint arbitrary terminal processes."

- 임의의 실행 중 프로세스(빌드, vim, ssh)는 복원 안 된다. 그냥 새 셸로 뜬다
- 대신 **Claude Code 같은 지원 도구는 자기 세션 ID로 이어서 복원된다**

이게 핵심이다. cmux가 각 페인의 에이전트 세션 ID를 추적해뒀다가, 재시작 시 해당 세션을 resume해서 띄운다. 대화 컨텍스트까지 그대로다.

Claude Code는 `cmux claude-teams`의 wrapper가 hook을 자동 주입해서 **별도 설정 없이 바로 된다.** Codex 같은 다른 에이전트 CLI를 쓰면 한 번만 hook을 깔아주면 된다.

```bash
cmux hooks setup codex --yes   # 다른 에이전트 CLI용, 최초 1회
```

### 퇴근할 때 컴퓨터 끄면 의미 없는 거 아닌가

나도 처음에 이 의문이 들었는데, 결론은 반대다. **전원이 꺼져도 스냅샷은 디스크에 있다.** 다음 날 켜면:

- 어제의 워크스페이스·페인 배치 그대로 복원
- 각 페인이 어제 그 디렉토리에서 시작
- Claude 세션은 hooks 설정돼 있으면 어제 대화 이어서 resume

즉 "프로세스가 밤새 살아있는" 게 아니라 "**아침에 어제 상태로 재조립되는**" 방식이다. 퇴근 시 뭘 저장하고 말고 할 것도 없다. 그냥 끄면 된다. 아침 루틴이 "터미널 켜고 프로젝트 폴더 찾아가서 claude 다시 띄우기"에서 "cmux 켜기"로 줄었다.

### 단점도 있다

공정하게 쓰면:

- 복구는 마지막 스냅샷 기준이다. 크래시 직전 몇 초는 날아갈 수 있다
- resume API 없는 도구(로컬에서 돌리던 dev 서버, watch 프로세스)는 죽은 채로 빈 셸만 온다. 이건 named layout에 startup command를 물려서 우회한다
- 원격 호스트에서 tmux 의미론이 필요하면 여전히 tmux가 맞다. cmux도 문서에서 이 경우는 tmux 쓰라고 선을 긋는다
- 버전 업데이트가 빠른 만큼 가끔 회귀가 있다. Claude Code 쪽 업데이트와 물려서 페인 스폰이 잠깐 깨진 적도 있었다. 겪으면 양쪽 버전을 최신으로 맞추는 게 일단 정답이다

---

## 더 파보고 건진 기능들

공식 문서를 훑으면서 실무에 바로 쓸만한 것만 추렸다.

### 단축키는 이것만 외우면 된다

| 동작 | 단축키 |
|---|---|
| 새 워크스페이스 / 이름 변경 | ⌘N / ⌘⇧R |
| 워크스페이스 전환 | ⌘P (팔레트) 또는 ⌘1~9 |
| 페인 분할 (오른쪽 / 아래) | ⌘D / ⌘⇧D |
| 페인 포커스 이동 | ⌥⌘←→↑↓ |
| 페인 줌 토글 | ⌘⇧↩ |
| 사이드바 토글 | ⌘B |
| 내장 브라우저 열기 | ⌘⇧L |
| 명령 팔레트 | ⌘⇧P |

이 중 **⌘⇧↩(페인 줌)**이 팀 모드에서 특히 좋다. 팀메이트가 4개 갈라져 있어도 보고 싶은 페인 하나만 전체화면으로 확 키웠다가 돌아온다.

### 알림 — 에이전트 입력 대기를 놓치지 않는다

멀티 에이전트의 고질병이 "어느 페인이 내 입력을 기다리는지 모르는 것"이다. cmux는 에이전트가 멈추거나 입력을 기다리면 사이드바와 데스크톱 알림으로 알려준다. cmux 창을 보고 있으면 데스크톱 배너는 자동 억제되고, 다른 앱에 가 있을 때만 뜬다.

긴 빌드에도 붙일 수 있다:

```bash
./gradlew build && cmux notify "빌드 끝"
```

### 브라우저 자동화 — 에이전트에게 눈을 달아준다

내장 브라우저는 그냥 미리보기가 아니라 CLI로 전부 조작된다:

```bash
cmux browser open http://localhost:4000
cmux browser screenshot --out /tmp/page.png
cmux browser console list    # 콘솔 로그 수집
cmux browser errors list     # JS 에러 목록
cmux browser click "button[type='submit']"
cmux browser wait --text "Welcome"
```

이게 왜 중요하냐면, **에이전트가 자기 결과물을 직접 열어서 검증할 수 있다.** 내 QA 에이전트는 게임을 구현하면 내장 브라우저로 띄우고, 클릭해보고, 콘솔 에러를 읽고 돌아온다. "스크린샷 찍어서 붙여주세요" 왕복이 사라진다.

### custom commands — 프로젝트 환경 원샷 세팅

`./.cmux/cmux.json`(프로젝트) 또는 `~/.config/cmux/cmux.json`(전역)에 액션과 워크스페이스 레이아웃을 정의해두면, 명령 팔레트나 단축키 하나로 "분할 레이아웃 + 각 페인의 실행 커맨드"가 한 번에 뜬다.

```json
{
  "actions": {
    "dev": {
      "type": "workspace",
      "title": "Dev Environment",
      "workspace": {
        "name": "blog",
        "cwd": ".",
        "layout": { "...": "에디터 + jekyll serve + 브라우저 분할" }
      },
      "shortcut": "cmd+shift+j"
    }
  }
}
```

named layout이 "모양 저장"이라면 이건 "모양 + 각 페인에서 뭘 실행할지"까지 저장이다. 아까 단점으로 꼽은 "dev 서버는 복원 안 됨" 문제의 해법이 이거다. 수정 후 `cmux reload-config`로 적용.

### SSH — 원격에서도 똑같이 굴러간다

```bash
cmux ssh user@remote --name "dev-server"
```

`~/.ssh/config`의 별칭·키·프록시를 그대로 읽는다. 눈여겨볼 것 두 가지:

- 원격 세션 안에서 `cmux claude-teams`가 **로컬과 동일하게 동작한다.** 원격 호스트의 릴레이 데몬이 같은 tmux-compat 변환을 처리해서, 팀메이트 페인 분할까지 그대로다
- 내장 브라우저를 원격 워크스페이스에서 열면 **HTTP 트래픽이 원격 네트워크를 경유한다.** 포트포워딩 설정 없이 원격 서버의 `localhost:3000`에 바로 접속된다

원격 개발 서버에서 에이전트 돌리는 사람이라면 이 두 개만으로도 갈아탈 이유가 된다.

---

## 내가 정착한 워크플로우

정리하면 이렇게 쓰고 있다.

```bash
# 클코는 hook 자동 주입이라 설정 불필요. 다른 에이전트 CLI만 최초 1회
cmux hooks setup codex --yes

# 프로젝트마다
⌘N 새 워크스페이스 → ⌘⇧R 이름 변경 (이름 = 프로젝트명)
cmux claude-teams -n 오늘의-작업명

# 전환은 ⌘P 또는 ⌘1~9
```

1. 굵직한 기능 작업은 claude-teams로 던진다. 설계·구현·QA 에이전트가 페인으로 갈라져서 동시에 돈다
2. 나는 왼쪽 메인 페인에서 지시만 하고, 오른쪽 컬럼에서 각 에이전트 진행 상황을 눈으로 확인한다
3. QA 에이전트는 cmux 내장 브라우저로 결과물을 직접 띄워서 검증한다. 스크린샷 왕복이 없다
4. 퇴근할 때 그냥 끈다. 다음 날 cmux 켜면 워크스페이스·세션 전부 어제 그대로다

멀티 에이전트를 "설정해서 만든다"는 느낌이 아니라, 터미널이 원래 그렇게 생겨먹은 것처럼 쓰게 되는 게 cmux의 가치다.

---

## 요약

| 궁금했던 것 | 답 |
|---|---|
| `claude -n 작업명` 못 쓰나 | `cmux claude-teams -n 작업명` — 인자 전부 포워딩됨 |
| 페인 배치 바꿀 수 있나 | 팀메이트는 자동 배치(오른쪽 세로 스택 + 균등 분할), 일반 레이아웃은 named layout 저장·재사용 |
| 세션이 살아있다는 게 뭔가 | 프로세스 유지가 아니라 스냅샷 복원. 레이아웃·cwd·스크롤백·브라우저 상태 |
| 전원 끄면 의미 없나 | 아니다. 스냅샷은 디스크에 있고, Claude 세션은 대화 컨텍스트까지 resume된다 |
| 단점 | 임의 프로세스는 복원 불가, 원격은 여전히 tmux 영역, 빠른 업데이트에 따른 간헐적 회귀 |

---

Sources:
- [cmux 공식 문서 (한국어)](https://cmux.com/ko/docs/)
- [cmux docs — Claude Code Teams](https://cmux.com/docs/agent-integrations/claude-code-teams)
- [cmux blog — Session restore in cmux](https://cmux.com/blog/session-restore)
- [cmux blog — Claude Code teammate agents as native cmux panes](https://cmux.com/blog/cmux-claude-teams)
- [Claude Code Docs — Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams)
