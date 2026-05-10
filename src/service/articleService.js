import dotenv from "dotenv";
dotenv.config();

import mammoth from "mammoth";
import * as cheerio from "cheerio";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// FIREBASE CONFIG
// ==========================================
const serviceAccount = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../../firebase-adminsdk.json"),
    "utf8"
  )
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket(
  process.env.FIREBASE_STORAGE_BUCKET
);
// ==========================================
// PROCESS ARTICLE UPLOAD
// ==========================================
export const processArticleUpload = async (data) => {
  const {
    title,
    author,
    date,
    file,
    thumbnail,
    category,
    child,
  } = data;

  // ==========================================
  // THUMBNAIL NAME
  // ==========================================
  const safeThumbName = `thumb_${Date.now()}_${thumbnail.originalname.replace(
    /\s+/g,
    "_"
  )}`;

  // ==========================================
  // A. UPLOAD THUMBNAIL KE FIREBASE STORAGE
  // ==========================================
  const thumbnailFile = bucket.file(`thumbnails/${safeThumbName}`);

  await thumbnailFile.save(thumbnail.buffer, {
    metadata: {
      contentType: thumbnail.mimetype,
    },
    public: true,
  });

  const thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/thumbnails/${safeThumbName}`;

  // ==========================================
  // B. EKSTRAK DOCX & UPLOAD GAMBAR INLINE
  // ==========================================
  const options = {
    convertImage: mammoth.images.inline(async (element) => {
      const imageBuffer = await element.read();

      const extension = element.contentType.split("/")[1];

      const imageName = `img_${Date.now()}_${Math.floor(
        Math.random() * 1000
      )}.${extension}`;

      // Upload gambar ke Firebase Storage
      const imageFile = bucket.file(`images/${imageName}`);

      await imageFile.save(imageBuffer, {
        metadata: {
          contentType: element.contentType,
        },
        public: true,
      });

      const imageUrl = `https://storage.googleapis.com/${bucket.name}/images/${imageName}`;

      return {
        src: imageUrl,
      };
    }),
  };

  // DOCX cuma dipakai untuk ekstrak
  const htmlResult = await mammoth.convertToHtml(
    { buffer: file.buffer },
    options
  );

  // ==========================================
  // C. HTML -> JSON BLOCKS
  // ==========================================
  const $ = cheerio.load(htmlResult.value);

  const blocks = [];

  $("body")
    .contents()
    .each((index, element) => {
      // Ambil gambar
      const img = $(element).find("img");

      if (img.length > 0) {
        blocks.push({
          type: "image",
          url: img.attr("src"),
        });
      }

      // Ambil text
      const text = $(element).text().trim();

      if (text) {
        blocks.push({
          type: "text",
          content: text,
        });
      }
    });

  // ==========================================
  // D. SIMPAN KE FIRESTORE
  // ==========================================
  const articleData = {
    title,
    author,
    date,
    thumbnailUrl,
    content: blocks,
    category,
    child,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection("articles").add(articleData);

  return {
    id: docRef.id,
    ...articleData,
    createdAt: new Date().toISOString(),
  };
};


export const getAllArticles = async () => {
  const snapshot = await db
    .collection("articles")
    .orderBy("createdAt", "desc")
    .get();

  const articles = [];

  snapshot.forEach((doc) => {
    const data = doc.data();

    articles.push({
      id: doc.id,
      ...data,
      createdAt: data.createdAt
        ? data.createdAt.toDate().toISOString()
        : null,
    });
  });

  return articles;
};