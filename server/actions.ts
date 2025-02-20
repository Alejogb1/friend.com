"use server";
import { db } from "@/db/db";
import { chatParticipants } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCharacter } from "./services/character";

export const swapCharacter = async () => {
  console.log("Starting swapCharacter");
  const { userId } = await auth();
  console.log("UserId:", userId);
  await db
    .delete(chatParticipants)
    .where(eq(chatParticipants.user_id, userId!));

  const response = await getCharacter();
  console.log("Character response:", response);
  revalidatePath("/", 'page')
  return response;
};
