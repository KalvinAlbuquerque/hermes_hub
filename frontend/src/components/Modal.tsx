// Arquivo: frontend/src/components/Modal.tsx
"use client";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    // Fundo semi-transparente
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-center items-center">
      {/* O modal agora usa a nossa classe .card para um estilo consistente */}
      <div className="card w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Cabeçalho do Modal */}
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl transition-colors">&times;</button>
        </div>
        {/* Conteúdo do Modal com scroll automático se for grande */}
        <div className="overflow-y-auto pr-2">
            {children}
        </div>
      </div>
    </div>
  );
}