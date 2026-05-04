import { 
  LayoutDashboard, 
  PenTool, 
  BarChart3, 
  Calendar as CalendarIcon, 
  Settings,
  LogOut,
  Sparkles,
  MessageSquare,
  BarChart2,
  User,
  Users,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { View } from "@/App";
import { auth } from "../lib/firebase";
import { useAuth } from "../lib/AuthContext";

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onLogout: () => void;
}

const ADMIN_EMAIL = "geanpratama@gmail.com";

export function Sidebar({ currentView, onViewChange, onLogout }: SidebarProps) {
  const { user, profile } = useAuth();
  
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: user?.email === ADMIN_EMAIL ? "admin" : "accounts", label: user?.email === ADMIN_EMAIL ? "Kelola User GITS" : "Daftar Akun", icon: user?.email === ADMIN_EMAIL ? ShieldCheck : Users },
    { id: "auditor", label: "Audit & Strategi", icon: Sparkles },
    { id: "spreadsheet", label: "Spreadsheet Konten", icon: BarChart2 }, 
    { id: "specialist", label: "Diskusi Specialist", icon: MessageSquare },
    { id: "monitoring", label: "Monitoring Konten", icon: BarChart3 },
    { id: "generator", label: "AI Generator", icon: PenTool },
    { id: "analyzer", label: "Analisa Konten", icon: BarChart3 },
    { id: "stock", label: "Stock Footage", icon: ShieldCheck },
    { id: "calendar", label: "Kalender Konten", icon: CalendarIcon },
  ];

  return (
    <aside className="w-full flex flex-col h-full bg-white">
      {/* Brand Section */}
      <div className="p-8 pb-4 flex items-center gap-3">
        <div className="relative group">
          <div className="absolute -inset-1.5 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-indigo-600 p-2 rounded-xl shadow-lg border border-indigo-400">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>
        <h1 className="font-black text-2xl tracking-tighter text-slate-900 italic select-none">
          Social<span className="text-indigo-600">Pulse</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-none">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as View)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group relative overflow-hidden",
              currentView === item.id
                ? "bg-indigo-600 text-white shadow-[0_10px_20px_-5px_rgba(79,70,229,0.3)] scale-[1.02]"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            {currentView === item.id && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/40 rounded-r-full" />
            )}
            <item.icon className={cn(
              "w-5 h-5 transition-transform duration-200 group-hover:scale-110", 
              currentView === item.id ? "text-white" : "text-slate-400 group-hover:text-slate-700"
            )} />
            <span className="relative z-10">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-4 p-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-indigo-100 border border-indigo-50 flex items-center justify-center shrink-0 ring-4 ring-slate-50">
            <User className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-black text-slate-900 truncate uppercase tracking-wider">{profile?.businessType || 'User'}</p>
            <p className="text-[10px] text-slate-400 font-medium truncate">{user?.email}</p>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all group"
        >
          <LogOut className="w-5 h-5 text-slate-400 group-hover:text-rose-600" />
          Keluar Sesi
        </button>
      </div>
    </aside>
  );
}
