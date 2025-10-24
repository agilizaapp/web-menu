import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TestTube, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemoMode } from '@/lib/utils/demo-mode';

export const DemoIndicator: React.FC = () => {
  const { isDemo, toggleDemo } = useDemoMode();

  if (!isDemo) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex items-center gap-2 bg-orange-500 text-white px-3 py-2 rounded-lg shadow-lg border border-orange-600">
        <TestTube className="w-4 h-4" />
        <span className="text-sm font-medium">Modo Demo</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-white hover:bg-orange-600"
          onClick={() => toggleDemo(false)}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};
