import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#173E34" />
        <meta name="color-scheme" content="light dark" />
        <title>أثر — مصحفٌ يبقى لمن تحب</title>
        <meta
          name="description"
          content="أهدِ من تحب مصحفًا رقميًا يحمل اسمه، واكتب له كلمة تبقى أثرًا من نور."
        />
        <link rel="canonical" href="https://athar-mushaf.expo.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ar_AR" />
        <meta property="og:site_name" content="أثر" />
        <meta property="og:title" content="أثر — مصحفٌ يبقى لمن تحب" />
        <meta
          property="og:description"
          content="أهدِ من تحب مصحفًا رقميًا يحمل اسمه، واكتب له كلمة تبقى أثرًا من نور."
        />
        <meta property="og:url" content="https://athar-mushaf.expo.app/" />
        <meta property="og:image" content="https://athar-mushaf.expo.app/og-athar.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="أثر — مصحفٌ يبقى لمن تحب" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="أثر — مصحفٌ يبقى لمن تحب" />
        <meta
          name="twitter:description"
          content="أهدِ من تحب مصحفًا رقميًا يحمل اسمه، واكتب له كلمة تبقى أثرًا من نور."
        />
        <meta name="twitter:image" content="https://athar-mushaf.expo.app/og-athar.png" />
        <meta name="twitter:image:alt" content="أثر — مصحفٌ يبقى لمن تحب" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
