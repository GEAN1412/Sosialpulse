import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GeminiService } from '../lib/geminiService';
import { toast } from 'sonner';
import { Loader2, Rocket, ArrowRight } from 'lucide-react';

export function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const [businessType, setBusinessType] = useState('');
  const [profileLink, setProfileLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      // Perform initial audit
      const auditResult = await GeminiService.auditProfileStructured({
        url: profileLink,
        platform: profileLink.includes('instagram') ? 'instagram' : 'tiktok'
      });
      
      const auditMarkdown = await GeminiService.auditProfile({
        url: profileLink,
        platform: profileLink.includes('instagram') ? 'instagram' : 'tiktok'
      });

      await updateDoc(doc(db, 'users', user.uid), {
        businessType,
        profileLink,
        auditData: auditResult,
        auditMarkdown: auditMarkdown,
        onboardingComplete: true,
        updatedAt: serverTimestamp(),
      });
      
      await refreshProfile();
      toast.success("Pengaturan selesai! Selamat datang.");
    } catch (error: any) {
      toast.error("Gagal menyimpan data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg border-none shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
            <Rocket className="h-6 w-6 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Kenali Bisnis Anda</CardTitle>
          <CardDescription>
            Bantu kami memahami akun media sosial Anda untuk memberikan analisa terbaik.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Jenis Usaha / Akun</label>
              <Input 
                placeholder="Misal: Fashion Muslim, Gadget Review, Personal Brand" 
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Link Profil Utama</label>
              <Input 
                placeholder="https://instagram.com/username" 
                value={profileLink}
                onChange={(e) => setProfileLink(e.target.value)}
                required
              />
              <p className="text-[10px] text-slate-400">Kami akan melakukan audit awal pada profil ini.</p>
            </div>

            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menganalisa data...
                </>
              ) : (
                <>
                  Mulai Sekarang
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
