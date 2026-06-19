import { AuthForm } from "@/app/auth/AuthForm";
import { signIn } from "@/app/auth/actions";

export default function LoginPage() {
  return (
    <AuthForm
      action={signIn}
      title="Log in to hio"
      submitLabel="Log in"
      altHref="/signup"
      altLabel="No account? Sign up"
    />
  );
}
