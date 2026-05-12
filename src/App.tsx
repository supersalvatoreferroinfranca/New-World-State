/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Header from './components/layout/Header';
import RegisterForm from './components/auth/RegisterForm';
import DbStatus from './components/debug/DbStatus';
import { I18nProvider } from './contexts/I18nContext';

export default function App() {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-brand-parchment font-sans text-brand-blue selection:bg-brand-gold selection:text-brand-blue">
        <Header />
        
        <main className="pt-20 px-4">
          <div className="max-w-7xl mx-auto py-12">
            <div className="text-center space-y-4 mb-12">
              <h1 className="text-5xl md:text-7xl font-serif text-brand-blue tracking-tight">
                Citizenship <span className="italic text-brand-gold">of the World</span>
              </h1>
              <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto font-light">
                Join a global community dedicated to peace, justice, and the advancement of humanity.
              </p>
            </div>
            
            <RegisterForm />
          </div>
        </main>

        <footer className="py-12 border-t border-brand-blue/10 text-center text-sm text-muted">
          <div className="mb-6 flex justify-center">
            <DbStatus />
          </div>
          <p>© 2025 New World State Authority. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4 uppercase tracking-[0.2em] text-[10px]">
            <a href="#" className="hover:text-brand-gold transition-colors">Constitution</a>
            <a href="#" className="hover:text-brand-gold transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-brand-gold transition-colors">Contact</a>
          </div>
        </footer>
      </div>
    </I18nProvider>
  );
}
