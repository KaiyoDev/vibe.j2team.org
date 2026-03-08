<template>
  <section
    class="sm:col-span-1 lg:col-span-2 flex flex-col border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
  >
    <div class="mb-3">
      <h3 class="font-display text-lg font-semibold text-text-primary">Bản đồ sóng cảm xúc</h3>
      <p class="font-body text-xs text-text-dim">
        Tone.js + p5 — sen vàng / pháo hoa / tre xanh theo NEG・POS・NEU.
      </p>
    </div>

    <button
      type="button"
      class="coral-play w-full inline-flex items-center justify-center gap-2 border border-accent-coral bg-accent-coral/10 px-4 py-3 text-sm font-semibold text-accent-coral transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent-coral/10 disabled:hover:text-accent-coral"
      :disabled="!mood"
      @click="togglePlay"
    >
      <svg
        v-if="!isPlaying"
        class="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polygon points="6 4 20 12 6 20 6 4" />
      </svg>
      <svg
        v-else
        class="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
      </svg>
      <span>{{ isPlaying ? 'Tạm dừng' : 'Phát giai điệu' }}</span>
    </button>

    <div v-if="isPlaying" class="mt-3 space-y-1">
      <label class="text-text-dim text-[10px] font-display tracking-wide">Tiến trình</label>
      <input
        type="range"
        min="0"
        :max="progressMax"
        step="0.1"
        :value="progress"
        class="progress-slider w-full accent-accent-coral"
        readonly
      />
    </div>

    <div class="mt-3 space-y-1">
      <label class="text-text-dim text-[10px] font-display tracking-wide" for="volume"
        >Âm lượng 0–100%</label
      >
      <input
        id="volume"
        v-model.number="volume"
        type="range"
        min="0"
        max="100"
        class="volume-slider w-full accent-accent-coral"
        @input="onVolumeInput"
      />
    </div>

    <div class="mt-3 flex justify-end">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 border border-border-default bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-primary transition-all duration-300 hover:border-accent-coral disabled:cursor-not-allowed disabled:text-text-dim"
        :disabled="!hasCanvas"
        @click="$emit('download')"
      >
        <svg
          class="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Tải PNG
      </button>
    </div>

    <slot />
    <p class="mt-3 font-body text-[11px] text-text-dim">
      Tone.Sampler — NEG guitar/piano/violin · POS synth/808/brass · NEU flute/dan-bau/sáo. Scale +
      instrument theo text.
    </p>
  </section>
</template>

<script setup lang="ts">
import * as Tone from 'tone'
import { ref, onBeforeUnmount } from 'vue'
import type { MoodLabel } from '../utils/constants'
import {
  generateMoodMelody,
  stopMoodMelody,
  setDestinationVolume,
  setVolumeOnlyAfterUserGesture,
  markUserHasStartedAudio,
  getTransportSeconds,
} from '../utils/vnSynth'

const props = defineProps<{
  mood: MoodLabel | null
  inputText: string
  hasCanvas: boolean
}>()

defineEmits<{
  download: []
}>()

const isPlaying = ref(false)
const progress = ref(0)
const volume = ref(70)
const progressMax = 120
let progressInterval: ReturnType<typeof setInterval> | null = null

async function togglePlay(): Promise<void> {
  if (!props.mood) return
  if (!isPlaying.value) {
    await Tone.start()
    markUserHasStartedAudio()
    setDestinationVolume((volume.value / 100) * 0.35)
    generateMoodMelody(props.inputText || ' ', props.mood)
    isPlaying.value = true
    progressInterval = setInterval(() => {
      progress.value = Math.min(getTransportSeconds(), progressMax)
    }, 100)
  } else {
    Tone.getTransport().stop()
    stopMoodMelody()
    isPlaying.value = false
    if (progressInterval) {
      clearInterval(progressInterval)
      progressInterval = null
    }
    progress.value = 0
  }
}

function onVolumeInput(): void {
  setVolumeOnlyAfterUserGesture((volume.value / 100) * 0.35)
}

onBeforeUnmount(() => {
  if (progressInterval) clearInterval(progressInterval)
  if (isPlaying.value) {
    Tone.getTransport().stop()
    stopMoodMelody()
  }
})
</script>

<style scoped>
.volume-slider,
.progress-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
}
.volume-slider::-webkit-slider-thumb,
.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: var(--color-accent-coral);
  cursor: pointer;
}
.progress-slider::-webkit-slider-thumb {
  cursor: default;
}
</style>
