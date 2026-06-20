import sharp from 'sharp'

const BG = '#0f1729'
const ACCENT = '#4f8ef7'

function buildSvg(size) {
  const c = size / 2
  const r = size * 0.38
  const brickW = size * 0.13
  const brickH = size * 0.065
  const gap = size * 0.012
  const studR = size * 0.022

  const rows = [
    { y: c - brickH * 1.5 - gap, offset: 0 },
    { y: c - brickH * 0.5, offset: brickW * 0.5 + gap * 0.5 },
    { y: c + brickH * 0.5 + gap, offset: 0 },
  ]

  const bricks = rows.flatMap(({ y, offset }) => {
    const out = []
    for (let i = -1; i <= 1; i++) {
      const x = c + i * (brickW + gap) - brickW / 2 + offset
      const rx = size * 0.015
      out.push(`<rect x="${x}" y="${y}" width="${brickW}" height="${brickH}" rx="${rx}" fill="${ACCENT}"/>`)
      out.push(`<circle cx="${x + brickW * 0.3}" cy="${y}" r="${studR}" fill="${ACCENT}" opacity="0.7"/>`)
      out.push(`<circle cx="${x + brickW * 0.7}" cy="${y}" r="${studR}" fill="${ACCENT}" opacity="0.7"/>`)
    }
    return out
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="${BG}"/>
  <circle cx="${c}" cy="${c}" r="${r}" fill="${ACCENT}" opacity="0.08"/>
  ${bricks.join('\n  ')}
</svg>`
}

for (const size of [192, 512]) {
  const svg = Buffer.from(buildSvg(size))
  await sharp(svg).png().toFile(`public/icon-${size}.png`)
  console.log(`icon-${size}.png generated`)
}
