import '../styles/globals.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="travelpayouts-site-verification" content="<script data-noptimize="1" data-cfasync="false" data-wpfc-render="false">
  (function () {
      var script = document.createElement("script");
      script.async = 1;
      script.src = 'https://emrldco.com/NTA2NDE5.js?t=506419';
      document.head.appendChild(script);
  })();
</script>" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
