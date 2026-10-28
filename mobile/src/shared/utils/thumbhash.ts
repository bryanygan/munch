// thumbHashToDataURL is available in thumbhash >= 0.1.1 and returns a
// data:image/png;base64,... URL directly from the hash bytes — no native
// modules required, works in Expo Go.
import { thumbHashToDataURL } from 'thumbhash';

const memo: Record<string, string> = {};

export const thumbhashToDataUri = (thumbhash: string): string | null => {
  if (memo[thumbhash]) return memo[thumbhash]!;
  try {
    const bytes = base64ToBytes(thumbhash);
    const dataUrl = thumbHashToDataURL(bytes);
    memo[thumbhash] = dataUrl;
    return dataUrl;
  } catch {
    return null;
  }
};

const base64ToBytes = (s: string): Uint8Array => {
  const bin = globalThis.atob ? globalThis.atob(s) : Buffer.from(s, 'base64').toString('binary');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};
