export interface StepConfig { id: string; title: string; isValid?: boolean; visited?: boolean }

export function getNextStep(steps: StepConfig[], currentId: string): string | null {
  const idx = steps.findIndex(s=>s.id===currentId)
  if(idx<0) return null
  for(let i=idx+1;i<steps.length;i++) if(!steps[i].isValid && steps[i]) return steps[i].id
  return null
}

export function getPrevStep(steps: StepConfig[], currentId: string): string | null {
  const idx = steps.findIndex(s=>s.id===currentId)
  if(idx<=0) return null
  return steps[idx-1].id
}

export function progressPercent(steps: StepConfig[], currentId: string): number {
  const total = steps.length
  if(total===0) return 0
  const currentIndex = steps.findIndex(s=>s.id===currentId)
  const completed = steps.filter(s=>s.isValid).length
  const base = (completed/total)*100
  return Math.max(base, ((currentIndex+1)/total)*10) // 최소 진행감
}

void getNextStep

