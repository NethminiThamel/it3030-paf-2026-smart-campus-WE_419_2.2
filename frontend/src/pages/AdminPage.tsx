import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Role, User } from '../types'

export function AdminPage() {
  const qc = useQueryClient()
  const users = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get<User[]>('/api/v1/admin/users')).data,
  })

  const updateRole = useMutation({
    mutationFn: async (p: { id: number; role: Role }) =>
      (await api.patch<User>(`/api/v1/admin/users/${p.id}/role`, { role: p.role })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Administration</h1>
        <p className="text-sm font-medium text-slate-500">User roles and access control</p>
      </div>
      <div className="card overflow-x-auto border-slate-100">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <tr>
              <th className="pb-4">User</th>
              <th className="pb-4">Email</th>
              <th className="pb-4">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.data?.map((u) => (
              <tr key={u.id} className="text-slate-600">
                <td className="py-4 font-bold text-slate-900">{u.fullName}</td>
                <td className="py-4 font-medium">{u.email}</td>
                <td className="py-4">
                  <select
                    className="input max-w-[160px] font-bold text-xs"
                    value={u.role}
                    onChange={(e) => updateRole.mutate({ id: u.id, role: e.target.value as Role })}
                  >
                    {(['USER', 'TECHNICIAN', 'ADMIN'] as Role[]).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
