import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'AgriDirect – West Godavari | Farmer-to-Buyer Marketplace',
  description: 'A direct farmer-to-buyer agricultural marketplace for West Godavari, Andhra Pradesh. Sell produce directly, cut out middlemen.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Telugu:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body style={{ fontFamily: "'Inter', 'Noto Sans Telugu', sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
