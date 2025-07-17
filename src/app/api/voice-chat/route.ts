import { NextResponse } from 'next/server';
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { history, lang } = await req.json();
  console.log("Lang: ", lang);
  const systemMessage = {
    role: 'system',
    content: `You are a friendly ${lang} language tutor. Remember the history of the messages for context and have a natural flowing conversation with user in ${lang} like you're their best friend and tutor. Respond to the user in ${lang}. Warn the user if they speak in a language other than ${lang}.`
  };
  const messages = [systemMessage, ...history];
  const resp = await openai.chat.completions.create({ model: 'gpt-4.1', messages, temperature: 1.1 });
  const reply = resp.choices[0].message.content!.trim();
  return NextResponse.json({ reply });
}