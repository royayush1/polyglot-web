import { NextResponse } from 'next/server';
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req:Request){
    const {text, lang} = await req.json();
    const resp = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
            {role: 'system', content: `You are a language translator familiar with every language in the world. The user will give you text. Recognise the language of the text that the user will provide, understand the text and correctly translate the text to the language: ${lang}. Reply with only the translation along with it's correct pronunciation in brackets next to it.`},
            {role: 'user', content: `The text to be translated is: ${text}`}
        ],
    })
    const translation = resp.choices[0].message.content!.trim();
    return NextResponse.json({ translation });
}
