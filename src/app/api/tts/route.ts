// src/app/api/tts/route.ts
import { NextResponse } from 'next/server';
import textToSpeech from '@google-cloud/text-to-speech';

const client = new textToSpeech.TextToSpeechClient();

export async function POST(req: Request) {
  const { text, ttsTag } = await req.json() as { text: string; ttsTag: string };
  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: { languageCode: ttsTag, ssmlGender: 'NEUTRAL' },
    audioConfig: { audioEncoding: 'MP3' },
  });
  const base64 = (response.audioContent as Buffer).toString('base64');
  return NextResponse.json({ audio: base64 });
}


