// Arquivo: frontend/src/components/DocSection.tsx
import React from 'react';

interface DocSectionProps {
  title: string;
  id: string; // Para navegação interna no futuro
  children: React.ReactNode;
}

const DocSection: React.FC<DocSectionProps> = ({ title, id, children }) => {
  return (
    <section id={id} className="mb-12">
      <h2 className="text-2xl font-bold text-primary border-b-2 border-border pb-2 mb-4">
        {title}
      </h2>
      <div className="prose prose-invert max-w-none text-muted-foreground space-y-4">
        {children}
      </div>
    </section>
  );
};

export default DocSection;