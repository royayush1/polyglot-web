/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import textToSpeech from '@google-cloud/text-to-speech';

const clientConfig = process.env.GOOGLE_CREDENTIALS
  ? { credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS) }
  : {};
const client = new textToSpeech.TextToSpeechClient(clientConfig);


export async function POST(req: Request) {
  try{
    const { text, ttsTag } = await req.json() as { text: string; ttsTag: string };
  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: { languageCode: ttsTag, ssmlGender: 'NEUTRAL' },
    audioConfig: { audioEncoding: 'MP3' },
  });
  const base64 = (response.audioContent as Buffer).toString('base64');
  return NextResponse.json({ audio: base64 });
} catch(e:any) {
    console.error('Google API Error:', e);
    return NextResponse.json(
      { error: e.message || 'Transcription failed' },
      { status: 500 }
    );

}};


