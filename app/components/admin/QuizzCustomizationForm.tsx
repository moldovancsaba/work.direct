"use client"

import React, { useState } from 'react'
import type { QuizzConfiguration, QuizzQuestion } from '../../types'

interface QuizzCustomizationFormProps {
  config?: Partial<QuizzConfiguration>
  onChange: (next: QuizzConfiguration) => void
}

export default function QuizzCustomizationForm({ config, onChange }: QuizzCustomizationFormProps) {
  const [rounds, setRounds] = useState<number>(config?.rounds || 5)
  const [targetCorrect, setTargetCorrect] = useState<number>(config?.targetCorrect || 3)
  const [mapName, setMapName] = useState<string>(config?.mapName || '')
  const [questions, setQuestions] = useState<QuizzQuestion[]>(config?.questions || [])

  const addQuestion = () => {
    const id = `q-${questions.length + 1}`
    const q: QuizzQuestion = {
      id,
      text: '',
      answers: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]
    }
    const next = [...questions, q]
    setQuestions(next)
    emit(next)
  }

  const updateQ = (idx: number, patch: Partial<QuizzQuestion>) => {
    const next = questions.map((q, i) => i === idx ? { ...q, ...patch } : q)
    setQuestions(next)
    emit(next)
  }

  const updateAnswer = (qIdx: number, aIdx: number, patch: Partial<{ text: string; isCorrect: boolean }>) => {
    const next = questions.map((q, i) => {
      if (i !== qIdx) return q
      const arr = q.answers.map((a, j) => j === aIdx ? { ...a, ...patch } : a)
      const answers: [typeof arr[number], typeof arr[number], typeof arr[number]] = [arr[0], arr[1], arr[2]]
      return { ...q, answers }
    }) as QuizzQuestion[]
    setQuestions(next)
    emit(next)
  }

  const removeQuestion = (idx: number) => {
    const next = questions.filter((_, i) => i !== idx)
    setQuestions(next)
    emit(next)
  }

  const emit = (qs = questions, override?: Partial<QuizzConfiguration>) => {
    onChange({
      mapName: override?.mapName ?? mapName,
      activeCoords: config?.activeCoords || [],
      rounds: override?.rounds ?? rounds,
      targetCorrect: override?.targetCorrect ?? targetCorrect,
      questions: qs,
      theme: config?.theme || 'default',
      texts: config?.texts || { submitAnswer: 'Submit', correctFeedback: 'Correct!', wrongFeedback: 'Try again' }
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Map Name (HexMap)</label>
          <input className="w-full px-3 py-2 border rounded" value={mapName} onChange={(e)=>{ const v = e.target.value; setMapName(v); emit(questions, { mapName: v }) }} placeholder="FLOWER or 7cloud" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rounds (Y)</label>
          <input type="number" min={1} className="w-full px-3 py-2 border rounded" value={rounds} onChange={(e)=>{ const n = Number(e.target.value)||1; setRounds(n); emit(questions, { rounds: n }) }} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Correct (X)</label>
          <input type="number" min={1} className="w-full px-3 py-2 border rounded" value={targetCorrect} onChange={(e)=>{ const n = Number(e.target.value)||1; setTargetCorrect(n); emit(questions, { targetCorrect: n }) }} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-md font-medium text-gray-800">Questions</h3>
          <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded" onClick={addQuestion}>Add Question</button>
        </div>
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={q.id} className="border rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Question {idx + 1}</span>
                <button type="button" className="px-2 py-1 bg-red-600 text-white rounded" onClick={()=> removeQuestion(idx)}>Remove</button>
              </div>
              <input className="w-full px-3 py-2 border rounded mb-2" value={q.text} onChange={(e)=> updateQ(idx, { text: e.target.value })} placeholder="Question text" />
              <div className="grid md:grid-cols-3 gap-2">
                {q.answers.map((a, aIdx) => (
                  <div key={aIdx} className="border rounded p-2">
                    <label className="text-xs text-gray-600">Answer {String.fromCharCode(65 + aIdx)}</label>
                    <input className="w-full px-2 py-1 border rounded" value={a.text} onChange={(e)=> updateAnswer(idx, aIdx, { text: e.target.value })} placeholder={`Answer ${aIdx+1}`} />
                    <label className="flex items-center gap-2 mt-1 text-sm">
                      <input type="checkbox" checked={a.isCorrect} onChange={(e)=> updateAnswer(idx, aIdx, { isCorrect: e.target.checked })} /> Correct
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
