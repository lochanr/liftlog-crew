import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Navigation } from "@/components/navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LiftLog Crew",
  description: "Private gym progress tracker for your crew",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 min-h-screen`}>
        <div className="mx-auto max-w-md md:max-w-6xl">
          <Navigation />
          <main className="px-4 pb-24 md:pb-8 pt-4">{children}</main>
        </div>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
