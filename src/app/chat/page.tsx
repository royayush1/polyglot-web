'use client';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { PulseLoader } from 'react-spinners';

interface Msg { role: 'user' | 'assistant'; content: string; }

export default function ChatPage() {
  const [lang, setLang] = useState('French');
  const [firstLang, setFirstLang] = useState('French');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [latestMsgIndex, setLatestMsgIndex] = useState(-1);

  async function send() {
    if (!input) return toast.error('Enter a message');
    const userMsg: Msg = { role: 'user', content: input };
    setMsgs(m => [...m, userMsg]);
    setInput(''); setLoading(true);
    console.log("First msgs: ", msgs)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ history: [...msgs, userMsg], lang, firstLang }),
    });
    const { reply } = await res.json();
    setMsgs(m => [...m, { role: 'assistant', content: reply }]);
    setLatestMsgIndex(histLength => histLength + 2);
    setLoading(false);
  }



  return (
    <div className="h-screen w-screen mx-auto bg-blue-300 p-6">
    <div className="mx-auto space-y-4 p-4 border rounded border-black border-4 bg-white">
      <h1 className="text-2xl font-bold text-[#035A9D]">Text Chat Tutor</h1>
      <h1 className="text-xl font-bold text-[#035A9D]">Choose the written language you're comfortable with 👇</h1>
      <select value={firstLang} onChange={e => setFirstLang(e.target.value)} className="mt-2 p-2 border rounded text-black">
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
      <h1 className="text-xl font-bold text-[#035A9D]">Choose the written language you want to learn 👇</h1>
      <select value={lang} onChange={e => setLang(e.target.value)} className="mt-2 p-2 border rounded text-black">
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
      <div className="mt-4 space-y-2 h-60 overflow-y-auto border p-2 rounded text-black">
        {msgs.map((m,i) => (
          <div key={i} className={m.role==='user'?'text-right':'text-left'}>
            <span className={`inline-block p-2 rounded ${m.role==='user'?'bg-green-200':'bg-blue-200'}`}>{m.content}</span>      
          </div>
        ))}
        
        {(loading) ?
        <div className='text-left'>
        <span className={`inline-block p-2 rounded ${'bg-blue-200'}`}><PulseLoader
             loading={loading}
             size={10}
             color='black'
             /></span>
        </div> : <></>}
      </div>
      <div className="mt-2 flex">
        <input
          className="flex-1 p-2 border rounded-l text-black"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type..."
        />
        <button onClick={send} disabled={loading} className="bg-blue-600 text-white px-4 rounded-r">
          {loading ? '...' : 'Send'}
        </button>
      </div>
      </div>
    </div>
  )};