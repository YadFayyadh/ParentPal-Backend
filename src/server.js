import express from "express"
import dotenv from "dotenv"
import articleRoutes from "./routes/articleRoutes.js"
import prisma from "./prisma/index.js"

dotenv.config()

const app = express()

app.use(express.json())

app.use("/articles", articleRoutes)

app.get("/", (req, res) => {
  res.send("API ParentPal hidup 🚀")
})

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000")
})