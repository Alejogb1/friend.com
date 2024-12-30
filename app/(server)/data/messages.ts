"server only"
import { eq } from "drizzle-orm";
import { db } from "../db/db";
import { messages } from "../db/schema";

// Insert a message
export const insertMessage = async (
  chatId: string,
  role: "user" | "assistant",
  content: string
) => {
  await db.insert(messages).values({
    chat_id: chatId,
    role,
    content,
  });
};

// Fetch chat messages
export const getChatMessages = async (chatId: string) => {
  return await db
    .select()
    .from(messages)
    .where(eq(messages.chat_id, chatId))
    .orderBy(messages.createdAt);
};
