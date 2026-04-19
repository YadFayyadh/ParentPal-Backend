import dotenv from "dotenv";
dotenv.config();

import mammoth from "mammoth";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
import admin from "firebase-admin";
import fs from "fs";

// ==========================================
// 1. INISIALISASI FIREBASE ADMIN & SUPABASE
// ==========================================
// Langsung ambil dari variabel lingkungan di Railway

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ==========================================
// 2. FUNGSI UPLOAD & EKSTRAK
// ==========================================
// Menerima parameter `data` yang berasal dari hasil validasi Zod (req.body)
export const processArticleUpload = async (data) => {
  const { title, date, file, thumbnail } = data;

  // Pastikan nama file unik dengan menghilangkan spasi
  const safeDocName = `doc_${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;
  const safeThumbName = `thumb_${Date.now()}_${thumbnail.originalname.replace(/\s+/g, "_")}`;

  // ==========================================
  // A. UPLOAD THUMBNAIL KE SUPABASE
  // ==========================================
  const { error: thumbUploadError } = await supabase.storage
    .from("parentpal-docs")
    .upload(`thumbnails/${safeThumbName}`, thumbnail.buffer, { contentType: thumbnail.mimetype });

  if (thumbUploadError) throw new Error(`Thumbnail Upload Error: ${thumbUploadError.message}`);

  const thumbnailUrl = supabase.storage
    .from("parentpal-docs")
    .getPublicUrl(`thumbnails/${safeThumbName}`).data.publicUrl;

  // ==========================================
  // B. UPLOAD DOKUMEN DOCX KE SUPABASE
  // ==========================================
  const { error: docUploadError } = await supabase.storage
    .from("parentpal-docs")
    .upload(`documents/${safeDocName}`, file.buffer, { contentType: file.mimetype });

  if (docUploadError) throw new Error(`Document Upload Error: ${docUploadError.message}`);

  const fileUrl = supabase.storage
    .from("parentpal-docs")
    .getPublicUrl(`documents/${safeDocName}`).data.publicUrl;

  // ==========================================
  // C. MAMMOTH: EKSTRAK DOCX & UPLOAD GAMBAR INLINE
  // ==========================================
  const options = {
    convertImage: mammoth.images.inline(async (element) => {
      const imageBuffer = await element.read();
      const imageName = `img_${Date.now()}_${Math.floor(Math.random() * 1000)}.${element.contentType.split("/")[1]}`;
      
      await supabase.storage
        .from("parentpal-docs")
        .upload(`images/${imageName}`, imageBuffer, { contentType: element.contentType });
      
      const imgUrl = supabase.storage
        .from("parentpal-docs")
        .getPublicUrl(`images/${imageName}`).data.publicUrl;

      return { src: imgUrl };
    })
  };

  const htmlResult = await mammoth.convertToHtml({ buffer: file.buffer }, options);
  
  // ==========================================
  // D. CHEERIO: UBAH HTML MENJADI JSON BLOCKS
  // ==========================================
  const $ = cheerio.load(htmlResult.value);
  const blocks = [];

  $('body').contents().each((index, element) => {
    // Cek apakah ada gambar di dalam paragraf
    const img = $(element).find('img');
    if (img.length > 0) {
        blocks.push({ type: "image", url: img.attr('src') });
    }
    // Cek teks
    const text = $(element).text().trim();
    if (text) {
        blocks.push({ type: "text", content: text });
    }
  });

  // ==========================================
  // E. SIMPAN KE FIRESTORE
  // ==========================================
  const articleData = {
    title: title,
    date: date, // Tanggal yang dikirim oleh psikolog/admin
    thumbnailUrl: thumbnailUrl,
    fileUrl: fileUrl,
    content: blocks,
    // Waktu asli saat data ini masuk ke database server
    createdAt: admin.firestore.FieldValue.serverTimestamp() 
  };

  const docRef = await db.collection("articles").add(articleData);

  return {
    id: docRef.id,
    ...articleData,
    createdAt: new Date().toISOString()
  };
};

// ==========================================
// 3. FUNGSI AMBIL SEMUA ARTIKEL
// ==========================================
export const getAllArticles = async () => {
  // Mengurutkan berdasarkan tanggal buat secara descending (terbaru di atas)
  const snapshot = await db.collection("article").orderBy("createdAt", "desc").get();
  
  const articles = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    articles.push({
      id: doc.id,
      ...data,
      // Ubah tipe Timestamp bawaan Firebase menjadi format ISO String
      createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null 
    });
  });

  return articles;
};