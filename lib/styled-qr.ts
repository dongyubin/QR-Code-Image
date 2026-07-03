import QRCode, { type BitMatrix, type QRCodeErrorCorrectionLevel } from 'qrcode'

export type QrStylePreset =
  | 'a1-classic'
  | 'a1-circle'
  | 'a1-planet'
  | 'a2-interlock'
  | 'a2-cross'
  | 'sp1-blueprint'
  | 'rounded-ink'
  | 'blueprint-pop'
  | 'warm-poster'
export type QrModuleShape = 'square' | 'rounded' | 'dot' | 'line' | 'cross'
export type QrFinderShape = 'square' | 'rounded' | 'circle' | 'planet' | 'bracket'
export type QrbtfFamily = 'a1' | 'a2' | 'sp1' | 'custom'
export type QrModuleRenderMode = 'preset' | 'core'
export type QrContentPointType = 'square' | 'circle'
export type QrContentLineType = 'horizontal' | 'vertical' | 'interlock' | 'radial' | 'tl-br' | 'tr-bl' | 'cross'
export type QrPositioningPointType = 'square' | 'circle' | 'planet' | 'rounded' | 'dsj'

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
  contentStrokeWidth?: number
  contentXStrokeWidth?: number
  positioningStrokeWidth?: number
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

  if (family === 'custom') {
    parts.push(drawFinder(offset, offset, unit, style.finderShape, finderColor, light))
    parts.push(drawFinder(offset + (moduleCount - 7) * unit, offset, unit, style.finderShape, finderColor, light))
    parts.push(drawFinder(offset, offset + (moduleCount - 7) * unit, unit, style.finderShape, finderColor, light))
  } else {
    const positioningType = style.positioningPointType ?? finderShapeToPositioning(style.finderShape)
    const positioningStrokeWidth = style.positioningStrokeWidth ?? 0.9
    parts.push(drawPositioningFinder(offset, offset, unit, positioningType, positioningColor, light, positioningStrokeWidth))
    parts.push(drawPositioningFinder(offset + (moduleCount - 7) * unit, offset, unit, positioningType, positioningColor, light, positioningStrokeWidth))
    parts.push(drawPositioningFinder(offset, offset + (moduleCount - 7) * unit, unit, positioningType, positioningColor, light, positioningStrokeWidth))
  }
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
