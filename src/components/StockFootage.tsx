import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { useAuth } from '../lib/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Plus, Folder, FileVideo, Download, Eye, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export function StockFootage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  
  // Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [customFileName, setCustomFileName] = useState('');

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'stockFootage'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data);
      
      // Extract unique folders
      const uniqueFolders = Array.from(new Set(data.map((item: any) => item.folder).filter(Boolean))) as string[];
      setFolders(uniqueFolders);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'stockFootage');
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    if (folders.includes(newFolderName)) {
      toast.error("Folder sudah ada");
      return;
    }
    setFolders(prev => [...prev, newFolderName.trim()]);
    setSelectedFolder(newFolderName.trim());
    setNewFolderName('');
    setIsAddingFolder(false);
    toast.success(`Folder "${newFolderName}" dibuat secara lokal. Silakan unggah footage.`);
  };

  const handleUpload = async () => {
    if (!uploadFile || !selectedFolder || !customFileName.trim() || !user) {
      toast.error("Lengkapi data upload");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Sedang mengunggah footage...");

    let cloudName = ((import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || "").trim();
    let uploadPreset = ((import.meta as any).env.VITE_CLOUDINARY_PRESET || "").trim();

    const dateStr = format(new Date(), "MMMM_dd", { locale: id }).toLowerCase();
    const fileName = `${customFileName.trim()}_${dateStr}_${Date.now()}`;
    const folderPath = `stock_footage/${selectedFolder}`;

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', folderPath);
      formData.append('public_id', fileName);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Upload failed");
      }

      const result = await response.json();

      await addDoc(collection(db, 'stockFootage'), {
        userId: user.uid,
        name: customFileName.trim(),
        originalName: uploadFile.name,
        url: result.secure_url,
        folder: selectedFolder,
        type: uploadFile.type,
        createdAt: serverTimestamp(),
        cloudinaryId: result.public_id
      });

      setUploadFile(null);
      setCustomFileName('');
      toast.success("Footage berhasil diunggah!", { id: toastId });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, 'stockFootage');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (url: string, fileName: string) => {
    const toastId = toast.loading("Menyiapkan unduhan...");
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success("Unduhan dimulai!", { id: toastId });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Gagal mengunduh file.", { id: toastId });
    }
  };

  const deleteItem = async (item: any) => {
    if (!confirm("Hapus footage ini?")) return;
    try {
      await deleteDoc(doc(db, 'stockFootage', item.id));
      toast.success("Footage dihapus dari sistem.");
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `stockFootage/${item.id}`);
    }
  };

  const filteredItems = selectedFolder 
    ? items.filter(i => i.folder === selectedFolder)
    : items;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileVideo className="h-8 w-8 text-indigo-600" />
            Stock Footage
          </h2>
          <p className="text-slate-500 mt-1">Kelola aset video dan gambar untuk konten Anda.</p>
        </div>
        <Button 
          onClick={() => setIsAddingFolder(true)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Buat Folder
        </Button>
      </div>

      {isAddingFolder && (
        <Card className="border-indigo-100 bg-indigo-50/30">
          <CardContent className="p-4">
            <form onSubmit={handleCreateFolder} className="flex gap-2">
              <Input 
                placeholder="Nama Folder Baru..." 
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                className="bg-white"
                autoFocus
              />
              <Button type="submit" size="sm">Simpan</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingFolder(false)}>Batal</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-none">
        <Button 
          variant={selectedFolder === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedFolder(null)}
          className="shrink-0 rounded-full"
        >
          Semua Aset
        </Button>
        {folders.map(f => (
          <Button 
            key={f}
            variant={selectedFolder === f ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFolder(f)}
            className="shrink-0 rounded-full"
          >
            <Folder className="w-3 h-3 mr-2" />
            {f}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Card */}
        <Card className="border-dashed border-2 border-slate-200 shadow-none bg-slate-50/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-500" />
              Unggah ke {selectedFolder || '...'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedFolder ? (
              <p className="text-xs text-slate-400 italic">Pilih folder terlebih dahulu untuk mengunggah.</p>
            ) : (
              <>
                <div 
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors bg-white cursor-pointer relative"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input 
                    id="file-upload" 
                    type="file" 
                    className="hidden" 
                    onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  />
                  {uploadFile ? (
                    <div className="flex flex-col items-center">
                      <FileVideo className="w-8 h-8 text-indigo-500 mb-2" />
                      <p className="text-sm font-bold text-slate-700 truncate max-w-full px-4">{uploadFile.name}</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
                        className="mt-2 text-xs text-rose-500 font-bold hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Plus className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">Klik untuk pilih file video/foto</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Aset (Kustom)</label>
                  <Input 
                    placeholder="Contoh: Drone Laundry Depan" 
                    value={customFileName}
                    onChange={e => setCustomFileName(e.target.value)}
                    className="bg-white"
                  />
                </div>

                <Button 
                  className="w-full bg-slate-900 hover:bg-black" 
                  disabled={isUploading || !uploadFile || !customFileName.trim()}
                  onClick={handleUpload}
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Mulai Unggah
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Items List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 px-1">Footage di {selectedFolder || 'Semua Folder'}</h3>
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center p-12 border border-dashed rounded-xl text-slate-400 text-sm">
              Belum ada footage di sini.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredItems.map(item => (
                <div key={item.id} className="group flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.type?.startsWith('image') ? (
                        <img src={item.url} className="w-full h-full object-cover" />
                      ) : (
                        <FileVideo className="w-6 h-6 text-indigo-400" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{item.folder} • {format(item.createdAt?.toDate() || new Date(), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <Eye size={16} />
                    </a>
                    <button 
                      onClick={() => handleDownload(item.url, item.name)}
                      className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <Download size={16} />
                    </button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-500" onClick={() => deleteItem(item)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
