import { defineConfig } from "cypress";

import { tasks } from "./cypress/tasks/supabase";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    setupNodeEvents(on, _config) {
      on("task", tasks);
    },
  },
  env: {
    SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  },
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
});
