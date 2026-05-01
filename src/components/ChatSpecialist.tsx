import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { GeminiService } from '../lib/geminiService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User as UserIcon, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

// Remove local AI init

export function ChatSpecialist() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      const fetchChat = async () => {
        const docRef = doc(db, 'chatSessions', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMessages(docSnap.data().messages);
        } else {
          // Initialize first message
          const initialMessage = {
            role: 'assistant',
            content: `Halo! Saya adalah Social Media Specialist AI Anda. Saya sudah melihat profil Anda (${profile?.businessType || 'Anda'}). Bagaimana saya bisa membantu Anda scale up hari ini?`,
            timestamp: new Date().toISOString()
          };
          setMessages([initialMessage]);
          await setDoc(docRef, {
            userId: user.uid,
            messages: [initialMessage],
            updatedAt: serverTimestamp()
          });
        }
      };
      fetchChat();
    }
  }, [user, profile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await GeminiService.chatWithSpecialist({
        input,
        businessType: profile?.businessType || 'Belum diatur',
        auditMarkdown: profile?.auditMarkdown || 'Belum ada analisa',
        history: messages
      });
      
      const assistantMessage = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update Firestore
      const docRef = doc(db, 'chatSessions', user.uid);
      await updateDoc(docRef, {
        messages: arrayUnion(userMessage, assistantMessage),
        updatedAt: serverTimestamp()
      });

    } catch (error: any) {
      toast.error("Gagal mengirim pesan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] animate-in fade-in duration-500 min-h-[500px]">
      <div className="mb-4 shrink-0">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Bot className="h-8 w-8 text-indigo-600" />
          Diskusi Specialist
        </h2>
        <p className="text-slate-500 mt-1">Konsultasikan strategi scale-up akun media sosial Anda dengan pakar AI.</p>
      </div>

      <Card className="flex-1 flex flex-col border-none shadow-xl overflow-hidden bg-white min-h-0">
        <CardHeader className="bg-indigo-600 text-white p-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-md">AI Social Media Specialist</CardTitle>
              <CardDescription className="text-indigo-100 text-xs text-balance">
                Aktif • Siap membantu scale-up bisnis {profile?.businessType}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                      {msg.role === 'user' ? <UserIcon size={16} className="text-indigo-600" /> : <Bot size={16} className="text-slate-600" />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm' 
                        : 'bg-slate-100 text-slate-800 rounded-tl-none shadow-sm'
                    }`}>
                      <div className="prose prose-sm prose-slate max-w-none prose-headings:text-inherit prose-strong:text-inherit">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      <p className={`text-[10px] mt-2 font-medium ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <Loader2 size={16} className="animate-spin text-slate-600" />
                    </div>
                    <div className="p-3 rounded-2xl rounded-tl-none bg-slate-50 text-slate-400 text-sm italic">
                      Sedang memikirkan strategi...
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </div>

          <div className="p-4 bg-white border-t shrink-0">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input 
                placeholder="Tanyakan sesuatu tentang strategi Anda..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="bg-slate-50 border-slate-200 focus-visible:ring-indigo-600 h-11"
              />
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 h-11 px-5" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send size={18} />}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
