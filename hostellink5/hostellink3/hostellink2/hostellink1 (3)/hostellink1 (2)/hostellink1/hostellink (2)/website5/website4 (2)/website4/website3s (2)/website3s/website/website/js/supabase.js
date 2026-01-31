import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
  "https://yxlvfvbpvqdnatnyelli.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bHZmdmJwdnFkbmF0bnllbGxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNzkwMjUsImV4cCI6MjA4NDg1NTAyNX0.yK3meugxayzaXnZKSlrJc3vEsSYwZBh3fZkA7JLXsRg"
);
