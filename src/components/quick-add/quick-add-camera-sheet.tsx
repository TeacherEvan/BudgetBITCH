'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Sparkles, Cpu, ScanLine, X, SwitchCamera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ScanStage } from '@/hooks/use-quick-add-state';

const STAGE_META: Record<
  Exclude<ScanStage, 'idle' | 'complete'>,
  { label: string; sublabel: string; percent: number }
> = {
  optimizing: {
    label: 'Optimizing contrast & resolution…',
    sublabel: 'Preparing high-clarity receipt frame',
    percent: 25,
  },
  'ai-vision': {
    label: 'Extracting merchant & line items…',
    sublabel: 'AI Vision optical pass',
    percent: 60,
  },
  'fallback-gemini': {
    label: 'Analyzing receipt structure…',
    sublabel: 'Gemini 2.5 Flash deep extraction',
    percent: 78,
  },
  'client-ocr': {
    label: 'Running offline optical scan…',
    sublabel: 'On-device Tesseract OCR engine',
    percent: 90,
  },
};

export interface QuickAddCameraSheetProps {
  loading: boolean;
  triggerCamera: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  cameraLabel: string;
  scanStage?: ScanStage;
  scanPreviewUrl?: string | null;
  /**
   * Optional custom captured frame handler.
   * If omitted, captured Blob from live viewfinder is dispatched into handleFileChange as a synthetic change event.
   */
  handleCapturedFrame?: (blob: Blob) => Promise<void> | void;
}

/**
 * QuickAddCameraSheet — extracted from the monolithic quick-add page so the
 * camera-scan action (file picker + hidden input + live viewfinder) lives in its own component.
 * Upgraded to Tier-1 Product Craft with Live Camera Stream Viewfinder & Shutter,
 * plus Cinematic Scanline Viewfinder when actively scanning.
 */
export function QuickAddCameraSheet({
  loading,
  triggerCamera,
  handleFileChange,
  fileInputRef,
  cameraLabel,
  scanStage = 'idle',
  scanPreviewUrl = null,
  handleCapturedFrame,
}: QuickAddCameraSheetProps) {
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [streamError, setStreamError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop current active media stream tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore track stop errors
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Ensure stream tracks are halted on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  // Start live stream when isLiveActive or facingMode changes
  useEffect(() => {
    if (!isLiveActive) {
      stopStream();
      return;
    }

    let isSubscribed = true;

    async function startCamera() {
      setStreamError(null);

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function'
      ) {
        setStreamError('Live camera not supported in this browser.');
        setIsLiveActive(false);
        fileInputRef.current?.click();
        return;
      }

      try {
        stopStream();
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isSubscribed) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          try {
            const playPromise = videoRef.current.play();
            if (playPromise && typeof playPromise.catch === 'function') {
              playPromise.catch(() => {
                // Autoplay policies may reject play() if not interacting
              });
            }
          } catch {
            // Ignore synchronous play error in non-supporting DOMs
          }
        }
      } catch (err) {
        if (!isSubscribed) return;
        console.warn('getUserMedia failed, falling back to file picker:', err);
        setStreamError('Camera permission denied or camera unavailable.');
        setIsLiveActive(false);
        fileInputRef.current?.click();
      }
    }

    startCamera();

    return () => {
      isSubscribed = false;
      stopStream();
    };
  }, [isLiveActive, facingMode, fileInputRef, stopStream]);

  // Primary trigger handler: attempt live camera if mediaDevices is supported, else file picker
  const onTriggerClick = () => {
    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    ) {
      setIsLiveActive(true);
    } else {
      triggerCamera();
    }
  };

  // Switch facing mode (environment <-> user)
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Close live viewfinder and return to static mode
  const closeLiveStream = useCallback(() => {
    setIsLiveActive(false);
    stopStream();
  }, [stopStream]);

  // Grab snapshot frame from live video
  const captureFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    // Stop the stream immediately after capture
    closeLiveStream();

    const blobPromise = new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
    });

    const blob = await blobPromise;
    if (!blob) return;

    if (handleCapturedFrame) {
      await handleCapturedFrame(blob);
    } else {
      // Create a File from Blob and synthesize HTMLInputElement change event
      const file = new File([blob], `receipt-capture-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });

      const syntheticEvent = {
        target: {
          files: [file] as unknown as FileList,
          value: '',
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await handleFileChange(syntheticEvent);
    }
  }, [closeLiveStream, handleCapturedFrame, handleFileChange]);

  const isActivelyScanning =
    loading && scanStage !== 'idle' && scanStage !== 'complete';
  const stageInfo = isActivelyScanning ? STAGE_META[scanStage] : null;

  return (
    <>
      <Button
        variant="secondary"
        onClick={onTriggerClick}
        isLoading={loading}
        className="flex items-center justify-center gap-1.5 py-3 min-h-[44px] rounded-2xl text-xs font-semibold"
      >
        <Camera className="w-4 h-4 text-[var(--gold-bright)]" />
        <span>{cameraLabel}</span>
      </Button>

      {/* Hidden Camera Input for standard file picker fallback */}
      <input
        type="file"
        ref={(el) => {
          if (fileInputRef) {
            (fileInputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
          }
        }}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
        data-testid="camera-file-input"
      />

      {/* Live Camera Stream Viewfinder Modal / Overlay */}
      {isLiveActive && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Live Camera Viewfinder"
          data-testid="live-camera-viewfinder"
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 p-4 sm:p-6 backdrop-blur-xl animate-in fade-in duration-200"
        >
          {/* Top Bar Controls */}
          <div className="w-full max-w-md flex items-center justify-between z-10 pt-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[var(--gold-bright)] flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-full border border-[var(--gold-border)]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Frame Active
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-transform cursor-pointer"
                aria-label="Switch camera"
                data-testid="switch-camera-btn"
              >
                <SwitchCamera className="w-5 h-5 text-white" />
              </button>
              <button
                type="button"
                onClick={closeLiveStream}
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-transform cursor-pointer"
                aria-label="Close live camera"
                data-testid="close-live-camera-btn"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Central Obsidian Optical Viewfinder Frame */}
          <div className="relative w-full max-w-md aspect-[3/4] sm:aspect-[4/5] rounded-3xl overflow-hidden border border-[var(--gold-border-strong)] bg-neutral-950 shadow-[0_0_35px_rgba(232,176,32,0.15)] flex items-center justify-center my-auto">
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              data-testid="live-camera-video"
            />

            {/* Corner Reticle Brackets */}
            <div className="pointer-events-none absolute top-4 left-4 h-7 w-7 border-t-2 border-l-2 border-[var(--gold-bright)] rounded-tl-lg" />
            <div className="pointer-events-none absolute top-4 right-4 h-7 w-7 border-t-2 border-r-2 border-[var(--gold-bright)] rounded-tr-lg" />
            <div className="pointer-events-none absolute bottom-4 left-4 h-7 w-7 border-b-2 border-l-2 border-[var(--gold-bright)] rounded-bl-lg" />
            <div className="pointer-events-none absolute bottom-4 right-4 h-7 w-7 border-b-2 border-r-2 border-[var(--gold-bright)] rounded-br-lg" />

            {/* Document Bounding Guide Outline */}
            <div className="pointer-events-none absolute inset-8 border border-white/25 border-dashed rounded-2xl flex items-center justify-center">
              <span className="text-[11px] font-mono uppercase tracking-widest text-white/50 bg-black/60 px-3 py-1 rounded-md backdrop-blur-sm">
                Align Receipt Within Box
              </span>
            </div>

            {/* Subtle Scanning Holographic Beam */}
            <div className="bb-scanline-beam pointer-events-none absolute inset-x-4 top-4 h-8 bg-gradient-to-b from-transparent via-[var(--gold-bright)]/25 to-[var(--gold-glow)]/60 border-b border-[var(--gold-glow)] shadow-[0_0_12px_rgba(232,176,32,0.5)]" />
          </div>

          {/* Bottom Shutter Trigger Controls */}
          <div className="w-full max-w-md flex flex-col items-center justify-center gap-3 pb-4 z-10">
            {streamError && (
              <p className="text-xs text-rose-400 bg-rose-950/60 border border-rose-800/60 px-3 py-1 rounded-lg">
                {streamError}
              </p>
            )}

            <div className="flex items-center justify-center w-full relative">
              {/* Shutter Button with Gold Halo Ring */}
              <button
                type="button"
                onClick={captureFrame}
                className="group relative flex items-center justify-center h-20 w-20 min-h-[56px] min-w-[56px] rounded-full p-1 transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--gold-bright)] cursor-pointer"
                aria-label="Capture receipt frame"
                data-testid="camera-shutter-btn"
              >
                {/* Outer Gold Halo Ring */}
                <span className="absolute inset-0 rounded-full border-2 border-[var(--gold-bright)]/80 group-hover:border-[var(--gold-bright)] group-hover:shadow-[0_0_20px_rgba(232,176,32,0.4)] transition-all animate-pulse" />
                {/* Inner Shutter Solid Disc */}
                <span className="h-16 w-16 rounded-full bg-[var(--gold-bright)] flex items-center justify-center text-black shadow-lg group-active:bg-[var(--gold-glow)] transition-colors">
                  <Camera className="w-7 h-7 text-neutral-950" />
                </span>
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              Tap shutter to freeze &amp; scan
            </p>
          </div>
        </div>
      )}

      {/* Cinematic Scanline Laser Viewfinder (renders across both columns when scanning) */}
      {isActivelyScanning && stageInfo && (
        <div
          className="col-span-2 mt-1 rounded-2xl border border-[var(--gold-border-strong)] bg-[var(--surface-layer-2)] p-3.5 shadow-[var(--specular-top-elevated),var(--shadow-card)] space-y-3"
          role="status"
          aria-live="polite"
          data-testid="receipt-scan-viewfinder"
        >
          {/* Optical Frame with Corner Reticles & Sweeping Laser */}
          <div className="relative h-28 w-full overflow-hidden rounded-xl bg-[var(--surface-canvas)] border border-[var(--border-neutral)] flex items-center justify-center">
            {scanPreviewUrl ? (
              <img
                src={scanPreviewUrl}
                alt="Receipt being scanned"
                className="h-full w-full object-cover opacity-55"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-[var(--text-muted)]">
                <ScanLine className="w-6 h-6 text-[var(--gold-bright)]/70" />
                <span className="text-[10px] font-mono uppercase tracking-widest">
                  Optical Frame Locked
                </span>
              </div>
            )}

            {/* Corner Viewfinder Reticle Brackets */}
            <div className="pointer-events-none absolute top-2 left-2 h-3.5 w-3.5 border-t-2 border-l-2 border-[var(--gold-bright)] rounded-tl-sm" />
            <div className="pointer-events-none absolute top-2 right-2 h-3.5 w-3.5 border-t-2 border-r-2 border-[var(--gold-bright)] rounded-tr-sm" />
            <div className="pointer-events-none absolute bottom-2 left-2 h-3.5 w-3.5 border-b-2 border-l-2 border-[var(--gold-bright)] rounded-bl-sm" />
            <div className="pointer-events-none absolute bottom-2 right-2 h-3.5 w-3.5 border-b-2 border-r-2 border-[var(--gold-bright)] rounded-br-sm" />

            {/* Sweeping Compositor Laser Beam */}
            <div className="bb-scanline-beam pointer-events-none absolute inset-x-2 top-2 h-6 bg-gradient-to-b from-transparent via-[var(--gold-bright)]/35 to-[var(--gold-glow)]/80 border-b border-[var(--gold-glow)] shadow-[0_0_12px_rgba(232,176,32,0.65)]" />
          </div>

          {/* Live Stage Telemetry & Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-[var(--gold-bright)]">
                {scanStage === 'client-ocr' ? (
                  <Cpu className="w-3.5 h-3.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {stageInfo.label}
              </span>
              <span className="font-mono tabular-nums text-[11px] text-[var(--text-muted)]">
                {stageInfo.percent}%
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">{stageInfo.sublabel}</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-layer-3)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--gold-base)] to-[var(--gold-glow)] transition-transform duration-300 origin-left"
                style={{ transform: `scaleX(${stageInfo.percent / 100})` }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
