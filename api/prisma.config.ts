import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // CLI operations (db push, migrate, studio) need a direct, non-pooled
    // connection — pgbouncer's transaction pooler hangs on schema/DDL ops.
    // The running app still connects via DATABASE_URL (see src/lib/prisma.ts).
    url: process.env.DIRECT_URL!,
  },
});
