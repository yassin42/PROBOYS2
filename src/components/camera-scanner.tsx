"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader } from "@zxing/browser"
import { Camera, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = { onDetected: (value: string) => void; onClose: () => void }

export function CameraScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const [message, setMessage] = useState("Starting camera…")
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    const reader = new BrowserMultiFormatReader()
    reader
      .decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        videoRef.current!,
        (result, scanError) => {
          if (!active) return
          if (result?.getText()) {
            active = false
            onDetected(result.getText())
            return
          }
          if (scanError) setMessage("Keep the code inside the frame")
        }
      )
      .then((controls) => {
        controlsRef.current = controls
        setMessage("Point the camera at a barcode or QR code")
      })
      .catch(() => {
        setError(true)
        setMessage("Camera permission was blocked. Allow camera access, or use the USB scanner/manual entry.")
      })
    return () => {
      active = false
      controlsRef.current?.stop()
    }
  }, [onDetected])

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:grid sm:place-items-center bg-black/85 p-0 sm:p-4 backdrop-blur-sm">
      <div className="w-full sm:max-w-xl flex flex-col max-h-[100dvh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/15 bg-[#141414] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 p-4 shrink-0">
          <Camera className="size-5 text-red-400 shrink-0" />
          <div className="mr-auto min-w-0">
            <b className="text-sm sm:text-base text-white font-bold truncate block">Camera Scanner</b>
            <p className="text-xs text-white/50 truncate">QR and retail barcode scanning</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close camera scanner" className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-full hover:bg-white/10">
            <X className="size-5" />
          </Button>
        </div>

        {/* Camera Viewfinder */}
        <div className="relative aspect-[3/4] sm:aspect-video bg-black overflow-hidden w-full flex-1 sm:flex-none">
          <video ref={videoRef} className="size-full object-cover" playsInline muted aria-label="Camera scanning preview" />
          <div className="pointer-events-none absolute inset-[15%] sm:inset-[18%] rounded-2xl border-2 border-red-500 shadow-[0_0_0_999px_rgba(0,0,0,.5)] transition-all" />
          {error && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center bg-black/90">
              <p className="max-w-sm text-sm text-white/80">{message}</p>
            </div>
          )}
        </div>

        {/* Footer status */}
        <div className="flex items-center justify-center gap-2 p-4 text-xs sm:text-sm text-white/70 bg-[#141414] shrink-0 border-t border-white/5">
          {!error && <Loader2 className="size-4 animate-spin text-red-400 shrink-0" />}
          <span className="truncate">{message}</span>
        </div>
      </div>
    </div>
  )
}
