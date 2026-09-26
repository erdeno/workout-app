import { getUser } from '@netlify/identity';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function getDatabaseUser() {
  const identityUser = await getUser();

  if (!identityUser) {
    return null;
  }

  const name =
    identityUser.user_metadata?.full_name ||
    identityUser.email;

  const rows = await sql`
    INSERT INTO users (
      identity_id,
      email,
      name
    )
    VALUES (
      ${identityUser.id},
      ${identityUser.email},
      ${name}
    )
    ON CONFLICT (identity_id)
    DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name
    RETURNING id, identity_id, email, name
  `;

  return rows[0];
}
