import QRCode, { type BitMatrix, type QRCodeErrorCorrectionLevel } from 'qrcode'

export type QrStylePreset =
  | 'a1-classic'
  | 'a1-circle'
  | 'a1-planet'
  | 'a2-interlock'
  | 'a2-cross'
  | 'sp1-blueprint'
  | 'image-fusion'
  | 'rounded-ink'
  | 'blueprint-pop'
  | 'warm-poster'
export type QrModuleShape = 'square' | 'rounded' | 'dot' | 'line' | 'cross'
export type QrFinderShape = 'square' | 'rounded' | 'circle' | 'planet' | 'bracket'
export type QrbtfFamily = 'a1' | 'a2' | 'sp1' | 'c2' | 'custom'
export type QrModuleRenderMode = 'preset' | 'core'
export type QrContentPointType = 'square' | 'circle'
export type QrContentLineType = 'horizontal' | 'vertical' | 'interlock' | 'radial' | 'tl-br' | 'tr-bl' | 'cross'
export type QrPositioningPointType = 'square' | 'circle' | 'planet' | 'rounded' | 'dsj'
export type QrMarkerBorderShape = 'square' | 'rounded' | 'circle' | 'planet' | 'bracket' | 'dsj'
export type QrMarkerCenterShape = 'square' | 'rounded' | 'circle' | 'dot'
export type QrFusionFunctionalPattern = 'clean' | 'blended'
export type QrFusionQuality = 'sharp' | 'soft' | 'safe'
export type QrFusionImageMode = 'auto' | 'tone' | 'edges' | 'highlights'

export type StyledQrStyle = {
  dark: string
  light: string
  margin: number
  width: number
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
  stylePreset: QrStylePreset
  moduleShape: QrModuleShape
  moduleScale: number
  moduleRadius: number
  finderShape: QrFinderShape
  finderColor: string
  accentColor: string
  moduleOpacity: number
  qrbtfFamily?: QrbtfFamily
  moduleRenderMode?: QrModuleRenderMode
  contentPointType?: QrContentPointType
  contentLineType?: QrContentLineType
  positioningPointType?: QrPositioningPointType
  contentPointColor?: string
  positioningPointColor?: string
  markerBorderShape?: QrMarkerBorderShape
  markerCenterShape?: QrMarkerCenterShape
  markerBorderColor?: string
  markerCenterColor?: string
  contentStrokeWidth?: number
  contentXStrokeWidth?: number
  positioningStrokeWidth?: number
  imageFusionEnabled?: boolean
  fusionImageDataUrl?: string
  fusionBrightness?: number
  fusionContrast?: number
  fusionFunctionalPattern?: QrFusionFunctionalPattern
  fusionQuality?: QrFusionQuality
  fusionImageMode?: QrFusionImageMode
  fusionImageStrength?: number
}

export type StyledQrResult = {
  svgText: string
  svgDataUrl: string
}

export function renderStyledQrCode(
  data: string,
  style: StyledQrStyle,
  options: { width?: number } = {}
): StyledQrResult {
  const qr = QRCode.create(data, {
    errorCorrectionLevel: style.errorCorrectionLevel as QRCodeErrorCorrectionLevel
  })
  const matrix = qr.modules
  const moduleCount = matrix.size
  const margin = clamp(Math.round(style.margin), 0, 8)
  const width = clamp(Math.round(options.width ?? style.width), 96, 2000)
  const totalModules = moduleCount + margin * 2
  const unit = width / totalModules
  const dark = sanitizeColor(style.dark, '#111827')
  const light = sanitizeColor(style.light, '#fbfaf4')
  const finderColor = sanitizeColor(style.finderColor, dark)
  const accentColor = sanitizeColor(style.accentColor, dark)
  const contentColor = sanitizeColor(style.contentPointColor ?? style.dark, dark)
  const positioningColor = sanitizeColor(style.positioningPointColor ?? style.finderColor, finderColor)
  const markerBorderColor = sanitizeColor(style.markerBorderColor ?? style.positioningPointColor ?? style.finderColor, positioningColor)
  const markerCenterColor = sanitizeColor(style.markerCenterColor ?? style.positioningPointColor ?? style.finderColor, markerBorderColor)
  const moduleScale = clamp(style.moduleScale, 0, 1)
  const moduleRadius = clamp(style.moduleRadius, 0, 0.5)
  const moduleOpacity = clamp(style.moduleOpacity, 0.25, 1)
  const offset = margin * unit
  const family = style.qrbtfFamily ?? 'custom'
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width}" viewBox="0 0 ${width} ${width}" role="img" aria-label="Styled QR code image">`,
    `<rect width="100%" height="100%" fill="${light}"/>`
  ]

  if (style.moduleRenderMode === 'core') {
    parts.push(drawCoreModules(matrix, moduleCount, offset, unit, style, contentColor, accentColor, moduleScale, moduleRadius, moduleOpacity))
  } else if (family === 'a1') {
    parts.push(drawA1Modules(matrix, moduleCount, offset, unit, style, contentColor, moduleOpacity))
  } else if (family === 'a2') {
    parts.push(drawA2Modules(matrix, moduleCount, offset, unit, style, contentColor, accentColor, moduleOpacity))
  } else if (family === 'sp1') {
    parts.push(drawSp1Modules(matrix, moduleCount, offset, unit, style, contentColor, accentColor, moduleOpacity))
  } else {
    parts.push(drawCoreModules(matrix, moduleCount, offset, unit, style, contentColor, accentColor, moduleScale, moduleRadius, moduleOpacity))
  }

  parts.push(drawStyledFinders(offset, moduleCount, unit, style, markerBorderColor, markerCenterColor, light))
  parts.push('</svg>')

  const svgText = parts.join('')
  return {
    svgText,
    svgDataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`
  }
}

export async function renderStyledQrCodeAsync(
  data: string,
  style: StyledQrStyle,
  options: { width?: number } = {}
): Promise<StyledQrResult> {
  const hasFusionLayer = Boolean(style.imageFusionEnabled && style.fusionImageDataUrl)
  const usesFusionPreset = (style.qrbtfFamily ?? 'custom') === 'c2'

  if (!hasFusionLayer) {
    return renderStyledQrCode(data, style, options)
  }

  if (!usesFusionPreset) {
    return renderStyledQrCodeWithFusionLayer(data, style, options)
  }

  const qr = QRCode.create(data, {
    errorCorrectionLevel: style.errorCorrectionLevel as QRCodeErrorCorrectionLevel
  })
  const matrix = qr.modules
  const moduleCount = matrix.size
  const margin = clamp(Math.round(style.margin), 0, 8)
  const width = clamp(Math.round(options.width ?? style.width), 96, 2000)
  const totalModules = moduleCount + margin * 2
  const unit = width / totalModules
  const dark = sanitizeColor(style.dark, '#111827')
  const light = sanitizeColor(style.light, '#ffffff')
  const accentColor = sanitizeColor(style.accentColor, dark)
  const contentColor = sanitizeColor(style.contentPointColor ?? style.dark, dark)
  const positioningColor = sanitizeColor(style.positioningPointColor ?? style.finderColor, dark)
  const offset = margin * unit
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width}" viewBox="0 0 ${width} ${width}" role="img" aria-label="Image fusion QR code">`,
    `<rect width="100%" height="100%" fill="${light}"/>`,
    await drawImageFusionModules(matrix, moduleCount, offset, unit, style, contentColor, accentColor, light)
  ]

  const functionalPattern = style.fusionFunctionalPattern ?? 'clean'
  if (functionalPattern === 'clean') {
    parts.push(drawFinder(offset, offset, unit, 'square', positioningColor, light))
    parts.push(drawFinder(offset + (moduleCount - 7) * unit, offset, unit, 'square', positioningColor, light))
    parts.push(drawFinder(offset, offset + (moduleCount - 7) * unit, unit, 'square', positioningColor, light))
  } else {
    parts.push(drawFinder(offset, offset, unit, 'rounded', positioningColor, light))
    parts.push(drawFinder(offset + (moduleCount - 7) * unit, offset, unit, 'rounded', positioningColor, light))
    parts.push(drawFinder(offset, offset + (moduleCount - 7) * unit, unit, 'rounded', positioningColor, light))
  }

  parts.push('</svg>')

  const svgText = parts.join('')
  return {
    svgText,
    svgDataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`
  }
}

async function renderStyledQrCodeWithFusionLayer(
  data: string,
  style: StyledQrStyle,
  options: { width?: number } = {}
): Promise<StyledQrResult> {
  const qr = QRCode.create(data, {
    errorCorrectionLevel: style.errorCorrectionLevel as QRCodeErrorCorrectionLevel
  })
  const matrix = qr.modules
  const moduleCount = matrix.size
  const margin = clamp(Math.round(style.margin), 0, 8)
  const width = clamp(Math.round(options.width ?? style.width), 96, 2000)
  const totalModules = moduleCount + margin * 2
  const unit = width / totalModules
  const dark = sanitizeColor(style.dark, '#111827')
  const light = sanitizeColor(style.light, '#fbfaf4')
  const finderColor = sanitizeColor(style.finderColor, dark)
  const accentColor = sanitizeColor(style.accentColor, dark)
  const contentColor = sanitizeColor(style.contentPointColor ?? style.dark, dark)
  const positioningColor = sanitizeColor(style.positioningPointColor ?? style.finderColor, finderColor)
  const markerBorderColor = sanitizeColor(style.markerBorderColor ?? style.positioningPointColor ?? style.finderColor, positioningColor)
  const markerCenterColor = sanitizeColor(style.markerCenterColor ?? style.positioningPointColor ?? style.finderColor, markerBorderColor)
  const moduleScale = clamp(style.moduleScale, 0, 1)
  const moduleRadius = clamp(style.moduleRadius, 0, 0.5)
  const moduleOpacity = clamp(style.moduleOpacity, 0.25, 1)
  const offset = margin * unit
  const family = style.qrbtfFamily ?? 'custom'
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width}" viewBox="0 0 ${width} ${width}" role="img" aria-label="Styled QR code image">`,
    `<rect width="100%" height="100%" fill="${light}"/>`,
    await drawImageFusionBackgroundLayer(matrix, moduleCount, offset, unit, style, contentColor, accentColor)
  ]

  if (style.moduleRenderMode === 'core') {
    parts.push(drawCoreModules(matrix, moduleCount, offset, unit, style, contentColor, accentColor, moduleScale, moduleRadius, moduleOpacity))
  } else if (family === 'a1') {
    parts.push(drawA1Modules(matrix, moduleCount, offset, unit, style, contentColor, moduleOpacity))
  } else if (family === 'a2') {
    parts.push(drawA2Modules(matrix, moduleCount, offset, unit, style, contentColor, accentColor, moduleOpacity))
  } else if (family === 'sp1') {
    parts.push(drawSp1Modules(matrix, moduleCount, offset, unit, style, contentColor, accentColor, moduleOpacity))
  } else {
    parts.push(drawCoreModules(matrix, moduleCount, offset, unit, style, contentColor, accentColor, moduleScale, moduleRadius, moduleOpacity))
  }

  parts.push(drawStyledFinders(offset, moduleCount, unit, style, markerBorderColor, markerCenterColor, light))

  parts.push('</svg>')

  const svgText = parts.join('')
  return {
    svgText,
    svgDataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`
  }
}

function drawCoreModules(
  matrix: BitMatrix,
  moduleCount: number,
  offset: number,
  unit: number,
  style: StyledQrStyle,
  color: string,
  accentColor: string,
  moduleScale: number,
  moduleRadius: number,
  moduleOpacity: number
) {
  if (style.moduleShape === 'line') {
    return drawLineSegments(matrix, moduleCount, offset, unit, clamp(moduleScale, 0.62, 1), color, moduleOpacity, style.contentLineType ?? 'interlock')
  }

  if (style.moduleShape === 'cross') {
    return drawCrossSegments(matrix, moduleCount, offset, unit, clamp(moduleScale, 0.62, 1), moduleRadius, color, accentColor, moduleOpacity)
  }

  const modules: string[] = []
  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (!matrix.get(row, col) || isFinderModule(row, col, moduleCount)) continue

      const cx = offset + col * unit + unit / 2
      const cy = offset + row * unit + unit / 2
      const size = unit * clamp(moduleScale, 0.62, 1)
      modules.push(drawModule(cx, cy, size, style.moduleShape, moduleRadius, color, accentColor, moduleOpacity))
    }
  }

  return modules.join('')
}

function drawModule(
  cx: number,
  cy: number,
  size: number,
  shape: QrModuleShape,
  radiusRatio: number,
  color: string,
  accentColor: string,
  opacity: number
) {
  if (shape === 'dot') {
    return `<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(size / 2)}" fill="${color}" opacity="${round(opacity)}"/>`
  }

  if (shape === 'cross') {
    const half = size / 2
    const strokeWidth = size * 0.22
    return [
      `<line x1="${round(cx - half)}" y1="${round(cy - half)}" x2="${round(cx + half)}" y2="${round(cy + half)}" stroke="${color}" stroke-width="${round(strokeWidth)}" stroke-linecap="round" opacity="${round(opacity)}"/>`,
      `<line x1="${round(cx + half)}" y1="${round(cy - half)}" x2="${round(cx - half)}" y2="${round(cy + half)}" stroke="${accentColor}" stroke-width="${round(strokeWidth)}" stroke-linecap="round" opacity="${round(opacity)}"/>`
    ].join('')
  }

  const x = cx - size / 2
  const y = cy - size / 2
  const radius = shape === 'rounded' ? size * radiusRatio : 0

  return `<rect x="${round(x)}" y="${round(y)}" width="${round(size)}" height="${round(size)}" rx="${round(radius)}" fill="${color}" opacity="${round(opacity)}"/>`
}

function drawA1Modules(
  matrix: BitMatrix,
  moduleCount: number,
  offset: number,
  unit: number,
  style: StyledQrStyle,
  color: string,
  opacity: number
) {
  const modules: string[] = []
  const pointType = style.contentPointType ?? (style.moduleShape === 'dot' ? 'circle' : 'square')
  const requestedScale = clamp(style.moduleScale, 0, 1)

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (!matrix.get(row, col) || isFinderModule(row, col, moduleCount)) continue

      const scale = requestedScale <= 0.01 ? getDeterministicPointScale(row, col) : clamp(requestedScale, 0.18, 1)
      const size = unit * scale
      const cx = offset + col * unit + unit / 2
      const cy = offset + row * unit + unit / 2

      if (pointType === 'circle') {
        modules.push(`<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(size / 2)}" fill="${color}" opacity="${round(opacity)}"/>`)
        continue
      }

      modules.push(`<rect x="${round(cx - size / 2)}" y="${round(cy - size / 2)}" width="${round(size)}" height="${round(size)}" fill="${color}" opacity="${round(opacity)}"/>`)
    }
  }

  return modules.join('')
}

function drawA2Modules(
  matrix: BitMatrix,
  moduleCount: number,
  offset: number,
  unit: number,
  style: StyledQrStyle,
  color: string,
  accentColor: string,
  opacity: number
) {
  const lineType = style.contentLineType ?? (style.moduleShape === 'cross' ? 'cross' : 'interlock')

  if (lineType === 'cross') {
    return drawCrossSegments(matrix, moduleCount, offset, unit, clamp(style.moduleScale, 0.48, 1), style.moduleRadius, color, accentColor, opacity)
  }

  return drawLineSegments(matrix, moduleCount, offset, unit, clamp(style.moduleScale, 0.42, 1), color, opacity, lineType)
}

function drawSp1Modules(
  matrix: BitMatrix,
  moduleCount: number,
  offset: number,
  unit: number,
  style: StyledQrStyle,
  color: string,
  accentColor: string,
  opacity: number
) {
  const strokeScale = clamp(style.contentXStrokeWidth ?? 0.7, 0.2, 1)
  const fallbackScale = clamp(style.contentStrokeWidth ?? 0.7, 0.24, 1)
  return drawCrossSegments(matrix, moduleCount, offset, unit, fallbackScale, style.moduleRadius, color, accentColor, opacity, strokeScale)
}

function drawLineSegments(
  matrix: BitMatrix,
  moduleCount: number,
  offset: number,
  unit: number,
  moduleScale: number,
  color: string,
  opacity: number,
  lineType: QrContentLineType = 'interlock'
) {
  const available = createAvailabilityMap(moduleCount)
  const segments: string[] = [drawReservedModules(matrix, available, moduleCount, offset, unit, color, opacity)]
  const strokeWidth = unit * clamp(moduleScale, 0.36, 0.88)

  if (lineType === 'horizontal' || lineType === 'interlock' || lineType === 'radial') {
    segments.push(drawDirectionalSegments(matrix, available, moduleCount, offset, unit, 0, 1, strokeWidth, color, opacity))
  }

  if (lineType === 'vertical' || lineType === 'interlock' || lineType === 'radial') {
    segments.push(drawDirectionalSegments(matrix, available, moduleCount, offset, unit, 1, 0, strokeWidth, color, opacity))
  }

  if (lineType === 'tl-br' || lineType === 'radial') {
    segments.push(drawDirectionalSegments(matrix, available, moduleCount, offset, unit, 1, 1, strokeWidth, color, opacity))
  }

  if (lineType === 'tr-bl' || lineType === 'radial') {
    segments.push(drawDirectionalSegments(matrix, available, moduleCount, offset, unit, 1, -1, strokeWidth, color, opacity))
  }

  segments.push(drawFallbackModules(matrix, available, moduleCount, offset, unit, color, opacity, 'dot'))
  return segments.join('')
}

function drawDirectionalSegments(
  matrix: BitMatrix,
  available: boolean[],
  moduleCount: number,
  offset: number,
  unit: number,
  rowStep: number,
  colStep: number,
  strokeWidth: number,
  color: string,
  opacity: number
) {
  const segments: string[] = []

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (!canUseModule(matrix, available, row, col, moduleCount)) continue
      if (canUseModule(matrix, available, row - rowStep, col - colStep, moduleCount)) continue

      const points: Array<[number, number]> = []
      let nextRow = row
      let nextCol = col

      while (canUseModule(matrix, available, nextRow, nextCol, moduleCount)) {
        points.push([nextRow, nextCol])
        nextRow += rowStep
        nextCol += colStep
      }

      if (points.length < 2) continue

      for (const [pointRow, pointCol] of points) {
        setAvailable(available, pointRow, pointCol, moduleCount, false)
      }

      const [startRow, startCol] = points[0]
      const [endRow, endCol] = points[points.length - 1]
      const x1 = offset + startCol * unit + unit / 2
      const y1 = offset + startRow * unit + unit / 2
      const x2 = offset + endCol * unit + unit / 2
      const y2 = offset + endRow * unit + unit / 2
      segments.push(`<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" stroke="${color}" stroke-width="${round(strokeWidth)}" stroke-linecap="round" opacity="${round(opacity)}"/>`)
    }
  }

  return segments.join('')
}

function drawCrossSegments(
  matrix: BitMatrix,
  moduleCount: number,
  offset: number,
  unit: number,
  moduleScale: number,
  moduleRadius: number,
  color: string,
  accentColor: string,
  opacity: number,
  strokeScale = 0.7
) {
  const available = createAvailabilityMap(moduleCount)
  const segments: string[] = [drawReservedModules(matrix, available, moduleCount, offset, unit, color, opacity)]
  const size = unit * clamp(moduleScale, 0.72, 0.96)
  const strokeWidth = unit * clamp(strokeScale, 0.2, 1) * 0.26

  for (let row = 1; row < moduleCount - 1; row += 1) {
    for (let col = 1; col < moduleCount - 1; col += 1) {
      const points = [
        [row - 1, col - 1],
        [row - 1, col + 1],
        [row, col],
        [row + 1, col - 1],
        [row + 1, col + 1]
      ]

      if (!points.every(([nextRow, nextCol]) => canUseModule(matrix, available, nextRow, nextCol, moduleCount))) {
        continue
      }

      for (const [nextRow, nextCol] of points) {
        setAvailable(available, nextRow, nextCol, moduleCount, false)
      }

      const cx = offset + col * unit + unit / 2
      const cy = offset + row * unit + unit / 2
      segments.push(drawCrossStroke(cx, cy, size, strokeWidth, color, accentColor, opacity))
    }
  }

  segments.push(drawFallbackModules(matrix, available, moduleCount, offset, unit, color, opacity, 'square', moduleRadius))
  return segments.join('')
}

function drawReservedModules(
  matrix: BitMatrix,
  available: boolean[],
  moduleCount: number,
  offset: number,
  unit: number,
  color: string,
  opacity: number
) {
  const modules: string[] = []
  const size = unit * 0.78

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (isFinderModule(row, col, moduleCount) || !matrix.get(row, col) || !isReservedModule(matrix, row, col)) continue

      const cx = offset + col * unit + unit / 2
      const cy = offset + row * unit + unit / 2
      const x = cx - size / 2
      const y = cy - size / 2
      setAvailable(available, row, col, moduleCount, false)
      modules.push(`<rect x="${round(x)}" y="${round(y)}" width="${round(size)}" height="${round(size)}" rx="${round(unit * 0.08)}" fill="${color}" opacity="${round(opacity)}"/>`)
    }
  }

  return modules.join('')
}

function drawCrossStroke(
  cx: number,
  cy: number,
  size: number,
  strokeWidth: number,
  color: string,
  accentColor: string,
  opacity: number
) {
  const half = size / 2
  return [
    `<line x1="${round(cx - half)}" y1="${round(cy - half)}" x2="${round(cx + half)}" y2="${round(cy + half)}" stroke="${color}" stroke-width="${round(strokeWidth)}" stroke-linecap="round" opacity="${round(opacity)}"/>`,
    `<line x1="${round(cx + half)}" y1="${round(cy - half)}" x2="${round(cx - half)}" y2="${round(cy + half)}" stroke="${color}" stroke-width="${round(strokeWidth)}" stroke-linecap="round" opacity="${round(opacity)}"/>`,
    `<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(strokeWidth * 0.62)}" fill="${accentColor}" opacity="${round(opacity * 0.7)}"/>`
  ].join('')
}

function drawFallbackModules(
  matrix: BitMatrix,
  available: boolean[],
  moduleCount: number,
  offset: number,
  unit: number,
  color: string,
  opacity: number,
  shape: 'dot' | 'square',
  radiusRatio = 0.18
) {
  const modules: string[] = []
  const size = unit * 0.68

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (!canUseModule(matrix, available, row, col, moduleCount)) continue

      const cx = offset + col * unit + unit / 2
      const cy = offset + row * unit + unit / 2
      setAvailable(available, row, col, moduleCount, false)

      if (shape === 'dot') {
        modules.push(`<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(size / 2)}" fill="${color}" opacity="${round(opacity)}"/>`)
        continue
      }

      const x = cx - size / 2
      const y = cy - size / 2
      modules.push(`<rect x="${round(x)}" y="${round(y)}" width="${round(size)}" height="${round(size)}" rx="${round(size * clamp(radiusRatio, 0, 0.35))}" fill="${color}" opacity="${round(opacity)}"/>`)
    }
  }

  return modules.join('')
}

async function drawImageFusionBackgroundLayer(
  matrix: BitMatrix,
  moduleCount: number,
  offset: number,
  unit: number,
  style: StyledQrStyle,
  color: string,
  accentColor: string
) {
  const microCount = moduleCount * 3
  const imageData = await getImageData(style.fusionImageDataUrl || '', microCount, microCount)
  const analysis = analyzeFusionImage(imageData)
  const imageMode = resolveFusionImageMode(style.fusionImageMode ?? 'auto', analysis)
  const brightness = clamp(style.fusionBrightness ?? 0, -1, 1)
  const contrast = clamp(style.fusionContrast ?? 0.35, -1, 1)
  const strength = clamp(style.fusionImageStrength ?? 0.72, 0, 1)
  const quality = style.fusionQuality ?? 'sharp'
  const functionalPattern = style.fusionFunctionalPattern ?? 'clean'
  const particle = getFusionParticleSettings(quality)
  const micro = unit / 3
  const microSize = micro * particle.sizeRatio
  const pieces: string[] = []

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (isFinderModule(row, col, moduleCount)) continue
      if (functionalPattern === 'clean' && isReservedModule(matrix, row, col)) continue

      const cellX = offset + col * unit
      const cellY = offset + row * unit
      pieces.push(drawImageMicroParticles(imageData, analysis, imageMode, row, col, cellX, cellY, micro, microSize, color, accentColor, brightness, contrast, strength * 0.74, false, quality))
    }
  }

  return pieces.join('')
}

async function drawImageFusionModules(
  matrix: BitMatrix,
  moduleCount: number,
  offset: number,
  unit: number,
  style: StyledQrStyle,
  color: string,
  accentColor: string,
  light: string
) {
  const microCount = moduleCount * 3
  const imageData = await getImageData(style.fusionImageDataUrl || '', microCount, microCount)
  const analysis = analyzeFusionImage(imageData)
  const imageMode = resolveFusionImageMode(style.fusionImageMode ?? 'auto', analysis)
  const brightness = clamp(style.fusionBrightness ?? 0, -1, 1)
  const contrast = clamp(style.fusionContrast ?? 0.35, -1, 1)
  const strength = clamp(style.fusionImageStrength ?? 0.72, 0, 1)
  const opacity = clamp(style.moduleOpacity, 0.25, 1)
  const functionalPattern = style.fusionFunctionalPattern ?? 'clean'
  const quality = style.fusionQuality ?? 'sharp'
  const particle = getFusionParticleSettings(quality)
  const micro = unit / 3
  const microSize = micro * particle.sizeRatio
  const centerSize = micro * clamp(style.moduleScale, particle.centerMin, 1)
  const pieces: string[] = []

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (isFinderModule(row, col, moduleCount)) continue

      const isDark = Boolean(matrix.get(row, col))
      const isReserved = isReservedModule(matrix, row, col)
      const cellX = offset + col * unit
      const cellY = offset + row * unit

      if (isReserved) {
        if (functionalPattern === 'clean') {
          pieces.push(drawFunctionalFusionModule(cellX, cellY, unit, isDark, color, light, opacity, quality))
        } else if (isDark) {
          pieces.push(drawFusionCenter(cellX, cellY, micro, centerSize, color, opacity, particle.cornerRatio))
          pieces.push(drawImageMicroParticles(imageData, analysis, imageMode, row, col, cellX, cellY, micro, microSize, color, accentColor, brightness, contrast, opacity * strength, true, quality))
        } else {
          pieces.push(`<rect x="${round(cellX)}" y="${round(cellY)}" width="${round(unit)}" height="${round(unit)}" fill="${light}" opacity="0.92"/>`)
        }
        continue
      }

      if (isDark) {
        pieces.push(drawFusionCenter(cellX, cellY, micro, centerSize, color, opacity, particle.cornerRatio))
      }

      pieces.push(drawImageMicroParticles(imageData, analysis, imageMode, row, col, cellX, cellY, micro, microSize, color, accentColor, brightness, contrast, opacity * strength, isDark, quality))
    }
  }

  return pieces.join('')
}

function drawFunctionalFusionModule(
  x: number,
  y: number,
  unit: number,
  isDark: boolean,
  color: string,
  light: string,
  opacity: number,
  quality: QrFusionQuality
) {
  if (!isDark) {
    const lightOpacity = quality === 'safe' ? 0.98 : 0.94
    return `<rect x="${round(x)}" y="${round(y)}" width="${round(unit)}" height="${round(unit)}" fill="${light}" opacity="${round(lightOpacity)}"/>`
  }

  const inset = unit * (quality === 'safe' ? 0.04 : 0.06)
  const size = unit - inset * 2
  const radius = quality === 'soft' ? unit * 0.08 : 0
  return `<rect x="${round(x + inset)}" y="${round(y + inset)}" width="${round(size)}" height="${round(size)}" rx="${round(radius)}" fill="${color}" opacity="${round(opacity)}"/>`
}

function drawFusionCenter(
  cellX: number,
  cellY: number,
  micro: number,
  size: number,
  color: string,
  opacity: number,
  cornerRatio: number
) {
  const cx = cellX + micro * 1.5
  const cy = cellY + micro * 1.5
  return `<rect x="${round(cx - size / 2)}" y="${round(cy - size / 2)}" width="${round(size)}" height="${round(size)}" rx="${round(size * cornerRatio)}" fill="${color}" opacity="${round(opacity)}"/>`
}

function drawImageMicroParticles(
  imageData: ImageData,
  analysis: FusionImageAnalysis,
  imageMode: Exclude<QrFusionImageMode, 'auto'>,
  row: number,
  col: number,
  cellX: number,
  cellY: number,
  micro: number,
  microSize: number,
  color: string,
  accentColor: string,
  brightness: number,
  contrast: number,
  opacity: number,
  isDarkModule: boolean,
  quality: QrFusionQuality
) {
  const pieces: string[] = []
  const settings = getFusionParticleSettings(quality)
  const baseThreshold = settings.baseThreshold - brightness * 0.24 - contrast * 0.08
  const contrastBoost = settings.contrastBoost + contrast * 0.34
  const toneDensityCap = analysis.darkRatio > 0.7 ? 0.32 : 0.72

  for (let microRow = 0; microRow < 3; microRow += 1) {
    for (let microCol = 0; microCol < 3; microCol += 1) {
      if (microRow === 1 && microCol === 1) continue

      const x = col * 3 + microCol
      const y = row * 3 + microRow
      const luminance = getImageLuminance(imageData, x, y)
      const highlight = getHighlightSignal(luminance, analysis)
      const edge = getEdgeSignal(imageData, x, y, analysis)
      const darkness = clamp((1 - luminance - baseThreshold) * (1 + contrastBoost), 0, 1)
      const dither = getDeterministicNoise(x, y)
      const toneBand = darkness > 0.68 ? 1 : darkness > 0.42 ? 0.72 : darkness > 0.2 ? 0.44 : darkness > 0.08 ? 0.22 : 0
      const imageSignal =
        imageMode === 'edges'
          ? clamp(edge * 0.88 + highlight * 0.34, 0, 1)
          : imageMode === 'highlights'
            ? clamp(highlight * 0.95 + edge * 0.28, 0, 1)
            : Math.min(toneBand, toneDensityCap)
      const density = isDarkModule ? Math.max(settings.darkDensity, imageSignal) : imageSignal * settings.lightDensity
      const shouldDraw = isDarkModule ? density > 0.12 || dither < settings.darkNoiseFloor : density > dither
      if (!shouldDraw) continue

      const fill = dither > settings.accentCutoff ? accentColor : color
      const visualSignal = imageMode === 'tone' ? darkness : imageSignal
      const particleOpacity = clamp((settings.opacityBase + visualSignal * settings.opacityRange) * opacity, settings.opacityMin, 1)
      const px = cellX + microCol * micro + (micro - microSize) / 2
      const py = cellY + microRow * micro + (micro - microSize) / 2
      pieces.push(`<rect x="${round(px)}" y="${round(py)}" width="${round(microSize)}" height="${round(microSize)}" rx="${round(microSize * settings.cornerRatio)}" fill="${fill}" opacity="${round(particleOpacity)}"/>`)
    }
  }

  return pieces.join('')
}

function getFusionParticleSettings(quality: QrFusionQuality) {
  if (quality === 'soft') {
    return {
      sizeRatio: 0.82,
      centerMin: 0.68,
      cornerRatio: 0.25,
      baseThreshold: 0.42,
      contrastBoost: 0.28,
      darkDensity: 0.28,
      lightDensity: 0.92,
      darkNoiseFloor: 0.28,
      opacityBase: 0.34,
      opacityRange: 0.56,
      opacityMin: 0.18,
      accentCutoff: 0.78
    }
  }

  if (quality === 'safe') {
    return {
      sizeRatio: 0.9,
      centerMin: 0.9,
      cornerRatio: 0,
      baseThreshold: 0.46,
      contrastBoost: 0.34,
      darkDensity: 0.5,
      lightDensity: 0.55,
      darkNoiseFloor: 0.42,
      opacityBase: 0.56,
      opacityRange: 0.42,
      opacityMin: 0.42,
      accentCutoff: 0.9
    }
  }

  return {
    sizeRatio: 0.96,
    centerMin: 0.86,
    cornerRatio: 0,
    baseThreshold: 0.38,
    contrastBoost: 0.46,
    darkDensity: 0.44,
    lightDensity: 1.18,
    darkNoiseFloor: 0.36,
    opacityBase: 0.62,
    opacityRange: 0.38,
    opacityMin: 0.5,
    accentCutoff: 0.86
  }
}

type FusionImageAnalysis = {
  p10: number
  p50: number
  p75: number
  p90: number
  darkRatio: number
  edgeP90: number
}

function analyzeFusionImage(imageData: ImageData): FusionImageAnalysis {
  const luminanceValues: number[] = []
  const edgeValues: number[] = []

  for (let y = 0; y < imageData.height; y += 1) {
    for (let x = 0; x < imageData.width; x += 1) {
      const luminance = getImageLuminance(imageData, x, y)
      luminanceValues.push(luminance)

      if (x < imageData.width - 1 && y < imageData.height - 1) {
        const right = getImageLuminance(imageData, x + 1, y)
        const down = getImageLuminance(imageData, x, y + 1)
        edgeValues.push(Math.abs(luminance - right) + Math.abs(luminance - down))
      }
    }
  }

  luminanceValues.sort((a, b) => a - b)
  edgeValues.sort((a, b) => a - b)
  const darkPixels = luminanceValues.filter((value) => value < 0.32).length

  return {
    p10: percentile(luminanceValues, 0.1),
    p50: percentile(luminanceValues, 0.5),
    p75: percentile(luminanceValues, 0.75),
    p90: percentile(luminanceValues, 0.9),
    darkRatio: darkPixels / Math.max(1, luminanceValues.length),
    edgeP90: Math.max(percentile(edgeValues, 0.9), 0.03)
  }
}

function resolveFusionImageMode(mode: QrFusionImageMode, analysis: FusionImageAnalysis): Exclude<QrFusionImageMode, 'auto'> {
  if (mode !== 'auto') return mode
  if (analysis.darkRatio > 0.7 || analysis.p50 < 0.38) return 'edges'
  return 'tone'
}

function getHighlightSignal(luminance: number, analysis: FusionImageAnalysis) {
  const threshold = analysis.darkRatio > 0.7 ? Math.max(analysis.p75 ?? 0.62, 0.58) : Math.max(analysis.p90 - 0.18, 0.58)
  return clamp((luminance - threshold) / Math.max(0.12, 1 - threshold), 0, 1)
}

function getEdgeSignal(imageData: ImageData, x: number, y: number, analysis: FusionImageAnalysis) {
  const luminance = getImageLuminance(imageData, x, y)
  const right = getImageLuminance(imageData, Math.min(imageData.width - 1, x + 1), y)
  const down = getImageLuminance(imageData, x, Math.min(imageData.height - 1, y + 1))
  const left = getImageLuminance(imageData, Math.max(0, x - 1), y)
  const up = getImageLuminance(imageData, x, Math.max(0, y - 1))
  const edge = Math.abs(luminance - right) + Math.abs(luminance - down) + Math.abs(luminance - left) + Math.abs(luminance - up)
  return clamp(edge / Math.max(analysis.edgeP90 * 1.4, 0.04), 0, 1)
}

function percentile(values: number[], ratio: number) {
  if (!values.length) return 0
  return values[Math.min(values.length - 1, Math.max(0, Math.round((values.length - 1) * ratio)))]
}

async function getImageData(source: string, width: number, height: number): Promise<ImageData> {
  if (!source || typeof window === 'undefined') {
    throw new Error('Image fusion requires a browser image source.')
  }

  const image = await loadFusionImage(source)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Image fusion canvas could not be prepared.')

  const sourceRatio = image.naturalWidth / image.naturalHeight
  const targetRatio = width / height
  let sx = 0
  let sy = 0
  let sw = image.naturalWidth
  let sh = image.naturalHeight

  if (sourceRatio > targetRatio) {
    sw = image.naturalHeight * targetRatio
    sx = (image.naturalWidth - sw) / 2
  } else {
    sh = image.naturalWidth / targetRatio
    sy = (image.naturalHeight - sh) / 2
  }

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height)
}

function loadFusionImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Image fusion background could not be loaded.'))
    image.src = source
  })
}

function getImageLuminance(imageData: ImageData, x: number, y: number) {
  const index = (y * imageData.width + x) * 4
  const r = imageData.data[index] / 255
  const g = imageData.data[index + 1] / 255
  const b = imageData.data[index + 2] / 255
  return clamp(0.2126 * r + 0.7152 * g + 0.0722 * b, 0, 1)
}

function getDeterministicNoise(x: number, y: number) {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return value - Math.floor(value)
}

function drawFinder(
  x: number,
  y: number,
  unit: number,
  shape: QrFinderShape,
  color: string,
  light: string
): string {
  if (shape === 'planet') {
    const center = {
      x: x + unit * 3.5,
      y: y + unit * 3.5
    }

    return [
      `<circle cx="${round(center.x)}" cy="${round(center.y)}" r="${round(unit * 1.5)}" fill="${color}"/>`,
      `<circle cx="${round(center.x)}" cy="${round(center.y)}" r="${round(unit * 3)}" fill="none" stroke="${color}" stroke-width="${round(unit * 0.15)}" stroke-dasharray="${round(unit * 0.42)} ${round(unit * 0.52)}" opacity="0.78"/>`,
      `<circle cx="${round(center.x + unit * 3)}" cy="${round(center.y)}" r="${round(unit * 0.5)}" fill="${color}"/>`,
      `<circle cx="${round(center.x - unit * 3)}" cy="${round(center.y)}" r="${round(unit * 0.5)}" fill="${color}"/>`,
      `<circle cx="${round(center.x)}" cy="${round(center.y + unit * 3)}" r="${round(unit * 0.5)}" fill="${color}"/>`,
      `<circle cx="${round(center.x)}" cy="${round(center.y - unit * 3)}" r="${round(unit * 0.5)}" fill="${color}"/>`
    ].join('')
  }

  if (shape === 'circle') {
    const center = {
      x: x + unit * 3.5,
      y: y + unit * 3.5
    }

    return [
      `<circle cx="${round(center.x)}" cy="${round(center.y)}" r="${round(unit * 3.5)}" fill="${color}"/>`,
      `<circle cx="${round(center.x)}" cy="${round(center.y)}" r="${round(unit * 2.35)}" fill="${light}"/>`,
      `<circle cx="${round(center.x)}" cy="${round(center.y)}" r="${round(unit * 1.45)}" fill="${color}"/>`
    ].join('')
  }

  if (shape === 'bracket') {
    const w = unit * 7
    const thick = unit * 0.42
    const span = unit * 1.8
    const outerRadius = unit * 1.15
    const innerRadius = unit * 0.8
    const centerRadius = unit * 0.5

    return [
      `<rect x="${round(x)}" y="${round(y)}" width="${round(w)}" height="${round(w)}" rx="${round(outerRadius)}" fill="${color}"/>`,
      `<rect x="${round(x + unit)}" y="${round(y + unit)}" width="${round(unit * 5)}" height="${round(unit * 5)}" rx="${round(innerRadius)}" fill="${light}"/>`,
      `<rect x="${round(x + unit * 2)}" y="${round(y + unit * 2)}" width="${round(unit * 3)}" height="${round(unit * 3)}" rx="${round(centerRadius)}" fill="${color}"/>`,
      `<rect x="${round(x)}" y="${round(y)}" width="${round(span)}" height="${round(thick)}" fill="${color}"/>`,
      `<rect x="${round(x)}" y="${round(y)}" width="${round(thick)}" height="${round(span)}" fill="${color}"/>`,
      `<rect x="${round(x + w - span)}" y="${round(y)}" width="${round(span)}" height="${round(thick)}" fill="${color}"/>`,
      `<rect x="${round(x + w - thick)}" y="${round(y)}" width="${round(thick)}" height="${round(span)}" fill="${color}"/>`,
      `<rect x="${round(x)}" y="${round(y + w - thick)}" width="${round(span)}" height="${round(thick)}" fill="${color}"/>`,
      `<rect x="${round(x)}" y="${round(y + w - span)}" width="${round(thick)}" height="${round(span)}" fill="${color}"/>`,
      `<rect x="${round(x + w - span)}" y="${round(y + w - thick)}" width="${round(span)}" height="${round(thick)}" fill="${color}"/>`,
      `<rect x="${round(x + w - thick)}" y="${round(y + w - span)}" width="${round(thick)}" height="${round(span)}" fill="${color}"/>`
    ].join('')
  }

  const radius = shape === 'rounded' ? unit * 1.15 : 0
  return [
    `<rect x="${round(x)}" y="${round(y)}" width="${round(unit * 7)}" height="${round(unit * 7)}" rx="${round(radius)}" fill="${color}"/>`,
    `<rect x="${round(x + unit)}" y="${round(y + unit)}" width="${round(unit * 5)}" height="${round(unit * 5)}" rx="${round(radius * 0.7)}" fill="${light}"/>`,
    `<rect x="${round(x + unit * 2)}" y="${round(y + unit * 2)}" width="${round(unit * 3)}" height="${round(unit * 3)}" rx="${round(radius * 0.45)}" fill="${color}"/>`
  ].join('')
}

function drawStyledFinders(
  offset: number,
  moduleCount: number,
  unit: number,
  style: StyledQrStyle,
  borderColor: string,
  centerColor: string,
  light: string
) {
  const borderShape = getMarkerBorderShape(style)
  const centerShape = getMarkerCenterShape(style, borderShape)
  const strokeScale = style.positioningStrokeWidth ?? 0.9

  return [
    drawLayeredFinder(offset, offset, unit, borderShape, centerShape, borderColor, centerColor, light, strokeScale),
    drawLayeredFinder(offset + (moduleCount - 7) * unit, offset, unit, borderShape, centerShape, borderColor, centerColor, light, strokeScale),
    drawLayeredFinder(offset, offset + (moduleCount - 7) * unit, unit, borderShape, centerShape, borderColor, centerColor, light, strokeScale)
  ].join('')
}

function getMarkerBorderShape(style: StyledQrStyle): QrMarkerBorderShape {
  if (style.markerBorderShape) return style.markerBorderShape
  if (style.finderShape === 'bracket') return 'bracket'

  const positioningType = style.positioningPointType ?? finderShapeToPositioning(style.finderShape)
  if (positioningType === 'dsj') return 'dsj'
  return positioningType
}

function getMarkerCenterShape(style: StyledQrStyle, borderShape: QrMarkerBorderShape): QrMarkerCenterShape {
  if (style.markerCenterShape) return style.markerCenterShape
  if (borderShape === 'circle' || borderShape === 'planet') return 'circle'
  if (borderShape === 'rounded' || borderShape === 'bracket') return 'rounded'
  return 'square'
}

function drawLayeredFinder(
  x: number,
  y: number,
  unit: number,
  borderShape: QrMarkerBorderShape,
  centerShape: QrMarkerCenterShape,
  borderColor: string,
  centerColor: string,
  light: string,
  strokeScale: number
) {
  if (borderShape === 'planet') {
    return drawFinder(x, y, unit, 'planet', borderColor, light)
  }

  const w = unit * 7
  const center = { x: x + unit * 3.5, y: y + unit * 3.5 }
  const pieces: string[] = []

  if (borderShape === 'circle') {
    pieces.push(`<circle cx="${round(center.x)}" cy="${round(center.y)}" r="${round(unit * 3.5)}" fill="${borderColor}"/>`)
    pieces.push(`<circle cx="${round(center.x)}" cy="${round(center.y)}" r="${round(unit * 2.35)}" fill="${light}"/>`)
  } else {
    const outerRadius = borderShape === 'rounded' || borderShape === 'bracket' ? unit * 1.15 : 0
    const innerRadius = borderShape === 'rounded' || borderShape === 'bracket' ? unit * 0.8 : 0
    pieces.push(`<rect x="${round(x)}" y="${round(y)}" width="${round(w)}" height="${round(w)}" rx="${round(outerRadius)}" fill="${borderColor}"/>`)
    pieces.push(`<rect x="${round(x + unit)}" y="${round(y + unit)}" width="${round(unit * 5)}" height="${round(unit * 5)}" rx="${round(innerRadius)}" fill="${light}"/>`)
  }

  pieces.push(drawFinderCenter(x, y, unit, centerShape, centerColor))

  if (borderShape === 'bracket') {
    const thick = unit * 0.42
    const span = unit * 1.8
    pieces.push(
      `<rect x="${round(x)}" y="${round(y)}" width="${round(span)}" height="${round(thick)}" fill="${borderColor}"/>`,
      `<rect x="${round(x)}" y="${round(y)}" width="${round(thick)}" height="${round(span)}" fill="${borderColor}"/>`,
      `<rect x="${round(x + w - span)}" y="${round(y)}" width="${round(span)}" height="${round(thick)}" fill="${borderColor}"/>`,
      `<rect x="${round(x + w - thick)}" y="${round(y)}" width="${round(thick)}" height="${round(span)}" fill="${borderColor}"/>`,
      `<rect x="${round(x)}" y="${round(y + w - thick)}" width="${round(span)}" height="${round(thick)}" fill="${borderColor}"/>`,
      `<rect x="${round(x)}" y="${round(y + w - span)}" width="${round(thick)}" height="${round(span)}" fill="${borderColor}"/>`,
      `<rect x="${round(x + w - span)}" y="${round(y + w - thick)}" width="${round(span)}" height="${round(thick)}" fill="${borderColor}"/>`,
      `<rect x="${round(x + w - thick)}" y="${round(y + w - span)}" width="${round(thick)}" height="${round(span)}" fill="${borderColor}"/>`
    )
  }

  if (borderShape === 'dsj') {
    const stroke = unit * clamp(strokeScale, 0.2, 1)
    const span = unit * 2.1
    pieces.push(
      `<line x1="${round(x)}" y1="${round(y)}" x2="${round(x + span)}" y2="${round(y)}" stroke="${borderColor}" stroke-width="${round(stroke)}" stroke-linecap="square"/>`,
      `<line x1="${round(x)}" y1="${round(y)}" x2="${round(x)}" y2="${round(y + span)}" stroke="${borderColor}" stroke-width="${round(stroke)}" stroke-linecap="square"/>`,
      `<line x1="${round(x + w)}" y1="${round(y)}" x2="${round(x + w - span)}" y2="${round(y)}" stroke="${borderColor}" stroke-width="${round(stroke)}" stroke-linecap="square"/>`,
      `<line x1="${round(x + w)}" y1="${round(y)}" x2="${round(x + w)}" y2="${round(y + span)}" stroke="${borderColor}" stroke-width="${round(stroke)}" stroke-linecap="square"/>`,
      `<line x1="${round(x)}" y1="${round(y + w)}" x2="${round(x + span)}" y2="${round(y + w)}" stroke="${borderColor}" stroke-width="${round(stroke)}" stroke-linecap="square"/>`,
      `<line x1="${round(x)}" y1="${round(y + w)}" x2="${round(x)}" y2="${round(y + w - span)}" stroke="${borderColor}" stroke-width="${round(stroke)}" stroke-linecap="square"/>`,
      `<line x1="${round(x + w)}" y1="${round(y + w)}" x2="${round(x + w - span)}" y2="${round(y + w)}" stroke="${borderColor}" stroke-width="${round(stroke)}" stroke-linecap="square"/>`,
      `<line x1="${round(x + w)}" y1="${round(y + w)}" x2="${round(x + w)}" y2="${round(y + w - span)}" stroke="${borderColor}" stroke-width="${round(stroke)}" stroke-linecap="square"/>`
    )
  }

  return pieces.join('')
}

function drawFinderCenter(x: number, y: number, unit: number, centerShape: QrMarkerCenterShape, color: string) {
  if (centerShape === 'circle') {
    return `<circle cx="${round(x + unit * 3.5)}" cy="${round(y + unit * 3.5)}" r="${round(unit * 1.45)}" fill="${color}"/>`
  }

  if (centerShape === 'dot') {
    return `<circle cx="${round(x + unit * 3.5)}" cy="${round(y + unit * 3.5)}" r="${round(unit * 1.05)}" fill="${color}"/>`
  }

  const radius = centerShape === 'rounded' ? unit * 0.5 : 0
  return `<rect x="${round(x + unit * 2)}" y="${round(y + unit * 2)}" width="${round(unit * 3)}" height="${round(unit * 3)}" rx="${round(radius)}" fill="${color}"/>`
}

function drawPositioningFinder(
  x: number,
  y: number,
  unit: number,
  type: QrPositioningPointType,
  color: string,
  light: string,
  strokeScale: number
) {
  if (type === 'dsj') {
    return drawDsjFinder(x, y, unit, color, light, strokeScale)
  }

  const finderShape: QrFinderShape = type === 'rounded' ? 'rounded' : type
  return drawFinder(x, y, unit, finderShape, color, light)
}

function drawDsjFinder(
  x: number,
  y: number,
  unit: number,
  color: string,
  light: string,
  strokeScale: number
) {
  const w = unit * 7
  const stroke = unit * clamp(strokeScale, 0.2, 1)
  const span = unit * 2.1

  return [
    `<rect x="${round(x)}" y="${round(y)}" width="${round(w)}" height="${round(w)}" fill="${color}"/>`,
    `<rect x="${round(x + unit)}" y="${round(y + unit)}" width="${round(unit * 5)}" height="${round(unit * 5)}" fill="${light}"/>`,
    `<rect x="${round(x + unit * 2)}" y="${round(y + unit * 2)}" width="${round(unit * 3)}" height="${round(unit * 3)}" fill="${color}"/>`,
    `<line x1="${round(x)}" y1="${round(y)}" x2="${round(x + span)}" y2="${round(y)}" stroke="${color}" stroke-width="${round(stroke)}" stroke-linecap="square"/>`,
    `<line x1="${round(x)}" y1="${round(y)}" x2="${round(x)}" y2="${round(y + span)}" stroke="${color}" stroke-width="${round(stroke)}" stroke-linecap="square"/>`,
    `<line x1="${round(x + w)}" y1="${round(y)}" x2="${round(x + w - span)}" y2="${round(y)}" stroke="${color}" stroke-width="${round(stroke)}" stroke-linecap="square"/>`,
    `<line x1="${round(x + w)}" y1="${round(y)}" x2="${round(x + w)}" y2="${round(y + span)}" stroke="${color}" stroke-width="${round(stroke)}" stroke-linecap="square"/>`,
    `<line x1="${round(x)}" y1="${round(y + w)}" x2="${round(x + span)}" y2="${round(y + w)}" stroke="${color}" stroke-width="${round(stroke)}" stroke-linecap="square"/>`,
    `<line x1="${round(x)}" y1="${round(y + w)}" x2="${round(x)}" y2="${round(y + w - span)}" stroke="${color}" stroke-width="${round(stroke)}" stroke-linecap="square"/>`,
    `<line x1="${round(x + w)}" y1="${round(y + w)}" x2="${round(x + w - span)}" y2="${round(y + w)}" stroke="${color}" stroke-width="${round(stroke)}" stroke-linecap="square"/>`,
    `<line x1="${round(x + w)}" y1="${round(y + w)}" x2="${round(x + w)}" y2="${round(y + w - span)}" stroke="${color}" stroke-width="${round(stroke)}" stroke-linecap="square"/>`
  ].join('')
}

function finderShapeToPositioning(shape: QrFinderShape): QrPositioningPointType {
  if (shape === 'bracket') return 'rounded'
  return shape
}

function isFinderModule(row: number, col: number, moduleCount: number) {
  const inTop = row < 7
  const inLeft = col < 7
  const inRight = col >= moduleCount - 7
  const inBottom = row >= moduleCount - 7

  return (inTop && inLeft) || (inTop && inRight) || (inBottom && inLeft)
}

function isReservedModule(matrix: BitMatrix, row: number, col: number) {
  return matrix.reservedBit[row * matrix.size + col] === 1
}

function createAvailabilityMap(moduleCount: number) {
  return Array.from({ length: moduleCount * moduleCount }, () => true)
}

function canUseModule(
  matrix: BitMatrix,
  available: boolean[],
  row: number,
  col: number,
  moduleCount: number
) {
  if (row < 0 || col < 0 || row >= moduleCount || col >= moduleCount) return false
  if (isFinderModule(row, col, moduleCount)) return false
  if (!matrix.get(row, col)) return false
  if (!available[row * moduleCount + col]) return false

  return true
}

function setAvailable(
  available: boolean[],
  row: number,
  col: number,
  moduleCount: number,
  value: boolean
) {
  available[row * moduleCount + col] = value
}

function markUnavailable(
  available: boolean[],
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  moduleCount: number
) {
  for (let row = startRow; row <= endRow; row += 1) {
    for (let col = startCol; col <= endCol; col += 1) {
      setAvailable(available, row, col, moduleCount, false)
    }
  }
}

function sanitizeColor(color: string, fallback: string) {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback
}

function getDeterministicPointScale(row: number, col: number) {
  const value = (row * 37 + col * 17 + row * col * 13) % 5
  return 0.54 + value * 0.06
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))
}

function round(value: number) {
  return Number(value.toFixed(3))
}
