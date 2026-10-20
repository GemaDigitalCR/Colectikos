import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const ADMIN_EMAILS = ['gmontero21@gmail.com', 'gmontero21@icloud.com'];

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const user = await currentUser();

  // Si no está logueado, lo mandamos al login
  if (!user) {
    redirect(`/${lang}/login`);
  }

  // Buscamos si alguno de los correos de Clerk coincide con nuestra lista VIP
  const hasAdminEmail = user.emailAddresses.some((emailObj) =>
    ADMIN_EMAILS.includes(emailObj.emailAddress.toLowerCase())
  );

  // Si no es admin, lo mandamos al home o perfil
  if (!hasAdminEmail) {
    redirect(`/${lang}/profile`);
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Barra de navegación superior del Administrador */}
      <header className="bg-stone-900 text-white border-b border-stone-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-lg uppercase tracking-wider">
              🛡️ Modo Admin
            </span>
            <span className="text-stone-300 font-bold text-sm hidden sm:inline">
              Colectikos Control
            </span>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold">
            <Link 
              href={`/${lang}/admin`}
              className="px-3 py-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
            >
              📊 Infraestructura
            </Link>
            <Link 
              href={`/${lang}/admin/resenas`}
              className="px-3 py-1.5 rounded-lg text-amber-300 hover:text-amber-200 bg-amber-950/40 border border-amber-700/50 hover:bg-amber-900/60 transition-colors flex items-center gap-1"
            >
              <span>🛡️ Moderación</span>
            </Link>
            <Link 
              href={`/${lang}/admin/sponsors`}
              className="px-3 py-1.5 rounded-lg text-emerald-300 hover:text-emerald-200 bg-emerald-950/40 border border-emerald-700/50 hover:bg-emerald-900/60 transition-colors flex items-center gap-1"
            >
              <span>🏪 Patrocinadores</span>
            </Link>
            <Link 
              href={`/${lang}/admin/insights`}
              className="px-3 py-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors hidden md:inline"
            >
              💡 Insights
            </Link>
            <div className="h-4 w-[1px] bg-stone-700 mx-1 hidden sm:block"></div>
            <Link 
              href={`/${lang}/community/muro`}
              className="px-3 py-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 transition-colors"
            >
              🧭 Muro Público
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
