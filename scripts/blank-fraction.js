// Fraction of image height taken by the longest contiguous run of near-uniform rows.
// A contiguous run catches an unrendered void without flagging pages that merely have dark sections with gaps.
import sharp from 'sharp'

export async function blankFraction(input, { rowStd = 3 } = {}) {
  const { data, info } = await sharp(input).greyscale().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = info
  let blank = 0
  let longest = 0
  for (let y = 0; y < height; y++) {
    let sum = 0
    let sq = 0
    for (let x = 0; x < width; x++) {
      const v = data[y * width + x]
      sum += v
      sq += v * v
    }
    const mean = sum / width
    const std = Math.sqrt(Math.max(0, sq / width - mean * mean))
    if (std < rowStd) {
      blank++
      if (blank > longest) longest = blank
    } else {
      blank = 0
    }
  }
  return longest / height
}

export const BLANK_LIMIT = 0.3
