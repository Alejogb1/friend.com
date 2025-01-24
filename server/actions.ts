"use server";
import { db } from "@/db/db";
import { chatParticipants } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCharacter } from "./services/character";

export const swapCharacter = async () => {
  const { userId } = await auth();

  await db
    .delete(chatParticipants)
    .where(eq(chatParticipants.user_id, userId!));

  const response = await getCharacter();

  revalidatePath("/", 'page')
  return response;
};
