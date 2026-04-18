import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function LoginGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-slate-300">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-teal-400 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Login
      </Link>
      <h1 className="mb-2 text-2xl font-semibold text-white">Login · Roles · Pages Guide</h1>
      <div className="card mt-6 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-teal-200">1. Admin vs User — Shared Login</h2>
          <p>
            There is only <strong>one “Continue with Google”</strong> button. There isn't a separate “Admin login” URL or a different password form. 
            When you select your <strong>Gmail</strong> account, the server automatically assigns a role (<code>ADMIN</code>,{' '} 
            <code>USER</code>, or <code>TECHNICIAN</code>) to your email.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-400">
            <li>
              If it's your <strong>first time</strong> and your email is in <code>ADMIN_EMAILS</code> (backend env) →{' '}
              <strong>ADMIN</strong>.
            </li>
            <li>Otherwise → typically <strong>USER</strong>.</li>
            <li>An administrator can change roles later via user management.</li>
          </ul>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-teal-200">2. How to login and access the dashboard?</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Backend: <code>mvn spring-boot:run</code> (port <strong>9094</strong>)
            </li>
            <li>
              Frontend: <code>npm run dev</code> (port <strong>5173</strong>)
            </li>
            <li>
              Browser: Visit <code>http://localhost:5173</code> → Click Google button → Select Gmail account.
            </li>
            <li>
              If successful, you will be redirected to <strong>/app</strong> (Overview / Dashboard).
            </li>
          </ol>
          <p className="mt-3 text-amber-200/90">
            If you are still on the login page: check if the backend is running. Ensure both frontend and backend use the{' '}
            <strong>same Google Client ID</strong>. Check the browser console for error messages.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-teal-200">3. Sidebar — Permission Overview</h2>
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="py-2 pr-2">Page</th>
                <th className="py-2">USER</th>
                <th className="py-2">TECHNICIAN</th>
                <th className="py-2">ADMIN</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-slate-800/80">
                <td className="py-2">Overview</td>
                <td>✓</td>
                <td>✓</td>
                <td>✓ (analytics)</td>
              </tr>
              <tr className="border-b border-slate-800/80">
                <td className="py-2">Facilities / Bookings / Tickets / Notifications</td>
                <td>✓</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td className="py-2">Admin (users, roles)</td>
                <td>—</td>
                <td>—</td>
                <td>✓</td>
              </tr>
            </tbody>
          </table>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-teal-200">4. How to become an Admin?</h2>
          <p>
            In your backend environment or <code>application.properties</code>:{' '}
            set <code>ADMIN_EMAILS=your@gmail.com</code> (comma-separated). When you login with that Gmail for the{' '}
            <strong>first time</strong>, you will be granted the ADMIN role. If you are already a USER, another Admin must update your role to ADMIN via the{' '}
            <strong>Admin → Users</strong> table.
          </p>
        </section>
      </div>
    </div>
  )
}

