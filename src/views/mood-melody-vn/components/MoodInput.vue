<template>
  <section
    class="flex flex-col justify-between border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
  >
    <div class="space-y-4">
      <h3 class="font-display text-lg font-semibold text-text-primary">Mood hôm nay?</h3>
      <textarea
        :value="modelValue"
        rows="5"
        class="w-full bg-bg-elevated px-3 py-2 font-body text-sm text-text-primary outline-none ring-0 border border-border-default focus:border-accent-coral focus:ring-0 placeholder:text-text-dim"
        placeholder="Mood hôm nay của bạn?"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      />
      <div class="space-y-2">
        <p class="font-body text-xs text-text-dim">Chọn emoji:</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="emoji in EMOJI_OPTIONS"
            :key="emoji.value"
            type="button"
            class="flex items-center gap-1.5 border px-2 py-1.5 text-sm font-medium transition-all duration-300 cursor-pointer select-none"
            :class="
              emoji.value === props.selectedEmoji
                ? 'border-accent-coral border-2 bg-accent-coral/10 text-accent-coral'
                : 'border-border-default bg-bg-elevated text-text-primary hover:border-accent-coral'
            "
            @click="selectEmoji(emoji.value)"
          >
            <span class="text-lg">{{ emoji.value }}</span>
            <span class="text-[11px] text-text-dim">{{ emoji.label }}</span>
          </button>
        </div>
      </div>
    </div>
    <div class="mt-4 flex flex-col gap-2">
      <button
        type="button"
        class="inline-flex items-center justify-center border border-transparent bg-accent-coral px-4 py-2.5 text-sm font-semibold text-bg-deep transition-all duration-300 hover:shadow-lg hover:shadow-accent-coral/20 disabled:cursor-not-allowed disabled:bg-bg-elevated disabled:text-text-dim"
        :disabled="isAnalyzing || !modelValue.trim()"
        @click="$emit('analyze')"
      >
        <span class="mr-2 inline-flex h-4 w-4 items-center justify-center">
          <span
            v-if="isAnalyzing"
            class="inline-block h-3 w-3 border-2 border-accent-amber border-t-transparent animate-spin"
          />
          <svg
            v-else
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </span>
        Mix giai điệu VN
      </button>
      <p v-if="analysisError" class="font-body text-xs text-accent-coral">
        {{ analysisError }}
      </p>
      <p v-else-if="moodLabel" class="font-body text-xs text-text-secondary">
        {{ moodLabel }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { EMOJI_OPTIONS } from '../utils/constants'

const props = defineProps<{
  modelValue: string
  selectedEmoji: string
  isAnalyzing: boolean
  analysisError: string | null
  moodLabel: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:selectedEmoji': [value: string]
  analyze: []
}>()

function selectEmoji(value: string): void {
  emit('update:selectedEmoji', value)
}
</script>
