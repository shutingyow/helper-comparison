import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-stone-900">Helper Hub</h1>
          <p className="mt-1 text-sm text-stone-500">
            Create an account to manage your helper applications
          </p>
        </div>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/inbox"
        />
      </div>
    </div>
  );
}
