import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SubjectSelector from '@/components/SubjectSelector';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Book, GraduationCap, LogOut, LayoutGrid, Users, Settings, ArrowRight } from 'lucide-react';
import { logout } from '@/app/actions/auth';

export default async function DashboardPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const isAdmin = session.role === 'admin';
  
  if (isAdmin) {
    redirect('/admin');
  }
  
  const subjects = await db.subject.findMany({
    where: isAdmin ? {} : { facultyId: session.id },
    include: { 
      semester: { include: { academicYear: true } },
      faculty: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Grouping for Admin View
  const groupedSubjects = isAdmin 
    ? subjects.reduce((acc, sub) => {
        const facultyName = sub.faculty?.name || 'Unknown Faculty';
        if (!acc[facultyName]) acc[facultyName] = [];
        acc[facultyName].push(sub);
        return acc;
      }, {})
    : null;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Top Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-50 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-zinc-900 rounded-lg flex items-center justify-center text-white shadow-lg shadow-zinc-200">
            <GraduationCap size={20} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-tight text-zinc-900 uppercase">OBE Portal</h1>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Internal View</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end border-r border-zinc-200 pr-4 mr-2">
            <span className="text-xs font-bold text-zinc-900 leading-tight">{session.name}</span>
            <span className={`text-[10px] font-black uppercase tracking-tighter leading-none px-1.5 py-0.5 rounded ${isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-zinc-100 text-zinc-500'}`}>
              {session.role}
            </span>
          </div>
          <form action={logout}>
            <button type="submit" className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 fade-in">
        <header className="mb-10">
          <h2 className="text-3xl font-black tracking-tighter text-zinc-900 mb-1">
            {isAdmin ? 'Management Repository' : 'Faculty Dashboard'}
          </h2>
          <p className="text-sm text-zinc-500 font-medium">
            {isAdmin 
              ? 'Institutional oversight of all faculty subjects and attainment indices.' 
              : 'Manage your subjects and track attainment records.'}
          </p>
        </header>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Only for Faculty) */}
          {!isAdmin && (
            <div className="lg:col-span-4 space-y-6">
              <div className="card p-8 bg-white border-zinc-200 shadow-xl shadow-zinc-100/50">
                <div className="flex items-center gap-2 mb-6">
                  <LayoutGrid size={16} className="text-zinc-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Initialize Table</h3>
                </div>
                <SubjectSelector />
              </div>
            </div>
          )}

          {/* Right Column: Subjects */}
          <div className={`${isAdmin ? 'lg:col-span-12' : 'lg:col-span-8'}`}>
            {isAdmin ? (
              <div className="space-y-12">
                {Object.entries(groupedSubjects).map(([faculty, facultySubjects]) => (
                  <div key={faculty}>
                    <div className="flex items-center gap-3 mb-6 border-b border-zinc-100 pb-4">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-black text-xs uppercase">
                        {faculty[0]}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight">{faculty}</h3>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{facultySubjects.length} SUBJECTS</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {facultySubjects.map((sub) => <SubjectCard key={sub.id} sub={sub} />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-zinc-400" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-zinc-900">Active Subjects</h2>
                    <span className="bg-zinc-100 text-zinc-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-zinc-200">{subjects.length}</span>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  {subjects.map((sub) => <SubjectCard key={sub.id} sub={sub} />)}
                  {subjects.length === 0 && <EmptyState />}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SubjectCard({ sub }) {
  return (
    <Link href={`/subject/${sub.id}`} className="group">
      <div className="card p-6 border-zinc-200 h-full flex flex-col hover:border-zinc-900 hover:shadow-xl hover:shadow-zinc-100 active:scale-[0.98]">
        <div className="flex justify-between items-start mb-6">
          <span className="badge badge-indigo">{sub.code}</span>
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Section {sub.section}</span>
        </div>
        <h3 className="text-lg font-black tracking-tight text-zinc-900 mb-auto line-clamp-2 leading-tight">{sub.name}</h3>
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-zinc-50">
          <div className="flex items-center gap-3 text-[11px] font-bold text-zinc-400">
            <span className="flex items-center gap-1"><GraduationCap size={14} />{sub.semester?.academicYear?.label}</span>
            <span className="w-1 h-1 bg-zinc-200 rounded-full" />
            <span>Sem {sub.semester?.number}</span>
          </div>
          <ArrowRight size={14} className="text-zinc-300 group-hover:text-zinc-900 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="col-span-2 py-16 text-center border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
      <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
        <Book size={24} />
      </div>
      <h4 className="text-sm font-bold text-zinc-900 mb-1">No active subjects</h4>
      <p className="text-xs text-zinc-500">Initialize your first attainment table to get started.</p>
    </div>
  );
}
