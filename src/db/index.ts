import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/referral_db";

// Disable prefetch for serverless compatibility if needed
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
