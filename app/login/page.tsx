import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/login-form';
import { FamilyIcon } from '@/components/ui/Icons';
import { decryptSession, SESSION_COOKIE_NAME } from '@/lib/session';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const session = await decryptSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (session) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen">
      {/* Painel de marca */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white lg:flex lg:w-1/2">
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
            <FamilyIcon className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">Thidinho</span>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Controle financeiro
            <br />
            do Thidinho.
          </h1>
          <p className="mt-4 max-w-md text-indigo-100/80">
            Acompanhe entradas, contas, cartões e investimentos em um só lugar.
          </p>
        </div>

        <p className="relative text-sm text-indigo-100/60">
          © {new Date().getFullYear()} Thidinho
        </p>
      </div>

      {/* Painel de login */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white">
              <FamilyIcon className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Thidinho</span>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Bem-vindo de volta</h2>
            <p className="mt-1 text-sm text-slate-500">
              Entre com suas credenciais para acessar o painel.
            </p>

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
