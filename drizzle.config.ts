import { defineConfig } from "drizzle-kit";

if (!process.env.VITE_SUPABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.VITE_SUPABASE_URL,
  },
});
