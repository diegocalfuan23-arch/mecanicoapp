import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MecanicoApp — El cuaderno del taller, en tu celular",
  description:
    "Historial por patente, control de repuestos, fiados al día y recordatorios por WhatsApp. Hecho para talleres independientes en Chile.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MecanicoApp",
  },
};

/** Sin esto el navegador del celular asume ~980px de ancho y encoge todo. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn(
        // overflow-x-hidden corta de raíz cualquier desborde lateral:
        // sin esto, un solo hijo demasiado ancho arrastra toda la página
        // y en el teléfono el contenido queda cortado por el borde.
        "h-full overflow-x-hidden",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        figtree.variable
      )}
    >
      <body className="flex min-h-full w-full flex-col overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
