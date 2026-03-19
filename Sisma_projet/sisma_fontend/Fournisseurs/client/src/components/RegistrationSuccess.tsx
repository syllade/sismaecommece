import { Link, useLocation } from "wouter";

interface RegistrationSuccessProps {
  message?: string;
  supplierName?: string;
}

export default function RegistrationSuccess({ 
  message = "Merci d'avoir choisi SISMA Pro. Votre dossier est maintenant entre les mains de nos experts pour validation.",
  supplierName
}: RegistrationSuccessProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col font-display">
      {/* Top Navigation Bar */}
      <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <div className="bg-primary p-1.5 rounded-lg flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-white text-2xl">rocket_launch</span>
              </div>
            </Link>
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase cursor-pointer">
              SISMA <span className="text-primary">Pro</span>
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-12 px-6">
        <div className="max-w-3xl w-full bg-white dark:bg-slate-900/50 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
          {/* Success Header */}
          <div className="pt-12 pb-8 px-8 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-primary/5">
              <span className="material-symbols-outlined text-primary text-6xl">check_circle</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
              Demande d'inscription envoyée avec succès !
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-xl mx-auto">
              {message}
            </p>
          </div>

          {/* Progress Timeline */}
          <div className="px-8 pb-10">
            <div className="bg-background-light dark:bg-slate-800/50 rounded-xl p-6 md:p-8">
              <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-5 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-700 z-0"></div>

                {/* Step 1 */}
                <div className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                    <span className="material-symbols-outlined text-xl">check</span>
                  </div>
                  <div className="text-left md:text-center">
                    <p className="text-sm font-bold text-primary">1. Soumission</p>
                    <p className="text-xs text-slate-500 font-medium">Complété</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-primary flex items-center justify-center text-primary animate-pulse">
                    <span className="material-symbols-outlined text-xl">pending</span>
                  </div>
                  <div className="text-left md:text-center">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">2. Revue de dossier</p>
                    <p className="text-xs text-slate-500 font-medium">En cours</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined text-xl">lock_clock</span>
                  </div>
                  <div className="text-left md:text-center">
                    <p className="text-sm font-bold text-slate-400">3. Activation</p>
                    <p className="text-xs text-slate-500 font-medium">À venir</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-sm italic">
                <span className="material-symbols-outlined text-lg">info</span>
                Délai d'activation moyen : 2 à 4 heures ouvrables.
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="px-8 pb-10 border-t border-slate-100 dark:border-slate-800 pt-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">tips_and_updates</span>
              Que faire maintenant ?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all bg-slate-50 dark:bg-slate-800/30">
                <span className="material-symbols-outlined text-primary mb-2">image</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Préparez vos visuels</p>
                <p className="text-xs text-slate-500 mt-1">Photos haute qualité de vos produits.</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all bg-slate-50 dark:bg-slate-800/30">
                <span className="material-symbols-outlined text-primary mb-2">menu_book</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Guide vendeur</p>
                <p className="text-xs text-slate-500 mt-1">Consultez nos bonnes pratiques.</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all bg-slate-50 dark:bg-slate-800/30">
                <span className="material-symbols-outlined text-primary mb-2">smartphone</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Application mobile</p>
                <p className="text-xs text-slate-500 mt-1">Gérez votre boutique partout.</p>
              </div>
            </div>
          </div>

          {/* Support & Actions */}
          <div className="px-8 pb-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-100 dark:border-slate-800 pt-8">
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Besoin d'aide ?</p>
                <div className="flex flex-wrap gap-4">
                  <a className="flex items-center gap-2 text-primary hover:underline font-medium" href="#">
                    <span className="material-symbols-outlined text-xl">chat</span>
                    WhatsApp Support
                  </a>
                  <a className="flex items-center gap-2 text-primary hover:underline font-medium" href="#">
                    <span className="material-symbols-outlined text-xl">mail</span>
                    contact@sisma.pro
                  </a>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button 
                  onClick={() => setLocation("/")}
                  className="flex-1 sm:flex-none px-8 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Retour à l'accueil
                </button>
                <button 
                  onClick={() => setLocation("/login")}
                  className="flex-1 sm:flex-none px-8 h-12 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity"
                >
                  Se connecter
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 px-6 text-center text-slate-400 text-sm">
        <p>© 2024 SISMA Pro. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
