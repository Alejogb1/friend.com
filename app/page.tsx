import Chat from '@/components/chat';
import Header from '@/components/header';
import { getCharacter } from './(server)/data/character';
import { userInfo } from './(server)/data/user/user-info';

export default async function Home() {

  const { result } = await userInfo()

  const info = await getCharacter()

  return (
    <div className="flex flex-col items-center justify-between min-h-screen w-full bg-white">
      {/* Header */}
      <div className="flex flex-col w-full justify-center items-center border-b fixed ">
        <Header info={info} />
      </div>
      {/** Chat list and Chat form */}
      <Chat userInfo={result!} chatMessages={info?.messages} info={info}  />
    </div>
  );
}