'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from '@/components/ui/separator'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { revalidatePath } from 'next/cache'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

interface Character {
  id: number
  name: string | null
  age: string | null
  profession: string | null
  physical_appearance: string | null
  personality: string | null
  background: string | null
  tone_and_speech: string | null
  habits_and_mannerisms: string | null
  profile_image: string | null
  initial_message: string | null
}

interface CharacterGalleryProps {
  characters: Character[]
}

export default function CharacterGallery({ characters }: CharacterGalleryProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [createProgress, setCreateProgress] = useState(false)

  const { data, refetch } = useQuery({
    queryKey: ["character-list"],
    queryFn: async () => {
      const response = await fetch("/api/character")
      const result = await response.json()
      setCreateProgress(false)

      return result?.characters
    },
    initialData: characters
  })

  const createCharacter = useMutation({
    mutationKey: ['create-character'], mutationFn: async () => {
      setCreateProgress(true)
      const response = await fetch("/api/character/create", {
        method: "POST"
      })

      const result = await response.json()
      refetch()
      return result
    }
  })

  const handleCreateCharacter = () => {
    createCharacter.mutate()
  }
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold">Character Gallery</h1>
        <div className='flex gap-2'>
          <Link href="/" prefetch>
            <Button variant="outline">
              Chat with AI
            </Button>
          </Link>
          <Button onClick={handleCreateCharacter} disabled={createProgress}>
            Create New Character
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <>
          {createProgress && <div className="bg-white rounded-lg shadow-lg overflow-hidden cursor-default">
            <div className="relative h-64">
              {/* Loading state for image */}
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            </div>
            <div className="p-4">
              {/* Loading state for name */}
              <div className="h-7 bg-gray-200 rounded-md animate-pulse mb-2 w-3/4" />
              {/* Loading state for profession */}
              <div className="h-5 bg-gray-200 rounded-md animate-pulse w-1/2" />
            </div>
          </div>}

          {data.map((character: any) => (
            <motion.div
              key={character.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition duration-300 hover:scale-105"
              whileHover={{ y: -5 }}
              onClick={() => setSelectedCharacter(character)}
            >
              <div className="relative h-64">
                <Image
                  src={character.profile_image!}
                  alt={character.name!}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{character.name}</h2>
                <p className="text-gray-600">{character.profession}</p>
              </div>
            </motion.div>
          ))}
        </>
      </div>

      <Dialog open={!!selectedCharacter} onOpenChange={() => setSelectedCharacter(null)}>
        {selectedCharacter && (
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{selectedCharacter.name}</DialogTitle>
              <DialogDescription>{selectedCharacter.profession}</DialogDescription>
            </DialogHeader>
            <ScrollArea className=" h-[600px] pr-4">
            <div className="space-y-6">
              <ProfileSection title="Physical Appearance">
                {selectedCharacter.physical_appearance}
              </ProfileSection>
              <Separator />
              <ProfileSection title="Personality">
                {selectedCharacter.personality}
              </ProfileSection>
              <Separator />
              <ProfileSection title="Background">
                {selectedCharacter.background}
              </ProfileSection>
              <Separator />
              <ProfileSection title="Tone and Speech">
                {selectedCharacter.tone_and_speech}
              </ProfileSection>
              <Separator />
              <ProfileSection title="Habits and Mannerisms">
                {selectedCharacter.habits_and_mannerisms}
              </ProfileSection>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Initial Message</h3>
                <blockquote className="italic border-l-2 pl-4 py-2 text-muted-foreground">
                  {selectedCharacter.initial_message}
                </blockquote>
              </div>
            </div>
          </ScrollArea>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-muted-foreground">{children}</p>
    </div>
  )
}
