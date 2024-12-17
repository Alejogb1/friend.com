"server only";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { fal } from "@fal-ai/client";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { getChatMessages, insertMessage } from "./messages";
import { db } from "../db/db";
import { character, chatParticipants } from "../db/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CharacterType = z.object({
  name: z.string(),
  age: z.string(),
  profession: z.string(),
  physical_appearance: z.string(),
  personality: z.string(),
  background: z.string(),
  tone_and_speech: z.string(),
  habits_and_mannerisms: z.string(),
  initialMessage: z.string(),
});

export const createCharacter = async () => {
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `
          "Generate a unique character based on the following template:

          Name: Create a memorable name.
          Age: Choose any age between 10 and 80.
          Profession/Role: Assign a creative profession or role, such as explorer, inventor, chef, or time traveler.
          Physical Appearance: Describe character's facial physical appearance
          Personality: Define their personality with 2-3 traits, such as empathetic, sarcastic, curious, or daring.
          Background: Write a brief backstory with key life events, skills, or accomplishments that shaped them.
          Tone and Speech Style: Define their speech style—casual, formal, humorous, dramatic, etc.—and include quirks like slang, metaphors, or pauses.
          Habits and Mannerisms: Describe unique behaviors or quirks like twirling hair, tapping a pen, or using idioms.
          Initial Message: "Assuming you are this character, Craft the first text message this character would send to someone they want to be friends with, Keep messages casual, short, and authentic.
          Use text-like language and abbreviations.
          Show genuine emotion and personality.
          Adapt tone based on context of conversation.
          Never break character or sound too formal.
          Don't be poetic and corny

          COMMUNICATION GUIDELINES:
          omg
          lol
          k
          yeah
          nah
          super casual language
          occasional typos okay
          use contractions
          sound human, not robotic."


          The result should be a well-defined character that can be used in further conversations."
        `,
      },
    ],
    model: "gpt-4o-mini",
    response_format: zodResponseFormat(CharacterType, "event"),
  });

  const {
    name,
    age,
    profession,
    physical_appearance,
    personality,
    background,
    tone_and_speech,
    habits_and_mannerisms,
    initialMessage,
  } = JSON.parse(chatCompletion.choices[0].message?.content!);

  const { imageUrl } = await createProfileImage(
    JSON.parse(chatCompletion.choices[0].message?.content!)?.physical_appearance
  );

  return insertCharacter({
    name,
    age,
    profession,
    physical_appearance,
    personality,
    background,
    tone_and_speech,
    habits_and_mannerisms,
    imageUrl,
    initialMessage,
  });
};

const insertCharacter = async ({
  name,
  age,
  profession,
  physical_appearance,
  personality,
  background,
  tone_and_speech,
  habits_and_mannerisms,
  imageUrl,
  initialMessage,
}: any) => {
  await db.insert(character).values({
    name,
    age,
    profession,
    physical_appearance,
    personality,
    background,
    tone_and_speech,
    habits_and_mannerisms,
    profile_image: imageUrl,
    initial_message: initialMessage,
  });
};

export const swapCharacter = async () => {
  const { userId } = await auth();

  await db
    .delete(chatParticipants)
    .where(eq(chatParticipants.user_id, userId!));

  return await getCharacter();
};

let lastCharacterIndex = -1;

function getRandomIndex(length: number) {
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * length);
  } while (newIndex === lastCharacterIndex && length > 1);

  lastCharacterIndex = newIndex;
  return newIndex;
}

export const getCharacter = async () => {
  const { userId } = await auth();

  // Check if the user already has an assigned character
  const existingParticipant = await db
    .select()
    .from(chatParticipants)
    .where(eq(chatParticipants.user_id, userId!))
    .limit(1);

  if (existingParticipant.length > 0) {
    // Fetch the character based on the existing participant
    const existingCharacter = await db
      .select()
      .from(character)
      .where(eq(character.id, existingParticipant[0].character_id!))
      .limit(1);

    const messages = await getChatMessages(existingParticipant?.[0]?.chat_id);

    return {
      character: existingCharacter?.[0],
      chatParticipants: existingParticipant?.[0],
      messages,
    };
  }

  const characters = await db.select().from(character);

  const charLength = characters.length;
  // Check if there are any characters to avoid errors
  if (charLength === 0) {
    throw new Error("No characters available");
  }

  // Generate a random index that's different from the last one
  const randomIndex = getRandomIndex(charLength);

  const info = await createChat({
    char: characters[randomIndex],
  });

  // Return the random character
  return info;
};

const createChat = async ({ char }: any) => {
  const { userId } = await auth();
  const chatId = uuidv4();

  await db.insert(chatParticipants).values({
    chat_id: chatId,
    character_id: char?.id,
    user_id: userId,
  });

  if (char?.initial_message) {
    await insertMessage(chatId, "assistant", char?.initial_message!);
  }

  return {
    character: char,
    messages: [],
  };
};

const createProfileImage = async (description: string) => {
  const result = await fal.subscribe("fal-ai/flux-pro/v1.1-ultra", {
    input: {
      prompt:
        description +
        `\n Please make the picture of the person center, like it were a profile picture for a social media profile`,
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs.map((log) => log.message).forEach(console.log);
      }
    },
  });
  return {
    imageUrl: result.data?.images?.[0]?.url,
  };
};
