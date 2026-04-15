import { LoginForm } from '@/components/login-form'
import { LoginVisual } from '@/components/login-visual'

export default function LoginPage() {
  return (
    <main className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <section
        className="relative flex items-center justify-center px-6 py-10 sm:px-10 lg:px-16"
        aria-labelledby="login-heading"
      >
        <LoginForm />
      </section>
      <LoginVisual />
    </main>
  )
}
