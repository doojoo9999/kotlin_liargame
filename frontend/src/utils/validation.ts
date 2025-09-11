export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  bannedWords?: string[]
  custom?: (value: string) => boolean | string
}

export function validateValue(value: any, rule: ValidationRule): true | string {
  if(rule.required && (value===undefined || value===null || value==='')) return '필수 입력'
  if(typeof value === 'string'){
    if(rule.minLength!==undefined && value.length < rule.minLength) return `최소 ${rule.minLength}자`
    if(rule.maxLength!==undefined && value.length > rule.maxLength) return `최대 ${rule.maxLength}자 초과`
    if(rule.pattern && !rule.pattern.test(value)) return '형식 오류'
    if(rule.bannedWords){
      const found = rule.bannedWords.find(w=> value.toLowerCase().includes(w.toLowerCase()))
      if(found) return '금지어 포함'
    }
  }
  if(rule.custom){
    const r = rule.custom(value)
    if(r !== true) return typeof r === 'string' ? r : '검증 실패'
  }
  return true
}

export function validateAll(values: Record<string, any>, rules: Record<string, ValidationRule[]>): Record<string,string> {
  const errors: Record<string,string> = {}
  for(const key of Object.keys(rules)){
    for(const rule of rules[key]){
      const res = validateValue(values[key], rule)
      if(res !== true){ errors[key] = res; break }
    }
  }
  return errors
}

void validateValue

