import mammoth from "mammoth";
import { createClient } from "@supabase/supabase-js";
import prisma from "../prisma/index.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export const processArticleUpload = async (file) => {
  const fileName = `${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;

  // 1. Upload ke Supabase
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("parentpal-docs")
    .upload(fileName, file.buffer, { contentType: file.mimetype });

  if (uploadError) throw new Error(`Supabase Upload Error: ${uploadError.message}`);

  const fileUrl = supabase.storage.from("parentpal-docs").getPublicUrl(fileName).data.publicUrl;

  // 2. Ekstrak Gambar & Teks (Interception)
  const options = {
    convertImage: mammoth.images.inline(async (element) => {
      const imageBuffer = await element.read();
      const imageName = `img_${Date.now()}.${element.contentType.split("/")[1]}`;
      
      await supabase.storage.from("parentpal-docs").upload(`images/${imageName}`, imageBuffer);
      const imgUrl = supabase.storage.from("parentpal-docs").getPublicUrl(`images/${imageName}`).data.publicUrl;

      return { src: imgUrl };
    })
  };

  const result = await mammoth.convertToHtml({ buffer: file.buffer }, options);

  // 3. Simpan ke Database
  return await prisma.article.create({
    data: {
      title: file.originalname,
      content: result.value,
      fileUrl: fileUrl
    }
  });
};

export const getAllArticles = async () => {
  return await prisma.article.findMany();
};