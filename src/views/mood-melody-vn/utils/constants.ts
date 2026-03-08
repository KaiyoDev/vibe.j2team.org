export type MoodLabel = 'positive' | 'negative' | 'neutral'

export interface EmojiOption {
  value: string
  label: string
  moodHint: MoodLabel
}

export const EMOJI_OPTIONS: EmojiOption[] = [
  { value: '😩', label: 'Mệt', moodHint: 'negative' },
  { value: '😎', label: 'Cool', moodHint: 'positive' },
  { value: '😂', label: 'Vui', moodHint: 'positive' },
  { value: '😢', label: 'Buồn', moodHint: 'negative' },
  { value: '😌', label: 'Bình yên', moodHint: 'neutral' },
  { value: '🤔', label: 'Suy tư', moodHint: 'neutral' },
]
