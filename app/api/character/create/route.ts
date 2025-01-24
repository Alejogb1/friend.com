import { createCharacter } from "@/server/services/character";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const character = await createCharacter();
    return NextResponse.json({
      status: 200,
      message: "Success",
      character,
    });
  } catch (error) {
    return NextResponse.json({
      status: 500,
      message: "Failed",
      error,
    });
  }
}
