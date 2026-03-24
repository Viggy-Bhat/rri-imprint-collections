import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/smart-content.css";
import { Footer } from "@/app/components/Footer";
import { getSiteSettings } from "@/app/lib/siteSettingsApi";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Imprints Collection",
  description: "An archive of researchers and their contributions",
};

export default async function RootLayout({ children }) {
  const siteSettings = await getSiteSettings();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="site-container flex flex-col flex-1">
          <main className="flex-1">{children}</main>
          <Footer settings={siteSettings} />
        </div>
      </body>
    </html>
  );
}
