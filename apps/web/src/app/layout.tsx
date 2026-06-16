import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { APP_DESCRIPTION, APP_NAME } from "@mali/config";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import ThemeRegistry from "@/theme/ThemeRegistry";
import "./globals.css";

const inter = Inter({
  variable: "--font-app",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#6750a4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
