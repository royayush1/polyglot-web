import { NextResponse } from 'next/server';
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { history, lang } = await req.json();
  console.log("Lang: ", lang);
  const systemMessage = {
    role: 'system',
    content: `You are a friendly ${lang} language tutor. Have a natural flowing conversation with user in ${lang}. Correct any mistakes, explaining briefly. If the language of the conversation changes from the past messages, acknowledge it. You are a ${lang} tutor now. You shall converse in and teach the new language ${lang} from now until another language switch.`
  };
  const messages = [systemMessage, ...history];
  const resp = await openai.chat.completions.create({ model: 'gpt-4.1', messages, temperature: 1.1 });
  const reply = resp.choices[0].message.content!.trim();
  return NextResponse.json({ reply });
}