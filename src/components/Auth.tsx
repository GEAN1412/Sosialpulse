import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, Sparkles, MessageCircle, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export function AuthForm() {
  const [identifier, setIdentifier] = useState(''); // Combined username/email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const formatEmail = (id: string) => {
    const trimmed = id.trim().toLowerCase();
    if (trimmed === 'geanpratama' || trimmed === 'geanpratama@gmail.com') {
      return "geanpratama@gmail.com";
    }
    return trimmed.includes('@') ? trimmed : `${trimmed}@gits.socialpulse`;
  };

  const getWhitelistEntry = async (id: string) => {
    try {
      const docId = id.trim().toLowerCase();
      // Using direct getDoc for better performance and easier rules compliance
      const docRef = doc(db, 'whitelistedUsers', docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error("Whitelist Fetch Error:", error);
      return null;
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const firebaseEmail = formatEmail(identifier);
    const ADMIN_EMAIL = "geanpratama@gmail.com";
    const ADMIN_PASS = "admin123";

    console.log("Starting Auth Flow for:", identifier);

    try {
      // 1. Try normal login
      await signInWithEmailAndPassword(auth, firebaseEmail, password);
      toast.success("Login berhasil!");
    } catch (error: any) {
      console.log("Initial login failed, checking GITS Whitelist. Code:", error.code);

      // SPECIAL CASE: Master Admin
      if (firebaseEmail === ADMIN_EMAIL && password === ADMIN_PASS) {
        try {
          const res = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASS);
          await setDoc(doc(db, 'users', res.user.uid), {
            userId: res.user.uid,
            username: 'geanpratama',
            email: ADMIN_EMAIL,
            onboardingComplete: true,
            createdAt: serverTimestamp(),
          });
          toast.success("Master Admin Activated!");
          setLoading(false);
          return;
        } catch (adminError: any) {
          if (adminError.code === 'auth/email-already-in-use') {
             toast.error("Akun Admin sudah aktif dengan password berbeda.");
          } else {
             toast.error("Admin Auth Error: " + adminError.message);
          }
          setLoading(false);
          return;
        }
      }

      // 2. GITS Check (if user not found or wrong password attempt for new GITS)
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        const whitelistEntry = await getWhitelistEntry(identifier);
        
        if (whitelistEntry && whitelistEntry.initialPassword === password) {
          try {
            console.log("Found Whitelist, attempting registration...");
            // Auto-register using whitelisted credentials
            const res = await createUserWithEmailAndPassword(auth, firebaseEmail, password);
            await setDoc(doc(db, 'users', res.user.uid), {
              userId: res.user.uid,
              username: identifier.trim().toLowerCase(),
              email: firebaseEmail,
              onboardingComplete: false,
              createdAt: serverTimestamp(),
            });
            toast.success("Akun GITS diaktifkan! Selamat datang.");
          } catch (regError: any) {
            console.error("GITS Reg Error:", regError);
            if (regError.code === 'auth/email-already-in-use') {
              // This means user exists but first login failed -> wrong password
              toast.error("Password GITS salah untuk akun ini.");
            } else if (regError.code === 'auth/weak-password') {
              toast.error("Password terlalu lemah (min 6 karakter). Ubah di Admin Panel.");
            } else {
              toast.error("GITS Activation Error: " + regError.message);
            }
          }
        } else if (whitelistEntry && whitelistEntry.initialPassword !== password) {
          toast.error("Password GITS salah.");
        } else {
          toast.error("Akses Ditolak. Username/ID tidak terdaftar.");
        }
      } else {
        toast.error("Gagal Masuk: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const res = await signInWithPopup(auth, provider);
      const userEmail = res.user.email;
      
      if (!userEmail) throw new Error("Gagal mendapatkan email Google.");

      const ADMIN_EMAIL = "geanpratama@gmail.com";
      const isWhitelisted = await getWhitelistEntry(userEmail) || userEmail === ADMIN_EMAIL;

      if (!isWhitelisted) {
        await signOut(auth);
        toast.error("Akses Ditolak: Email Google ini belum terdaftar di sistem GITS.");
        return;
      }

      const userRef = doc(db, 'users', res.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          userId: res.user.uid,
          username: userEmail.split('@')[0],
          email: userEmail,
          onboardingComplete: userEmail === ADMIN_EMAIL,
          createdAt: serverTimestamp(),
        });
      }
      toast.success("Authorized Login Success!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E4E3E0] p-4 font-mono">
      <Card className="w-full max-w-md border border-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white">
        <CardHeader className="space-y-1 text-center border-b border-slate-900 pb-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-none border-2 border-slate-900 bg-indigo-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">
            GITS ACCESS
          </CardTitle>
          <CardDescription className="text-slate-500 font-bold uppercase text-[10px] tracking-widest pt-2">
            MISSION CONTROL / SOCIALPULSE
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8 space-y-6">
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Username / ID</label>
              <Input 
                type="text" 
                placeholder="USER_IDENTIFIER" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="h-12 border-2 border-slate-900 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-600 font-bold"
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Pass</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-2 border-slate-900 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-600 font-bold"
                required 
              />
            </div>
            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-none h-14 font-black uppercase tracking-tighter text-lg shadow-[4px_4px_0px_0px_rgba(79,70,229,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2" type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-white"/> : <LogIn className="w-5 h-5 text-white" />}
              Execute Login
            </Button>
          </form>

          <div className="relative my-4 flex items-center">
            <div className="flex-grow border-t border-slate-300"></div>
            <span className="mx-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Key</span>
            <div className="flex-grow border-t border-slate-300"></div>
          </div>

          <Button 
            onClick={signInWithGoogle} 
            variant="outline" 
            className="w-full h-14 border-2 border-slate-900 rounded-none bg-white hover:bg-slate-50 font-black uppercase tracking-tighter text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-3"
            disabled={loading}
          >
            <KeyRound className="w-4 h-4 text-indigo-600" />
            Admin Recovery (Google Auth)
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col border-t-2 border-slate-900 bg-indigo-50/50 p-8">
          <div className="text-center space-y-4 w-full">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Unauthorized Access Prohibited</p>
            <a 
              href="https://wa.me/62877725860048?text=Halo%20Admin%2C%20saya%20membutuhkan%20akses%20GITS%20SocialPulse."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-3 border-2 border-slate-900 bg-white hover:bg-emerald-50 text-slate-900 px-6 py-3 rounded-none text-xs font-black uppercase tracking-tighter transition-all hover:shadow-[4px_4px_0px_0px_rgba(16,185,129,1)]"
            >
              <MessageCircle className="w-5 h-5 text-emerald-500" />
              Request New Credentials
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
