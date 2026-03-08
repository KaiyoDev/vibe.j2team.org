<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body px-6 py-8">
    <div class="mx-auto max-w-5xl flex flex-col gap-6">
      <div class="space-y-3 animate-fade-up">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          &larr; Về trang chủ
        </RouterLink>
        <div>
          <h2
            class="font-display text-2xl font-semibold text-text-primary mb-2 flex items-center gap-3"
          >
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
            Mood Melody VN
          </h2>
          <p class="max-w-2xl text-text-secondary text-sm animate-fade-up animate-delay-2">
            Viết mood, chọn emoji — AI phối giai điệu bolero / v-pop / dân ca và bản đồ sóng cảm
            xúc.
          </p>
        </div>
      </div>

      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 pt-2 animate-fade-up animate-delay-3">
        <MoodInput
          v-model="inputText"
          v-model:selected-emoji="selectedEmoji"
          :is-analyzing="isAnalyzing"
          :analysis-error="analysisError"
          :mood-label="moodLabel"
          @analyze="onAnalyze"
        />
        <MelodyPlayer :mood="mood" :has-canvas="!!canvasElement" @download="downloadCanvas">
          <MoodViz
            :mood="mood"
            :get-analyser="synth.getAnalyser"
            :get-audio-context="synth.getAudioContext"
            @canvas-ready="onCanvasReady"
          />
        </MelodyPlayer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import MoodInput from './components/MoodInput.vue'
import MelodyPlayer from './components/MelodyPlayer.vue'
import MoodViz from './components/MoodViz.vue'
import { EMOJI_OPTIONS, type MoodLabel } from './utils/constants'
import { analyzeVN } from './utils/phobert'
import { useVnSynth } from './utils/vnSynth'

const inputText = ref('')
const selectedEmoji = ref('😎')
const mood = ref<MoodLabel | null>(null)
const isAnalyzing = ref(false)
const analysisError = ref<string | null>(null)
const canvasElement = ref<HTMLCanvasElement | null>(null)

const synth = useVnSynth(mood)

const emojiMoodMap = EMOJI_OPTIONS.reduce<Record<string, MoodLabel>>((acc, o) => {
  acc[o.value] = o.moodHint
  return acc
}, {})

function blendMood(sent: MoodLabel, emo: MoodLabel): MoodLabel {
  if (sent === emo) return sent
  if (sent === 'neutral') return emo
  if (emo === 'neutral') return sent
  return 'neutral'
}

const moodLabel = computed(() => {
  if (!mood.value) return ''
  if (mood.value === 'positive') return 'Mood tích cực — v-pop 880Hz + bass 120bpm.'
  if (mood.value === 'negative') return 'Mood trầm — bolero 440Hz + delay 60bpm.'
  return 'Mood cân bằng — dân ca 600Hz 80bpm.'
})

async function onAnalyze(): Promise<void> {
  const text = inputText.value.trim()
  if (!text) {
    analysisError.value = 'Viết vài dòng mood trước nhé.'
    return
  }
  analysisError.value = null
  isAnalyzing.value = true
  try {
    const result = await analyzeVN(text)
    const baseMood: MoodLabel =
      result === 'POSITIVE' ? 'positive' : result === 'NEGATIVE' ? 'negative' : 'neutral'
    const emoMood = emojiMoodMap[selectedEmoji.value] ?? baseMood
    mood.value = blendMood(baseMood, emoMood)
    await synth.configureForMood(mood.value)
  } catch (e) {
    analysisError.value = e instanceof Error ? e.message : 'Lỗi mix giai điệu. Thử lại.'
  } finally {
    isAnalyzing.value = false
  }
}

function onCanvasReady(canvas: HTMLCanvasElement): void {
  canvasElement.value = canvas
}

function downloadCanvas(): void {
  if (!canvasElement.value) return
  const a = document.createElement('a')
  a.href = canvasElement.value.toDataURL('image/png')
  a.download = 'mood-melody-vn.png'
  a.click()
}
</script>
