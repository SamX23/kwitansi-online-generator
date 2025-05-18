import type { Metadata } from "next";
import ReceiptGenerator from "@/components/receipt-generator";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Kuitansi Online Generator",
  description: "Aplikasi Pembuat Kuitansi Online",
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="container mx-auto px-4 py-4 flex justify-end">
        <ThemeToggle />
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl flex-1">
        <h1 className="text-3xl font-bold text-center mb-8">Kuitansi Online</h1>
        <ReceiptGenerator />
      </main>

      <Footer />
    </div>
  );
}
