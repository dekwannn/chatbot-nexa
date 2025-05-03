'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Trash } from 'lucide-react';

// Hook kustom untuk efek typewriter
const useTypewriter = (text, speed = 30) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const index = useRef(0);
  
  useEffect(() => {
    if (!text) return;
    
    // Reset state ketika mendapat text baru
    setDisplayText('');
    setIsTyping(true);
    setIsDone(false);
    index.current = 0;
    
    const timer = setInterval(() => {
      if (index.current < text.length) {
        setDisplayText(prev => prev + text.charAt(index.current));
        index.current += 1;
      } else {
        clearInterval(timer);
        setIsTyping(false);
        setIsDone(true);
      }
    }, speed);
    
    return () => clearInterval(timer);
  }, [text, speed]);
  
  return { displayText, isTyping, isDone };
};

// Fungsi untuk memformat teks dengan penanganan khusus untuk kode dan list
const formatBotResponse = (text, isAnimated = false) => {
  if (!text) return '';
  
  // Pisahkan teks menjadi bagian-bagian untuk memproses kode dan teks biasa secara terpisah
  const parts = text.split(/```([^`]+)```/);
  
  return parts.map((part, index) => {
    // Jika ini adalah blok kode (indeks ganjil setelah split dengan regex)
    if (index % 2 === 1) {
      // Deteksi bahasa pemrograman dari baris pertama blok kode
      const lines = part.split('\n');
      const language = lines[0].trim();
      const code = lines.slice(1).join('\n');
      
      return (
        <div key={`code-${index}`} className="my-2 overflow-hidden">
          <div className="bg-gray-800 text-white text-xs px-2 py-1 flex justify-between rounded-t-md">
            <span>{language || 'code'}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(code);
                // Anda dapat menambahkan notifikasi copy berhasil jika diperlukan
              }}
              className="hover:text-blue-300"
            >
              Copy
            </button>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-3 rounded-b-md overflow-x-auto">
            <code>{code}</code>
          </pre>
        </div>
      );
    } else {
      // Proses teks regular (bukan kode)
      // Format list dengan tanda bintang
      let formattedText = part;
      
      // Format list dengan tanda bintang (* Item)
      formattedText = formattedText.replace(
        /^\s*\*\s+(.+)$/gm, 
        '<li class="ml-5 list-disc">$1</li>'
      );
      
      // Format list dengan tanda angka (1. Item)
      formattedText = formattedText.replace(
        /^\s*(\d+)\.\s+(.+)$/gm, 
        '<li class="ml-5 list-decimal">$2</li>'
      );
      
      // Format teks bold (**text**)
      formattedText = formattedText.replace(
        /\*\*(.*?)\*\*/g,
        '<strong>$1</strong>'
      );
      
      // Format teks italic (*text*)
      formattedText = formattedText.replace(
        /(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, 
        '<em>$1</em>'
      );
      
      // Format heading (# Heading)
      formattedText = formattedText.replace(
        /^#\s+(.+)$/gm,
        '<h2 class="text-lg font-bold my-2">$1</h2>'
      );
      
      // Format heading (## Heading)
      formattedText = formattedText.replace(
        /^##\s+(.+)$/gm,
        '<h3 class="text-md font-bold my-2">$1</h3>'
      );
      
      // Wrap list items in ul tags
      formattedText = formattedText.replace(
        /(<li class="ml-5 list-disc">.*?<\/li>)+/gs,
        '<ul class="my-2">$&</ul>'
      );
      
      // Wrap ordered list items in ol tags
      formattedText = formattedText.replace(
        /(<li class="ml-5 list-decimal">.*?<\/li>)+/gs,
        '<ol class="my-2">$&</ol>'
      );
      
      // Format paragraphs (baris kosong di antara teks)
      formattedText = formattedText.replace(
        /\n\s*\n/g,
        '</p><p class="my-2">'
      );
      
      return <div key={`text-${index}`} dangerouslySetInnerHTML={{ __html: `<p class="my-2">${formattedText}</p>` }} />;
    }
  });
};

// Komponen Message untuk menangani efek typewriter
const Message = ({ message }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { displayText, isTyping, isDone } = useTypewriter(
    message.role === 'ai' ? message.text : null
  );
  
  // Tampilkan pesan user langsung tanpa animasi
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="flex flex-row-reverse max-w-3xl">
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 ml-2">
            <User size={16} />
          </div>
          <div className="relative px-4 py-2 rounded-lg bg-blue-600 text-white">
            <p className="whitespace-pre-wrap text-sm">{message.text}</p>
            <div className="text-xs mt-1 text-blue-200">{message.timestamp}</div>
          </div>
        </div>
      </div>
    );
  }
  
  // Tampilkan pesan AI dengan animasi typewriter
  return (
    <div className="flex justify-start">
      <div className="flex max-w-3xl">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-600 mr-2">
          <Bot size={16} />
        </div>
        <div className={`relative px-4 py-2 rounded-lg ${
          message.error ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
        }`}>
          <div className="text-sm">
            {isExpanded || isDone ? (
              // Tampilkan formatted text setelah selesai typing atau jika diexpand
              formatBotResponse(message.text)
            ) : (
              // Tampilkan plain text saat masih typing
              <p className="whitespace-pre-wrap">
                {displayText}
                {isTyping && <span className="inline-block w-1 h-4 bg-black ml-0.5 animate-pulse"></span>}
              </p>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-xs mt-1 text-gray-400">{message.timestamp}</div>
            
            {/* Tombol untuk melihat seluruh teks (skip animasi) */}
            {isTyping && !isExpanded && (
              <button 
                onClick={() => setIsExpanded(true)}
                className="text-xs text-blue-500 ml-2"
              >
                Lihat sekarang
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize with a welcome message
  useEffect(() => {
    const welcomeMessage = {
      role: 'ai',
      text: 'Halo! Saya Nexa, asisten AI yang siap membantu Anda. Apa yang ingin Anda tanyakan?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage = { 
      role: 'user', 
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const promptWithInstruction = `${input}\n\nTolong sertakan sumber jurnal ilmiah yang relevan di akhir jawaban.`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: promptWithInstruction }), // Kirim prompt yang sudah diubah
      });
      
      const data = await res.json();
      
      const aiMessage = { 
        role: 'ai', 
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error fetching response:', error);
      const errorMessage = { 
        role: 'ai', 
        text: 'Maaf, terjadi kesalahan dalam memproses permintaan Anda. Silakan coba lagi.',
        error: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    const welcomeMessage = {
      role: 'ai',
      text: 'Percakapan telah direset. Apa yang ingin Anda tanyakan selanjutnya?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([welcomeMessage]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <main className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Bot size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Nexa</h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
              Asisten AI
            </span>
          </div>
          
          <button 
            onClick={clearChat}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition"
          >
            <Trash size={16} />
            Reset
          </button>
        </div>
      </header>

      {/* Chat container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto py-2 space-y-4">
            {messages.map((msg, i) => (
              <Message key={i} message={msg} />
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="flex">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2">
                    <Bot size={16} />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="mt-4">
            <div className="relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanya Nexa tentang apapun..."
                className="flex-1 resize-none border text-black border-gray-300 rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm min-h-12 max-h-32"
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
                className="absolute right-2 p-2 rounded-md text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Tekan Enter untuk mengirim, Shift+Enter untuk baris baru
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}