// Arquivo: frontend/src/components/DocNav.tsx
"use client";

import { useState, useEffect } from 'react';

interface Section {
  id: string;
  title: string;
}

interface DocNavProps {
  sections: Section[];
}

const DocNav: React.FC<DocNavProps> = ({ sections }) => {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-50% 0px -50% 0px', // Ativa quando a seção está no meio da tela
        threshold: 0,
      }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      sections.forEach((section) => {
        const element = document.getElementById(section.id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [sections]);

  return (
    <aside className="sticky top-24 h-fit">
      <h3 className="text-sm font-semibold text-foreground mb-2">Nesta Página</h3>
      <ul className="space-y-2">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={`block text-sm transition-colors ${
                activeSection === section.id
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default DocNav;