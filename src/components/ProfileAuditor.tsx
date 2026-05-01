import { useState, useRef, useEffect } from "react";
import { 
  Search, 
  Upload, 
  Link as LinkIcon, 
  Loader2, 
  Sparkles, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Facebook,
  FileImage,
  X,
  Clock,
  Plus,
  Download,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GeminiService } from "@/lib/geminiService";
import { SpreadsheetPlan, SpreadsheetRow } from "./SpreadsheetPlan";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { addDays } from "date-fns";
import { Post } from "@/App";

export function ProfileAuditor({ 
  auditData, 
  auditMarkdown,
  contentPlanProp,
  spreadsheetConfig,
  spreadsheetTitle,
  onAuditComplete, 
  onPlanGenerated, 
  onPlanApproved,
  onConfigChange,
  onTitleChange
}: { 
  auditData: any, 
  auditMarkdown: string | null,
  contentPlanProp: string | null,
  spreadsheetConfig: any,
  spreadsheetTitle: string,
  onAuditComplete: (data: any, markdown: string) => void,
  onPlanGenerated: (plan: string) => void,
  onPlanApproved: (posts: Omit<Post, 'id' | 'userId'>[]) => void,
  onConfigChange: (config: any) => void,
  onTitleChange: (title: string) => void
}) {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(auditMarkdown);
  const [contentPlan, setContentPlan] = useState<string | null>(contentPlanProp);
  const [spreadsheetData, setSpreadsheetData] = useState<SpreadsheetRow[] | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Try to parse contentPlanProp if it's JSON
  useEffect(() => {
    if (contentPlanProp) {
      try {
        const parsed = JSON.parse(contentPlanProp);
        if (Array.isArray(parsed)) {
          setSpreadsheetData(parsed);
          setContentPlan(null); // Clear markdown if we have structured data
        }
      } catch (e) {
        // Not JSON, keep as markdown
      }
    }
  }, [contentPlanProp]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudit = async () => {
    if (!url && !image) {
      toast.error("Harap masukkan link profil atau upload screenshot");
      return;
    }

    setLoading(true);
    try {
      const imageBase64 = image ? image.split(",")[1] : undefined;
      
      // Run both audits
      const [auditResult, structuredResult] = await Promise.all([
        GeminiService.auditProfile({
          url: url || undefined,
          imageBase64,
          platform
        }),
        GeminiService.auditProfileStructured({
          url: url || undefined,
          imageBase64,
          platform
        })
      ]);

      setResult(auditResult || "Gagal melakukan audit.");
      onAuditComplete(structuredResult, auditResult || "");
      setContentPlan(null); // Reset content plan on new audit
      setSpreadsheetData(null);
      toast.success("Audit profil selesai!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal melakukan audit profil.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!result) return;

    setPlanLoading(true);
    try {
      const businessName = auditData?.brandIdentity || "User Business";
      const planRows = await GeminiService.generateSpreadsheetPlan(result, businessName);
      setSpreadsheetData(planRows);
      
      const jsonPlan = JSON.stringify(planRows);
      onPlanGenerated(jsonPlan);
      toast.success("Spreadsheet Content Plan berhasil dibuat!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal membuat content plan.");
    } finally {
      setPlanLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!spreadsheetData) return;

    const headers = ["Week", "Date", "Type", "Detail Type", "Brief Plan", "Reference Link", "Caption", "Post Date", "PIC", "Status"];
    const csvContent = [
      headers.join(","),
      ...spreadsheetData.map(row => [
        row.week,
        row.date,
        row.type,
        row.detailType,
        row.briefPlan.replace(/"/g, '""'),
        row.referenceLink || "",
        row.caption ? (row.caption || "").replace(/"/g, '""') : "",
        row.postDate,
        row.pic || "Specialist",
        row.status
      ].map(val => `"${val}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `content_plan_${platform}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV berhasil diunduh!");
  };

  const handleApprovePlan = () => {
    if (!spreadsheetData) return;
    
    const posts: Omit<Post, 'id' | 'userId'>[] = spreadsheetData.map((row, index) => {
      let postDateObj = new Date(row.postDate);
      if (isNaN(postDateObj.getTime())) {
        postDateObj = addDays(new Date(), index);
      }
      
      return {
        title: `${row.type}: ${row.detailType}`,
        date: postDateObj,
        platform: platform,
        status: "terjadwal",
        time: "10:00 AM",
        week: row.week,
        detailType: row.detailType,
        briefPlan: row.briefPlan,
        referenceLink: row.referenceLink,
        caption: row.caption,
        pic: row.pic || "Specialist"
      };
    });
    
    onPlanApproved(posts);
    toast.success(`${posts.length} postingan telah ditambahkan ke kalender!`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Audit Profil & Role Model</h2>
        <p className="text-slate-500 mt-1">Analisa profil kompetitor atau profil Anda sendiri untuk mendapatkan strategi konten terbaik.</p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="w-full space-y-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Input Profil</CardTitle>
              <CardDescription>Berikan link atau screenshot profil media sosial.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform</label>
                  <Select onValueChange={setPlatform} defaultValue={platform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="twitter">Twitter / X</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Link Profil (Opsional)</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="https://instagram.com/username" 
                      className="pl-10"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upload Screenshot (Opsional)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all",
                    image ? "border-indigo-200 bg-indigo-50/30" : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                  )}
                >
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  {image ? (
                    <div className="relative w-full max-w-md mx-auto aspect-video">
                      <img src={image} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setImage(null);
                        }}
                        className="absolute -top-2 -right-2 bg-white shadow-md rounded-full p-1 text-slate-400 hover:text-rose-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <FileImage className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">Klik untuk upload gambar</p>
                    </>
                  )}
                </div>
              </div>

              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 h-11"
                onClick={handleAudit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menganalisa...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Mulai Audit Profil
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="w-full">
          <Card className="border-none shadow-sm bg-white h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Hasil Audit & Rekomendasi
                </div>
                {result && !spreadsheetData && !contentPlan && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    onClick={handleGeneratePlan}
                    disabled={planLoading}
                  >
                    {planLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Buat Spreadsheet Plan
                  </Button>
                )}
              </CardTitle>
              <CardDescription>Strategi role model dan ide konten viral.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {result ? (
                <div className="space-y-6">
                  <div className="prose prose-slate max-w-none bg-slate-50 p-6 rounded-xl border border-slate-100 overflow-y-auto max-h-[300px]">
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>

                  {(spreadsheetData || contentPlan) && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-indigo-600" />
                          {spreadsheetData ? "Content Plan Spreadsheet" : "Rencana Konten 7 Hari"}
                        </h3>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-slate-600"
                            onClick={downloadCSV}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={handleApprovePlan}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve & Jadwalkan
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-slate-500"
                            onClick={() => {
                              setContentPlan(null);
                              setSpreadsheetData(null);
                            }}
                          >
                            Tutup Plan
                          </Button>
                        </div>
                      </div>
                      
                      {spreadsheetData ? (
                        <div className="w-full">
                           <SpreadsheetPlan 
                            data={spreadsheetData} 
                            businessName={auditData?.brandIdentity} 
                            config={spreadsheetConfig}
                            title={spreadsheetTitle}
                            onChange={(newData) => {
                              setSpreadsheetData(newData);
                              onPlanGenerated(JSON.stringify(newData));
                            }}
                            onConfigChange={onConfigChange}
                            onTitleChange={onTitleChange}
                           />
                        </div>
                      ) : (
                        <div className="prose prose-slate max-w-none bg-indigo-50/30 p-6 rounded-xl border border-indigo-100 overflow-y-auto max-h-[400px]">
                          <ReactMarkdown>{contentPlan!}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-100 rounded-xl">
                  <div className="bg-slate-50 p-4 rounded-full mb-4">
                    <Sparkles className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Belum ada hasil</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs">
                    Masukkan link atau screenshot profil di sebelah kiri untuk mendapatkan analisa strategi.
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
