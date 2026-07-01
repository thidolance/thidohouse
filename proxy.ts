import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { decryptSession, SESSION_COOKIE_NAME } from '@/lib/session';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await decryptSession(token);

  if (!session && pathname !== '/login') {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Exclui assets estáticos e ícones de metadata (favicon, icon, apple-icon) para que
  // não sejam redirecionados ao login — o iOS busca o apple-touch-icon sem sessão.
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|gif|ico|webp)$).*)'],
};
