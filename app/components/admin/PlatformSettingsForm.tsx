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

  // Editor-only adapters for new standardized CTA fields with legacy mirroring
  // What: Prefer new keys (CTA1_TEXT, NEXT_* etc.), fallback to legacy (TEXT_44, TEXT_18...), and write both.
  // Why: Provide consistent 3-line button setup while maintaining backward compatibility at runtime.
  const mirrorMap: Record<string, string | undefined> = {
    CTA1_TEXT: 'TEXT_44',
    CTA1_URL: 'TEXT_44_URL',

    NEXT_LOGIN_TEXT: 'TEXT_18',
    NEXT_LOGIN_BG: 'TEXT_18_BG',

    NEXT_GUEST_TEXT: 'TEXT_19',
    NEXT_GUEST_BG: 'TEXT_19_BG',

    NEXT_PLAY_TEXT: 'TEXT_25',
    NEXT_PLAY_BG: 'TEXT_25_BG',

    INVITE_TEXT: 'TEXT_45',
    INVITE_BG: 'TEXT_45_BG',

    PLAYAGAIN_TEXT: 'TEXT_46',
    PLAYAGAIN_BG: 'TEXT_46_BG'
  }

  const defaultAction: Record<string, string> = {
    NEXT_LOGIN_ACTION: 'REGISTER_AND_CONTINUE',
    NEXT_GUEST_ACTION: 'CONTINUE_AS_GUEST',
    NEXT_PLAY_ACTION: 'START_GAME',
    INVITE_ACTION: 'INVITE_REFERRAL',
    PLAYAGAIN_ACTION: 'RESTART_GAME'
  }

  const getTNew = (k: string) => {
    const v = texts?.[k]
    if (v != null && String(v).trim() !== '') return String(v)
    const legacy = mirrorMap[k]
    const lv = legacy ? texts?.[legacy] : undefined
    if (lv != null && String(lv).trim() !== '') return String(lv)
    if (k in defaultAction) return defaultAction[k]
    return ''
  }
  const setTNew = (k: string, v: string) => {
    const legacy = mirrorMap[k]
    const next = { ...texts, [k]: v }
    if (legacy) (next as any)[legacy] = v
    onTextsChange(next)
  }

  return (
    <div className="space-y-8">
      {/* Hero Settings */}
      <div className="bg-slate-50 p-4 rounded-lg">
        <h3 className="text-md font-medium text-gray-800 mb-2">Hero Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SimpleTextInput code="LANDING_TITLE" label="Landing Title" placeholder="" value={getT('LANDING_TITLE')} onChange={(v)=> setT('LANDING_TITLE', v)} />
          <SimpleTextInput code="TEXT_10" label="Welcome Title" placeholder="Welcome" value={getT('TEXT_10')} onChange={(v)=> setT('TEXT_10', v)} />
          <SimpleTextInput code="TEXT_20" label="Rules Title" placeholder="Game Rules" value={getT('TEXT_20')} onChange={(v)=> setT('TEXT_20', v)} />
          <SimpleTextInput code="TEXT_30" label="Game Title" placeholder="Game" value={getT('TEXT_30')} onChange={(v)=> setT('TEXT_30', v)} />
          <SimpleTextInput code="TEXT_40" label="Result Title" placeholder="Results" value={getT('TEXT_40')} onChange={(v)=> setT('TEXT_40', v)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hero Background (CSS)</label>
            <textarea className="w-full px-3 py-2 border rounded-md min-h-20" value={getS('hero.background')} onChange={e => setS('hero.background', e.target.value)} placeholder={'background: #005e05;\nbackground: linear-gradient(160deg, rgba(0, 94, 5, 1) 0%, rgba(153, 153, 153, 1) 100%);'} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title Class</label>
            <input className="w-full px-3 py-2 border rounded-md" value={getS('hero.titleClass')} onChange={e => setS('hero.titleClass', e.target.value)} placeholder="text-2xl md:text-3xl font-bold text-white" />
          </div>
        </div>
      </div>

      {/* Landing */}
      <div className="bg-emerald-50 p-4 rounded-lg">
        <h3 className="text-md font-medium text-gray-800 mb-2">Landing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SimpleTextInput code="LANDING_IMAGE_URL" label="Landing Image URL" placeholder="https://..." value={getT('LANDING_IMAGE_URL')} onChange={(v)=> setT('LANDING_IMAGE_URL', v)} />
        </div>
        <div className="mt-4 border border-gray-300 rounded-lg p-4 space-y-2">
          <label className="block text-sm font-semibold text-gray-800">Next Welcome Button</label>
          <SimpleTextInput code="NEXT_WELCOME_TEXT" label="Button Text" value={getT('NEXT_WELCOME_TEXT')} onChange={(v)=> setT('NEXT_WELCOME_TEXT', v)} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Button Action</label>
            <select className="w-full px-3 py-2 border rounded-md" value={getT('NEXT_WELCOME_ACTION') || 'GO_TO_WELCOME'} onChange={(e)=> setT('NEXT_WELCOME_ACTION', e.target.value)}>
              <option value="GO_TO_WELCOME">GO_TO_WELCOME</option>
            </select>
          </div>
          <SimpleTextInput code="NEXT_WELCOME_BG" label="Button BG (CSS)" multiline placeholder={'background: #005e05;\nbackground: linear-gradient(160deg, rgba(0, 94, 5, 1) 0%, rgba(153, 153, 153, 1) 100%);'} value={getT('NEXT_WELCOME_BG')} onChange={(v)=> setT('NEXT_WELCOME_BG', v)} />
        </div>
      </div>

      {/* Welcome Main */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-md font-medium text-gray-800 mb-2">Welcome Main</h3>
        <div className="space-y-4">
          {/* Description (Markdown-capable) - single full-width, multiline */}
          <SimpleTextInput code="TEXT_11" label="Description (Markdown)" placeholder="Supports Markdown. Use line breaks and **bold** as needed." multiline value={getT('TEXT_11')} onChange={(v)=> setT('TEXT_11', v)} />

          {/* Name pair */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SimpleTextInput code="TEXT_12" label="Ask Name (H2)" value={getT('TEXT_12')} onChange={(v)=> setT('TEXT_12', v)} />
            <SimpleTextInput code="TEXT_13" label="Your Name Placeholder" value={getT('TEXT_13')} onChange={(v)=> setT('TEXT_13', v)} />
          </div>

          {/* Email pair */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SimpleTextInput code="TEXT_14" label="Ask Email (H2)" value={getT('TEXT_14')} onChange={(v)=> setT('TEXT_14', v)} />
            <SimpleTextInput code="TEXT_15" label="Your Email Placeholder" value={getT('TEXT_15')} onChange={(v)=> setT('TEXT_15', v)} />
          </div>

          {/* Phone pair */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SimpleTextInput code="TEXT_16" label="Ask Phone (H2)" value={getT('TEXT_16')} onChange={(v)=> setT('TEXT_16', v)} />
            <SimpleTextInput code="TEXT_17" label="Your Phone Placeholder" value={getT('TEXT_17')} onChange={(v)=> setT('TEXT_17', v)} />
          </div>

          {/* Contact required (Markdown-capable) - single full-width, multiline */}
          <SimpleTextInput code="TEXT_26" label="Contact Required (Markdown)" placeholder="Please provide either email or phone number" multiline value={getT('TEXT_26')} onChange={(v)=> setT('TEXT_26', v)} />

          {/* Next With Login — standardized 3-line block (bordered, editor-only) */}
          <div className="border border-gray-300 rounded-lg p-4 space-y-2">
            <label className="block text-sm font-semibold text-gray-800">Next With Login Button</label>
            <SimpleTextInput code="NEXT_LOGIN_TEXT" label="CTA Action Text (Button)" value={getTNew('NEXT_LOGIN_TEXT')} onChange={(v)=> setTNew('NEXT_LOGIN_TEXT', v)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CTA Action (Action)</label>
              <select className="w-full px-3 py-2 border rounded-md" value={getTNew('NEXT_LOGIN_ACTION')} onChange={(e)=> setTNew('NEXT_LOGIN_ACTION', e.target.value)}>
                <option value="REGISTER_AND_CONTINUE">REGISTER_AND_CONTINUE</option>
                <option value="OPEN_LOGIN_MODAL">OPEN_LOGIN_MODAL</option>
              </select>
            </div>
            <SimpleTextInput code="NEXT_LOGIN_BG" label="CTA Action BG (CSS)" multiline placeholder={'background: #005e05;\nbackground: linear-gradient(160deg, rgba(0, 94, 5, 1) 0%, rgba(153, 153, 153, 1) 100%);'} value={getTNew('NEXT_LOGIN_BG')} onChange={(v)=> setTNew('NEXT_LOGIN_BG', v)} />
          </div>

          {/* Try without registration (Markdown-capable) - single full-width, multiline */}
          <SimpleTextInput code="TEXT_27" label="Try Without Registration Text (Markdown)" placeholder="Want to try without registration?" multiline value={getT('TEXT_27')} onChange={(v)=> setT('TEXT_27', v)} />

          {/* Next Without Login — standardized 3-line block (bordered, editor-only) */}
          <div className="border border-gray-300 rounded-lg p-4 space-y-2">
            <label className="block text-sm font-semibold text-gray-800">Next Without Registration Button</label>
            <SimpleTextInput code="NEXT_GUEST_TEXT" label="CTA Action Text (Button)" value={getTNew('NEXT_GUEST_TEXT')} onChange={(v)=> setTNew('NEXT_GUEST_TEXT', v)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CTA Action (Action)</label>
              <select className="w-full px-3 py-2 border rounded-md" value={getTNew('NEXT_GUEST_ACTION')} onChange={(e)=> setTNew('NEXT_GUEST_ACTION', e.target.value)}>
                <option value="CONTINUE_AS_GUEST">CONTINUE_AS_GUEST</option>
                <option value="SKIP_AND_PLAY">SKIP_AND_PLAY</option>
              </select>
            </div>
            <SimpleTextInput code="NEXT_GUEST_BG" label="CTA Action BG (CSS)" multiline placeholder={'background: #005e05;\nbackground: linear-gradient(160deg, rgba(0, 94, 5, 1) 0%, rgba(153, 153, 153, 1) 100%);'} value={getTNew('NEXT_GUEST_BG')} onChange={(v)=> setTNew('NEXT_GUEST_BG', v)} />
          </div>
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
        </div>
        {/* Next Play — standardized 3-line block (bordered, editor-only) */}
        <div className="mt-4 border border-gray-300 rounded-lg p-4 space-y-2">
          <label className="block text-sm font-semibold text-gray-800">Next Play Button</label>
          <SimpleTextInput code="NEXT_PLAY_TEXT" label="CTA Action Text (Button)" value={getTNew('NEXT_PLAY_TEXT')} onChange={(v)=> setTNew('NEXT_PLAY_TEXT', v)} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CTA Action (Action)</label>
            <select className="w-full px-3 py-2 border rounded-md" value={getTNew('NEXT_PLAY_ACTION')} onChange={(e)=> setTNew('NEXT_PLAY_ACTION', e.target.value)}>
              <option value="START_GAME">START_GAME</option>
              <option value="OPEN_RULES">OPEN_RULES</option>
            </select>
          </div>
          <SimpleTextInput code="NEXT_PLAY_BG" label="CTA Action BG (CSS)" multiline placeholder={'background: #005e05;\nbackground: linear-gradient(160deg, rgba(0, 94, 5, 1) 0%, rgba(153, 153, 153, 1) 100%);'} value={getTNew('NEXT_PLAY_BG')} onChange={(v)=> setTNew('NEXT_PLAY_BG', v)} />
        </div>
      </div>

      {/* Result Main */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="text-md font-medium text-gray-800 mb-2">Result Main</h3>
        <div className="space-y-4">
          {/* Result headline texts (Markdown-capable) */}
          <SimpleTextInput code="WON_TEXT" label="WON_TEXT (H1, Markdown)" multiline value={getT('WON_TEXT')} onChange={(v)=> setT('WON_TEXT', v)} />
          <SimpleTextInput code="LOST_TEXT" label="LOST_TEXT (H1, Markdown)" multiline value={getT('LOST_TEXT')} onChange={(v)=> setT('LOST_TEXT', v)} />

          {/* CTA Title / Description */}
          <SimpleTextInput code="CTA_TITLE" label="CTA Title (H1)" value={getT('CTA_TITLE')} onChange={(v)=> setT('CTA_TITLE', v)} />
          <SimpleTextInput code="CTA_DESCRIPTION" label="CTA Description (P)" value={getT('CTA_DESCRIPTION')} onChange={(v)=> setT('CTA_DESCRIPTION', v)} />

          {/* Participated note (Markdown-capable) */}
          <SimpleTextInput code="TEXT_41" label="Participated (P, Markdown)" multiline value={getT('TEXT_41')} onChange={(v)=> setT('TEXT_41', v)} />

          {/* Primary Result CTA — standardized 3-line block (bordered, editor-only) */}
          <div className="border border-gray-300 rounded-lg p-4 space-y-2">
            <label className="block text-sm font-semibold text-gray-800">Primary CTA (Result)</label>
            <SimpleTextInput code="CTA1_TEXT" label="CTA Action Text (Button)" value={getTNew('CTA1_TEXT')} onChange={(v)=> setTNew('CTA1_TEXT', v)} />
            <SimpleTextInput code="CTA1_URL" label="CTA Action URL (URL)" value={getTNew('CTA1_URL')} onChange={(v)=> setTNew('CTA1_URL', v)} />
            <SimpleTextInput code="CTA1_BG" label="CTA Action BG (CSS)" multiline placeholder={'background: #005e05;\nbackground: linear-gradient(160deg, rgba(0, 94, 5, 1) 0%, rgba(153, 153, 153, 1) 100%);'} value={getTNew('CTA1_BG')} onChange={(v)=> setTNew('CTA1_BG', v)} />
          </div>

          {/* Additional CTAs manager (bordered cards with editor-only CTA2_TEXT/CTA2_URL/CTA2_BG labels) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional CTAs</label>
            <div className="space-y-2">
              {(texts.CTA_BUTTONS as Array<{text:string;url:string;bg?:string}>)?.slice(1)?.map((cta, idx) => (
                <div key={idx} className="border border-gray-300 rounded-lg p-4 space-y-2">
                  <SimpleTextInput
                    code={`CTA${idx+2}_TEXT`}
                    label="CTA Action Text (Button)"
                    value={cta.text}
                    onChange={val => {
                      const list = Array.isArray(texts.CTA_BUTTONS) ? [...texts.CTA_BUTTONS] : []
                      list[idx+1] = { ...list[idx+1], text: val }
                      onTextsChange({ ...texts, CTA_BUTTONS: list })
                    }}
                  />
                  <SimpleTextInput
                    code={`CTA${idx+2}_URL`}
                    label="CTA Action URL (URL)"
                    value={cta.url}
                    onChange={val => {
                      const list = Array.isArray(texts.CTA_BUTTONS) ? [...texts.CTA_BUTTONS] : []
                      list[idx+1] = { ...list[idx+1], url: val }
                      onTextsChange({ ...texts, CTA_BUTTONS: list })
                    }}
                  />
                  <SimpleTextInput
                    code={`CTA${idx+2}_BG`}
                    label="CTA Action BG (CSS)"
                    multiline
                    value={cta.bg || ''}
                    onChange={val => {
                      const list = Array.isArray(texts.CTA_BUTTONS) ? [...texts.CTA_BUTTONS] : []
                      list[idx+1] = { ...list[idx+1], bg: val }
                      onTextsChange({ ...texts, CTA_BUTTONS: list })
                    }}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="px-3 py-2 bg-red-600 text-white rounded-md"
                      onClick={() => {
                        const list = Array.isArray(texts.CTA_BUTTONS) ? [...texts.CTA_BUTTONS] : []
                        list.splice(idx+1, 1)
                        onTextsChange({ ...texts, CTA_BUTTONS: list })
                      }}
                    >
                      Delete CTA
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded-md" onClick={() => {
                const list = Array.isArray(texts.CTA_BUTTONS) ? [...texts.CTA_BUTTONS] : []
                if (list.length === 0) {
                  // Seed list with CTA1 from fields if present
                  const first = { text: (getTNew('CTA1_TEXT') || ''), url: (getTNew('CTA1_URL') || ''), bg: (getTNew('CTA1_BG') || '') }
                  list.push(first)
                }
                list.push({ text: '', url: '', bg: '' })
                onTextsChange({ ...texts, CTA_BUTTONS: list })
              }}>ADD CTA</button>
            </div>
          </div>

          {/* Invite Friend — standardized 3-line block (bordered, editor-only) */}
          <div className="border border-gray-300 rounded-lg p-4 space-y-2">
            <label className="block text-sm font-semibold text-gray-800">Invite Friend Button</label>
            <SimpleTextInput code="INVITE_TEXT" label="CTA Action Text (Button)" value={getTNew('INVITE_TEXT')} onChange={(v)=> setTNew('INVITE_TEXT', v)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CTA Action (Action)</label>
              <select className="w-full px-3 py-2 border rounded-md" value={getTNew('INVITE_ACTION')} onChange={(e)=> setTNew('INVITE_ACTION', e.target.value)}>
                <option value="INVITE_REFERRAL">INVITE_REFERRAL</option>
                <option value="SHARE_GENERIC">SHARE_GENERIC</option>
              </select>
            </div>
            <SimpleTextInput code="INVITE_BG" label="CTA Action BG (CSS)" multiline value={getTNew('INVITE_BG')} onChange={(v)=> setTNew('INVITE_BG', v)} />
          </div>

          {/* Play Again — standardized 3-line block (bordered, editor-only) */}
          <div className="border border-gray-300 rounded-lg p-4 space-y-2">
            <label className="block text-sm font-semibold text-gray-800">Play Again Button</label>
            <SimpleTextInput code="PLAYAGAIN_TEXT" label="CTA Action Text (Button)" value={getTNew('PLAYAGAIN_TEXT')} onChange={(v)=> setTNew('PLAYAGAIN_TEXT', v)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CTA Action (Action)</label>
              <select className="w-full px-3 py-2 border rounded-md" value={getTNew('PLAYAGAIN_ACTION')} onChange={(e)=> setTNew('PLAYAGAIN_ACTION', e.target.value)}>
                <option value="RESTART_GAME">RESTART_GAME</option>
                <option value="GO_TO_HOME">GO_TO_HOME</option>
              </select>
            </div>
            <SimpleTextInput code="PLAYAGAIN_BG" label="CTA Action BG (CSS)" multiline value={getTNew('PLAYAGAIN_BG')} onChange={(v)=> setTNew('PLAYAGAIN_BG', v)} />
          </div>
        </div>
      </div>

      {/* Main Styles */}
      <div className="bg-white p-4 rounded-lg">
        <h3 className="text-md font-medium text-gray-800 mb-2">Main Styles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Main Background (CSS)</label>
            <textarea className="w-full px-3 py-2 border rounded-md min-h-20" value={getS('main.background')} onChange={e => setS('main.background', e.target.value)} placeholder={'background: #005e05;\nbackground: linear-gradient(160deg, rgba(0, 94, 5, 1) 0%, rgba(153, 153, 153, 1) 100%);'} />
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

      {/* Legal Documents */}
      <div className="bg-white p-4 rounded-lg">
        <h3 className="text-md font-medium text-gray-800 mb-2">Legal Documents</h3>
        <div className="space-y-4">
          <SimpleTextInput code="TERMS_TITLE" label="Terms & Conditions Title" value={getT('TERMS_TITLE')} onChange={(v)=> setT('TERMS_TITLE', v)} />
          <SimpleTextInput code="TERMS_BODY" label="Terms & Conditions Body (multiline)" multiline value={getT('TERMS_BODY')} onChange={(v)=> setT('TERMS_BODY', v)} />
          <SimpleTextInput code="PRIVACY_TITLE" label="Privacy Policy Title" value={getT('PRIVACY_TITLE')} onChange={(v)=> setT('PRIVACY_TITLE', v)} />
          <SimpleTextInput code="PRIVACY_BODY" label="Privacy Policy Body (multiline)" multiline value={getT('PRIVACY_BODY')} onChange={(v)=> setT('PRIVACY_BODY', v)} />
          <SimpleTextInput code="DELETION_TITLE" label="Data Deletion Title" value={getT('DELETION_TITLE')} onChange={(v)=> setT('DELETION_TITLE', v)} />
          <SimpleTextInput code="DELETION_BODY" label="Data Deletion Instructions (multiline)" multiline value={getT('DELETION_BODY')} onChange={(v)=> setT('DELETION_BODY', v)} />
        </div>
      </div>

      {/* Scoreboard Styles */}
      <div className="bg-white p-4 rounded-lg">
        <h3 className="text-md font-medium text-gray-800 mb-2">Scoreboard Styles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Home Card BG (CSS)</label>
            <textarea className="w-full px-3 py-2 border rounded-md min-h-20" value={getS('scoreboard.homeBg')} onChange={e => setS('scoreboard.homeBg', e.target.value)} placeholder={'background: #005e05;\nbackground: linear-gradient(160deg, rgba(0, 94, 5, 1) 0%, rgba(153, 153, 153, 1) 100%);'} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Card BG (CSS)</label>
            <textarea className="w-full px-3 py-2 border rounded-md min-h-20" value={getS('scoreboard.visitorBg')} onChange={e => setS('scoreboard.visitorBg', e.target.value)} placeholder={'background: #005e05;\nbackground: linear-gradient(160deg, rgba(0, 94, 5, 1) 0%, rgba(153, 153, 153, 1) 100%);'} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Digit Color (CSS)</label>
            <textarea className="w-full px-3 py-2 border rounded-md min-h-20" value={getS('scoreboard.digitColor')} onChange={e => setS('scoreboard.digitColor', e.target.value)} placeholder={'background: #005e05;\nbackground: linear-gradient(160deg, rgba(0, 94, 5, 1) 0%, rgba(153, 153, 153, 1) 100%);'} />
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

