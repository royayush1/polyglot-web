import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs, {createReadStream} from 'fs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = { api: { bodyParser: false } };

export async function POST(req: Request) {
    
    // 1) Parse the multipart form into a standard Web FormData
  const formData = await req.formData()
  const fileField = formData.get('file')
  const langField = formData.get('lang')

  // 2) Validate the inputs
  if (!(fileField instanceof Blob) || typeof langField !== 'string') {
    return NextResponse.json(
      { error: 'Invalid upload or missing lang' },
      { status: 400 }
    )
  }

  // 3) Call Whisper, passing the Blob directly
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const transcript = await client.audio.transcriptions.create({
      file: fileField,      // ← this Blob is Uploadable
      model: 'whisper-1',
      language: langField,  // your BCP-47 code string
    })
    return NextResponse.json({ text: transcript.text })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Transcription failed' },
      { status: 500 }
    )
  }
  }




