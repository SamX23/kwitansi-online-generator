import { Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-6 md:py-8 border-t">
      <div className="container flex flex-col items-center justify-center gap-4 md:gap-6 text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {currentYear} Kuitansi Online. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          Coded with <Heart className="h-3 w-3 fill-primary text-primary" /> by
          Sami, untuk memudahkan transaksi Anda
        </p>
      </div>
    </footer>
  );
}
