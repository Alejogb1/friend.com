"server only";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import {createGoogleGenerativeAI} from "@ai-sdk/google";
import { v4 as uuidv4 } from "uuid";
import { desc, eq,not,isNull } from "drizzle-orm";
import { fal } from "@fal-ai/client";
import { z } from "zod";
import { getChatMessages, insertMessage } from "./messages";
import { db } from "@/db/db";
import { character, chatParticipants } from "@/db/schema";
import { generateText } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});
fal.config({
  credentials: process.env.FAL_API_KEY!,
});

// https://sdk.vercel.ai/providers/ai-sdk-providers/google-generative-ai#schema-limitations adapt to this
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

function parseCharacter(text: string) {
  const lines = text.split('\n');
  const character: Record<string, string> = {};
  let currentKey = '';

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      currentKey = line.slice(0, colonIndex).trim();
      // Remove any quotes from the key
      currentKey = currentKey.replace(/['"]/g, '');
      let value = line.slice(colonIndex + 1).trim();
      // Remove any trailing commas and closing braces
      value = value.replace(/,\s*$/, '').replace(/}\s*$/, '');
      character[currentKey] = value;
    } else if (currentKey && line.trim()) {
      // Append additional lines to the current value
      character[currentKey] += ' ' + line.trim();
    }
  }

  return character;
}


function normalizeCharacterData(character: Record<string, string>) {
  if (!character) return null;

  // Map to exactly match our Zod schema
  const keyMap: Record<string, keyof z.infer<typeof CharacterType>> = {
    'Name': 'name',
    'Age': 'age',
    'Profession/Role': 'profession',
    'Physical Appearance': 'physical_appearance',
    'Personality': 'personality',
    'Background': 'background',
    'Tone and Speech Style': 'tone_and_speech',
    'Habits and Mannerisms': 'habits_and_mannerisms',
    'Initial Message': 'initialMessage'  // Note the camelCase to match schema
  };

  const normalized: Partial<z.infer<typeof CharacterType>> = {};
  
  for (const [key, value] of Object.entries(character)) {
    const normalizedKey = keyMap[key];
    if (normalizedKey) {
      // Clean up the value by removing quotes and extra whitespace
      let cleanValue = value
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .replace(/",?$/, '')         // Remove trailing quote and optional comma
        .trim();
      
      normalized[normalizedKey] = cleanValue;
    }
  }

  // Ensure all required fields are present
  const requiredKeys = Object.keys(CharacterType.shape);
  for (const key of requiredKeys) {
    if (!normalized[key as keyof z.infer<typeof CharacterType>]) {
      throw new Error(`Missing required field: ${key}`);
    }
  }

  return normalized as z.infer<typeof CharacterType>;
}
export const createCharacter = async () => {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Authentication required');
  }

  // Get valid existing characters with names
  const existingCharacters = await db.select()
    .from(character)
    .where(not(isNull(character.name)));
  // Format existing characters for prompt
  const existingCharacterText = existingCharacters
    .map(c => `
      - Name: ${c.name}
      Profession: ${c.profession}
      Personality: ${c.personality}
      Background: ${c.background?.slice(0, 100)}...
    `).join('\n');
      console.log("these are the results: ", existingCharacterText)
  const chatResult = await generateText({
    model: google("gemini-1.5-flash-latest", {
      structuredOutputs:false,
    }),
    messages: [
      {
          role: "user",
          content: [
            {
              type: 'text',
              text: `
                    "Generate a unique character as a JSON character object with the following structure:
                    {
                    Name: Create a memorable name. (string)
                    Age: Choose any age between 10 and 80.(string)
                    Profession/Role: Assign a creative profession or role around the software engineering role, such as explorer, inventor, chef, or time traveler.(string)
                    Physical Appearance: Describe character's facial physical appearance. (string)
                    Personality: Define their personality with 2-3 traits, such as empathetic, sarcastic, curious, or daring. But everyone should be a little serious (string)
                    Background: Write a brief backstory with key life events, skills, or accomplishments that shaped them. (string)
                    Tone and Speech Style: Define their speech style—casual, formal, humorous, dramatic, etc.—and include quirks like slang, metaphors, or pauses. (string)
                    Habits and Mannerisms: Describe unique behaviors or quirks like twirling hair, tapping a pen, or using idioms. (string)
                    Initial Message: "Assuming you are this character, Craft the first text message in 1 to 5 words that this character would send to someone they want to be friends with in twitter, Keep messages casual, short, and authentic.
                    }
                    
                    Show genuine emotion and personality.
                    Adapt tone based on context of conversation.
                    Never break character or sound too formal.
                    Don't be poetic and corny


                    DO NOT NAME THE PERSON ZARA. DO NOT MAKE THE CHARACTERS OCCUPATION URBAN FORGER.

                    THE CHARACTER HAS TO BE A REAL HUMAN. NO SCI-FI, NO ANIME. A REAL PERSON.

                    MAKE SURE TO CREATE A COMPLETELY DIFFERENT CHARACTER THAN THE ONES LISTED BELOW, THEY SHOULD NOT HAVE ANYTHING SIMILIAR AT ALL:
                    ${existingCharacterText}

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
            }
          ]
        
      },
    ],
    });

    let parsedCharacter = parseCharacter(chatResult.text);
  
    if (!parsedCharacter || Object.keys(parsedCharacter).length === 0) {
      throw new Error('Failed to parse character data');
    }  
    const normalizedCharacter = normalizeCharacterData(parsedCharacter);
    
    if (!normalizedCharacter) {
      throw new Error('Failed to normalize character data');
    }
  
    // Validate the character data
    const validatedCharacter = CharacterType.parse(normalizedCharacter);

    return insertCharacter({
      ...validatedCharacter,
    });
  };

  const createProfileImage = async (description: string) => {
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
          },
          body: JSON.stringify({
            inputs: description + 
              ", professional headshot photo, high quality, 4k, detailed face, photography, photo-realistic, centered, looking at camera, linkedin profile picture style",
            parameters: {
              negative_prompt: "cartoon, anime, illustration, painting, drawing, blurry, deformed",
              num_inference_steps: 50,
              guidance_scale: 7.5,
            }
          }),
        }
      );
  
      if (!response.ok) {
        throw new Error(`Failed to generate image: ${response.statusText}`);
      }
  
      // The response is the image binary data
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      
      return { imageUrl };
    } catch (error) {
      console.error('Image generation failed:', error);
      return { imageUrl: null };
    }
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
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJZG-8Pk5VYr_MOP4Ks3uEeZdArTUAizNRwg&s": imageUrl,
  initialMessage,
}: any) => {
  const [newCharacter] = await db.insert(character).values({

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

  }).returning();


  return newCharacter; 
};

export const swapCharacter = async () => {
  const { userId } = await auth();
  if(!userId) {
    throw new Error('Unauthenticated - please log in');
  }
  try {
    await db
      .delete(chatParticipants)
      .where(eq(chatParticipants.user_id, userId));

    return await getCharacter(userId);
  } catch (error) {
    console.error('Swap failed:', error);
    throw new Error('Failed to swap characters');
  }};

let lastCharacterIndex = -1;

function getRandomIndex(length: number) {
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * length);
  } while (newIndex === lastCharacterIndex && length > 1);

  lastCharacterIndex = newIndex;
  return newIndex;
}

export const getCharacter = async (userId: string | null) => {



  const existingParticipant = await db

    .select()

    .from(chatParticipants)

    .where(eq(chatParticipants.user_id, userId!))

    .limit(1);


  if (existingParticipant.length > 0) {

    const existingCharacter = await db

      .select()

      .from(character)

      .where(eq(character.id, existingParticipant[0].character_id!))

      .limit(1);


    const messages = await getChatMessages(existingParticipant?.[0]?.chat_id);
    console.log("existing character", existingCharacter);

    return {

      character: existingCharacter?.[0],

      chatParticipants: existingParticipant?.[0],

      messages,

    };

  }


  // Create a new character if no existing participant

  const newCharacter = await createCharacter();

  const chatId = uuidv4();


  await db.insert(chatParticipants).values({

    chat_id: chatId,

    character_id: newCharacter.id,

    user_id: userId,

  });


  if (newCharacter.initial_message) {

    await insertMessage(chatId, "assistant", newCharacter.initial_message);

  }


  return {

    character: newCharacter,

    messages: [],

  };

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

export const getAllCharacters = async () => {
  return db.select().from(character).orderBy(desc(character.id));
};