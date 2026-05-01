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
}

const ADMIN_EMAIL = "geanpratama@gmail.com";

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { user, profile } = useAuth();
  
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: user?.email === ADMIN_EMAIL ? "admin" : "accounts", label: user?.email === ADMIN_EMAIL ? "Kelola User GITS" : "Daftar Akun", icon: user?.email === ADMIN_EMAIL ? ShieldCheck : Users },
    { id: "auditor", label: "Audit & Strategi", icon: Sparkles },
    { id: "specialist", label: "Diskusi Specialist", icon: MessageSquare },
    { id: "monitoring", label: "Monitoring Konten", icon: BarChart2 },
    { id: "generator", label: "AI Generator", icon: PenTool },
    { id: "analyzer", label: "Analisa Konten", icon: BarChart3 },
    { id: "calendar", label: "Kalender Konten", icon: CalendarIcon },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-full shadow-sm">
      <div className="p-6 flex items-center gap-2">
        <div className="bg-indigo-600 p-1.5 rounded-lg shadow-indigo-200 shadow-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-bold text-xl tracking-tight text-slate-900 italic">SocialPulse</h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as View)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
              currentView === item.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
            )}
          >
            <item.icon className={cn("w-5 h-5", currentView === item.id ? "text-white" : "text-slate-400 group-hover:text-indigo-600")} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-6 px-3">
          <div className="h-10 w-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-900 truncate">{profile?.businessType || 'User'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        
        <button 
          onClick={() => auth.signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all group"
        >
          <LogOut className="w-5 h-5 text-slate-400 group-hover:text-rose-600" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
