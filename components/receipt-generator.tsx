"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Share2,
  Download,
  RefreshCw,
  Pen,
  FileImage,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Signature } from "@/components/signature";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface LineItem {
  id: string;
  description: string;
  price: number;
  amount: number;
}

interface ReceiptData {
  amount: string;
  from: string;
  fromNpa: string;
  date: string;
  note: string;
  receiver: string;
  receiverNpa: string;
  payerSignature: string | null;
  method: string;
  signatureMethod: "draw" | "upload" | null;
  items: LineItem[];
}

export default function ReceiptGenerator() {
  const [receiptData, setReceiptData] = useState<ReceiptData>({
    amount: "",
    from: "",
    fromNpa: "-",
    date: format(new Date(), "yyyy-MM-dd"),
    note: "",
    receiver: "Sami Kalammallah",
    receiverNpa: "24.0093",
    payerSignature: null,
    signatureMethod: null,
    method: "cash",
    items: [
      {
        id: crypto.randomUUID(),
        description: "",
        price: 0,
        amount: 0,
      },
    ],
  });

  const kuitansiIdentifier = `BEND-${format(new Date(), "yyyyMMdd")}-001`;

  const [activeTab, setActiveTab] = useState("form");
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [activeSignatureMethod, setActiveSignatureMethod] = useState<
    "draw" | "upload"
  >("draw");
  const receiptRef = useRef<HTMLDivElement>(null);

  // Calculate total amount whenever items change
  useEffect(() => {
    const total = receiptData.items.reduce((sum, item) => sum + item.amount, 0);
    setReceiptData((prev) => ({
      ...prev,
      amount: total.toLocaleString("id-ID"),
    }));
  }, [receiptData.items]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setReceiptData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          setReceiptData((prev) => ({
            ...prev,
            payerSignature: event.target?.result as string,
            signatureMethod: "upload",
          }));
          setSignatureDialogOpen(false);
          toast.message("Tanda Tangan Ditambahkan", {
            description: "Tanda tangan telah ditambahkan ke kuitansi",
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (signature: string | null) => {
    if (signature) {
      setReceiptData((prev) => ({
        ...prev,
        payerSignature: signature,
        signatureMethod: "draw",
      }));
      setSignatureDialogOpen(false);
      toast.message("Tanda Tangan Ditambahkan", {
        description: "Tanda tangan telah ditambahkan ke kuitansi",
      });
    }
  };

  const handlePrint = () => {
    // Set a class on the body to apply print-specific styles
    document.body.classList.add("printing-receipt");

    // Use the browser's print functionality
    window.print();

    // Remove the class after printing
    setTimeout(() => {
      document.body.classList.remove("printing-receipt");

      toast.message("PDF Dibuat", {
        description: "Kuitansi Anda telah disiapkan untuk diunduh sebagai PDF",
      });
    }, 500);
  };

  const handleShare = async () => {
    try {
      // Try to share via Web Share API
      if (navigator.share) {
        await navigator.share({
          title: `Kuitansi untuk ${receiptData.from}`,
          text: `Kuitansi pembayaran sebesar Rp ${receiptData.amount} dari ${receiptData.from}`,
        });

        toast.message("Berhasil Dibagikan", {
          description: "Kuitansi Anda telah dibagikan",
        });
      } else {
        // Fallback for browsers that don't support Web Share API

        toast.error("Berbagi Tidak Didukung", {
          description:
            "Browser Anda tidak mendukung fitur berbagi langsung. Silakan gunakan opsi unduh dan bagikan secara manual.",
        });
      }
    } catch (error) {
      console.log(error);

      toast.error("Gagal Berbagi", {
        description:
          "Terjadi kesalahan saat berbagi kuitansi Anda. Silakan coba unduh sebagai gantinya.",
      });
    }
  };

  const generateReceipt = () => {
    setActiveTab("preview");
  };

  // Add a new line item
  const addLineItem = () => {
    setReceiptData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: crypto.randomUUID(),
          description: "",
          price: 0,
          amount: 0,
        },
      ],
    }));
  };

  // Remove a line item
  const removeLineItem = (id: string) => {
    if (receiptData.items.length <= 1) {
      toast.error("Tidak Dapat Menghapus", {
        description: "Anda harus memiliki setidaknya satu item",
      });
      return;
    }

    setReceiptData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  // Update a line item
  const updateLineItem = (
    id: string,
    field: keyof LineItem,
    value: string | number,
  ) => {
    setReceiptData((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };

          // Auto-calculate amount if price changes
          if (field === "price") {
            const price = field === "price" ? Number(value) : item.price;
            updatedItem.amount = price;
          }

          return updatedItem;
        }
        return item;
      });

      return { ...prev, items: updatedItems };
    });
  };

  // Format number as Indonesian currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 print:hidden">
        <TabsTrigger value="form">Formulir</TabsTrigger>
        <TabsTrigger value="preview">Pratinjau Kuitansi</TabsTrigger>
      </TabsList>

      <TabsContent value="form" className="space-y-6 py-4 print:hidden">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receiver">Nama Anda (Penerima)</Label>
                <Input
                  id="receiver"
                  name="receiver"
                  placeholder="Nama lengkap Anda"
                  value={receiptData.receiver}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiverNpa">NPA Penerima</Label>
                <Input
                  id="receiverNpa"
                  name="receiverNpa"
                  placeholder="Nomor Pokok Anggota"
                  value={receiptData.receiverNpa}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="from">Dari (Pembayar)</Label>
                <Input
                  id="from"
                  name="from"
                  placeholder="Nama lengkap pembayar"
                  value={receiptData.from}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromNpa">NPA Pembayar (Jika ada)</Label>
                <Input
                  id="fromNpa"
                  name="fromNpa"
                  placeholder="Nomor Pokok Anggota"
                  value={receiptData.fromNpa}
                  onChange={handleInputChange}
                />
              </div>

              {/* method input */}
              <div className="space-y-2">
                <Label htmlFor="method">Metode Pembayaran</Label>
                <Select
                  value={receiptData.method}
                  onValueChange={(value) =>
                    setReceiptData((prev) => ({ ...prev, method: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih metode pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tunai</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="other">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Tanggal</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={receiptData.date}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Detail Item</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLineItem}
                    className="flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Tambah Item
                  </Button>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 text-xs font-medium text-muted-foreground">
                          Deskripsi
                        </th>
                        <th className="text-right p-2 text-xs font-medium text-muted-foreground w-24">
                          Harga
                        </th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptData.items.map((item, index) => (
                        <tr key={item.id} className="border-t border-border">
                          <td className="p-2">
                            <Input
                              placeholder="Deskripsi item"
                              value={item.description}
                              onChange={(e) =>
                                updateLineItem(
                                  item.id,
                                  "description",
                                  e.target.value,
                                )
                              }
                              className="border-0 focus-visible:ring-0 p-0 h-8 text-sm bg-transparent"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min="0"
                              value={item.price}
                              onChange={(e) =>
                                updateLineItem(
                                  item.id,
                                  "price",
                                  Number(e.target.value),
                                )
                              }
                              className="border-0 focus-visible:ring-0 p-0 h-8 text-sm text-right bg-transparent"
                            />
                          </td>
                          <td className="p-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLineItem(item.id)}
                              className="h-8 w-8"
                            >
                              <Trash2
                                size={14}
                                className="text-muted-foreground hover:text-destructive"
                              />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted">
                      <tr className="border-t border-border">
                        <td className="p-2 text-right font-medium">Total</td>
                        <td className="p-2 text-right font-bold">
                          {formatCurrency(
                            receiptData.items.reduce(
                              (sum, item) => sum + item.amount,
                              0,
                            ),
                          )}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Catatan</Label>
                <Textarea
                  id="note"
                  name="note"
                  placeholder="Catatan tambahan..."
                  value={receiptData.note}
                  onChange={handleInputChange}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Tanda Tangan Pembayar</Label>
                <div className="flex flex-col space-y-2">
                  <Dialog
                    open={signatureDialogOpen}
                    onOpenChange={setSignatureDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex justify-between items-center"
                      >
                        <span>
                          {receiptData.payerSignature
                            ? `Tanda Tangan Ditambahkan (${
                                receiptData.signatureMethod === "draw"
                                  ? "Digambar"
                                  : "Diunggah"
                              })`
                            : "Tambah Tanda Tangan Pembayar"}
                        </span>
                        {receiptData.payerSignature ? (
                          <RefreshCw size={16} />
                        ) : (
                          <Pen size={16} />
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Tambah Tanda Tangan Pembayar</DialogTitle>
                        <DialogDescription>
                          Pilih cara Anda menambahkan tanda tangan pembayar
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        <Select
                          value={activeSignatureMethod}
                          onValueChange={(value) =>
                            setActiveSignatureMethod(value as "draw" | "upload")
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih metode tanda tangan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draw">
                              Gambar Tanda Tangan
                            </SelectItem>
                            <SelectItem value="upload">
                              Unggah Tanda Tangan
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        {activeSignatureMethod === "draw" && (
                          <div className="space-y-2">
                            <Label>Gambar Tanda Tangan Di Bawah</Label>
                            <Signature onChange={handleSignatureChange} />
                          </div>
                        )}

                        {activeSignatureMethod === "upload" && (
                          <div className="space-y-2">
                            <Label htmlFor="signatureUpload">
                              Unggah Gambar Tanda Tangan
                            </Label>
                            <div className="flex items-center gap-4">
                              <Input
                                id="signatureUpload"
                                type="file"
                                accept="image/*"
                                onChange={handleSignatureUpload}
                                className="hidden"
                              />
                              <Button
                                variant="outline"
                                onClick={() =>
                                  document
                                    .getElementById("signatureUpload")
                                    ?.click()
                                }
                                className="w-full flex items-center justify-center gap-2"
                              >
                                <FileImage size={16} />
                                Pilih Gambar Tanda Tangan
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {receiptData.payerSignature && (
                    <div className="border rounded-md p-2 bg-muted">
                      <p className="text-xs text-muted-foreground mb-2">
                        Pratinjau Tanda Tangan:
                      </p>
                      <div className="h-16 border-b border-border">
                        <img
                          src={receiptData.payerSignature || "/placeholder.svg"}
                          alt="Tanda tangan pembayar"
                          className="h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button
                className="w-full mt-4"
                onClick={generateReceipt}
                disabled={
                  !receiptData.from ||
                  !receiptData.receiver ||
                  !receiptData.receiverNpa
                }
              >
                Buat Kuitansi
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="preview" className="space-y-6 py-4">
        <div className="flex justify-between mb-4 print:hidden">
          <Button
            variant="outline"
            onClick={() => setActiveTab("form")}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Edit Detail
          </Button>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Download size={16} />
              Unduh PDF
            </Button>
            <Button onClick={handleShare} className="flex items-center gap-2">
              <Share2 size={16} />
              Bagikan
            </Button>
          </div>
        </div>

        <Card
          className="bg-white print:shadow-none print:border-none"
          id="receipt-to-print"
        >
          <CardContent className="p-0" ref={receiptRef}>
            {/* Header with background color */}
            <div className="bg-slate-50 p-6 md:p-8 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-700 mb-1">
                    PC Pemuda Persis Kab. Cianjur
                  </h1>
                  <h2 className="text-2xl font-bold text-slate-800">
                    KUITANSI
                  </h2>
                  <div className="flex items-center mt-2">
                    <div className="bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-medium">
                      {kuitansiIdentifier}
                    </div>
                  </div>
                </div>
                <div className="h-24 w-40">
                  <img
                    src={"/logo-pemuda.png"}
                    alt="Logo perusahaan"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="p-6 md:p-8">
              {/* Receipt Info */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Diterima Oleh
                    </h3>
                    <p className="font-medium text-slate-800">
                      {receiptData.receiver || "Nama Anda"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Dari
                    </h3>
                    <p className="font-medium text-slate-800">
                      {receiptData.from || "Nama Pembayar"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Tanggal Diterima
                    </h3>
                    <p className="font-medium text-slate-800">
                      {receiptData.date
                        ? format(new Date(receiptData.date), "d MMMM yyyy", {
                            locale: id,
                          })
                        : format(new Date(), "d MMMM yyyy", { locale: id })}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Metode Pembayaran
                    </h3>
                    <p className="font-medium text-slate-800">
                      {receiptData.method === "cash"
                        ? "Tunai"
                        : receiptData.method === "transfer"
                          ? "Transfer"
                          : "Lainnya"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="mt-8 mb-8">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  Detail Pembayaran
                </h3>
                <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">
                          Deskripsi
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600">
                          Harga
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptData.items.map((item, index) => (
                        <tr key={item.id} className="border-t border-slate-200">
                          <td className="py-3 px-4 text-slate-700">
                            {item.description || "Item"}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-700">
                            {formatCurrency(item.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200 bg-slate-50">
                        <td className="py-3 px-4 text-right font-semibold text-slate-700">
                          Total
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">
                          {formatCurrency(
                            receiptData.items.reduce(
                              (sum, item) => sum + item.amount,
                              0,
                            ),
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Note Section */}
              {receiptData.note && (
                <div className="mt-8 mb-8">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Catatan
                  </h3>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-slate-700">{receiptData.note}</p>
                  </div>
                </div>
              )}

              {/* Signature Section */}
              <div className="mt-12 pt-8 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                      Diterima Oleh
                    </h3>
                    <div className="h-20 mb-2">
                      <img
                        src="/signature.png"
                        alt="Tanda tangan penerima"
                        className="h-full object-contain opacity-80"
                      />
                    </div>
                    <div className="border-t border-slate-300 pt-2">
                      <p className="font-medium text-slate-700">
                        {receiptData.receiver || "Nama Anda"}
                      </p>
                      <p className="font-medium text-slate-500">
                        {receiptData.receiverNpa || "NPA Penerima"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                      Tanda Tangan Pembayar
                    </h3>
                    <div className="h-20 mb-2">
                      {receiptData.payerSignature ? (
                        <img
                          src={receiptData.payerSignature || "/placeholder.svg"}
                          alt="Tanda tangan pembayar"
                          className="h-full object-contain"
                        />
                      ) : (
                        <div className="h-full border-b border-slate-300"></div>
                      )}
                    </div>
                    <div className="border-t border-slate-300 pt-2">
                      <p className="font-medium text-slate-700">
                        {receiptData.from || "Nama Pembayar"}
                      </p>
                      <p className="font-medium text-slate-500">
                        {receiptData.fromNpa || "NPA Pembayar"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-12 pt-8 border-t border-slate-200">
                <p className="text-xl text-slate-600 font-medium">
                  جَزَاكَ اللهُ خَيْر
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Kuitansi ini dibuat pada{" "}
                  {format(new Date(), "d MMMM yyyy", { locale: id })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
