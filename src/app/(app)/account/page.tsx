import { ChangePasswordForm } from "./change-password-form";

export default function AccountPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 p-8">
      <div>
        <h1 className="text-xl font-semibold">Change password</h1>
        <p className="text-sm text-muted-foreground">
          Update the password for your own login.
        </p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
