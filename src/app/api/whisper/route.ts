// src/app/api/whisper/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Force a Node.js runtime (not Edge) so we get stable Blob handling & full console
export const runtime = 'nodejs';
export const config  = { api: { bodyParser: false } };

export async function POST(req: Request) {
  try {
    const formData  = await req.formData();
    const fileField = formData.get('file');
    const langField = formData.get('lang');

    console.log('Whisper request—fileField:', fileField);
    if (fileField instanceof Blob) {
      console.log(' fileField.size:', fileField.size, 'type:', fileField.type);
    } else {
      console.warn(' fileField is not a Blob!', fileField);
    }
    console.log(' langField:', langField);

    if (!(fileField instanceof Blob) || typeof langField !== 'string') {
      console.error('Invalid form: missing file or lang');
      return NextResponse.json({ error: 'Invalid upload or missing lang' }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const transcript = await client.audio.transcriptions.create({
      file:     fileField,
      model:    'whisper-1',
      language: langField,
    });

    console.log('Whisper success:', transcript.text);
    return NextResponse.json({ text: transcript.text });
  } catch (e: any) {
    console.error('Whisper API Error:', e);
    return NextResponse.json(
      { error: e.message || 'Transcription failed' },
      { status: 500 }
    );
  }
}





