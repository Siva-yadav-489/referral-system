import dotenv from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

dotenv.config({ path: ".env.local" });

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined");
  }

  const client = postgres(databaseUrl);
  const db = drizzle(client);

  try {
    console.log("Starting migration...");

    await migrate(db, {
      migrationsFolder: "./drizzle",
    });

    console.log("Migrations completed successfully.");
  } catch (error) {
    console.error("\n========== MIGRATION FAILED ==========");
    console.error(error);
    console.error("======================================\n");

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("\n========== UNHANDLED ERROR ==========");
  console.error(error);
  console.error("====================================\n");

  process.exitCode = 1;
});
