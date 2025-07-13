/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/voice-chat/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from 'react';
import { BounceLoader } from 'react-spinners';

// 1) List both STT (ISO-639-1) and TTS (BCP-47) codes
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

// 2) Hook to pick the right SpeechSynthesisVoice *in the browser only*
function useVoiceFor(ttsTag: string) {
  const [voice, setVoice] = useState<SpeechSynthesisVoice|null>(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const pick = () => {
      const vs = synth.getVoices();
      const found = vs.find(v => v.lang === ttsTag);
      if (found) setVoice(found);
    };
    // Try now, and again when voices load
    pick();
    synth.addEventListener('voiceschanged', pick);
    return () => synth.removeEventListener('voiceschanged', pick);
  }, [ttsTag]);

  return voice;
}

export default function VoiceChatPage() {
  // 3) App state
  const [sel,      setSel]      = useState(languages[0]);
  const [msgs,     setMsgs]     = useState<{role:string;content:string}[]>([]);
  const [mode,     setMode]     = useState<'idle'|'listening'|'processing'|'speaking'>('idle');
  const [loading,  setLoading]  = useState(false);

  const mediaRef  = useRef<MediaRecorder>(null);
  const chunksRef = useRef<Blob[]>([]);
  const ttsVoice  = useVoiceFor(sel.tts);

  // 4) Start/stop recording
  const toggleListen = async () => {
    if (mode === 'idle') {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRef.current  = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = e => chunksRef.current.push(e.data);
      recorder.onstop          = onStop;
      recorder.start();
      setMode('listening');
    } else if (mode === 'listening') {
      mediaRef.current?.stop();
    }
  };

  // 5) When recording stops: transcribe → chat → speak
  const onStop = async () => {
    setMode('processing');
    setLoading(true);

    // build and send FormData to Whisper
    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const form = new FormData();
    form.append('file', audioBlob, 'speech.webm');
    form.append('lang', sel.stt); // two-letter code

    const whisperRes = await fetch('/api/whisper', { method:'POST', body: form });
    if (!whisperRes.ok) {
      console.error('Whisper failed:', await whisperRes.text());
      setMode('idle');
      setLoading(false);
      return;
    }
    const { text: userText } = await whisperRes.json();
    setMsgs(m => [...m, { role:'user', content:userText }]);

    // send to chat
    const chatRes = await fetch('/api/voice-chat', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ history:[...msgs, {role:'user',content:userText}], lang: sel.stt })
    });
    const { reply } = await chatRes.json();
    setMsgs(m => [...m, { role:'assistant', content:reply }]);
    setLoading(false);

    // speak the reply
    const utter = new SpeechSynthesisUtterance(reply);
    utter.lang = sel.tts;     // full BCP-47
    if (ttsVoice) utter.voice = ttsVoice;
    utter.onstart = () => setMode('speaking');
    utter.onend   = () => setMode('idle');
    window.speechSynthesis.speak(utter);
  };

  return (
    <div className='w-screen h-screen bg-blue-300 p-6'>
      <div className="max-w-xl mx-auto flex flex-col items-center space-y-4
                      border-4 border-black rounded bg-white p-4">
        <h1 className="text-2xl font-bold text-[#035A9D]">Voice Chat Tutor</h1>

        {/* language selector */}
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

        {/* record / stop / processing / speaking button */}
        <button
          onClick={toggleListen}
          className={`relative w-24 h-24 rounded-full flex items-center justify-center focus:outline-none
                     ${mode==='idle'      && 'bg-green-800'}
                     ${mode==='listening' && 'bg-red-500'}
                     ${mode==='processing'&& 'bg-white'}
                     ${mode==='speaking'  && 'bg-blue-500'}`}
        >
          {mode === 'processing'
            ? <BounceLoader loading={loading} size={50} color='#57B9FF' />
            : <span className="text-white text-lg font-bold">
                {mode==='idle'?'▶': mode==='listening'?'●': '🔊'}
              </span>
          }
        </button>

        {/* chat history */}
        <div className="h-64 w-full overflow-y-auto border p-2 rounded space-y-2 text-black">
          {msgs.map((m,i) =>
            <div key={i} className={m.role==='user' ? 'text-right' : 'text-left'}>
              <span className={`inline-block p-2 rounded
                                 ${m.role==='user'?'bg-green-200':'bg-blue-200'}`}>
                {m.content}
              </span>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500">
          Switch languages anytime during conversation.
        </p>
      </div>
    </div>
  );
}

