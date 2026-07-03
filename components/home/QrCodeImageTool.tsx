"use client"

import { Button } from '@/components/ui/button'
import { qrFaqs, qrFeatures, qrUseCases } from '@/lib/qr-content'
import {
  QrContentLineType,
  QrFinderShape,
  QrModuleShape,
  QrPositioningPointType,
  QrStylePreset,
  renderStyledQrCode,
  StyledQrStyle
} from '@/lib/styled-qr'
import {
  Camera,
  Check,
  ChevronDown,
  Clipboard,
  Download,
  FileArchive,
  FileImage,
  ImagePlus,
  Link2,
  Loader2,
  QrCode,
  ScanLine,
  Square,
  Upload,
  Wand2
} from 'lucide-react'
import { useLocale } from 'next-intl'
import { ChangeEvent, DragEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'

type DownloadFormat = 'png' | 'jpg' | 'svg'
type ToolTab = 'scan' | 'create' | 'batch'
type XMode = 'profile' | 'post' | 'share'
type QrTemplateId =
  | 'random'
  | 'url'
  | 'text'
  | 'email'
  | 'sms'
  | 'phone'
  | 'twitter'
  | 'bitcoin'
  | 'wifi'
  | 'pdf'
  | 'image'
type RandomQrType = Exclude<QrTemplateId, 'random'>
type Html5QrcodeInstance = InstanceType<typeof import('html5-qrcode').Html5Qrcode>
type QrSelfTestResult = {
  status: 'success' | 'error'
  title: string
  message: string
  decoded?: string
} | null
type ReadabilityLevel = 'excellent' | 'good' | 'risky' | 'experimental' | 'testing'
type ReadabilityCheck = {
  label: string
  passed: boolean
  detail: string
}
type ReadabilityScore = {
  score: number
  level: ReadabilityLevel
  label: string
  toneClass: string
  barClass: string
  tips: string[]
  checks: ReadabilityCheck[]
}

const defaultStyle: StyledQrStyle = {
  dark: '#111827',
  light: '#fbfaf4',
  margin: 2,
  width: 900,
  errorCorrectionLevel: 'H',
  stylePreset: 'rounded-ink',
  moduleShape: 'rounded',
  moduleScale: 0.82,
  moduleRadius: 0.32,
  finderShape: 'rounded',
  finderColor: '#111827',
  accentColor: '#b84a2b',
  moduleOpacity: 1,
  qrbtfFamily: 'custom',
  moduleRenderMode: 'preset',
  contentPointType: 'square',
  contentLineType: 'interlock',
  positioningPointType: 'rounded',
  contentPointColor: '#111827',
  positioningPointColor: '#111827',
  contentStrokeWidth: 0.7,
  contentXStrokeWidth: 0.7,
  positioningStrokeWidth: 0.9
}

const examples = [
  'https://example.com',
  'https://maps.google.com',
  'mailto:hello@example.com',
  'WIFI:T:WPA;S:Studio WiFi;P:strong-password;;'
]

const palettes = [
  ['#111827', '#fbfaf4'],
  ['#0f3d3e', '#f1f8f6'],
  ['#6b2d1f', '#fff5ec'],
  ['#0b3158', '#eef7ff'],
  ['#3f2b56', '#fff9db']
]

const stylePresets: Array<{
  id: QrStylePreset
  label: string
  description: string
  tag: string
  values: StyledQrStyle
}> = [
    {
      id: 'a1-classic',
      label: 'A1 Classic',
      description: 'Sharp square points for maximum readability.',
      tag: 'A1',
      values: {
        dark: '#111827',
        light: '#ffffff',
        margin: 3,
        width: 900,
        errorCorrectionLevel: 'H',
        stylePreset: 'a1-classic',
        moduleShape: 'square',
        moduleScale: 1,
        moduleRadius: 0,
        finderShape: 'square',
        finderColor: '#111827',
        accentColor: '#111827',
        moduleOpacity: 1,
        qrbtfFamily: 'a1',
        contentPointType: 'square',
        contentLineType: 'interlock',
        positioningPointType: 'square',
        contentPointColor: '#111827',
        positioningPointColor: '#111827',
        contentStrokeWidth: 0.7,
        contentXStrokeWidth: 0.7,
        positioningStrokeWidth: 0.9
      }
    },
    {
      id: 'a1-circle',
      label: 'A1 Circle',
      description: 'Soft circular points tuned for clean scanning.',
      tag: 'A1C',
      values: {
        dark: '#17201d',
        light: '#f8f4e8',
        margin: 3,
        width: 900,
        errorCorrectionLevel: 'H',
        stylePreset: 'a1-circle',
        moduleShape: 'dot',
        moduleScale: 0.5,
        moduleRadius: 0.5,
        finderShape: 'circle',
        finderColor: '#17201d',
        accentColor: '#b84a2b',
        moduleOpacity: 0.72,
        qrbtfFamily: 'a1',
        contentPointType: 'circle',
        contentLineType: 'interlock',
        positioningPointType: 'circle',
        contentPointColor: '#17201d',
        positioningPointColor: '#17201d',
        contentStrokeWidth: 0.7,
        contentXStrokeWidth: 0.7,
        positioningStrokeWidth: 0.9
      }
    },
    {
      id: 'a1-planet',
      label: 'A1 Planet',
      description: 'Variable dots with orbit-style positioning details.',
      tag: 'A1P',
      values: {
        dark: '#24342f',
        light: '#fbfaf4',
        margin: 3,
        width: 900,
        errorCorrectionLevel: 'H',
        stylePreset: 'a1-planet',
        moduleShape: 'dot',
        moduleScale: 0,
        moduleRadius: 0.5,
        finderShape: 'planet',
        finderColor: '#24342f',
        accentColor: '#d46d33',
        moduleOpacity: 1,
        qrbtfFamily: 'a1',
        contentPointType: 'circle',
        contentLineType: 'interlock',
        positioningPointType: 'planet',
        contentPointColor: '#24342f',
        positioningPointColor: '#24342f',
        contentStrokeWidth: 0.7,
        contentXStrokeWidth: 0.7,
        positioningStrokeWidth: 0.9
      }
    },
    {
      id: 'a2-interlock',
      label: 'A2 Interlock',
      description: 'Merged horizontal and vertical line segments.',
      tag: 'A2',
      values: {
        dark: '#123f3d',
        light: '#eff8f4',
        margin: 3,
        width: 900,
        errorCorrectionLevel: 'H',
        stylePreset: 'a2-interlock',
        moduleShape: 'line',
        moduleScale: 0.6,
        moduleRadius: 0.5,
        finderShape: 'rounded',
        finderColor: '#123f3d',
        accentColor: '#d9a441',
        moduleOpacity: 1,
        qrbtfFamily: 'a2',
        contentPointType: 'square',
        contentLineType: 'interlock',
        positioningPointType: 'rounded',
        contentPointColor: '#123f3d',
        positioningPointColor: '#123f3d',
        contentStrokeWidth: 0.7,
        contentXStrokeWidth: 0.7,
        positioningStrokeWidth: 0.9
      }
    },
    {
      id: 'a2-cross',
      label: 'A2 Cross',
      description: 'Cross modules with fallback points for scan stability.',
      tag: 'A2C',
      values: {
        dark: '#1f2937',
        light: '#f7f2e6',
        margin: 3,
        width: 900,
        errorCorrectionLevel: 'H',
        stylePreset: 'a2-cross',
        moduleShape: 'cross',
        moduleScale: 0.6,
        moduleRadius: 0,
        finderShape: 'square',
        finderColor: '#1f2937',
        accentColor: '#b84a2b',
        moduleOpacity: 1,
        qrbtfFamily: 'a2',
        contentPointType: 'square',
        contentLineType: 'cross',
        positioningPointType: 'square',
        contentPointColor: '#1f2937',
        positioningPointColor: '#1f2937',
        contentStrokeWidth: 0.7,
        contentXStrokeWidth: 0.7,
        positioningStrokeWidth: 0.9
      }
    },
    {
      id: 'sp1-blueprint',
      label: 'SP1 Blueprint',
      description: 'Blueprint-style structure with adjustable strokes.',
      tag: 'SP1',
      values: {
        dark: '#0b2d97',
        light: '#f5f8ff',
        margin: 3,
        width: 900,
        errorCorrectionLevel: 'H',
        stylePreset: 'sp1-blueprint',
        moduleShape: 'cross',
        moduleScale: 0.7,
        moduleRadius: 0,
        finderShape: 'bracket',
        finderColor: '#0b2d97',
        accentColor: '#f6b506',
        moduleOpacity: 1,
        qrbtfFamily: 'sp1',
        contentPointType: 'square',
        contentLineType: 'cross',
        positioningPointType: 'dsj',
        contentPointColor: '#b51224',
        positioningPointColor: '#0b2d97',
        contentStrokeWidth: 0.7,
        contentXStrokeWidth: 0.7,
        positioningStrokeWidth: 0.9
      }
    },
    {
      id: 'rounded-ink',
      label: 'Rounded Ink',
      description: 'Friendly rounded modules with strong contrast.',
      tag: 'Custom',
      values: defaultStyle
    },
    {
      id: 'blueprint-pop',
      label: 'Blueprint Pop',
      description: 'Self-made blue, red, and gold marketing style.',
      tag: 'Color pop',
      values: {
        dark: '#b51224',
        light: '#f5f8ff',
        margin: 3,
        width: 900,
        errorCorrectionLevel: 'H',
        stylePreset: 'blueprint-pop',
        moduleShape: 'rounded',
        moduleScale: 0.84,
        moduleRadius: 0.18,
        finderShape: 'bracket',
        finderColor: '#0b2d97',
        accentColor: '#f6b506',
        moduleOpacity: 1,
        qrbtfFamily: 'custom',
        contentPointType: 'square',
        contentLineType: 'interlock',
        positioningPointType: 'rounded',
        contentPointColor: '#b51224',
        positioningPointColor: '#0b2d97',
        contentStrokeWidth: 0.7,
        contentXStrokeWidth: 0.7,
        positioningStrokeWidth: 0.9
      }
    },
    {
      id: 'warm-poster',
      label: 'Warm Poster',
      description: 'Warm editorial look for flyers, posters, and landing pages.',
      tag: 'Marketing',
      values: {
        dark: '#6b2d1f',
        light: '#fff5ec',
        margin: 3,
        width: 900,
        errorCorrectionLevel: 'H',
        stylePreset: 'warm-poster',
        moduleShape: 'rounded',
        moduleScale: 0.78,
        moduleRadius: 0.42,
        finderShape: 'bracket',
        finderColor: '#6b2d1f',
        accentColor: '#d56b2d',
        moduleOpacity: 0.96,
        qrbtfFamily: 'custom',
        contentPointType: 'square',
        contentLineType: 'interlock',
        positioningPointType: 'rounded',
        contentPointColor: '#6b2d1f',
        positioningPointColor: '#6b2d1f',
        contentStrokeWidth: 0.7,
        contentXStrokeWidth: 0.7,
        positioningStrokeWidth: 0.9
      }
    }
  ]

const qrTemplates: Array<{
  id: QrTemplateId
  label: string
  description: string
  value: string
}> = [
    {
      id: 'random',
      label: 'Random',
      description: 'Test QR data',
      value: ''
    },
    {
      id: 'url',
      label: 'URL',
      description: 'Website link',
      value: 'https://example.com'
    },
    {
      id: 'text',
      label: 'Text',
      description: 'Plain message',
      value: 'Hello from QR Code Image'
    },
    {
      id: 'email',
      label: 'Email',
      description: 'Address + subject',
      value: 'mailto:hello@example.com?subject=Hello'
    },
    {
      id: 'sms',
      label: 'SMS',
      description: 'Text message',
      value: 'SMSTO:+15551234567:Hello from QR Code Image'
    },
    {
      id: 'phone',
      label: 'Phone',
      description: 'Tap to call',
      value: 'tel:+15551234567'
    },
    {
      id: 'twitter',
      label: 'X',
      description: 'Profile, post, or share',
      value: 'https://x.com/example'
    },
    {
      id: 'bitcoin',
      label: 'Bitcoin',
      description: 'Payment URI',
      value: 'bitcoin:bc1qexampleaddress?amount=0.001'
    },
    {
      id: 'wifi',
      label: 'Wi-Fi',
      description: 'Network login',
      value: ''
    },
    {
      id: 'pdf',
      label: 'PDF',
      description: 'Hosted file URL',
      value: 'https://example.com/menu.pdf'
    },
    {
      id: 'image',
      label: 'Image URL',
      description: 'Open hosted image',
      value: 'https://example.com/image.jpg'
    }
  ]

const qrTypeCards: Array<{
  id: QrTemplateId
  label: string
  description: string
  bestFor: string
}> = [
    {
      id: 'random',
      label: 'Random QR Code',
      description: 'Generate realistic sample QR content for testing scanners, layouts, and placeholder QR images.',
      bestFor: 'Testing and mockups'
    },
    {
      id: 'url',
      label: 'URL QR Code',
      description: 'Create a QR code image that opens a website, landing page, product page, map, or online form.',
      bestFor: 'Websites and campaigns'
    },
    {
      id: 'text',
      label: 'Text QR Code',
      description: 'Store plain text in a QR code image without requiring a website or hosted file.',
      bestFor: 'Notes and offline text'
    },
    {
      id: 'email',
      label: 'Email QR Code',
      description: 'Open a prefilled email with recipient and subject so users can contact you faster.',
      bestFor: 'Support and inquiries'
    },
    {
      id: 'sms',
      label: 'SMS QR Code',
      description: 'Create a QR code that opens a text message draft on supported mobile devices.',
      bestFor: 'Promos and callbacks'
    },
    {
      id: 'phone',
      label: 'Phone QR Code',
      description: 'Let users scan a QR image and start a phone call without typing the number.',
      bestFor: 'Business cards and signs'
    },
    {
      id: 'twitter',
      label: 'X QR Code',
      description: 'Point scanners to an X profile, a real post URL, or a prefilled share intent.',
      bestFor: 'Social promotion'
    },
    {
      id: 'bitcoin',
      label: 'Bitcoin QR Code',
      description: 'Encode a Bitcoin payment URI for simple wallet handoff and payment testing.',
      bestFor: 'Crypto payment links'
    },
    {
      id: 'wifi',
      label: 'Wi-Fi QR Code',
      description: 'Turn network name, password, security type, and hidden-network settings into a scan-ready QR.',
      bestFor: 'Guest Wi-Fi access'
    },
    {
      id: 'pdf',
      label: 'PDF QR Code',
      description: 'Generate a QR code image that opens a hosted PDF such as a menu, brochure, or manual.',
      bestFor: 'Menus and documents'
    },
    {
      id: 'image',
      label: 'Image URL QR Code',
      description: 'Create a QR code image that opens a hosted image file, screenshot, poster, or gallery asset.',
      bestFor: 'Image sharing'
    }
  ]

const randomTypeOptions: Array<{
  id: RandomQrType
  label: string
}> = [
    { id: 'url', label: 'URL' },
    { id: 'text', label: 'Text' },
    { id: 'email', label: 'Email' },
    { id: 'sms', label: 'SMS' },
    { id: 'phone', label: 'Phone' },
    { id: 'twitter', label: 'X' },
    { id: 'bitcoin', label: 'Bitcoin' },
    { id: 'wifi', label: 'Wi-Fi' },
    { id: 'pdf', label: 'PDF' },
    { id: 'image', label: 'Image URL' }
  ]

const xModeOptions: Array<{
  id: XMode
  label: string
  description: string
}> = [
    {
      id: 'profile',
      label: 'Profile',
      description: 'Link to an X account'
    },
    {
      id: 'post',
      label: 'Post',
      description: 'Link to a specific X post'
    },
    {
      id: 'share',
      label: 'Share',
      description: 'Open a prefilled X post'
    }
  ]

const toolTabs: Array<{
  id: ToolTab
  hash: '#scanner' | '#generator' | '#batch'
  label: string
  description: string
}> = [
    {
      id: 'scan',
      hash: '#scanner',
      label: 'Scan QR Code Image',
      description: 'Upload or camera'
    },
    {
      id: 'create',
      hash: '#generator',
      label: 'QR Code Image Create',
      description: 'Make a QR image Generator'
    },
    {
      id: 'batch',
      hash: '#batch',
      label: 'Batch QR Code',
      description: 'Export many SVGs'
    }
  ]

export default function QrCodeImageTool() {
  const locale = useLocale()
  const [activeTab, setActiveTab] = useState<ToolTab>('scan')
  const [activeTemplate, setActiveTemplate] = useState<QrTemplateId>('url')
  const [randomType, setRandomType] = useState<RandomQrType>('url')
  const [data, setData] = useState('https://example.com')
  const [wifiSsid, setWifiSsid] = useState('Studio WiFi')
  const [wifiPassword, setWifiPassword] = useState('strong-password')
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA')
  const [wifiHidden, setWifiHidden] = useState(false)
  const [xMode, setXMode] = useState<XMode>('profile')
  const [xUsername, setXUsername] = useState('example')
  const [xPostId, setXPostId] = useState('1234567890')
  const [xPostUrl, setXPostUrl] = useState('')
  const [xShareText, setXShareText] = useState('Hello from QR Code Image')
  const [xShareUrl, setXShareUrl] = useState('https://example.com')
  const [style, setStyle] = useState<StyledQrStyle>(() => ({ ...stylePresets[0].values, moduleRenderMode: 'preset' }))
  const [previewUrl, setPreviewUrl] = useState('')
  const [svgText, setSvgText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [scanResult, setScanResult] = useState('')
  const [scanError, setScanError] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [localImageName, setLocalImageName] = useState('')
  const [batchInput, setBatchInput] = useState('https://example.com/pricing\nhttps://example.com/contact')
  const [batchStatus, setBatchStatus] = useState('')
  const [openFaqIndex, setOpenFaqIndex] = useState(0)
  const [isTestingQr, setIsTestingQr] = useState(false)
  const [qrSelfTestResult, setQrSelfTestResult] = useState<QrSelfTestResult>(null)
  const [realReadability, setRealReadability] = useState<ReadabilityScore | null>(null)
  const batchItems = batchInput
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
  const cameraScannerRef = useRef<Html5QrcodeInstance | null>(null)
  const stylePreviewUrls = useMemo(
    () =>
      stylePresets.map((preset) => ({
        id: preset.id,
        url: renderStyledQrCode('https://example.com', { ...preset.values, moduleRenderMode: 'preset' }, { width: 220 }).svgDataUrl
      })),
    []
  )
  const qrSelfTestCopy = useMemo(() => getQrSelfTestCopy(locale), [locale])

  const contrastRatio = useMemo(() => getContrastRatio(style.dark, style.light), [style.dark, style.light])
  const fallbackReadability = useMemo(() => getReadabilityScore(style, data, contrastRatio), [contrastRatio, data, style])
  const readability = isTestingQr
    ? getTestingReadabilityScore(fallbackReadability)
    : realReadability ?? fallbackReadability
  const showReadabilityTools = false
  useEffect(() => {
    if (activeTemplate === 'wifi') {
      setData(buildWifiPayload(wifiSsid, wifiPassword, wifiEncryption, wifiHidden))
    }
  }, [activeTemplate, wifiEncryption, wifiHidden, wifiPassword, wifiSsid])

  useEffect(() => {
    if (activeTemplate === 'twitter') {
      setData(buildXPayload({ mode: xMode, username: xUsername, postId: xPostId, postUrl: xPostUrl, shareText: xShareText, shareUrl: xShareUrl }))
    }
  }, [activeTemplate, xMode, xPostId, xPostUrl, xShareText, xShareUrl, xUsername])

  useEffect(() => {
    let active = true

    async function renderQr() {
      if (!data.trim()) {
        setPreviewUrl('')
        setSvgText('')
        return
      }

      setIsGenerating(true)
      try {
        const nextQr = renderStyledQrCode(data, style)

        if (!active) return
        setPreviewUrl(nextQr.svgDataUrl)
        setSvgText(nextQr.svgText)
      } catch {
        if (!active) return
        setPreviewUrl('')
        setSvgText('')
      } finally {
        if (active) setIsGenerating(false)
      }
    }

    renderQr()

    return () => {
      active = false
    }
  }, [data, style])

  useEffect(() => {
    setRealReadability(null)
  }, [data, style])

  const stopCamera = useCallback(async () => {
    const scanner = cameraScannerRef.current
    if (!scanner) {
      setIsCameraActive(false)
      return
    }

    try {
      await scanner.stop()
      scanner.clear()
    } catch {
      scanner.clear()
    } finally {
      cameraScannerRef.current = null
      setIsCameraActive(false)
    }
  }, [])

  const scanFile = useCallback(async (file: File) => {
    await stopCamera()
    setIsScanning(true)
    setScanError('')
    setScanResult('')
    setCameraError('')

    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-scan-reader')
      const result = await scanner.scanFile(file, true)
      setScanResult(result)
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'No QR code was found in that image.')
    } finally {
      setIsScanning(false)
    }
  }, [stopCamera])

  async function startCamera() {
    setScanError('')
    setCameraError('')
    setScanResult('')

    try {
      await stopCamera()
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-camera-reader')
      cameraScannerRef.current = scanner
      setIsCameraActive(true)

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          setScanResult(decodedText)
          setCameraError('')
          await stopCamera()
        },
        undefined
      )
    } catch (error) {
      cameraScannerRef.current = null
      setIsCameraActive(false)
      setCameraError(error instanceof Error ? error.message : 'Camera scan could not start.')
    }
  }

  useEffect(() => {
    const handler = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items) return

      const imageItem = Array.from(items).find((item) => item.type.startsWith('image/'))
      if (!imageItem) return

      const file = imageItem.getAsFile()
      if (file) {
        event.preventDefault()
        scanFile(file)
      }
    }

    window.addEventListener('paste', handler)
    return () => window.removeEventListener('paste', handler)
  }, [scanFile])

  useEffect(() => {
    const syncTabFromHash = () => {
      if (window.location.hash === '#scanner') setActiveTab('scan')
      if (window.location.hash === '#generator' || window.location.hash === '#image-to-qr') {
        setActiveTab('create')
      }
      if (window.location.hash === '#batch') setActiveTab('batch')
    }

    syncTabFromHash()
    window.addEventListener('hashchange', syncTabFromHash)
    return () => window.removeEventListener('hashchange', syncTabFromHash)
  }, [])

  useEffect(() => {
    if (activeTab !== 'scan') {
      stopCamera()
    }
  }, [activeTab, stopCamera])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  function onScanUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) scanFile(file)
    event.target.value = ''
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) scanFile(file)
  }

  function applyTemplate(template: (typeof qrTemplates)[number]) {
    setActiveTemplate(template.id)
    if (template.id === 'random') {
      generateRandomQr(randomType)
      return
    }

    if (template.id === 'wifi') {
      setData(buildWifiPayload(wifiSsid, wifiPassword, wifiEncryption, wifiHidden))
      return
    }

    if (template.id === 'twitter') {
      setData(buildXPayload({ mode: xMode, username: xUsername, postId: xPostId, postUrl: xPostUrl, shareText: xShareText, shareUrl: xShareUrl }))
      return
    }

    setData(template.value)
    if (template.id === 'image') {
      setImageUrl(template.value)
    }
  }

  function generateRandomQr(type: RandomQrType) {
    setRandomType(type)
    setData(createRandomQrValue(type))
  }

  function updateXPostUrl(value: string) {
    setXPostUrl(value)
    const parsedPost = parseXPostUrl(value)

    if (parsedPost) {
      setXUsername(parsedPost.username)
      setXPostId(parsedPost.postId)
    }
  }

  function applyStylePreset(presetId: QrStylePreset) {
    const preset = stylePresets.find((item) => item.id === presetId)
    if (!preset) return

    setStyle({ ...preset.values, moduleRenderMode: 'preset' })
  }

  function resetCurrentStyle() {
    const preset = stylePresets.find((item) => item.id === style.stylePreset)
    setStyle({ ...(preset?.values ?? defaultStyle), moduleRenderMode: 'preset' })
  }

  function randomizeStyle() {
    const [dark, light] = palettes[Math.floor(Math.random() * palettes.length)]
    const preset = stylePresets[Math.floor(Math.random() * stylePresets.length)]
    setStyle({
      ...preset.values,
      moduleRenderMode: 'preset',
      dark,
      finderColor: dark,
      contentPointColor: dark,
      positioningPointColor: dark,
      light,
      margin: Math.floor(Math.random() * 3) + 2,
      errorCorrectionLevel: Math.random() > 0.35 ? 'H' : 'Q',
      moduleScale: Math.max(0.72, Math.min(0.98, preset.values.moduleScale + (Math.random() * 0.08 - 0.04)))
    })
  }

  function download(format: DownloadFormat) {
    const name = `qr-code-image.${format}`

    if (format === 'svg') {
      downloadBlob(new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' }), name)
      return
    }

    if (format === 'png') {
      downloadRasterImage('png', name)
      return
    }

    downloadRasterImage('jpg', name)
  }

  async function downloadRasterImage(format: 'png' | 'jpg', fileName: string) {
    if (!svgText) return

    try {
      const canvas = await renderSvgToCanvas(svgText, style.width, style.light)
      const mime = format === 'png' ? 'image/png' : 'image/jpeg'
      downloadHref(canvas.toDataURL(mime, 0.92), fileName)
    } catch {
      setQrSelfTestResult({
        status: 'error',
        title: qrSelfTestCopy.notDetectedTitle,
        message: qrSelfTestCopy.renderFailed
      })
    }
  }

  async function testGeneratedQr() {
    if (!svgText || isTestingQr) return

    setIsTestingQr(true)
    setQrSelfTestResult(null)
    setRealReadability(null)

    try {
      const canvas = await renderSvgToCanvas(svgText, Math.max(style.width, 900), style.light)
      const blob = await canvasToBlob(canvas, 'image/png')
      const file = new File([blob], 'qr-code-image-test.png', { type: 'image/png' })
      const { Html5Qrcode } = await import('html5-qrcode')
      const readerId = `qr-self-test-reader-${Date.now()}`
      const reader = document.createElement('div')
      reader.id = readerId
      reader.style.position = 'fixed'
      reader.style.left = '-9999px'
      reader.style.top = '-9999px'
      reader.style.width = '1px'
      reader.style.height = '1px'
      reader.setAttribute('aria-hidden', 'true')
      document.body.appendChild(reader)

      const scanner = new Html5Qrcode(readerId)

      try {
        const decoded = await scanner.scanFile(file, true)
        setQrSelfTestResult({
          status: 'success',
          title: qrSelfTestCopy.scannableTitle,
          message: qrSelfTestCopy.scannableMessage,
          decoded
        })
      } catch {
        setQrSelfTestResult({
          status: 'error',
          title: qrSelfTestCopy.notDetectedTitle,
          message: qrSelfTestCopy.tryStrongerContrast
        })
      } finally {
        scanner.clear()
        reader.remove()
      }
    } catch {
      setQrSelfTestResult({
        status: 'error',
        title: qrSelfTestCopy.notDetectedTitle,
        message: qrSelfTestCopy.renderFailed
      })
    } finally {
      setIsTestingQr(false)
    }
  }

  function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob)
    downloadHref(url, fileName)
    setTimeout(() => URL.revokeObjectURL(url), 250)
  }

  function downloadHref(href: string, fileName: string) {
    const link = document.createElement('a')
    link.href = href
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  function useImageUrl() {
    if (imageUrl.trim()) setData(imageUrl.trim())
  }

  function onImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setLocalImageName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const value = String(reader.result || '')
      setImageUrl(value)
      setData(value)
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  async function downloadBatchZip() {
    const rows = batchInput
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)

    if (!rows.length) {
      setBatchStatus('Add one URL or text item per line first.')
      return
    }

    setBatchStatus('Preparing ZIP...')
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    try {
      await Promise.all(
        rows.map(async (item, index) => {
          const svg = renderStyledQrCode(item, style).svgText
          zip.file(`qr-code-image-${String(index + 1).padStart(2, '0')}.svg`, svg)
        })
      )
    } catch {
      setBatchStatus('One item is too long to generate. Shorten it and try again.')
      return
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(blob, 'qr-code-images.zip')
    setBatchStatus(`${rows.length} SVG files exported.`)
  }

  function openTab(tab: ToolTab, hash: string) {
    setActiveTab(tab)
    window.history.replaceState(null, '', hash)
    document.getElementById('workspace')?.scrollIntoView({ block: 'start' })
  }

  function openQrType(typeId: QrTemplateId) {
    const template = qrTemplates.find((item) => item.id === typeId)
    if (!template) return

    setActiveTab('create')
    applyTemplate(template)
    window.history.replaceState(null, '', '#generator')
    document.getElementById('workspace')?.scrollIntoView({ block: 'start' })
  }

  const tabPanelShell =
    'min-w-0 scroll-mt-24 rounded-md border-2 border-[#17201d] p-5 shadow-[5px_5px_0_#17201d]'

  return (
    <div className="w-full bg-[#f7f2e6] text-[#17201d]">
      <section id="top" className="mx-auto w-full max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-8">
        <div className="border-b-2 border-[#17201d] pb-8">
          <div className="max-w-6xl">
            <p className="mb-4 inline-flex rounded-full border border-[#17201d] bg-[#f8d36b] px-4 py-2 text-xs font-black uppercase tracking-normal">
              Free Online QR Code Image Tool
            </p>
            <h1 className="font-serif text-4xl font-black leading-[0.98] tracking-normal text-[#111827] sm:text-6xl lg:text-7xl">
              Scan QR code images and create QR code images fast.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#50625b] sm:text-lg">
              Use this QR code image scanner and generator to read QR codes from screenshots,
              create QR code images from URLs or text, and download clean PNG, JPG, SVG, or ZIP files.
            </p>
          </div>
        </div>
      </section>

      <section
        id="workspace"
        className="mx-auto grid w-full max-w-7xl scroll-mt-24 grid-cols-1 items-start gap-5 px-4 pb-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8"
      >
        <div className="grid min-w-0 content-start gap-4 self-start">
          <div className="grid gap-2 rounded-md border-2 border-[#17201d] bg-[#fffaf0] p-2 shadow-[5px_5px_0_#17201d] sm:grid-cols-3">
            {toolTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => openTab(tab.id, tab.hash)}
                className={`flex h-[76px] flex-col justify-center overflow-hidden rounded-md border px-4 py-3 text-left transition ${activeTab === tab.id
                  ? 'border-[#17201d] bg-[#17201d] text-[#fffaf0]'
                  : 'border-transparent bg-transparent hover:border-[#17201d] hover:bg-[#f8d36b]'
                  }`}
              >
                <span className="block truncate text-sm font-black">{tab.label}</span>
                <span className={`block truncate text-xs ${activeTab === tab.id ? 'text-[#d8c9af]' : 'text-[#62736d]'}`}>
                  {tab.description}
                </span>
              </button>
            ))}
          </div>

          {activeTab === 'scan' && (
            <article id="scanner" className={`${tabPanelShell} bg-[#fffaf0]`}>
              <PanelHeader
                icon={<ScanLine className="h-6 w-6" />}
                step="01"
                title="Scan QR From Image"
                description="Upload, drag, or paste a QR screenshot and see the decoded value immediately."
              />

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div
                  className={`grid min-h-56 place-items-center rounded-md border-2 border-dashed p-6 text-center transition ${isDragging ? 'border-[#b84a2b] bg-[#ffe4c7]' : 'border-[#8b806e] bg-[#f9efd6]'
                    }`}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  tabIndex={0}
                >
                  <div id="qr-scan-reader" hidden />
                  <Upload className="mb-3 h-10 w-10" />
                  <strong>{isScanning ? 'Scanning image...' : 'Upload QR code image'}</strong>
                  <span className="mt-2 text-sm text-[#62736d]">PNG, JPG, WebP, or pasted screenshot</span>
                  <label className="mt-4 inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#17201d] px-4 py-2 text-sm font-bold text-[#fffaf0]">
                    <FileImage className="h-4 w-4" />
                    Choose image
                    <input type="file" accept="image/*" onChange={onScanUpload} hidden />
                  </label>
                </div>

                <div className="grid min-h-56 rounded-md border-2 border-[#17201d] bg-white p-3">
                  <div id="qr-camera-reader" className="min-h-40 overflow-hidden rounded-md bg-[#111827]" />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button onClick={startCamera} disabled={isCameraActive} className="rounded-md bg-[#17201d]">
                      <Camera />
                      Start camera
                    </Button>
                    <Button onClick={stopCamera} disabled={!isCameraActive} variant="outline" className="rounded-md">
                      <Square />
                      Stop
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-[#62736d]">
                    Camera scanning works best on HTTPS or localhost with browser permission.
                  </p>
                </div>
              </div>

              <ResultBox
                isScanning={isScanning}
                scanResult={scanResult}
                scanError={scanError || cameraError}
                onMakeQr={() => setData(scanResult)}
              />
            </article>
          )}

          {activeTab === 'create' && (
            <div className={`${tabPanelShell} grid gap-4 bg-[#fffaf0]`}>
              <article id="generator" className="min-w-0">
                <PanelHeader
                  icon={<QrCode className="h-6 w-6" />}
                  step="02"
                  title="Create QR Code Image"
                  description="Paste a URL or text, tune the essentials, then download from the preview panel."
                />

                <div className="mt-4">
                  <div className="mb-2 flex items-end justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black tracking-normal">QR Code Types</h3>
                      <p className="text-sm text-[#62736d]">Choose a type, then fill in the details below.</p>
                    </div>
                    {activeTemplate === 'random' && (
                      <Button onClick={() => generateRandomQr(randomType)} variant="outline" className="hidden rounded-md border-[#17201d] sm:inline-flex">
                        <Wand2 />
                        New random
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    {qrTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => applyTemplate(template)}
                        className={`rounded-md border p-3 text-left transition ${activeTemplate === template.id
                          ? 'border-[#17201d] bg-[#17201d] text-[#fffaf0]'
                          : 'border-[#d8c9af] bg-white hover:border-[#17201d]'
                          }`}
                      >
                        <span className="block text-sm font-black">{template.label}</span>
                        <span className={`block text-xs ${activeTemplate === template.id ? 'text-[#d8c9af]' : 'text-[#62736d]'}`}>
                          {template.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {activeTemplate === 'wifi' ? (
                  <div className="mt-4 rounded-md border border-[#d8c9af] bg-white/70 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-1 text-xs font-black uppercase text-[#62736d]">
                        Network name
                        <input
                          value={wifiSsid}
                          onChange={(event) => setWifiSsid(event.target.value)}
                          placeholder="Guest WiFi"
                          className="h-11 rounded-md border-2 border-[#17201d] bg-white px-3 text-sm font-medium normal-case text-[#17201d] outline-none focus:ring-4 focus:ring-[#f8d36b]/50"
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-black uppercase text-[#62736d]">
                        Password
                        <input
                          value={wifiPassword}
                          onChange={(event) => setWifiPassword(event.target.value)}
                          placeholder="WiFi password"
                          disabled={wifiEncryption === 'nopass'}
                          className="h-11 rounded-md border-2 border-[#17201d] bg-white px-3 text-sm font-medium normal-case text-[#17201d] outline-none focus:ring-4 focus:ring-[#f8d36b]/50 disabled:cursor-not-allowed disabled:bg-[#eadcc4]"
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-black uppercase text-[#62736d]">
                        Security
                        <select
                          value={wifiEncryption}
                          onChange={(event) => setWifiEncryption(event.target.value as 'WPA' | 'WEP' | 'nopass')}
                          className="h-11 rounded-md border-2 border-[#17201d] bg-white px-3 text-sm font-medium normal-case text-[#17201d] outline-none"
                        >
                          <option value="WPA">WPA/WPA2</option>
                          <option value="WEP">WEP</option>
                          <option value="nopass">No password</option>
                        </select>
                      </label>
                      <label className="flex min-h-11 items-center gap-3 rounded-md border-2 border-[#17201d] bg-white px-3 text-sm font-bold text-[#17201d]">
                        <input
                          type="checkbox"
                          checked={wifiHidden}
                          onChange={(event) => setWifiHidden(event.target.checked)}
                          className="h-4 w-4 accent-[#17201d]"
                        />
                        Hidden network
                      </label>
                    </div>
                    <p className="mt-3 text-sm text-[#62736d]">
                      This form creates the WiFi QR payload automatically, so users do not need to know the QR encoding format.
                    </p>
                  </div>
                ) : activeTemplate === 'twitter' ? (
                  <div className="mt-4 rounded-md border border-[#d8c9af] bg-white/70 p-4">
                    <div>
                      <h3 className="text-base font-black tracking-normal">X link type</h3>
                      <p className="text-sm text-[#62736d]">Choose whether the QR opens a profile, a specific post, or a prefilled share composer.</p>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      {xModeOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setXMode(option.id)}
                          className={`min-h-20 rounded-md border-2 p-3 text-left transition ${xMode === option.id
                            ? 'border-[#17201d] bg-[#17201d] text-[#fffaf0] shadow-[4px_4px_0_#b84a2b]'
                            : 'border-[#d8c9af] bg-white text-[#17201d] hover:border-[#17201d]'
                            }`}
                          aria-pressed={xMode === option.id}
                        >
                          <span className="block text-sm font-black">{option.label}</span>
                          <span className={`mt-1 block text-xs leading-5 ${xMode === option.id ? 'text-[#d8c9af]' : 'text-[#62736d]'}`}>
                            {option.description}
                          </span>
                        </button>
                      ))}
                    </div>

                    {xMode === 'profile' && (
                      <div className="mt-4">
                        <label className="grid gap-1 text-xs font-black uppercase text-[#62736d]">
                          X username
                          <input
                            value={xUsername}
                            onChange={(event) => setXUsername(event.target.value)}
                            placeholder="@example"
                            className="h-11 rounded-md border-2 border-[#17201d] bg-white px-3 text-sm font-medium normal-case text-[#17201d] outline-none focus:ring-4 focus:ring-[#f8d36b]/50"
                          />
                        </label>
                        <p className="mt-2 text-sm text-[#62736d]">
                          Accepts @username, username, or an X profile URL. The QR payload will use https://x.com/username.
                        </p>
                      </div>
                    )}

                    {xMode === 'post' && (
                      <div className="mt-4 grid gap-3">
                        <label className="grid gap-1 text-xs font-black uppercase text-[#62736d]">
                          X post URL
                          <input
                            value={xPostUrl}
                            onChange={(event) => updateXPostUrl(event.target.value)}
                            placeholder="https://x.com/example/status/1234567890"
                            className="h-11 rounded-md border-2 border-[#17201d] bg-white px-3 text-sm font-medium normal-case text-[#17201d] outline-none focus:ring-4 focus:ring-[#f8d36b]/50"
                          />
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="grid gap-1 text-xs font-black uppercase text-[#62736d]">
                            Username
                            <input
                              value={xUsername}
                              onChange={(event) => {
                                setXPostUrl('')
                                setXUsername(event.target.value)
                              }}
                              placeholder="@example"
                              className="h-11 rounded-md border-2 border-[#17201d] bg-white px-3 text-sm font-medium normal-case text-[#17201d] outline-none focus:ring-4 focus:ring-[#f8d36b]/50"
                            />
                          </label>
                          <label className="grid gap-1 text-xs font-black uppercase text-[#62736d]">
                            Post ID
                            <input
                              value={xPostId}
                              onChange={(event) => {
                                setXPostUrl('')
                                setXPostId(event.target.value)
                              }}
                              placeholder="1234567890"
                              className="h-11 rounded-md border-2 border-[#17201d] bg-white px-3 text-sm font-medium normal-case text-[#17201d] outline-none focus:ring-4 focus:ring-[#f8d36b]/50"
                            />
                          </label>
                        </div>
                        <p className="text-sm text-[#62736d]">
                          Paste a full X post URL, or use username plus post ID to create https://x.com/username/status/postId.
                        </p>
                      </div>
                    )}

                    {xMode === 'share' && (
                      <div className="mt-4 grid gap-3">
                        <label className="grid gap-1 text-xs font-black uppercase text-[#62736d]">
                          Share text
                          <textarea
                            value={xShareText}
                            onChange={(event) => setXShareText(event.target.value)}
                            rows={3}
                            placeholder="Write the prefilled X post text"
                            className="min-h-24 rounded-md border-2 border-[#17201d] bg-white px-3 py-2 text-sm font-medium normal-case text-[#17201d] outline-none focus:ring-4 focus:ring-[#f8d36b]/50"
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-black uppercase text-[#62736d]">
                          Optional URL
                          <input
                            value={xShareUrl}
                            onChange={(event) => setXShareUrl(event.target.value)}
                            placeholder="https://example.com"
                            className="h-11 rounded-md border-2 border-[#17201d] bg-white px-3 text-sm font-medium normal-case text-[#17201d] outline-none focus:ring-4 focus:ring-[#f8d36b]/50"
                          />
                        </label>
                        <p className="text-sm text-[#62736d]">
                          Share uses X intent format only for the composer flow, not for profile or post QR codes.
                        </p>
                      </div>
                    )}

                    <code className="mt-4 block max-h-24 overflow-auto whitespace-pre-wrap break-words rounded-md bg-[#17201d] p-3 text-xs text-[#fffaf0]">
                      {data}
                    </code>
                  </div>
                ) : activeTemplate === 'random' ? (
                  <div className="mt-4 rounded-md border border-[#d8c9af] bg-white/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black tracking-normal">Random QR data</h3>
                        <p className="text-sm text-[#62736d]">Choose a QR type, then generate realistic test content for that format.</p>
                      </div>
                      <Button onClick={() => generateRandomQr(randomType)} className="rounded-md bg-[#17201d]">
                        <Wand2 />
                        Generate random
                      </Button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {randomTypeOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => generateRandomQr(option.id)}
                          className={`h-10 rounded-md border px-3 text-sm font-black ${randomType === option.id
                            ? 'border-[#17201d] bg-[#17201d] text-[#fffaf0]'
                            : 'border-[#d8c9af] bg-white text-[#17201d] hover:border-[#17201d]'
                            }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <code className="mt-3 block rounded-md bg-[#17201d] p-3 text-sm text-[#fffaf0]">{data}</code>
                  </div>
                ) : (
                  <>
                    <label className="mt-4 block text-xs font-black uppercase text-[#62736d]" htmlFor="qr-data">
                      URL or text
                    </label>
                    <textarea
                      id="qr-data"
                      value={data}
                      onChange={(event) => setData(event.target.value)}
                      rows={5}
                      spellCheck={false}
                      className="mt-2 min-h-32 w-full resize-y rounded-md border-2 border-[#17201d] bg-white px-3 py-2 outline-none focus:ring-4 focus:ring-[#f8d36b]/50"
                    />
                  </>
                )}

                {activeTemplate !== 'twitter' && (
                  <div className="my-3 flex flex-wrap gap-2">
                    {examples.map((item) => (
                      <button
                        key={item}
                        onClick={() => setData(item)}
                        className="max-w-full overflow-hidden text-ellipsis rounded-full border border-[#17201d] bg-[#f8d36b] px-3 py-1 text-xs font-bold"
                      >
                        {item.replace('https://', '')}
                      </button>
                    ))}
                  </div>
                )}

                <div className="min-w-0 overflow-hidden rounded-md border border-[#d8c9af] bg-white/70 p-4">
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black tracking-normal">Parametric Style</h3>
                      <p className="text-sm text-[#62736d]">Choose a readable style preset, then tune the QR modules.</p>
                    </div>
                    <span className="rounded-full border border-[#d8c9af] bg-white px-3 py-1 text-xs font-black text-[#50625b]">
                      {style.errorCorrectionLevel} recovery
                    </span>
                  </div>

                  <div className="-mx-1 flex min-w-0 max-w-full gap-3 overflow-x-auto overscroll-x-contain px-1 pb-3 [scrollbar-width:thin]">
                    {stylePresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyStylePreset(preset.id)}
                        className={`group w-44 flex-none rounded-md border-2 p-2 text-left transition ${style.stylePreset === preset.id
                          ? 'border-[#17201d] bg-[#17201d] text-[#fffaf0] shadow-[4px_4px_0_#b84a2b]'
                          : 'border-[#d8c9af] bg-white text-[#17201d] hover:border-[#17201d] hover:shadow-[4px_4px_0_#17201d]'
                          }`}
                        aria-pressed={style.stylePreset === preset.id}
                      >
                        <span className="grid aspect-square place-items-center overflow-hidden rounded-md border border-[#d8c9af] bg-[#fffdf7] p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={stylePreviewUrls.find((item) => item.id === preset.id)?.url}
                            alt={`${preset.label} QR style preview`}
                            className="h-full w-full object-contain transition group-hover:scale-[1.03]"
                          />
                        </span>
                        <span className="mt-3 flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-black">{preset.label}</span>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${style.stylePreset === preset.id
                            ? 'border-[#d8c9af] text-[#f8d36b]'
                            : 'border-[#d8c9af] text-[#b84a2b]'
                            }`}>
                            {preset.tag}
                          </span>
                        </span>
                        <span className={`mt-1 block text-xs leading-5 ${style.stylePreset === preset.id ? 'text-[#d8c9af]' : 'text-[#62736d]'}`}>
                          {preset.description}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#d8c9af] pt-4">
                    <div>
                      <h4 className="text-sm font-black tracking-normal">Core</h4>
                      <p className="text-xs text-[#62736d]">Tune this QR code image style.</p>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0 rounded-md border-[#17201d]" onClick={resetCurrentStyle}>
                      Reset style
                    </Button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <ColorField
                      label="Module color"
                      value={style.contentPointColor ?? style.dark}
                      onChange={(moduleColor) => setStyle((current) => ({ ...current, dark: moduleColor, contentPointColor: moduleColor }))}
                    />
                    <ColorField label="Background color" value={style.light} onChange={(light) => setStyle((current) => ({ ...current, light }))} />
                    <ColorField
                      label="Position marker color"
                      value={style.positioningPointColor ?? style.finderColor}
                      onChange={(positionMarkerColor) => setStyle((current) => ({ ...current, finderColor: positionMarkerColor, positioningPointColor: positionMarkerColor }))}
                    />
                    <ColorField label="Accent color" value={style.accentColor} onChange={(accentColor) => setStyle((current) => ({ ...current, accentColor }))} />
                    <label className="grid gap-1 text-xs font-black uppercase text-[#62736d]">
                      Error correction
                      <select
                        value={style.errorCorrectionLevel}
                        onChange={(event) =>
                          setStyle((current) => ({
                            ...current,
                            errorCorrectionLevel: event.target.value as StyledQrStyle['errorCorrectionLevel']
                          }))
                        }
                        className="h-10 rounded-md border-2 border-[#17201d] bg-white px-3"
                      >
                        <option value="L">L - 7%</option>
                        <option value="M">M - 15%</option>
                        <option value="Q">Q - 25%</option>
                        <option value="H">H - 30%</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-black uppercase text-[#62736d]">
                      Module shape
                      <select
                        value={style.moduleShape}
                        onChange={(event) => setStyle((current) => syncStyleForModuleShape(current, event.target.value as QrModuleShape))}
                        className="h-10 rounded-md border-2 border-[#17201d] bg-white px-3"
                      >
                        <option value="square">Square</option>
                        <option value="rounded">Rounded</option>
                        <option value="dot">Dot</option>
                        <option value="line">Line</option>
                        <option value="cross">Cross</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-black uppercase text-[#62736d]">
                      Position marker shape
                      <select
                        value={style.positioningPointType ?? finderShapeToPositioning(style.finderShape)}
                        onChange={(event) => {
                          const positioningPointType = event.target.value as QrPositioningPointType
                          setStyle((current) => ({
                            ...current,
                            positioningPointType,
                            finderShape: positioningToFinderShape(positioningPointType)
                          }))
                        }}
                        className="h-10 rounded-md border-2 border-[#17201d] bg-white px-3"
                      >
                        <option value="square">Square</option>
                        <option value="circle">Circle</option>
                        <option value="planet">Planet</option>
                        <option value="rounded">Rounded</option>
                        <option value="dsj">DSJ</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-black uppercase text-[#62736d]">
                      Quiet zone
                      <input
                        type="number"
                        min={0}
                        max={8}
                        value={style.margin}
                        onChange={(event) => setStyle((current) => ({ ...current, margin: Number(event.target.value) }))}
                        className="h-10 rounded-md border-2 border-[#17201d] bg-white px-3"
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-black uppercase text-[#62736d]">
                      Image size
                      <input
                        type="number"
                        min={256}
                        max={2000}
                        step={64}
                        value={style.width}
                        onChange={(event) => setStyle((current) => ({ ...current, width: Number(event.target.value) }))}
                        className="h-10 rounded-md border-2 border-[#17201d] bg-white px-3"
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-black uppercase text-[#62736d]">
                      Line pattern
                      <select
                        value={style.contentLineType ?? 'interlock'}
                        onChange={(event) => {
                          const contentLineType = event.target.value as QrContentLineType
                          setStyle((current) => ({
                            ...current,
                            contentLineType,
                            moduleShape: lineTypeToModuleShape(contentLineType),
                            moduleRenderMode: 'core'
                          }))
                        }}
                        className="h-10 rounded-md border-2 border-[#17201d] bg-white px-3"
                      >
                        <option value="horizontal">Horizontal</option>
                        <option value="vertical">Vertical</option>
                        <option value="interlock">Interlock</option>
                        <option value="radial">Radial</option>
                        <option value="tl-br">TL-BR</option>
                        <option value="tr-bl">TR-BL</option>
                        <option value="cross">Cross</option>
                      </select>
                    </label>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <RangeField
                      label="Module density"
                      value={style.moduleScale}
                      min={0}
                      max={1}
                      step={0.01}
                      inputMode="percent"
                      formatter={(value) => `${Math.round(value * 100)}%`}
                      onChange={(moduleScale) => setStyle((current) => ({ ...current, moduleScale }))}
                    />
                    <RangeField
                      label="Corner radius"
                      value={style.moduleRadius}
                      min={0}
                      max={0.5}
                      step={0.01}
                      inputMode="percent"
                      formatter={(value) => `${Math.round(value * 100)}%`}
                      onChange={(moduleRadius) => setStyle((current) => ({ ...current, moduleRadius }))}
                    />
                    <RangeField
                      label="Module opacity"
                      value={style.moduleOpacity}
                      min={0.25}
                      max={1}
                      step={0.01}
                      inputMode="percent"
                      formatter={(value) => `${Math.round(value * 100)}%`}
                      onChange={(moduleOpacity) => setStyle((current) => ({ ...current, moduleOpacity }))}
                    />
                    <RangeField
                      label="Main stroke"
                      value={style.contentStrokeWidth ?? 0.7}
                      min={0.2}
                      max={1}
                      step={0.01}
                      inputMode="percent"
                      formatter={(value) => `${Math.round(value * 100)}%`}
                      onChange={(contentStrokeWidth) => setStyle((current) => ({ ...current, contentStrokeWidth }))}
                    />
                    <RangeField
                      label="Cross stroke"
                      value={style.contentXStrokeWidth ?? 0.7}
                      min={0.2}
                      max={1}
                      step={0.01}
                      inputMode="percent"
                      formatter={(value) => `${Math.round(value * 100)}%`}
                      onChange={(contentXStrokeWidth) => setStyle((current) => ({ ...current, contentXStrokeWidth }))}
                    />
                    <RangeField
                      label="Position stroke"
                      value={style.positioningStrokeWidth ?? 0.9}
                      min={0.2}
                      max={1}
                      step={0.01}
                      inputMode="percent"
                      formatter={(value) => `${Math.round(value * 100)}%`}
                      onChange={(positioningStrokeWidth) => setStyle((current) => ({ ...current, positioningStrokeWidth }))}
                    />
                  </div>
                </div>

                <Button variant="outline" className="mt-4 w-full rounded-md border-[#17201d]" onClick={randomizeStyle}>
                  <Wand2 />
                  Randomize parametric style
                </Button>
              </article>

              <article id="image-to-qr" className="rounded-md border border-[#d8c9af] bg-white/60 p-4">
                <PanelHeader
                  icon={<ImagePlus className="h-6 w-6" />}
                  step="03"
                  title="Image To QR Code"
                  description="Encode a hosted image URL now; add R2 or S3 uploads when the product needs public sharing."
                />

                <div className="mt-4 flex flex-col gap-3 lg:flex-row">
                  <div className="flex min-h-10 flex-1 items-center gap-2 rounded-md border-2 border-[#17201d] bg-white px-3">
                    <Link2 className="h-4 w-4 text-[#b84a2b]" />
                    <input
                      value={imageUrl}
                      onChange={(event) => setImageUrl(event.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="h-10 w-full bg-transparent outline-none"
                    />
                  </div>
                  <Button onClick={useImageUrl} className="rounded-md bg-[#17201d]">
                    <QrCode />
                    Generate
                  </Button>
                  <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm">
                    <Upload className="h-4 w-4" />
                    Local image
                    <input type="file" accept="image/*" onChange={onImageUpload} hidden />
                  </label>
                </div>
                <p className="mt-3 text-sm text-[#62736d]">
                  {localImageName
                    ? `${localImageName} was encoded as a local data URL. Good for testing, not for public sharing.`
                    : 'Public image QR codes should encode a hosted URL, not a private local file path.'}
                </p>
              </article>
            </div>
          )}

          {activeTab === 'batch' && (
            <article id="batch" className={`${tabPanelShell} bg-[#17201d] text-[#fffaf0] shadow-[5px_5px_0_#b84a2b]`}>
              <PanelHeader
                icon={<FileArchive className="h-6 w-6" />}
                step="04"
                title="Batch QR Code Image Export"
                description="Paste one URL or text item per line and export SVG files as a ZIP."
                dark
              />
              <textarea
                value={batchInput}
                onChange={(event) => setBatchInput(event.target.value)}
                rows={4}
                className="mt-4 min-h-28 w-full resize-y rounded-md border-2 border-[#f8d36b] bg-[#fffaf0] px-3 py-2 text-[#17201d] outline-none"
              />
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-md border border-[#425049] bg-[#22302b] p-3">
                  <span className="block text-xs font-black uppercase text-[#d8c9af]">Items</span>
                  <strong className="text-2xl">{batchItems.length}</strong>
                </div>
                <div className="rounded-md border border-[#425049] bg-[#22302b] p-3">
                  <span className="block text-xs font-black uppercase text-[#d8c9af]">Format</span>
                  <strong className="text-2xl">SVG</strong>
                </div>
                <div className="rounded-md border border-[#425049] bg-[#22302b] p-3">
                  <span className="block text-xs font-black uppercase text-[#d8c9af]">Package</span>
                  <strong className="text-2xl">ZIP</strong>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button onClick={downloadBatchZip} className="rounded-md bg-[#f8d36b] text-[#17201d] hover:bg-[#ffd960]">
                  <Download />
                  Download ZIP
                </Button>
                {batchStatus && <span className="text-sm text-[#d8c9af]">{batchStatus}</span>}
              </div>
            </article>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-md border-2 border-[#17201d] bg-[#fffaf0] p-4 shadow-[7px_7px_0_#17201d]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black tracking-normal">Preview & Download</h2>
                <p className="text-sm text-[#62736d]">Updates as you edit.</p>
              </div>
              {isGenerating && <Loader2 className="h-5 w-5 animate-spin text-[#b84a2b]" />}
            </div>

            <div className="relative grid aspect-square place-items-center overflow-hidden rounded-md border-2 border-[#17201d] bg-[linear-gradient(45deg,rgba(23,32,29,0.08)_25%,transparent_25%),linear-gradient(-45deg,rgba(23,32,29,0.08)_25%,transparent_25%),#fffdf7] bg-[length:18px_18px]">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Generated QR code image preview" className="h-full w-full object-contain" />
              ) : (
                <QrCode className="h-16 w-16 text-[#7b6d5a]" />
              )}
            </div>

            {showReadabilityTools && (
              <div className={`mt-4 rounded-md border-2 p-3 ${readability.toneClass}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase">Readability</p>
                    <h3 className="mt-1 text-lg font-black tracking-normal">{readability.label}</h3>
                  </div>
                  <span className="rounded-full border-2 border-current bg-white/70 px-3 py-1 text-sm font-black">
                    {isTestingQr ? '...' : `${readability.score}/100`}
                  </span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full border border-current bg-white/70">
                  <div className={`h-full rounded-full transition-all ${readability.barClass}`} style={{ width: `${readability.score}%` }} />
                </div>
                <ul className="mt-3 grid gap-1">
                  {readability.tips.map((tip) => (
                    <li key={tip} className="text-xs font-bold leading-5">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2">
              <Button onClick={() => download('png')} disabled={!svgText} className="rounded-md bg-[#17201d]">
                PNG
              </Button>
              <Button onClick={() => download('jpg')} disabled={!svgText} variant="outline" className="rounded-md">
                JPG
              </Button>
              <Button onClick={() => download('svg')} disabled={!svgText} variant="outline" className="rounded-md">
                SVG
              </Button>
            </div>

            <Button
              onClick={testGeneratedQr}
              disabled={!svgText || isTestingQr}
              variant="outline"
              className="mt-2 w-full rounded-md border-[#17201d]"
            >
              {isTestingQr ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
              {isTestingQr ? qrSelfTestCopy.testing : qrSelfTestCopy.button}
            </Button>

            <div className="mt-4 rounded-md border border-[#d8c9af] bg-white/70 p-3">
              <p className="text-xs font-black uppercase text-[#62736d]">Current QR payload</p>
              <code className="mt-2 block max-h-24 overflow-auto whitespace-pre-wrap break-words rounded-md bg-[#17201d] p-3 text-xs text-[#fffaf0]">
                {data || 'No content yet'}
              </code>
            </div>

            {showReadabilityTools && (
              <div className="mt-4 rounded-md border border-[#d8c9af] bg-white/70 p-3">
                <p className="text-xs font-black uppercase text-[#62736d]">Readability checks</p>
                <ul className="mt-2 grid gap-2">
                  {readability.checks.map((item) => (
                    <li key={item.label} className="flex items-start gap-2 text-sm font-bold">
                      <span
                        className={`mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full ${item.passed ? 'bg-[#17201d] text-[#fffaf0]' : 'bg-[#eadcc4] text-[#62736d]'
                          }`}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                      <span>
                        <span className="block">{item.label}</span>
                        <span className="block text-xs font-medium leading-5 text-[#62736d]">{item.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </section>

      {qrSelfTestResult && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#17201d]/50 px-4">
          <div className="w-full max-w-md rounded-md border-2 border-[#17201d] bg-[#fffaf0] p-5 shadow-[7px_7px_0_#17201d]">
            <div className="flex items-start gap-3">
              <span
                className={`grid h-10 w-10 flex-none place-items-center rounded-md border-2 border-[#17201d] ${qrSelfTestResult.status === 'success'
                    ? 'bg-[#dff3df] text-[#17201d]'
                    : 'bg-[#ffe0d1] text-[#8a2d1c]'
                  }`}
              >
                {qrSelfTestResult.status === 'success' ? <Check className="h-5 w-5" /> : <ScanLine className="h-5 w-5" />}
              </span>
              <div className="min-w-0">
                <h2 className="text-xl font-black tracking-normal">{qrSelfTestResult.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#50625b]">{qrSelfTestResult.message}</p>
              </div>
            </div>

            {qrSelfTestResult.decoded && (
              <code className="mt-4 block max-h-28 overflow-auto whitespace-pre-wrap break-words rounded-md bg-[#17201d] p-3 text-xs text-[#fffaf0]">
                {qrSelfTestResult.decoded}
              </code>
            )}

            <div className="mt-4 flex justify-end">
              <Button onClick={() => setQrSelfTestResult(null)} className="rounded-md bg-[#17201d]">
                {qrSelfTestCopy.close}
              </Button>
            </div>
          </div>
        </div>
      )}

      <section id="qr-code-types" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
        <div className="border-y-2 border-[#17201d] py-10">
          <div className="max-w-6xl">
            <p className="mb-3 text-xs font-black uppercase text-[#b84a2b]">QR Code Types</p>
            <h2 className="font-serif text-4xl font-black leading-tight tracking-normal sm:text-5xl">
              Choose the right QR code image type.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#50625b]">
              Different QR code types create different scan actions. Pick a type below, then generate and download the QR code image from the workspace.
            </p>
          </div>

          <div className="mt-8 grid gap-3">
            {qrTypeCards.map((type) => (
              <article
                key={type.id}
                className="grid gap-4 rounded-md border-2 border-[#17201d] bg-[#fffaf0] p-4 shadow-[4px_4px_0_#17201d] sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-5"
              >
                <div className="grid h-11 w-11 place-items-center rounded-md border-2 border-[#17201d] bg-white text-[#b84a2b]">
                  <QrCode className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-black tracking-normal">{type.label}</h3>
                    <span className="rounded-full border border-[#d8c9af] bg-white px-3 py-1 text-xs font-black text-[#50625b]">
                      {type.bestFor}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#62736d]">{type.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => openQrType(type.id)}
                  className="h-10 rounded-md bg-[#17201d] px-4 text-xs font-black text-[#fffaf0] sm:w-32"
                >
                  Use this type
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
        <p className="mb-3 text-xs font-black uppercase text-[#b84a2b]">Features</p>
        <h2 className="max-w-6xl font-serif text-4xl font-black leading-tight tracking-normal sm:text-5xl">
          Built around what people mean by &quot;qr code image&quot;.
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {qrFeatures.map((feature) => (
            <article key={feature.title} className="rounded-md border-2 border-[#17201d] bg-[#fffaf0] p-5 shadow-[4px_4px_0_#17201d]">
              <h3 className="text-lg font-black tracking-normal">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#62736d]">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="max-w-6xl">
          <p className="mb-3 text-xs font-black uppercase text-[#b84a2b]">Use Cases</p>
          <h2 className="font-serif text-4xl font-black leading-tight tracking-normal sm:text-5xl">One page for common QR image jobs.</h2>
        </div>
        <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {qrUseCases.map((item) => (
            <li key={item} className="flex items-start gap-3 rounded-md border border-[#d8c9af] bg-[#fffaf0] p-4 font-bold">
              <Check className="mt-1 h-4 w-4 flex-none text-[#b84a2b]" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section id="faq" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 pb-20 sm:px-6 lg:px-8">
        <p className="mb-3 text-xs font-black uppercase text-[#b84a2b]">FAQs</p>
        <h2 className="max-w-6xl font-serif text-4xl font-black leading-tight tracking-normal sm:text-5xl">
          QR code image questions this page should answer.
        </h2>
        <div className="mt-8 grid gap-3">
          {qrFaqs.map((faq, index) => {
            const isOpen = openFaqIndex === index

            return (
              <article key={faq.question} className="overflow-hidden rounded-md border-2 border-[#17201d] bg-[#fffaf0]">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${index}`}
                >
                  <h3 className="text-lg font-black tracking-normal">{faq.question}</h3>
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-md border-2 border-[#17201d] bg-white text-[#17201d]">
                    <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </span>
                </button>

                <div
                  id={`faq-panel-${index}`}
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <p className="border-t border-[#d8c9af] px-5 pb-5 pt-4 leading-7 text-[#62736d]">{faq.answer}</p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function PanelHeader({
  icon,
  step,
  title,
  description,
  dark = false
}: {
  icon: ReactNode
  step: string
  title: string
  description: string
  dark?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`${dark ? 'text-[#f8d36b]' : 'text-[#b84a2b]'}`}>{icon}</div>
      <div className="min-w-0">
        <span className={`text-xs font-black uppercase ${dark ? 'text-[#d8c9af]' : 'text-[#62736d]'}`}>{step}</span>
        <h2 className="text-xl font-black tracking-normal">{title}</h2>
        <p className={`text-sm leading-6 ${dark ? 'text-[#d8c9af]' : 'text-[#62736d]'}`}>{description}</p>
      </div>
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1 text-xs font-black uppercase text-[#62736d]">
      {label}
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border-2 border-[#17201d] bg-white p-1"
      />
    </label>
  )
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  inputMode,
  inputStep = 1,
  formatter,
  onChange
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  inputMode?: 'percent'
  inputStep?: number
  formatter: (value: number) => string
  onChange: (value: number) => void
}) {
  const displayValue = inputMode === 'percent' ? Math.round(value * 100) : Number(value.toFixed(2))
  const inputMin = inputMode === 'percent' ? Math.round(min * 100) : min
  const inputMax = inputMode === 'percent' ? Math.round(max * 100) : max

  function updateFromInput(rawValue: string) {
    if (rawValue.trim() === '') return

    const numericValue = Number(rawValue)
    if (!Number.isFinite(numericValue)) return

    const nextValue = inputMode === 'percent' ? numericValue / 100 : numericValue
    onChange(Math.min(max, Math.max(min, nextValue)))
  }

  return (
    <label className="grid gap-2 text-xs font-black uppercase text-[#62736d]">
      <span className="flex items-center justify-between gap-3">
        {label}
        <span className="flex items-center gap-1 rounded-full border border-[#d8c9af] bg-white px-2 py-1 text-[#17201d]">
          <input
            type="number"
            min={inputMin}
            max={inputMax}
            step={inputStep}
            value={displayValue}
            onChange={(event) => updateFromInput(event.target.value)}
            className="h-6 w-14 bg-transparent text-right text-xs font-black outline-none"
            aria-label={`${label} value`}
          />
          {inputMode === 'percent' && <span>%</span>}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer accent-[#17201d]"
      />
    </label>
  )
}

function positioningToFinderShape(positioningPointType: QrPositioningPointType): QrFinderShape {
  if (positioningPointType === 'dsj') return 'bracket'
  if (positioningPointType === 'rounded') return 'rounded'
  return positioningPointType
}

function finderShapeToPositioning(finderShape: QrFinderShape): QrPositioningPointType {
  if (finderShape === 'bracket') return 'rounded'
  return finderShape
}

function syncStyleForModuleShape(current: StyledQrStyle, moduleShape: QrModuleShape): StyledQrStyle {
  if (moduleShape === 'dot') {
    return {
      ...current,
      moduleShape,
      moduleRenderMode: 'core',
      contentPointType: 'circle'
    }
  }

  if (moduleShape === 'line') {
    return {
      ...current,
      moduleShape,
      moduleRenderMode: 'core',
      contentPointType: 'square',
      contentLineType: current.contentLineType === 'cross' ? 'interlock' : current.contentLineType ?? 'interlock'
    }
  }

  if (moduleShape === 'cross') {
    return {
      ...current,
      moduleShape,
      moduleRenderMode: 'core',
      contentPointType: 'square',
      contentLineType: 'cross'
    }
  }

  if (moduleShape === 'rounded') {
    return {
      ...current,
      moduleShape,
      moduleRenderMode: 'core',
      contentPointType: 'square',
      moduleRadius: current.moduleRadius <= 0.01 ? 0.32 : current.moduleRadius
    }
  }

  return {
    ...current,
    moduleShape,
    moduleRenderMode: 'core',
    contentPointType: 'square',
    moduleRadius: 0
  }
}

function lineTypeToModuleShape(contentLineType: QrContentLineType): QrModuleShape {
  return contentLineType === 'cross' ? 'cross' : 'line'
}

function ResultBox({
  isScanning,
  scanResult,
  scanError,
  onMakeQr
}: {
  isScanning: boolean
  scanResult: string
  scanError: string
  onMakeQr: () => void
}) {
  return (
    <div className="mt-4 min-h-28 rounded-md border border-[#d8c9af] bg-white/70 p-4">
      {isScanning && (
        <p className="inline-flex items-center gap-2 text-sm text-[#62736d]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Reading QR modules
        </p>
      )}
      {!isScanning && scanResult && (
        <div className="space-y-3">
          <span className="text-xs font-black uppercase text-[#62736d]">Decoded content</span>
          <code className="block max-h-28 overflow-auto rounded-md bg-[#17201d] p-3 text-sm text-[#fffaf0]">
            {scanResult}
          </code>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(scanResult)}>
              <Clipboard />
              Copy
            </Button>
            <Button onClick={onMakeQr} className="bg-[#17201d]">
              <QrCode />
              Make QR
            </Button>
          </div>
        </div>
      )}
      {!isScanning && !scanResult && !scanError && (
        <p className="text-sm text-[#62736d]">Decoded QR text will appear here.</p>
      )}
      {scanError && <p className="text-sm font-bold text-red-700">{scanError}</p>}
    </div>
  )
}

function renderSvgToCanvas(svgText: string, width: number, background: string) {
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const image = new Image()
    const objectUrl = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' }))

    image.onload = () => {
      canvas.width = width
      canvas.height = width
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Canvas is not available.'))
        return
      }

      ctx.fillStyle = background
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)
      resolve(canvas)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('QR image could not be rendered.'))
    }

    image.src = objectUrl
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }

      reject(new Error('QR image could not be prepared.'))
    }, type, quality)
  })
}

async function runRealReadabilityScan(svgText: string, expectedPayload: string, style: StyledQrStyle): Promise<ReadabilityScore> {
  const originalWidth = Math.max(256, Math.min(1400, Math.round(style.width || 900)))
  const scenarios = [
    { label: 'Original PNG', width: originalWidth, type: 'image/png', weight: 35 },
    { label: '512px PNG', width: 512, type: 'image/png', weight: 30 },
    { label: '320px PNG', width: 320, type: 'image/png', weight: 20 },
    { label: 'JPG compression', width: 512, type: 'image/jpeg', weight: 15, quality: 0.86 }
  ]
  const { Html5Qrcode } = await import('html5-qrcode')
  const readerId = `qr-readability-reader-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const reader = document.createElement('div')
  reader.id = readerId
  reader.style.position = 'fixed'
  reader.style.left = '-9999px'
  reader.style.top = '-9999px'
  reader.style.width = '1px'
  reader.style.height = '1px'
  reader.setAttribute('aria-hidden', 'true')
  document.body.appendChild(reader)

  const scanner = new Html5Qrcode(readerId)
  const results: Array<{ label: string; passed: boolean; decoded?: string }> = []

  try {
    for (const scenario of scenarios) {
      try {
        const canvas = await renderSvgToCanvas(svgText, scenario.width, style.light)
        const blob = await canvasToBlob(canvas, scenario.type, scenario.quality)
        const extension = scenario.type === 'image/jpeg' ? 'jpg' : 'png'
        const file = new File([blob], `qr-readability-${scenario.width}.${extension}`, { type: scenario.type })
        const decoded = await scanner.scanFile(file, true)
        results.push({
          label: scenario.label,
          passed: decoded === expectedPayload,
          decoded
        })
      } catch {
        results.push({
          label: scenario.label,
          passed: false
        })
      }
    }
  } finally {
    try {
      scanner.clear()
    } catch {
    }
    reader.remove()
  }

  const score = scenarios.reduce((total, scenario, index) => total + (results[index]?.passed ? scenario.weight : 0), 0)
  return createRealReadabilityScore(score, results, expectedPayload)
}

function createRealReadabilityScore(
  score: number,
  results: Array<{ label: string; passed: boolean; decoded?: string }>,
  expectedPayload: string
): ReadabilityScore {
  const passedCount = results.filter((item) => item.passed).length
  const level = getRealReadabilityLevel(score)
  const failedLabels = results.filter((item) => !item.passed).map((item) => item.label)
  const tips: string[] = []

  if (score >= 90) {
    tips.push('Verified by local scanner across preview, download, and compression scenarios.')
  } else if (score >= 70) {
    tips.push('Scans in most local tests; use Test this QR before publishing.')
  } else if (score >= 40) {
    tips.push(`Detected in ${passedCount}/${results.length} tests; improve contrast, margin, or module density.`)
  } else {
    tips.push('Not detected reliably by the local scanner.')
  }

  if (failedLabels.length > 0) {
    tips.push(`Failed: ${failedLabels.slice(0, 2).join(', ')}${failedLabels.length > 2 ? '...' : ''}`)
  }

  if (expectedPayload.length > 120 && score < 90) {
    tips.push('Long payloads need simpler styling or stronger error correction.')
  }

  return {
    score,
    level,
    label: getReadabilityLabel(level),
    toneClass: getReadabilityToneClass(level),
    barClass: getReadabilityBarClass(level),
    tips: tips.slice(0, 3),
    checks: results.map((item) => ({
      label: item.label,
      passed: item.passed,
      detail: item.passed
        ? 'Decoded payload matches the current QR content.'
        : item.decoded
          ? 'Detected a QR code, but decoded content did not match the current payload.'
          : 'Local scanner could not detect this rendered QR image.'
    }))
  }
}

function getTestingReadabilityScore(fallback: ReadabilityScore): ReadabilityScore {
  return {
    ...fallback,
    score: 0,
    level: 'testing',
    label: 'Testing readability...',
    toneClass: 'border-[#0b2d97] bg-[#e8efff] text-[#0b2d97]',
    barClass: 'bg-[#0b2d97]',
    tips: ['Running local scanner on PNG, preview size, and JPG compression outputs.'],
    checks: [
      {
        label: 'Real scanner',
        passed: false,
        detail: 'Testing rendered QR images in the browser.'
      }
    ]
  }
}

function getScannerUnavailableReadabilityScore(fallback: ReadabilityScore): ReadabilityScore {
  return {
    ...fallback,
    level: 'risky',
    label: 'Scanner unavailable',
    toneClass: getReadabilityToneClass('risky'),
    barClass: getReadabilityBarClass('risky'),
    tips: ['Real readability test could not run in this browser session.', ...fallback.tips].slice(0, 3)
  }
}

function getRealReadabilityLevel(score: number): ReadabilityLevel {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 40) return 'risky'
  return 'experimental'
}

function getReadabilityLabel(level: ReadabilityLevel) {
  const labelByLevel: Record<ReadabilityLevel, string> = {
    excellent: 'Excellent',
    good: 'Good',
    risky: 'Risky',
    experimental: 'Not detected',
    testing: 'Testing readability...'
  }

  return labelByLevel[level]
}

function getReadabilityToneClass(level: ReadabilityLevel) {
  const toneByLevel: Record<ReadabilityLevel, string> = {
    excellent: 'border-[#17201d] bg-[#dff3df] text-[#17201d]',
    good: 'border-[#17201d] bg-[#f8d36b] text-[#17201d]',
    risky: 'border-[#8a2d1c] bg-[#ffe0d1] text-[#8a2d1c]',
    experimental: 'border-[#0b2d97] bg-[#e8efff] text-[#0b2d97]',
    testing: 'border-[#0b2d97] bg-[#e8efff] text-[#0b2d97]'
  }

  return toneByLevel[level]
}

function getReadabilityBarClass(level: ReadabilityLevel) {
  const barByLevel: Record<ReadabilityLevel, string> = {
    excellent: 'bg-[#17201d]',
    good: 'bg-[#b84a2b]',
    risky: 'bg-[#8a2d1c]',
    experimental: 'bg-[#0b2d97]',
    testing: 'bg-[#0b2d97]'
  }

  return barByLevel[level]
}

function getQrSelfTestCopy(locale: string) {
  if (locale === 'zh') {
    return {
      button: '测试此二维码',
      testing: '正在测试',
      scannableTitle: '可扫描',
      scannableMessage: '当前二维码可以被本地扫描器识别。下载前仍建议用手机再测一次。',
      notDetectedTitle: '未识别到二维码',
      tryStrongerContrast: '未能识别当前二维码。请尝试增强对比度、提高模块密度、增加留白，或改用 Classic Black / Rounded Ink。',
      renderFailed: '当前二维码图片无法完成本地测试，请重新生成后再试。',
      close: '关闭'
    }
  }

  if (locale === 'ja') {
    return {
      button: 'このQRをテスト',
      testing: 'テスト中',
      scannableTitle: 'スキャン可能',
      scannableMessage: '現在のQRコードはローカルスキャナーで認識できました。ダウンロード前にスマートフォンでも確認してください。',
      notDetectedTitle: 'QRコードを検出できません',
      tryStrongerContrast: '現在のQRコードを認識できませんでした。コントラスト、モジュール密度、余白を上げるか、Classic Black / Rounded Ink を試してください。',
      renderFailed: '現在のQR画像をローカルテスト用に準備できませんでした。再生成してからもう一度お試しください。',
      close: '閉じる'
    }
  }

  return {
    button: 'Test this QR Image',
    testing: 'Testing',
    scannableTitle: 'Scannable',
    scannableMessage: 'This QR code was detected by the local scanner. Test it with a phone before publishing.',
    notDetectedTitle: 'Not detected',
    tryStrongerContrast: 'No QR code was detected. Try stronger contrast, higher module density, more margin, or switch to Classic Black / Rounded Ink.',
    renderFailed: 'This QR image could not be prepared for local testing. Generate it again and retry.',
    close: 'Close'
  }
}

function getReadabilityScore(style: StyledQrStyle, data: string, contrastRatio: number): ReadabilityScore {
  const accentContrast = getContrastRatio(style.accentColor, style.light)
  const family = style.qrbtfFamily ?? 'custom'
  const isSegmentFamily = family === 'a2' || family === 'sp1'
  const isCustomArtisticShape = family === 'custom' && (style.moduleShape === 'line' || style.moduleShape === 'cross')
  const isArtisticShape = isSegmentFamily || isCustomArtisticShape
  const hasContent = data.trim().length > 0
  const isHighContrast = contrastRatio >= 7
  const isUsableContrast = contrastRatio >= 4.5
  const hasQuietZone = style.margin >= 2
  const hasStrongRecovery = style.errorCorrectionLevel === 'Q' || style.errorCorrectionLevel === 'H'
  const requiredScale = family === 'a1' ? 0.25 : isSegmentFamily ? 0.42 : isCustomArtisticShape ? 0.82 : 0.72
  const hasVariableA1Points = family === 'a1' && style.moduleScale <= 0.01
  const hasReadableWeight = (hasVariableA1Points || style.moduleScale >= requiredScale) && style.moduleOpacity >= 0.75
  const hasSafeShape = !isArtisticShape
  const hasAccentContrast = !isArtisticShape || accentContrast >= 4.5

  let score = 100
  const tips: string[] = []

  if (!hasContent) {
    score -= 35
    tips.push('Add QR content before testing readability.')
  }

  if (!isUsableContrast) {
    score -= 28
    tips.push('Use stronger dark/light contrast.')
  } else if (!isHighContrast) {
    score -= 8
    tips.push('Higher contrast improves scan reliability.')
  }

  if (!hasQuietZone) {
    score -= 16
    tips.push('Increase quiet zone margin to at least 2.')
  }

  if (!hasStrongRecovery) {
    score -= 12
    tips.push('Use Q or H error correction for styled QR codes.')
  }

  if (!hasReadableWeight) {
    score -= isArtisticShape ? 20 : 12
    tips.push(isArtisticShape ? 'Increase segment density for line/cross styles.' : 'Increase module density or opacity.')
  }

  if (isArtisticShape) {
    score -= 22
    tips.push(isSegmentFamily ? 'Segment renderer and fallback modules are enabled; test before publishing.' : 'Segment renderer is enabled; still test artistic QR before publishing.')
  }

  if (!hasAccentContrast) {
    score -= 8
    tips.push('Low-contrast accent may fade in artistic overlays.')
  }

  score = Math.min(100, Math.max(0, Math.round(score)))

  let level: ReadabilityLevel = 'excellent'
  if (isArtisticShape) {
    level = 'experimental'
  } else if (score >= 86) {
    level = 'excellent'
  } else if (score >= 70) {
    level = 'good'
  } else {
    level = 'risky'
  }

  if (tips.length === 0) {
    tips.push('This style has strong scan-friendly settings.')
  }

  return {
    score,
    level,
    label: level === 'experimental' ? 'Experimental' : getReadabilityLabel(level),
    toneClass: getReadabilityToneClass(level),
    barClass: getReadabilityBarClass(level),
    tips: tips.slice(0, 3),
    checks: [
      {
        label: 'Content added',
        passed: hasContent,
        detail: hasContent ? 'Payload is ready for preview and download.' : 'Enter a URL, text, or QR type payload.'
      },
      {
        label: 'Contrast',
        passed: isUsableContrast,
        detail: `${contrastRatio.toFixed(1)}:1 dark/light contrast. Aim for 4.5:1 or higher.`
      },
      {
        label: 'Quiet zone',
        passed: hasQuietZone,
        detail: `Margin is ${style.margin}. Styled QR codes should use 2 or more.`
      },
      {
        label: 'Error correction',
        passed: hasStrongRecovery,
        detail: `${style.errorCorrectionLevel} recovery selected. Q or H is best for styled QR.`
      },
      {
        label: 'Visual weight',
        passed: hasReadableWeight,
        detail: hasVariableA1Points
          ? `Variable A1 point scale, opacity ${Math.round(style.moduleOpacity * 100)}%.`
          : `Module density ${Math.round(style.moduleScale * 100)}%, opacity ${Math.round(style.moduleOpacity * 100)}%.`
      },
      {
        label: 'Shape risk',
        passed: hasSafeShape,
        detail: hasSafeShape ? 'This module shape keeps a stable scan surface.' : 'Line/Cross uses segment merging with fallback modules; verify with Test this QR.'
      },
      {
        label: 'Accent contrast',
        passed: hasAccentContrast,
        detail: `${accentContrast.toFixed(1)}:1 accent/light contrast${isArtisticShape ? '; accent is decorative, not the encoding signal.' : '.'}`
      }
    ]
  }
}

function getContrastRatio(foreground: string, background: string) {
  const foregroundRgb = hexToRgb(foreground)
  const backgroundRgb = hexToRgb(background)

  if (!foregroundRgb || !backgroundRgb) return 0

  const foregroundLuminance = getRelativeLuminance(foregroundRgb)
  const backgroundLuminance = getRelativeLuminance(backgroundRgb)
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

function hexToRgb(hex: string) {
  const value = hex.replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return null

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16)
  }
}

function getRelativeLuminance(rgb: { r: number; g: number; b: number }) {
  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const normalized = channel / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4)
  })

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

function buildWifiPayload(
  ssid: string,
  password: string,
  encryption: 'WPA' | 'WEP' | 'nopass',
  hidden: boolean
) {
  const parts = [`T:${encryption}`, `S:${escapeWifiValue(ssid)}`]

  if (encryption !== 'nopass') {
    parts.push(`P:${escapeWifiValue(password)}`)
  }

  if (hidden) {
    parts.push('H:true')
  }

  return `WIFI:${parts.join(';')};;`
}

function escapeWifiValue(value: string) {
  return value.replace(/([\\;,":])/g, '\\$1')
}

function buildXPayload({
  mode,
  username,
  postId,
  postUrl,
  shareText,
  shareUrl
}: {
  mode: XMode
  username: string
  postId: string
  postUrl: string
  shareText: string
  shareUrl: string
}) {
  const normalizedUsername = normalizeXUsername(username)

  if (mode === 'profile') {
    return normalizedUsername ? `https://x.com/${normalizedUsername}` : 'https://x.com'
  }

  if (mode === 'post') {
    const parsedPost = parseXPostUrl(postUrl)
    const normalizedPostId = normalizeXPostId(postId)

    if (parsedPost) {
      return `https://x.com/${parsedPost.username}/status/${parsedPost.postId}`
    }

    if (normalizedUsername && normalizedPostId) {
      return `https://x.com/${normalizedUsername}/status/${normalizedPostId}`
    }

    return normalizedUsername ? `https://x.com/${normalizedUsername}` : 'https://x.com'
  }

  const params = new URLSearchParams()
  const text = shareText.trim()
  const url = shareUrl.trim()

  if (text) params.set('text', text)
  if (url) params.set('url', url)

  const query = params.toString()
  return query ? `https://x.com/intent/tweet?${query}` : 'https://x.com/intent/tweet'
}

function normalizeXUsername(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    if (isXHost(url.hostname)) {
      return cleanXUsername(url.pathname.split('/').filter(Boolean)[0] ?? '')
    }
  } catch {
  }

  return cleanXUsername(trimmed.replace(/^https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\//i, ''))
}

function cleanXUsername(value: string) {
  return value
    .replace(/^@/, '')
    .split(/[/?#]/)[0]
    .replace(/[^\w]/g, '')
}

function normalizeXPostId(value: string) {
  return value.match(/\d+/)?.[0] ?? ''
}

function parseXPostUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    if (!isXHost(url.hostname)) return null

    const match = url.pathname.match(/^\/([^/]+)\/status(?:es)?\/(\d+)/i)
    if (!match) return null

    const username = cleanXUsername(match[1])
    const postId = normalizeXPostId(match[2])
    return username && postId ? { username, postId } : null
  } catch {
    return null
  }
}

function isXHost(hostname: string) {
  return /(^|\.)x\.com$/i.test(hostname) || /(^|\.)twitter\.com$/i.test(hostname)
}

function createRandomXValue(id: string) {
  const username = `qr_image_${id.slice(0, 5)}`
  const postId = `${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`
  const variants = [
    `https://x.com/${username}`,
    `https://x.com/${username}/status/${postId}`,
    `https://x.com/intent/tweet?text=${encodeURIComponent(`QR test ${id.toUpperCase()}`)}&url=${encodeURIComponent('https://example.com')}`
  ]

  return variants[Math.floor(Math.random() * variants.length)]
}

function createRandomQrValue(type: RandomQrType) {
  const id = Math.random().toString(36).slice(2, 10)
  const phone = `+1555${Math.floor(1000000 + Math.random() * 8999999)}`

  switch (type) {
    case 'url':
      return `https://example.com/qr/${id}`
    case 'text':
      return `QR Code Image test ${id.toUpperCase()}`
    case 'email':
      return `mailto:test-${id}@example.com?subject=QR%20test`
    case 'sms':
      return `SMSTO:${phone}:QR test ${id.toUpperCase()}`
    case 'phone':
      return `tel:${phone}`
    case 'twitter':
      return createRandomXValue(id)
    case 'bitcoin':
      return `bitcoin:bc1q${id}exampleaddress?amount=0.001`
    case 'wifi':
      return buildWifiPayload(`Guest WiFi ${id.slice(0, 3).toUpperCase()}`, `pass-${id}`, 'WPA', false)
    case 'pdf':
      return `https://example.com/files/${id}.pdf`
    case 'image':
      return `https://example.com/images/${id}.jpg`
  }
}
