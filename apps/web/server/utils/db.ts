import { createClient } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from '../../drizzle/schema';

export type AppDatabase = LibSQLDatabase<typeof schema>;

const webRoot = fileURLToPath(new URL('../..', import.meta.url));
const migrationsFolder = fileURLToPath(new URL('../../drizzle/migrations', import.meta.url));

let database: AppDatabase | null = null;

export function resolveDatabaseFile(configured?: string): string {
  const value = configured || './data/bunpro-nakama.sqlite';
  const withoutScheme = value.startsWith('file:') ? value.slice('file:'.length) : value;
  return isAbsolute(withoutScheme) ? withoutScheme : resolve(webRoot, withoutScheme);
}

export async function openDatabase(filePath: string): Promise<AppDatabase> {
  mkdirSync(dirname(filePath), { recursive: true });
  const client = createClient({ url: `file:${filePath}` });
  const next = drizzle(client, { schema });
  await migrate(next, { migrationsFolder });
  return next;
}

export async function getDb(configuredPath?: string): Promise<AppDatabase> {
  if (database) return database;
  database = await openDatabase(resolveDatabaseFile(configuredPath));
  return database;
}
