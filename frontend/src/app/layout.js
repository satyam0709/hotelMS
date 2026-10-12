import { Montserrat } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/lib/config";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: {
    default: siteConfig.defaultTitle,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-background font-sans text-foreground antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
