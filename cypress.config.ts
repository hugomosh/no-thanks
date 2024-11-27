import { defineConfig } from "cypress";

import { tasks } from "./cypress/tasks/supabase";

console.log("process.env");
console.log(process.env);

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    setupNodeEvents(on, _config) {
      on("task", tasks);
    },
  },
  env: {
    ZZZZ: "SFdsgdsg",
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
