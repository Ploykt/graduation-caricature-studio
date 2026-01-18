import React, { useEffect, useState } from 'react';
import { localDb } from '../services/localDb';
import { Download, Image as ImageIcon } from 'lucide-react';

interface GalleryItem {
  id: string;
  imageUrl: string;
  createdAt: number;
  config: any;
}

interface GalleryProps {
  userId: string;
}

const Gallery: React.FC<GalleryProps> = ({ userId }) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadGallery = async () => {
      try {
        const history = await localDb.getUserHistory(userId);
        setItems(history);
      } catch (e) {
        console.error("Erro ao carregar galeria:", e);
      } finally {
        setLoading(false);
      }
    };

    loadGallery();
  }, [userId]); // Recarrega se o ID do usuário mudar

  if (loading) return <div className="text-center text-slate-500 py-10">Carregando galeria...</div>;
  if (items.length === 0) return null;

  return (
    <div className="w-full mt-24 border-t border-white/5 pt-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
          <ImageIcon className="w-6 h-6 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Sua Galeria (Local)</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item) => (
          <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-800">
            <img 
              src={item.imageUrl} 
              alt="Caricatura" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm p-4">
              <span className="text-xs text-slate-300 font-medium bg-black/50 px-2 py-1 rounded-full border border-white/10">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
              
              <a 
                href={item.imageUrl}
                download={`caricatura-${item.id}.png`}
                className="p-2 bg-gold-500 hover:bg-gold-400 text-black rounded-full transition-transform hover:scale-110 shadow-lg"
                title="Baixar"
              >
                <Download size={20} />
              </a>
            </div>
            
            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity delay-100 pointer-events-none">
                <div className="bg-black/80 backdrop-blur text-[10px] text-gold-400 px-2 py-1 rounded border border-gold-500/20">
                    {item.config?.style === '3D' ? 'Estilo 3D' : 'Arte 2D'}
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;