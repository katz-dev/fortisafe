'use client';
import { useEffect } from "react";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function LoginPage() {
  useEffect(() => {
    // Redirect to the backend login endpoint which will handle Auth0 redirect
    window.location.href = `${backendUrl}/auth/login`;
  }, []);
}