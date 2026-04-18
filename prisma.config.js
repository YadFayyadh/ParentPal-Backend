// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    adapter: "postgresql",          // ✅ required in Prisma 7
    url: process.env.DATABASE_URL,  // ✅ connection string from .env
  },
});
