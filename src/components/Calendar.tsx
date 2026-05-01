import { useState, useCallback } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  MoreVertical,
  Instagram,
  Twitter,
  Linkedin,
  Clock,
  LayoutGrid,
  Table as TableIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, addDays, startOfWeek, addWeeks, subWeeks, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";

import { Post } from "@/App";
import { SpreadsheetPlan, SpreadsheetRow } from "./SpreadsheetPlan";

export function Calendar({ 
  posts: initialPosts,
  onUpdatePost,
  spreadsheetConfig,
  spreadsheetTitle
}: { 
  posts: Post[],
  onUpdatePost: (id: string, updates: Partial<Post>) => void,
  spreadsheetConfig?: any,
  spreadsheetTitle?: string
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"grid" | "spreadsheet">("grid");
  
  // Use initialPosts directly from props to avoid stale state issues with approvals
  const posts = initialPosts;

  const startDate = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram": return <Instagram className="w-3 h-3" />;
      case "twitter": return <Twitter className="w-3 h-3" />;
      case "linkedin": return <Linkedin className="w-3 h-3" />;
      default: return null;
    }
  };

  // Adapter for SpreadsheetRow
  const spreadsheetData: SpreadsheetRow[] = posts.map(p => ({
    week: p.week || "",
    date: format(p.date, "dd MMMM"),
    type: p.platform === "instagram" ? "Reel" : "Feed", // Approximation
    detailType: p.detailType || "",
    briefPlan: p.briefPlan || p.title,
    referenceLink: p.referenceLink || "",
    caption: p.caption || "",
    postDate: format(p.date, "MMMM d, yyyy"),
    pic: p.pic || "Specialist",
    status: p.status
  }));

  const handleSpreadsheetChange = useCallback((newData: SpreadsheetRow[]) => {
    // Find what changed and update Firestore
    // For simplicity, we can just compare indexes if lengths are same
    if (newData.length !== posts.length) return; // Ignore add/delete for now inside calendar view

    newData.forEach((row, idx) => {
      const original = posts[idx];
      const updates: Partial<Post> = {};
      
      if (row.week !== original.week) updates.week = row.week;
      if (row.detailType !== original.detailType) updates.detailType = row.detailType;
      if (row.briefPlan !== original.briefPlan && row.briefPlan !== original.title) {
        updates.briefPlan = row.briefPlan;
        updates.title = row.briefPlan.slice(0, 50); // Sync title
      }
      if (row.caption !== original.caption) updates.caption = row.caption;
      if (row.referenceLink !== original.referenceLink) updates.referenceLink = row.referenceLink;
      if (row.pic !== original.pic) updates.pic = row.pic;
      if (row.status !== original.status) updates.status = row.status;
      
      const newDate = parse(row.postDate, "MMMM d, yyyy", new Date());
      if (isValid(newDate) && format(newDate, "yyyy-MM-dd") !== format(original.date, "yyyy-MM-dd")) {
        updates.date = newDate;
      }

      if (Object.keys(updates).length > 0) {
        onUpdatePost(original.id, updates);
      }
    });
  }, [posts, onUpdatePost]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Perencana Konten</h2>
          <p className="text-slate-500 mt-1">Atur dan jadwalkan kehadiran media sosial Anda.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
            <Button 
              variant={viewMode === "grid" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setViewMode("grid")}
              className="h-8 gap-2"
            >
              <LayoutGrid size={14} />
              Kalender
            </Button>
            <Button 
              variant={viewMode === "spreadsheet" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setViewMode("spreadsheet")}
              className="h-8 gap-2"
            >
              <TableIcon size={14} />
              Spreadsheet
            </Button>
          </div>
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-4 text-sm font-semibold">
              {format(startDate, "MMM d")} - {format(addDays(startDate, 6), "MMM d, yyyy")}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Postingan Baru
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dayPosts = posts.filter(p => format(p.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd"));
            const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

            return (
              <div key={day.toString()} className="space-y-3">
                <div className="text-center pb-2 border-b border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(day, "EEE")}</p>
                  <p className={cn(
                    "text-lg font-bold mt-1 w-8 h-8 flex items-center justify-center mx-auto rounded-full",
                    isToday ? "bg-indigo-600 text-white" : "text-slate-900"
                  )}>
                    {format(day, "d")}
                  </p>
                </div>

                <div className="space-y-2 min-h-[400px]">
                  {dayPosts.map((post) => (
                    <Card key={post.id} className="border-none shadow-sm bg-white hover:ring-1 hover:ring-indigo-200 transition-all cursor-pointer group">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className={cn(
                            "p-1 rounded-md",
                            post.platform === "instagram" ? "bg-pink-50 text-pink-600" :
                            post.platform === "twitter" ? "bg-sky-50 text-sky-600" :
                            "bg-blue-50 text-blue-600"
                          )}>
                            {getPlatformIcon(post.platform)}
                          </div>
                          <button className="text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-3 h-3" />
                          </button>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{post.title}</h4>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                            <Clock className="w-3 h-3" />
                            {post.time}
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-[9px] h-4 px-1.5",
                              post.status === "terjadwal" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                            )}
                          >
                            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <button className="w-full py-3 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:border-slate-200 hover:text-slate-400 transition-all">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="border-none shadow-sm bg-white overflow-hidden p-6">
          <SpreadsheetPlan 
            data={spreadsheetData} 
            businessName="Content Management" 
            config={spreadsheetConfig}
            title={spreadsheetTitle}
            onChange={handleSpreadsheetChange}
          />
        </Card>
      )}
    </div>
  );
}
