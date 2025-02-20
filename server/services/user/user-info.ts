"server only";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export const userInfo = async () => {
  const { userId } = await auth();
  const isAuthenticated = !!userId;

  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.user_id, userId!));
    return {
      success: true,
      result: result?.[0],
      error: null,
      isAuthenticated,
    };
  } catch (error) {
    console.log(error)
    return {
      success: false,
      result: null,
      error,
      isAuthenticated,
    };
  }
};
