import { AuthForm } from "@/app/auth/AuthForm";
import { signUp } from "@/app/auth/actions";

export default function SignUpPage() {
  return (
    <AuthForm
      action={signUp}
      title="Create your hio page"
      submitLabel="Sign up"
      altHref="/login"
      altLabel="Already have an account? Log in"
    />
  );
}
