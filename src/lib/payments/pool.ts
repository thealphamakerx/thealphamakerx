import { Pool, type PoolClient } from "pg";

const globalPayments = globalThis as typeof globalThis & { paymentPool?: Pool };
export const paymentPool = globalPayments.paymentPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 10_000 });

export async function paymentTransaction<T>(run: (client: PoolClient) => Promise<T>) {
  const client = await paymentPool.connect();
  try {
    await client.query("BEGIN");
    const result = await run(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}
