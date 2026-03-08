// utils/phobert.ts - VN KEYBOARD SENTIMENT KaiyoDev
// OFFLINE 100% PURE JS REGEX

const patterns = {
  NEG: /(mệt|buồn|khó|bug|lỗi|fail|stress|chán|debug|crash|deadline|😩|😭)/gi,
  POS: /(vui|sướng|ok|done|merge|win|pro|😂|😎|🎉|deploy)/gi,
  STRESS: /[âăáàảãạăắằẳẵặâấầẩẫậệêếềểễệôốồổỗộơớờởỡợưứừửữự]{2,}/gi,
  EXCITE: /[!]{3,}|\^{3,}|yay|đỉnh|siêu/gi,
  REPEAT: /(\b\w+\b)(\s+\1){2,}/gi,
}

export async function analyzeVN(text: string): Promise<'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'> {
  const score = { neg: 0, pos: 0 }

  score.neg += (text.match(patterns.NEG) || []).length
  score.pos += (text.match(patterns.POS) || []).length
  score.neg += (text.match(patterns.STRESS) || []).length * 2
  score.pos += (text.match(patterns.EXCITE) || []).length * 2
  score.neg += (text.match(patterns.REPEAT) || []).length

  console.log('[VN-Sentiment]', text, score)

  if (score.neg > score.pos) return 'NEGATIVE'
  if (score.pos > score.neg) return 'POSITIVE'
  return 'NEUTRAL'
}
