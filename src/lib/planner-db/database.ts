import { open } from "@op-engineering/op-sqlite";
import { drizzle } from "drizzle-orm/op-sqlite";

const opsqliteDb = open({
  name: "planner",
});

export const db = drizzle(opsqliteDb);
