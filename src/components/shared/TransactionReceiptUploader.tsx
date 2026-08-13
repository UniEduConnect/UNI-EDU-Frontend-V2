import { useState, useRef } from "react";
import { uploadReceipt } from "@/services/uploads";
import { useUpdateTransactionReceipt } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  transactionId: string;
  hasReceipt: boolean;
}

export function TransactionReceiptUploader({ transactionId, hasReceipt }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateReceipt = useUpdateTransactionReceipt();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 5MB");
      return;
    }

    try {
      setUploading(true);
      const url = await uploadReceipt(file);
      await updateReceipt.mutateAsync({ id: transactionId, receiptUrl: url });
      toast.success("Đã tải lên ảnh biên lai thành công");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tải lên ảnh thất bại");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <button
        type="button"
        className="text-xs text-muted-foreground hover:text-foreground font-medium inline-flex items-center gap-1 transition-colors"
        disabled={uploading || updateReceipt.isPending}
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
      >
        {uploading || updateReceipt.isPending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <ImagePlus className="w-3 h-3" />
        )}
        {hasReceipt ? "Đổi ảnh" : "Đính kèm ảnh"}
      </button>
    </>
  );
}
