import { apiClient } from "@/lib/apiClient";

/**
 * POST /api/uploads/image — multipart upload of a single image, returns its public URL.
 * The backend streams the bytes to S3 and responds with `{ url }` (unwrapped from the
 * { statusCode, message, data } envelope by the apiClient response interceptor).
 */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = (await apiClient.post("/uploads/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })) as unknown as { url: string };
  return res.url;
}
