import { useState } from "react";
import { 
  Sparkles, 
  Copy, 
  RefreshCw, 
  Send, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Facebook,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GeminiService, ContentGenerationParams } from "@/lib/geminiService";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const platforms = [
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "twitter", label: "Twitter / X", icon: Twitter },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "tiktok", label: "TikTok", icon: RefreshCw },
];

export function ContentGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [params, setParams] = useState<ContentGenerationParams>({
    platform: "instagram",
    topic: "",
    tone: "Professional",
    targetAudience: "General",
    contentType: "Post",
  });

  const handleGenerate = async () => {
    if (!params.topic) {
      toast.error("Harap masukkan topik");
      return;
    }

    setLoading(true);
    try {
      const content = await GeminiService.generateContent(params);
      setResult(content || "Gagal menghasilkan konten.");
      toast.success("Konten berhasil dibuat!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal membuat konten. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      toast.success("Berhasil disalin!");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">AI Content Generator</h2>
        <p className="text-slate-500 mt-1">Buat postingan media sosial berkualitas tinggi dalam hitungan detik dengan Gemini AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Konfigurasi</CardTitle>
              <CardDescription>Atur parameter untuk AI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform</label>
                <div className="grid grid-cols-5 gap-2">
                  {platforms.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setParams({ ...params, platform: p.id })}
                      className={cn(
                        "p-2 rounded-lg border transition-all flex flex-col items-center gap-1",
                        params.platform === p.id 
                          ? "border-indigo-600 bg-indigo-50 text-indigo-600" 
                          : "border-slate-200 hover:border-slate-300 text-slate-400"
                      )}
                    >
                      <p.icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Topik / Pesan Utama</label>
                <Textarea 
                  placeholder="Tentang apa postingan ini? (misal: Peluncuran produk baru sepatu ramah lingkungan)"
                  className="min-h-[100px] resize-none"
                  value={params.topic}
                  onChange={(e) => setParams({ ...params, topic: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nada (Tone)</label>
                  <Select onValueChange={(v) => setParams({ ...params, tone: v })} defaultValue={params.tone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih nada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional">Profesional</SelectItem>
                      <SelectItem value="Casual">Santai</SelectItem>
                      <SelectItem value="Witty">Lucu/Cerdas</SelectItem>
                      <SelectItem value="Inspirational">Inspiratif</SelectItem>
                      <SelectItem value="Educational">Edukatif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipe Konten</label>
                  <Select onValueChange={(v) => setParams({ ...params, contentType: v })} defaultValue={params.contentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Post">Postingan Standar</SelectItem>
                      <SelectItem value="Thread">Thread / Carousel</SelectItem>
                      <SelectItem value="Script">Script Video</SelectItem>
                      <SelectItem value="Caption">Caption Pendek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Audiens</label>
                <Input 
                  placeholder="misal: Pecinta teknologi, Gen Z, Pemilik bisnis kecil"
                  value={params.targetAudience}
                  onChange={(e) => setParams({ ...params, targetAudience: e.target.value })}
                />
              </div>

              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 h-11"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Buat Konten
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="border-none shadow-sm bg-white h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg">Hasil Konten</CardTitle>
                <CardDescription>Konten buatan AI yang siap untuk channel Anda.</CardDescription>
              </div>
              {result && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="w-4 h-4 mr-2" />
                    Salin
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleGenerate}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Buat Ulang
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1">
              {result ? (
                <div className="prose prose-slate max-w-none bg-slate-50 p-6 rounded-xl border border-slate-100 overflow-y-auto max-h-[600px]">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-100 rounded-xl">
                  <div className="bg-slate-50 p-4 rounded-full mb-4">
                    <Sparkles className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Belum ada konten</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs">
                    Isi konfigurasi di sebelah kiri dan klik tombol untuk melihat keajaiban terjadi.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
