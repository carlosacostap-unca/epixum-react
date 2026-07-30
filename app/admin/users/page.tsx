import { getUsers } from "@/lib/data";
import { getCurrentUser } from "@/lib/pocketbase-server";
import { User } from "@/types";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserRoleSelect from "@/components/UserRoleSelect";

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    redirect('/');
  }

  const users = await getUsers();

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Administración global de usuarios</h1><p className="mt-2 text-sm text-zinc-500">Esta pantalla gestiona identidad y rol global. Las inscripciones se administran dentro de cada cohorte.</p></div>
        <Link href="/cohorts" className="text-sm font-medium text-blue-600">Administrar cohortes</Link>
      </div>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow overflow-hidden border border-zinc-200 dark:border-zinc-700">
        <table className="w-full text-left text-sm text-zinc-500 dark:text-zinc-400">
          <thead className="bg-zinc-50 dark:bg-zinc-900 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {users.map((user: User) => (
              <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                  {user.avatar ? (
                    // PocketBase file hosts are configured at runtime.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/_pb_users_auth_/${user.id}/${user.avatar}`}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-500 dark:text-zinc-400">
                      {user.name?.[0] || user.email[0]}
                    </div>
                  )}
                  {user.name || "Sin nombre"}
                </td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">
                  <UserRoleSelect user={user} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
