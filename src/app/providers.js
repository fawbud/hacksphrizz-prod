"use client";

import { AuthProvider } from "@/context/AuthContext";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

export function Providers({ children }) {
  return (
    <AuthProvider>
      <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}>
        {children}
      </GoogleReCaptchaProvider>
    </AuthProvider>
  );
}
