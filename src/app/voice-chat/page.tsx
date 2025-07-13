'use client';
import { useState, useRef } from 'react';
import { BounceLoader } from 'react-spinners';

const languages = [
  { label: 'French', code: 'fr' },
  { label: 'Spanish', code: 'es' },
  { label: 'Japanese', code: 'ja' },
  { label: 'English', code: 'en'},
  { label: 'Arabic', code: 'ar'},
  { label: 'Chinese (Mandarin)', code: "zh"},
  { label: 'Chinese (Cantonese)', code: "yue"},
  { label: 'German', code: 'de-DE'},
  { label: 'Hindi', code: 'hi'},
  { label: 'Italian', code: 'it'},
  { label: 'Korean', code: 'ko'},
  { label: 'Swahili', code: 'sw'},
];

export default function VoiceChatPage() {
  const [lang, setLang] = useState(languages[0].code);
  const [msgs, setMsgs] = useState<{ role: string; content: string }[]>([]);
  const [mode, setMode] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [loading, setLoading] = useState(false);
  const mediaRef = useRef<MediaRecorder>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Start/stop recording
  const toggleListen = async () => {
    if (mode === 'idle') {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = e => chunksRef.current.push(e.data);
      recorder.onstop = onStop;
      recorder.start();
      setMode('listening');
    } else if (mode === 'listening') {
      mediaRef.current?.stop();
    }
  };

  // Handle blob when recording stops
  const onStop = async () => {
    setLoading(true);
    setMode('processing');
    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const form = new FormData();
    form.append('file', audioBlob, 'speech.webm');
    form.append('lang', lang);

    // Whisper transcription
    const whisperRes = await fetch('/api/whisper', { method: 'POST', body: form });
    if (!whisperRes.ok) {
        console.error('Whisper failed:', whisperRes.status, await whisperRes.text());
        return;
      }
      let whisperData;
      try {
        whisperData = await whisperRes.json();
      } catch {
        console.error('Invalid JSON from /api/whisper:', await whisperRes.text());
        return;
      }
      const userText = whisperData.text;
    setMsgs(m => [...m, { role: 'user', content: userText }]);

    // Chat response
    const chatRes = await fetch('/api/voice-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: [...msgs, { role: 'user', content: userText }], lang }),
    });
    const { reply } = await chatRes.json();
    setMsgs(m => [...m, { role: 'assistant', content: reply }]);

    setLoading(false);
    // Speak reply
    const utter = new SpeechSynthesisUtterance(reply);
    utter.lang = lang;
    utter.onstart = () => setMode('speaking');
    utter.onend = () => setMode('idle');
    window.speechSynthesis.speak(utter);
  };

  return (
    <div className='w-screen h-screen bg-blue-300 p-6'>
    <div className="max-w-xl mx-auto flex flex-col items-center space-y-4 border rounded border-black border-4 bg-white p-4">
      <h1 className="text-2xl font-bold text-[#035A9D]">Voice Chat Tutor</h1>
      <h1 className="text-sm font-bold text-[#035A9D]">Select Language you wish to converse in 👇</h1>
      <select
        value={lang}
        onChange={e => setLang(e.target.value)}
        className="p-2 border rounded text-black"
      >
        {languages.map(l => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>

      {/* Voice Button */}
    
        <div>
          <button
            onClick={toggleListen}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center focus:outline-none
              ${mode === 'idle' && 'bg-green-800'}
              ${mode === 'listening' && 'bg-red-500'}
              ${mode === 'processing' && 'bg-white'}
              ${mode === 'speaking' && 'bg-blue-500'}`}
          >
            <span className="relative text-white text-lg font-bold">
              {mode === 'idle' && '▶'}
              {mode === 'listening' && '●'}
              {mode === 'processing' && <BounceLoader loading={loading}
                size={75}
                color='#57B9FF'/>}
              {mode === 'speaking' && '🔊'}
            </span>
          </button>
       </div>

      {/* Conversation */}
      <div className="h-64 overflow-y-auto border p-2 rounded w-full space-y-2 text-black">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <span
              className={`inline-block p-2 rounded ${m.role === 'user' ? 'bg-green-200' : 'bg-blue-200'}`}
            >
              {m.content}
            </span>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-500">Switch languages anytime during conversation.</p>
      <h1 className="text-2xl font-bold mt-5 text-[#035A9D]">Instructions</h1>
      <ul>
       <li className="text-sm text-gray-500"> - Press on green Play Button to record</li>
       <li className="text-sm text-gray-500"> - Press on red button to stop recording</li>
       <li className="text-sm text-gray-500"> - Wait for response</li>
       <li className="text-sm text-gray-500"> - Enjoy learning through a friendly conversation with our AI Tutor!</li>
      </ul>  
    </div>
    
    </div>
  );
}