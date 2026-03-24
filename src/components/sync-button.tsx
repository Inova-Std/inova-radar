'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { syncTrendsAction } from '@/actions/trends';

interface SyncButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
}

export function SyncButton({ variant = "default", size = "default", className, label = "Sincronizar Agora" }: SyncButtonProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleSync() {
    setIsPending(true);
    try {
      const result = await syncTrendsAction();
      if (!result.success) {
        alert("Erro ao sincronizar: " + result.error);
      }
    } catch (e) {
      alert("Erro crítico na conexão.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button 
      onClick={handleSync}
      disabled={isPending}
      variant={variant}
      size={size}
      className={className}
    >
      <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? 'Sincronizando...' : label}
    </Button>
  );
}
