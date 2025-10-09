// src/hooks/useDemoMode.ts
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function useDemoMode() {
  const searchParams = useSearchParams();
  const isDemoParam = searchParams.get('demo') === 'true';

  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Respeita o parâmetro da URL mas começa desativado
    if (!isDemoParam) {
      setIsDemoMode(false);
    }
  }, [isDemoParam]);

  const toggleDemo = () => {
    setIsDemoMode((prev) => !prev);
  };

  return {
    isDemoMode,
    showDemoButton: isDemoParam,
    toggleDemo,
  };
}