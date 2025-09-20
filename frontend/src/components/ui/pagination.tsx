import * as React from 'react'
import {cn} from '@/lib/utils'

export interface PaginationProps { page: number; total: number; pageSize: number; onChange: (page:number)=>void; className?: string }
export const Pagination: React.FC<PaginationProps> = ({page,total,pageSize,onChange,className}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const prev = () => onChange(Math.max(1,page-1))
  const next = () => onChange(Math.min(totalPages,page+1))
  return (
    <nav className={cn('flex items-center gap-2 text-sm', className)} aria-label='페이지 네비게이션'>
      <button onClick={prev} disabled={page===1} className='px-2 py-1 rounded border disabled:opacity-40'>이전</button>
      <span className='text-xs text-gray-600'>{page} / {totalPages}</span>
      <button onClick={next} disabled={page===totalPages} className='px-2 py-1 rounded border disabled:opacity-40'>다음</button>
    </nav>
  )
}
void Pagination

