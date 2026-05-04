import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  ExternalLink, 
  User as UserIcon, 
  Plus, 
  Trash2, 
  ChevronDown, 
  Settings2, 
  PlusCircle,
  Calendar as CalendarIcon,
  Upload,
  Download,
  MoreVertical,
  MoreHorizontal,
  Layers,
  FileText,
  Clock,
  Eye,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { addDays, format, parse } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

export interface SpreadsheetRow {
  week: string;
  date: string;
  type: string;
  detailType: string;
  briefPlan: string;
  referenceLink?: string;
  caption?: string;
  postDate: string;
  pic?: string;
  status: string;
  contentUrl?: string; // Legacy support
  contentUrls?: string[]; // Multiple assets support
  uploadDate?: string;
}

export interface SpreadsheetConfig {
  types: string[];
  detailTypes: string[];
  pics: string[];
  statuses: string[];
}

const DEFAULT_CONFIG: SpreadsheetConfig = {
  types: ["Feed", "Reel", "Story", "Carousel"],
  detailTypes: ["Informative", "Promo", "Q&A", "Behind the Scenes", "Testimonial", "Engagement"],
  pics: ["Rindra", "Elle", "Other"],
  statuses: ["Draft", "Pending", "Approved", "Posted"]
};

export function SpreadsheetPlan({ 
  data, 
  businessName,
  config: propConfig,
  title: propTitle,
  onChange,
  onConfigChange,
  onTitleChange,
  onUpload
}: { 
  data: SpreadsheetRow[]; 
  businessName?: string;
  config?: SpreadsheetConfig;
  title?: string;
  onChange?: (newData: SpreadsheetRow[]) => void;
  onConfigChange?: (newConfig: SpreadsheetConfig) => void;
  onTitleChange?: (newTitle: string) => void;
  onUpload?: (idx: number, files: File | File[]) => void;
}) {
  const [config, setConfig] = useState<SpreadsheetConfig>(propConfig || DEFAULT_CONFIG);
  const [title, setTitle] = useState(propTitle || "");
  const currentMonthYear = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase();

  useEffect(() => {
    if (propConfig) setConfig(propConfig);
  }, [propConfig]);

  useEffect(() => {
    if (propTitle !== undefined) setTitle(propTitle);
  }, [propTitle]);

  const handleTitleChange = (newVal: string) => {
    setTitle(newVal);
    if (onTitleChange) onTitleChange(newVal);
  };

  const handleUpdate = (idx: number, field: keyof SpreadsheetRow, value: string) => {
    if (!onChange) return;
    const newData = [...data];
    newData[idx] = { ...newData[idx], [field]: value };
    onChange(newData);
  };

  const addRow = () => {
    if (!onChange) return;
    const newRow: SpreadsheetRow = {
      week: `Minggu ${Math.ceil((data.length + 1) / 7)}`,
      date: format(addDays(new Date(), data.length), "dd MMMM"),
      type: config.types[0] || "Feed",
      detailType: config.detailTypes[0] || "Informative",
      briefPlan: "",
      referenceLink: "",
      caption: "",
      postDate: format(addDays(new Date(), data.length), "MMMM d, yyyy"),
      pic: config.pics[0] || "Specialist",
      status: config.statuses[0] || "Draft"
    };
    onChange([...data, newRow]);
  };

  const deleteRow = (idx: number) => {
    if (!onChange) return;
    const newData = data.filter((_, i) => i !== idx);
    onChange(newData);
  };

  const updateConfig = (field: keyof SpreadsheetConfig, newOptions: string[]) => {
    const newConfig = { ...config, [field]: newOptions };
    setConfig(newConfig);
    if (onConfigChange) onConfigChange(newConfig);
  };

  const removeConfigOption = (field: keyof SpreadsheetConfig, option: string) => {
    updateConfig(field, config[field].filter(o => o !== option));
  };

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleRemoveAsset = (rowIdx: number, assetIdx: number) => {
    if (!onChange) return;
    const newData = [...data];
    const urls = [...(newData[rowIdx].contentUrls || [])];
    urls.splice(assetIdx, 1);
    newData[rowIdx] = { 
      ...newData[rowIdx], 
      contentUrls: urls,
      contentUrl: urls.length > 0 ? urls[urls.length - 1] : undefined
    };
    onChange(newData);
    toast.info("Aset dihapus dari tabel (Cloudinary tetap menyimpan file demi keamanan)");
  };

  const downloadFile = async (url: string, filename: string) => {
    const toastId = toast.loading("Menyiapkan download...");
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download dimulai", { id: toastId });
    } catch (error) {
      window.open(url, '_blank');
      toast.dismiss(toastId);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none">
          <div className="relative w-full aspect-video flex items-center justify-center p-4">
            <button 
              onClick={() => setPreviewUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md"
            >
              <XCircle className="w-6 h-6" />
            </button>
            {previewUrl && (
              previewUrl.match(/\.(mp4|webm|mov)$/i) ? (
                <video src={previewUrl} controls autoPlay className="max-w-full max-h-[80vh] rounded-lg shadow-2xl" />
              ) : (
                <img src={previewUrl} alt="Preview" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
              )
            )}
          </div>
          <div className="p-4 bg-slate-900 border-t border-white/10 flex justify-between items-center">
             <div className="flex gap-2">
                <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => previewUrl && downloadFile(previewUrl, "content_asset")}>
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
                <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => previewUrl && window.open(previewUrl, '_blank')}>
                  <Eye className="w-4 h-4 mr-2" /> Open Original
                </Button>
             </div>
             <p className="text-[10px] text-slate-400 font-mono hidden sm:block truncate max-w-[300px]">{previewUrl}</p>
          </div>
        </DialogContent>
      </Dialog>
      {/* Mobile-Only Header */}
      <div className="md:hidden p-4 bg-slate-900 text-white flex items-center justify-between">
        <h3 className="font-black text-sm uppercase tracking-widest truncate max-w-[200px]">
          {title || businessName || "Untitled Plan"}
        </h3>
        <Button size="icon" variant="ghost" onClick={addRow} className="text-white hover:bg-white/20">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex justify-between items-center px-4 md:px-0">
        <div className="hidden md:flex gap-2">
          <input 
            className="bg-transparent text-slate-900 font-black text-lg tracking-tight focus:outline-none border-b-2 border-transparent focus:border-slate-900 pb-1"
            value={title || `CONTENT PLAN ${businessName?.toUpperCase() || 'USER'} ${currentMonthYear}`}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="NAMA CONTENT PLAN"
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" size="sm" className="text-slate-600 border-slate-200 shadow-sm bg-white hover:bg-slate-50" />}>
              <Settings2 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Kustomisasi Spreadsheet</DialogTitle>
                <DialogDescription>Atur pilihan kategori agar sesuai dengan kebutuhan manajemen konten Anda.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <CategoryManager title="Tipe Konten" options={config.types} onAdd={(opt) => updateConfig('types', [...config.types, opt])} onRemove={(opt) => removeConfigOption('types', opt)} placeholder="cth: TikTok Live" />
                <CategoryManager title="Detail Kategori" options={config.detailTypes} onAdd={(opt) => updateConfig('detailTypes', [...config.detailTypes, opt])} onRemove={(opt) => removeConfigOption('detailTypes', opt)} placeholder="cth: Tutorial" />
                <CategoryManager title="Role / PIC" options={config.pics} onAdd={(opt) => updateConfig('pics', [...config.pics, opt])} onRemove={(opt) => removeConfigOption('pics', opt)} placeholder="cth: Editor" />
                <CategoryManager title="Status Verifikasi" options={config.statuses} onAdd={(opt) => updateConfig('statuses', [...config.statuses, opt])} onRemove={(opt) => removeConfigOption('statuses', opt)} placeholder="cth: Revisi" />
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={addRow} size="sm" className="bg-slate-900 hover:bg-slate-800 text-white shadow-md hidden sm:flex">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Baris
          </Button>
        </div>
      </div>

      {/* MOBILE LIST VIEW (Under 768px) */}
      <div className="md:hidden space-y-4 px-4 pb-10">
        {data.map((row, idx) => (
            <MobileCard 
              key={idx} 
              row={row} 
              idx={idx} 
              config={config} 
              onUpdate={handleUpdate} 
              onDelete={deleteRow} 
              onUpload={onUpload} 
              onRemoveAsset={handleRemoveAsset}
              onDownload={downloadFile}
              onPreview={setPreviewUrl}
            />
        ))}
        {data.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
             <Layers className="mx-auto w-8 h-8 text-slate-300 mb-2" />
             <p className="text-sm font-medium text-slate-400">Belum ada konten direncanakan.</p>
          </div>
        )}
      </div>

      {/* DESKTOP SPREADSHEET VIEW (Above 768px) */}
      <div className="hidden md:block w-full overflow-hidden border border-slate-200 rounded-xl bg-white shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="w-full border-collapse text-[12px] table-fixed">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 font-extrabold border-b border-slate-100 text-left uppercase tracking-[0.1em] text-[9px]">
                <th className="p-4 border-r border-slate-50 w-[70px]">Minggu</th>
                <th className="p-4 border-r border-slate-50 w-[110px]">Tanggal</th>
                <th className="p-4 border-r border-slate-50 w-[130px]">Format</th>
                <th className="p-4 border-r border-slate-50 w-[140px]">Kategori</th>
                <th className="p-4 border-r border-slate-50 w-[550px]">Rencana Kreatif</th>
                <th className="p-4 border-r border-slate-50 w-[180px]">Referensi</th>
                <th className="p-4 border-r border-slate-50 w-[130px]">Post Date</th>
                <th className="p-4 border-r border-slate-50 w-[100px]">PIC</th>
                <th className="p-4 border-r border-slate-50 w-[120px]">Status</th>
                <th className="p-4 border-r border-slate-50 w-[100px]">Aset</th>
                <th className="p-4 w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((row, idx) => (
                <tr key={idx} className="group hover:bg-indigo-50/20 transition-all duration-200">
                  <td className="p-0 border-r border-slate-50 align-top">
                    <textarea 
                      className="w-full p-4 bg-transparent text-center font-bold text-slate-400 focus:text-slate-900 focus:bg-white focus:outline-none resize-none border-none min-h-[60px]" 
                      value={row.week}
                      onChange={(e) => handleUpdate(idx, 'week', e.target.value)}
                    />
                  </td>
                  <td className="p-0 border-r border-slate-50 align-top">
                    <textarea 
                      className="w-full p-4 bg-transparent text-center font-black text-slate-900 focus:bg-white focus:outline-none resize-none border-none min-h-[60px]" 
                      value={row.date}
                      onChange={(e) => handleUpdate(idx, 'date', e.target.value)}
                    />
                  </td>
                  <td className="p-3 border-r border-slate-50 align-top text-center">
                    <Select value={row.type} onValueChange={(val) => handleUpdate(idx, 'type', val)}>
                      <SelectTrigger className={cn(
                        "border-none h-7 px-2 rounded-lg text-[10px] font-black w-full focus:ring-0 shadow-sm uppercase tracking-wider",
                        row.type === "Reel" ? "bg-rose-50 text-rose-600 ring-1 ring-rose-100" : 
                        row.type === "Carousel" ? "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100" :
                        row.type === "Feed" ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100" :
                        "bg-slate-50 text-slate-600 ring-1 ring-slate-100"
                      )}>
                        <div className="flex items-center gap-1 justify-center truncate">
                          <Layers size={10} className="shrink-0" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {config.types.map(opt => (
                          <SelectItem key={opt} value={opt} className="text-[10px] font-black uppercase">{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3 border-r border-slate-50 align-top">
                    <Select value={row.detailType} onValueChange={(val) => handleUpdate(idx, 'detailType', val)}>
                      <SelectTrigger className="bg-white border border-slate-100 h-7 px-2 rounded-lg text-[10px] font-bold w-full focus:ring-1 shadow-sm text-slate-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {config.detailTypes.map(opt => (
                          <SelectItem key={opt} value={opt} className="text-[10px]">{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-0 border-r border-slate-50 align-top">
                    <textarea 
                      className="w-full p-4 bg-transparent text-slate-700 placeholder:text-slate-300 focus:bg-white focus:ring-1 focus:ring-indigo-100 focus:outline-none resize min-h-[80px] leading-relaxed font-medium transition-all" 
                      value={row.briefPlan}
                      placeholder="Input brief konten..."
                      onChange={(e) => handleUpdate(idx, 'briefPlan', e.target.value)}
                    />
                  </td>
                  <td className="p-0 border-r border-slate-50 align-top">
                    <textarea 
                      className="w-full p-4 bg-transparent text-blue-500 underline text-[10px] break-all focus:bg-white focus:outline-none resize-none min-h-[60px] italic" 
                      value={row.referenceLink || ''}
                      placeholder="Link ref..."
                      onChange={(e) => handleUpdate(idx, 'referenceLink', e.target.value)}
                    />
                  </td>
                  <td className="p-0 border-r border-slate-50 align-top">
                    <Popover>
                      <PopoverTrigger render={<button className="w-full p-4 h-full bg-transparent text-center font-black text-slate-900 group-hover:text-indigo-600 focus:bg-white hover:bg-slate-50/80 outline-none transition-colors" />}>
                        {row.postDate ? format(parse(row.postDate, "MMMM d, yyyy", new Date()), "dd/MM/yy") : "-"}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 shadow-2xl border-indigo-100" align="start">
                        <Calendar
                          mode="single"
                          selected={(() => {
                            try { return parse(row.postDate, "MMMM d, yyyy", new Date()); } 
                            catch { return new Date(); }
                          })()}
                          onSelect={(date) => {
                            if (date) {
                              handleUpdate(idx, 'postDate', format(date, "MMMM d, yyyy"));
                              handleUpdate(idx, 'date', format(date, "dd MMMM"));
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </td>
                  <td className="p-3 border-r border-slate-50 align-top">
                    <Select value={row.pic || 'Rindra'} onValueChange={(val) => handleUpdate(idx, 'pic', val)}>
                      <SelectTrigger className="bg-white border border-slate-100 h-7 px-2 rounded-lg text-[10px] font-black w-full focus:ring-1 shadow-sm text-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {config.pics.map(opt => (
                          <SelectItem key={opt} value={opt} className="text-[10px] font-bold">{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3 border-r border-slate-50 align-top">
                    <Select value={row.status} onValueChange={(val) => handleUpdate(idx, 'status', val)}>
                      <SelectTrigger className={cn(
                        "h-7 px-2 rounded-full text-[9px] font-black w-full border focus:ring-0 shadow-sm uppercase tracking-[0.1em]",
                        row.status === "Approved" ? "bg-emerald-500 text-white border-emerald-400" : 
                        row.status === "Draft" ? "bg-slate-100 text-slate-400 border-slate-200" :
                        row.status === "Revisi" ? "bg-rose-500 text-white border-rose-400" :
                        "bg-amber-500 text-white border-amber-400"
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {config.statuses.map(opt => (
                          <SelectItem key={opt} value={opt} className="text-[9px] font-black tracking-[0.1em] uppercase">{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3 border-r border-slate-50 align-top">
                    <div className="flex flex-col gap-2 items-stretch">
                      {/* Asset Gallery List */}
                      <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto scrollbar-none">
                        {(row.contentUrls || (row.contentUrl ? [row.contentUrl] : [])).map((url, uidx) => (
                          <div key={uidx} className="relative group/asset">
                            <div className="w-8 h-8 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden">
                               {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                 <img src={url} alt="asset" className="w-full h-full object-cover" />
                               ) : (
                                 <FileText size={12} className="text-indigo-400" />
                               )}
                            </div>
                            
                            {/* Hover Actions */}
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/asset:opacity-100 transition-opacity flex items-center justify-center gap-0.5 rounded-md">
                               <button 
                                 onClick={() => setPreviewUrl(url)}
                                 className="p-0.5 text-white hover:text-indigo-300"
                                 title="Preview"
                               >
                                 <Eye size={10} />
                               </button>
                               <button 
                                 onClick={() => downloadFile(url, `asset_${idx}_${uidx}`)}
                                 className="p-0.5 text-white hover:text-indigo-300"
                                 title="Download"
                               >
                                 <Download size={10} />
                               </button>
                               <button 
                                 onClick={() => handleRemoveAsset(idx, uidx)}
                                 className="p-0.5 text-white hover:text-rose-400"
                                 title="Hapus"
                               >
                                 <XCircle size={10} />
                               </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="relative overflow-hidden rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-400 hover:ring-2 hover:ring-indigo-100 transition-all group/u shrink-0">
                        <input 
                          type="file" 
                          multiple
                          className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && onUpload) {
                              onUpload(idx, Array.from(files));
                            }
                            // Reset value so same file can be uploaded again
                            e.target.value = '';
                          }}
                        />
                        <div className="py-1.5 flex items-center justify-center gap-1.5 text-[8px] font-black text-slate-400 group-hover/u:text-indigo-600 uppercase tracking-tighter">
                          <Upload size={10} />
                          Tambah Aset
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-top text-center">
                    <button 
                      onClick={() => deleteRow(idx)}
                      className="p-2 rounded-full text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// MOBILE COMPONENT
function MobileCard({ row, idx, config, onUpdate, onDelete, onUpload, onRemoveAsset, onDownload, onPreview }: any) {
  return (
    <Card className="border border-slate-200 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
      <CardHeader className="p-4 bg-white border-b border-slate-50 flex flex-row items-center justify-between space-y-0">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-1.5 py-0.5 bg-slate-900 text-white rounded uppercase tracking-tighter">{row.week}</span>
            <h4 className="text-sm font-black text-slate-900 tracking-tight">{row.date}</h4>
          </div>
          <div className="flex gap-1.5">
            <Badge className={cn(
              "text-[8px] uppercase font-black tracking-widest px-2 py-0.5 shadow-none border-none",
              row.type === "Reel" ? "bg-rose-50 text-rose-600" : 
              row.type === "Carousel" ? "bg-indigo-50 text-indigo-600" :
              "bg-emerald-50 text-emerald-600"
            )} variant="secondary">
              {row.type}
            </Badge>
            <Badge className={cn(
              "text-[8px] uppercase font-black tracking-widest px-2 py-0.5 shadow-none border-none",
              row.status === "Approved" ? "bg-emerald-500 text-white" : 
              row.status === "Revisi" ? "bg-rose-500 text-white" :
              "bg-slate-100 text-slate-400"
            )}>
              {row.status}
            </Badge>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-xl" />}>
            <MoreVertical size={18} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px] p-2 rounded-xl shadow-xl border-slate-100">
            <DropdownMenuItem onClick={() => {}} className="rounded-lg font-bold text-xs">
              <FileText className="w-4 h-4 mr-2 text-slate-400" /> Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg font-bold text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-50" onClick={() => onDelete(idx)}>
              <Trash2 className="w-4 h-4 mr-2" /> Hapus Konten
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="p-5 space-y-5 bg-slate-50/30">
        <div className="space-y-1.5">
           <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Rencana Kreatif</label>
           <Textarea 
             className="text-xs bg-white border-slate-100 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all rounded-xl min-h-[80px] font-medium leading-relaxed"
             value={row.briefPlan}
             onChange={(e) => onUpdate(idx, 'briefPlan', e.target.value)}
             placeholder="Tulis instruksi konten di sini..."
           />
        </div>

        {/* Asset List for Mobile */}
        <div className="space-y-2">
           <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Aset Uploaded</label>
           <div className="grid grid-cols-4 gap-2">
              {(row.contentUrls || (row.contentUrl ? [row.contentUrl] : [])).map((url: string, uidx: number) => (
                <div key={uidx} className="relative group/m-asset">
                   <div 
                      className="aspect-square rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm active:scale-95 transition-transform"
                      onClick={() => onPreview(url)}
                   >
                      {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img src={url} alt="asset" className="w-full h-full object-cover" />
                      ) : (
                        <FileText size={16} className="text-slate-300" />
                      )}
                   </div>
                   <div className="absolute top-0 right-0 p-1 flex gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDownload(url, `asset_${idx}_${uidx}`); }}
                        className="bg-indigo-600 text-white p-1 rounded-md shadow-lg"
                      >
                        <Download size={10} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onRemoveAsset(idx, uidx); }}
                        className="bg-rose-600 text-white p-1 rounded-md shadow-lg"
                      >
                        <XCircle size={10} />
                      </button>
                   </div>
                </div>
              ))}
              
              <div className="relative aspect-square rounded-xl border border-dashed border-slate-300 flex items-center justify-center bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-colors">
                <input 
                   type="file" 
                   multiple
                   className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                   onChange={(e) => {
                     const files = e.target.files;
                     if (files && onUpload) {
                       onUpload(idx, Array.from(files));
                     }
                     e.target.value = '';
                   }}
                />
                <Plus size={16} className="text-slate-300" />
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100/80">
           <div className="space-y-1.5">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] flex items-center gap-1"><Clock size={10} /> Jam Post</label>
             <Select value={row.status} onValueChange={(val) => onUpdate(idx, 'status', val)}>
               <SelectTrigger className="h-9 text-[11px] font-bold bg-white border-slate-100 rounded-xl px-3">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent className="rounded-xl">
                 {config.statuses.map((s: string) => <SelectItem key={s} value={s} className="text-xs font-bold">{s}</SelectItem>)}
               </SelectContent>
             </Select>
           </div>
           <div className="space-y-1.5">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] flex items-center gap-1"><UserIcon size={10} /> PIC</label>
             <Select value={row.pic || 'Rindra'} onValueChange={(val) => onUpdate(idx, 'pic', val)}>
               <SelectTrigger className="h-9 text-[11px] font-bold bg-white border-slate-100 rounded-xl px-3">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent className="rounded-xl">
                 {config.pics.map((p: string) => <SelectItem key={p} value={p} className="text-xs font-bold">{p}</SelectItem>)}
               </SelectContent>
             </Select>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryManager({ 
  title, 
  options, 
  onAdd, 
  onRemove, 
  placeholder 
}: { 
  title: string;
  options: string[];
  onAdd: (opt: string) => void;
  onRemove: (opt: string) => void;
  placeholder: string;
}) {
  const [localValue, setLocalValue] = useState("");

  const handleAdd = () => {
    if (!localValue.trim()) return;
    if (options.includes(localValue.trim())) {
      setLocalValue("");
      return;
    }
    onAdd(localValue.trim());
    setLocalValue("");
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-slate-50/50">
      <h4 className="text-sm font-bold text-slate-700 border-b pb-1">{title}</h4>
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {options.map(opt => (
          <Badge key={opt} variant="secondary" className="bg-white border-slate-200 pr-1 gap-1">
            {opt}
            <button 
              onClick={() => onRemove(opt)}
              className="hover:text-rose-500 rounded-full p-0.5"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input 
          size={1}
          placeholder={placeholder}
          className="h-8 text-xs bg-white"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
        />
        <Button size="sm" className="h-8 w-8 p-0 shrink-0" onClick={handleAdd}>
          <PlusCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
