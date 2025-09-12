import * as React from 'react'
import {validateValue, type ValidationRule} from '@/utils/validation'

export interface FormState { values: Record<string, any>; errors: Record<string,string>; touched: Record<string, boolean>; isValid: boolean; isSubmitting: boolean }
export interface UseFormOptions { initialValues?: Record<string, any>; rules?: Record<string, ValidationRule[]>; onSubmit?: (values: Record<string, any>)=>Promise<void>|void }

export function useForm(opts: UseFormOptions = {}) {
  const {initialValues = {}, rules = {}, onSubmit} = opts
  const [values,setValues] = React.useState<Record<string, any>>(initialValues)
  const [errors,setErrors] = React.useState<Record<string,string>>({})
  const [touched,setTouched] = React.useState<Record<string,boolean>>({})
  const [isSubmitting,setIsSubmitting] = React.useState(false)

  const validateField = React.useCallback((name: string, val: any) => {
    const r = rules[name]
    if(!r) return undefined
    for(const rule of r){
      const res = validateValue(val, rule)
      if(res!==true) return res as string
    }
    return undefined
  },[rules])

  const setValue = (name: string, val: any) => {
    setValues(v=>({...v,[name]:val}))
    setTouched(t=>({...t,[name]:true}))
    const err = validateField(name,val)
    setErrors(e=>({...e,[name]:err||''}))
  }

  const validateAll = () => {
    const newErrors: Record<string,string> = {}
    for(const k of Object.keys(rules)){
      const err = validateField(k, values[k])
      if(err) newErrors[k] = err
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length===0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!validateAll()) return
    if(onSubmit){
      try { setIsSubmitting(true); await onSubmit(values) } finally { setIsSubmitting(false) }
    }
  }

  const isValid = React.useMemo(()=> Object.values(errors).every(x=>!x),[errors])

  return { values, errors, touched, isValid, isSubmitting, setValue, handleSubmit, validateAll }
}
void useForm

