import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
// Call from a scoped backend Layer. Close sql with sql.end() on release.
export function createDatabase(url: string) {
  const sql = postgres(url);
  return { db: drizzle(sql), close: () => sql.end() };
}
