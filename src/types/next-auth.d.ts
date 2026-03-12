import { Role } from '@prisma/client';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      profileId?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    profileId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    profileId?: string;
  }
}
