import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

export const middleware = authkitMiddleware();

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
};
