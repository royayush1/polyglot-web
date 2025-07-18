import { NextResponse } from 'next/server';
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { history, lang } = await req.json();
  console.log("Lang: ", lang);
  console.log("History: ", history);
  const systemMessage = {
    role: 'system',
    content: `You are a ${lang} tutor. Converse with the user in ${lang}. The user is only supposed to reply to you and converse in ${lang}. Also give them a warning if they don't respond in ${lang}. The whole point is for the user to learn to talk in ${lang}`
  };
  const messages = [systemMessage, ...history];
  const resp = await openai.chat.completions.create({ model: 'gpt-4.1', messages, temperature: 1.2 });
  const reply = resp.choices[0].message.content!.trim();
  return NextResponse.json({ reply });
}