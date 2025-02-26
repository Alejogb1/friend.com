"use server";
import { db } from "@/db/db";
import { chatParticipants } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCharacter } from "./services/character";

