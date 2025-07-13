'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function TranslatePage() {
  const [text, setText] = useState('');
  const [lang, setLang] = useState('Chinese (Mandarin)');
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(
      `/translate/result?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`
    );
  }

  return (
    <div className='w-screen h-screen bg-blue-300 p-6'>
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto border rounded border-black border-4 p-4 bg-white">
      <h1 className="text-2xl font-bold text-[#035A9D]">Text to Translate 👇</h1>
      <textarea
        className="w-full p-2 rounded bg-gray-100 text-black"
        rows={4}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Enter text..."
        required
      />
      <h1 className="text-2xl font-bold text-[#035A9D]">Select Language 👇</h1>
      <select
        value={lang}
        onChange={e => setLang(e.target.value)}
        className="p-2 border rounded border-black text-black"
      >
        
        <option>Chinese (Mandarin)</option>
        <option>Chinese (Cantonese)</option>
        <option>English</option>
        <option>French</option>
        <option>Japanese</option>
        <option>Hindi</option>
        <option>Korean</option>
        <option>Arabic</option>
        <option>Spanish</option>
        <option>Italian</option>
        <option>German</option>
      </select>
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
        Translate
      </button>
    </form>
    <Image src={'/hello.png'} width={500} height={500} className='mx-auto' alt='hello'/>
    </div>

  )}