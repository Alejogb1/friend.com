"use client";

import { Button } from "@/components/ui/button";
import { insertMessage, getChatMessages } from "@/server/services/messages";
import { UserButton, useUser } from "@clerk/nextjs";
import { useChat } from "ai/react";
import { Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Key, useEffect, useRef, useState } from "react";
import { Markdown } from "./markdown";
import io, { Socket } from 'socket.io-client';
import { LoadingSpinner } from './loading-spinner';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  filePaths?: string[];
};
interface ChatProps {
  chatMessages: any;
  info: {
    character?: {
      id: number;
      name: string | null;
      age: string | null;
      profession: string | null;
      physical_appearance: string | null;
      personality: string | null;
      background: string | null;
      tone_and_speech: string | null;
      habits_and_mannerisms: string | null;
      profile_image: string | null;
      initial_message: string | null;
    };
    chatParticipants?: {
      chat_id?: string;
    };
    repoUrl: string;
  };
}
type SocketMessage = {
  data: Message;
};


function parseRepoUrl(url: string): { owner: string; repo: string } {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname !== 'github.com') {
      throw new Error('Not a valid GitHub URL');
    }
    
    const parts = parsedUrl.pathname.split('/').filter(Boolean);
    console.log("parts:", parts);
    if (parts.length < 2) {
      throw new Error('Invalid GitHub repository URL');
    }
    
    return {
      owner: parts[0],
      repo: parts[1]
    };
  } catch (error) {
    throw new Error('Invalid GitHub URL');
  }
}

export default function Chat({ chatMessages, info }: ChatProps) {

  useEffect(() => {
    const fetchMessages = async () => {
      if (info.chatParticipants?.chat_id) {
        const pastMessages = await getChatMessages(info.chatParticipants.chat_id);
        console.log(pastMessages)
        setMessages(pastMessages);
      }
    };

    fetchMessages();
  }, [info.chatParticipants?.chat_id]);

  const [socket, setSocket] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>(chatMessages);
  const [input, setInput] = useState('');
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  // Messages are cleared if character is changed
  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
    });
    setSocket(newSocket);

    newSocket.on("connect", () => console.log("Socket connected:", newSocket.id));

    console.log("newSocket.on('message', ...) is being called");
    newSocket.on("message", async (message: Message) => {
      const parsedInput = message.content.split("\n");
      const extractedFilePaths = parsedInput.filter(line => line.includes("/") || line.endsWith(".md") || line.endsWith(".py"));
      let messageContent = parsedInput.filter(line => !line.includes("/") && !line.endsWith(".md") && !line.endsWith(".py")).join("\n");
      if (messageContent == '') {
        // messageContent equals to the last element of extractedFilePaths
        messageContent = extractedFilePaths[extractedFilePaths.length - 1];
      };
      // Insert the assistant's message into the database
      if (info.chatParticipants?.chat_id) {
        try {
          console.log("Inserting assistant message:", messageContent);
          await insertMessage(info.chatParticipants.chat_id, 'assistant', messageContent);
        } catch (error) {
          console.error('Error inserting assistant message:', error);
        }
      }
      // Final cleanup for residual paths
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: messageContent,
        timestamp: message.timestamp,
        filePaths: extractedFilePaths,
      }]);
    });
            
    newSocket.on("error", console.error);

    return () => {
      newSocket.disconnect();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
  
    setIsLoading(true);
    let userMessage: Message = { 
      role: 'user', 
      content: input
    };
    
    try {

      const parsedInput = input.split("\n");
      const extractedFilePaths = parsedInput.filter(line => line.includes("/"));
      const messageToSend = parsedInput.filter(line => !line.includes("/")).join("\n");

      userMessage = { ...userMessage, content: messageToSend };
      setMessages(prev => [...prev, userMessage]);
      await socket.emitWithAck('message', {
        ...userMessage,
        character: info.character,
        chatId: info.chatParticipants?.chat_id,
        repoUrl: parseRepoUrl(info.repoUrl),
      });
      // Insert the message into the database
      if (info.chatParticipants?.chat_id) {
        await insertMessage(info.chatParticipants.chat_id, 'user', messageToSend);
      }

    } catch (error) {
      console.error('Message send error:', error);
    } finally {
      setInput('');
      setIsLoading(false);
    }
  };
  
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
    };
  return (
    <>
    <div className="flex flex-col w-full max-w-screen-md min-h-[80vh] px-4 my-[5rem]">
    <p className="text-sm text-gray-500 mb-4">
      knows about 
      <a 
        href={info.repoUrl || "hello.org"} 
        target="_blank" 
        rel="noreferrer"
        className="text-blue-600 hover:underline"
      >
        {" "} {new URL(info.repoUrl || "hello.org").pathname.split('/').pop()}
      </a>
    </p>
    {messages && Array.isArray(messages) && messages.map((m: { role: string; content: string; filePaths?: string[] }, index: Key | null | undefined) => (
      <main key={index} className="flex flex-col">
        <div
          className={
            m.role === "user"
              ? "flex items-start w-full gap-2 mb-4 justify-end"
              : "flex items-start w-full gap-2 mb-4 justify-start"
          }
        >
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={"https://pbs.twimg.com/profile_images/1827692540692172800/41GYNNNX_400x400.jpg"}
              alt="User"
              width={32}
              height={32}
              quality={95}
              sizes={"48px"}
              className="w-full h-full object-cover"
            />
          </div>
      <div>
        {m.filePaths && m.filePaths.length > 0 && (
          <div className="flex flex-col">
            {m.filePaths.map((filePath, index) => (
              <div
                rel="noreferrer"
                className="text-[12px] text-blue-600 underline hover:text-blue-700 flex items-center gap-1 pb-1 cursor-pointer"
                style={{ cursor: 'pointer' }}
              >
                <img src="https://cdn-icons-png.flaticon.com/256/25/25231.png" alt="GitHub" className="w-4 h-4" />
                {filePath}
              </div>
            ))}
          </div>
        )}
        {m && m.content && (
          m.content.split('\n').map((line, index) => (
            line.trim() !== "" && (
              <div
                className={`${m.role === "user"
                  ? "bg-[#007AFF] text-white rounded-[20px] rounded-tr-[4px]"
                  : "bg-[#E9E9EB] dark:bg-[#1C1C1E] text-black dark:text-white rounded-[20px] rounded-tl-[4px]"
                  } flex flex-col px-[12px] py-[8px] max-w-[400px] w-fit leading-[1.35]`}
              >
                <div className="text-[14px] py-1">
                  <Markdown>{line}</Markdown>
                </div>
              </div>
            )
          ))
        )}
      </div>
    </div>
  </main>
))}
  </div>

  {/* Footer */}
  <footer className="p-2 w-full bg-white fixed bottom-0">
    <div className="flex justify-center items-end gap-4 w-full">
      <div className="hidden lg:flex items-end justify-start space-x-4 w-full ">

      </div>
      <div className="flex justify-center items-center w-full gap-2">
        <div>
          {user?.imageUrl ? (
            <UserButton />
          ) : (
            <Image
              src="https://utfs.io/f/MD2AM9SEY8Guqkfz9hSyUVrQdv8uT1kEfN6WayA0SCYRs9x5"
              alt="User"
              width={30}
              height={30}
              quality={95}
              sizes={"30px"}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex justify-center items-center w-full gap-2"
        >
          <input
            type="text"
            placeholder="Message"
            className="w-full px-4 py-2 rounded-full bg-gray-100 focus:outline-none"
            value={input}
            disabled={isLoading}
            onChange={handleInputChange}
          />
          <Button size="icon" variant="ghost" disabled={isLoading}>
            {isLoading ? <LoadingSpinner /> : <Send />}
          </Button>
        </form>
      </div>
      <div className="hidden lg:flex items-end justify-end space-x-4 w-full">
      </div>
    </div>
  </footer>
</>
);
}
