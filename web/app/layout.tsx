import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar";

/*
  Load the Geist font family from Google Fonts.
  Geist Sans is used for all body text and headings.
  Geist Mono is used for code snippets and metric labels.
*/
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* Metadata shown in the browser tab and when sharing the link */
export const metadata: Metadata = {
  title: "Campfire Intelligence Platform",
  description: "Cross-client media intelligence: unified ad data, automated error flagging, and k-anonymous portfolio insights across Meta, Google, and TikTok.",
};

/*
  Root layout wraps every page in the app.
  It sets up the sidebar on the left and the main content area on the right.
  The sidebar is 256px wide (w-64) and fixed to the left edge of the screen.
*/
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <div className="flex min-h-screen">
          <Sidebar />
          {/* Main content area sits to the right of the fixed sidebar */}
          <main className="flex-1 ml-64 p-8 md:p-12 pb-16">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
