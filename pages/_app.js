import '../styles/globals.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import Head from 'next/head'
import Script from 'next/script'

export default function App({ Component, pageProps }) {
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
