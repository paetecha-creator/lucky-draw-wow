import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Sparkles, SwitchCamera, Upload, Check, AlertCircle } from 'lucide-react';
import { soundFX } from '../utils/audio';

interface CameraCaptureProps {
  onCapture: (photoDataUrl: string) => void;
  currentPhoto: string | null;
  onClear: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  currentPhoto,
  onClear,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check if multiple camera devices exist
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      }).catch(() => {});
    }
  }, []);

  // Stop current video stream
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  // Start video stream
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    stopStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('เบราว์เซอร์ไม่รองรับกล้อง กรุณาอัปโหลดรูปเซลฟี่แทน');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 720 },
          height: { ideal: 960 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((err) => console.warn('Play error:', err));
      }
    } catch (err: unknown) {
      console.warn('Camera access denied or failed:', err);
      setCameraError('ไม่สามารถเข้าถึงกล้องได้ (โปรดอนุญาตสิทธิ์ หรืออัปโหลดรูปภาพใบหน้า)');
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    if (!currentPhoto) {
      startCamera(facingMode);
    }
    return () => {
      stopStream();
    };
  }, [currentPhoto, facingMode]);

  // Flip camera toggle
  const toggleFacingMode = () => {
    soundFX.playClick();
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Take photo snapshot
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Flash animation
    setIsFlashing(true);
    soundFX.playCameraShutter();
    setTimeout(() => setIsFlashing(false), 200);

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // If user facing mode, flip horizontally for mirror selfie effect
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      stopStream();
      onCapture(dataUrl);
    }
  };

  // Handle fallback file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          stopStream();
          soundFX.playCameraShutter();
          onCapture(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hidden elements */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Main Viewport Container */}
      <div className="relative w-full max-w-[340px] aspect-[4/5] rounded-3xl overflow-hidden bg-slate-900 border-2 border-purple-300 shadow-xl shadow-purple-100">
        {/* Flash overlay */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-ping" />
        )}

        {/* State A: Photo is captured */}
        {currentPhoto ? (
          <div className="relative w-full h-full">
            <img
              src={currentPhoto}
              alt="เซลฟี่ลงทะเบียนของคุณ"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Stamp overlay */}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-300 flex items-center gap-1.5 text-xs font-bold text-emerald-800 shadow-sm">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>ภาพเซลฟี่พร้อมแล้ว</span>
            </div>

            {/* Bottom action inside photo */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onClear();
                }}
                className="flex-1 min-h-[44px] py-2.5 px-4 bg-white/95 hover:bg-white text-slate-800 text-xs font-bold rounded-xl backdrop-blur-md border border-purple-200 shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-purple-700" />
                <span>ถ่ายใหม่</span>
              </button>
            </div>
          </div>
        ) : (
          /* State B: Live Camera Viewfinder */
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {isCameraActive ? (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className={`w-full h-full object-cover ${
                    facingMode === 'user' ? 'scale-x-[-1]' : ''
                  }`}
                />

                {/* Face guide oval */}
                <div className="absolute inset-x-10 inset-y-12 border-2 border-dashed border-pink-300/80 rounded-[48%] pointer-events-none flex flex-col items-center justify-start pt-3">
                  <span className="text-[11px] font-bold text-pink-900 bg-white/85 px-3 py-0.5 rounded-full backdrop-blur-xs shadow-xs">
                    จัดตำแหน่งใบหน้าตรงนี้
                  </span>
                </div>

                {/* Controls Overlay */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  {hasMultipleCameras && (
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      className="min-h-[44px] min-w-[44px] p-2 rounded-full bg-white/80 hover:bg-white text-slate-800 backdrop-blur-md border border-white/20 flex items-center justify-center transition active:scale-90 shadow-sm cursor-pointer"
                      title="สลับกล้องหน้า/หลัง"
                      aria-label="สลับกล้องหน้าและหลัง"
                    >
                      <SwitchCamera className="w-5 h-5 text-purple-700" />
                    </button>
                  )}
                </div>

                {/* Shutter Button Bar */}
                <div className="absolute bottom-4 inset-x-4 flex items-center justify-between">
                  {/* Upload button fallback */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[44px] min-w-[44px] p-2.5 rounded-full bg-white/80 hover:bg-white text-slate-800 backdrop-blur-md border border-white/20 flex items-center justify-center active:scale-95 text-xs shadow-sm cursor-pointer"
                    title="เลือกรูปจากอัลบั้ม"
                  >
                    <Upload className="w-4 h-4 text-purple-700" />
                  </button>

                  {/* Main Shutter Trigger */}
                  <button
                    type="button"
                    onClick={takeSnapshot}
                    className="min-h-[64px] min-w-[64px] rounded-full p-1 bg-gradient-to-tr from-amber-300 via-pink-400 to-purple-400 shadow-xl shadow-pink-300/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                    aria-label="กดถ่ายรูปเซลฟี่"
                  >
                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-inner">
                      <Camera className="w-6 h-6 text-pink-600" />
                    </div>
                  </button>

                  {/* Restart Camera Button */}
                  <button
                    type="button"
                    onClick={() => startCamera(facingMode)}
                    className="min-h-[44px] min-w-[44px] p-2.5 rounded-full bg-white/80 hover:bg-white text-slate-800 backdrop-blur-md border border-white/20 flex items-center justify-center active:scale-95 shadow-sm cursor-pointer"
                    title="รีเฟรชกล้อง"
                  >
                    <RefreshCw className="w-4 h-4 text-purple-700" />
                  </button>
                </div>
              </>
            ) : (
              /* Fallback when camera permission denied or loading */
              <div className="p-6 text-center flex flex-col items-center justify-center h-full bg-gradient-to-b from-purple-50 to-pink-50">
                <div className="w-16 h-16 rounded-2xl bg-white border border-purple-200 flex items-center justify-center mb-3 text-purple-600 shadow-xs">
                  <Camera className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  เปิดกล้องเพื่อเซลฟี่ก่อนลงทะเบียน
                </h4>
                <p className="text-xs text-slate-500 mb-4 max-w-[240px]">
                  {cameraError || 'ระบบต้องการรูปถ่ายหน้าตรงเพื่อพิมพ์ติดบัตรเข้างานและโต๊ะเลี้ยง'}
                </p>

                <div className="flex flex-col gap-2 w-full max-w-[200px]">
                  <button
                    type="button"
                    onClick={() => startCamera(facingMode)}
                    className="min-h-[44px] py-2 px-4 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 hover:from-purple-600 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-pink-200 active:scale-95 transition cursor-pointer"
                  >
                    เปิดใช้งานกล้อง
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[44px] py-2 px-4 rounded-xl bg-white hover:bg-purple-50 text-purple-900 font-bold text-xs border border-purple-200 flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>อัปโหลดรูปเซลฟี่</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>รูปเซลฟี่จะแสดงบนบัตรปาร์ตี้และหน้าประกาศรางวัล Lucky Draw</span>
      </div>
    </div>
  );
};
