import { neon } from "../../services/neon/client";
import { useAuth } from "../../app/providers/useAuth";

export default function Profile() {
  const { session } = useAuth();
  return (
    <div className="space-y-4 p-6">
      <h2 className="text-xl font-semibold text-midnight">Profile</h2>
      <p className="text-sm text-gray-600">{session?.user.email}</p>
      <button
        onClick={() => neon.auth.signOut()}
        className="rounded-xl bg-midnight px-5 py-3 font-semibold text-white"
      >
        Log out
      </button>
    </div>
  );
}
