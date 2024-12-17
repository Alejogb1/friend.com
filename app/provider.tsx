import { getCharacter } from "./(server)/data/character";
import { CharacterProvider } from "./context/CharacterContext";

export default async function CharacterInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const character = await getCharacter(); // Fetch character on the server
  return (
    <CharacterProvider initialCharacter={character}>
      {children}
    </CharacterProvider>
  );
}
