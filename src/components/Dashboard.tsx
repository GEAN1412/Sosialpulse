import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Share2, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Target,
  Search,
  Loader2,
  Link as LinkIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GeminiService } from "@/lib/geminiService";
import { useAuth } from "../lib/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

const data = [
  { name: "Mon", engagement: 4000, reach: 2400 },
  { name: "Tue", engagement: 3000, reach: 1398 },
  { name: "Wed", engagement: 2000, reach: 9800 },
  { name: "Thu", engagement: 2780, reach: 3908 },
  { name: "Fri", engagement: 1890, reach: 4800 },
  { name: "Sat", engagement: 2390, reach: 3800 },
  { name: "Sun", engagement: 3490, reach: 4300 },
];

export function Dashboard({ auditData, onAuditComplete }: { auditData: any, onAuditComplete: (data: any) => void }) {
  const { profile } = useAuth();
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");

  const activeAudit = auditData || profile?.auditData;

  useEffect(() => {
    async function fetchTrends() {
      try {
        const result = await GeminiService.getTrendingTopics();
        setTrends(result);
      } catch (error) {
        console.error("Failed to fetch trends", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, []);

  const handleQuickAudit = async () => {
    if (!profileUrl) {
      toast.error("Harap masukkan link profil");
      return;
    }

    setAuditLoading(true);
    try {
      const result = await GeminiService.auditProfileStructured({
        url: profileUrl,
        platform: "instagram" // Default for quick audit
      });
      onAuditComplete(result);
      toast.success("Analisa profil selesai!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menganalisa profil.");
    } finally {
      setAuditLoading(false);
    }
  };

  const stats = [
    { label: "Skor Profil", value: activeAudit?.overallScore ? `${activeAudit.overallScore}/100` : "N/A", change: activeAudit ? "Live" : "No Data", trend: "up", icon: Target },
    { label: "Pilar Konten", value: activeAudit?.contentPillars?.length || 0, change: "Strategi", trend: "up", icon: Users },
    { label: "Kekuatan", value: activeAudit?.strengths?.length || 0, change: "Analisa", trend: "up", icon: CheckCircle2 },
    { label: "Kelemahan", value: activeAudit?.weaknesses?.length || 0, change: "Perbaikan", trend: "down", icon: AlertCircle },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Halo, {profile?.businessType || 'Spesialis'}! 👋
          </h2>
          <p className="text-slate-500 mt-1">
            {activeAudit ? "Analisa performa profil Anda berdasarkan audit terbaru." : "Selamat datang! Masukkan profil untuk memulai analisa."}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Ganti Link Profil" 
              className="pl-9 w-[200px] h-9 text-xs border-none focus-visible:ring-0"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
            />
          </div>
          <Button 
            size="sm" 
            variant="ghost"
            className="text-indigo-600 hover:bg-indigo-50 h-8 text-xs font-bold"
            onClick={handleQuickAudit}
            disabled={auditLoading}
          >
            {auditLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Search className="w-3 h-3 mr-1" />}
            Update
          </Button>
        </div>
      </div>

      {activeAudit ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <stat.icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 border-none">
                    {stat.change}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 opacity-50">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <stat.icon className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-300 mt-1">---</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {activeAudit ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Kekuatan Profil
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {activeAudit.strengths.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-slate-600 flex gap-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    Kelemahan Profil
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {activeAudit.weaknesses.map((w: string, i: number) => (
                      <li key={i} className="text-sm text-slate-600 flex gap-2">
                        <span className="text-rose-500 font-bold">•</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="md:col-span-2 border-none shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">Ringkasan Strategi</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {activeAudit.summary}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {activeAudit.contentPillars.map((p: string, i: number) => (
                      <Badge key={i} variant="outline" className="bg-indigo-50/50 text-indigo-700 border-indigo-100">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-none shadow-sm bg-white h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="bg-slate-50 p-6 rounded-full mb-6">
                <Users className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Belum Ada Data Profil</h3>
              <p className="text-slate-500 mt-2 max-w-md">
                Silakan lakukan audit lengkap di menu "Audit & Strategi" untuk melihat analisa mendalam di sini.
              </p>
            </Card>
          )}
        </div>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              AI Trend Pulse
            </CardTitle>
            <CardDescription>Topik tren saat ini dianalisa oleh Gemini.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-100 rounded w-full"></div>
                  </div>
                ))
              ) : (
                trends.map((trend, i) => (
                  <div key={i} className="group cursor-default">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{trend.topic}</h4>
                      <Badge variant={trend.impact === "High" ? "default" : "secondary"} className="text-[10px] h-5">
                        {trend.impact} Impact
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{trend.description}</p>
                  </div>
                ))
              )}
            </div>
            <button className="w-full mt-6 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
              Lihat Laporan Lengkap
              <ExternalLink className="w-3 h-3" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
