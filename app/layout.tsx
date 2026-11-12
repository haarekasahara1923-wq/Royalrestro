import type { Metadata } from "next";
import { Inter, Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import SessionPersist from "@/components/SessionPersist";
import MobileBackButtonHandler from "@/components/MobileBackButtonHandler";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter-next" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair-next" });
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-poppins-next" });

export const metadata: Metadata = {
  title: "The Royal Comfort Hotel and Restaurant | Branded Digital Menu",
  description: "Experience the authentic taste and hospitality of The Royal Comfort Hotel and Restaurant with our digital menu and management system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${poppins.variable} font-sans min-h-screen bg-background`}>
          <SessionPersist />
          <MobileBackButtonHandler />
          {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
