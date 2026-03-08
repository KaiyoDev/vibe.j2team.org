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
defineProps<{
  modelValue: string
  isAnalyzing: boolean
  analysisError: string | null
  moodLabel: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
  analyze: []
}>()
</script>
