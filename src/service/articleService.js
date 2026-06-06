import dotenv from "dotenv";
dotenv.config();

import mammoth from "mammoth";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// FIREBASE CONFIG
// ==========================================
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../firebase-adminsdk.json"), "utf8"),
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);

// ==========================================
// HELPER: WRAP HTML DENGAN STYLING PROFESIONAL
//
// Prinsip utama styling ini:
// 1. Gambar mengikuti flow dokumen Word — tidak full-bleed,
//    ukurannya proporsional dan tidak memenuhi layar.
// 2. Teks dan gambar posisinya sama persis seperti di Word.
// 3. Tipografi bersih seperti Medium/Substack tapi tidak
//    mengubah struktur konten sama sekali.
// ==========================================
const wrapWithStyling = (bodyHtml, title = "") => {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>

  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>

  <style>
    /* ── RESET ─────────────────────────────────────── */
    *, *::before, *::after {
      box-sizing: border-box;
    }

    :root {
      --color-text-primary:   #1a1a1a;
      --color-text-secondary: #4a4a4a;
      --color-text-muted:     #888888;
      --color-accent:         #4FC3F7;
      --color-accent-dark:    #0288D1;
      --color-surface:        #F8F9FA;
      --color-border:         #E2E8F0;
      --color-white:          #ffffff;

      --font-body: 'Lora', Georgia, 'Times New Roman', serif;
      --font-ui:   'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    html {
      -webkit-text-size-adjust: 100%;
      text-rendering: optimizeLegibility;
    }

 body {
  margin: 0;
  padding: 20px 18px 60px;

  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 400;
  line-height: 1.85;

  color: var(--color-text-primary);
  background-color: var(--color-white);

  overflow-x: hidden;
  overflow-wrap: break-word;
  word-break: break-word;

  text-align: justify;

  /* Android WebView */
  text-justify: inter-word;
  -webkit-font-smoothing: antialiased;
}

    /* ── HEADINGS ──────────────────────────────────── */
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-ui);
      font-weight: 700;
      line-height: 1.3;
      color: var(--color-text-primary);
      letter-spacing: -0.02em;
      margin: 0 0 12px 0;
    }

    /* Heading yang tidak di posisi pertama dapat margin atas */
    * + h1, * + h2, * + h3, * + h4, * + h5, * + h6 {
      margin-top: 32px;
    }

    h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.2; }
    h2 { font-size: 21px; font-weight: 700; }
    h3 { font-size: 18px; font-weight: 600; }
    h4 { font-size: 16px; font-weight: 600; color: var(--color-text-secondary); }
    h5 { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); }
    h6 { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); }

    /* ── PARAGRAF ──────────────────────────────────── */
   p {
  margin: 0 0 14px 0;

  hyphens: auto;
  -webkit-hyphens: auto;

  text-align: justify;
  text-justify: inter-word;
}

    p:last-child {
      margin-bottom: 0;
    }

    /* ── GAMBAR ────────────────────────────────────── */
    /*
     * KUNCI UTAMA: gambar mengikuti flow dokumen Word.
     *
     * - max-width: 100% — tidak pernah lebih lebar dari container
     * - width: auto — lebar asli dari Word, tidak dipaksa penuh
     * - height: auto — proporsi terjaga
     * - display: block — supaya margin atas/bawah berfungsi
     *
     * Mammoth akan menaruh <img> tepat di posisi gambar di Word,
     * jadi urutan teks-gambar sudah benar secara otomatis.
     */
    img {
      display: block;
      max-width: 100%;
      width: auto;
      height: auto;
      margin: 16px auto;
      border-radius: 6px;
      /* Shadow tipis supaya gambar tidak terasa "mengambang" */
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.10);
    }

    /*
     * Gambar yang lebarnya hampir penuh (dari Word yang memang full-width)
     * akan terlihat full-width karena max-width: 100%.
     *
     * Gambar kecil (ikon, logo, inline) tidak dipaksa jadi besar
     * karena kita pakai width: auto, bukan width: 100%.
     *
     * Kalau gambar di Word diset floating (wrap text), mammoth
     * akan tetap render inline — ini limitasi mammoth, bukan bug.
     */

    /* Gambar di dalam paragraf — tidak ada margin besar */
    p > img {
      margin: 8px auto;
    }

    /* ── FIGURE & CAPTION ──────────────────────────── */
    figure {
      margin: 20px 0;
      padding: 0;
    }

    figure img {
      margin: 0 auto 8px;
    }

    figcaption {
      font-family: var(--font-ui);
      font-size: 12px;
      color: var(--color-text-muted);
      text-align: center;
      font-style: italic;
      line-height: 1.5;
    }

    /* ── INLINE FORMATTING ─────────────────────────── */
    strong, b { font-weight: 700; }
    em, i     { font-style: italic; }
    s         { text-decoration: line-through; color: var(--color-text-muted); }

    u {
      text-decoration: underline;
      text-decoration-color: var(--color-accent);
      text-underline-offset: 2px;
    }

    mark {
      background-color: rgba(79, 195, 247, 0.25);
      color: inherit;
      padding: 0 2px;
      border-radius: 2px;
    }

    a {
      color: var(--color-accent-dark);
      text-decoration: underline;
      text-decoration-color: rgba(2, 136, 209, 0.35);
      text-underline-offset: 3px;
    }

    /* Superscript & subscript dari Word */
    sup, sub {
      font-size: 0.75em;
      line-height: 0;
      position: relative;
      vertical-align: baseline;
    }
    sup { top: -0.5em; }
    sub { bottom: -0.25em; }

    /* ── BLOCKQUOTE ────────────────────────────────── */
    blockquote {
      position: relative;
      margin: 24px 0;
      padding: 16px 20px 16px 24px;
      background: linear-gradient(
        135deg,
        rgba(79, 195, 247, 0.07) 0%,
        rgba(2, 136, 209, 0.04) 100%
      );
      border-left: 4px solid var(--color-accent);
      border-radius: 0 8px 8px 0;
    }

    blockquote p {
      font-size: 15px;
      font-style: italic;
      font-weight: 500;
      color: var(--color-text-secondary);
      line-height: 1.7;
      margin: 0;
    }

    /* ── LIST ──────────────────────────────────────── */
    ul, ol {
      margin: 0 0 14px 0;
      padding-left: 22px;
    }

    li {
      margin-bottom: 6px;
      line-height: 1.7;
    }

    ul li::marker { color: var(--color-accent-dark); }
    ol li::marker { color: var(--color-accent-dark); font-weight: 600; font-family: var(--font-ui); }

    li ul, li ol {
      margin-top: 6px;
      margin-bottom: 0;
    }

    /* ── TABEL ─────────────────────────────────────── */
    /*
     * Tabel dari Word bisa punya banyak kolom.
     * table-layout: fixed + word-break: break-word
     * mencegah tabel overflow ke kanan di layar sempit.
     *
     * Wrapper div.table-wrapper dengan overflow-x: auto
     * memberi scroll horizontal kalau tabel memang terlalu lebar.
     */
    .table-wrapper {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin: 20px 0;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--font-ui);
      font-size: 13px;
      table-layout: fixed;
      min-width: 280px;
    }

    thead {
      background: linear-gradient(135deg, #0288D1 0%, #4FC3F7 100%);
    }

    th {
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #ffffff;
      word-break: break-word;
    }

    td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--color-border);
      vertical-align: top;
      word-break: break-word;
      color: var(--color-text-primary);
      line-height: 1.6;
    }

    tbody tr:nth-child(even) { background-color: #F8FAFC; }
    tbody tr:last-child td   { border-bottom: none; }

    /* ── DIVIDER ───────────────────────────────────── */
    hr {
      border: none;
      height: 1px;
      margin: 32px 0;
      background: linear-gradient(
        to right,
        transparent,
        var(--color-border) 20%,
        var(--color-border) 80%,
        transparent
      );
    }

    /* ── CODE ──────────────────────────────────────── */
    code {
      font-family: 'Consolas', 'Monaco', 'Fira Code', monospace;
      font-size: 0.875em;
      background-color: var(--color-surface);
      color: #c7254e;
      padding: 2px 5px;
      border-radius: 4px;
      border: 1px solid var(--color-border);
    }

    pre {
      background-color: #1e1e1e;
      color: #d4d4d4;
      font-family: 'Consolas', 'Monaco', 'Fira Code', monospace;
      font-size: 13px;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 16px 0;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }

    pre code {
      background: none;
      color: inherit;
      padding: 0;
      border: none;
    }

    /* ── UTILITY ───────────────────────────────────── */
    /* Clearfix untuk gambar yang float (dari Word wrap-text) */
    .clearfix::after {
      content: '';
      display: table;
      clear: both;
    }

    /* Teks center dari Word */
    .text-center { text-align: center; }
    .text-right  { text-align: right; }
    .text-left   { text-align: left; }

  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
};

// ==========================================
// HELPER: WRAP TABEL DENGAN DIV SCROLL
//
// Mammoth output tabel langsung sebagai <table>.
// Kita perlu tambah wrapper <div class="table-wrapper">
// supaya tabel bisa scroll horizontal di layar sempit
// tanpa break layout.
//
// Ini dilakukan dengan string replace sederhana —
// lebih ringan dari parse ulang dengan cheerio.
// ==========================================
const wrapTablesWithScrollDiv = (html) => {
  return html
    .replace(/<table/g, '<div class="table-wrapper"><table')
    .replace(/<\/table>/g, "</table></div>");
};

// ==========================================
// PROCESS ARTICLE UPLOAD
// ==========================================
export const processArticleUpload = async (data) => {
  const { title, author, date, file, thumbnail, category, child } = data;

  // ==========================================
  // A. UPLOAD THUMBNAIL KE FIREBASE STORAGE
  // ==========================================
  const safeThumbName = `thumb_${Date.now()}_${thumbnail.originalname.replace(
    /\s+/g,
    "_",
  )}`;

  const thumbnailFile = bucket.file(`thumbnails/${safeThumbName}`);

  await thumbnailFile.save(thumbnail.buffer, {
    metadata: { contentType: thumbnail.mimetype },
    public: true,
  });

  const thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/thumbnails/${safeThumbName}`;

  // ==========================================
  // B. EKSTRAK DOCX + UPLOAD GAMBAR INLINE
  //
  // convertImage: mammoth.images.inline() dipanggil
  // per-gambar saat konversi berjalan. Setiap gambar
  // langsung diupload ke Storage, URL-nya di-inject
  // ke atribut src <img> di posisi aslinya di HTML.
  //
  // Hasilnya: urutan teks dan gambar di HTML sama
  // persis dengan urutan di dokumen Word asli.
  // ==========================================
  const mammothOptions = {
    convertImage: mammoth.images.inline(async (element) => {
      const imageBuffer = await element.read();

      // Ambil extension dari MIME type
      // Contoh: "image/jpeg" → "jpeg", "image/png" → "png"
      // Fallback ke "jpg" kalau split gagal
      const rawExt = element.contentType.split("/")[1] ?? "jpg";

      // Beberapa MIME type punya suffix tambahan, misal "jpeg; charset=..."
      // strip apapun setelah titik koma
      const extension = rawExt.split(";")[0].trim();

      // Nama file unik: timestamp_random supaya tidak ada
      // tabrakan nama walau ada banyak gambar dalam 1 dokumen
      const imageName = `img_${Date.now()}_${Math.floor(
        Math.random() * 10000,
      )}.${extension}`;

      const imageFile = bucket.file(`images/${imageName}`);

      await imageFile.save(imageBuffer, {
        metadata: { contentType: element.contentType },
        public: true,
      });

      const imageUrl = `https://storage.googleapis.com/${bucket.name}/images/${imageName}`;

      // Kembalikan { src } — ini yang jadi attribute src di <img>
      // Mammoth otomatis taruh <img> ini di posisi gambar di Word
      return { src: imageUrl };
    }),

    // styleMap: mapping nama style Word → elemen HTML
    // 'fresh' = buat elemen baru, tidak inherit dari parent
    styleMap: [
      "p[style-name='Heading 1'] => h1:fresh",
      "p[style-name='Heading 2'] => h2:fresh",
      "p[style-name='Heading 3'] => h3:fresh",
      "p[style-name='Heading 4'] => h4:fresh",
      "p[style-name='Heading 5'] => h5:fresh",
      "p[style-name='Heading 6'] => h6:fresh",
      "p[style-name='Quote'] => blockquote > p:fresh",
      "p[style-name='Intense Quote'] => blockquote > p:fresh",

      // Alignment dari Word
      "p[style-name='centered'] => p.text-center:fresh",

      // Formatting
      "b => strong",
      "i => em",
      "u => u",
      "strike => s",
      "sup => sup",
      "sub => sub",
    ],
  };

  // Convert .docx buffer → HTML string
  // htmlResult.value = fragment HTML (tanpa <html><head><body>)
  // Posisi <img> di dalam HTML = posisi gambar di Word asli
  const htmlResult = await mammoth.convertToHtml(
    { buffer: file.buffer },
    mammothOptions,
  );

  if (htmlResult.messages.length > 0) {
    console.warn("[Mammoth] Conversion warnings:", htmlResult.messages);
  }

  // Wrap semua <table> dengan scroll div
  const processedHtml = wrapTablesWithScrollDiv(htmlResult.value);

  // ==========================================
  // C. WRAP HTML + UPLOAD KE FIREBASE STORAGE
  //
  // processedHtml adalah fragment HTML yang sudah
  // berisi teks dan gambar dalam urutan yang benar.
  // wrapWithStyling() membungkusnya jadi dokumen
  // HTML lengkap dengan CSS.
  // ==========================================
  const wrappedHtml = wrapWithStyling(processedHtml, title);

  const htmlFileName = `articles_html/${uuidv4()}.html`;
  const htmlStorageFile = bucket.file(htmlFileName);

  await htmlStorageFile.save(Buffer.from(wrappedHtml, "utf-8"), {
    metadata: {
      // WAJIB text/html agar WebView Android render sebagai halaman web,
      // bukan download file atau tampil sebagai plain text
      contentType: "text/html; charset=utf-8",
      cacheControl: "public, max-age=3600",
    },
    public: true,
  });

  const htmlUrl = `https://storage.googleapis.com/${bucket.name}/${htmlFileName}`;

  // ==========================================
  // D. SIMPAN KE FIRESTORE
  // ==========================================
  const articleData = {
    title,
    author,
    date,
    thumbnailUrl,
    htmlUrl,
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

// ==========================================
// GET ALL ARTICLES
// ==========================================
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
      createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
    });
  });

  return articles;
};
