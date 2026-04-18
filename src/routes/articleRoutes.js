import express from "express";
import multer from "multer";
import {
    uploadDocx,
    fetchArticles
} from "../controllers/articleControllers.js";

import  validateRequest  from "../middleware/validateRequest.js";
import { articleUploadSchema } from "../validators/uploadArticleSchemas.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload-docx", upload.fields([
    { name: "file", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }
  ]),validateRequest(articleUploadSchema), uploadDocx);
router.get("/", fetchArticles);

export default router;