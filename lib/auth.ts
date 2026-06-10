interface User {
  username: string;
  password: string;
}

function getUsers(): User[] {
  return [
    { username: 'thiago', password: process.env.AUTH_PASSWORD_THIAGO ?? '' },
    { username: 'lorenna', password: process.env.AUTH_PASSWORD_LORENNA ?? '' },
  ];
}

export function validateCredentials(username: string, password: string): boolean {
  const user = getUsers().find((u) => u.username === username);

  // DEBUG temporário — remover depois de diagnosticar o login na Vercel
  console.log('[auth debug]', {
    username,
    userEncontrado: Boolean(user),
    envPasswordLen: user?.password.length ?? 0,
    inputPasswordLen: password.length,
    sessionSecretDefinido: Boolean(process.env.SESSION_SECRET),
  });

  return Boolean(user && user.password && user.password === password);
}
