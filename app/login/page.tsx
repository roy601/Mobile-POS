"use client"

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/utils/supabase/component";


export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  async function logIn() {
    setLoginError(""); // Clear previous errors
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Login result:", { data, error });

      if (error) {
        console.error("Login error:", error.message);
        setLoginError(error.message);
        return; // Stop here - don't redirect
      }

      if (!data?.session) {
        console.error("No session created despite no error");
        setLoginError("Authentication failed - no session");
        return;
      }

      console.log("Login successful, redirecting to main");
      router.push("/main");
      
    } catch (err) {
      console.error("Unexpected error during login:", err);
      setLoginError("An unexpected error occurred");
    }
}



  async function signUp() {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.session) {
      console.error(error);
      router.push("/login");
    }
  }

  return (
    <main>
      <form>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="button" onClick={logIn}>
          Log in
        </button>
        <button type="button" onClick={signUp}>
          Sign up
        </button>
      </form>
    </main>
  );
}
