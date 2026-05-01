import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  setDoc,
  serverTimestamp, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  updateDoc,
  where
} from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  UserPlus, 
  Users, 
  Trash2, 
  Key, 
  ShieldAlert, 
  CheckCircle2, 
  ChevronRight, 
  ExternalLink,
  Edit2,
  XCircle,
  Database,
  Terminal,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

export function AdminPanel() {
  const { user } = useAuth();
  const [whitelistedEmails, setWhitelistedEmails] = useState<any[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPass, setEditingPass] = useState('');
  
  const ADMIN_EMAIL = "geanpratama@gmail.com";
  const isAuthorized = user?.email === ADMIN_EMAIL;

  const formatEmail = (id: string) => {
    const trimmed = id.trim().toLowerCase();
    return trimmed.includes('@') ? trimmed : `${trimmed}@gits.socialpulse`;
  };

  // Fetch Whitelisted Emails
  useEffect(() => {
    if (!isAuthorized) return;
    
    const q = query(collection(db, 'whitelistedUsers'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWhitelistedEmails(data);
      setFetching(false);
    }, (error) => {
      toast.error("Database Whitelist Error: " + error.message);
      setFetching(false);
    });
    return () => unsubscribe();
  }, [isAuthorized]);

  // Fetch Registered Users
  useEffect(() => {
    if (!isAuthorized) return;

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRegisteredUsers(data);
    }, (error) => {
      toast.error("Database Manifest Error: " + error.message);
    });
    return () => unsubscribe();
  }, [isAuthorized]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("GITS: Submit Triggered");
    
    if (!newUsername.trim() || !newPassword.trim()) {
      toast.error("Mohon isi username dan password.");
      return;
    }

    setLoading(true);
    try {
      const internalEmail = formatEmail(newUsername);
      console.log("GITS: Formatted Email:", internalEmail);
      
      const docData = {
        username: newUsername.trim().toLowerCase(),
        email: internalEmail,
        initialPassword: newPassword,
        addedBy: user?.email || 'admin_root',
        createdAt: serverTimestamp(),
      };

      console.log("GITS: Attempting Firestore write...");
      // Using setDoc with username as custom ID for better reliability
      const docRef = doc(db, 'whitelistedUsers', newUsername.trim().toLowerCase());
      await setDoc(docRef, docData);
      
      console.log("GITS: Write Success!");
      
      toast.success("BERHASIL: Akun GITS " + newUsername + " telah terdaftar!", {
        description: "Password: " + newPassword,
        duration: 5000,
      });
      
      setNewUsername('');
      setNewPassword('');
    } catch (error: any) {
      console.error("GITS FIRESTORE ERROR:", error);
      const msg = error.code === 'permission-denied' 
        ? "Izin Ditolak: Pastikan Anda login sebagai geanpratama@gmail.com" 
        : error.message;
      toast.error("Gagal mendaftarkan akun: " + msg);
      
      // Force feedback for the user
      alert("Deploy Error Code: " + (error.code || 'unknown') + "\nMessage: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (id: string, username: string) => {
    if (!editingPass) return;
    try {
      await updateDoc(doc(db, 'whitelistedUsers', id), {
        initialPassword: editingPass,
        updatedAt: serverTimestamp()
      });
      toast.success(`Password untuk ${username} telah diperbarui!`);
      setEditingId(null);
    } catch (error: any) {
      toast.error("Gagal mengubah password: " + error.message);
    }
  };

  const removeWhitelist = async (id: string) => {
    if (!confirm("Hapus Whitelist? User ini tidak akan bisa login lagi.")) return;
    try {
      await deleteDoc(doc(db, 'whitelistedUsers', id));
      toast.success("Izin akses dihapus.");
    } catch (error: any) {
      toast.error("Gagal menghapus izin: " + error.message);
    }
  };

  const deleteUserRecord = async (userId: string) => {
    if (!confirm("Hapus Data Profil User?")) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      toast.success("Profil user dibersihkan.");
    } catch (error: any) {
      toast.error("Gagal membersihkan profil: " + error.message);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 font-mono border-4 border-dashed border-rose-200 bg-rose-50/50 p-8">
        <ShieldAlert className="w-16 h-16 text-rose-500 animate-pulse" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Terminal Restricted</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Identitas login Anda tidak terdaftar sebagai Master Admin. 
            Silakan hubungi pengembang untuk delegasi akses root.
          </p>
        </div>
        
        <div className="p-4 bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[10px] w-full max-w-sm">
           <p className="font-black uppercase mb-1 text-slate-400">Node Identity:</p>
           <p className="font-bold break-all">{user?.email || 'ANONYMOUS'}</p>
           <p className="font-black uppercase mt-2 mb-1 text-slate-400">Auth UID:</p>
           <p className="font-bold truncate">{user?.uid || 'NONE'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto font-mono text-slate-900 pb-20 pt-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-slate-900 pb-8">
        <div className="space-y-4">
          <Badge className="bg-indigo-600 text-white rounded-none border-none px-3 py-1 font-black text-[10px] tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase">
            Admin Level: Root
          </Badge>
          <div className="space-y-1">
            <h1 className="text-5xl font-black uppercase tracking-tighter italic flex items-center gap-4">
              <ShieldAlert className="h-12 w-12 text-slate-900" strokeWidth={3} />
              GITS Portal 2.0
            </h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Terminal size={14} /> Gated Invitation & Tracking System Control Center
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
           <Card className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none px-6 py-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Nodes</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black tracking-tighter leading-none">{registeredUsers.length}</span>
                <Users size={16} className="text-indigo-600 mb-1" />
              </div>
           </Card>
           <Card className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none px-6 py-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Authorized ID</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black tracking-tighter leading-none">{whitelistedEmails.length}</span>
                <Key size={16} className="text-amber-500 mb-1" />
              </div>
           </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Registration Command Center */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(79,70,229,1)] rounded-none bg-white overflow-hidden">
            <CardHeader className="bg-slate-900 text-white border-b-4 border-slate-900 p-6">
              <CardTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                <UserPlus size={20} /> Deploy Access
              </CardTitle>
              <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                Create New Authorized Credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleCreateAccount} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Node Identifier / Username</label>
                  <Input 
                    placeholder="USERNAME_ROOT" 
                    className="h-14 border-2 border-slate-900 rounded-none focus-visible:ring-0 focus-visible:border-indigo-600 font-bold uppercase text-lg"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Access Key / Password</label>
                  <Input 
                    placeholder="SECURE_PASS_X9" 
                    className="h-14 border-2 border-slate-900 rounded-none focus-visible:ring-0 focus-visible:border-indigo-600 font-bold text-lg"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    type="text"
                  />
                </div>
                <Button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-none h-16 font-black uppercase tracking-tighter text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Database className="w-6 h-6 mr-2" />}
                  Generate Access
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="p-6 bg-amber-50 border-2 border-amber-900/20 rounded-none space-y-3">
            <h4 className="text-[11px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-2">
              <ShieldAlert size={14} /> Critical Note
            </h4>
            <p className="text-[11px] text-amber-800 leading-[1.6] font-medium opacity-80 italic">
              Usernames are case-insensitive. Once generated, user must login via the front portal to finalize onboarding. Root admin can modify specific node keys anytime.
            </p>
          </div>
        </div>

        {/* Node Management Grid */}
        <div className="lg:col-span-8 space-y-12">
          {/* Whitelisted Accounts Table */}
          <section className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tighter italic border-l-8 border-amber-500 pl-4">Authorized Node Registry</h3>
                <Badge variant="outline" className="border-2 border-slate-900 rounded-none font-bold uppercase text-[10px]">{whitelistedEmails.length} Nodes</Badge>
             </div>
             
             <Card className="border-2 border-slate-900 rounded-none overflow-hidden bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest">
                          <th className="px-6 py-4">Node / Username</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Security Key</th>
                          <th className="px-6 py-4 text-right">Ops</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-slate-100 italic font-mono">
                        {whitelistedEmails.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 font-black text-slate-900 uppercase">
                              {item.username || (item.email ? item.email.split('@')[0] : 'N/A')}
                            </td>
                            <td className="px-6 py-4">
                              {registeredUsers.some(u => u.email?.toLowerCase() === item.email?.toLowerCase()) ? (
                                <span className="text-emerald-600 font-black uppercase text-[10px] flex items-center gap-1">
                                  <CheckCircle2 size={12} /> Active
                                </span>
                              ) : (
                                <span className="text-amber-500 font-black uppercase text-[10px] flex items-center gap-1 opacity-50">
                                   Pending
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {editingId === item.id ? (
                                <div className="flex gap-2">
                                  <Input 
                                    className="h-8 border-2 border-slate-900 rounded-none w-32 font-bold text-xs" 
                                    value={editingPass}
                                    onChange={(e) => setEditingPass(e.target.value)}
                                  />
                                  <button onClick={() => updatePassword(item.id, item.username || item.email)} className="bg-indigo-600 text-white p-1 rounded-none"><Save size={14}/></button>
                                  <button onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-600 p-1 rounded-none"><XCircle size={14}/></button>
                                </div>
                              ) : (
                                <span className="p-1.5 bg-slate-100 font-bold text-slate-600 border border-slate-200 rounded text-xs select-all">
                                  {item.initialPassword || 'NO_PASS'}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              {editingId !== item.id && (
                                <button 
                                  onClick={() => { setEditingId(item.id); setEditingPass(item.initialPassword || ''); }}
                                  className="text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                  <Edit2 size={16} />
                                </button>
                              )}
                              <button 
                                onClick={() => removeWhitelist(item.id)}
                                className="text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
             </Card>
          </section>

          {/* Registered User Logs */}
          <section className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tighter italic border-l-8 border-indigo-600 pl-4">Live User Manifest</h3>
                <Badge variant="outline" className="border-2 border-slate-900 rounded-none font-bold uppercase text-[10px] text-indigo-600">{registeredUsers.length} Online</Badge>
             </div>

             <Card className="border-2 border-slate-900 rounded-none overflow-hidden bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-sans italic font-mono">
                    <thead>
                      <tr className="text-left bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest">
                        <th className="px-6 py-4">Entity Type</th>
                        <th className="px-6 py-4">Auth Link (Internal)</th>
                        <th className="px-6 py-4">Last Event</th>
                        <th className="px-6 py-4 text-right">Term</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-100">
                      {registeredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-indigo-50/30 group transition-all">
                          <td className="px-6 py-4 font-black uppercase">
                            {u.businessType || u.username || 'UNINITIALIZED'}
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs">
                             {u.email}
                          </td>
                          <td className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">
                            {u.updatedAt?.toDate ? u.updatedAt.toDate().toLocaleDateString() : 'INITIAL'}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button 
                               onClick={() => deleteUserRecord(u.id)}
                               className="bg-rose-500 text-white p-2 rounded-none md:opacity-0 group-hover:opacity-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-0 active:translate-y-[1px]"
                             >
                                <Trash2 size={14} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </Card>
          </section>
        </div>
      </div>

      {/* Global Notice */}
      <div className="border-4 border-slate-900 bg-slate-900 p-8 text-white relative overflow-hidden shadow-[16px_16px_0px_0px_rgba(245,158,11,1)]">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
           <div className="h-20 w-20 shrink-0 border-4 border-amber-500 rounded-full flex items-center justify-center animate-pulse">
              <ShieldAlert size={40} className="text-amber-500" />
           </div>
           <div className="space-y-4">
              <h3 className="text-2xl font-black uppercase tracking-tighter italic">
                System Administrator Directive
              </h3>
              <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-3xl uppercase tracking-widest">
                Deleting a manifest record will wipe user profile data but keep their whitelist state unless intentionally removed. 
                Use "Generate Access" to invite new stakeholders. All operations logged via Firebase Audit Trail.
              </p>
           </div>
        </div>
        <div className="absolute -right-20 -bottom-20 opacity-10 blur-3xl h-96 w-96 bg-indigo-600 rounded-full"></div>
      </div>
    </div>
  );
}
