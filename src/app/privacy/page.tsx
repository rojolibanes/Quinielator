import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidad - QuinielaTOR',
  description: 'Política de Privacidad y tratamiento de datos de la plataforma QuinielaTOR.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#090D1A] text-slate-100 flex flex-col justify-between">
      {/* Header / Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600">
            <span className="text-white font-black text-sm">Q</span>
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-white">Quiniela</span>
            <span className="text-emerald-400 font-black italic">TOR</span>
          </span>
        </Link>
        <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
          Iniciar Sesión
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8 flex-1">
        <div className="space-y-3 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-white">Política de Privacidad</h1>
          <p className="text-slate-400 text-sm">Última actualización: 20 de julio de 2026</p>
        </div>

        <div className="prose prose-invert max-w-none text-slate-300 space-y-6 text-sm leading-relaxed">
          <section className="space-y-2.5">
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">1. Información General</h2>
            <p>
              QuinielaTOR es una plataforma de predicciones y porras de fútbol orientada al entretenimiento privado y personal entre usuarios. 
              Esta Política de Privacidad describe cómo recopilamos, utilizamos y protegemos su información al usar nuestra aplicación.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">2. Datos que Recopilamos</h2>
            <p>Únicamente recopilamos los datos estrictamente necesarios para el funcionamiento de la plataforma:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Información de Registro:</strong> Dirección de correo electrónico y contraseña al crear una cuenta local, o información del perfil (nombre y correo) al iniciar sesión mediante Google.</li>
              <li><strong>Información del Perfil:</strong> Nombre de usuario (nickname), frase de perfil (lema) y dirección de avatar (foto de perfil) seleccionada por el usuario.</li>
              <li><strong>Datos de Juego:</strong> Predicciones de partidos, configuración de ligas creadas y puntuaciones asociadas.</li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">3. Uso de los Datos</h2>
            <p>Utilizamos la información recopilada exclusivamente para los siguientes propósitos:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Permitir el acceso seguro y autenticación en la plataforma.</li>
              <li>Gestionar y calcular las clasificaciones y puntuaciones dentro de las ligas de juego.</li>
              <li>Mostrar su nombre de usuario e imagen de avatar en la tabla de clasificación a los miembros de las ligas en las que participe.</li>
            </ul>
            <p className="text-emerald-400/90 font-medium">
              ⚠️ NUNCA vendemos, comercializamos, ni transferimos sus datos personales a terceras empresas o anunciantes.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">4. Almacenamiento y Seguridad de los Datos</h2>
            <p>
              Los datos se almacenan en servidores gestionados de forma segura mediante **Supabase**, utilizando sistemas de cifrado y control de accesos líderes en la industria.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">5. Derechos del Usuario y Eliminación de Cuenta</h2>
            <p>
              Usted tiene derecho a acceder, corregir o eliminar su información en cualquier momento. Si desea eliminar su cuenta y borrar permanentemente todos sus datos del sistema, puede solicitarlo enviando un correo electrónico a la dirección de soporte indicada en esta página o a través del menú de su perfil en la app.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">6. Contacto</h2>
            <p>
              Si tiene cualquier duda sobre esta política o el tratamiento de sus datos, puede ponerse en contacto con nosotros escribiendo al administrador de la plataforma:
            </p>
            <p className="font-semibold text-white">
              Contacto de Soporte: <span className="text-emerald-400">ariarnaufp@gmail.com</span>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} QuinielaTOR. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
