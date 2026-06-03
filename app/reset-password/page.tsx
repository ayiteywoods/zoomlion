import { Suspense } from "react";
import { ResetPasswordPhoneStep } from "@/components/reset-password-phone-step";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPhoneStep />
    </Suspense>
  );
}
