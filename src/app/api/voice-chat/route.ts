import { NextResponse } from 'next/server';
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { history, lang } = await req.json();
  console.log("Lang: ", lang);
  const systemMessage = {
    role: 'system',
    content: `You are a friendly ${lang} language tutor and the user's best friend. Converse with the user based on ${history}`
  };
  const messages = [systemMessage, ...history];
  const resp = await openai.chat.completions.create({ model: 'gpt-4.1', messages, temperature: 1.2 });
  const reply = resp.choices[0].message.content!.trim();
  return NextResponse.json({ reply });
}