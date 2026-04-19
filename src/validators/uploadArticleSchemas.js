import { z } from "zod";

const MAX_DOC_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMG_SIZE = 2 * 1024 * 1024; // 2MB
const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const articleUploadSchema = z.object({
  title: z.string().max(20, "Judul maximal 5 karakter"),
  category: z.string().max(15, "Kategori maximal 10 karakter"),
  child: z.string().max(10, "Nama anak maximal 10 karakter"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Format tanggal tidak valid",
  }),
  // Validasi File DOCX
  file: z.any()
    .refine((file) => file, "File dokumen wajib diunggah")
    .refine((file) => file?.mimetype === DOCX_TYPE, "Format harus .docx")
    .refine((file) => file?.size <= MAX_DOC_SIZE, "Dokumen maksimal 5MB"),
  // Validasi Foto Thumbnail
  thumbnail: z.any()
    .refine((file) => file, "Foto thumbnail wajib diunggah")
    .refine((file) => IMAGE_TYPES.includes(file?.mimetype), "Format foto harus JPG/PNG/WebP")
    .refine((file) => file?.size <= MAX_IMG_SIZE, "Foto maksimal 2MB"),
});