import { useState } from "react";
import { 
  BarChart3, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Lightbulb, 
  Target,
  Loader2,
  TrendingUp,
  FileText,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GeminiService } from "@/lib/geminiService";
import { toast } from "sonner";

export function ContentAnalyzer({ contentPlan }: { contentPlan: string | null }) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [analysis, setAnalysis] = useState<any | null>(null);

  const handleAnalyze = async (textToAnalyze?: string) => {
    const text = textToAnalyze || content;
    if (!text) {
      toast.error("Harap masukkan konten untuk dianalisa");
      return;
    }

    setLoading(true);
    try {
      const result = await GeminiService.analyzeContent({ content: text, platform });
      setAnalysis(result);
      toast.success("Analisa selesai!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menganalisa konten.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzePlan = () => {
    if (!contentPlan) return;
    handleAnalyze(contentPlan);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Analisa Konten</h2>
        <p className="text-slate-500 mt-1">Dapatkan feedback instan untuk memaksimalkan engagement dan jangkauan postingan Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {contentPlan && (
            <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-indigo-200" />
                    <h3 className="font-bold">Content Plan Tersedia</h3>
                  </div>
                  <p className="text-sm text-indigo-100 mb-4">
                    Anda memiliki Content Plan yang baru saja dibuat. Analisa seluruh rencana untuk melihat potensi jangkauan maksimal.
                  </p>
                  <Button 
                    variant="secondary" 
                    className="w-full bg-white text-indigo-600 hover:bg-indigo-50 border-none"
                    onClick={handleAnalyzePlan}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                    Analisa Seluruh Content Plan
                  </Button>
                </div>
                <div className="absolute -right-8 -bottom-8 opacity-10">
                  <TrendingUp className="w-32 h-32" />
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Input Konten</CardTitle>
              <CardDescription>Tempel draf Anda di bawah untuk dianalisa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform Target</label>
                <Select onValueChange={setPlatform} defaultValue={platform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter / X</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Draf Konten</label>
                <Textarea 
                  placeholder="Tempel konten postingan, caption, atau script Anda di sini..."
                  className="min-h-[300px] resize-none"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 h-11"
                onClick={() => handleAnalyze()}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menganalisa...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analisa Performa
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {analysis ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-none shadow-sm bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-500">Skor Engagement</p>
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-bold text-slate-900">{analysis.engagementScore}</p>
                      <p className="text-sm text-slate-400 mb-1">/ 100</p>
                    </div>
                    <div className="mt-3 w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${analysis.engagementScore}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-500">Estimasi Jangkauan</p>
                      <Target className="w-4 h-4 text-indigo-600" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{analysis.estimatedReach}</p>
                    <Badge variant="secondary" className="mt-2">Berdasarkan tren saat ini</Badge>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="w-5 h-5 text-indigo-600" />
                    Wawasan Mendalam
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Analisa Nada (Tone)</h4>
                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {analysis.toneAnalysis}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Kekuatan
                      </h4>
                      <ul className="space-y-2">
                        {analysis.strengths.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-slate-600 flex gap-2">
                            <span className="text-emerald-500">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Kelemahan
                      </h4>
                      <ul className="space-y-2">
                        {analysis.weaknesses.map((w: string, i: number) => (
                          <li key={i} className="text-sm text-slate-600 flex gap-2">
                            <span className="text-rose-500">•</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" />
                      Saran Perbaikan
                    </h4>
                    <div className="space-y-2">
                      {analysis.suggestions.map((s: string, i: number) => (
                        <div key={i} className="text-sm text-slate-700 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SEO & Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.seoKeywords.map((k: string, i: number) => (
                        <Badge key={i} variant="outline" className="bg-white">#{k}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="h-[500px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-100 rounded-xl bg-white/50">
              <div className="bg-slate-50 p-4 rounded-full mb-4">
                <BarChart3 className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Analisa Tertunda</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xs">
                Masukkan draf konten Anda di sebelah kiri dan klik analisa untuk mendapatkan feedback AI.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
