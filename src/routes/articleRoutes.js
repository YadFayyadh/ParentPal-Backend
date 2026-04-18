import express from "express";
import multer from "multer";
import * as articleController from "../controllers/articleController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload-docx", upload.single("file"), articleController.uploadDocx);
router.get("/", articleController.fetchArticles);

export default router;