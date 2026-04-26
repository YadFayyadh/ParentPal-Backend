import { processArticleUpload, getAllArticles } from "../service/articleService.js";

export const uploadDocx = async (req, res, next) => {
  try {
    // Karena middleware Zod sudah menggabungkan teks & file ke req.body
    const article = await processArticleUpload(req.body);
    res.status(201).json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// ... (fetchArticles controller tetap sama)

export const fetchArticles = async (req, res) => {
  try {
    const data = await articleService.getAllArticles();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};