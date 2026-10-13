import { SignIn } from "@clerk/nextjs";
import { AuthFrame } from "@/components/auth-frame";

export default function SignInPage() {
  return (
    <AuthFrame title="Welcome back, player" subtitle="Sign in to continue your streak.">
      <SignIn />
    </AuthFrame>
  );
}
