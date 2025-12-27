import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { ReduxProvider } from "@/components/providers/redux-provider"
import { AuthGuard } from "@/components/auth-guard"
import { Toaster } from "sonner"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "SAFFRAJIT - Pure Certified Premium Saffron & Shilajit",
  description:
    "100% Authentic Kashmiri & Iranian Saffron, Lab-tested Himalayan Shilajit. Government certified, direct from source. The power of purity.",

  icons: {
    icon: "/logo.png", // Favicon / Logo
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} font-poppins antialiased`}>
        <ReduxProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthGuard>
              {children}
            </AuthGuard>
            <Toaster position="top-center" richColors />
          </ThemeProvider>
        </ReduxProvider>
        <Analytics />
      </body>
    </html>
  )
}
