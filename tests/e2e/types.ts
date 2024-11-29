// tests/e2e/types.ts
export {};

declare global {
  interface Window {
    mockJoinRoom: (playerNames: string[]) => Promise<void>;
  }
}