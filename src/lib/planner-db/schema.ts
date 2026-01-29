import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const splits = sqliteTable("splits", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  created_at: text("created_at").notNull(),
});

export const splitVariants = sqliteTable(
  "split_variants",
  {
    id: text("id").primaryKey(),
    split_id: text("split_id")
      .notNull()
      .references(() => splits.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    name: text("name"),
    position: integer("position").notNull(),
  },
  (t) => [unique("split_variants_split_id_key").on(t.split_id, t.key)]
);

export const sessionTemplates = sqliteTable("session_templates", {
  id: text("id").primaryKey(),
  variant_id: text("variant_id")
    .notNull()
    .references(() => splitVariants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  muscle_groups: text("muscle_groups"),
  position: integer("position").notNull(),
});

export const cycles = sqliteTable("cycles", {
  id: text("id").primaryKey(),
  split_id: text("split_id")
    .notNull()
    .references(() => splits.id, { onDelete: "cascade" }),
  rotation: text("rotation").notNull(),
  anchor_week_start: text("anchor_week_start").notNull(),
  created_at: text("created_at").notNull(),
  is_active: integer("is_active", { mode: "boolean" }).notNull(),
});
