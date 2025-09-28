'use client';

import { SignUpForm } from '@/components/signup-form';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8">
        <SignUpForm />
      </div>
    </div>
  );
}