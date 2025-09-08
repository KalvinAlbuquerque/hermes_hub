// frontend/src/components/PasswordStrength.tsx
"use client";

import { Check, X } from 'lucide-react';

interface PasswordRequirement {
  id: string;
  text: string;
  regex: RegExp;
}

const requirements: PasswordRequirement[] = [
  { id: 'length', text: 'Pelo menos 8 caracteres', regex: /.{8,}/ },
  { id: 'lowercase', text: 'Uma letra minúscula', regex: /[a-z]/ },
  { id: 'uppercase', text: 'Uma letra maiúscula', regex: /[A-Z]/ },
  { id: 'number', text: 'Um número', regex: /\d/ },
  { id: 'special', text: 'Um caractere especial', regex: /[^a-zA-Z0-9]/ },
];

interface PasswordStrengthProps {
  password?: string;
}

export default function PasswordStrength({ password = '' }: PasswordStrengthProps) {
  return (
    <div className="p-4 bg-secondary/50 border border-border rounded-md mt-2 space-y-2">
      <p className="text-sm font-semibold text-foreground">A sua senha deve conter:</p>
      <ul className="text-xs text-muted-foreground">
        {requirements.map(req => {
          const isValid = req.regex.test(password);
          return (
            <li key={req.id} className={`flex items-center gap-2 ${isValid ? 'text-success' : 'text-muted-foreground'}`}>
              {isValid ? <Check size={14} /> : <X size={14} />}
              <span>{req.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}