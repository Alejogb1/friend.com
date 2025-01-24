import { insertMessage } from "@/server/services/messages";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, character, chatId } = await req.json();

  const role =
    messages?.[messages?.length - 1].role === "user" ? "user" : "assistant";
  await insertMessage(chatId, role, messages?.[messages?.length - 1].content);

  const result = streamText({
    model: openai("gpt-4o"),
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
      insertMessage(chatId, "assistant", text);
    },
  });

  return result.toDataStreamResponse();
}
