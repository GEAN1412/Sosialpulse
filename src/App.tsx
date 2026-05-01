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
import { useAuth } from "./lib/AuthContext";
import { db } from "./lib/firebase";
import { doc, updateDoc, addDoc, collection, serverTimestamp, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { Toaster, toast } from "sonner";
import { Loader2 } from "lucide-react";

export type View = "dashboard" | "generator" | "analyzer" | "auditor" | "calendar" | "specialist" | "monitoring" | "accounts" | "admin";

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
  const [calendarPosts, setCalendarPosts] = useState<Post[]>([]);

  // Sync state with profile data on load
  useEffect(() => {
    if (profile) {
      if (profile.auditData) setAuditData(profile.auditData);
      if (profile.auditMarkdown) setAuditMarkdown(profile.auditMarkdown);
      if (profile.contentPlan) setContentPlan(profile.contentPlan);
      if (profile.spreadsheetConfig) setSpreadsheetConfig(profile.spreadsheetConfig);
      if (profile.spreadsheetTitle) setSpreadsheetTitle(profile.spreadsheetTitle);
    }
  }, [profile]);

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
      console.error("Error fetching posts:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const saveAuditResults = async (data: any, markdown: string) => {
    if (!user) return;
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
      console.error("Error saving audit:", error);
      toast.error("Gagal menyimpan hasil audit.");
    }
  };

  const saveContentPlan = async (plan: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        contentPlan: plan,
        updatedAt: serverTimestamp()
      });
      setContentPlan(plan);
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Gagal menyimpan rencana konten.");
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
      console.error("Error scheduling posts:", error);
      toast.error("Gagal menjadwalkan postingan.");
    }
  };

  const handleUpdatePost = async (postId: string, updates: Partial<Post>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'scheduledPosts', postId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      // State will be updated via onSnapshot
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Gagal memperbarui postingan.");
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
      default:
        return <Dashboard auditData={auditData} onAuditComplete={setAuditData} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-6xl">
          {renderView()}
        </div>
      </main>
      <Toaster />
    </div>
  );
}

