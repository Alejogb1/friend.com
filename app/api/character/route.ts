import { NextResponse } from "next/server";
import { createCharacter, getAllCharacters } from "../../services/character";

export async function GET() {
  try {
    const characters = await getAllCharacters();
    return NextResponse.json({
      status: 200,
      message: "Success",
      characters,
    });
  } catch (error) {
    return NextResponse.json({
      status: 500,
      message: "Failed",
      error,
    });
  }
}
