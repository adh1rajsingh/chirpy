import { asc, eq } from "drizzle-orm";
import { db } from "../index.js";
import { NewUser, users } from "../schema.js";


export async function upgradeToChirpRed(id: string) {
  const [result] = await db
    .update(users)
    .set({ is_chirpy_red: true })
    .where(eq(users.id, id))
    .returning();
  return result;
}

export async function getUserByEmail(email: string) {
  const [result] = await db.select().from(users).where(eq(users.email, email));
  return result;
}

export async function createUser(user: NewUser) {
  const [result] = await db
    .insert(users)
    .values(user)
    .onConflictDoNothing()
    .returning();
  return result;
}

export async function updateUser(
  userId: string,
  updates: { email?: string; hashed_password?: string }
) {
  const [result] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId)) 
    .returning();
  return result;
}

export async function reset() {
  await db.delete(users);
}



