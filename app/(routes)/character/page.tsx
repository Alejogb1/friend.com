import { getAllCharacters } from "@/server/services/character"
import CharacterGallery from "./_components/character-gallery"

export default async function Character() {
  const characters = await getAllCharacters()
  return <CharacterGallery characters={characters} />

}