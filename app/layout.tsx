import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/lib/auth/auth"
import { Header } from "@/components/shared/navigation/header"
import { Sidebar } from "@/components/shared/navigation/sidebar"
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-gray-50">
          <Header user={session?.user} />
          <div className="flex pt-14">
            <Sidebar />
            <main className="ml-64 flex-1 p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
