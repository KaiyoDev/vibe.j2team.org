/**
 * VN synth: Tone.js PRO — Bolero (NEG) / V-pop (POS) / Dân ca (NEU)
 * Volume via Tone.getDestination(), progress via Tone.getTransport().seconds
 */

import * as Tone from 'tone'
import { ref, watch, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import type { MoodLabel } from './constants'

let analyserNode: AnalyserNode | null = null
let currentPart: Tone.Part | null = null
let currentSynth: Tone.Synth | Tone.FMSynth | null = null

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
    currentSynth?.dispose()
  } catch {
    /* ignore */
  }
  currentPart = null
  currentSynth = null
}

/**
 * Bolero NEG: A3-G3-F3-E3 sawtooth warm
 * Vpop POS: C5-E5-G5-C6 square drop
 * Dan ca NEU: G4-A4-B4 fm flute
 */
export function playMoodMelody(mood: MoodLabel): void {
  Tone.getTransport().stop()
  Tone.getTransport().cancel()
  disposeCurrent()

  const dest = Tone.getDestination()
  const analyser = getAnalyserNode()

  if (mood === 'negative') {
    Tone.getTransport().bpm.value = 60
    const synth = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.4 },
    })
    const filter = new Tone.Filter(800, 'lowpass')
    synth.chain(filter, dest)
    if (analyser) synth.connect(analyser)
    currentSynth = synth
    const notes = ['A3', 'G3', 'F3', 'E3']
    const part = new Tone.Part(
      (time, note) => {
        synth.triggerAttackRelease(note as string, '4n', time, 0.6)
      },
      notes.map((n, i) => [i * 0.5, n]) as [number, string][],
    )
    part.loop = true
    part.loopEnd = '2m'
    part.start(0)
    currentPart = part
  } else if (mood === 'positive') {
    Tone.getTransport().bpm.value = 120
    const synth = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.3 },
    })
    synth.toDestination()
    if (analyser) synth.connect(analyser)
    currentSynth = synth
    const notes = ['C5', 'E5', 'G5', 'C6']
    const part = new Tone.Part(
      (time, note) => {
        synth.triggerAttackRelease(note as string, '8n', time, 0.5)
      },
      notes.map((n, i) => [i * 0.25, n]) as [number, string][],
    )
    part.loop = true
    part.loopEnd = '2m'
    part.start(0)
    currentPart = part
  } else {
    Tone.getTransport().bpm.value = 80
    const synth = new Tone.FMSynth({
      harmonicity: 3,
      modulationIndex: 2,
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.7, release: 0.5 },
    })
    synth.toDestination()
    if (analyser) synth.connect(analyser)
    currentSynth = synth
    const notes = ['G4', 'A4', 'B4']
    const part = new Tone.Part(
      (time, note) => {
        synth.triggerAttackRelease(note as string, '2n', time, 0.5)
      },
      notes.map((n, i) => [i * 0.6, n]) as [number, string][],
    )
    part.loop = true
    part.loopEnd = '2m'
    part.start(0)
    currentPart = part
  }

  Tone.getTransport().start()
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

/**
 * Composable: trạng thái + hành động cho MelodyPlayer.
 */
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
    configureForMood: async (m: MoodLabel) => {
      if (isTransportRunning() && mood.value) {
        stopMoodMelody()
        playMoodMelody(m)
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
