### **[프롬프트 시작]**

**Your Role:**
당신은 React의 훅(Hook) 기반 아키텍처와 모범적인 사용자 경험(UX) 설계에 매우 능숙한 월드클래스 프론트엔드 엔지니어, Gemini Code Assist Agent입니다.

**Primary Objective:**
현재 아무런 피드백이 없는 '콘텐츠 추가' 기능에 대해, 사용자의 액션(주제/단어 추가) 결과를 명확하게 알려주는 **비침입적이고 일관된 피드백 시스템**을 구축합니다. 이 작업을 통해 사용자의 불확실성을 해소하고, 애플리케이션의 신뢰도와 전반적인 완성도를 향상시키는 것을 목표로 합니다.

**Background & Problem:**
현재 `AddContentDialog` 모달에서 사용자가 새로운 주제나 단어를 추가했을 때, 성공 여부나 실패 사유를 전혀 알 수 없습니다. 이는 사용자가 자신의 요청이 올바르게 처리되었는지 확신할 수 없게 만들어 매우 나쁜 사용자 경험을 유발합니다. 우리는 이 '피드백 루프'의 끊어진 고리를 연결해야 합니다.

**Your Detailed Task:**
당신의 임무는 이미 존재하는 `useSnackbar`와 `useContentActions` 훅을 활용하여, **아키텍처적으로 가장 우아하고 효율적인 방식**으로 피드백 시스템을 구현하는 것입니다. UI 컴포넌트는 최대한 '멍청하게(dumb)' 유지하고, 모든 비즈니스 로직과 피드백 처리는 커스텀 훅 내부에서 캡슐화하여 처리해야 합니다.

**1. `useContentActions` 훅 리팩토링 (핵심 작업)**

*   **파일:** `C:/Users/nb021/Downloads/kotlin_liargame/kotlin_liargame/frontend/src/hooks/useContentActions.js`
*   **요구사항:**
    *   `handleAddSubject`와 `handleAddWord` 함수 내부에 `try...catch` 블록을 사용하여 API 호출을 감싸세요.
    *   **성공 피드백:** `try` 블록에서 `addSubject` 또는 `addWord` API 호출이 성공적으로 완료된 후, `showSnackbar` 함수를 호출하여 성공 메시지를 표시하세요.
        *   예시: `showSnackbar(\`주제 '${subjectName}'이(가) 추가되었습니다.\`, 'success');`
    *   **실패 피드백:** `catch` 블록에서 에러 객체를 받아, 백엔드에서 제공하는 사용자 친화적인 오류 메시지(예: `error.response.data.message`)를 추출하세요. 만약 해당 메시지가 없다면 "작업에 실패했습니다."와 같은 기본 메시지를 사용합니다. 추출한 메시지를 `showSnackbar` 함수에 `'error'` 타입과 함께 전달하여 실패 사유를 명확히 표시하세요.

**2. `LobbyPage.jsx`의 의존성 연결**

*   **파일:** `C:/Users/nb021/Downloads/kotlin_liargame/kotlin_liargame/frontend/src/pages/LobbyPage.jsx`
*   **요구사항:**
    *   `useContentActions` 훅을 호출할 때, `useSnackbar` 훅에서 반환된 `showSnackbar` 함수를 인자로 전달하고 있는지 확인하세요. 이는 `useContentActions` 훅이 스낵바를 제어할 수 있도록 권한을 부여하는 과정입니다.
        *   `const { handleAddSubject, handleAddWord } = useContentActions({ addSubject, addWord, showSnackbar, subjects });` 와 같은 형태가 되어야 합니다.

**3. `AddContentDialog.jsx`의 역할 유지**

*   **파일:** `C:/Users/nb021/Downloads/kotlin_liargame/kotlin_liargame/frontend/src/components/lobby/dialogs/AddContentDialog.jsx`
*   **요구사항:**
    *   이 컴포넌트는 **절대** 직접적인 피드백 로직(예: `useState`를 사용한 에러 메시지 관리)을 포함해서는 안 됩니다.
    *   이 컴포넌트의 역할은 오직 사용자 입력을 받아 부모로부터 받은 `handleAddSubject` 또는 `handleAddWord` 함수를 호출하는 것으로 제한되어야 합니다. 현재 구조가 이 원칙을 잘 따르고 있으므로, 추가적인 로직 구현은 불필요합니다.

**Final Verification Checklist:**
작업 완료 후, 다음 시나리오를 반드시 확인하여 임무 완수를 증명하세요:

1.  **주제 추가 성공:** `AddContentDialog`에서 새로운 주제를 입력하고 '추가' 버튼을 클릭했을 때, 화면에 "주제 '새 주제'이(가) 추가되었습니다."와 같은 초록색 성공 스낵바가 나타나는가?
2.  **주제 추가 실패 (중복):** 이미 존재하는 주제를 추가하려고 시도했을 때, 백엔드가 보내주는 "이미 존재하는 주제입니다."와 같은 오류 메시지가 빨간색 스낵바로 나타나는가?
3.  **단어 추가 성공/실패:** 단어 추가 시나리오에 대해서도 위 1, 2번과 동일한 방식의 성공/실패 피드백이 정상적으로 동작하는가?
4.  **코드 아키텍처:** `AddContentDialog.jsx` 파일은 피드백 로직 없이 깨끗하게 유지되고, 모든 피드백 처리 로직은 `useContentActions.js` 파일 내에 성공적으로 캡슐화되었는가?

### **[프롬프트 종료]**