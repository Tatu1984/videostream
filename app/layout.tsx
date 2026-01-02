import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/lib/auth/auth"
import { Header } from "@/components/shared/navigation/header"
import { Sidebar } from "@/components/shared/navigation/sidebar"
import { Providers } from "@/components/providers"
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MeTube - Video Sharing Platform",
  description: "A comprehensive video sharing platform with creator tools and content moderation",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth()
  const isAuthPage = false // We'll handle this better later

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
            <Header user={session?.user} />
            <div className="flex pt-14">
              <Sidebar />
              <main className="ml-64 flex-1 p-6">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
