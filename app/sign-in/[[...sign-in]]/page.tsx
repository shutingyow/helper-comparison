import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-stone-900">Helper Hub</h1>
          <p className="mt-1 text-sm text-stone-500">
            Sign in to manage your helper applications
          </p>
        </div>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/inbox"
        />
      </div>
    </div>
  );
}
