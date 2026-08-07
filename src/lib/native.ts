/**
 * Native (Capacitor) runtime detection helpers.
 *
 * Centralises platform checks so UI code never imports @capacitor/core
 * directly and accidentally breaks the web build. On the web these all
 * return false; inside the Android/iOS WebView they reflect the real platform.
 */
import { Capacitor } from '@capacitor/core';

export const isNative = (): boolean => Capacitor.isNativePlatform();

export const getPlatform = (): 'web' | 'android' | 'ios' => {
  if (Capacitor.isNativePlatform()) {
    return Capacitor.getPlatform() as 'android' | 'ios';
  }
  return 'web';
};

export const isAndroid = (): boolean => getPlatform() === 'android';
export const isIOS = (): boolean => getPlatform() === 'ios';

/**
 * Convert a native file path (e.g. a photo from the camera) into a WebView-
 * loadable URL. On web this is a no-op passthrough.
 */
export const nativeFileUrl = (filePath: string): string =>
  Capacitor.convertFileSrc(filePath);
