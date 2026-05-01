import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Users, Trash2, Globe, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export function AccountManager({ onSwitchAccount }: { onSwitchAccount: (accountId: string) => void }) {
  const { user, profile } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountLink, setNewAccountLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'managedAccounts'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAccounts(data);
      setFetching(false);
    }, (error) => {
      console.error(error);
      setFetching(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim() || !user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'managedAccounts'), {
        userId: user.uid,
        name: newAccountName,
        link: newAccountLink,
        createdAt: serverTimestamp(),
      });
      setNewAccountName('');
      setNewAccountLink('');
      toast.success("Akun berhasil ditambahkan!");
    } catch (error: any) {
      toast.error("Gagal menambah akun: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'managedAccounts', id));
      toast.success("Akun dihapus");
    } catch (error) {
      toast.error("Gagal menghapus");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Users className="h-8 w-8 text-indigo-600" />
          Daftar Akun Managed
        </h2>
        <p className="text-slate-500 mt-1">Kelola semua klien atau akun media sosial yang sedang Anda optimasi.</p>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="text-lg">Tambah Akun Baru</CardTitle>
          <CardDescription>Masukkan nama bisnis atau brand yang akan dikelola.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleAddAccount} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
              placeholder="Nama Akun / Bisnis" 
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              required
            />
            <Input 
              placeholder="Link Profil (Opsional)" 
              value={newAccountLink}
              onChange={(e) => setNewAccountLink(e.target.value)}
            />
            <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Tambah Akun
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fetching ? (
          <div className="col-span-full flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="col-span-full text-center p-12 bg-white rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-400">Belum ada akun yang didaftarkan.</p>
          </div>
        ) : (
          accounts.map((acc) => (
            <Card key={acc.id} className="border-none shadow-sm bg-white group hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Globe className="w-5 h-5 text-indigo-600" />
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={() => deleteAccount(acc.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
                <h3 className="text-lg font-bold text-slate-900 truncate">{acc.name}</h3>
                {acc.link && (
                  <a href={acc.link} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 flex items-center gap-1 hover:underline mb-4 mt-1">
                    <ExternalLink size={10} />
                    Kunjungi Profil
                  </a>
                )}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none text-[10px]">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Managed
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="ml-auto text-xs text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 h-7"
                    onClick={() => onSwitchAccount(acc.id)}
                  >
                    Pilih Akun
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
