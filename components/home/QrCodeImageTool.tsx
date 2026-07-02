"use client"

import { Button } from '@/components/ui/button'
import { qrFaqs, qrFeatures, qrUseCases } from '@/lib/qr-content'
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
import QRCode from 'qrcode'
import { ChangeEvent, DragEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'

type DownloadFormat = 'png' | 'jpg' | 'svg'
type ToolTab = 'scan' | 'create' | 'batch'
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

type QrStyle = {
  dark: string
  light: string
  margin: number
  width: number
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
}

const defaultStyle: QrStyle = {
  dark: '#111827',
  light: '#fbfaf4',
  margin: 2,
  width: 900,
  errorCorrectionLevel: 'H'
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
      description: 'Post or profile',
      value: 'https://x.com/intent/tweet?text=Hello%20from%20QR%20Code%20Image'
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
      description: 'Point scanners to an X profile, share link, or prefilled post intent.',
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
  const [activeTab, setActiveTab] = useState<ToolTab>('scan')
  const [activeTemplate, setActiveTemplate] = useState<QrTemplateId>('url')
  const [randomType, setRandomType] = useState<RandomQrType>('url')
  const [data, setData] = useState('https://example.com')
  const [wifiSsid, setWifiSsid] = useState('Studio WiFi')
  const [wifiPassword, setWifiPassword] = useState('strong-password')
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA')
  const [wifiHidden, setWifiHidden] = useState(false)
  const [style, setStyle] = useState<QrStyle>(defaultStyle)
  const [pngUrl, setPngUrl] = useState('')
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
  const batchItems = batchInput
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
  const cameraScannerRef = useRef<Html5QrcodeInstance | null>(null)

  const qrOptions = useMemo(
    () => ({
      errorCorrectionLevel: style.errorCorrectionLevel,
      margin: style.margin,
      width: style.width,
      color: {
        dark: style.dark,
        light: style.light
      }
    }),
    [style]
  )

  const contrastRatio = useMemo(() => getContrastRatio(style.dark, style.light), [style.dark, style.light])
  const readinessChecks = [
    {
      label: 'Content added',
      passed: data.trim().length > 0
    },
    {
      label: 'Strong color contrast',
      passed: contrastRatio >= 4.5
    },
    {
      label: 'Quiet zone margin',
      passed: style.margin >= 2
    },
    {
      label: 'Print-safe recovery',
      passed: style.errorCorrectionLevel === 'Q' || style.errorCorrectionLevel === 'H'
    }
  ]

  useEffect(() => {
    if (activeTemplate === 'wifi') {
      setData(buildWifiPayload(wifiSsid, wifiPassword, wifiEncryption, wifiHidden))
    }
  }, [activeTemplate, wifiEncryption, wifiHidden, wifiPassword, wifiSsid])

  useEffect(() => {
    let active = true

    async function renderQr() {
      if (!data.trim()) {
        setPngUrl('')
        setSvgText('')
        return
      }

      setIsGenerating(true)
      try {
        const [nextPng, nextSvg] = await Promise.all([
          QRCode.toDataURL(data, {
            ...qrOptions,
            type: 'image/png'
          }),
          QRCode.toString(data, {
            ...qrOptions,
            type: 'svg'
          })
        ])

        if (!active) return
        setPngUrl(nextPng)
        setSvgText(nextSvg)
      } finally {
        if (active) setIsGenerating(false)
      }
    }

    renderQr()

    return () => {
      active = false
    }
  }, [data, qrOptions])

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

    setData(template.value)
    if (template.id === 'image') {
      setImageUrl(template.value)
    }
  }

  function generateRandomQr(type: RandomQrType) {
    setRandomType(type)
    setData(createRandomQrValue(type))
  }

  function randomizeStyle() {
    const [dark, light] = palettes[Math.floor(Math.random() * palettes.length)]
    setStyle((current) => ({
      ...current,
      dark,
      light,
      margin: Math.floor(Math.random() * 3) + 1
    }))
  }

  function download(format: DownloadFormat) {
    const name = `qr-code-image.${format}`

    if (format === 'svg') {
      downloadBlob(new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' }), name)
      return
    }

    if (format === 'png') {
      downloadHref(pngUrl, name)
      return
    }

    const canvas = document.createElement('canvas')
    const image = new Image()
    image.onload = () => {
      canvas.width = image.width
      canvas.height = image.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = style.light
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, 0)
      downloadHref(canvas.toDataURL('image/jpeg', 0.92), name)
    }
    image.src = pngUrl
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

    await Promise.all(
      rows.map(async (item, index) => {
        const svg = await QRCode.toString(item, {
          ...qrOptions,
          type: 'svg'
        })
        zip.file(`qr-code-image-${String(index + 1).padStart(2, '0')}.svg`, svg)
      })
    )

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
    'scroll-mt-24 rounded-md border-2 border-[#17201d] p-5 shadow-[5px_5px_0_#17201d]'

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
        <div className="grid content-start gap-4 self-start">
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
              <article id="generator">
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

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <ColorField label="Dark" value={style.dark} onChange={(dark) => setStyle((current) => ({ ...current, dark }))} />
                  <ColorField label="Light" value={style.light} onChange={(light) => setStyle((current) => ({ ...current, light }))} />
                  <label className="grid gap-1 text-xs font-black uppercase text-[#62736d]">
                    Margin
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
                    Error
                    <select
                      value={style.errorCorrectionLevel}
                      onChange={(event) =>
                        setStyle((current) => ({
                          ...current,
                          errorCorrectionLevel: event.target.value as QrStyle['errorCorrectionLevel']
                        }))
                      }
                      className="h-10 rounded-md border-2 border-[#17201d] bg-white px-3"
                    >
                      <option value="L">L</option>
                      <option value="M">M</option>
                      <option value="Q">Q</option>
                      <option value="H">H</option>
                    </select>
                  </label>
                </div>

                <Button variant="outline" className="mt-4 w-full rounded-md border-[#17201d]" onClick={randomizeStyle}>
                  <Wand2 />
                  Randomize readable style
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
              {pngUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pngUrl} alt="Generated QR code image preview" className="h-full w-full object-contain" />
              ) : (
                <QrCode className="h-16 w-16 text-[#7b6d5a]" />
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <Button onClick={() => download('png')} disabled={!pngUrl} className="rounded-md bg-[#17201d]">
                PNG
              </Button>
              <Button onClick={() => download('jpg')} disabled={!pngUrl} variant="outline" className="rounded-md">
                JPG
              </Button>
              <Button onClick={() => download('svg')} disabled={!svgText} variant="outline" className="rounded-md">
                SVG
              </Button>
            </div>

            <div className="mt-4 rounded-md border border-[#d8c9af] bg-white/70 p-3">
              <p className="text-xs font-black uppercase text-[#62736d]">Current QR payload</p>
              <code className="mt-2 block max-h-24 overflow-auto whitespace-pre-wrap break-words rounded-md bg-[#17201d] p-3 text-xs text-[#fffaf0]">
                {data || 'No content yet'}
              </code>
            </div>

            <div className="mt-4 rounded-md border border-[#d8c9af] bg-white/70 p-3">
              <p className="text-xs font-black uppercase text-[#62736d]">Before download</p>
              <ul className="mt-2 grid gap-2">
                {readinessChecks.map((item) => (
                  <li key={item.label} className="flex items-center gap-2 text-sm font-bold">
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full ${item.passed ? 'bg-[#17201d] text-[#fffaf0]' : 'bg-[#eadcc4] text-[#62736d]'
                        }`}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </section>

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
      return `https://x.com/intent/tweet?text=QR%20test%20${id.toUpperCase()}`
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
