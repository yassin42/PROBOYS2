"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BarChart3,
  Box,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock,
  Globe,
  History,
  Home,
  Pencil,
  Phone,
  Plus,
  Printer,
  QrCode,
  Search,
  Tag,
  Trash2,
  User,
  Volume2,
  VolumeX,
  Wrench,
  X,
  AlertTriangle
} from "lucide-react"
import { CameraScanner } from "@/components/camera-scanner"
import { BRANDS, INITIAL_GLOBAL_INVENTORY, MOCK_MODELS, PART_CATEGORIES, type InventoryItem } from "@/lib/inventory-data"
import { formatCurrency, translations, type Language } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const KEY = "proboys-inventory-v7"
const REPAIR_KEY = "proboys-repairs-v2"
const LANG_KEY = "proboys-lang-v1"

type Repair = {
  id: string
  customer: string
  phone: string
  device: string
  issue: string
  status: "Received" | "In Progress" | "Repaired" | "Collected"
  price: number
  promised: string
  notes: string
  createdAt: string
  repairedAt?: string
}

const brandOf = (item: InventoryItem) =>
  BRANDS.find((b) => b.id === item.brandId) ||
  BRANDS.find((b) => b.id === MOCK_MODELS.find((m) => m.id === item.modelId)?.brandId)

function searchTokens(value: string) {
  const source = value.trim().toLowerCase()
  const parts = source.match(/[a-z0-9\-]+/gi) || []
  const ignored = new Set(["http", "https", "www", "com", "org", "net", "qr", "code", "item", "scan", "product", "id", "url"])
  return [...new Set(parts.filter((token) => token.length > 1 && !ignored.has(token)))]
}

const normalizeSearch = (value: string) => searchTokens(value).join(" ")

const hay = (item: InventoryItem) =>
  [item.name, item.id, item.barcode, item.category, brandOf(item)?.name, MOCK_MODELS.find((m) => m.id === item.modelId)?.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

// --- PRINTING FUNCTIONS ---

function printRepairIntakeSticker(repair: Repair, lang: Language) {
  const t = translations[lang]
  const w = window.open("", "_blank", "width=420,height=680")
  if (!w) return
  const qr = `https://quickchart.io/qr?size=220&text=${encodeURIComponent(repair.id)}`
  const formattedPrice = formatCurrency(repair.price, lang)
  w.document.write(`<!DOCTYPE html><html><head><title>${t.intakeTicket} - ${repair.id}</title><style>
    @page { margin: 0; }
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; width: 62mm; margin: 0 auto; padding: 10px; color: #111; box-sizing: border-box; }
    .header { font-weight: 900; font-size: 16px; letter-spacing: 1px; margin-bottom: 2px; }
    .sub { font-size: 10px; text-transform: uppercase; color: #555; margin-bottom: 8px; }
    img.qr { width: 34mm; height: 34mm; margin: 6px auto; display: block; }
    .code { font-family: monospace; font-size: 12px; font-weight: bold; background: #eee; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 8px; }
    .line { border-top: 1px dashed #666; margin: 8px 0; }
    .field { font-size: 12px; margin: 4px 0; text-align: ${lang === "ar" ? "right" : "left"}; }
    .field strong { color: #000; }
    .price-tag { font-size: 15px; font-weight: bold; color: #000; background: #f0f0f0; border: 1px solid #ccc; border-radius: 6px; padding: 4px 8px; margin: 8px 0; text-align: center; }
    .footer { font-size: 9px; color: #666; margin-top: 8px; }
  </style></head><body dir="${lang === "ar" ? "rtl" : "ltr"}">
    <div class="header">PROBOYS REPAIR</div>
    <div class="sub">${t.intakeTicket}</div>
    <img class="qr" src="${qr}" alt="QR">
    <div class="code">${repair.id}</div>
    <div class="line"></div>
    <div class="field"><strong>${t.customerName}:</strong> ${repair.customer}</div>
    ${repair.phone ? `<div class="field"><strong>${t.phoneLabel}:</strong> ${repair.phone}</div>` : ""}
    <div class="field"><strong>${t.deviceModel}:</strong> ${repair.device}</div>
    <div class="field"><strong>${t.issue}:</strong> ${repair.issue}</div>
    <div class="field"><strong>${t.dateLabel}:</strong> ${repair.createdAt || new Date().toLocaleDateString()}</div>
    <div class="price-tag">${t.expectedPrice}: ${formattedPrice}</div>
    <div class="line"></div>
    <div class="footer">${t.warrantyNotice}</div>
  </body></html>`)
  w.document.close()
  w.onload = () => w.print()
}

function printRepairFinalReceipt(repair: Repair, lang: Language) {
  const t = translations[lang]
  const w = window.open("", "_blank", "width=450,height=720")
  if (!w) return
  const qr = `https://quickchart.io/qr?size=220&text=${encodeURIComponent(repair.id)}`
  const formattedPrice = formatCurrency(repair.price, lang)
  w.document.write(`<!DOCTYPE html><html><head><title>${t.finalReceipt} - ${repair.id}</title><style>
    @page { margin: 0; }
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; width: 72mm; margin: 0 auto; padding: 12px; color: #111; box-sizing: border-box; }
    .logo { width: 42px; height: 42px; margin-bottom: 4px; }
    .header { font-weight: 900; font-size: 18px; margin-bottom: 2px; }
    .sub { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #444; margin-bottom: 10px; }
    .line { border-top: 1px dashed #555; margin: 10px 0; }
    .info-box { text-align: ${lang === "ar" ? "right" : "left"}; font-size: 12px; line-height: 1.6; }
    .price-box { font-size: 20px; font-weight: 900; color: #111; padding: 10px; border: 2px solid #111; border-radius: 8px; margin: 12px 0; }
    img.qr { width: 28mm; height: 28mm; margin: 8px auto; display: block; }
    .footer { font-size: 10px; color: #555; margin-top: 10px; line-height: 1.4; }
  </style></head><body dir="${lang === "ar" ? "rtl" : "ltr"}">
    <div class="header">PROBOYS SHOP</div>
    <div class="sub">${t.finalReceipt}</div>
    <div class="line"></div>
    <div class="info-box">
      <div><strong>${t.customerName}:</strong> ${repair.customer}</div>
      ${repair.phone ? `<div><strong>${t.phoneLabel}:</strong> ${repair.phone}</div>` : ""}
      <div><strong>${t.deviceModel}:</strong> ${repair.device}</div>
      <div><strong>${t.issue}:</strong> ${repair.issue}</div>
      ${repair.notes ? `<div><strong>${t.notes}:</strong> ${repair.notes}</div>` : ""}
      <div><strong>${t.dateLabel}:</strong> ${repair.repairedAt || new Date().toLocaleDateString()}</div>
      <div><strong>ID:</strong> <span style="font-family:monospace">${repair.id}</span></div>
    </div>
    <div class="line"></div>
    <div class="price-box">${formattedPrice}</div>
    <img class="qr" src="${qr}" alt="QR">
    <div class="footer">
      <p><strong>${t.thankYou}</strong></p>
      <p>${t.warrantyNotice}</p>
    </div>
  </body></html>`)
  w.document.close()
  w.onload = () => w.print()
}

function printInventoryItem(item: InventoryItem, kind: "sticker" | "receipt", lang: Language) {
  const t = translations[lang]
  const w = window.open("", "_blank", "width=420,height=680")
  if (!w) return
  const qr = `https://quickchart.io/qr?size=220&text=${encodeURIComponent(item.barcode || item.id)}`
  const formattedPrice = formatCurrency(item.retailPrice, lang)
  w.document.write(`<!DOCTYPE html><html><head><title>${item.name}</title><style>
    @page { margin: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; text-align: center; width: ${kind === "sticker" ? "58mm" : "76mm"}; margin: 0 auto; padding: 10px; color: #111; }
    .header { font-weight: 900; font-size: 16px; margin-bottom: 4px; }
    img.qr { width: ${kind === "sticker" ? "32mm" : "40mm"}; height: ${kind === "sticker" ? "32mm" : "40mm"}; margin: 6px auto; display: block; }
    .name { font-weight: bold; font-size: 14px; margin: 6px 0; }
    .price { font-size: 16px; font-weight: 900; margin: 6px 0; }
    .code { font-family: monospace; font-size: 11px; color: #555; }
    .line { border-top: 1px dashed #777; margin: 10px 0; }
  </style></head><body dir="${lang === "ar" ? "rtl" : "ltr"}">
    <div class="header">PROBOYS</div>
    ${
      kind === "sticker"
        ? `<img class="qr" src="${qr}"><div class="name">${item.name}</div><div class="price">${formattedPrice}</div><div class="code">${item.barcode || item.id}</div>`
        : `<b>${t.receipt}</b><div class="line"></div><div class="name">${item.name}</div><div class="price">${formattedPrice}</div><div class="line"></div><p style="font-size:11px">${t.thankYou}</p>`
    }
  </body></html>`)
  w.document.close()
  w.onload = () => w.print()
}

export function ProBoysApp({ scanMode = false }: { scanMode?: boolean }) {
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_GLOBAL_INVENTORY)
  const [query, setQuery] = useState("")
  const [backdrop, setBackdrop] = useState(0)
  const [category, setCategory] = useState("All")
  const [brand, setBrand] = useState("All")
  const [tab, setTab] = useState<"inventory" | "repairs" | "stats">("inventory")
  const [sound, setSound] = useState(true)
  const [lang, setLang] = useState<Language>("ar")
  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [repair, setRepair] = useState<Partial<Repair>>({ status: "Received" })
  const [brandNames, setBrandNames] = useState<Record<string, string>>({})
  const [cameraOpen, setCameraOpen] = useState(false)
  const [repairTab, setRepairTab] = useState<"active" | "history">("active")
  const [repairSearch, setRepairSearch] = useState("")
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const t = translations[lang]

  useEffect(() => {
    setBackdrop(Math.floor(Math.random() * 4))
    const saved = localStorage.getItem(KEY)
    if (saved) {
      try {
        const parsed: InventoryItem[] = JSON.parse(saved)
        const resetDone = localStorage.getItem("proboys-stock-zero-reset-v1")
        if (!resetDone) {
          const updated = parsed.map((item) => ({ ...item, stock: 0 }))
          setItems(updated)
          localStorage.setItem(KEY, JSON.stringify(updated))
          localStorage.setItem("proboys-stock-zero-reset-v1", "true")
        } else {
          setItems(parsed)
        }
      } catch {
        setItems(INITIAL_GLOBAL_INVENTORY)
        localStorage.setItem(KEY, JSON.stringify(INITIAL_GLOBAL_INVENTORY))
        localStorage.setItem("proboys-stock-zero-reset-v1", "true")
      }
    } else {
      setItems(INITIAL_GLOBAL_INVENTORY)
      localStorage.setItem(KEY, JSON.stringify(INITIAL_GLOBAL_INVENTORY))
      localStorage.setItem("proboys-stock-zero-reset-v1", "true")
    }
    const r = localStorage.getItem(REPAIR_KEY)
    if (r) setRepairs(JSON.parse(r))
    const names = localStorage.getItem("proboys-brand-names")
    if (names) setBrandNames(JSON.parse(names))
    const l = localStorage.getItem(LANG_KEY) as Language
    if (l === "en" || l === "ar") setLang(l)
  }, [])

  const toggleLanguage = () => {
    const nextLang: Language = lang === "ar" ? "en" : "ar"
    setLang(nextLang)
    localStorage.setItem(LANG_KEY, nextLang)
  }

  const clickSound = () => {
    if (!sound) return
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(520, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(760, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.14)
    void ctx.resume()
  }

  const save = (next: InventoryItem[]) => {
    setItems(next)
    clickSound()
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  const renameBrand = (id: string) => {
    const next = window.prompt("Brand name", brandNames[id] || BRANDS.find((b) => b.id === id)?.name || "")?.trim()
    if (next) {
      const names = { ...brandNames, [id]: next }
      setBrandNames(names)
      localStorage.setItem("proboys-brand-names", JSON.stringify(names))
    }
  }

  const saveRepairs = (next: Repair[]) => {
    setRepairs(next)
    localStorage.setItem(REPAIR_KEY, JSON.stringify(next))
  }

  const confirmDeleteItem = () => {
    if (!deletingItem) return
    const next = items.filter((i) => i.id !== deletingItem.id)
    save(next)
    setDeletingItem(null)
  }

  const handleScanDetect = (value: string) => {
    setCameraOpen(false)
    const normalized = normalizeSearch(value)
    
    // Check if the scanned value corresponds to an existing repair ID or customer phone
    const matchedRepair = repairs.find((r) => r.id.toLowerCase() === value.trim().toLowerCase() || r.phone === value.trim())
    if (matchedRepair) {
      setTab("repairs")
      setRepairSearch(matchedRepair.id)
      if (matchedRepair.status === "Repaired" || matchedRepair.status === "Collected") {
        setRepairTab("history")
      } else {
        setRepairTab("active")
      }
      return
    }

    setQuery(normalized)
    setTab("inventory")
  }

  const showInventory = tab === "inventory" && query.trim() === " "

  const filtered = useMemo(() => {
    const terms = searchTokens(query)
    return items.filter(
      (i) =>
        (category === "All" || i.category.toLowerCase() === category.toLowerCase()) &&
        (brand === "All" || brandOf(i)?.id === brand) &&
        (terms.length === 0 || terms.some((t) => hay(i).includes(t)))
    )
  }, [items, query, category, brand])

  const categoryOptions = [
    { key: "All", label: t.catAll },
    { key: "Screens", label: t.catScreens },
    { key: "Batteries", label: t.catBatteries },
    { key: "Charging ports", label: t.catChargingPorts },
    { key: "Back glass", label: t.catBackGlass },
    { key: "Camera glass", label: t.catCameraGlass },
    { key: "Cameras", label: t.catCameras },
    { key: "Accessories", label: t.catAccessories },
    { key: "Hardware", label: t.catHardware },
    { key: "Tools", label: t.catTools },
    { key: "Other", label: t.catOther },
  ]

  const empty: Record<string, any> = {
    name: "",
    barcode: "",
    id: "",
    category: PART_CATEGORIES[0],
    brandId: BRANDS[0]?.id,
    modelId: MOCK_MODELS[0]?.id,
    stock: "",
    retailPrice: "",
    wholesaleCost: "",
  }

  const [draft, setDraft] = useState<Record<string, any>>(empty)

  const beginNew = () => {
    setDraft({
      ...empty,
      category: category !== "All" ? (category as InventoryItem["category"]) : PART_CATEGORIES[0],
      brandId: brand !== "All" ? brand : BRANDS[0]?.id,
      modelId: MOCK_MODELS.find((m) => m.brandId === (brand !== "All" ? brand : BRANDS[0]?.id))?.id || MOCK_MODELS[0]?.id,
      stock: "",
      retailPrice: "",
      wholesaleCost: "",
    })
    setShowNew(true)
  }

  const beginEdit = (i: InventoryItem) => {
    setDraft({
      ...i,
      stock: i.stock === 0 ? "0" : i.stock,
      retailPrice: i.retailPrice === 0 ? "" : i.retailPrice,
      wholesaleCost: i.wholesaleCost === 0 ? "" : i.wholesaleCost,
    })
    setEditing(i)
  }

  const commit = () => {
    const nameTrimmed = draft.name?.trim()
    if (!nameTrimmed) {
      setToast({
        message: lang === "ar" ? "يرجى إدخال اسم القطعة" : "Please enter item name",
        type: "error",
      })
      return
    }

    const parseNum = (val: any): number => {
      if (val === "" || val === undefined || val === null) return 0
      const parsed = Number(val)
      return isNaN(parsed) ? 0 : Math.max(0, parsed)
    }

    const id = draft.id || `PB-${Date.now()}`
    const next: InventoryItem = {
      id,
      barcode: draft.barcode?.trim() || id,
      name: nameTrimmed,
      category: draft.category || PART_CATEGORIES[0],
      brandId: draft.brandId || BRANDS[0]?.id,
      modelId: draft.modelId || MOCK_MODELS[0]?.id,
      stock: parseNum(draft.stock),
      retailPrice: parseNum(draft.retailPrice),
      wholesaleCost: parseNum(draft.wholesaleCost),
    }

    const updated = editing
      ? items.map((i) => (i.id === editing.id ? next : i))
      : [next, ...items]

    // Persist immediately to state & localStorage
    save(updated)

    // Trigger toast notification
    const msg = editing
      ? (lang === "ar" ? `تم تحديث "${next.name}" بنجاح` : `Updated "${next.name}" successfully`)
      : (lang === "ar" ? `تمت إضافة "${next.name}" بنجاح` : `Added "${next.name}" successfully`)
    setToast({ message: msg, type: "success" })

    // Auto close modal dialog
    setEditing(null)
    setShowNew(false)
    setDraft(empty)

    // Switch to inventory view if not already there
    if (tab !== "inventory") {
      setTab("inventory")
    }
  }

  const models = MOCK_MODELS.filter((m) => m.brandId === draft.brandId)
  const photoBackgrounds = ["/background-1.png", "/background-2.jpg", "/background-3.jpg"]

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="relative min-h-screen overflow-hidden bg-[#090909] text-white">
      {/* Background graphic */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-screen transition-opacity"
          style={{ backgroundImage: `url(${photoBackgrounds[backdrop % photoBackgrounds.length]})` }}
        />
        <div className="absolute inset-0 bg-[#090909]/75" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(209,52,36,.2),transparent_35%),radial-gradient(circle_at_85%_90%,rgba(209,52,36,.12),transparent_35%)]" />
      </div>

      {/* Header Bar */}
      <header className="relative sticky top-0 z-30 border-b border-white/10 bg-[#090909]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img src="/icon.svg" alt="ProBoys" className="size-8 sm:size-9 shrink-0" />
            <button
              className="hidden sm:flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-white/10"
              onClick={() => {
                setTab("inventory")
                setCategory("All")
                setBrand("All")
                setQuery("")
              }}
              aria-label={t.home}
            >
              <Home className="size-4" />
              <span className="sr-only">{t.home}</span>
            </button>
            
            <div className="min-w-0">
              <b className="text-sm sm:text-base font-bold tracking-wide truncate block">{t.appName}</b>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[.18em] text-white/45 truncate">{t.tagline}</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant={tab === "inventory" ? "default" : "ghost"} onClick={() => { clickSound(); setTab("inventory"); setQuery(" "); }}>
              <Box className="size-4" />
              <span>{t.inventory}</span>
            </Button>
            
            <Button variant={tab === "repairs" ? "default" : "ghost"} onClick={() => { clickSound(); setTab("repairs"); }}>
              <ClipboardList className="size-4" />
              <span>{t.repairs}</span>
              {repairs.filter((r) => r.status !== "Repaired" && r.status !== "Collected").length > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {repairs.filter((r) => r.status !== "Repaired" && r.status !== "Collected").length}
                </span>
              )}
            </Button>
            
            <Button variant={tab === "stats" ? "default" : "ghost"} onClick={() => setTab("stats")}>
              <BarChart3 className="size-4" />
              <span>{t.statistics}</span>
            </Button>

            <Button onClick={beginNew} className="bg-red-600 hover:bg-red-500 text-white font-medium">
              <Plus className="size-4" />
              <span>{t.newItem}</span>
            </Button>

            {/* Language Switcher Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="border-white/20 bg-white/5 font-semibold hover:bg-white/15"
              title="Switch language"
            >
              <Globe className="size-4 text-red-400" />
              <span>{lang === "ar" ? "English (EN)" : "العربية (AR)"}</span>
            </Button>

            {/* Sound Toggle */}
            <Button size="icon" variant="ghost" aria-label={t.toggleSound} onClick={() => setSound(!sound)}>
              {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </Button>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="border-white/20 bg-white/5 text-xs font-semibold px-2.5 h-9 min-h-[36px]"
              title="Switch language"
            >
              <Globe className="size-3.5 text-red-400" />
              <span>{lang === "ar" ? "EN" : "AR"}</span>
            </Button>

            <Button
              size="sm"
              onClick={beginNew}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs px-2.5 h-9 min-h-[36px]"
            >
              <Plus className="size-4" />
              <span className="sr-only sm:not-sr-only">{t.newItem}</span>
            </Button>

            <Button size="icon" variant="ghost" className="h-9 w-9" aria-label={t.toggleSound} onClick={() => setSound(!sound)}>
              {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Ergonomic Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-white/10 bg-[#0c0c0c]/95 backdrop-blur-xl px-2 py-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => { clickSound(); setTab("inventory"); setQuery(" "); }}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            tab === "inventory" ? "text-red-400 font-bold bg-white/5" : "text-white/60 hover:text-white"
          }`}
        >
          <Box className="size-5" />
          <span className="text-[10px] font-medium">{t.inventory}</span>
        </button>

        <button
          onClick={() => { clickSound(); setTab("repairs"); }}
          className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            tab === "repairs" ? "text-red-400 font-bold bg-white/5" : "text-white/60 hover:text-white"
          }`}
        >
          <div className="relative">
            <ClipboardList className="size-5" />
            {repairs.filter((r) => r.status !== "Repaired" && r.status !== "Collected").length > 0 && (
              <span className="absolute -top-1 -right-2 rounded-full bg-red-500 px-1 py-0.2 text-[9px] font-bold text-white min-w-[16px] text-center">
                {repairs.filter((r) => r.status !== "Repaired" && r.status !== "Collected").length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">{t.repairs}</span>
        </button>

        <button
          onClick={() => setCameraOpen(true)}
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-white/60 hover:text-white transition-all"
        >
          <Camera className="size-5 text-red-400" />
          <span className="text-[10px] font-medium">{t.scanCode}</span>
        </button>

        <button
          onClick={() => setTab("stats")}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            tab === "stats" ? "text-red-400 font-bold bg-white/5" : "text-white/60 hover:text-white"
          }`}
        >
          <BarChart3 className="size-5" />
          <span className="text-[10px] font-medium">{t.statistics}</span>
        </button>
      </nav>

      {/* Main Container */}
      <main className="relative z-10 mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6 pb-24 md:pb-8">
        {tab === "repairs" ? (
          <RepairBoard
            repairs={repairs}
            repair={repair}
            setRepair={setRepair}
            save={saveRepairs}
            lang={lang}
            repairTab={repairTab}
            setRepairTab={setRepairTab}
            repairSearch={repairSearch}
            setRepairSearch={setRepairSearch}
          />
        ) : tab === "stats" ? (
          <Stats items={items} repairs={repairs} lang={lang} />
        ) : (
          <div>
            {/* Inventory Search & Controls */}
            <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
              <div className={`${lang === "ar" ? "ml-auto" : "mr-auto"}`}>
                <p className="text-xs sm:text-sm font-semibold text-red-400">{t.shopSubtitle}</p>
                <h1 className="text-2xl sm:text-3xl font-black">{t.searchTitle}</h1>
                <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-white/55">{t.searchDesc}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:min-w-[280px]">
                  <Search className={`absolute top-3 size-4 text-white/40 ${lang === "ar" ? "right-3" : "left-3"}`} />
                  <Input
                    autoFocus={scanMode}
                    aria-label={t.searchTitle}
                    value={query}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setQuery(normalizeSearch(e.currentTarget.value))
                    }}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className={`w-full h-11 sm:h-10 text-base sm:text-sm ${lang === "ar" ? "pr-9 pl-3" : "pl-9 pr-3"}`}
                  />
                  {query && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#151515] shadow-2xl">
                      {searchTokens(query)
                        .slice(0, 5)
                        .map((token) => (
                          <button
                            key={token}
                            className="flex w-full items-center gap-2 border-b border-white/5 px-4 py-3 text-left text-sm text-white/70 hover:bg-white/10 last:border-b-0"
                            onClick={() => setQuery(token)}
                          >
                            <Search className="size-3 text-red-400" />
                            <span>{token}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" className="flex-1 sm:flex-initial border-white/15 bg-white/5 h-11 sm:h-10 text-xs sm:text-sm" onClick={() => setCameraOpen(true)}>
                    <Camera className="size-4 text-red-400" />
                    <span>{t.scanCode}</span>
                  </Button>

                  <Button variant="outline" className="flex-1 sm:flex-initial border-white/15 bg-white/5 h-11 sm:h-10 text-xs sm:text-sm" onClick={() => setTab("repairs")}>
                    <Wrench className="size-4 text-red-400" />
                    <span>{t.repairBoardNav}</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Brands Selection */}
            {showInventory && (
              <div className="mb-4 sm:mb-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
                {["All", ...BRANDS.map((b) => b.id)].map((b) => (
                  <div
                    role="group"
                    key={b}
                    onClick={() => setBrand(b)}
                    className={`cursor-pointer rounded-2xl border p-3 sm:p-4 text-left transition-all ${
                      brand === b ? "border-red-500 bg-red-500/15" : "border-white/10 bg-white/[.04] hover:bg-white/10"
                    }`}
                  >
                    <b className="text-xs sm:text-sm truncate block">{b === "All" ? t.allBrands : brandNames[b] || BRANDS.find((x) => x.id === b)?.name}</b>
                    {b !== "All" && (
                      <button
                        aria-label={`Edit ${brandNames[b] || BRANDS.find((x) => x.id === b)?.name}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          renameBrand(b)
                        }}
                      >
                        <Pencil className="mt-1.5 size-3 text-white/45 hover:text-white" />
                      </button>
                    )}
                    <span className="mt-1 block text-[10px] sm:text-xs text-white/45">
                      {b === "All" ? items.length : items.filter((i) => brandOf(i)?.id === b).length} {t.itemsCount}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Category Filter Pills */}
            {showInventory && (
              <div className="mb-5 sm:mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none touch-pan-x">
                {categoryOptions.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCategory(c.key)}
                    className={`whitespace-nowrap rounded-full border px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-all ${
                      category === c.key ? "border-red-500 bg-red-600 text-white font-semibold" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            {/* Inventory Items Grid */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((i) => (
                <article key={i.id} className="group relative rounded-2xl border border-white/10 bg-white/[.04] p-4 transition-all hover:border-white/20 flex flex-col justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-red-500/15 p-2.5 sm:p-3 text-red-400 shrink-0">
                      <Camera className="size-5" />
                    </div>
                    
                    <div className={`min-w-0 flex-1 ${lang === "ar" ? "ml-auto" : "mr-auto"}`}>
                      {/* Note: Item Name and Brand Name are kept in English as requested */}
                      <h2 className="font-bold text-white text-sm sm:text-base leading-snug break-words">{i.name}</h2>
                      <p className="text-xs text-white/50 mt-0.5">
                        {brandOf(i)?.name || "Brand"} · {i.category}
                      </p>
                      <p className="mt-1 font-mono text-[11px] sm:text-xs text-white/40 truncate">{i.barcode || i.id}</p>
                      <p className="mt-2 font-bold text-emerald-400 text-sm sm:text-base">
                        {formatCurrency(i.retailPrice, lang)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 min-h-[36px] min-w-[36px] text-white/60 hover:bg-white/10 hover:text-white"
                        aria-label={`${t.edit} ${i.name}`}
                        onClick={() => beginEdit(i)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 min-h-[36px] min-w-[36px] text-red-400/70 hover:bg-red-500/20 hover:text-red-300"
                        aria-label={`${t.delete} ${i.name}`}
                        onClick={() => setDeletingItem(i)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between border-t border-white/5 pt-3 gap-2">
                    <span className={`text-xs font-semibold ${i.stock === 0 ? "text-red-400" : "text-emerald-300"}`}>
                      {i.stock === 0 ? t.outOfStock : `${i.stock} ${t.inStock}`}
                    </span>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-xs h-8 px-2.5" onClick={() => printInventoryItem(i, "sticker", lang)}>
                        <Printer className="size-3" />
                        <span>{t.sticker}</span>
                      </Button>
                      <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-xs h-8 px-2.5" onClick={() => printInventoryItem(i, "receipt", lang)}>
                        <Printer className="size-3" />
                        <span>{t.receipt}</span>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {(query || scanMode || showInventory) && filtered.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/50">
                <Box className="mx-auto size-8 text-white/20 mb-2" />
                <p>{t.noItemsFound}</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Camera Scanner Modal */}
      {cameraOpen && (
        <CameraScanner onClose={() => setCameraOpen(false)} onDetected={handleScanDetect} />
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:grid sm:place-items-center bg-black/80 p-0 sm:p-4 backdrop-blur-sm">
          <div dir={lang === "ar" ? "rtl" : "ltr"} className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border-t sm:border border-red-500/30 bg-[#161616] p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <AlertTriangle className="size-6 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold">{t.confirmDeleteTitle}</h3>
            </div>
            <p className="text-xs sm:text-sm text-white/70 mb-2">{t.confirmDeleteText}</p>
            <p className="font-semibold text-white bg-white/5 p-3 rounded-xl border border-white/10 mb-5 text-sm">{deletingItem.name}</p>
            <div className="flex justify-end gap-2.5">
              <Button variant="ghost" className="h-11 sm:h-10 text-sm" onClick={() => setDeletingItem(null)}>
                {t.cancel}
              </Button>
              <Button className="bg-red-600 hover:bg-red-500 text-white h-11 sm:h-10 text-sm px-5" onClick={confirmDeleteItem}>
                <Trash2 className="size-4" />
                <span>{t.delete}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Alert */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs sm:text-sm font-semibold backdrop-blur-md transition-all ${
            toast.type === "success"
              ? "bg-emerald-950/95 border-emerald-500/40 text-emerald-200"
              : "bg-red-950/95 border-red-500/40 text-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="size-4 text-red-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-white/50 hover:text-white"
            aria-label="Close notification"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Item Editor / Creator Modal */}
      {(showNew || editing) && (
        <Editor
          draft={draft}
          setDraft={setDraft}
          models={models}
          close={() => {
            setShowNew(false)
            setEditing(null)
          }}
          commit={commit}
          lang={lang}
        />
      )}
    </div>
  )
}

function Editor({
  draft,
  setDraft,
  models,
  close,
  commit,
  lang,
}: {
  draft: Record<string, any>
  setDraft: (v: Record<string, any>) => void
  models: { id: string; name: string }[]
  close: () => void
  commit: () => void
  lang: Language
}) {
  const t = translations[lang]

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:grid sm:place-items-center bg-black/80 p-0 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl border-t sm:border border-white/10 bg-[#151515] p-5 sm:p-6 shadow-2xl max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto">
        <div className="mb-4 sm:mb-5 flex items-center justify-between">
          <h2 className={`${lang === "ar" ? "ml-auto" : "mr-auto"} text-lg sm:text-xl font-bold`}>
            {draft.id ? t.editItemTitle : t.newItemTitle}
          </h2>
          <Button size="icon" variant="ghost" className="h-10 w-10 min-h-[40px] min-w-[40px] rounded-full hover:bg-white/10" onClick={close}>
            <X className="size-5" />
          </Button>
        </div>

        <div className="grid gap-3.5 sm:gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-semibold text-white/75 sm:col-span-2">
            {t.itemName} *
            <Input
              aria-label={t.itemName}
              placeholder={t.itemNamePlaceholder}
              value={draft.name || ""}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="h-11 sm:h-10 text-base sm:text-sm"
              autoFocus
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-white/75 sm:col-span-2">
            {t.barcode}
            <Input
              aria-label={t.barcode}
              placeholder={t.barcodePlaceholder}
              value={draft.barcode || ""}
              onChange={(e) => setDraft({ ...draft, barcode: e.target.value })}
              className="h-11 sm:h-10 text-base sm:text-sm font-mono"
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-white/75">
            {t.category}
            <select
              aria-label={t.category}
              value={draft.category}
              className="flex h-11 sm:h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-base sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              onChange={(e) => setDraft({ ...draft, category: e.target.value as InventoryItem["category"] })}
            >
              {PART_CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-[#151515] text-white">
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-white/75">
            {t.brand}
            <select
              aria-label={t.brand}
              value={draft.brandId}
              className="flex h-11 sm:h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-base sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              onChange={(e) => setDraft({ ...draft, brandId: e.target.value })}
            >
              {BRANDS.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#151515] text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-white/75 sm:col-span-2">
            {t.model}
            <select
              aria-label={t.model}
              value={draft.modelId}
              className="flex h-11 sm:h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-base sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              onChange={(e) => setDraft({ ...draft, modelId: e.target.value })}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#151515] text-white">
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          {/* Number inputs - Initial '0' prevented with empty string defaults & auto-select onFocus */}
          <label className="grid gap-1.5 text-xs font-semibold text-white/75">
            {t.stockQty}
            <Input
              aria-label={t.stockQty}
              type="number"
              placeholder="0"
              value={draft.stock ?? ""}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
              className="h-11 sm:h-10 text-base sm:text-sm"
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-white/75">
            {t.buyCost} ({lang === "ar" ? "د.ج" : "DZD"})
            <Input
              aria-label={t.buyCost}
              type="number"
              placeholder="1500"
              value={draft.wholesaleCost ?? ""}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setDraft({ ...draft, wholesaleCost: e.target.value })}
              className="h-11 sm:h-10 text-base sm:text-sm"
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-white/75 sm:col-span-2">
            {t.sellingPrice} ({lang === "ar" ? "د.ج" : "DZD"})
            <Input
              aria-label={t.sellingPrice}
              type="number"
              placeholder="2200"
              value={draft.retailPrice ?? ""}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setDraft({ ...draft, retailPrice: e.target.value })}
              className="h-11 sm:h-10 text-base sm:text-sm"
            />
          </label>

          <div className="rounded-xl bg-white/5 p-3 text-xs text-white/70 sm:col-span-2 flex items-center justify-between">
            <span>{t.profitMargin}:</span>
            <span className="font-bold text-emerald-400 text-sm sm:text-base">
              {formatCurrency(
                (parseFloat(String(draft.retailPrice || "0")) || 0) -
                  (parseFloat(String(draft.wholesaleCost || "0")) || 0),
                lang
              )}
            </span>
          </div>
        </div>

        <Button className="mt-5 sm:mt-6 w-full h-12 text-base font-semibold bg-red-600 hover:bg-red-500 text-white" onClick={commit}>
          {draft.id ? t.saveChanges : t.addItemBtn}
        </Button>
      </div>
    </div>
  )
}

function Stats({ items, repairs, lang }: { items: InventoryItem[]; repairs: Repair[]; lang: Language }) {
  const t = translations[lang]

  const merchandiseMargin = items.reduce((sum, i) => sum + (i.retailPrice - i.wholesaleCost) * Math.max(0, i.stock), 0)
  const completedRepairs = repairs.filter((r) => r.status === "Repaired" || r.status === "Collected")
  const repairProfit = completedRepairs.reduce((sum, r) => sum + (Number(r.price) || 0), 0)
  const totalMargin = merchandiseMargin + repairProfit

  return (
    <section className="mx-auto max-w-4xl py-2 sm:py-4">
      <div className="mb-4 sm:mb-6">
        <p className="text-xs sm:text-sm font-semibold text-red-400">{t.businessOverview}</p>
        <h1 className="text-2xl sm:text-3xl font-black">{t.statisticsTitle}</h1>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4 sm:p-5">
          <p className="text-xs text-white/50">{t.merchandiseMargin}</p>
          <strong className="mt-1.5 block text-xl sm:text-2xl font-extrabold text-emerald-400">
            {formatCurrency(merchandiseMargin, lang)}
          </strong>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4 sm:p-5">
          <p className="text-xs text-white/50">{t.repairProfit}</p>
          <strong className="mt-1.5 block text-xl sm:text-2xl font-extrabold text-emerald-400">
            {formatCurrency(repairProfit, lang)}
          </strong>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4 sm:p-5">
          <p className="text-xs text-white/50">{t.combinedProfit}</p>
          <strong className="mt-1.5 block text-xl sm:text-2xl font-extrabold text-emerald-300">
            {formatCurrency(totalMargin, lang)}
          </strong>
        </div>
      </div>

      <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.03] p-4">
          <div className="rounded-xl bg-red-500/15 p-3 text-red-400 shrink-0">
            <Box className="size-6" />
          </div>
          <div>
            <span className="text-xs text-white/50">{t.totalStockCount}</span>
            <p className="text-lg sm:text-xl font-bold">{items.reduce((acc, i) => acc + i.stock, 0)} {t.itemsCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.03] p-4">
          <div className="rounded-xl bg-red-500/15 p-3 text-red-400 shrink-0">
            <Wrench className="size-6" />
          </div>
          <div>
            <span className="text-xs text-white/50">{t.activeRepairsCount}</span>
            <p className="text-lg sm:text-xl font-bold">
              {repairs.filter((r) => r.status !== "Repaired" && r.status !== "Collected").length}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-5 sm:mt-6 text-xs leading-relaxed text-white/50 bg-white/5 p-4 rounded-xl border border-white/5">
        {t.statsDesc}
      </p>
    </section>
  )
}

function RepairBoard({
  repairs,
  repair,
  setRepair,
  save,
  lang,
  repairTab,
  setRepairTab,
  repairSearch,
  setRepairSearch,
}: {
  repairs: Repair[]
  repair: Partial<Repair>
  setRepair: (r: Partial<Repair>) => void
  save: (r: Repair[]) => void
  lang: Language
  repairTab: "active" | "history"
  setRepairTab: (v: "active" | "history") => void
  repairSearch: string
  setRepairSearch: (s: string) => void
}) {
  const t = translations[lang]

  const addRepair = () => {
    if (!repair.customer?.trim() || !repair.device?.trim() || !repair.issue?.trim()) return
    const newId = `R-${Date.now().toString().slice(-6)}`
    const newJob: Repair = {
      id: newId,
      customer: repair.customer.trim(),
      phone: repair.phone?.trim() || "",
      device: repair.device.trim(),
      issue: repair.issue.trim(),
      status: (repair.status as Repair["status"]) || "Received",
      price: Number(repair.price) || 0,
      promised: repair.promised || "",
      notes: repair.notes?.trim() || "",
      createdAt: new Date().toLocaleDateString(lang === "ar" ? "ar-DZ" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    }

    const updated = [newJob, ...repairs]
    save(updated)
    setRepair({ status: "Received" })

    // Auto prompt/print intake sticker upon registration
    printRepairIntakeSticker(newJob, lang)
  }

  const markAsRepaired = (job: Repair) => {
    const updatedJob: Repair = {
      ...job,
      status: "Repaired",
      repairedAt: new Date().toLocaleDateString(lang === "ar" ? "ar-DZ" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    }

    const next = repairs.map((r) => (r.id === job.id ? updatedJob : r))
    save(next)

    // Print final receipt automatically upon marking as repaired
    printRepairFinalReceipt(updatedJob, lang)
  }

  // Filter repair lists by search input
  const activeQueue = repairs.filter((r) => r.status !== "Repaired" && r.status !== "Collected")
  const historyQueue = repairs.filter((r) => r.status === "Repaired" || r.status === "Collected")

  const matchesSearch = (r: Repair) => {
    if (!repairSearch.trim()) return true
    const s = repairSearch.toLowerCase()
    return (
      r.id.toLowerCase().includes(s) ||
      r.customer.toLowerCase().includes(s) ||
      r.phone.includes(s) ||
      r.device.toLowerCase().includes(s) ||
      r.issue.toLowerCase().includes(s)
    )
  }

  const displayedActive = activeQueue.filter(matchesSearch)
  const displayedHistory = historyQueue.filter(matchesSearch)

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs sm:text-sm font-semibold text-red-400">{t.serviceWorkflow}</p>
          <h1 className="text-2xl sm:text-3xl font-black">{t.repairBoardTitle}</h1>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-white/55">{t.repairBoardDesc}</p>
        </div>

        {/* Active vs History Tab Filter */}
        <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 self-start sm:self-auto w-full sm:w-auto">
          <button
            onClick={() => setRepairTab("active")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all ${
              repairTab === "active" ? "bg-red-600 text-white shadow" : "text-white/60 hover:text-white"
            }`}
          >
            <Clock className="size-4 shrink-0" />
            <span>{t.activeRepairsTab}</span>
            <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] sm:text-xs font-bold">{activeQueue.length}</span>
          </button>

          <button
            onClick={() => setRepairTab("history")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all ${
              repairTab === "history" ? "bg-red-600 text-white shadow" : "text-white/60 hover:text-white"
            }`}
          >
            <History className="size-4 shrink-0" />
            <span>{t.repairHistoryTab}</span>
            <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] sm:text-xs font-bold">{historyQueue.length}</span>
          </button>
        </div>
      </div>

      {/* New Repair Intake Form */}
      <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4 sm:p-5 shadow-xl">
        <h2 className="text-sm sm:text-base font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Plus className="size-4 text-red-400" />
          <span>{t.newRepairJob}</span>
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            placeholder={t.customerName}
            value={repair.customer || ""}
            onChange={(e) => setRepair({ ...repair, customer: e.target.value })}
            className="h-11 sm:h-10 text-base sm:text-sm"
          />

          <Input
            placeholder={t.customerPhone}
            value={repair.phone || ""}
            onChange={(e) => setRepair({ ...repair, phone: e.target.value })}
            className="h-11 sm:h-10 text-base sm:text-sm"
          />

          <Input
            placeholder={t.deviceModel}
            value={repair.device || ""}
            onChange={(e) => setRepair({ ...repair, device: e.target.value })}
            className="h-11 sm:h-10 text-base sm:text-sm"
          />

          <Input
            placeholder={t.issue}
            value={repair.issue || ""}
            onChange={(e) => setRepair({ ...repair, issue: e.target.value })}
            className="h-11 sm:h-10 text-base sm:text-sm"
          />

          {/* Number Input - Price without forced zero */}
          <Input
            type="number"
            placeholder={`${t.expectedPrice} (${lang === "ar" ? "د.ج" : "DZD"})`}
            value={repair.price === 0 || repair.price === undefined ? "" : repair.price}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setRepair({ ...repair, price: e.target.value === "" ? 0 : Number(e.target.value) })}
            className="h-11 sm:h-10 text-base sm:text-sm sm:col-span-2 lg:col-span-1"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-end">
          <Button onClick={addRepair} className="w-full sm:w-auto h-11 sm:h-10 bg-red-600 hover:bg-red-500 font-semibold text-white px-6 text-sm">
            <Plus className="size-4" />
            <span>{t.addRepairBtn}</span>
          </Button>
        </div>
      </div>

      {/* Search Filter for Repair Tickets */}
      <div className="relative w-full max-w-md">
        <Search className={`absolute top-3 size-4 text-white/40 ${lang === "ar" ? "right-3" : "left-3"}`} />
        <Input
          placeholder={t.searchRepairsPlaceholder}
          value={repairSearch}
          onChange={(e) => setRepairSearch(e.target.value)}
          className={`h-11 sm:h-10 text-base sm:text-sm ${lang === "ar" ? "pr-9 pl-3" : "pl-9 pr-3"} bg-black/40`}
        />
        {repairSearch && (
          <button
            onClick={() => setRepairSearch("")}
            className={`absolute top-3 text-xs text-white/40 hover:text-white ${lang === "ar" ? "left-3" : "right-3"}`}
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* ACTIVE REPAIRS QUEUE */}
      {repairTab === "active" && (
        <div>
          {displayedActive.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">
              <Clock className="mx-auto size-8 text-white/20 mb-2" />
              <p>{t.noActiveRepairs}</p>
            </div>
          ) : (
            <div className="grid gap-3.5 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {displayedActive.map((r) => (
                <article key={r.id} className="relative rounded-2xl border border-white/10 bg-white/[.04] p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-red-500/40">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <b className="text-sm sm:text-base text-white truncate block">{r.customer}</b>
                        {r.phone && (
                          <p className="text-xs text-white/60 flex items-center gap-1 mt-0.5">
                            <Phone className="size-3 text-red-400 shrink-0" />
                            <span>{r.phone}</span>
                          </p>
                        )}
                      </div>
                      <span className="rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-300 border border-red-500/30 shrink-0">
                        {r.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-white/70 border-t border-b border-white/5 py-3 my-3">
                      <p className="font-semibold text-white text-sm leading-snug">{r.device}</p>
                      <p><span className="text-white/40">{t.issue}:</span> {r.issue}</p>
                      <p><span className="text-white/40">{t.expectedPrice}:</span> <strong className="text-emerald-400">{formatCurrency(r.price, lang)}</strong></p>
                    </div>

                    <p className="font-mono text-[11px] text-white/40">ID: {r.id}</p>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-2 pt-2">
                    <Button size="sm" variant="outline" className="h-10 sm:h-9 border-white/10 bg-white/5 text-xs flex-1" onClick={() => printRepairIntakeSticker(r, lang)}>
                      <Printer className="size-3.5" />
                      <span>{t.printIntakeSticker}</span>
                    </Button>

                    <Button size="sm" className="h-10 sm:h-9 bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex-1 font-semibold" onClick={() => markAsRepaired(r)}>
                      <Wrench className="size-3.5" />
                      <span>{t.markAsRepaired}</span>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REPAIR HISTORY TAB */}
      {repairTab === "history" && (
        <div>
          {displayedHistory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">
              <History className="mx-auto size-8 text-white/20 mb-2" />
              <p>{t.noRepairHistory}</p>
            </div>
          ) : (
            <div className="grid gap-3.5 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {displayedHistory.map((r) => (
                <article key={r.id} className="relative rounded-2xl border border-white/10 bg-white/[.02] p-4 sm:p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <b className="text-sm sm:text-base text-white truncate block">{r.customer}</b>
                        {r.phone && (
                          <p className="text-xs text-white/60 flex items-center gap-1 mt-0.5">
                            <Phone className="size-3 text-emerald-400 shrink-0" />
                            <span>{r.phone}</span>
                          </p>
                        )}
                      </div>
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="size-3" />
                        <span>{t.statusRepaired}</span>
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-white/70 border-t border-b border-white/5 py-3 my-3">
                      <p className="font-semibold text-white text-sm leading-snug">{r.device}</p>
                      <p><span className="text-white/40">{t.issue}:</span> {r.issue}</p>
                      <p><span className="text-white/40">{t.sellingPrice}:</span> <strong className="text-emerald-400">{formatCurrency(r.price, lang)}</strong></p>
                      {r.repairedAt && (
                        <p><span className="text-white/40">{t.repairedOn}:</span> {r.repairedAt}</p>
                      )}
                    </div>

                    <p className="font-mono text-[11px] text-white/40">ID: {r.id}</p>
                  </div>

                  <div className="mt-4 pt-2">
                    <Button size="sm" variant="outline" className="w-full h-10 sm:h-9 border-white/10 bg-white/5 text-xs" onClick={() => printRepairFinalReceipt(r, lang)}>
                      <Printer className="size-3.5" />
                      <span>{t.printFinalReceipt}</span>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
