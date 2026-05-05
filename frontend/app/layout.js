import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/smart-content.css";
import { Footer } from "@/app/components/Footer";
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb";
import SiteHeader from "@/components/SiteHeader";
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
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <div className=" flex flex-col  min-h-screen">
          <main className="flex-1">
            <SiteHeader />
            <PageBreadcrumb />
            {children}
          </main>
          
          <div className="-mt-6 sm:-mt-8">
            <Footer settings={siteSettings} />
          </div>
        </div>
      </body>
    </html>
  );
}