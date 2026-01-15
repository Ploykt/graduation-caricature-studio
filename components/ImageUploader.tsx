import React, { useRef, useState, useCallback } from 'react';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  selectedImage: string | null;
  onClear: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, selectedImage, onClear }) => {
  const [isCameraMode, setIsCameraMode] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setIsCameraMode(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
      setIsCameraMode(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraMode(false);
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror effect
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onImageSelected(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelected(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Cleanup
  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  if (selectedImage) {
    return (
      <div className="relative group rounded-2xl overflow-hidden border border-white/20 shadow-2xl h-[400px] md:h-[500px]">
        <img 
          src={selectedImage} 
          alt="Selected" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
          <p className="text-white font-medium mb-4">Deseja trocar de foto?</p>
          <button 
            onClick={onClear}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl transform hover:scale-105 transition-all flex items-center gap-2 font-bold shadow-lg shadow-red-500/30"
          >
            <X size={20} />
            <span>Remover Foto</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px]">
      {isCameraMode ? (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] md:aspect-auto md:h-[500px] border border-gold-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline
            className="w-full h-full object-cover transform scale-x-[-1]" 
          />
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 z-10">
            <button 
              onClick={stopCamera}
              className="bg-slate-800/80 hover:bg-slate-800 text-white p-4 rounded-full backdrop-blur-md transition-all"
            >
              <X size={24} />
            </button>
            <button 
              onClick={capturePhoto}
              className="bg-white p-1.5 rounded-full border-4 border-gold-500/50 hover:border-gold-500 transition-all transform hover:scale-110"
            >
              <div className="w-14 h-14 bg-white rounded-full border-2 border-black/10"></div>
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border-2 border-dashed border-slate-700 hover:border-gold-500/30 transition-all p-8 md:p-12 text-center group relative overflow-hidden h-full flex flex-col justify-center">
          <div className="absolute inset-0 bg-gold-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="p-6 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 group-hover:border-gold-500/40 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.15)] transition-all duration-300">
               <Upload className="w-10 h-10 text-slate-300 group-hover:text-gold-400" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Envie sua Selfie</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                Escolha uma foto clara do seu rosto. Evite óculos escuros ou chapéus para melhor resultado.
              </p>
            </div>

            <div className="flex gap-4 mt-4 w-full max-w-sm flex-col sm:flex-row">
              <label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-700 text-white py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700 hover:border-slate-500 hover:shadow-lg">
                <ImageIcon size={18} />
                <span className="font-semibold">Galeria</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
              
              <button 
                onClick={startCamera}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700 hover:border-slate-500 hover:shadow-lg"
              >
                <Camera size={18} />
                <span className="font-semibold">Câmera</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;