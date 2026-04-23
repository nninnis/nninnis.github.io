---
layout: post
title: "AI 코딩 도구 보안 가이드 - 회사에서 안전하게 쓰는 법"
date: 2026-02-27
category: ai
---

AI 코딩 도구를 안 쓰는 개발자는 이제 거의 없다. 그런데 "내 코드가 어디로 가는지" 생각해본 적 있는가?

2023년 삼성전자 엔지니어 3명이 ChatGPT에 소스 코드와 회의록을 붙여넣었다. 반도체 설비 측정 DB 코드, 장비 결함 식별 코드, 사내 회의 녹음 내용까지. 그 데이터는 OpenAI 서버에 저장됐고, 삼성은 결국 사내 생성형 AI 사용을 전면 금지했다.

이건 삼성만의 문제가 아니다.

---

## 직원들은 이미 데이터를 붙여넣고 있다

LayerX의 [Enterprise AI & SaaS Data Security Report 2025](https://go.layerxsecurity.com/the-layerx-enterprise-ai-saas-data-security-report-2025)에 따르면:

| 항목 | 수치 |
|------|------|
| GenAI에 데이터를 붙여넣는 직원 비율 | **77%** |
| 그 중 개인 계정 사용 비율 | **82%** |
| 1인당 하루 평균 붙여넣기 횟수 | 14회 |
| 민감 데이터 포함 붙여넣기 | 하루 3회 이상 |

GenAI 도구가 기업 데이터 유출 채널 1위다. 이메일, 파일 공유보다 많다.

기업 GenAI 사용의 89%는 IT 부서에서 파악조차 못 하고 있다. SSO 밖, 모니터링 밖, 정책 밖에서 일어난다.

---

## 내 코드는 어디로 가는가

AI 코딩 도구를 쓰면 코드가 외부 서버로 전송된다. 도구마다 다르다.

### Cursor

코드가 Cursor 서버로 전송된 후 모델 제공업체(OpenAI, Anthropic, Google)로 전달된다.

- **Privacy Mode ON**: 모델 제공업체 데이터 보존 없음. Cursor 자체는 일부 저장 가능. 학습에는 사용 안 함
- **Privacy Mode OFF**: 코드, 프롬프트, 에디터 액션 저장 가능. AI 기능 개선 및 모델 학습에 사용될 수 있음
- **Business 플랜**: OpenAI/Anthropic과 Zero Data Retention 계약 적용
- **그 외 플랜**: Privacy Mode ON이어도 모델 제공업체가 Trust & Safety 목적으로 최대 30일 보존 가능

코드베이스 인덱싱 시 코드가 청크 단위로 서버에 업로드된다. 임베딩 계산 후 원문은 삭제되지만 메타데이터(해시, 파일명)는 저장될 수 있다.

출처: [Cursor Security](https://cursor.com/security), [Cursor Data Use & Privacy](https://cursor.com/data-use)

### Claude Code

프롬프트, 파일, 응답이 Anthropic 서버로 전송된다.

- **API 사용**: 7일 보존 후 자동 삭제. 모델 학습에 사용 안 함
- **Pro/Max 플랜**: 사용자 선택에 따라 학습 데이터로 활용 가능. 미동의 시 30일 보존
- **Enterprise**: 기본적으로 학습에 사용 안 함. Zero Data Retention 옵션 제공

출처: [Anthropic Privacy Policy Updates](https://www.anthropic.com/news/updates-to-our-consumer-terms)

### GitHub Copilot

- **Individual**: 프롬프트와 제안 코드가 GitHub 서버에 전송. 코드 스니펫이 모델 개선에 사용될 수 있음
- **Business/Enterprise**: 프롬프트, 제안, 사용 데이터를 모델 학습에 사용하지 않음

### 핵심

**어떤 도구든 코드는 외부 서버로 나간다.** 차이는 보존 기간과 학습 활용 여부뿐이다.

---

## AI가 만든 코드는 안전한가

짧게 답하면, **아니다.**

### Veracode 2025 GenAI Code Security Report

100개 이상의 LLM에 80개 코드 완성 태스크를 테스트한 결과:

| 항목 | 수치 |
|------|------|
| 보안 테스트 실패율 (전체) | **45%** |
| Java 보안 실패율 | **72%** |
| XSS 취약점 미방어율 (CWE-80) | 86% |
| Log Injection 미방어율 (CWE-117) | 88% |

모델이 커져도 보안 성능은 개선되지 않았다. 코딩 정확도는 올라가는데 보안은 제자리다.

> "모델은 코딩 정확도는 꾸준히 향상되고 있지만, 보안 성능은 개선되지 않고 있다. 더 큰 모델이 더 안전한 것도 아니다. 이건 스케일링 문제가 아니라 구조적 문제다."
>
> — Veracode CTO Jens Wessling

출처: [Veracode 2025 GenAI Code Security Report](https://www.veracode.com/blog/genai-code-security-report/)

### GitGuardian: AI가 시크릿 유출을 늘린다

[GitGuardian State of Secrets Sprawl 2025](https://www.gitguardian.com/state-of-secrets-sprawl-report-2025)에 따르면:

- 2024년 GitHub 공개 레포에서 유출된 시크릿: **2,380만 건** (전년 대비 25% 증가)
- **Copilot 사용 레포의 시크릿 유출률**: 6.4% (일반 레포 4.6% 대비 **40% 높음**)
- 2022년에 유출된 시크릿의 70%가 아직 유효한 상태

AI 코딩 도구를 쓰면 생산성에 집중하게 되고, API 키나 토큰 같은 시크릿 관리에 소홀해진다.

---

## 새로운 공격 벡터: IDEsaster

2025년 12월, 보안 연구원 Ari Marzouk가 AI IDE에서 **30개 이상의 취약점**을 발견하고 이를 [IDEsaster](https://thehackernews.com/2025/12/researchers-uncover-30-flaws-in-ai.html)라 명명했다. 24개의 CVE가 발급됐다.

영향받은 도구: **GitHub Copilot, Cursor, Windsurf, JetBrains Junie, Roo Code, Kiro.dev, Zed.dev, Cline, Gemini CLI, Claude Code**

공격 체인:

```
1. 프롬프트 인젝션 (악성 코드 코멘트, GitHub 이슈, 설정 파일에 숨겨진 지시)
     ↓
2. AI 에이전트의 도구 악용 (파일 읽기/쓰기, 터미널 실행)
     ↓
3. IDE 기능 트리거 (설정 덮어쓰기, 데이터 유출, 원격 코드 실행)
```

### 실제 공격 사례

**Rules File Backdoor** ([Pillar Security 발견](https://www.pillar.security/blog/new-vulnerability-in-github-copilot-and-cursor-how-hackers-can-weaponize-code-agents)): `.cursorrules` 같은 설정 파일에 **보이지 않는 유니코드 문자**로 악성 지시를 숨긴다. 개발자 눈에는 정상 파일로 보이지만, AI는 숨겨진 지시를 따라 악성 코드를 생성한다. 일반적인 코드 리뷰로는 탐지 불가.

**IDE 설정 덮어쓰기** (CVE-2025-53773): GitHub 이슈에 페이로드를 넣으면, Copilot이 `.vscode/settings.json`을 수정해 임의 명령을 실행할 수 있다.

**MCP 서버 악용** (CVE-2025-61260): OpenAI Codex CLI가 MCP 서버 설정의 명령을 사용자 확인 없이 시작 시 자동 실행하는 취약점.

---

## 실무 보안 체크리스트

### 1. 민감 파일 차단

AI 도구에 전송되면 안 되는 파일을 명시적으로 제외한다.

**Cursor** — `.cursorignore`:

```
# 환경 변수 & 시크릿
.env
.env.*
*.key
*.pem
*.p12
secrets/
credentials/

# 인프라 설정
infra/
terraform.tfvars
**/docker-compose.prod.yml

# 개인정보 포함 가능 파일
**/migrations/
**/fixtures/
**/seed-data/
```

주의: `.cursorignore`는 AI 컨텍스트에서만 제외한다. **터미널이나 MCP 서버를 통한 접근은 막지 못한다.**

**Claude Code** — `.claudeignore`:

Claude Code도 동일한 패턴으로 `.claudeignore` 파일을 지원한다.

### 2. Privacy Mode 활성화

| 도구 | 설정 위치 |
|------|----------|
| Cursor | Settings → General → Privacy Mode |
| GitHub Copilot | GitHub Settings → Copilot → Manage policies |

기업 환경이면 Business/Enterprise 플랜을 써라. Zero Data Retention이 기본 적용된다.

### 3. 생성 코드 보안 검증

AI가 만든 코드를 그대로 머지하지 마라.

```bash
# 시크릿 탐지
npx @gitguardian/ggshield secret scan repo .

# 의존성 취약점 검사
npm audit
pip audit

# SAST (정적 분석)
npx eslint --ext .js,.ts src/
```

CI/CD 파이프라인에 넣어서 자동화하는 게 가장 좋다.

### 4. 설정 파일을 코드 리뷰 대상에 포함

```
# .github/CODEOWNERS 예시
.cursorrules       @security-team
.cursor/rules/     @security-team
.vscode/           @security-team
.mcp.json          @security-team
CLAUDE.md          @tech-lead
```

`.cursorrules`, `.mcp.json` 같은 AI 설정 파일 변경은 반드시 리뷰를 거쳐야 한다. Rules File Backdoor 공격은 이 파일들을 통해 들어온다.

### 5. MCP 서버 관리

```json
// .mcp.json — 신뢰할 수 있는 서버만
{
  "mcpServers": {
    "internal-db": {
      "command": "npx",
      "args": ["-y", "@company/mcp-db-server"],
      "env": {
        "DB_HOST": "localhost"
      }
    }
  }
}
```

- 신뢰할 수 있는 MCP 서버만 연결한다
- 서버 변경사항을 주기적으로 모니터링한다
- 프로덕션 DB 직접 연결은 절대 하지 않는다

### 6. 팀 가이드라인 수립

```markdown
## AI 코딩 도구 사용 정책 (예시)

### 허용
- 공개 가능한 코드에 AI 도구 사용
- Privacy Mode 활성화 상태에서 사용
- 회사 계정(SSO)으로 로그인

### 금지
- 고객 데이터, 인증 정보, 내부 API 키를 프롬프트에 포함
- 개인 계정으로 업무 코드 작업
- AI 생성 코드를 보안 검토 없이 프로덕션 배포
- Auto-run/YOLO 모드로 프로덕션 관련 작업

### 필수
- .cursorignore / .claudeignore 설정
- 생성 코드 보안 스캔 (CI/CD 통합)
- AI 설정 파일 변경 시 코드 리뷰
```

---

## OWASP Top 10 for LLM: 알아둬야 할 위험

[OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)는 LLM 애플리케이션의 10대 보안 위험을 정리한다. AI 코딩 도구 사용자가 특히 주의해야 할 항목:

| 순위 | 위험 | 코딩 도구에서의 의미 |
|------|------|---------------------|
| 1 | Prompt Injection | `.cursorrules`, 코드 코멘트에 숨겨진 악성 지시 |
| 2 | Sensitive Information Disclosure | 코드에 포함된 API 키, 토큰이 AI 서버로 전송 |
| 3 | Supply Chain | 악성 패키지 추천, 오염된 MCP 서버 |
| 6 | Excessive Agency | AI 에이전트의 과도한 파일/터미널 접근 권한 |

---

## 정리

| 위험 | 대응 |
|------|------|
| 코드가 외부 서버로 전송됨 | Privacy Mode ON, 민감 파일 `.cursorignore` 제외 |
| AI 코드의 45%가 보안 취약 | 생성 코드 보안 스캔 자동화 |
| 시크릿 유출 40% 증가 | GitGuardian 등 시크릿 탐지 도구 적용 |
| AI 설정 파일 통한 공격 | CODEOWNERS로 리뷰 필수화 |
| Shadow AI 사용 | 팀 정책 수립, 회사 계정 의무화 |

AI 코딩 도구는 안 쓸 수 없다. 생산성 차이가 너무 크다.

하지만 **"어디까지 보내도 되는지"**와 **"무엇을 검증해야 하는지"**를 모르면 생산성이 아니라 리스크를 키우는 거다.

도구를 잘 쓰는 것과 안전하게 쓰는 것은 다르다. 둘 다 해야 한다.

---

## 출처

- [Bloomberg: Samsung Bans ChatGPT After Leak](https://www.bloomberg.com/news/articles/2023-05-02/samsung-bans-chatgpt-and-other-generative-ai-use-by-staff-after-leak)
- [LayerX Enterprise AI & SaaS Data Security Report 2025](https://go.layerxsecurity.com/the-layerx-enterprise-ai-saas-data-security-report-2025)
- [Veracode 2025 GenAI Code Security Report](https://www.veracode.com/blog/genai-code-security-report/)
- [GitGuardian State of Secrets Sprawl 2025](https://www.gitguardian.com/state-of-secrets-sprawl-report-2025)
- [The Hacker News: IDEsaster - 30+ Flaws in AI Coding Tools](https://thehackernews.com/2025/12/researchers-uncover-30-flaws-in-ai.html)
- [Pillar Security: Rules File Backdoor Attack](https://www.pillar.security/blog/new-vulnerability-in-github-copilot-and-cursor-how-hackers-can-weaponize-code-agents)
- [Cursor Security](https://cursor.com/security)
- [Cursor Data Use & Privacy](https://cursor.com/data-use)
- [Anthropic Privacy Policy Updates](https://www.anthropic.com/news/updates-to-our-consumer-terms)
- [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)
