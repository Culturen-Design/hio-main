import { AuthForm } from "@/app/auth/AuthForm";
import { signIn } from "@/app/auth/actions";

export default function LoginPage() {
  return <AuthForm action={signIn} title="Log in to hio Studio" submitLabel="Log in" />;
}
