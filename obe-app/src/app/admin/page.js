import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, BookOpen, Layout, ArrowRight, UserPlus, FilePlus, ShieldCheck, GraduationCap } from 'lucide-react';

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  const [userCount, globalSubjectCount, templateCount, latestSubjects] = await Promise.all([
    db.user.count({ where: { role: 'faculty' } }),
    db.globalSubject.count(),
    db.template.count(),
    db.subject.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { 
        faculty: { select: { name: true } },
        semester: { include: { academicYear: true } }
      }
    })
  ]);

  return (
    <div className="fade-in pb-12">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <ShieldCheck size={18} className="text-indigo-600" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Administrative Portal</span>
          </div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter mb-2 italic">Welcome, {session.name}</h1>
          <p className="text-sm text-zinc-500 font-medium">System-wide oversight of institutional academic performance and faculty workload.</p>
        </div>
      </header>
      
      {/* Primary Blocks */}
      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-10 mb-12">
        {/* Block: View/Add Subjects */}
        <div className="group bg-white p-10 rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-100/50 hover:border-zinc-900 transition-all flex flex-col items-start relative overflow-hidden">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-8 group-hover:bg-zinc-900 group-hover:text-white transition-all">
            <BookOpen size={32} />
          </div>
          <h3 className="text-2xl font-black text-zinc-900 mb-2 tracking-tight">View & Add Subjects</h3>
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-8">Management of Global Catalog: {globalSubjectCount}</p>
          <div className="flex flex-col gap-3 w-full mt-auto">
            <Link href="/admin/subjects" className="w-full py-4 bg-zinc-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-800 shadow-lg active:scale-95 transition-all">
              Manage Repository <ArrowRight size={18} />
            </Link>
          </div>
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-tighter">Database Hub</div>
          </div>
        </div>

        {/* Block: View Registered Faculty */}
        <div className="group bg-white p-10 rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-100/50 hover:border-zinc-900 transition-all flex flex-col items-start relative overflow-hidden">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-8 group-hover:bg-zinc-900 group-hover:text-white transition-all">
            <Users size={32} />
          </div>
          <h3 className="text-2xl font-black text-zinc-900 mb-2 tracking-tight">View Registered Faculty</h3>
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-8">Registered Faculty: {userCount}</p>
          <div className="flex flex-col gap-3 w-full mt-auto">
            <Link href="/admin/users" className="w-full py-4 bg-zinc-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-800 shadow-lg active:scale-95 transition-all">
              View All Faculty <ArrowRight size={18} />
            </Link>
          </div>
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-tighter">Staff Oversight</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Recent Workload Activity */}
        <div className="lg:col-span-8 bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-100/50">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Recent Assignments</h3>
              <p className="text-[11px] text-zinc-400 font-medium">Currently active faculty sections and tables.</p>
            </div>
            <Link href="/admin/users" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">View Oversight Directory &rarr;</Link>
          </div>

          <div className="space-y-4">
            {latestSubjects.map(sub => (
              <div key={sub.id} className="p-5 flex items-center justify-between bg-zinc-50 border border-zinc-100 rounded-2xl hover:border-zinc-900 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-zinc-200 text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 transition-all tabular-nums font-black text-xs">
                    {sub.code[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-zinc-900 uppercase leading-none mb-1">{sub.code}: {sub.name}</h4>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                      Managed by <span className="text-zinc-900">{sub.faculty.name}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-900 uppercase tracking-tighter mb-0.5">{sub.semester.academicYear.label}</p>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none">Sem {sub.semester.number} • Sec {sub.section}</p>
                </div>
              </div>
            ))}
            {latestSubjects.length === 0 && (
              <div className="py-12 text-center text-zinc-400 italic font-medium opacity-50">No academic sections initialized yet.</div>
            )}
          </div>
        </div>

        {/* Quick Administration */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900 p-8 rounded-3xl text-white shadow-2xl shadow-zinc-200">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/admin/users" className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <UserPlus size={16} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Add Faculty</span>
              </Link>
              <Link href="/admin/subjects" className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <FilePlus size={16} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Register Subject</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
