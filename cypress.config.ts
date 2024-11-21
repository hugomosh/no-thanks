import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    setupNodeEvents(on, config) {
      on("task", {
        async resetTestData() {
          // We'll implement this later to reset the test database
          return null;
        },
        async createTestUsers() {
          // We'll implement this later to create test users
          return null;
        },
      });
    },
  },
  env: {
    SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  },
});
