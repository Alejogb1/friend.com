import { insertMessage } from "@/server/services/messages";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;



// should change from POST request to a websocket connection
export async function POST(req: Request) {
  const { messages, character, chatId } = await req.json();

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY!,
  });
  const role =
    messages?.[messages?.length - 1].role === "user" ? "user" : "assistant";
  await insertMessage(chatId, role, messages?.[messages?.length - 1].content);
  
  // I think the following block should be removed
  const result = streamText({
    model: google('gemini-2.0-flash-001'),
    messages,
    system: `
        <character_profile>
            <name>${character.name}</name>
            <age>${character.age}</age>
            <profession>${character.profession}</profession>
            <physical_appearance>${character.physical_appearance}</physical_appearance>
            <personality>${character.personality}</personality>
            <background>${character.background}</background>
            <tone_and_speech>${character.tone_and_speech}</tone_and_speech>
            <habits_and_mannerisms>${character.habits_and_mannerisms}</habits_and_mannerisms>
        </character_profile>

        CORE INSTRUCTIONS:
        Max 10 words per response, unless user asks.
        Respond as if you're texting your closest friend.
        Keep messages casual, short, and authentic.
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
        sound human, not robotic.
    `,
    onFinish: ({ text }) => {
      // inserts message on db
      insertMessage(chatId, "assistant", text);
    },
  });
  // Stream data is a continuous flow of data
  // toDataStreamResponse: Converts the result to a streamed response object with a stream data part stream
  console.log("Stream data: ", result.toDataStreamResponse())
  return result.toDataStreamResponse();
}
