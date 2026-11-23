import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import React, { createRef } from 'react';
import { QuickAddCameraSheet } from './quick-add-camera-sheet';

function markVideoReady(video: HTMLVideoElement, width = 640, height = 480) {
  Object.defineProperty(video, 'readyState', { value: 2, configurable: true });
  Object.defineProperty(video, 'videoWidth', { value: width, configurable: true });
  Object.defineProperty(video, 'videoHeight', { value: height, configurable: true });
  fireEvent(video, new Event('loadeddata'));
}

describe('QuickAddCameraSheet component', () => {
  let originalMediaDevices: unknown;

  beforeEach(() => {
    originalMediaDevices = navigator.mediaDevices;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: originalMediaDevices,
      configurable: true,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  test('falls back to file picker trigger when navigator.mediaDevices is undefined', () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const triggerCamera = vi.fn();
    const handleFileChange = vi.fn();
    const fileInputRef = createRef<HTMLInputElement>();

    render(
      <QuickAddCameraSheet
        loading={false}
        triggerCamera={triggerCamera}
        handleFileChange={handleFileChange}
        fileInputRef={fileInputRef}
        cameraLabel="Scan Receipt"
      />
    );

    const cameraBtn = screen.getByRole('button', { name: /scan receipt/i });
    expect(cameraBtn).toBeInTheDocument();

    fireEvent.click(cameraBtn);
    expect(triggerCamera).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('live-camera-viewfinder')).not.toBeInTheDocument();
  });

  // Regression for P1-C6: .click() on the hidden picker after an await loses
  // user activation, so the fallback must be an explicit user-activated button.
  test('shows a user-activated library fallback instead of programmatically clicking the picker after getUserMedia fails', async () => {
    const triggerCamera = vi.fn();
    const handleFileChange = vi.fn();
    const fileInputRef = createRef<HTMLInputElement>();

    const getUserMediaMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: getUserMediaMock,
      },
      configurable: true,
      writable: true,
    });

    render(
      <QuickAddCameraSheet
        loading={false}
        triggerCamera={triggerCamera}
        handleFileChange={handleFileChange}
        fileInputRef={fileInputRef}
        cameraLabel="Scan Receipt"
      />
    );

    const inputEl = screen.getByTestId('camera-file-input');
    const clickSpy = vi.spyOn(inputEl, 'click');
    const libraryInput = screen.getByTestId('library-file-input');
    const libraryClickSpy = vi.spyOn(libraryInput, 'click');

    const cameraBtn = screen.getByRole('button', { name: /scan receipt/i });
    fireEvent.click(cameraBtn);

    await waitFor(() => {
      expect(getUserMediaMock).toHaveBeenCalled();
      expect(screen.getByTestId('camera-stream-error')).toHaveTextContent(
        'Camera permission denied or camera unavailable.'
      );
    });

    // No programmatic .click() after the await — it fails user-activation checks.
    expect(clickSpy).not.toHaveBeenCalled();
    expect(screen.queryByTestId('live-camera-viewfinder')).not.toBeInTheDocument();

    // The error and fallback button live outside the isLiveActive gate.
    const libraryBtn = screen.getByRole('button', { name: /choose photo from library/i });
    expect(libraryBtn).toBeInTheDocument();
    fireEvent.click(libraryBtn);
    expect(libraryClickSpy).toHaveBeenCalledTimes(1);
  });

  test('initializes live video stream and renders reticle HUD when supported', async () => {
    const stopTrackMock = vi.fn();
    const mockTrack = { stop: stopTrackMock } as unknown as MediaStreamTrack;
    const mockStream = {
      getTracks: () => [mockTrack],
    } as unknown as MediaStream;

    const getUserMediaMock = vi.fn().mockResolvedValue(mockStream);
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: getUserMediaMock,
      },
      configurable: true,
      writable: true,
    });

    const triggerCamera = vi.fn();
    const handleFileChange = vi.fn();
    const fileInputRef = createRef<HTMLInputElement>();

    render(
      <QuickAddCameraSheet
        loading={false}
        triggerCamera={triggerCamera}
        handleFileChange={handleFileChange}
        fileInputRef={fileInputRef}
        cameraLabel="Scan Receipt"
      />
    );

    const cameraBtn = screen.getByRole('button', { name: /scan receipt/i });
    fireEvent.click(cameraBtn);

    await waitFor(() => {
      expect(getUserMediaMock).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({ facingMode: { ideal: 'environment' } }),
          audio: false,
        })
      );
    });

    expect(screen.getByTestId('live-camera-viewfinder')).toBeInTheDocument();
    expect(screen.getByTestId('live-camera-video')).toBeInTheDocument();
    expect(screen.getByTestId('camera-shutter-btn')).toBeInTheDocument();
    expect(screen.getByTestId('switch-camera-btn')).toBeInTheDocument();
    expect(screen.getByTestId('close-live-camera-btn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose photo from library/i })).toBeInTheDocument();
  });

  test('toggles facing mode between environment and user', async () => {
    const stopTrackMock = vi.fn();
    const mockTrack = { stop: stopTrackMock } as unknown as MediaStreamTrack;
    const mockStream = {
      getTracks: () => [mockTrack],
    } as unknown as MediaStream;

    const getUserMediaMock = vi.fn().mockResolvedValue(mockStream);
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: getUserMediaMock,
      },
      configurable: true,
      writable: true,
    });

    const triggerCamera = vi.fn();
    const handleFileChange = vi.fn();
    const fileInputRef = createRef<HTMLInputElement>();

    render(
      <QuickAddCameraSheet
        loading={false}
        triggerCamera={triggerCamera}
        handleFileChange={handleFileChange}
        fileInputRef={fileInputRef}
        cameraLabel="Scan Receipt"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /scan receipt/i }));

    await waitFor(() => {
      expect(getUserMediaMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({ facingMode: { ideal: 'environment' } }),
        })
      );
    });

    // Tap switch camera button
    fireEvent.click(screen.getByTestId('switch-camera-btn'));

    await waitFor(() => {
      expect(getUserMediaMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({ facingMode: { ideal: 'user' } }),
        })
      );
    });
  });

  test('stops stream tracks when user closes live camera viewfinder', async () => {
    const stopTrackMock = vi.fn();
    const mockTrack = { stop: stopTrackMock } as unknown as MediaStreamTrack;
    const mockStream = {
      getTracks: () => [mockTrack],
    } as unknown as MediaStream;

    const getUserMediaMock = vi.fn().mockResolvedValue(mockStream);
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: getUserMediaMock,
      },
      configurable: true,
      writable: true,
    });

    const triggerCamera = vi.fn();
    const handleFileChange = vi.fn();
    const fileInputRef = createRef<HTMLInputElement>();

    render(
      <QuickAddCameraSheet
        loading={false}
        triggerCamera={triggerCamera}
        handleFileChange={handleFileChange}
        fileInputRef={fileInputRef}
        cameraLabel="Scan Receipt"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /scan receipt/i }));

    await waitFor(() => {
      expect(screen.getByTestId('live-camera-viewfinder')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('close-live-camera-btn'));

    expect(stopTrackMock).toHaveBeenCalled();
    expect(screen.queryByTestId('live-camera-viewfinder')).not.toBeInTheDocument();
  });

  test('cleans up stream tracks on component unmount', async () => {
    const stopTrackMock = vi.fn();
    const mockTrack = { stop: stopTrackMock } as unknown as MediaStreamTrack;
    const mockStream = {
      getTracks: () => [mockTrack],
    } as unknown as MediaStream;

    const getUserMediaMock = vi.fn().mockResolvedValue(mockStream);
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: getUserMediaMock,
      },
      configurable: true,
      writable: true,
    });

    const triggerCamera = vi.fn();
    const handleFileChange = vi.fn();
    const fileInputRef = createRef<HTMLInputElement>();

    const { unmount } = render(
      <QuickAddCameraSheet
        loading={false}
        triggerCamera={triggerCamera}
        handleFileChange={handleFileChange}
        fileInputRef={fileInputRef}
        cameraLabel="Scan Receipt"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /scan receipt/i }));

    await waitFor(() => {
      expect(screen.getByTestId('live-camera-viewfinder')).toBeInTheDocument();
    });

    unmount();

    expect(stopTrackMock).toHaveBeenCalled();
  });

  // Regression for P1-C6: capturing before the video has a real frame produced
  // a black image. The shutter must stay disabled until loadeddata with a
  // usable readyState and intrinsic video dimensions.
  test('keeps the shutter disabled until the live video reports a usable frame', async () => {
    const mockStream = {
      getTracks: () => [{ stop: vi.fn() } as unknown as MediaStreamTrack],
    } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      configurable: true,
      writable: true,
    });

    render(
      <QuickAddCameraSheet
        loading={false}
        triggerCamera={vi.fn()}
        handleFileChange={vi.fn()}
        fileInputRef={createRef<HTMLInputElement>()}
        cameraLabel="Scan Receipt"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /scan receipt/i }));
    await waitFor(() => {
      expect(screen.getByTestId('live-camera-video')).toBeInTheDocument();
    });

    const shutter = screen.getByTestId('camera-shutter-btn') as HTMLButtonElement;
    const video = screen.getByTestId('live-camera-video') as HTMLVideoElement;
    expect(shutter).toBeDisabled();

    // readyState alone is insufficient — no intrinsic frame yet.
    Object.defineProperty(video, 'readyState', { value: 2, configurable: true });
    Object.defineProperty(video, 'videoWidth', { value: 0, configurable: true });
    fireEvent(video, new Event('loadeddata'));
    expect(shutter).toBeDisabled();

    markVideoReady(video);
    expect(shutter).toBeEnabled();
  });

  test('captures frame when shutter is tapped and invokes handleCapturedFrame', async () => {
    const stopTrackMock = vi.fn();
    const mockTrack = { stop: stopTrackMock } as unknown as MediaStreamTrack;
    const mockStream = {
      getTracks: () => [mockTrack],
    } as unknown as MediaStream;

    const getUserMediaMock = vi.fn().mockResolvedValue(mockStream);
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: getUserMediaMock,
      },
      configurable: true,
      writable: true,
    });

    // Mock HTMLCanvasElement.toBlob and getContext, recording the geometry so a
    // 0x0 capture mutant cannot pass with a bare vi.fn().
    const mockBlob = new Blob(['test-frame'], { type: 'image/jpeg' });
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const drawImage = vi.fn();
    const recordedDimensions: Array<[number, number]> = [];

    HTMLCanvasElement.prototype.toBlob = vi.fn(function (callback: (blob: Blob | null) => void) {
      callback(mockBlob);
    }) as unknown as typeof HTMLCanvasElement.prototype.toBlob;

    HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(function (
      this: HTMLCanvasElement
    ) {
      return {
        drawImage: (...args: unknown[]) => {
          recordedDimensions.push([this.width, this.height]);
          drawImage(...args);
        },
      } as unknown as CanvasRenderingContext2D;
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    const triggerCamera = vi.fn();
    const handleFileChange = vi.fn();
    const handleCapturedFrame = vi.fn();
    const fileInputRef = createRef<HTMLInputElement>();

    render(
      <QuickAddCameraSheet
        loading={false}
        triggerCamera={triggerCamera}
        handleFileChange={handleFileChange}
        fileInputRef={fileInputRef}
        cameraLabel="Scan Receipt"
        handleCapturedFrame={handleCapturedFrame}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /scan receipt/i }));

    await waitFor(() => {
      expect(screen.getByTestId('live-camera-video')).toBeInTheDocument();
    });

    const video = screen.getByTestId('live-camera-video') as HTMLVideoElement;
    markVideoReady(video, 640, 480);

    fireEvent.click(screen.getByTestId('camera-shutter-btn'));

    await waitFor(() => {
      expect(handleCapturedFrame).toHaveBeenCalledWith(mockBlob);
    });

    expect(recordedDimensions).toEqual([[640, 480]]);
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 640, 480);
    expect(stopTrackMock).toHaveBeenCalled();
    expect(screen.queryByTestId('live-camera-viewfinder')).not.toBeInTheDocument();

    HTMLCanvasElement.prototype.toBlob = originalToBlob;
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  test('renders cinematic scanline laser viewfinder when actively scanning', () => {
    const triggerCamera = vi.fn();
    const handleFileChange = vi.fn();
    const fileInputRef = createRef<HTMLInputElement>();

    render(
      <QuickAddCameraSheet
        loading={true}
        triggerCamera={triggerCamera}
        handleFileChange={handleFileChange}
        fileInputRef={fileInputRef}
        cameraLabel="Scan Receipt"
        scanStage="ai-vision"
        scanPreviewUrl="data:image/jpeg;base64,mock"
      />
    );

    expect(screen.getByTestId('receipt-scan-viewfinder')).toBeInTheDocument();
    expect(screen.getByText(/Extracting merchant & line items/i)).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });
});
