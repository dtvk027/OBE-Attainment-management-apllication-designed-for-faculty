import { getSession } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutGrid, GraduationCap, LogOut, ArrowLeft, ShieldCheck } from 'lucide-react';
import { logout } from '@/app/actions/auth';

export default async function AdminLayout({ children }) {
  const session = await getSession();

  if (!session || session.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Top Navigation */}
      <nav className="bg-zinc-900 text-white border-b border-zinc-800 sticky top-0 z-50 px-8 py-4 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-3 group transition-all">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white border border-white/10 shadow-xl group-hover:scale-110 transition-transform">
               <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-white uppercase leading-none mb-1">OBE Admin</h2>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Management Cloud</span>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end border-r border-white/10 pr-6 mr-2 hidden sm:flex">
            <span className="text-xs font-black text-white leading-none mb-1.5">{session.name}</span>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 leading-none">System Admin</span>
            </div>
          </div>
          
          <form action={logout}>
            <button type="submit" className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20 active:scale-95 group" title="Secure Logout">
              <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-12">
        {children}
      </main>
    </div>
  );
}
