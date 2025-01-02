'use client';

import { Button } from '@/components/ui/button';
import { UserButton } from '@clerk/nextjs';
import { useChat } from 'ai/react';
import { Send } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function Chat({ userInfo, chatMessages, info }: {
  userInfo: {
    id: number,
    user_id: string | null,
    name: string | null,
    email: string | null,
    createdAt: Date | null,
    profile_image_url: string | null
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chatMessages: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info: any,
}) {
  const firstRender = useRef(true);


  const { messages, setMessages, input, handleInputChange, handleSubmit } = useChat({
    body: {
      character: info?.character,
      chatId: info?.chatParticipants?.chat_id,
    },
    initialMessages: chatMessages,
  });
  // console.log("messages?.[0]?.content", messages?.[0]?.content)
  // console.log("chatMessages", chatMessages?.[0].content)

  // Messages are cleared if character is changed
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    if (messages?.[0]?.content === undefined) {
      return
    }

    setMessages([...chatMessages])

  }, [info?.chatParticipants?.chat_id])


  return (
    <>
      <div className="flex flex-col w-full max-w-screen-md min-h-[80vh] px-4 my-[5rem]">
        {messages.map((m, index) => (
          <main key={index}>
            <div className={m.role === 'user' ? 'flex items-start w-full gap-2 mb-4 justify-end' : 'flex items-start w-full gap-2 mb-4 justify-start'}>
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={m.role === "user" ? userInfo?.profile_image_url! : info?.character?.profile_image}
                  alt="User"
                  width={32}
                  height={32}
                  quality={95}
                  sizes={"48px"}

                  className="w-full h-full object-cover"
                />

              </div>
              <div className={`${m.role !== "user" ? "bg-gray-100" : "bg-black text-white"} rounded-2xl p-3 max-w-[80%]`}>
                <p>
                  {m.content}
                </p>
              </div>
            </div>
          </main>
        ))}
      </div>

      {/* Footer */}
      <footer className="p-2 w-full bg-white fixed bottom-0">
        <div className="flex justify-center items-end gap-4 w-full">
          <div className='hidden lg:flex items-end justify-start space-x-4 w-full '>
            <span className="text-xs font-semibold ">rasmic.xyz © 2024</span>
            <Link href="https://rasmic.xyz" target='_blank' className="text-xs font-semibold hover:underline">company ↗</Link>
          </div>
          <div
            className="flex justify-center items-center w-full gap-2">
            <div>
              <UserButton />
            </div>
            <form onSubmit={handleSubmit} className='flex justify-center items-center w-full gap-2'>
              <input
                type="text"
                placeholder="Message"
                className="w-full px-4 py-2 rounded-full bg-gray-100 focus:outline-none"
                value={input}
                onChange={handleInputChange}
              />
              <Button size="icon" variant="ghost">
                <Send />
              </Button>
            </form>
          </div>
          <div className='hidden lg:flex items-end justify-end space-x-4 w-full'>
            <Link target='_blank' href="https://x.com/rasmickyy" className="text-xs font-semibold hover:underline">X ↗</Link>
            <Link target='_blank' href="https://www.youtube.com/@rasmic" className="text-xs font-semibold hover:underline">YouTube ↗</Link>
          </div>
        </div>
      </footer>
    </>
  )
}