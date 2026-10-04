import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { BookOpen, Plus, Search, Edit2, CheckCircle, Clock, Layers, Users } from 'lucide-react';

export const AdminCoursesView: React.FC = () => {
  const { token } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    durationWeeks: 16,
    level: 'Intermediate',
    syllabus: 'Unit 1: Fundamentals\nUnit 2: Architecture\nUnit 3: Production Deployment',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/courses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setCourses(d.courses || []);
      }





    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [token]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const d = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Course ${formData.code} created successfully.` });
        setIsAddModalOpen(false);
        setFormData({
          code: '',
          title: '',
          description: '',
          durationWeeks: 16,
          level: 'Intermediate',
          syllabus: '',
        });
        fetchCourses();
      } else {
        setMessage({ type: 'error', text: d.error || 'Failed to create course' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#263238] tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-[#527564]" />
            <span>Course Catalog & Curriculum</span>
          </h1>
          <p className="text-xs text-[#687477]">
            Define academic syllabus, duration, credit structures, and cohort cohorts.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white text-xs font-bold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Academic Course</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between ${
          message.type === 'success' ? 'bg-[#EBF2ED] text-[#527564]' : 'bg-red-50 text-red-700'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Grid of Courses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-[#687477] text-xs font-semibold">
            Loading course catalog...
          </div>
        ) : courses.map((c) => (
          <div key={c.id} className="rounded-3xl bg-white border border-[#DDD5F2] p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#FAF7F0] border border-[#DDD5F2] font-mono font-bold text-xs text-[#527564]">
                  {c.code}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F4F1FB] text-[#7b69b8] text-[10px] font-bold">
                  {c.level}
                </span>
              </div>
              <h2 className="text-base font-bold text-[#263238]">{c.title}</h2>
              <p className="text-xs text-[#687477] line-clamp-3 leading-relaxed">{c.description || 'No description provided.'}</p>
            </div>

            <div className="pt-3 border-t border-[#DDD5F2]/60 flex items-center justify-between text-xs text-[#687477]">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{c.durationWeeks} Weeks</span>
              </div>
              <div className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>{c.batchCount} Batches</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{c.studentCount} Students</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Course */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl border border-[#DDD5F2] p-6 sm:p-8 space-y-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#263238]">Add New Course Module</h2>
            <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Course Code *</label>
                  <input
                    required
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. CS-401"
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] uppercase font-mono focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Duration (Weeks)</label>
                  <input
                    type="number"
                    value={formData.durationWeeks}
                    onChange={(e) => setFormData({ ...formData, durationWeeks: parseInt(e.target.value, 10) })}
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#263238] mb-1">Course Title *</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Advanced Cloud Computing & Microservices"
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#263238] mb-1">Course Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of syllabus and learning outcomes..."
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#263238] mb-1">Academic Syllabus Outline</label>
                <textarea
                  rows={3}
                  value={formData.syllabus}
                  onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
                  placeholder="Week 1: Foundations..."
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] font-mono focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DDD5F2] text-[#687477] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white font-bold cursor-pointer"
                >
                  Save Course to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
