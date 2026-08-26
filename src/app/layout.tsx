import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = { title: "ProBoys Inventory", description: "Inventory, scanning, selling, and printing for ProBoys repair parts.", icons: { icon: "/icon.svg" } }
export const viewport: Viewport = { themeColor: "#090909", width: "device-width", initialScale: 1 }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="dark"><body>{children}</body></html>
}
