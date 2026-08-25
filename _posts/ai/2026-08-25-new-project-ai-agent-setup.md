---
layout: post
title: "새 프로젝트 투입 전 AI 에이전트 세팅 — 신규 설치부터 첫 2주까지"
date: 2026-08-25
category: ai
---

새 프로젝트에 들어가면 대개 기기를 새로 받거나, 쓰던 노트북을 포맷하고 시작한다. 몇 년치 쌓인 설정이 한 번에 사라지고, 도메인도 모르는 코드베이스 앞에 빈 터미널만 남는다.

이 글은 그때 내가 그대로 따라가려고 쓰는 체크리스트다. 결론부터 쓰면 이렇다.

**세팅에서 중요한 건 설치가 아니라 순서와 절제다. 그리고 도메인을 모를 때 AI가 주는 답은 전부 가설이다 — 런타임으로 확인하기 전까지는.**

아래는 그 두 문장을 실행 가능한 단계로 푼 것이다.

---

## Step 0. 설치보다 먼저 — 반입 가능 여부부터 확인한다

가장 먼저 할 일은 winget을 두드리는 게 아니다. 이 도구들을 반입해도 되는지 확인하는 것이다.

에이전트 CLI는 소스 코드를 외부 API로 전송한다. 이건 기능이 아니라 동작 원리다. 승인 없이 켜면 계약 위반이 될 수 있고, 그건 기술 문제가 아니라 계약 문제다.

투입 첫날 확인할 항목:

- **원청/고객사의 AI 도구 사용 정책** — PM이 "AI 적극 활용" 방침을 밝혔더라도 보안팀 승인과는 별개다. 두 조직의 답이 다를 수 있다
- **소스 외부 전송 허용 범위** — 전체 금지인지, 특정 모듈만인지, 마스킹 조건부인지
- **망 구성** — 폐쇄망이면 애초에 CLI가 붙지 않는다. 인증도 안 된다
- **계정 정책** — 개인 계정 사용 가능 여부, 회사 발급 계정 강제 여부
- **로그·세션 보관 위치** — 에이전트는 대화 로그를 로컬에 남긴다. 반출 대상인지 확인

금지라면 도구 목록을 다시 짜야 한다. 이 확인을 건너뛰고 세팅부터 하면, 2주 뒤에 전부 지우게 된다.

---

## Step 1. 이관하지 않는다 — 새 기기는 새로 세운다

철수할 때 기기를 포맷하고 나오면 가져올 파일이 없다. 개인 기기의 설정을 업무 기기로 그대로 복사하는 것도 권하지 않는다. 개인 계정 흔적, 개인 프로젝트 경로, 이전 현장의 대화 로그가 함께 딸려 들어간다.

그래서 기본은 신규 설치다. 옮기는 건 파일이 아니라 **목록**이다. 아래 세 가지만 알고 있으면 30분이면 복구된다.

1. 쓰는 플러그인 목록 (Step 4에 정리해뒀다)
2. 전역 지침의 원칙
3. 로그인 계정

### 계정

인증 파일(`~/.claude/.credentials.json`, `~/.codex/auth.json`)은 어떤 경우에도 복사해서 옮길 대상이 아니다. 설치를 마친 뒤 새로 로그인한다. 준비할 건 계정 정보뿐이다.

### 전역 지침은 새로 쓰는 편이 낫다

포맷은 오히려 기회다. 개인 프로젝트에서 쓰던 지침이 업무 환경에 그대로 맞는 경우는 드물다. `~/.claude/CLAUDE.md`는 짧게, **프로젝트와 무관하게 항상 참인 것만** 적는다.

```markdown
# 전역 지침

## 답변
- 근거가 부족하면 "확실하지 않다"고 말한다. 추측으로 채우지 않는다
- 내 판단이 틀렸으면 지적한다. 무조건 동의하지 않는다

## 코드
- 요청하지 않은 리팩터링·파일 생성·의존성 추가 금지
- 변경 전에 대상 파일과 이유를 먼저 보고한다

## 금지
- .env, *.key, *.pem 등 자격증명 파일은 읽지도 수정하지도 않는다
- 대량 파일 삭제 전에는 반드시 확인받는다
```

길수록 지켜지지 않는다. 스무 줄 안쪽으로 끝낸다.

### 개인 기기와 업무 기기를 섞지 않는다

`~/.claude.json`, `~/.claude/projects/`, `~/.claude/sessions/`, `history.jsonl`에는 이전에 작업한 프로젝트의 경로와 대화 내용이 그대로 남아 있다. 기술적으로 문제가 생기지 않아도, 다른 현장 기기에서 발견되면 설명할 방법이 없다. 옮기지 않는다.

> 철수할 때 포맷하지 않았거나 백업이 가능한 상황이라면, 골라서 옮기는 방법을 이 글 맨 아래 [설정을 옮길 수 있을 때](#설정을-옮길-수-있을-때)에 따로 정리해뒀다.

---

## Step 2. 설치 — winget 우선, npm 최후

핵심 원칙 하나. **npm 전역 설치는 마지막 수단이다.** 에이전트 CLI는 이제 대부분 네이티브 배포판이 있고, winget으로 깔면 PATH·업데이트·제거가 OS 차원에서 관리된다. Node 버전을 갈아끼울 때 CLI가 같이 깨지는 일도 없다.

원칙 둘. **패키지는 이름이 아니라 ID로 지정한다.** 인기 있는 도구는 winget과 스토어에 비슷한 이름이 여럿 올라와 있고, 그중 상당수가 서드파티 래퍼거나 전혀 다른 프로그램이다. 아래 명령은 전부 `-e --id` 또는 스토어 제품 ID를 쓴다.

### 먼저 PowerShell 7

포맷 직후의 Windows 11에 들어 있는 건 Windows PowerShell 5.1이다. pwsh 7과는 별개 프로그램이고, 이 글의 나머지 명령은 전부 pwsh 7 기준이다. **가장 먼저 이것부터 깔고 셸을 갈아탄다.**

Windows PowerShell 5.1에서 한 줄:

```powershell
winget install -e --id Microsoft.PowerShell --accept-package-agreements --accept-source-agreements
```

설치가 끝나면 창을 닫고 **pwsh 7로 새로 연다.** Windows Terminal은 Windows 11에 기본 탑재돼 있으니 탭 드롭다운에서 PowerShell을 고르면 된다. 버전을 확인하고 넘어간다.

```powershell
$PSVersionTable.PSVersion     # Major 가 7 이어야 한다
```

기본 프로필도 pwsh로 바꿔둔다. Windows Terminal 설정(`Ctrl+,`) → 시작 → 기본 프로필 → PowerShell. 이걸 안 해두면 다음에 터미널을 열 때 또 5.1로 들어간다.

이후 명령은 전부 pwsh 7 창에서 실행한다.

### 기본 도구

소스를 갱신하고 시작한다.

```powershell
winget source update

$base = @(
  'Git.Git',
  'OpenJS.NodeJS.LTS',           # LTS. ID에 .LTS 를 빼면 current 가 깔린다
  'Microsoft.WindowsTerminal',   # Win11엔 기본 탑재. 최신화 목적
  'JanDeDobbeleer.OhMyPosh',
  'sxyazi.yazi',                 # TUI 파일 매니저
  'Microsoft.PowerToys'
)
foreach ($p in $base) {
  winget install -e --id $p --accept-package-agreements --accept-source-agreements
}
```

### AI 에이전트

```powershell
$agents = @(
  'Anthropic.ClaudeCode',        # Claude Code CLI (npm 불필요)
  'Anthropic.Claude',            # Claude 데스크탑
  'OpenAI.Codex',                # Codex CLI — 터미널 바이너리. 데스크탑은 아래 참고
  'StablyAI.Orca'                # Orca ADE
)
foreach ($p in $agents) {
  winget install -e --id $p --accept-package-agreements --accept-source-agreements
}
```

`Codex`, `Orca`는 winget에 이름이 겹치는 무관한 패키지가 여럿 있다. 위 ID를 그대로 쓴다.

### 로그인과 확인

메인으로 쓸 Claude Code부터 붙인다. 최초 실행 시 브라우저 인증이 열린다.

```powershell
claude          # 로그인
claude doctor   # 설치·설정·인증 상태 점검
codex login
codex doctor
```

이후 업데이트는 각자의 CLI로 한다.

```powershell
claude update
codex update
```

### CLI와 데스크탑은 별개 설치물이다

Claude도 Codex도 CLI와 데스크탑 앱이 서로 다른 패키지다. `claude app` 같은 서브커맨드는 없다. 다만 받는 경로가 갈린다.

| | CLI | 데스크탑 |
|---|---|---|
| Claude | winget `Anthropic.ClaudeCode` | winget `Anthropic.Claude` |
| Codex | winget `OpenAI.Codex` (portable zip) | Microsoft Store — ChatGPT 앱과 같은 물건 |

Codex 쪽이 헷갈리는 지점이다. **ChatGPT 데스크탑 앱이 곧 Codex 데스크탑이다.** 설치하고 나면 패키지 목록에 `OpenAI.Codex` 계열 MSIX로 잡힌다. 두 번 깔 필요가 없다.

스토어에는 비슷한 이름의 항목이 여럿 있으니 제품 ID를 직접 지정해서 받고, 게시자가 OpenAI로 표시되는지 확인한다.

```powershell
winget install --id 9PLM9XGG6VKS --source msstore
winget show    --id 9PLM9XGG6VKS --source msstore
codex app      # CLI에서 데스크탑 띄우기. 없으면 설치 관리자가 열린다
```

Codex CLI는 위 배열로 이미 깔았지만, 공식 저장소가 안내하는 정본 경로는 스크립트 쪽이다. 최신 채널을 따라가려면 이쪽이 확실하다.

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"
```

### Herdr — winget 말고 공식 스크립트

winget에 올라온 `Herdr.Herdr.Preview`는 이름 그대로 프리뷰 채널이고, `hdosys.herdr-win`은 비공식 윈도우 포크다. 공식 stable은 설치 스크립트로 받는다.

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://herdr.dev/install.ps1 | iex"
```

회사 노트북의 EDR이 이 형태(파일 없이 메모리에서 실행되는 스크립트)를 차단하는 경우가 흔하다. 그러면 cmd에서 파일로 내려받아 실행한다.

```cmd
curl.exe -fsSLo install.cmd https://herdr.dev/install.cmd && install.cmd && del install.cmd
```

설치 후 에이전트 연동을 붙이면 각 패널의 상태(작업 중/대기/차단)가 정확히 잡힌다.

```powershell
herdr integration install claude
herdr integration install codex
```

### IDE

구독을 끊고 폴백 버전을 쓰는 경우라면 winget이 아니라 JetBrains 계정의 라이선스 페이지에서 해당 연도 빌드를 직접 받는다. winget에는 폴백 버전이 없고, 최신 빌드를 받으면 라이선스가 안 맞는다.

구독 중이라면 winget으로 받는다.

```powershell
winget install -e --id JetBrains.IntelliJIDEA.Ultimate    # 구독 중일 때만
```

### 윈도우에서 빠뜨리면 아픈 git 설정

```powershell
git config --global core.longpaths true      # 경로 260자 제한 — 레거시 프로젝트에서 반드시 걸린다
git config --global core.autocrlf input      # 팀 표준 확인 후 결정
git config --global core.ignorecase false    # 대소문자만 다른 파일명 사고 방지
git config --global init.defaultBranch main
```

`core.longpaths`는 시스템 레벨도 같이 켜두는 편이 안전하다(관리자 pwsh).

```powershell
git config --system core.longpaths true
```

### macOS 세트

```bash
# Homebrew가 없다면
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install --cask claude-code            # Claude Code CLI
brew install --cask claude                 # Claude 데스크탑 (CLI와 별개)
brew install --cask chatgpt                # ChatGPT 데스크탑 = Codex 데스크탑
brew install --cask ghostty
brew install --cask stablyai/orca/orca     # Orca — 자체 탭
brew install herdr
brew install yazi

# Codex CLI — cask 이름과 달리 터미널 바이너리다
brew install --cask codex
# 또는 공식 스크립트
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

맥에서도 구조는 같다. cask로 받는다고 전부 GUI 앱인 것도 아니다. `claude-code`와 `codex`는 cask지만 터미널 바이너리고, 실제 데스크탑 앱은 `claude`·`chatgpt`·`ghostty`·`orca` 넷이다.

맥 네이티브 쪽에서 같이 해두면 좋은 것:

```bash
# 키 반복 입력 활성화 (터미널 편집 시)
defaults write -g ApplePressAndHoldEnabled -bool false

# 스크린샷 저장 위치 정리
mkdir -p ~/Pictures/Screenshots
defaults write com.apple.screencapture location ~/Pictures/Screenshots && killall SystemUIServer

# 잠자기 없이 오래 도는 에이전트 붙잡아두기
caffeinate -dimsu -t 28800    # 8시간
```

마지막 줄은 에이전트를 길게 돌릴 때 실제로 자주 쓴다.

---

## Step 3. 툴 배치 — 무엇을 언제 켜는가

먼저 주종을 정해둔다. **일은 Claude Code가 하고, Codex는 교차 검증에만 부른다.** 둘을 번갈아 쓰는 게 아니라 한쪽이 쓰고 다른 쪽이 반박하는 구조다. 아래 도구들은 전부 그 에이전트를 어디에 담을지의 문제다.

도구를 여러 개 쓴다고 그만큼 빨라지지 않는다. 각 도구가 열리는 조건이 서로 겹치지 않을 때만 의미가 있다. 지금 구성과 그 조건은 이렇다.

| 도구 | 여는 조건 |
|---|---|
| **Orca** | 결과를 내가 리뷰해야 하는 작업. diff를 봐야 하거나, 여러 갈래를 병렬로 돌려 비교할 때 |
| **pwsh + Herdr** (맥은 Ghostty + Herdr) | 던져놓고 나중에 볼 작업. 오래 도는 작업, 자리를 뜨는 동안 계속 돌아야 하는 작업 |
| **yazi** | Herdr에서 터미널을 벗어나지 않고 트리를 훑을 때 |
| **IntelliJ** | 코드가 실제로 어떻게 도는지 봐야 할 때. 디버거와 로컬 서버 |

Orca와 Herdr를 나누는 기준은 "파일을 보느냐"가 아니라 **내가 리뷰 루프 안에 있느냐**다. Orca는 태스크 하나에 worktree·터미널·브라우저 탭이 하나씩 붙는 구조라 결과를 나란히 놓고 고르는 작업에 강하다. Herdr는 반대로 백그라운드 서버가 터미널을 소유한다. 노트북을 덮거나 네트워크가 끊겨도 에이전트가 계속 돌고, 나중에 어디서든 다시 붙는다. 출퇴근하는 환경에서는 이 차이가 실질적이다.

### IntelliJ를 남겨두는 이유

에이전트가 코드를 쓰기 시작하면서 IDE의 편집 기능은 대부분 쓸 일이 없어졌다. 그런데도 IDE를 지우지 않는 건 에이전트가 대체하지 못하는 두 가지 때문이다.

**하나, 스텝 디버거.** 브레이크포인트를 걸고, 콜스택을 타고, 변수 트리를 까고, 그 자리에서 식을 평가하는 것. 이건 CLI에 대응물이 없다. JVM에 원격 디버그 포트를 여는 것(`-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005`)까지는 터미널로 되지만, 결국 **붙을 클라이언트가 IDE다.** DAP 기반 디버거를 붙일 수 있는 경량 에디터도 있지만, 멀티모듈 빌드와 프레임워크 클래스패스를 손으로 구성해야 하고 식 평가·데이터 뷰 수준은 아직 다르다.

**둘, 정확한 심볼 탐색.** 에이전트의 grep은 근사치고 IDE 인덱스는 정확하다. 호출 계층과 사용처를 빠짐없이 봐야 할 때 — 레거시에서 뭔가를 건드리기 전에는 늘 그래야 한다 — 이 차이가 크다.

여기에 하나 더. **도메인을 모를 때 디버거는 학습 도구다.** "이 버튼을 누르면 무슨 일이 일어나는가"를 가장 빨리 아는 방법은 문서도 AI도 아니고 브레이크포인트다. 에이전트는 코드를 읽고 **추론**하지만, 디버거는 **런타임 사실**을 준다. 도메인 이해도가 낮을수록 후자의 가치가 크다.

정리하면 이렇다. **에이전트가 대체한 건 코드를 쓰는 일이지, 코드가 도는 걸 보는 일이 아니다.** 새 도메인에 들어간 첫 몇 달은 IDE를 켜는 시간이 오히려 늘어나는 게 정상이고, 그건 후퇴가 아니라 보완이다.

서버 기동만 놓고 보면 `./gradlew bootRun` 한 줄로 끝나고 터미널이 더 편하다. 그래서 IDE는 구독 없이 폴백 버전으로 충분하다. 다만 **투입 첫날 프로젝트의 언어 버전을 확인**해야 한다. 폴백 빌드는 업데이트가 없어서 최신 언어 레벨 지원이 밀린다.

---

## Step 4. 플러그인 — 무엇을 깔고, 무엇을 안 까는가

첫날부터 다 깔지 않는다. 이건 취향이 아니라 순서 문제다. 스킬이 많으면 에이전트가 엉뚱한 걸 꺼내 든다.

### 첫날 깔 것

**superpowers** — 브레인스토밍, 체계적 디버깅, 계획 작성, 완료 전 검증 같은 프로세스 스킬 묶음. 여기서 실제로 값을 하는 건 두 개다. `systematic-debugging`(증상에서 바로 수정으로 건너뛰지 못하게 막는다)과 `verification-before-completion`(다 됐다고 말하기 전에 근거를 요구한다). 남의 코드베이스에서 특히 유용하다.

```powershell
claude plugin marketplace add anthropics/claude-plugins-official
claude plugin install superpowers@claude-plugins-official
```

**andrej-karpathy-skills** — 과설계 방지, 최소 변경, 가정 명시, 성공 기준 정의. 레거시에 손댈 때의 기본자세를 규칙으로 만든 것이다. 첫날 깔아도 부작용이 없는 몇 안 되는 스킬.

```powershell
claude plugin marketplace add forrestchang/andrej-karpathy-skills
claude plugin install andrej-karpathy-skills@karpathy-skills
```

**codex 플러그인** — Claude Code 안에서 Codex를 불러 교차 검증시킨다. 도메인을 모를 때 가장 위험한 건 그럴듯한 오답인데, 계열이 다른 모델에게 같은 판단을 다시 시키면 걸러지는 게 있다. 이 글의 마지막 절과 직결되는 도구다.

```powershell
claude plugin marketplace add openai/codex-plugin-cc
claude plugin install codex@openai-codex
```

### 1~2주차에 깔 것

**understand-anything** — 코드베이스를 훑어 지식 그래프를 만든다. 아키텍처 그래프, 업무 흐름 그래프, 온보딩 가이드, diff 분석까지 명령이 나뉘어 있다. 새 도메인에서 값을 하는 건 아키텍처보다 **업무 흐름 쪽**이다.

```powershell
claude plugin marketplace add Egonex-AI/Understand-Anything
claude plugin install understand-anything@understand-anything
```

**anthropic-agent-skills** — 공식 예제 스킬 묶음. `skill-creator`(반복 패턴을 스킬로 만들 때), `mcp-builder`, `webapp-testing`, 문서 스킬(`docx`/`xlsx`/`pptx`)이 들어 있다. SI 현장에서 산출물이 워드·엑셀로 오가는 걸 생각하면 문서 스킬이 의외로 자주 쓰인다.

```powershell
claude plugin marketplace add anthropics/skills
claude plugin install example-skills@anthropic-agent-skills
claude plugin install document-skills@anthropic-agent-skills
```

### 3주차 이후에 만들 것

**harness** — 전문 에이전트와 스킬을 함께 정의하는 메타 스킬. 강력하지만 **첫날에 쓰면 안 된다.** 도메인을 모르는 상태에서 만든 하네스는 추측으로 세운 규칙이고, 2주 뒤에 전부 뜯게 된다. 하네스는 **반복되는 패턴이 눈에 보인 다음** 만드는 것이다.

```powershell
claude plugin marketplace add revfactory/harness
claude plugin install harness@harness-marketplace
```

### 안 까는 것

나머지 전부. 영상 요약, 다이어그램, 디자인 계열 스킬은 이 프로젝트에서 쓸 일이 없으면 깔지 않는다. 스킬은 필요할 때만 로드되지만, **에이전트가 꺼내 들 선택지 목록은 항상 늘어난다.**

### 깔아둔 것 중 상황에 안 맞는 것 끄기

남의 레거시를 고치는 자리에서 TDD 스킬이 발동하면 방해만 된다. 세 가지 방법이 있고, 아래로 갈수록 강하다.

**1) 프로젝트 CLAUDE.md에 적는다** — 가장 가볍다. 대부분 이걸로 충분하다.

```markdown
## 사용하지 않을 스킬
- test-driven-development — 기존 테스트 체계를 따른다. 새 테스트 프레임워크 도입 금지
```

**2) 스킬 하나만 끈다** — `~/.claude/settings.json`(전역) 또는 프로젝트 `.claude/settings.json`에 `skillOverrides`를 넣는다. 프로젝트 쪽에 넣으면 그 프로젝트에서만 꺼진다.

```json
{
  "skillOverrides": {
    "superpowers:test-driven-development": "disabled"
  }
}
```

**3) 플러그인을 통째로 끈다** — 스킬 몇 개가 아니라 묶음 전체가 안 맞을 때.

```powershell
claude plugin disable superpowers@claude-plugins-official
claude plugin list                                          # 상태 확인
claude plugin enable superpowers@claude-plugins-official    # 되돌리기
```

지우는 게 아니라 끄는 것이므로 언제든 되돌릴 수 있다. 일단 껐다가 필요할 때 켜는 쪽이 낫다.

### 내장 기능도 챙긴다

플러그인보다 먼저 있는 것들이다.

- `/init` — 코드베이스를 훑어 `CLAUDE.md` 초안을 만든다. 첫날에 한 번
- `/fewer-permission-prompts` — 반복되는 권한 승인 창을 정리한다. 3~4일 쓴 뒤 한 번 돌리면 체감이 크다
- `/security-review` — 커밋 전 보안 점검. 남의 코드베이스에서 특히
- **프로젝트별 메모리** — `~/.claude/projects/<프로젝트>/memory/`에 도메인 사실이 세션을 넘어 쌓인다. 용어와 담당자, 예외 규칙을 여기 남기면 다음 세션이 알고 시작한다

---

## Step 5. 첫 2~3주 순서

```
Day 0    반입 정책 확인 → 신규 설치 → 로그인 → 전역 지침 작성
Day 1    빌드와 로컬 실행부터 성공시킨다        ← AI 분석보다 먼저
Day 1-2  담당 모듈 범위로 업무 흐름 분석 → 디버거로 한 흐름 검증
Day 3-5  첫 태스크. 바닐라 + 카파시 지침만. 하네스 없이
Week 2-3 반복 패턴이 세 개 이상 보이면 그때 스킬·하네스
상시     도메인 용어집 축적
```

Day 1이 제일 중요하다. **안 도는 코드는 분석해도 소용없다.** 로컬에서 서버가 뜨고 화면이 열리기 전까지는 에이전트에게 아무것도 시키지 않는 편이 낫다. 빌드 환경 자체가 첫 번째 도메인 지식이기도 하다 — 어떤 프로파일이 있고, 어떤 외부 시스템을 목으로 대체하고, 어떤 설정이 사내 저장소에서 오는지.

Day 1-2의 분석은 **전체가 아니라 담당 모듈 범위로 한정**한다. 대형 SI 코드베이스 전체 그래프를 뽑아봐야 읽을 수 있는 양이 아니고, 읽어도 남지 않는다.

그리고 분석 결과를 그대로 믿지 않는다. **한 흐름을 골라 디버거로 따라간다.** 이 한 번이 나머지 분석 결과의 신뢰도를 정해준다.

### 첫날 프로젝트 CLAUDE.md는 스무 줄이면 된다

`/init`으로 초안을 만든 뒤 이 정도로 줄인다.

```markdown
# 프로젝트 규칙

## 빌드 / 실행
- 빌드: <명령>
- 로컬 실행: <명령>
- 테스트: <명령>

## 절대 하지 말 것
- <운영 설정 파일> 수정 금지
- 공통 모듈(<경로>) 변경 시 반드시 먼저 물어볼 것
- 기존 코드 스타일을 바꾸는 리팩터링을 요청 없이 하지 말 것
- 스키마 변경, 마이그레이션 파일 생성 금지

## 코드 컨벤션
- 주변 코드를 따른다. 새 패턴을 도입하지 않는다
- 로그는 기존 로거 사용 (<예시>)

## 참고
- 도메인 메모: <경로>
- 용어집: docs/glossary.md
```

"절대 하지 말 것"이 "잘 해줘"보다 훨씬 잘 지켜진다.

---

## 실전 프롬프트 — 그대로 복사해서 쓰는 것들

세팅이 끝나고 처음 켰을 때 뭘 쳐야 할지가 실제로는 제일 막막하다. 상황별로 정리해둔다.

### 1. 첫 프롬프트 — 코드베이스 파악

전체를 분석시키지 않는다. 범위를 좁히고, 모르는 걸 모른다고 말하게 만든다.

```
나는 이 프로젝트에 오늘 투입됐고 도메인 지식이 없다.
지금은 <모듈경로> 하나만 이해하려고 한다.

다음 순서로 조사해서 보고해줘. 코드는 아직 수정하지 마라.

1. 이 모듈의 진입점(컨트롤러/스케줄러/리스너)을 전부 찾고, 각각 한 줄로 무슨 일을 하는지
2. 그중 가장 자주 호출될 것 같은 흐름 하나를 골라, 진입점부터 DB까지 호출 경로를 단계로
3. 이 모듈이 의존하는 외부 시스템(다른 서비스, 배치, 큐, 외부 연동 등)
4. 코드만 봐서는 알 수 없어서 담당자에게 물어야 하는 것 5가지

4번을 가장 신경 써서 써라. 추측으로 채우지 말고,
확실하지 않은 건 "확실하지 않음"이라고 명시해.
```

마지막 두 문장이 핵심이다. 이게 없으면 4번이 비고, 대신 그럴듯한 추측이 1~3번을 채운다.

### 2. 도메인 용어집 만들기

새 도메인에서 투자 대비 효과가 가장 큰 산출물이다. 업계 약어는 검색해도 안 나오고, 회의에서 못 알아들으면 그 회의는 통째로 날아간다.

```
이 코드베이스에서 도메인 용어를 추출해서 용어집 초안을 만들어줘.

대상: 클래스명·테이블명·컬럼명·enum·상수에 반복해서 나타나는
업무 용어와 약어. 기술 용어(Service, Repository, DTO 등)는 제외.

출력 형식 (docs/glossary.md 로 저장):
| 용어 | 추정 의미 | 근거 (파일:라인) | 확인 필요 |

- "추정 의미"는 코드 근거가 있을 때만 채우고, 없으면 비워둬
- "확인 필요"에는 담당자에게 확인할 질문을 한 줄로
- 빈도순으로 정렬해서 상위 40개
```

이 파일은 회의 때마다 갱신한다. 두 달쯤 지나면 팀에서 제일 정확한 문서가 되어 있다.

### 3. 회의 전 — AI를 질문 생성기로 쓴다

도메인을 모를 때 제일 비싼 실수는 회의에서 못 물어보는 것이다. 그 자리에서는 뭘 모르는지조차 모른다.

```
내일 <기능/모듈> 관련해서 현업 담당자와 회의가 있다.
관련 코드는 <경로>다.

코드를 읽고, 내가 물어야 할 질문 목록을 만들어줘.

- 코드만으로는 판단 불가능한 업무 규칙 위주로
- 예외 처리 분기, 하드코딩된 상수, 주석이 이상한 곳,
  이름과 동작이 안 맞아 보이는 곳을 특히 봐라
- 질문마다 "왜 이게 궁금한지" 코드 근거를 한 줄씩
- 중요도순 10개

내가 이 도메인 초심자라는 걸 감안해서,
"당연히 아는 것"으로 전제하고 넘어가는 게 없게 해줘.
```

### 4. 커밋 히스토리에서 이유 찾기

SI 프로젝트는 주석이 부실한 대신 히스토리에 이유가 남아 있다. "이 이상한 분기는 왜 있나"의 답은 대개 커밋 메시지나 이슈 번호에 있다.

```
<파일경로>의 <메서드명>이 왜 이런 구조인지 알고 싶다.

git log -p --follow 로 이 파일의 변경 이력을 추적하고,
이 메서드에 로직이 추가/변경된 커밋만 골라서
"언제, 무엇이, 왜(커밋 메시지·이슈번호 기준)"를 시간순으로 정리해줘.

특히 예외 처리나 조건 분기가 추가된 시점을 찾아라.
그건 대개 장애가 있었다는 뜻이다.
```

### 5. 첫 태스크 — 명시적으로 시킨다

스킬을 깔아뒀어도 "이거 해줘"라고만 하면 안 쓴다. 대놓고 지시해야 쓴다.

```
<티켓번호>: <요구사항>

작업 전에 지켜라.
- karpathy-guidelines 스킬을 적용해서 최소 변경으로 간다
- 기존 코드 스타일과 패턴을 따른다. 새 라이브러리·새 패턴 금지
- 손대기 전에 변경 대상 파일과 이유를 먼저 보고하고 내 승인을 받아라

완료 기준 (이게 다 되기 전엔 완료라고 하지 마라).
1. <구체적 동작>이 <조건>에서 <결과>를 낸다
2. 기존 테스트 전부 통과
3. 변경한 파일 목록과 각각의 변경 이유 한 줄씩

모르는 도메인 규칙이 나오면 추측하지 말고 멈추고 물어라.
```

완료 기준을 숫자로 쓰는 게 핵심이다. 이게 없으면 "완료했습니다"의 기준을 에이전트가 정한다.

### 6. 답을 의심할 때

이 글에서 가장 자주 쓰게 될 프롬프트다.

```
방금 준 답변에 대해, 이번엔 반대 입장에서 검토해줘.

- 이 결론이 틀렸다면 어디서 틀렸을 가능성이 가장 높은가
- 코드에서 직접 확인한 사실과, 네가 일반적인 패턴에서
  추론한 것을 분리해서 표시해라
- 런타임으로 확인해야만 알 수 있는 부분은 어디인가

동의하려고 하지 말고 반증을 찾아라.
```

계열이 다른 모델에 같은 걸 물어보는 것도 방법이다. codex 플러그인을 깔아둔 이유가 이거다.

```
/codex:rescue 위 분석이 맞는지 독립적으로 검증해줘.
Claude의 결론에 동의하지 말고 직접 코드를 읽고 판단해라.
```

---

## 도메인 없이 빠르게 적응하기

도구 얘기를 다 걷어내면 남는 건 이거다. **새 도메인에서 AI는 속도를 두 배로 올려주지만, 틀린 방향의 속도도 두 배로 올려준다.**

AI는 기본적으로 사용자에게 동의하는 쪽으로 기운다. 내가 "이거 이런 구조 맞지?"라고 물으면 대체로 맞다고 한다. 도메인을 아는 사람은 그 답이 이상하면 안다. 모르는 사람은 모른다. **도메인 초심자와 예스맨 AI의 조합이 이 시기의 가장 큰 위험**이고, 세팅을 아무리 잘해도 이건 안 없어진다.

그래서 지키는 것 네 가지.

**하나, AI의 답은 전부 가설로 취급하고 런타임으로 확인한다.** 브레이크포인트를 걸고 실제 데이터를 본다. 로그를 찍는다. 테스트를 돌린다. 분석 결과와 실제가 다른 순간이 반드시 오는데, 그 한 번이 나머지 전부의 신뢰도를 정해준다. IDE를 지우지 않는 이유가 여기 있다.

**둘, 확실한 것과 추측을 분리해서 말하게 시킨다.** 프롬프트에 "확실하지 않으면 확실하지 않다고 써라"를 넣는 것만으로 답의 질이 달라진다. 위 프롬프트들에 이 문장이 반복해서 들어 있는 게 우연이 아니다.

**셋, 사람에게 물을 것과 AI에게 물을 것을 나눈다.** 코드가 어떻게 동작하는지는 AI가 낫고, **왜 그렇게 되어 있는지는 사람만 안다.** 업무 규칙, 예외의 사연, 안 건드리는 게 좋은 부분. 회의 전에 AI로 질문을 뽑고, 회의에서 사람에게 확인하고, 답을 메모에 남겨 다시 AI 컨텍스트로 돌려보낸다. 이 순환이 도는 순간부터 속도가 붙는다.

**넷, 회의록과 사양서를 AI에 넣기 전에 반출 범위를 확인한다.** Step 0으로 돌아가는 얘기다. 코드보다 문서 쪽 규정이 더 빡빡한 경우가 많다.

---

세팅은 하루면 끝난다. 도구 목록은 반년 뒤에 또 바뀌어 있을 것이고 그래도 상관없다. 남는 건 순서다.

**반입 확인 → 새 기기는 새로 → 설치는 ID로 지정 → 첫날은 빌드 성공 → 분석은 좁게 → 하네스는 나중에 → 그리고 AI가 준 답은 전부 런타임으로 확인.**

새 프로젝트에 들어갈 때마다 이 문단만 다시 읽으면 된다.

---

## 설정을 옮길 수 있을 때

철수할 때 기기를 포맷하지 않았거나, 개인 기기 사이에서 옮기는 경우라면 골라서 이관할 수 있다. 원칙은 하나다. **통째로 복사하지 않고 화이트리스트로 고른다.**

<details markdown="1">
<summary><strong>가져갈 것과 버릴 것 (펼치기)</strong></summary>

### 절대 가져가지 않을 것

| 경로 | 이유 |
|---|---|
| `~/.claude/.credentials.json` | 인증 토큰. 새 기기에서 로그인할 대상이지 복사할 대상이 아니다 |
| `~/.codex/auth.json` | 위와 동일 |
| `~/.claude.json` | 이전 프로젝트 경로와 대화 히스토리가 전부 들어 있다 |
| `~/.claude/projects/`, `sessions/`, `history.jsonl` | 위와 동일. 세션 원본 |
| `~/.codex/sessions/`, `*.sqlite` | 위와 동일 |
| 프로젝트별 `.claude/settings.local.json` | 이전 환경의 로컬 경로·허용 규칙 |

세 번째 줄이 핵심이다. 이전 현장의 코드 경로와 대화 내용이 다음 현장 기기에 남는 건 사고다.

### 가져갈 것

| 경로 | 내용 |
|---|---|
| `~/.claude/settings.json` | 모델·훅·권한·상태줄 설정 (민감값 제거 후) |
| `~/.claude/CLAUDE.md` | 전역 지침 |
| `~/.claude/skills/` | 직접 만든 스킬 |
| `~/.claude/plugins/installed_plugins.json` | 재설치용 목록 |
| `~/.claude/plugins/known_marketplaces.json` | 마켓플레이스 목록 |
| `~/.codex/config.toml` | Codex 설정 (프로젝트 신뢰 목록은 지우고) |
| `~/.codex/AGENTS.md` | Codex 전역 지침 |
| `~/.gitconfig`, 셸 프로파일 | 일반 개발 설정 |

플러그인 캐시(`~/.claude/plugins/cache/`)는 옮길 필요 없다. 목록만 있으면 새 기기에서 다시 받는다.

### 백업 — pwsh

```powershell
$dst = "$env:USERPROFILE\Desktop\agent-backup"
New-Item -ItemType Directory -Force -Path "$dst\claude\plugins", "$dst\codex" | Out-Null

Copy-Item "$env:USERPROFILE\.claude\settings.json"  "$dst\claude\" -ErrorAction SilentlyContinue
Copy-Item "$env:USERPROFILE\.claude\CLAUDE.md"      "$dst\claude\" -ErrorAction SilentlyContinue
Copy-Item "$env:USERPROFILE\.claude\skills"         "$dst\claude\" -Recurse -ErrorAction SilentlyContinue
Copy-Item "$env:USERPROFILE\.claude\plugins\installed_plugins.json"  "$dst\claude\plugins\" -ErrorAction SilentlyContinue
Copy-Item "$env:USERPROFILE\.claude\plugins\known_marketplaces.json" "$dst\claude\plugins\" -ErrorAction SilentlyContinue
Copy-Item "$env:USERPROFILE\.codex\config.toml"     "$dst\codex\" -ErrorAction SilentlyContinue
Copy-Item "$env:USERPROFILE\.codex\AGENTS.md"       "$dst\codex\" -ErrorAction SilentlyContinue

# 인증정보가 섞여 들어가지 않았는지 확인
Get-ChildItem $dst -Recurse -File |
  Where-Object { $_.Name -match 'credential|auth|token' } |
  Select-Object FullName
```

마지막 블록을 꼭 돌린다. 눈으로 한 번 보고 넘어간다.

### 백업 — macOS / Linux

```bash
dst=~/Desktop/agent-backup
mkdir -p "$dst/claude/plugins" "$dst/codex"

cp    ~/.claude/settings.json "$dst/claude/" 2>/dev/null
cp    ~/.claude/CLAUDE.md     "$dst/claude/" 2>/dev/null
cp -R ~/.claude/skills        "$dst/claude/" 2>/dev/null
cp    ~/.claude/plugins/installed_plugins.json  "$dst/claude/plugins/" 2>/dev/null
cp    ~/.claude/plugins/known_marketplaces.json "$dst/claude/plugins/" 2>/dev/null
cp    ~/.codex/config.toml    "$dst/codex/" 2>/dev/null
cp    ~/.codex/AGENTS.md      "$dst/codex/" 2>/dev/null

# 인증정보가 섞여 들어가지 않았는지 확인
find "$dst" -type f | grep -Ei 'credential|auth|token'
```

### 복원

```powershell
# Windows
$src = "D:\agent-backup"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.claude", "$env:USERPROFILE\.codex" | Out-Null
Copy-Item "$src\claude\*" "$env:USERPROFILE\.claude\" -Recurse -Force
Copy-Item "$src\codex\*"  "$env:USERPROFILE\.codex\"  -Recurse -Force
```

```bash
# macOS / Linux
src=/Volumes/BACKUP/agent-backup
mkdir -p ~/.claude ~/.codex
cp -R "$src"/claude/* ~/.claude/
cp -R "$src"/codex/*  ~/.codex/
```

로그인은 복사하지 않고 새로 한다.

```powershell
claude
codex login
```

플러그인은 목록을 보고 다시 설치한다. 마켓플레이스를 먼저 등록해야 한다.

```powershell
claude plugin marketplace add anthropics/claude-plugins-official
claude plugin marketplace add anthropics/skills
claude plugin install superpowers@claude-plugins-official
# 이하 installed_plugins.json 을 보고 반복
claude plugin list
```

</details>

---

## 참고 링크

**설치·설정 문서**

- [Claude Code — 플러그인 레퍼런스](https://code.claude.com/docs/en/plugins-reference) — 마켓플레이스, `skillOverrides`, 플러그인 구조
- [openai/codex](https://github.com/openai/codex) — 설치 경로와 `codex app`
- [Codex CLI 문서](https://learn.chatgpt.com/docs/codex/cli)
- [Orca 문서](https://www.onorca.dev/docs) — worktree 구조, 설치
- [Herdr 설치 문서](https://herdr.dev/docs/install/) — `install.ps1`, EDR 차단 시 `install.cmd`, 에이전트 연동
- [Zed — Debugger](https://zed.dev/docs/debugger) — DAP 지원 언어 목록. Java는 확장으로 제공된다

**이 글에서 설치한 플러그인**

- [superpowers](https://github.com/anthropics/claude-plugins-official) — 공식 마켓플레이스
- [andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)
- [codex 플러그인](https://github.com/openai/codex-plugin-cc) — Claude Code에서 Codex 호출
- [understand-anything](https://github.com/Egonex-AI/Understand-Anything)
- [anthropic-agent-skills](https://github.com/anthropics/skills) — `skill-creator`, 문서 스킬 등
- [harness](https://github.com/revfactory/harness)

**패키지 ID 확인**

winget ID는 시간이 지나면 바뀌거나 동명이인이 늘어난다. 이 글의 ID를 그대로 쓰기 전에 한 번 확인하는 게 안전하다.

```powershell
winget search <이름>
winget show -e --id <ID>     # 게시자 확인
```
