import { SignUp } from "@clerk/nextjs";
import { AuthFrame } from "@/components/auth-frame";

export default function SignUpPage() {
  return (
    <AuthFrame title="Create your player profile" subtitle="Join clubs, play games, win rewards.">
      <SignUp />
    </AuthFrame>
  );
}
