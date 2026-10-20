import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const locales = ['es', 'en'];
const defaultLocale = 'es';

function getLocale(request: NextRequest): string {
  // 1. Priorizar la cookie del usuario si existe
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }

  // 2. Si no hay cookie, detectar por headers del navegador
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  if (!negotiatorHeaders['accept-language']) {
    return defaultLocale;
  }

  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  return match(languages, locales, defaultLocale);
}

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/sign-up(.*)',
  '/sso-callback',
  '/:lang/login(.*)',
  '/:lang/sign-up(.*)',
  '/:lang/terminos',
  '/:lang/contact',
  '/:lang/provincias',
  '/:lang/proximos-destinos',
  '/destinos/complementos(.*)',
  '/:lang/destinos/complementos(.*)',
  '/nuestra-app(.*)',
  '/:lang/nuestra-app(.*)',
  '/api/(.*)'
]);

const middleware = clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;
  
  // Excluir archivos estáticos y rutas de API
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') || 
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  const preferredLocale = getLocale(request);
  const currentUrlLocale = locales.find((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`);
  
  if (currentUrlLocale) {
    if (currentUrlLocale !== preferredLocale) {
      // La URL no coincide con el idioma preferido. Redirigir.
      const newPath = pathname.replace(`/${currentUrlLocale}`, preferredLocale === defaultLocale ? '' : `/${preferredLocale}`) || '/';
      const newUrl = new URL(newPath, request.url);
      newUrl.search = request.nextUrl.search;
      return NextResponse.redirect(newUrl);
    } else if (currentUrlLocale === defaultLocale) {
       // El preferido es 'es' y la URL tiene explícitamente '/es'. Quitarlo para URL limpia.
       const newPath = pathname.replace(`/${defaultLocale}`, '') || '/';
       const newUrl = new URL(newPath, request.url);
       newUrl.search = request.nextUrl.search;
       return NextResponse.redirect(newUrl);
    }
  } else {
    // La URL no tiene locale, por lo que asume idioma por defecto ('es')
    if (preferredLocale !== defaultLocale) {
      // Si prefiere inglés, redirigir visiblemente a /en/...
      const newUrl = new URL(`/${preferredLocale}${pathname}`, request.url);
      newUrl.search = request.nextUrl.search;
      return NextResponse.redirect(newUrl);
    } else {
      // Si prefiere español, hacemos REWRITE interno a /es/...
      // Mantiene la URL limpia (ej. /profile)
      const newUrl = new URL(`/${defaultLocale}${pathname}`, request.url);
      newUrl.search = request.nextUrl.search;
      return NextResponse.rewrite(newUrl);
    }
  }

  return NextResponse.next();
});

export default middleware;

export const config = {
  matcher: [
    '/((?!_next|api|favicon.ico).*)',
  ],
};
