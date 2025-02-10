import Chat from '@/components/chat';
import Header from '@/components/header';
import { getCharacter, createCharacter } from '@/server/services/character';
import { userInfo } from '@/server/services/user/user-info';
import { redirect } from 'next/navigation';
export default async function Home() {
  const { result } = await userInfo()

  let info;
  try {
    info = await getCharacter();
  } catch (error: any) {
    if (error.message === "No characters available") {
      // Create initial character
      await createCharacter();
      // Try getting the character again
      info = await getCharacter();
    } else {
      console.error(error);
      throw error;
    }
  }

  // Ensure we have info before rendering
  if (!info?.character) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading character...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-screen w-full bg-white">
      {/* Header */}
      <div className="flex flex-col w-full justify-center items-center border-b fixed ">
        <Header info={info} />
      </div>
      {/** Chat list and Chat form */}
      <Chat chatMessages={info?.messages} info={info}  />
    </div>
  );
}