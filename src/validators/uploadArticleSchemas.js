import { z } from "zod";

const MAX_DOC_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMG_SIZE = 5 * 1024 * 1024; // 2MB
const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const articleUploadSchema = z.object({
  title: z.string().max(100, "Judul maximal 50 karakter"),
  authorId: z.string().max(60, "ID penulis maksimal 60 karakter"),
  authorNama: z.string().max(50, "Nama penulis maksimal 50 karakter"),
  category: z.string().max(30, "Kategori maximal 30 karakter"),
  child: z.string().max(30, "Nama anak maximal 30 karakter"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Format tanggal tidak valid",
  }),
  // Validasi File DOCX
  file: z.any()
    .refine((file) => file, "File dokumen wajib diunggah")
    .refine((file) => file?.mimetype === DOCX_TYPE, "Format harus .docx")
    .refine((file) => file?.size <= MAX_DOC_SIZE, "Dokumen maksimal 5MB"),
  // Validasi Foto Thumbnail
  thumbnail: z.any().optional()
});