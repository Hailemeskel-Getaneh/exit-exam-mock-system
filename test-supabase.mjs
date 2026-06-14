// Quick Supabase connection test
// Run with: node test-supabase.mjs
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

globalThis.WebSocket = ws;

const url = "https://bkxxhsfsgebowvxamhyo.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJreHhoc2ZzZ2Vib3d2eGFtaHlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNzY3NjQsImV4cCI6MjA5Njk1Mjc2NH0.4sCDVf5RNmRsD-oD4yb6E9G6olRLhGImKVVtdrQe6WM";

const supabase = createClient(url, key);

console.log("Testing Supabase connection...");

// Try to query the students table
const { data, error } = await supabase.from("students").select("count").limit(1);

if (error) {
  if (error.code === "42P01") {
    console.log("❌ Tables not found. Please run supabase_schema.sql in the SQL Editor first.");
    console.log("   Go to: https://supabase.com/dashboard/project/bkxxhsfsgebowvxamhyo/sql");
  } else {
    console.log("❌ Connection error:", error.message);
    console.log("   Code:", error.code);
  }
} else {
  console.log("✅ Supabase connection successful! Tables are ready.");
  console.log("   Data:", data);
}
