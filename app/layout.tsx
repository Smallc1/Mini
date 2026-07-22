import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import CustomerServiceButton from "./components/CustomerServiceButton";
import PwaBootstrap from "./components/PwaBootstrap";
import RealtimeRefresh from "./components/RealtimeRefresh";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"),
  title: { default: "迷你商城", template: "%s | 迷你商城" },
  description: "迷你商城，随时随地发现好物。",
  applicationName: "迷你商城",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "迷你商城" },
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <PwaBootstrap />
        <RealtimeRefresh />
        <Navbar />
        <CustomerServiceButton />
        <main className="mx-auto min-w-0 w-full max-w-[83.333vw] flex-1 px-4 py-6 pb-24 md:px-8 md:pb-6">
          {children}
        </main>
        <footer className="mb-20 border-t border-slate-200/80 bg-white/70 px-4 py-8 text-center text-sm text-slate-500 backdrop-blur md:mb-0">
          © 2026 Mini Mall. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
