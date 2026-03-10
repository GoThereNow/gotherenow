import '../styles/globals.css'
import Head from 'next/head'
import Script from 'next/script'
import { useEffect } from 'react'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    import('mapbox-gl/dist/mapbox-gl.css')
  }, [])

  return (
    <>
      <Head>
        <title>GoThereNow</title>
      </Head>
      <Script
        src="https://emrldco.com/NTA2NDE5.js?t=506419"
        strategy="afterInteractive"
      />
      <Component {...pageProps} />
    </>
  )
}
