import { getCharacter } from '@/server/services/character';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const characterInfo = await getCharacter(userId);
    return NextResponse.json(characterInfo);
  } catch (error) {
    console.error('Failed to fetch character:', error);
    return NextResponse.json({ error: 'Failed to fetch character' }, { status: 500 });
  }
}