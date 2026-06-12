import axios from "axios";

import { adminApi } from "@/lib/api";

// Uploads a file to the api-admin multer endpoint and returns its public URL.
export async function uploadMedia(kind: "image" | "video", file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await adminApi.post<{ url: string }>(`/api/v1/uploads/${kind}`, formData);
  return data.url;
}

export function uploadErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(", ");
  }
  return "Please try again.";
}
