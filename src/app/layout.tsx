import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Navigation } from "@/components/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LiftLog Crew",
  description: "Private gym progress tracker for your crew",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 min-h-screen`}>
        <div className="mx-auto max-w-md md:max-w-6xl">
          {user && <Navigation />}
          <main className={`px-4 pb-24 md:pb-8 ${user ? "pt-4" : ""}`}>
            {children}
          </main>
        </div>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
