import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { createClient } from "@supabase/supabase-js";

// ✅ Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ✅ Render App
createRoot(document.getElementById("root")!).render(
  <App />
);
