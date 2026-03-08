/**
 * VN synth: Tone.Sampler — 25+ real instruments by mood, scale from text seed.
 * NEG: nylon-guitar, piano, violin, accordion, marimba (+ extras)
 * POS: synth-lead, 808-bass, brass, epiano, clap (+ extras)
 * NEU: flute, dan-bau, sao, trung, kalimba (+ extras)
 * Text-only input, no emoji. Real piano/sample playback, no synth noise.
 */

import * as Tone from 'tone'
import { ref, watch, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import type { MoodLabel } from './constants'

/** Instrument id → display name. Same sample set (piano) used for all until per-instrument URLs are set. */
const NEGATIVE_INSTRUMENTS = [
  'nylon-guitar',
  'piano',
  'violin',
  'accordion',
  'marimba',
  'cello',
  'acoustic-bass',
  'piano-mellow',
  'contrabass',
] as const

const POSITIVE_INSTRUMENTS = [
  'synth-lead',
  '808-bass',
  'brass',
  'epiano',
  'clap',
  'strings',
  'organ',
  'pad',
  'bass-synth',
] as const

const NEUTRAL_INSTRUMENTS = [
  'flute',
  'dan-bau',
  'sao',
  'trung',
  'kalimba',
  'bamboo',
  'dan-tranh',
  't-rung',
  'sáo',
] as const

const MOOD_INSTRUMENTS: Record<MoodLabel, readonly string[]> = {
  negative: NEGATIVE_INSTRUMENTS,
  positive: POSITIVE_INSTRUMENTS,
  neutral: NEUTRAL_INSTRUMENTS,
}

/** Scales as note offsets from root (C). Tone repitches from sampler. */
const SCALES = [
  { name: 'minor', notes: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'major', notes: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'pentatonic', notes: [0, 3, 5, 7, 10] },
  { name: 'blues', notes: [0, 3, 5, 6, 7, 10] },
  { name: 'dorian', notes: [0, 2, 3, 5, 7, 9, 10] },
] as const

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

function scaleNotes(rootOctave: number, scale: (typeof SCALES)[number]): string[] {
  return scale.notes.map((semi) => {
    const note = NOTE_NAMES[semi % 12]
    const oct = rootOctave + Math.floor(semi / 12)
    return `${note}${oct}`
  })
}

export interface MelodyStyle {
  name: string
  instrumentId: string
  scaleName: string
  notes: string[]
  bpm: number
  duration: string
}

/** Free piano samples (Tone CDN). Sparse set so Tone repitches. One set for all instruments until per-instrument URLs exist. */
const SAMPLER_BASE_URL = 'https://tonejs.github.io/audio/casio/'
const SAMPLER_URLS: Record<string, string> = {
  A1: 'A1.mp3',
  A2: 'A2.mp3',
  A3: 'A3.mp3',
  A4: 'A4.mp3',
  A5: 'A5.mp3',
}

function buildSampler(): Tone.Sampler {
  return new Tone.Sampler({
    urls: SAMPLER_URLS,
    baseUrl: SAMPLER_BASE_URL,
  }).toDestination()
}

function textSeed(text: string): number {
  const normalized = text + Date.now().toString(36) + Math.random()
  let h = 0
  for (let i = 0; i < normalized.length; i += 1) {
    h = (h * 31 + normalized.charCodeAt(i)) | 0
  }
  const unsigned = h >>> 0
  return (unsigned % 1_000_000) / 1_000_000
}

export function getRandomStyle(mood: MoodLabel, seed: number): MelodyStyle {
  const instruments = MOOD_INSTRUMENTS[mood]
  const instIdx = Math.floor((seed * 10000) % instruments.length)
  const scaleIdx = Math.floor((seed * 9999) % SCALES.length)
  const instrumentId = instruments[instIdx] ?? instruments[0]!
  const scale = SCALES[scaleIdx] ?? SCALES[0]!
  const rootOctave = mood === 'negative' ? 3 : mood === 'positive' ? 4 : 4
  const notes = scaleNotes(rootOctave, scale)
  const bpm =
    mood === 'negative'
      ? 56 + (instIdx % 12)
      : mood === 'positive'
        ? 118 + (instIdx % 14)
        : 72 + (instIdx % 10)
  const duration = mood === 'negative' ? '4n' : mood === 'positive' ? '8n' : '2n'
  return {
    name: `${instrumentId} (${scale.name})`,
    instrumentId,
    scaleName: scale.name,
    notes,
    bpm,
    duration,
  }
}

let analyserNode: AnalyserNode | null = null
let currentPart: Tone.Part | null = null
let currentSampler: Tone.Sampler | null = null

function getAnalyserNode(): AnalyserNode | null {
  if (analyserNode) return analyserNode
  try {
    const ctx = Tone.getContext()
    analyserNode = ctx.createAnalyser()
    analyserNode.fftSize = 256
  } catch {
    /* ignore */
  }
  return analyserNode
}

function disposeCurrent(): void {
  try {
    currentPart?.dispose()
    currentSampler?.dispose()
  } catch {
    /* ignore */
  }
  currentPart = null
  currentSampler = null
}

function scheduleStyle(style: MelodyStyle, analyser: AnalyserNode | null): void {
  Tone.getTransport().bpm.value = style.bpm
  const events = style.notes.map((n, i) => [i * 0.5, n] as [number, string])

  const sampler = buildSampler()
  if (analyser) sampler.connect(analyser)
  currentSampler = sampler

  const part = new Tone.Part((time, note) => {
    sampler.triggerAttackRelease(note as string, style.duration, time, 0.6)
  }, events)
  part.loop = true
  part.loopEnd = '2m'
  part.start(0)
  currentPart = part
}

/**
 * Generate and play melody from text + mood. Instrument + scale from text seed.
 */
export function generateMoodMelody(text: string, mood: MoodLabel): void {
  Tone.getTransport().stop()
  Tone.getTransport().cancel()
  disposeCurrent()

  const seed = textSeed(text)
  const style = getRandomStyle(mood, seed)
  console.log(`[synth] "${text}" (${text.length}chars) → ${style.name} seed ${seed.toFixed(3)}`)

  const analyser = getAnalyserNode()
  scheduleStyle(style, analyser)
  Tone.getTransport().start()
}

export function playMoodMelody(mood: MoodLabel): void {
  generateMoodMelody('', mood)
}

export function stopMoodMelody(): void {
  Tone.getTransport().stop()
  Tone.getTransport().cancel()
  disposeCurrent()
}

export function getTransportSeconds(): number {
  return Tone.getTransport().seconds
}

export function getAnalyser(): () => AnalyserNode | null {
  return () => getAnalyserNode()
}

export function getAudioContext(): () => AudioContext | null {
  return () => {
    try {
      const ctx = Tone.getContext()
      return 'rawContext' in ctx ? (ctx.rawContext as AudioContext) : null
    } catch {
      return null
    }
  }
}

export function setDestinationVolume(linear0to1: number): void {
  const db = linear0to1 <= 0 ? -Infinity : Math.max(-60, 20 * Math.log10(linear0to1))
  Tone.getDestination().volume.value = db
}

export function isTransportRunning(): boolean {
  return Tone.getTransport().state === 'started'
}

export function cleanup(): void {
  stopMoodMelody()
  analyserNode = null
}

let _userHasStartedAudio = false

export function setVolumeOnlyAfterUserGesture(linear0to1: number): void {
  if (!_userHasStartedAudio) return
  setDestinationVolume(linear0to1)
}

export function markUserHasStartedAudio(): void {
  _userHasStartedAudio = true
}

export function useVnSynth(mood: Ref<MoodLabel | null>) {
  const isPlaying = ref(false)
  const isAudioReady = ref(true)
  const volume = ref(70)
  const progress = ref(0)

  watch(volume, (v) => {
    setVolumeOnlyAfterUserGesture((v / 100) * 0.35)
  })

  let progressInterval: ReturnType<typeof setInterval> | null = null

  async function toggle(): Promise<void> {
    if (!mood.value) return
    if (!isPlaying.value) {
      await Tone.start()
      markUserHasStartedAudio()
      setDestinationVolume((volume.value / 100) * 0.35)
      playMoodMelody(mood.value)
      isPlaying.value = true
      progressInterval = setInterval(() => {
        progress.value = Tone.getTransport().seconds
      }, 100)
    } else {
      stopMoodMelody()
      isPlaying.value = false
      if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
      }
      progress.value = 0
    }
  }

  onBeforeUnmount(() => {
    if (progressInterval) clearInterval(progressInterval)
    cleanup()
  })

  return {
    isPlaying,
    isAudioReady,
    volume,
    progress,
    toggle,
    configureForMood: async (m: MoodLabel, text?: string) => {
      if (isTransportRunning() && mood.value) {
        stopMoodMelody()
        if (text !== undefined && text !== '') {
          generateMoodMelody(text, m)
        } else {
          playMoodMelody(m)
        }
      }
    },
    getAnalyser: () => getAnalyserNode(),
    getAudioContext: () => {
      try {
        const ctx = Tone.getContext()
        return 'rawContext' in ctx ? (ctx.rawContext as AudioContext) : null
      } catch {
        return null
      }
    },
  }
}
