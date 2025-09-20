/**
 * 닉네임 검증 유틸리티
 * 
 * 규칙:
 * - 한글과 영어만 허용
 * - 초성이나 자음만 사용 불가 (ㅁㄴㅇㄹ, ㅏㅏㅡㅡㅏ 등)
 * - 특수문자 사용 불가
 * - 2-12자 길이 제한
 * - 대소문자 구분 없음 (정규화)
 */

export interface NicknameValidationResult {
  isValid: boolean;
  error?: string;
  normalizedNickname?: string;
}

/**
 * 한글 완성형 문자인지 확인
 * 가-힣 범위의 완성된 한글만 허용
 */
const isCompleteKorean = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return code >= 0xAC00 && code <= 0xD7A3;
};

/**
 * 한글 초성/중성/종성 단독 문자인지 확인
 */
const isIncompleteKorean = (char: string): boolean => {
  const code = char.charCodeAt(0);
  // 초성 (ㄱ-ㅎ)
  if (code >= 0x3131 && code <= 0x314E) return true;
  // 중성 (ㅏ-ㅣ)
  if (code >= 0x314F && code <= 0x3163) return true;
  // 종성은 초성과 겹치므로 별도 체크 불필요
  return false;
};

/**
 * 영어 문자인지 확인 (a-z, A-Z)
 */
const isEnglish = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return (code >= 0x41 && code <= 0x5A) || (code >= 0x61 && code <= 0x7A);
};

/**
 * 닉네임 정규화 (공백 제거, 소문자 변환)
 */
export const normalizeNickname = (nickname: string): string => {
  return nickname.trim().toLowerCase();
};

/**
 * 닉네임 유효성 검증
 */
export const validateNickname = (nickname: string): NicknameValidationResult => {
  // 기본 검증
  if (!nickname || typeof nickname !== 'string') {
    return {
      isValid: false,
      error: '닉네임을 입력해주세요.'
    };
  }

  const trimmedNickname = nickname.trim();
  
  if (trimmedNickname.length === 0) {
    return {
      isValid: false,
      error: '닉네임을 입력해주세요.'
    };
  }

  // 길이 제한 (2-12자)
  if (trimmedNickname.length < 2) {
    return {
      isValid: false,
      error: '닉네임은 최소 2자 이상이어야 합니다.'
    };
  }

  if (trimmedNickname.length > 12) {
    return {
      isValid: false,
      error: '닉네임은 최대 12자까지 입력 가능합니다.'
    };
  }

  // 문자별 검증
  for (let i = 0; i < trimmedNickname.length; i++) {
    const char = trimmedNickname[i];
    
    // 불완전한 한글 문자 체크 (초성, 중성, 종성 단독)
    if (isIncompleteKorean(char)) {
      return {
        isValid: false,
        error: '완성된 한글만 사용할 수 있습니다. (초성, 중성, 종성 단독 사용 불가)'
      };
    }
    
    // 허용된 문자인지 체크 (완성된 한글 또는 영어)
    if (!isCompleteKorean(char) && !isEnglish(char)) {
      return {
        isValid: false,
        error: '한글과 영어만 사용할 수 있습니다.'
      };
    }
  }

  // 정규화된 닉네임
  const normalizedNickname = normalizeNickname(trimmedNickname);

  return {
    isValid: true,
    normalizedNickname
  };
};

/**
 * 두 닉네임이 같은지 비교 (대소문자 무시)
 */
export const isSameNickname = (nickname1: string, nickname2: string): boolean => {
  return normalizeNickname(nickname1) === normalizeNickname(nickname2);
};

/**
 * 닉네임 유효성 검증을 위한 정규식들
 */
export const NICKNAME_PATTERNS = {
  // 완성된 한글만 (가-힣)
  COMPLETE_KOREAN: /^[가-힣]+$/,
  // 영어만 (a-z, A-Z)
  ENGLISH: /^[a-zA-Z]+$/,
  // 한글 + 영어 조합
  KOREAN_ENGLISH: /^[가-힣a-zA-Z]+$/,
  // 불완전한 한글 문자들 (초성, 중성, 종성)
  INCOMPLETE_KOREAN: /[ㄱ-ㅎㅏ-ㅣ]/
} as const;

/**
 * 빠른 닉네임 형식 체크 (정규식 사용)
 */
export const quickValidateNickname = (nickname: string): boolean => {
  const trimmed = nickname.trim();
  
  // 길이 체크
  if (trimmed.length < 2 || trimmed.length > 12) {
    return false;
  }
  
  // 불완전한 한글 문자 체크
  if (NICKNAME_PATTERNS.INCOMPLETE_KOREAN.test(trimmed)) {
    return false;
  }
  
  // 한글+영어 조합만 허용
  return NICKNAME_PATTERNS.KOREAN_ENGLISH.test(trimmed);
};