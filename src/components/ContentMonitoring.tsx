import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { useAuth } from '../lib/AuthContext';
import { GeminiService } from '../lib/geminiService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Link as LinkIcon, Trash2, BarChart2, Eye, MessageCircle, Share2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export function ContentMonitoring() {
  const { user } = useAuth();
  const [link, setLink] = useState('');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'monitoringEntries'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log("Monitoring entries updated, count:", querySnapshot.size);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEntries(data.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      }));
      setFetching(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'monitoringEntries');
      setFetching(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Handle monitor triggered");
    
    if (!link.trim() || !user) {
      toast.error("Silakan masukkan link terlebih dahulu");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("AI sedang menganalisa performa konten...");
    
    try {
      console.log("Initiating analysis for:", link);
      const insights = await GeminiService.analyzeLink(link);
      console.log("Analysis completed");
      
      if (!insights) throw new Error("Gagal mendapatkan analisa dari AI.");

      const entry = {
        userId: user.uid,
        contentLink: link,
        insights,
        createdAt: serverTimestamp()
      };

      console.log("Saving to Firestore...");
      await addDoc(collection(db, 'monitoringEntries'), entry);
      console.log("Saved successfully");

      setLink('');
      toast.success("Konten berhasil dianalisa!", { id: toastId });
    } catch (error: any) {
      console.error("Analysis process error:", error);
      // If it's a firestore error, handle it specifically
      if (error.code && error.code.startsWith('permission-')) {
        handleFirestoreError(error, OperationType.WRITE, 'monitoringEntries');
      } else {
        toast.error("Gagal menganalisa konten: " + (error.message || "Gagal menghubungi AI"), { id: toastId });
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!user) {
      toast.error("Anda harus masuk untuk menghapus.");
      return;
    }
    console.log("Attempting to delete entry:", id, "for user:", user.uid);
    if (!confirm("Hapus analisa ini?")) return;
    try {
      await deleteDoc(doc(db, 'monitoringEntries', id));
      console.log("Delete successful for id:", id);
      toast.success("Catatan dihapus");
    } catch (error) {
      console.error("Delete failed for id:", id, error);
      handleFirestoreError(error, OperationType.DELETE, `monitoringEntries/${id}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <BarChart2 className="h-8 w-8 text-indigo-600" />
          Monitoring Performa
        </h2>
        <p className="text-slate-500 mt-1">Tempel link konten yang sudah Anda post untuk mendapatkan analisa performa AI.</p>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="text-lg">Tambah Konten Baru</CardTitle>
          <CardDescription>Analisa postingan di Instagram, TikTok, LinkedIn, atau Twitter.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleMonitor} className="flex gap-3">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                className="pl-10" 
                placeholder="https://www.instagram.com/p/..." 
                value={link}
                onChange={(e) => setLink(e.target.value)}
                required
              />
            </div>
            <Button type="submit" id="analyze-progress-button" className="bg-indigo-600 hover:bg-indigo-700 h-10 px-6" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
              Analisa Progress
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {fetching ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-400">Belum ada konten yang dimonitor.</p>
          </div>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id} className="border-none shadow-sm bg-white group overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Badge variant="outline" className="bg-white shrink-0">
                    {entry.contentLink.includes('instagram') ? 'Instagram' : 
                     entry.contentLink.includes('tiktok') ? 'TikTok' : 
                     entry.contentLink.includes('linkedin') ? 'LinkedIn' : 'Social Media'}
                  </Badge>
                  <a 
                    href={entry.contentLink} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs text-indigo-600 truncate hover:underline"
                  >
                    {entry.contentLink}
                  </a>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-slate-400 hover:text-rose-500 transition-opacity"
                  onClick={() => deleteEntry(entry.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                <div className="prose prose-sm prose-slate max-w-none">
                  <ReactMarkdown>{entry.insights}</ReactMarkdown>
                </div>
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50">
                  <p className="text-[10px] text-slate-400">
                    Dianalisa pada: {entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleString('id-ID') : 'Baru saja'}
                  </p>
                  <div className="flex items-center gap-4 text-slate-400">
                    <div className="flex items-center gap-1"><Eye size={12}/> <span className="text-[10px]">Tracked</span></div>
                    <div className="flex items-center gap-1"><MessageCircle size={12}/> <span className="text-[10px]">Analyze</span></div>
                    <div className="flex items-center gap-1"><Share2 size={12}/> <span className="text-[10px]">Report</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
