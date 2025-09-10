'use client'

import React from 'react'

interface PlatformSettingsFormProps {
  texts: Record<string, string>
  styles: any
  onTextsChange: (next: Record<string, string>) => void
  onStylesChange: (next: any) => void
}

// PlatformSettingsForm — Central texts/styles for 4-page flow
// What: Provides TEXT_10..46 + hero/main/scoreboard styles
// Why: Enforces consistent UI across all games; modules only fill the PLAY step.
export default function PlatformSettingsForm({ texts, styles, onTextsChange, onStylesChange }: PlatformSettingsFormProps) {
  const getT = (k: string, fb = '') => texts?.[k] ?? fb
  const setT = (k: string, v: string) => onTextsChange({ ...texts, [k]: v })

  const getS = (path: string, fb = '') => {
    try {
      return path.split('.').reduce((acc: any, key: string) => (acc && acc[key] !== undefined ? acc[key] : undefined), styles) ?? fb
    } catch { return fb }
  }
  const setS = (path: string, v: any) => {
    const keys = path.split('.')
    const next = { ...styles }
    let cur: any = next
    for (let i = 0; i < keys.length - 1; i++) {
      cur[keys[i]] = cur[keys[i]] || {}
      cur = cur[keys[i]]
    }
    cur[keys[keys.length - 1]] = v
    onStylesChange(next)
  }

  const TextInput = ({ code, label, placeholder, multiline }: { code: string, label: string, placeholder?: string, multiline?: boolean }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} ({code})</label>
      {multiline ? (
        <textarea className="w-full px-3 py-2 border rounded-md min-h-20" value={getT(code)} onChange={e => setT(code, e.target.value)} placeholder={placeholder || ''} />
      ) : (
        <input className="w-full px-3 py-2 border rounded-md" value={getT(code)} onChange={e => setT(code, e.target.value)} placeholder={placeholder || ''} />
      )}
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Hero Settings */}
      <div className="bg-slate-50 p-4 rounded-lg">
        <h3 className="text-md font-medium text-gray-800 mb-2">Hero Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput code="TEXT_10" label="Welcome Title" placeholder="Welcome" />
          <TextInput code="TEXT_20" label="Rules Title" placeholder="Game Rules" />
          <TextInput code="TEXT_30" label="Game Title" placeholder="Game" />
          <TextInput code="TEXT_40" label="Result Title" placeholder="Results" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hero Background</label>
            <input className="w-full px-3 py-2 border rounded-md" value={getS('hero.background')} onChange={e => setS('hero.background', e.target.value)} placeholder="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title Class</label>
            <input className="w-full px-3 py-2 border rounded-md" value={getS('hero.titleClass')} onChange={e => setS('hero.titleClass', e.target.value)} placeholder="text-2xl md:text-3xl font-bold text-white" />
          </div>
        </div>
      </div>

      {/* Welcome Main */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-md font-medium text-gray-800 mb-2">Welcome Main</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput code="TEXT_11" label="Description" />
          <TextInput code="TEXT_12" label="Ask Name (H2)" />
          <TextInput code="TEXT_13" label="Your Name Placeholder" />
          <TextInput code="TEXT_14" label="Ask Email (H2)" />
          <TextInput code="TEXT_15" label="Your Email Placeholder" />
          <TextInput code="TEXT_16" label="Ask Phone (H2)" />
          <TextInput code="TEXT_17" label="Your Phone Placeholder" />
          <TextInput code="TEXT_18" label="Next With Login (Button)" />
          <TextInput code="TEXT_19" label="Next Without Login (Button)" />
        </div>
      </div>

      {/* Rules Main */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="text-md font-medium text-gray-800 mb-2">Rules Main</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput code="TEXT_21" label="Rules Title (H2)" />
          <TextInput code="TEXT_22" label="Game Rules (multi-line)" multiline />
          <TextInput code="TEXT_23" label="Win Title (H2)" />
          <TextInput code="TEXT_24" label="Win Rules (multi-line)" multiline />
          <TextInput code="TEXT_25" label="Next Play (Button)" />
        </div>
      </div>

      {/* Result Main */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="text-md font-medium text-gray-800 mb-2">Result Main</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput code="TEXT_41" label="Participated (P)" />
          <TextInput code="TEXT_42" label="CTA Title (H1)" />
          <TextInput code="TEXT_43" label="CTA Description (P)" />
          <TextInput code="TEXT_44" label="CTA Action (Button)" />
          <TextInput code="TEXT_45" label="Invite Friend (Button)" />
          <TextInput code="TEXT_46" label="Play Again (Button)" />
        </div>
      </div>

      {/* Main Styles */}
      <div className="bg-white p-4 rounded-lg">
        <h3 className="text-md font-medium text-gray-800 mb-2">Main Styles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Main Background</label>
            <input className="w-full px-3 py-2 border rounded-md" value={getS('main.background')} onChange={e => setS('main.background', e.target.value)} placeholder="bg-white/10 backdrop-blur-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">H1 Class</label>
            <input className="w-full px-3 py-2 border rounded-md" value={getS('main.h1Class')} onChange={e => setS('main.h1Class', e.target.value)} placeholder="text-3xl font-bold" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">H2 Class</label>
            <input className="w-full px-3 py-2 border rounded-md" value={getS('main.h2Class')} onChange={e => setS('main.h2Class', e.target.value)} placeholder="text-xl font-semibold" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">P Class</label>
            <input className="w-full px-3 py-2 border rounded-md" value={getS('main.pClass')} onChange={e => setS('main.pClass', e.target.value)} placeholder="text-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Button Class</label>
            <input className="w-full px-3 py-2 border rounded-md" value={getS('main.buttonPrimaryClass')} onChange={e => setS('main.buttonPrimaryClass', e.target.value)} placeholder="btn btn-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Button Class</label>
            <input className="w-full px-3 py-2 border rounded-md" value={getS('main.buttonSecondaryClass')} onChange={e => setS('main.buttonSecondaryClass', e.target.value)} placeholder="btn btn-secondary" />
          </div>
        </div>
      </div>

      {/* Scoreboard Styles */}
      <div className="bg-white p-4 rounded-lg">
        <h3 className="text-md font-medium text-gray-800 mb-2">Scoreboard Styles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Home Card BG</label>
            <input className="w-full px-3 py-2 border rounded-md" value={getS('scoreboard.homeBg')} onChange={e => setS('scoreboard.homeBg', e.target.value)} placeholder="#c00000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Card BG</label>
            <input className="w-full px-3 py-2 border rounded-md" value={getS('scoreboard.visitorBg')} onChange={e => setS('scoreboard.visitorBg', e.target.value)} placeholder="#0066cc" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Digit Color</label>
            <input className="w-full px-3 py-2 border rounded-md" value={getS('scoreboard.digitColor')} onChange={e => setS('scoreboard.digitColor', e.target.value)} placeholder="#ffffff" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Show Labels</label>
            <input type="checkbox" checked={Boolean(getS('scoreboard.showLabels', ''))} onChange={e => setS('scoreboard.showLabels', e.target.checked)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Home Label</label>
            <input className="w-full px-3 py-2 border rounded-md" value={getS('scoreboard.homeLabel')} onChange={e => setS('scoreboard.homeLabel', e.target.value)} placeholder="HOME" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Label</label>
            <input className="w-full px-3 py-2 border rounded-md" value={getS('scoreboard.visitorLabel')} onChange={e => setS('scoreboard.visitorLabel', e.target.value)} placeholder="VISITOR" />
          </div>
        </div>
      </div>
    </div>
  )
}

