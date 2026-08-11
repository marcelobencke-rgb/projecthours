import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Project Hours — Controle de Horas por Projeto",
  description:
    "Sistema moderno para rastrear horas de trabalho em tarefas e projetos com timer start/stop e relatórios detalhados.",
  keywords: ["time tracking", "project hours", "controle de horas", "produtividade"],
  authors: [{ name: "Project Hours" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
