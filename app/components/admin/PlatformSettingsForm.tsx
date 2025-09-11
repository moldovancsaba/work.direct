'use client'

import React from 'react'

// SimpleTextInput — stable component type (declared at module scope)
// What: Renders a labeled input/textarea.
// Why: Avoids redefining component types on every render which caused remounts and focus loss.
interface SimpleTextInputProps {
  code: string
  label: string
  placeholder?: string
  multiline?: boolean
  value: string
  onChange: (value: string) => void
}

const SimpleTextInput = ({ code, label, placeholder, multiline, value, onChange }: SimpleTextInputProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label} ({code})</label>
    {multiline ? (
      <textarea
        className="w-full px-3 py-2 border rounded-md min-h-20"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || ''}
      />
    ) : (
      <input
        className="w-full px-3 py-2 border rounded-md"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || ''}
      />
    )}
  </div>
)

interface PlatformSettingsFormProps {
  texts: Record<string, any>
  styles: any
  onTextsChange: (next: Record<string, any>) => void
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

  // Removed inline TextInput component to prevent remounts on each render.
  // Use module-scoped SimpleTextInput instead.

  return (
    <div className="space-y-8">
      {/* Hero Settings */}
      <div className="bg-slate-50 p-4 rounded-lg">
        <h3 className="text-md font-medium text-gray-800 mb-2">Hero Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SimpleTextInput code="TEXT_10" label="Welcome Title" placeholder="Welcome" value={getT('TEXT_10')} onChange={(v)=> setT('TEXT_10', v)} />
          <SimpleTextInput code="TEXT_20" label="Rules Title" placeholder="Game Rules" value={getT('TEXT_20')} onChange={(v)=> setT('TEXT_20', v)} />
          <SimpleTextInput code="TEXT_30" label="Game Title" placeholder="Game" value={getT('TEXT_30')} onChange={(v)=> setT('TEXT_30', v)} />
          <SimpleTextInput code="TEXT_40" label="Result Title" placeholder="Results" value={getT('TEXT_40')} onChange={(v)=> setT('TEXT_40', v)} />
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
          <SimpleTextInput code="TEXT_11" label="Description" value={getT('TEXT_11')} onChange={(v)=> setT('TEXT_11', v)} />
          <SimpleTextInput code="TEXT_12" label="Ask Name (H2)" value={getT('TEXT_12')} onChange={(v)=> setT('TEXT_12', v)} />
          <SimpleTextInput code="TEXT_13" label="Your Name Placeholder" value={getT('TEXT_13')} onChange={(v)=> setT('TEXT_13', v)} />
          <SimpleTextInput code="TEXT_14" label="Ask Email (H2)" value={getT('TEXT_14')} onChange={(v)=> setT('TEXT_14', v)} />
          <SimpleTextInput code="TEXT_15" label="Your Email Placeholder" value={getT('TEXT_15')} onChange={(v)=> setT('TEXT_15', v)} />
          <SimpleTextInput code="TEXT_16" label="Ask Phone (H2)" value={getT('TEXT_16')} onChange={(v)=> setT('TEXT_16', v)} />
          <SimpleTextInput code="TEXT_17" label="Your Phone Placeholder" value={getT('TEXT_17')} onChange={(v)=> setT('TEXT_17', v)} />
          <SimpleTextInput code="TEXT_18" label="Next With Login (Button)" value={getT('TEXT_18')} onChange={(v)=> setT('TEXT_18', v)} />
          <SimpleTextInput code="TEXT_19" label="Next Without Login (Button)" value={getT('TEXT_19')} onChange={(v)=> setT('TEXT_19', v)} />
          {/* Registration helper texts */}
          <SimpleTextInput code="TEXT_26" label="Contact Required (TEXT_26)" placeholder="Please provide either email or phone number" value={getT('TEXT_26')} onChange={(v)=> setT('TEXT_26', v)} />
          <SimpleTextInput code="TEXT_27" label="Try Without Registration Text (TEXT_27)" placeholder="Want to try without registration?" value={getT('TEXT_27')} onChange={(v)=> setT('TEXT_27', v)} />
        </div>
      </div>

      {/* Rules Main */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="text-md font-medium text-gray-800 mb-2">Rules Main</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SimpleTextInput code="TEXT_21" label="Rules Title (H2)" value={getT('TEXT_21')} onChange={(v)=> setT('TEXT_21', v)} />
          <SimpleTextInput code="TEXT_22" label="Game Rules (multi-line)" multiline value={getT('TEXT_22')} onChange={(v)=> setT('TEXT_22', v)} />
          <SimpleTextInput code="TEXT_23" label="Win Title (H2)" value={getT('TEXT_23')} onChange={(v)=> setT('TEXT_23', v)} />
          <SimpleTextInput code="TEXT_24" label="Win Rules (multi-line)" multiline value={getT('TEXT_24')} onChange={(v)=> setT('TEXT_24', v)} />
          <SimpleTextInput code="TEXT_25" label="Next Play (Button)" value={getT('TEXT_25')} onChange={(v)=> setT('TEXT_25', v)} />
        </div>
      </div>

      {/* Result Main */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="text-md font-medium text-gray-800 mb-2">Result Main</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SimpleTextInput code="TEXT_41" label="Participated (P)" value={getT('TEXT_41')} onChange={(v)=> setT('TEXT_41', v)} />
          <SimpleTextInput code="CTA_TITLE" label="CTA Title (H1)" value={getT('CTA_TITLE')} onChange={(v)=> setT('CTA_TITLE', v)} />
          <SimpleTextInput code="CTA_DESCRIPTION" label="CTA Description (P)" value={getT('CTA_DESCRIPTION')} onChange={(v)=> setT('CTA_DESCRIPTION', v)} />

          {/* Primary CTA */}
          <SimpleTextInput code="TEXT_44" label="CTA Action (Button)" value={getT('TEXT_44')} onChange={(v)=> setT('TEXT_44', v)} />
          <SimpleTextInput code="TEXT_44_URL" label="CTA Action URL" value={getT('TEXT_44_URL')} onChange={(v)=> setT('TEXT_44_URL', v)} />

          {/* Additional CTAs manager */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional CTAs</label>
            <div className="space-y-2">
              {(texts.CTA_BUTTONS as Array<{text:string;url:string}>)?.slice(1)?.map((cta, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                  <input className="w-full px-3 py-2 border rounded-md" value={cta.text} onChange={e => {
                    const list = Array.isArray(texts.CTA_BUTTONS) ? [...texts.CTA_BUTTONS] : []
                    list[idx+1] = { ...list[idx+1], text: e.target.value }
                    onTextsChange({ ...texts, CTA_BUTTONS: list })
                  }} placeholder={`CTA Action${idx+2} Button`} />
                  <input className="w-full px-3 py-2 border rounded-md" value={cta.url} onChange={e => {
                    const list = Array.isArray(texts.CTA_BUTTONS) ? [...texts.CTA_BUTTONS] : []
                    list[idx+1] = { ...list[idx+1], url: e.target.value }
                    onTextsChange({ ...texts, CTA_BUTTONS: list })
                  }} placeholder={`CTA Action${idx+2} URL`} />
                  <button type="button" className="px-3 py-2 bg-red-600 text-white rounded-md" onClick={() => {
                    const list = Array.isArray(texts.CTA_BUTTONS) ? [...texts.CTA_BUTTONS] : []
                    list.splice(idx+1, 1)
                    onTextsChange({ ...texts, CTA_BUTTONS: list })
                  }}>Delete CTA</button>
                </div>
              ))}
              <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded-md" onClick={() => {
                const list = Array.isArray(texts.CTA_BUTTONS) ? [...texts.CTA_BUTTONS] : []
                if (list.length === 0) {
                  // Seed list with CTA1 from fields if present
const first = { text: texts.TEXT_44 || '', url: texts.TEXT_44_URL || '' }
                  list.push(first)
                }
                list.push({ text: '', url: '' })
                onTextsChange({ ...texts, CTA_BUTTONS: list })
              }}>ADD CTA</button>
            </div>
          </div>

          <SimpleTextInput code="TEXT_45" label="Invite Friend (Button)" value={getT('TEXT_45')} onChange={(v)=> setT('TEXT_45', v)} />
          <SimpleTextInput code="TEXT_46" label="Play Again (Button)" value={getT('TEXT_46')} onChange={(v)=> setT('TEXT_46', v)} />
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

