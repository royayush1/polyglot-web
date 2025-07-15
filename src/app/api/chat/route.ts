import { NextResponse } from "next/server";
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request){
    const {history, lang, firstLang} = await req.json();
    const system = {role: 'system', content: `You are a ${lang} tutor. Converse with the user in ${lang}. Next to this response of yours in the conversation - In brackets, use ${firstLang} to correct mistakes and include explanations/teachings in ${firstLang}. Other than that, The user is only supposed to reply to you and converse in ${lang}. Also give them a warning if they don't respond in ${lang}. The whole point is for the user to learn to write in ${lang}`}
    const messages = [system, ...history]
    const response = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages,
        temperature: 1.2
    })
    const reply = response.choices[0].message.content!.trim();
    return NextResponse.json({reply});
}