import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Key, Layout, BookOpen } from 'lucide-react'

export function LoginGuidePage() {
  return (
    <div className="relative flex min-h-full items-center justify-center bg-slate-50 px-4 py-12 overflow-hidden">
      <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-teal-500/5 blur-[80px]" />
      <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-blue-500/5 blur-[80px]" />

      <div className="relative w-full max-w-[700px]">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-colors group">
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
            Back to Access
          </Link>
        </div>

        <div className="overflow-hidden rounded-[32px] bg-white shadow-2xl shadow-slate-200/60 ring-1 ring-slate-100">
           <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-8 py-10 text-white">
              <div className="flex items-center gap-4 mb-2">
                 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500 shadow-lg shadow-teal-500/20 text-white">
                    <BookOpen size={22} />
                 </div>
                 <div>
                    <h1 className="text-2xl font-black tracking-tight">System Access Guide</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Platform roles & configuration</p>
                 </div>
              </div>
           </div>

           <div className="p-8 sm:p-10 space-y-10">
              {/* Roles */}
              <section className="space-y-4">
                 <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-teal-600" />
                    <h2 className="text-lg font-black text-slate-900">Authentication & Roles</h2>
                 </div>
                 <p className="text-[15px] font-medium text-slate-500 leading-relaxed">
                    The platform uses organization-wide SSO. When you sign in with Google for the first time, our system automatically assigns you a role.
                 </p>
                 <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <li className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                       <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 mb-1">Admin Access</p>
                       <p className="text-xs font-bold text-slate-600">Emails in the ADMIN_EMAILS global config get full system control instantly.</p>
                    </li>
                    <li className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Standard User</p>
                       <p className="text-xs font-bold text-slate-600">All other verified users are granted basic facility request and ticket access.</p>
                    </li>
                 </ul>
              </section>

              {/* Dev Info */}
              <section className="space-y-4">
                 <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-teal-600" />
                    <h2 className="text-lg font-black text-slate-900">Developer Quick-start</h2>
                 </div>
                 <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3">
                       <span className="text-xs font-bold text-slate-400">Backend Server</span>
                       <code className="text-[11px] font-mono text-teal-400">mvn spring-boot:run</code>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3">
                       <span className="text-xs font-bold text-slate-400">Frontend App</span>
                       <code className="text-[11px] font-mono text-teal-400">npm run dev</code>
                    </div>
                 </div>
              </section>

              {/* Permissions */}
              <section className="space-y-4">
                 <div className="flex items-center gap-3">
                    <Layout className="h-5 w-5 text-teal-600" />
                    <h2 className="text-lg font-black text-slate-900">Core Permissions</h2>
                 </div>
                 <div className="overflow-hidden rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-sm">
                       <thead className="bg-slate-50">
                          <tr className="border-b border-slate-100">
                             <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Module</th>
                             <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">User</th>
                             <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-teal-600 text-center">Admin</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50 font-bold text-slate-600">
                          <tr><td className="px-6 py-3">Dashboard Analytics</td><td className="text-center text-slate-300">—</td><td className="text-center text-teal-500">✓</td></tr>
                          <tr><td className="px-6 py-3">Facility Requests</td><td className="text-center text-teal-500">✓</td><td className="text-center text-teal-500">✓</td></tr>
                          <tr><td className="px-6 py-3">User Management</td><td className="text-center text-slate-300">—</td><td className="text-center text-teal-500">✓</td></tr>
                          <tr><td className="px-6 py-3">Support Tickets</td><td className="text-center text-teal-500">✓</td><td className="text-center text-teal-500">✓</td></tr>
                       </tbody>
                    </table>
                 </div>
              </section>
           </div>
        </div>
      </div>
    </div>
  )
}
