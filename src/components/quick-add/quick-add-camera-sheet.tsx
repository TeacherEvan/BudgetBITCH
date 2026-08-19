'use client';

import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * QuickAddCameraSheet — extracted from the monolithic quick-add page so the
 * camera-scan action (file picker + hidden input) lives in its own component.
 * Keeps the `camera-file-input` data-testid + the trigger wiring intact.
 */
export function QuickAddCameraSheet({
  loading,
  triggerCamera,
  handleFileChange,
  fileInputRef,
  cameraLabel,
}: {
  loading: boolean;
  triggerCamera: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  cameraLabel: string;
}) {
  return (
    <>
      <Button
        variant="secondary"
        onClick={triggerCamera}
        isLoading={loading}
        className="flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-semibold"
      >
        <Camera className="w-4 h-4 text-amber-400" />
        <span>{cameraLabel}</span>
      </Button>

      {/* Hidden Camera Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
        data-testid="camera-file-input"
      />
    </>
  );
}
