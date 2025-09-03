# 라이어 게임 Main Version 개발 가이드

> **새로운 구조화된 가이드가 준비되었습니다!**

이 파일은 더 체계적이고 사용하기 쉬운 Phase 기반 문서로 재구성되었습니다.

## 📂 새로운 문서 위치

**메인 가이드**: [docs/agent_order/README.md](./docs/agent_order/README.md)

### 📋 Phase별 상세 가이드

- **[Phase 0: 프로젝트 준비 및 분석](./docs/agent_order/phase-0-preparation.md)**
  - 기존 코드베이스 분석
  - 기술 스택 호환성 검증
  - 최적화된 프로젝트 구조 설계

- **[Phase 1: 기반 환경 구축](./docs/agent_order/phase-1-foundation.md)**
  - shadcn/ui 환경 구축
  - 기본 컴포넌트 데모 개발

- **[Phase 2: 핵심 컴포넌트 개발](./docs/agent_order/phase-2-components.md)**
  - 게임 특화 컴포넌트 시스템 개발
  - 동적 애니메이션 시스템 구축

- **[Phase 3: 통합 및 버전 관리](./docs/agent_order/phase-3-integration.md)**
  - 공통 모듈 분리 및 추출
  - 버전 관리 시스템 구현

- **[Phase 4: 고급 기능 및 완성도](./docs/agent_order/phase-4-advanced.md)**
  - 고급 사용자 경험 구현
  - 접근성 및 성능 최적화

- **[Phase 5: 테스트 및 배포](./docs/agent_order/phase-5-deployment.md)**
  - 종합 테스트 및 검증
  - 배포 준비 및 최종 최적화

---

## 🚀 시작하기

새로운 구조화된 가이드를 사용하려면:

1. [**메인 README**](./docs/agent_order/README.md)에서 프로젝트 개요 확인
2. **Phase 0**부터 순차적으로 진행
3. 각 Phase의 체크리스트를 활용하여 진행상황 추적

---

## ✨ 개선사항

- **모듈화**: 각 Phase가 독립된 파일로 분리
- **가독성**: 명확한 구조와 체계적인 정리
- **실용성**: 복사하기 쉬운 프롬프트와 코드 예제
- **추적성**: Phase별 완료 기준과 체크리스트

---

## 📊 프로젝트 개요

### 🎯 목표
- **Light Version**: 기존 Mantine 기반 (저사양 사용자)
- **Main Version**: Radix UI + shadcn/ui + Framer Motion (고사양 사용자)

### 🛠 기술 스택
| 구분 | Light Version | Main Version |
|------|---------------|--------------|
| **UI Framework** | Mantine | Radix UI + shadcn/ui |
| **Styling** | emotion + Mantine | Tailwind CSS |
| **Animation** | 최소한 | Framer Motion |
| **Forms** | Mantine Forms | React Hook Form + Zod |

### ⏱ 예상 개발 기간
**총 19-26일** (Phase 0-5)

---

**새로운 문서 구조로 더 효율적인 개발을 진행하세요!**