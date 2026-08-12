import { useMutation } from "@tanstack/react-query";
import { uploadImage, uploadReceipt } from "@/services/uploads";

/** Uploads an image file to S3 (via the backend) and resolves with its public URL. */
export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => uploadImage(file),
  });
}

/** Uploads a receipt image to S3 (via the backend) and resolves with its public URL. */
export function useUploadReceipt() {
  return useMutation({
    mutationFn: (file: File) => uploadReceipt(file),
  });
}
