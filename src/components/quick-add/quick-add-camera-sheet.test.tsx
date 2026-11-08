import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import React, { createRef } from 'react';
import { QuickAddCameraSheet } from './quick-add-camera-sheet';

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

  test('falls back to file input click when getUserMedia throws permission error', async () => {
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

    const cameraBtn = screen.getByRole('button', { name: /scan receipt/i });
    fireEvent.click(cameraBtn);

    await waitFor(() => {
      expect(getUserMediaMock).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
    });

    // Viewfinder closes upon fallback to file picker
    expect(screen.queryByTestId('live-camera-viewfinder')).not.toBeInTheDocument();
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

    // Mock HTMLCanvasElement.toBlob and getContext
    const mockBlob = new Blob(['test-frame'], { type: 'image/jpeg' });
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    const originalGetContext = HTMLCanvasElement.prototype.getContext;

    HTMLCanvasElement.prototype.toBlob = vi.fn(function (callback: (blob: Blob | null) => void) {
      callback(mockBlob);
    }) as unknown as typeof HTMLCanvasElement.prototype.toBlob;

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage: vi.fn(),
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
      expect(screen.getByTestId('camera-shutter-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('camera-shutter-btn'));

    await waitFor(() => {
      expect(handleCapturedFrame).toHaveBeenCalledWith(mockBlob);
    });

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
