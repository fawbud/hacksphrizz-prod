import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { AuthProvider } from "@/context/AuthContext";
import { CrowdHandlerProvider } from "@/context/CrowdHandlerContext";
import EmergencyBypass from "@/components/EmergencyBypass";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Quikyu - Smart Train Ticketing",
  description: "Pesan tiket kereta cepat, aman, dan nyaman di seluruh Indonesia",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-PR5LQ9R4');
            `,
          }}
        />
      </head>
      <body
        className={`${poppins.variable} font-sans antialiased`}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-PR5LQ9R4"
            height="0" 
            width="0" 
            style={{display:'none', visibility:'hidden'}}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <EmergencyBypass />
        <CrowdHandlerProvider>
          <AuthProvider>{children}</AuthProvider>
        </CrowdHandlerProvider>
      </body>
    </html>
  );
}