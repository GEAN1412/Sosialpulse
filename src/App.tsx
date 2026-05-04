/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { ContentGenerator } from "./components/ContentGenerator";
import { ContentAnalyzer } from "./components/ContentAnalyzer";
import { ProfileAuditor } from "./components/ProfileAuditor";
import { Calendar } from "./components/Calendar";
import { AuthForm } from "./components/Auth";
import { Onboarding } from "./components/Onboarding";
import { ChatSpecialist } from "./components/ChatSpecialist";
import { ContentMonitoring } from "./components/ContentMonitoring";
import { AccountManager } from "./components/AccountManager";
import { AdminPanel } from "./components/AdminPanel";
import { ContentPlanSpreadsheet } from "./components/ContentPlanSpreadsheet";
import { StockFootage } from "./components/StockFootage";
import { useAuth } from "./lib/AuthContext";
import { auth, db } from "./lib/firebase";
import { doc, updateDoc, addDoc, collection, serverTimestamp, query, where, getDocs, onSnapshot, limit, setDoc } from "firebase/firestore";

import { handleFirestoreError, OperationType } from "./lib/firestoreUtils";
import { Toaster, toast } from "sonner";
import { Loader2, Menu, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type View = "dashboard" | "generator" | "analyzer" | "auditor" | "calendar" | "specialist" | "monitoring" | "accounts" | "admin" | "spreadsheet" | "stock";

export interface Post {
  id: string;
  userId: string;
  title: string;
  date: Date;
  platform: string;
  status: string;
  time: string;
  week?: string;
  detailType?: string;
  briefPlan?: string;
  referenceLink?: string;
  caption?: string;
  pic?: string;
}

export default function App() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const ADMIN_EMAIL = "geanpratama@gmail.com";
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on view change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [currentView]);

  // Force Admin to Admin Panel if they just logged in and have no choice selected yet
  useEffect(() => {
    if (user?.email === ADMIN_EMAIL && currentView === "dashboard") {
      setCurrentView("admin");
    }
  }, [user]);
  const [auditData, setAuditData] = useState<any>(null);
  const [auditMarkdown, setAuditMarkdown] = useState<string | null>(null);
  const [contentPlan, setContentPlan] = useState<string | null>(null);
  const [spreadsheetConfig, setSpreadsheetConfig] = useState<any>(null);
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>("");
  const [spreadsheetData, setSpreadsheetData] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [calendarPosts, setCalendarPosts] = useState<Post[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with profile data on load or period change
  useEffect(() => {
    if (profile) {
      if (profile.auditData) setAuditData(profile.auditData);
      if (profile.auditMarkdown) setAuditMarkdown(profile.auditMarkdown);
      if (profile.spreadsheetConfig) setSpreadsheetConfig(profile.spreadsheetConfig);
      if (profile.spreadsheetTitle) setSpreadsheetTitle(profile.spreadsheetTitle);
    }
  }, [profile]);

  // Fetch monthly content plan
  useEffect(() => {
    if (!user) return;
    
    const periodId = `${selectedMonth + 1}_${selectedYear}`;
    const planRef = doc(db, 'users', user.uid, 'monthlyPlans', periodId);
    
    const unsubscribe = onSnapshot(planRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data.plan) {
          try {
            const parsed = JSON.parse(data.plan);
            setSpreadsheetData(parsed || []);
          } catch (e) {
            setSpreadsheetData([]);
          }
        } else {
          setSpreadsheetData([]);
        }
      } else {
        // Look in legacy profile.contentPlan if it's the current month and we have nothing
        const now = new Date();
        if (selectedMonth === now.getMonth() && selectedYear === now.getFullYear() && profile?.contentPlan) {
           try {
             const parsed = JSON.parse(profile.contentPlan);
             setSpreadsheetData(parsed || []);
           } catch (e) {
             setSpreadsheetData([]);
           }
        } else {
          setSpreadsheetData([]);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, planRef.path);
    });

    return () => unsubscribe();
  }, [user, selectedMonth, selectedYear, profile?.contentPlan]);

  // Fetch scheduled posts real-time
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'scheduledPosts'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const posts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        let dateObj = new Date();
        if (data.date?.toDate) {
          dateObj = data.date.toDate();
        } else if (data.date instanceof Date) {
          dateObj = data.date;
        } else if (typeof data.date === 'string') {
          dateObj = new Date(data.date);
        }
        
        return {
          ...data,
          id: doc.id,
          date: isNaN(dateObj.getTime()) ? new Date() : dateObj
        } as unknown as Post;
      });
      setCalendarPosts(posts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'scheduledPosts');
    });

    return () => unsubscribe();
  }, [user]);

  const saveAuditResults = async (data: any, markdown: string) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        auditData: data,
        auditMarkdown: markdown,
        updatedAt: serverTimestamp()
      });
      setAuditData(data);
      setAuditMarkdown(markdown);
      toast.success("Hasil audit tersimpan.");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const saveContentPlan = async (plan: string) => {
    if (!user) return;
    try {
      setIsSaving(true);
      const periodId = `${selectedMonth + 1}_${selectedYear}`;
      const monthlyPlanPath = `users/${user.uid}/monthlyPlans/${periodId}`;
      
      // Save using setDoc with merge to avoid 'missing document' errors during update
      await setDoc(doc(db, 'users', user.uid, 'monthlyPlans', periodId), {
        plan,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Also sync legacy field if it's current month
      const now = new Date();
      if (selectedMonth === now.getMonth() && selectedYear === now.getFullYear()) {
        await updateDoc(doc(db, 'users', user.uid), {
          contentPlan: plan,
          updatedAt: serverTimestamp()
        });
      }

      setContentPlan(plan);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/monthlyPlans`);
    } finally {
      setIsSaving(false);
    }
  };

  const saveSpreadsheetConfig = async (config: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        spreadsheetConfig: config,
        updatedAt: serverTimestamp()
      });
      setSpreadsheetConfig(config);
    } catch (error) {
      console.error("Error saving config:", error);
    }
  };

  const saveSpreadsheetTitle = async (title: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        spreadsheetTitle: title,
        updatedAt: serverTimestamp()
      });
      setSpreadsheetTitle(title);
    } catch (error) {
      console.error("Error saving title:", error);
    }
  };

  const handleApprovePlan = async (posts: Omit<Post, 'id' | 'userId'>[]) => {
    if (!user) return;
    try {
      const batchPromises = posts.map(post => 
        addDoc(collection(db, 'scheduledPosts'), {
          ...post,
          userId: user.uid,
          createdAt: serverTimestamp()
        })
      );
      await Promise.all(batchPromises);
      toast.success(`${posts.length} postingan dijadwalkan.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'scheduledPosts');
    }
  };

  const handleUpdatePost = async (postId: string, updates: Partial<Post>) => {
    if (!user) return;
    const path = `scheduledPosts/${postId}`;
    try {
      await updateDoc(doc(db, 'scheduledPosts', postId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthForm />
        <Toaster />
      </>
    );
  }

  if (!profile?.onboardingComplete && user?.email !== ADMIN_EMAIL) {
    return (
      <>
        <Onboarding />
        <Toaster />
      </>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard auditData={auditData} onAuditComplete={(data) => setAuditData(data)} />;
      case "generator":
        return <ContentGenerator />;
      case "analyzer":
        return <ContentAnalyzer contentPlan={contentPlan} />;
      case "auditor":
        return (
          <ProfileAuditor 
            auditData={auditData}
            auditMarkdown={auditMarkdown}
            contentPlanProp={contentPlan}
            spreadsheetConfig={spreadsheetConfig}
            spreadsheetTitle={spreadsheetTitle}
            onAuditComplete={saveAuditResults} 
            onPlanGenerated={saveContentPlan}
            onPlanApproved={handleApprovePlan}
            onConfigChange={saveSpreadsheetConfig}
            onTitleChange={saveSpreadsheetTitle}
          />
        );
      case "calendar":
        return (
          <Calendar 
            posts={calendarPosts} 
            onUpdatePost={handleUpdatePost} 
            spreadsheetConfig={spreadsheetConfig} 
            spreadsheetTitle={spreadsheetTitle}
          />
        );
      case "stock":
        return <StockFootage />;
      case "specialist":
        return <ChatSpecialist />;
      case "monitoring":
        return <ContentMonitoring />;
      case "accounts":
        return (
          <AccountManager 
            onSwitchAccount={(id) => {
              toast.info("Akun dipilih. Fitur multi-data profil akan segera hadir!");
              setCurrentView("dashboard");
            }} 
          />
        );
      case "admin":
        return <AdminPanel />;
      case "spreadsheet":
        return (
          <div className="relative">
            {isSaving && (
              <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                Autosaving...
              </div>
            )}
            <ContentPlanSpreadsheet 
              data={spreadsheetData} 
              businessName={auditData?.brandIdentity} 
              config={spreadsheetConfig}
              title={spreadsheetTitle}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onPeriodChange={(m, y) => {
                setSelectedMonth(m);
                setSelectedYear(y);
              }}
              onChange={(newDataOrUpdater) => {
                setSpreadsheetData(prev => {
                  const next = typeof newDataOrUpdater === 'function' 
                    ? newDataOrUpdater(prev) 
                    : newDataOrUpdater;
                  
                  // Debounced save to Firebase
                  const planString = JSON.stringify(next);
                  const timeoutId = (window as any)._planSaveTimeout;
                  if (timeoutId) clearTimeout(timeoutId);
                  (window as any)._planSaveTimeout = setTimeout(() => {
                    saveContentPlan(planString);
                  }, 1000);

                  return next;
                });
              }}
              onConfigChange={saveSpreadsheetConfig}
              onTitleChange={saveSpreadsheetTitle}
              onApprove={handleApprovePlan}
            />
          </div>
        );
      default:
        return <Dashboard auditData={auditData} onAuditComplete={setAuditData} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop persistent, Mobile slide-in */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 border-r border-slate-200 bg-white shadow-xl md:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar currentView={currentView} onViewChange={setCurrentView} onLogout={() => auth.signOut()} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header - Mobile Only */}
        <header className="flex md:hidden items-center justify-between px-4 h-14 bg-white border-b border-slate-200 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1 rounded-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-black italic text-lg tracking-tighter">SocialPulse</span>
          </div>
          <div className="w-8" /> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-slate-200">
          <div className={cn("p-4 md:p-8", currentView === "spreadsheet" && "md:p-4")}>
            <div className={cn("mx-auto", currentView === "spreadsheet" ? "max-w-full" : "max-w-7xl")}>
              {renderView()}
            </div>
          </div>
        </main>
      </div>
      <Toaster position="top-center" expand={true} richColors />
    </div>
  );
}

