import * as articleService from "../service/articleService.js";

export const uploadDocx = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });
    
    const article = await articleService.processArticleUpload(req.file);
    res.status(201).json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const fetchArticles = async (req, res) => {
  try {
    const data = await articleService.getAllArticles();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};