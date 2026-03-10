import { Html, Head, Body, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
              var script = document.createElement("script");
              script.async = 1;
              script.src = 'https://emrldco.com/NTA2NDE5.js?t=506419';
              document.head.appendChild(script);
            })();`
          }}
        />
      </Head>
      <Body>
        <Main />
        <NextScript />
      </Body>
    </Html>
  )
}
