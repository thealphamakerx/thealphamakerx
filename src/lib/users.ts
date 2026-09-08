import { authPool } from "@/lib/auth";

export async function getUserById(id: string) {
  const result = await authPool.query<{ id: string; name: string; email: string }>(
    'select id, name, email from "user" where id = $1',
    [id]
  );

  return result.rows[0] ?? null;
}
