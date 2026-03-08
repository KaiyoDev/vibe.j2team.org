<template>
  <div ref="containerRef" class="relative mt-1 aspect-[16/9] w-full bg-bg-elevated">
    <div v-if="!mood" class="absolute inset-0 flex items-center justify-center px-6 text-center">
      <p class="max-w-md font-body text-xs text-text-dim">
        Bấm <span class="text-accent-coral font-semibold">Mix giai điệu VN</span> để tạo giai điệu
        và bản đồ sóng.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { MoodLabel } from '../utils/constants'

const props = defineProps<{
  mood: MoodLabel | null
  getAnalyser: () => AnalyserNode | null
  getAudioContext: () => AudioContext | null
}>()

const emit = defineEmits<{
  canvasReady: [canvas: HTMLCanvasElement]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const canvasElement = ref<HTMLCanvasElement | null>(null)
let p5Instance: P5Like | null = null

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  phase: number
}

interface P5CanvasWrapper {
  canvas: HTMLCanvasElement
}

interface P5Like {
  setup: () => void
  draw: () => void
  windowResized: () => void
  width: number
  height: number
  frameCount: number
  createCanvas: (w: number, h: number) => P5CanvasWrapper
  background: (r: number, g?: number, b?: number) => void
  noStroke: () => void
  fill: (r: number, g: number, b: number, a?: number) => void
  ellipse: (x: number, y: number, w: number, h: number) => void
  beginShape: () => void
  endShape: () => void
  curveVertex: (x: number, y: number) => void
  stroke: (r: number, g: number, b: number, a?: number) => void
  strokeWeight: (w: number) => void
  resizeCanvas: (w: number, h: number) => void
}

type P5Constructor = new (sketch: (p: P5Like) => void, container: HTMLElement) => P5Like

interface WindowWithP5 extends Window {
  p5?: P5Constructor
}

function moodColor(m: MoodLabel | null): [number, number, number] {
  if (m === 'negative') return [255, 184, 48]
  if (m === 'positive') return [255, 107, 74]
  if (m === 'neutral') return [72, 187, 120]
  return [139, 157, 181]
}

function speedFactor(m: MoodLabel | null): number {
  if (m === 'negative') return 0.5
  if (m === 'positive') return 2
  return 1
}

function loadP5(): Promise<P5Constructor | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  const w = window as WindowWithP5
  if (w.p5) return Promise.resolve(w.p5)
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/p5@1.9.0/lib/p5.min.js'
    script.async = true
    script.onload = () => resolve(w.p5 ?? null)
    script.onerror = () => reject(new Error('Không tải được p5.js'))
    document.head.appendChild(script)
  })
}

function createSketch(): void {
  const container = containerRef.value
  if (!container) return

  const particles: Particle[] = []
  let lastMood: MoodLabel | null = null

  const sketch = (p: P5Like): void => {
    p.setup = () => {
      const w = Math.max(container.clientWidth, 320)
      const h = Math.round((w * 9) / 16)
      const wrap = p.createCanvas(w, h)
      canvasElement.value = wrap.canvas
      emit('canvasReady', wrap.canvas)
      p.noStroke()
    }

    p.windowResized = () => {
      const w = Math.max(container.clientWidth, 320)
      const h = Math.round((w * 9) / 16)
      p.resizeCanvas(w, h)
    }

    p.draw = () => {
      const currentMood = props.mood
      if (currentMood !== lastMood) {
        lastMood = currentMood
        particles.length = 0
      }
      if (currentMood && particles.length === 0) {
        const count = currentMood === 'positive' ? 120 : 80
        for (let i = 0; i < count; i += 1) {
          particles.push({
            x: Math.random() * p.width,
            y: Math.random() * p.height,
            size: currentMood === 'positive' ? 1 + Math.random() * 3 : 2 + Math.random() * 4,
            speedX: (currentMood === 'positive' ? 2 : 0) * (Math.random() - 0.5),
            speedY:
              (currentMood === 'negative' ? 0.2 : currentMood === 'positive' ? 1.5 : 0.6) +
              Math.random() * 0.5,
            phase: Math.random() * Math.PI * 2,
          })
        }
      }
      const [r, g, b] = moodColor(currentMood)
      p.background(15, 25, 35)
      const ctx = props.getAudioContext()
      const analyser = props.getAnalyser()
      const amp =
        analyser && ctx?.state === 'running'
          ? (() => {
              const buf = new Uint8Array(analyser.frequencyBinCount)
              analyser.getByteTimeDomainData(buf)
              let sum = 0
              for (let i = 0; i < buf.length; i += 1) sum += (buf[i] - 128) ** 2
              return 0.2 + (Math.sqrt(sum / buf.length) / 128) * 1.2
            })()
          : 0.2
      const spd = speedFactor(currentMood)
      p.noStroke()
      particles.forEach((part) => {
        const wobble = Math.sin(p.frameCount * 0.02 * spd + part.phase) * 6 * (0.5 + amp)
        part.x += part.speedX * spd
        part.y += part.speedY * spd
        if (part.y > p.height + 10) {
          part.y = -10
          part.x = Math.random() * p.width
        }
        if (part.y < -10) {
          part.y = p.height + 10
          part.x = Math.random() * p.width
        }
        if (part.x < -10 || part.x > p.width + 10) part.x = (part.x + p.width) % p.width
        p.fill(r, g, b, 60 + amp * 100)
        p.ellipse(part.x + wobble, part.y, part.size + amp * 3, part.size + amp * 3)
      })
      p.stroke(r, Math.min(255, g + 30), Math.min(255, b + 30), 150)
      p.strokeWeight(1.2)
      p.noStroke()
      p.stroke(r, Math.min(255, g + 20), Math.min(255, b + 40), 140)
      p.strokeWeight(1)
      p.beginShape()
      for (let i = 0; i <= 60; i += 1) {
        const t = i / 60
        p.curveVertex(
          t * p.width,
          p.height * 0.5 + Math.sin(t * Math.PI * 4 + p.frameCount * 0.02 * spd) * 20 * amp,
        )
      }
      p.endShape()
    }
  }

  loadP5()
    .then((P5) => {
      if (!P5 || !containerRef.value) return
      p5Instance = new P5(sketch, containerRef.value)
    })
    .catch(console.error)
}

onMounted(() => {
  createSketch()
})

onBeforeUnmount(() => {
  if (p5Instance) {
    const inst = p5Instance as unknown as { remove?: () => void }
    if (typeof inst.remove === 'function') inst.remove()
    p5Instance = null
  }
})
</script>
