import { AuthForm } from "@/app/auth/AuthForm";
import { signIn } from "@/app/auth/actions";
import { loginNotice } from "@/app/auth/messages";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { notice } = await searchParams;
  return (
    <AuthForm
      action={signIn}
      title="Log in to hio"
      submitLabel="Log in"
      altHref="/signup"
      altLabel="No account? Sign up"
      notice={loginNotice(notice)}
    />
  );
}
