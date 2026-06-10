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
  return Boolean(user && user.password && user.password === password);
}
