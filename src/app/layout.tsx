'use client';
import './globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useState } from 'react';
import Image from 'next/image';
import parrot from '../../public/parrot.png';
import {Griffy} from "next/font/google";

const griffy = Griffy({
  weight: '400',
  style:"normal",
  subsets: ['latin']
  
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <html lang="en">
      <body className="flex h-screen bg-gray-50">
        {/* Sidebar Drawer */}
        <div className={`fixed inset-y-0 left-0 transform ${open ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 bg-white w-64 shadow-sm z-99`}>
          <div className="p-4 border-b border-b-black flex justify-between items-center">
            <h2 className="text-xl font-bol text-black text-bold">Menu</h2>
            <button onClick={() => setOpen(false)} className="text-gray-600">✕</button>
          </div>
          <nav className="flex flex-col p-4 space-y-4 items-center">
            <a href="/translate" className="text-black hover:bg-blue-600 p-2">Translate 💻</a>
            <a href="/chat" className="text-black hover:bg-gray-100 p-2 rounded">Chat 💬</a>
            <a href="/voice-chat" className="text-black hover:bg-gray-100 p-2 rounded">Voice Chat 🎤</a>
          </nav>
          <Image src={'/earth.png'} width={500} height={500} className='mt-50' alt='earth'/>
        </div>
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <header className="
            relative
            bg-[url('/world.jpg')]
            bg-cover
            bg-center
            shadow-sm
            flex items-center
            h-24
            md:h-64
            p-4">
            <div className="absolute inset-0 bg-blue-900/50 pointer-events-none" />
            <button onClick={() => setOpen(!open)} className="text-gray-600 mr-4 text-2xl hover:bg-gray-600">☰</button>
            <Image src={parrot} 
            className="object-contain z-75 w-15 h-15 md:w-25 md:h-25"
            alt='Parrot'/>
            <div className='flex flex-col'>
              <h1 className={`text-2xl sm:text-2xl md:text-6xl font-bold text-green-400 ml-4 z-75 ${griffy.className}`}>PolyGlot</h1>
              <span className={`text-sm md:text-base text-white ml-4 z-75 md:mt-2`}>Perfect Translation Every Time</span>
            </div>
          </header>
          <main className="overflow-auto">
            {children}
            <ToastContainer />
          </main>
        </div>
      </body>
    </html>
  );
}