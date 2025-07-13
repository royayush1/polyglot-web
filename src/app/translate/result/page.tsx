export const dynamic = 'force-dynamic';
'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ClimbingBoxLoader } from "react-spinners";
import Image from 'next/image';

export default function ResultPage() {
  const params = useSearchParams();
  const text = params.get('text')!;
  const lang = params.get('lang')!;
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/translate', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ text, lang }),
    })
      .then(r => r.json())
      .then(data => setTranslation(data.translation))
      .finally(() => setLoading(false));
  }, [text, lang]);

  if (loading) return (
    
    <div className="flex w-screen h-screen bg-blue-300 p-6 items-center justify-center flex-col space-y-4">
        <ClimbingBoxLoader
            loading={loading}
            size={25}
            color='black'
        />
        <p className='text-black'>Translating...</p>
    </div>

  )

  return (
    <div className="w-screen h-screen bg-blue-300 p-6">
      <div className="mx-auto space-y-4 p-4 border rounded border-black border-4 bg-white">
        <h1 className="text-2xl font-bold text-[#035A9D]">Translation Result</h1>
        <div><strong className="text-[#035A9D]">Original Text 👇</strong><p className="bg-gray-100 p-2 rounded text-black">{text}</p></div>
        <div><strong className="text-[#035A9D]">Translated Text ({lang}) 👇</strong><p className="bg-gray-100 p-2 rounded text-black">{translation}</p></div>
        <a href="/translate" className="flex w-full bg-blue-600 text-white p-2 rounded items-center justify-center">Start Over</a>  
      </div>
      
    <Image src={'/hello.png'} width={500} height={500} className='mx-auto' alt='hello'/>
      
    </div>
  );
}