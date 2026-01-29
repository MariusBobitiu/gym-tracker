import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  driver: "expo",
  schema: "./src/lib/planner-db/schema.ts",
  out: "./drizzle",
});
