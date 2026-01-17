"use client";

import { useState, useEffect } from "react";

type User = {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  email_verified_at: string | null;
  document_count: number;
  owned_projects_count: number;
  member_projects_count: number;
};

type UsersResponse = {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export default function UsersClient() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchUsers = async (pageNum: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users?page=${pageNum}&limit=50`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch users");
      }
      
      const data: UsersResponse = await res.json();
      setData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`${currentStatus ? "Remove" : "Grant"} admin access for this user?`)) {
      return;
    }

    try {
      setUpdatingUserId(userId);
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !currentStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update user");
      }

      // Refresh the user list
      await fetchUsers(page);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-6">
        <p className="opacity-70">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-600/10 dark:bg-red-400/10 border border-red-600/20 dark:border-red-400/20 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300 font-semibold">Error</p>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="opacity-70 mt-1">
            Total users: {data.pagination.total}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-black rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/15">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                  Verified
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                  Projects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-black divide-y divide-black/10 dark:divide-white/15">
              {data.users.map((user) => {
                const totalProjects = user.owned_projects_count + user.member_projects_count;
                return (
                  <tr key={user.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.email_verified_at ? (
                        <span 
                          className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-600/10 dark:bg-green-400/10 text-green-700 dark:text-green-300"
                          title={`Verified on ${new Date(user.email_verified_at).toLocaleDateString()}`}
                        >
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-600/10 dark:bg-yellow-400/10 text-yellow-700 dark:text-yellow-300">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_admin ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-600/10 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300">
                          Admin
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-black/10 dark:bg-white/10">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {totalProjects > 0 ? (
                        <span 
                          className="opacity-70"
                          title={`${user.owned_projects_count} owned, ${user.member_projects_count} member`}
                        >
                          {totalProjects}
                          {user.owned_projects_count > 0 && user.member_projects_count > 0 && (
                            <span className="text-xs opacity-50 ml-1">
                              ({user.owned_projects_count}/{user.member_projects_count})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="opacity-50">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm opacity-70">
                      {user.document_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm opacity-70">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                        disabled={updatingUserId === user.id}
                        className={`${
                          user.is_admin
                            ? "text-red-700 dark:text-red-300 hover:underline"
                            : "hover:underline"
                        } disabled:opacity-50 disabled:cursor-not-allowed transition`}
                      >
                        {updatingUserId === user.id
                          ? "Updating..."
                          : user.is_admin
                          ? "Remove Admin"
                          : "Make Admin"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-black/10 dark:border-white/15 bg-white dark:bg-black px-4 py-3 sm:px-6 rounded-lg">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
              disabled={page === data.pagination.totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm opacity-70">
                Showing page <span className="font-medium">{page}</span> of{" "}
                <span className="font-medium">{data.pagination.totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md" aria-label="Pagination">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 opacity-70 border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <span className="sr-only">Previous</span>
                  ←
                </button>
                <button
                  onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
                  disabled={page === data.pagination.totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 opacity-70 border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <span className="sr-only">Next</span>
                  →
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

