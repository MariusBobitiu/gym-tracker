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

export const cycleState = sqliteTable("cycle_state", {
  id: text("id").primaryKey(),
  cycle_id: text("cycle_id")
    .notNull()
    .unique()
    .references(() => cycles.id, { onDelete: "cascade" }),
  current_variant_key: text("current_variant_key").notNull(),
  session_index_a: integer("session_index_a").notNull().default(0),
  session_index_b: integer("session_index_b").notNull().default(0),
  session_index_c: integer("session_index_c").notNull().default(0),
  last_completed_at: text("last_completed_at"),
  created_at: text("created_at").notNull(),
});
