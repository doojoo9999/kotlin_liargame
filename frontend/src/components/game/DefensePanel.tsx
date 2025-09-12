import * as React from 'react'
import type {Player} from '@/types/game'

export interface DefenseQuestion { id: string; text: string }
export interface DefensePanelProps { accusedPlayer: Player; isDefending: boolean; questions: DefenseQuestion[]; onDefenseSubmit: (statement: string)=>void; onQuestionSubmit: (q: string)=>void }

export const DefensePanel: React.FC<DefensePanelProps> = ({accusedPlayer,isDefending,questions,onDefenseSubmit,onQuestionSubmit}) => {
  const [statement,setStatement] = React.useState('')
  const [question,setQuestion] = React.useState('')
  const submitStatement = (e: React.FormEvent) => { e.preventDefault(); if(statement.trim().length>2){ onDefenseSubmit(statement.trim()); setStatement('') } }
  const submitQuestion = (e: React.FormEvent) => { e.preventDefault(); if(question.trim().length>1){ onQuestionSubmit(question.trim()); setQuestion('') } }
  return (
    <div className='space-y-6' aria-label='변론 패널'>
      <header className='space-y-1'>
        <h3 className='font-semibold text-sm'>변론 단계</h3>
        <p className='text-xs text-gray-500'>지목된 플레이어: <span className='font-medium'>{accusedPlayer.nickname}</span></p>
      </header>
      {isDefending && (
        <form onSubmit={submitStatement} className='space-y-2'>
          <textarea className='w-full rounded border px-3 py-2 text-sm resize-none h-24' placeholder='변론을 입력하세요' value={statement} onChange={e=>setStatement(e.target.value)} />
          <div className='flex justify-end'>
            <button disabled={statement.trim().length<3} className='px-4 py-2 rounded bg-purple-600 text-white text-sm disabled:opacity-40'>제출</button>
          </div>
        </form>
      )}
      {!isDefending && (
        <form onSubmit={submitQuestion} className='space-y-2'>
          <input className='w-full rounded border px-3 py-2 text-sm' placeholder='질문 입력' value={question} onChange={e=>setQuestion(e.target.value)} />
          <div className='flex justify-end'>
            <button disabled={question.trim().length<2} className='px-3 py-1.5 rounded bg-blue-600 text-white text-xs disabled:opacity-40'>질문 보내기</button>
          </div>
        </form>
      )}
      <section className='space-y-2'>
        <h4 className='font-medium text-xs text-gray-600'>질문 목록</h4>
        <ul className='space-y-1 max-h-40 overflow-y-auto text-xs'>
          {questions.map(q=> <li key={q.id} className='p-2 rounded border bg-white'>{q.text}</li>)}
          {questions.length===0 && <li className='text-gray-400'>질문 없음</li>}
        </ul>
      </section>
    </div>
  )
}
void DefensePanel

