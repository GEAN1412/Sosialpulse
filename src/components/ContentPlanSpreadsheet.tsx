import { useState, useMemo } from "react";
import { 
  CheckCircle2, 
  Clock, 
  Download, 
  Upload, 
  FileCheck, 
  AlertCircle,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SpreadsheetPlan, SpreadsheetRow, SpreadsheetConfig } from "./SpreadsheetPlan";
import { toast } from "sonner";
import { format, parse } from "date-fns";
import { id } from "date-fns/locale";

// Note: Cloudinary integration requires API keys. 
// These should be added to .env and used here.
const CLOUDINARY_UPLOAD_PRESET = "unsigned_preset"; // Placeholder
const CLOUDINARY_CLOUD_NAME = "demo"; // Placeholder

export function ContentPlanSpreadsheet({ 
  data, 
  businessName, 
  config, 
  title,
  selectedMonth,
  selectedYear,
  onPeriodChange,
  onChange,
  onConfigChange,
  onTitleChange,
  onApprove
}: { 
  data: SpreadsheetRow[]; 
  businessName?: string; 
  config?: SpreadsheetConfig;
  title?: string;
  selectedMonth: number;
  selectedYear: number;
  onPeriodChange: (month: number, year: number) => void;
  onChange: (newData: SpreadsheetRow[] | ((prev: SpreadsheetRow[]) => SpreadsheetRow[])) => void;
  onConfigChange: (newConfig: SpreadsheetConfig) => void;
  onTitleChange: (newTitle: string) => void;
  onApprove: (posts: any[]) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);

  // Dashboard Stats Logic
  const stats = useMemo(() => {
    const total = data.length;
    const realized = data.filter(r => !!r.contentUrl || (r.contentUrls && r.contentUrls.length > 0)).length;
    const unrealized = total - realized;
    const posted = data.filter(r => r.status?.toLowerCase() === 'posted').length;
    
    return {
      total,
      realized,
      unrealized,
      posted
    };
  }, [data]);

  const handleUpload = async (idx: number, filesInput: File | File[]) => {
    const files = Array.isArray(filesInput) ? filesInput : [filesInput];
    if (files.length === 0) return;
    
    let cloudName = ((import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || "").trim();
    let uploadPreset = ((import.meta as any).env.VITE_CLOUDINARY_PRESET || "").trim();

    // Sanitize if user pasted a full URL by accident
    if (cloudName.includes("cloudinary.com")) {
      const parts = cloudName.split("/");
      const vIndex = parts.indexOf("v1_1");
      if (vIndex !== -1 && parts[vIndex + 1]) {
        cloudName = parts[vIndex + 1];
      } else {
        cloudName = parts.pop() || cloudName;
      }
    }

    if (!cloudName || !uploadPreset || cloudName === "demo" || uploadPreset === "unsigned_preset") {
      toast.error("Konfigurasi Cloudinary Diperlukan", {
        description: (
          <div className="mt-2 text-[11px] space-y-2 leading-relaxed">
            <p>Fitur upload aset memerlukan 2 variabel di menu <span className="font-bold">Settings</span> AI Studio:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><span className="font-bold text-slate-800">VITE_CLOUDINARY_CLOUD_NAME</span>: Lihat di Dashboard Utama bagian <span className="italic underline">Cloud Name</span> (BUKAN API Key).</li>
              <li><span className="font-bold text-slate-800">VITE_CLOUDINARY_PRESET</span>: Nama <span className="text-rose-600 font-bold underline italic">Unsigned</span> Upload Preset.</li>
            </ul>
            <div className="p-2.5 bg-indigo-50 rounded-md border border-indigo-100 text-indigo-900">
              <p className="font-bold mb-1 font-mono uppercase text-[10px]">Langkah Cepat:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Buka Dashboard Cloudinary.</li>
                <li>Klik ikon <span className="font-bold">Gear (Settings)</span> &gt; tab <span className="font-bold">Upload</span>.</li>
                <li>Scroll ke bawah ke <span className="font-bold">Upload presets</span> &gt; Add upload preset.</li>
                <li>Ubah <span className="font-bold text-rose-600">Signing Mode</span> menjadi <span className="font-bold uppercase">Unsigned</span>.</li>
                <li>Salin <span className="italic">Preset name</span> yang baru dibuat ke Settings AI Studio.</li>
              </ol>
            </div>
          </div>
        ),
        duration: 25000
      });
      return;
    }

    setIsUploading(true);
    const row = data[idx];
    const picName = row.pic || "Other";
    const postDate = row.postDate || "no_date";
    const uploadDateStr = format(new Date(), "yyyy-MM-dd");
    const monthYear = format(new Date(), "MMM_yyyy").toLowerCase();
    const folderName = `konten_dina_${monthYear}`;

    // Process all files sequentially to ensure state integrity
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const toastId = toast.loading(`Unggah (${i + 1}/${files.length}): ${file.name}`);
        const fileName = `${picName}_${uploadDateStr}_${postDate.replace(/[, ]+/g, '_')}_${Date.now()}_${i}`;

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);
            formData.append('folder', folderName);
            formData.append('public_id', fileName);

            const response = await fetch(
              `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
              {
                  method: 'POST',
                  body: formData,
              }
            );

            if (!response.ok) {
              const errData = await response.json();
              throw new Error(errData.error?.message || "Upload failed.");
            }

            const result = await response.json();
            
            // Critical: Use functional update to avoid race conditions and state staleness
            onChange((prev: SpreadsheetRow[]) => {
                const updated = [...prev];
                const existingUrls = updated[idx].contentUrls || (updated[idx].contentUrl ? [updated[idx].contentUrl] : []);
                updated[idx] = {
                    ...updated[idx],
                    contentUrls: [...existingUrls, result.secure_url],
                    contentUrl: result.secure_url,
                    uploadDate: uploadDateStr,
                    status: "Approved" 
                };
                return updated;
            });

            toast.success(`${file.name} OK`, { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error(`Gagal: ${file.name}`, { description: (error as Error).message, id: toastId });
        }
    }
    setIsUploading(false);
  };

  const handleExportCSV = () => {
    if (!data) return;
    const headers = ["Week", "Date", "Type", "Detail Type", "Brief Plan", "Reference Link", "Caption", "Post Date", "PIC", "Status", "Content URL", "Upload Date"];
    const csvContent = [
      headers.join(","),
      ...data.map(row => [
        row.week,
        row.date,
        row.type,
        row.detailType,
        row.briefPlan.replace(/"/g, '""'),
        row.referenceLink || "",
        row.caption ? (row.caption || "").replace(/"/g, '""') : "",
        row.postDate,
        row.pic || "Other",
        row.status,
        row.contentUrl || "",
        row.uploadDate || ""
      ].map(val => `"${val}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `content_plan_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Period Selector & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex bg-white rounded-2xl border-2 border-slate-900 p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
             <button 
               onClick={() => {
                 let nextM = selectedMonth - 1;
                 let nextY = selectedYear;
                 if (nextM < 0) { nextM = 11; nextY--; }
                 onPeriodChange(nextM, nextY);
               }}
               className="p-2 hover:bg-slate-50 transition-colors rounded-xl"
             >
               <ChevronLeft size={16} />
             </button>
             <div className="flex items-center px-4 min-w-[140px] justify-center">
               <span className="text-xs font-black uppercase tracking-widest text-slate-900">
                 {new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(selectedYear, selectedMonth))} {selectedYear}
               </span>
             </div>
             <button 
               onClick={() => {
                 let nextM = selectedMonth + 1;
                 let nextY = selectedYear;
                 if (nextM > 11) { nextM = 0; nextY++; }
                 onPeriodChange(nextM, nextY);
               }}
               className="p-2 hover:bg-slate-50 transition-colors rounded-xl"
             >
               <ChevronRight size={16} />
             </button>
          </div>
          <div className="hidden md:flex flex-col">
             <h2 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase">Spreadsheet Strategi</h2>
             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               <CalendarCheck className="w-3 h-3" /> Periode Konten Terpilih
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV}
            className="border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-xs rounded-none h-10 px-6 bg-white hover:bg-slate-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-xs px-6 rounded-none h-10"
            onClick={() => {
              const postsToApprove = data.filter(r => r.status === "Approved").map(r => ({
                title: r.briefPlan || "Konten Baru",
                date: r.postDate ? parse(r.postDate, "MMMM d, yyyy", new Date()) : new Date(),
                platform: (r.type || "Other").toLowerCase(),
                status: "Scheduled",
                time: "09:00",
                ...r
              }));
              onApprove(postsToApprove);
            }}
          >
            <FileCheck className="w-4 h-4 mr-2" />
            Ke Kalender
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Total Konten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-emerald-600 shadow-[4px_4px_0px_0px_rgba(5,150,105,1)] rounded-none bg-emerald-50/30">
          <CardHeader className="pb-2 text-emerald-600">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-emerald-500">Konten Jadi (Uploaded)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-700">{stats.realized}</div>
            <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 size={10} /> Realisasi Berhasil
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-rose-600 shadow-[4px_4px_0px_0px_rgba(225,29,72,1)] rounded-none bg-rose-50/30">
          <CardHeader className="pb-2 text-rose-600">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-rose-500">Belum Terealisasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-700">{stats.unrealized}</div>
            <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
              <AlertCircle size={10} /> Butuh Perhatian
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-indigo-600 shadow-[4px_4px_0px_0px_rgba(79,70,229,1)] rounded-none bg-indigo-50/30">
          <CardHeader className="pb-2 text-indigo-600">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-indigo-500">Total Posted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-indigo-700">{stats.posted}</div>
            <div className="flex gap-1 mt-1">
               {stats.total > 0 && Array.from({length: 5}).map((_, i) => (
                 <div key={i} className={`h-1 flex-1 ${i < (stats.posted/stats.total)*5 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
               ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spreadsheet Control */}
      <Card className="border-2 border-slate-900 rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
        <CardContent className="p-0">
          <SpreadsheetPlan 
            data={data}
            businessName={businessName}
            config={config}
            title={title}
            onChange={onChange}
            onConfigChange={onConfigChange}
            onTitleChange={onTitleChange}
            onUpload={handleUpload}
          />
        </CardContent>
      </Card>
    </div>
  );
}
