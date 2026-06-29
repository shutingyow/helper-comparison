import Link from "next/link";
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
          <p className="mt-3 text-sm">
            <Link
              href="/guide"
              className="font-medium text-coral-700 underline decoration-coral-200 underline-offset-2 hover:text-coral-800"
            >
              Need help? Read the setup guide
            </Link>
          </p>
        </div>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/auth/complete"
        />
      </div>
    </div>
  );
}
