import { Card, CardContent } from "@/components/ui/card";
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
  Calendar as CalendarIcon
} from "lucide-react";
import { addDays, format, parse } from "date-fns";
import { id } from "date-fns/locale";
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
  pics: ["Specialist", "Client", "Admin", "Designer"],
  statuses: ["Draft", "Pending", "Approved", "Posted"]
};

export function SpreadsheetPlan({ 
  data, 
  businessName,
  config: propConfig,
  title: propTitle,
  onChange,
  onConfigChange,
  onTitleChange
}: { 
  data: SpreadsheetRow[]; 
  businessName?: string;
  config?: SpreadsheetConfig;
  title?: string;
  onChange?: (newData: SpreadsheetRow[]) => void;
  onConfigChange?: (newConfig: SpreadsheetConfig) => void;
  onTitleChange?: (newTitle: string) => void;
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

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-end gap-2">
        <Dialog>
          <DialogTrigger
            render={
              <Button variant="outline" size="sm" className="text-slate-600 border-slate-200" />
            }
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Manage Categories
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Spreadsheet Categories</DialogTitle>
              <DialogDescription>
                Add or remove options for types, roles, and statuses in your content plan.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Type Category */}
              <CategoryManager 
                title="Content Types" 
                options={config.types} 
                onAdd={(opt) => updateConfig('types', [...config.types, opt])} 
                onRemove={(opt) => removeConfigOption('types', opt)}
                placeholder="e.g., Short Video"
              />
              
              {/* Detail Type Category */}
              <CategoryManager 
                title="Detail Types" 
                options={config.detailTypes} 
                onAdd={(opt) => updateConfig('detailTypes', [...config.detailTypes, opt])} 
                onRemove={(opt) => removeConfigOption('detailTypes', opt)}
                placeholder="e.g., Educational"
              />

              {/* PIC Category */}
              <CategoryManager 
                title="Roles (PIC)" 
                options={config.pics} 
                onAdd={(opt) => updateConfig('pics', [...config.pics, opt])} 
                onRemove={(opt) => removeConfigOption('pics', opt)}
                placeholder="e.g., Video Editor"
              />

              {/* Status Category */}
              <CategoryManager 
                title="Statuses" 
                options={config.statuses} 
                onAdd={(opt) => updateConfig('statuses', [...config.statuses, opt])} 
                onRemove={(opt) => removeConfigOption('statuses', opt)}
                placeholder="e.g., In Progress"
              />
            </div>
          </DialogContent>
        </Dialog>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={addRow}
          className="text-indigo-600 border-indigo-200 hover:bg-slate-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Baris
        </Button>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="min-w-[1200px] border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white">
          {/* Main Header */}
          <div className="bg-[#B7D7A8] p-3 text-center border-b border-slate-300">
            <input 
              className="bg-transparent text-[#38761D] font-bold text-xl tracking-wider text-center w-full focus:outline-none border-b border-transparent focus:border-[#38761D]/30"
              value={title || `CONTENT PLAN MEDSOS ${businessName?.toUpperCase() || 'USER BUSINESS'} ${currentMonthYear}`}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="JUDUL CONTENT PLAN"
            />
          </div>

          {/* Table Content */}
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#CFE2F3] text-slate-700 font-bold border-b border-slate-300 text-left">
                <th className="p-2 border-r border-slate-300 w-16">Week</th>
                <th className="p-2 border-r border-slate-300 w-24">Date</th>
                <th className="p-2 border-r border-slate-300 w-32">Type</th>
                <th className="p-2 border-r border-slate-300 w-32">Detail Type</th>
                <th className="p-2 border-r border-slate-300 min-w-[300px]">Brief Plan</th>
                <th className="p-2 border-r border-slate-300 w-48">Reference - Link</th>
                <th className="p-2 border-r border-slate-300 w-48">Caption</th>
                <th className="p-2 border-r border-slate-300 w-32">POST DATE</th>
                <th className="p-2 border-r border-slate-300 w-32">PIC</th>
                <th className="p-2 border-r border-slate-300 w-24">Status</th>
                <th className="p-2 w-10 text-center text-slate-400">X</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors">
                  <td className="p-0 border-r border-slate-200">
                    <input 
                      className="w-full p-2 bg-transparent text-center focus:bg-white focus:outline-none" 
                      value={row.week}
                      onChange={(e) => handleUpdate(idx, 'week', e.target.value)}
                    />
                  </td>
                  <td className="p-0 border-r border-slate-200">
                    <input 
                      className="w-full p-2 bg-transparent text-center focus:bg-white focus:outline-none" 
                      value={row.date}
                      onChange={(e) => handleUpdate(idx, 'date', e.target.value)}
                    />
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <div className="flex justify-center">
                      <Select value={row.type} onValueChange={(val) => handleUpdate(idx, 'type', val)}>
                        <SelectTrigger className="bg-[#990000] text-white border-none h-6 px-3 rounded-full text-[10px] font-medium w-auto focus:ring-0">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {config.types.map(opt => (
                            <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <div className="flex justify-center">
                      <Select value={row.detailType} onValueChange={(val) => handleUpdate(idx, 'detailType', val)}>
                        <SelectTrigger className="bg-[#EFEFEF] text-slate-700 border border-slate-300 h-6 px-3 rounded-full text-[10px] font-medium w-auto focus:ring-0 shadow-sm">
                          <SelectValue placeholder="Detail" />
                        </SelectTrigger>
                        <SelectContent>
                          {config.detailTypes.map(opt => (
                            <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  <td className="p-0 border-r border-slate-200">
                    <textarea 
                      className="w-full p-3 bg-transparent resize-none leading-relaxed focus:bg-white focus:outline-none min-h-[80px]" 
                      value={row.briefPlan}
                      onChange={(e) => handleUpdate(idx, 'briefPlan', e.target.value)}
                    />
                  </td>
                  <td className="p-0 border-r border-slate-200">
                    <input 
                      className="w-full p-2 bg-transparent text-blue-600 underline focus:bg-white focus:outline-none" 
                      value={row.referenceLink || ''}
                      onChange={(e) => handleUpdate(idx, 'referenceLink', e.target.value)}
                    />
                  </td>
                  <td className="p-0 border-r border-slate-200">
                    <textarea 
                      className="w-full p-2 bg-transparent italic text-slate-500 resize-none focus:bg-white focus:outline-none" 
                      value={row.caption || ''}
                      onChange={(e) => handleUpdate(idx, 'caption', e.target.value)}
                    />
                  </td>
                  <td className="p-0 border-r border-slate-200">
                    <Popover>
                      <PopoverTrigger render={<button className="w-full h-full p-2 bg-transparent text-center focus:bg-white focus:outline-none cursor-pointer">{row.postDate}</button>} />
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={(() => {
                            try {
                              return parse(row.postDate, "MMMM d, yyyy", new Date());
                            } catch {
                              return new Date();
                            }
                          })()}
                          onSelect={(date) => {
                            if (date) {
                              handleUpdate(idx, 'postDate', format(date, "MMMM d, yyyy"));
                              // Also sync the display date
                              handleUpdate(idx, 'date', format(date, "dd MMMM"));
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <div className="flex justify-center">
                      <Select value={row.pic || 'Specialist'} onValueChange={(val) => handleUpdate(idx, 'pic', val)}>
                        <SelectTrigger className="bg-[#F4CCCC] text-[#990000] border border-[#E06666] h-6 px-3 rounded-full text-[10px] font-bold w-auto focus:ring-0 shadow-sm">
                          <SelectValue placeholder="PIC" />
                        </SelectTrigger>
                        <SelectContent>
                          {config.pics.map(opt => (
                            <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <div className="flex justify-center">
                      <Select value={row.status} onValueChange={(val) => handleUpdate(idx, 'status', val)}>
                        <SelectTrigger className="bg-[#EFEFEF] text-slate-600 border border-slate-300 h-6 px-3 rounded-full text-[10px] font-medium w-auto focus:ring-0 shadow-inner">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {config.statuses.map(opt => (
                            <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    <button 
                      onClick={() => deleteRow(idx)}
                      className="text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={14} />
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
