'use client';

import { useState, useEffect } from 'react';
import { useAuth } from "@clerk/nextjs";
import Chat from '@/components/chat';
import Header from '@/components/header';
import RepoInput from '@/components/ui/repo-input';



export default function Home() {
  const [repoUrl, setRepoUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('repoUrl') || '';
    }
    return '';
  });

  const [info, setInfo] = useState<any>(null);
  const { isLoaded, userId } = useAuth();



  useEffect(() => {
    const fetchCharacter = async () => {
      if (repoUrl && userId) {
        try {
          const response = await fetch('/api/character');
          if (!response.ok) throw new Error('Failed to fetch character');
          const characterInfo = await response.json();
          setInfo(characterInfo);
        } catch (error) {
          console.error('Failed to fetch character:', error);
        }
      }
    };

    fetchCharacter();
  }, [repoUrl, userId]);

  if (!isLoaded || !userId) {
    return <div>Loading user...</div>;
  }
  const handleSetRepoUrl = (url: string) => {
    setRepoUrl(url);

    if (typeof window !== 'undefined') {
      localStorage.setItem('repoUrl', url);
    }
  };
  if (!repoUrl) {
    return <RepoInput onSubmit={handleSetRepoUrl} />;
  }

  if (!info) {
    return <div>Loading character...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-screen w-full bg-white">
      <div className="flex flex-col w-full justify-center items-center border-b fixed ">
        <Header info={info} />
      </div>
      <Chat chatMessages={info?.messages} info={{...info, repoUrl}} />
    </div>
  );
}