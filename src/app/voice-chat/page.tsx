/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from 'react';
import { BounceLoader } from 'react-spinners';

const languages = [
    { label: 'French',    stt: 'fr',   tts: 'fr-FR' },
    { label: 'Spanish',   stt: 'es',   tts: 'es-ES' },
    { label: 'Japanese',  stt: 'ja',   tts: 'ja-JP' },
    { label: 'English',   stt: 'en',   tts: 'en-US' },
    { label: 'Arabic',    stt: 'ar',   tts: 'ar-SA' },
    { label: 'Mandarin',  stt: 'zh',   tts: 'zh-CN' },
    { label: 'Cantonese', stt: 'yue',  tts: 'zh-HK'},
    { label: 'Korean',    stt: 'ko',   tts: 'ko-KR'},
    { label: 'German',    stt: 'de',   tts: 'de-DE'},
    { label: 'Hindi',     stt: 'hi',   tts: 'hi-IN'},
    { label: 'Italian',   stt: 'it',   tts: 'it-IT'},
    { label: 'Russian',   stt: 'ru',   tts: 'ru-RU'},
    { label: 'Swahili',   stt: 'sw',   tts: 'sw-KE'},
    { label: 'Tagalog',   stt: 'tl',   tts: 'tl-PH'},
    { label: 'Tamil',     stt: 'ta',   tts: 'ta-IN'},
    { label: 'Thai',      stt: 'th',   tts: 'th-TH'},
    { label: 'Ukranian',  stt: 'uk',   tts: 'uk-UA'},
    { label: 'Urdu',      stt: 'ur',   tts: 'ur-PK'},
    { label: 'Vietnamese',stt: 'vi',   tts: 'vi-VN'}
  ];

// 2) Hook to pick the matching voice from speechSynthesis.getVoices()
function useVoiceFor(ttsTag: string) {
  const [voice, setVoice] = useState<SpeechSynthesisVoice|null>(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    function pick() {
      const vs = synth.getVoices();
      const found = vs.find(v => v.lang === ttsTag);
      if (found) setVoice(found);
    }
    pick();
    synth.addEventListener('voiceschanged', pick);
    return () => synth.removeEventListener('voiceschanged', pick);
  }, [ttsTag]);

  return voice;
}

export default function VoiceChatPage() {
  // 3) App state
  const [sel,     setSel]     = useState(languages[0]);
  const [msgs,    setMsgs]    = useState<{role:string;content:string}[]>([]);
  const [mode,    setMode]    = useState<'idle'|'listening'|'processing'|'speaking'>('idle');
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const mediaRef  = useRef<MediaRecorder>(null);
  const chunksRef = useRef<Blob[]>([]);
  const ttsVoice  = useVoiceFor(sel.tts);

  function pickMimeType() {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/wav'
    ];
    return candidates.find(t => MediaRecorder.isTypeSupported(t)) || '';
  }

  // 4) Primer: runs once on first tap to unlock mobile TTS
  const unlockSpeech = () => {
    const primer = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(primer); // silent utterance unlocks policy :contentReference[oaicite:0]{index=0}
    setUnlocked(true);
  };

  // 5) Combined click handler
  const handleButtonClick = async () => {
    if (!unlocked) {
      unlockSpeech();
      return;
    }
    if (mode === 'idle' || mode === 'speaking') {
      // start recording
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
      mediaRef.current  = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = e => chunksRef.current.push(e.data);
      recorder.onstop = onStop;
      recorder.start();
      setMode('listening');
    } else if (mode === 'listening') {
      // stop recording
      mediaRef.current?.stop();
    }
  };

  // 6) After recording stops: Whisper → Chat → Speak
  const onStop = async () => {
    setMode('processing');
    setLoading(true);
  
    try {
      // 1) Transcribe with Whisper...
      const rawType = chunksRef.current[0]?.type || 'audio/webm';
      const audioBlob = new Blob(chunksRef.current, { type: rawType });
      
      // strip parameters and pick subtype
      const mimeMain = audioBlob.type.split(';')[0].trim(); // e.g. "audio/webm"
      const ext      = mimeMain.split('/')[1];              //       "webm"
    
      // 3) Append to FormData using the matching extension
      const form = new FormData();
      form.append('file', audioBlob, `speech.${ext}`);
      form.append('lang', sel.stt);
    
      const whisperRes = await fetch('/api/whisper', { method: 'POST', body: form });
      if (!whisperRes.ok) throw new Error(await whisperRes.text());
      const { text: userText } = await whisperRes.json();
  
      // 2) Atomically update msgs *and* derive the new history
      let history: { role: string; content: string }[] = [];
      setMsgs(prev => {
        history = [...prev, { role: 'user', content: userText }];
        return history;
      });
  
      // 3) Send that exact history to your chat API
      const chatRes = await fetch('/api/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, lang: sel.stt })
      });
      if (!chatRes.ok) throw new Error(await chatRes.text());
      const { reply } = await chatRes.json();
  
      // 4) Append the assistant reply
      setMsgs(prev => [...prev, { role: 'assistant', content: reply }]);

    const ttsRes = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: reply, ttsTag: sel.tts })
    });
    const { audio: base64 } = await ttsRes.json();
    
    // convert base64 → Blob → Object URL
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length).fill(0).map((_, i) => byteChars.charCodeAt(i));
    const aBlob = new Blob([new Uint8Array(byteNumbers)], { type: 'audio/mp3' });
    const url = URL.createObjectURL(aBlob);
    
    // play with HTMLAudioElement
    const player = new Audio(url);
    player.onended = () => setMode('idle');
    setMode('speaking');
    player.play();
  }catch (err: any) {
    console.error('Voice flow error:', err);
    // show an error message in your UI if you want…
    setMode('idle');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className='w-screen h-screen bg-blue-300 p-6'>
      <div className="max-w-xl mx-auto flex flex-col items-center space-y-4
                      border-4 border-black rounded bg-white p-4">
        <h1 className="text-2xl font-bold text-[#035A9D]">Voice Chat Tutor</h1>

        {/* Language selector */}
        <select
          value={sel.stt}
          onChange={e => {
            const found = languages.find(l => l.stt === e.target.value)!;
            setSel(found);
          }}
          className="p-2 border rounded text-black"
        >
          {languages.map(l => (
            <option key={l.stt} value={l.stt}>{l.label}</option>
          ))}
        </select>

        {/* Record/Stop/Processing/Speaking button */}
        <button
          onClick={handleButtonClick}
          className={`
            relative w-24 h-24 rounded-full flex items-center justify-center focus:outline-none
            ${mode==='idle'      && 'bg-green-800'}
            ${mode==='listening' && 'bg-red-500'}
            ${mode==='processing'&& 'bg-white'}
            ${mode==='speaking'  && 'bg-blue-500'}
          `}
        >
          {mode==='processing'
            ? <BounceLoader loading={loading} size={50} color='#57B9FF' />
            : <span className="text-white text-lg font-bold">
                {mode==='idle'?'▶':
                 mode==='listening'?'●':
                 mode==='speaking'?'🔊':null}
              </span>
          }
        </button>

        {/* Conversation history */}
        <div className="h-64 w-full overflow-y-auto border p-2 rounded space-y-2 text-black">
          {msgs.map((m,i) => (
            <div key={i} className={m.role==='user'?'text-right':'text-left'}>
              <span className={`inline-block p-2 rounded
                                 ${m.role==='user'?'bg-green-200':'bg-blue-200'}`}>
                {m.content}
              </span>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500">Switch languages anytime during conversation.</p>
        <h1 className="text-2xl font-bold mt-5 text-[#035A9D]">Instructions</h1>
        <ul>
            <li className="text-sm text-gray-500"> - Press green play button to record your response</li>
            <li className="text-sm text-gray-500"> - Press red button to stop recording</li>
            <li className="text-sm text-gray-500"> - Wait for response</li>
            <li className="text-sm text-gray-500"> - Enjoy learning through a friendly conversation with our AI Tutor!</li>
        </ul> 
      </div>
    </div>
  );
}


