// src/test/setup.ts
import { vi } from "vitest";
import "@testing-library/jest-dom";

// Initialize storage mock
const storageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Mock localStorage
Object.defineProperty(window, "localStorage", {
  value: storageMock,
});

// Create and export mockSupabase
export const mockSupabase = {
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  })),
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    execute: vi.fn(),
  })),
};

// Set up Supabase mock
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => mockSupabase,
}));

// Mock ResizeObserver
vi.stubGlobal(
  "ResizeObserver",
  vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
);

// Mock matchMedia
vi.stubGlobal(
  "matchMedia",
  vi.fn(() => ({
    matches: false,
    media: "",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
);
