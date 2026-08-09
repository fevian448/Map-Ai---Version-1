import React, { useState, useEffect, useRef } from 'react';
import { MediaVaultItem, GeoPoint, SettingsState } from '../types';
import { Camera, Video, Image, Upload, Trash2, Play, Download, Eye, Tag, X, Plus, Sparkles, MapPin, HardDrive, CheckCircle2 } from 'lucide-react';
import { t } from '../lib/i18n';

interface GalleryVaultTabProps {
  userLocation: GeoPoint;
  settings: SettingsState;
}

export const GalleryVaultTab: React.FC<GalleryVaultTabProps> = ({ userLocation, settings }) => {
  const [items, setItems] = useState<MediaVaultItem[]>(() => {
    const saved = localStorage.getItem('mapai_media_vault');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_e) {}
    }
    // Default sample media items
    return [
      {
        id: 'mv_1',
        title: 'Roadwork Hazard Proof Snapshot',
        type: 'image',
        dataUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
        timestamp: 'Today, 14:32',
        locationName: 'Jalan Tun Razak, Highway Exit 4',
        category: 'Hazard Proof',
        fileSizeMb: '1.4 MB'
      },
      {
        id: 'mv_2',
        title: 'Dashcam Live Recording Segment',
        type: 'video',
        dataUrl: 'https://assets.mixkit.co/videos/preview/mixkit-car-driving-on-a-road-in-the-city-40742-large.mp4',
        timestamp: 'Yesterday, 18:15',
        locationName: 'Federal Highway KM 18.2',
        category: 'Dashcam',
        fileSizeMb: '14.2 MB'
      },
      {
        id: 'mv_3',
        title: 'Traffic Jam Proof Evidence',
        type: 'image',
        dataUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
        timestamp: '3 days ago',
        locationName: 'LDP Highway toll plaza',
        category: 'Incident',
        fileSizeMb: '2.1 MB'
      }
    ];
  });

  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<MediaVaultItem | null>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    localStorage.setItem('mapai_media_vault', JSON.stringify(items));
  }, [items]);

  // Open Live Camera
  const startCamera = async () => {
    setCameraModalOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraModalOpen(false);
    setIsRecording(false);
  };

  // Capture Photo
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      const newItem: MediaVaultItem = {
        id: `mv_${Date.now()}`,
        title: `Road Snapshot (${new Date().toLocaleTimeString()})`,
        type: 'image',
        dataUrl,
        timestamp: 'Just now',
        locationName: `GPS (${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)})`,
        category: 'Dashcam',
        fileSizeMb: '0.8 MB'
      };
      setItems((prev) => [newItem, ...prev]);
      showToast('New snapshot saved to Media Vault!');
      stopCamera();
    }
  };

  // Record Dashcam Video
  const startVideoRecording = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];
    try {
      const recorder = new MediaRecorder(mediaStreamRef.current);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
        const videoUrl = URL.createObjectURL(blob);
        const newItem: MediaVaultItem = {
          id: `mv_${Date.now()}`,
          title: `Dashcam Clip (${new Date().toLocaleTimeString()})`,
          type: 'video',
          dataUrl: videoUrl,
          timestamp: 'Just now',
          locationName: `GPS (${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)})`,
          category: 'Dashcam',
          fileSizeMb: '3.2 MB'
        };
        setItems((prev) => [newItem, ...prev]);
        showToast('Dashcam video clip saved successfully!');
        stopCamera();
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.warn('Video recorder error:', err);
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Upload Local File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isVideo = file.type.startsWith('video');

    reader.onload = (evt) => {
      const resultUrl = evt.target?.result as string;
      const newItem: MediaVaultItem = {
        id: `mv_${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        type: isVideo ? 'video' : 'image',
        dataUrl: resultUrl,
        timestamp: 'Just now',
        locationName: `GPS (${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)})`,
        category: isVideo ? 'Dashcam' : 'Incident',
        fileSizeMb: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      };
      setItems((prev) => [newItem, ...prev]);
      showToast('Media file uploaded to Gallery!');
    };
    reader.readAsDataURL(file);
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
    showToast('Media deleted from vault.');
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const categories = ['All', 'Dashcam', 'Incident', 'Scenic', 'Hazard Proof'];

  const filteredItems = items.filter((item) => filterCategory === 'All' || item.category === filterCategory);

  return (
    <div id="gallery-vault-screen" className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 space-y-4 pb-24">
      {/* Toast */}
      {toastMsg && (
        <div className="bg-cyan-950 border border-cyan-500 text-cyan-300 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xl animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950 border border-cyan-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                <HardDrive className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-white">{t('gallery_title', settings.language)}</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-sm">
              {t('gallery_desc', settings.language)}
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-cyan-400 font-mono">{items.length}</span>
            <span className="block text-[10px] text-slate-400 font-semibold uppercase">Files Saved</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-slate-800">
          <button
            onClick={startCamera}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>{t('record_photo', settings.language)}</span>
          </button>

          <label className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Upload Media</span>
            <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterCategory === cat
                ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300 shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Media Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-2">
          <Image className="w-8 h-8 text-slate-600 mx-auto" />
          <div className="text-sm font-bold text-slate-300">No media in this category</div>
          <p className="text-xs text-slate-500">
            Press &quot;Capture Photo / Record&quot; to add new photos or videos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl overflow-hidden cursor-pointer shadow-xl transition-all relative"
            >
              <div className="aspect-video bg-slate-950 relative overflow-hidden flex items-center justify-center">
                {item.type === 'video' ? (
                  <div className="w-full h-full relative flex items-center justify-center bg-slate-900">
                    <video src={item.dataUrl} className="w-full h-full object-cover opacity-80" />
                    <div className="absolute w-10 h-10 rounded-full bg-cyan-500/80 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                    </div>
                  </div>
                ) : (
                  <img src={item.dataUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                )}

                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[9px] font-extrabold uppercase text-cyan-300 border border-slate-800">
                  {item.category}
                </span>

                {item.fileSizeMb && (
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-slate-950/80 text-[9px] font-mono text-slate-300">
                    {item.fileSizeMb}
                  </span>
                )}
              </div>

              <div className="p-3 space-y-1">
                <div className="font-bold text-xs text-slate-200 truncate">{item.title}</div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate">{item.locationName}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono pt-0.5">{item.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Camera Recording Modal */}
      {cameraModalOpen && (
        <div className="fixed inset-0 z-[3000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-4 text-slate-100 shadow-2xl space-y-3 relative">
            <button
              onClick={stopCamera}
              className="absolute top-3 right-3 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Record Dashcam / Capture Proof</h3>
            </div>

            <div className="aspect-video bg-black rounded-2xl overflow-hidden relative flex items-center justify-center border border-slate-800">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {isRecording && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>RECORDING DASHCAM</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={capturePhoto}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Capture Photo</span>
              </button>

              {!isRecording ? (
                <button
                  onClick={startVideoRecording}
                  className="py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
                >
                  <Video className="w-4 h-4" />
                  <span>Start Video Recording</span>
                </button>
              ) : (
                <button
                  onClick={stopVideoRecording}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>Stop & Save</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Media Viewer Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[3000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-5 text-slate-100 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-base font-bold text-white pr-8">{selectedItem.title}</div>

            <div className="aspect-video bg-black rounded-2xl overflow-hidden relative flex items-center justify-center border border-slate-800">
              {selectedItem.type === 'video' ? (
                <video src={selectedItem.dataUrl} controls autoPlay className="w-full h-full object-contain" />
              ) : (
                <img src={selectedItem.dataUrl} alt={selectedItem.title} className="w-full h-full object-contain" />
              )}
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Location:</span>
                <span className="font-semibold text-cyan-300">{selectedItem.locationName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Time:</span>
                <span className="font-semibold text-slate-200">{selectedItem.timestamp}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="font-semibold text-amber-400">{selectedItem.category}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => deleteItem(selectedItem.id)}
                className="px-3 py-2 rounded-xl bg-red-950/80 border border-red-800/80 text-red-300 hover:bg-red-900 text-xs font-bold flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>

              <a
                href={selectedItem.dataUrl}
                download={`mapai_media_${selectedItem.id}`}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
