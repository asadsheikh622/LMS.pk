import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { HelpCircle, Plus, BookOpen, Clock, Calendar, CheckCircle, Award, Layers } from 'lucide-react';

export const TeacherQuizzesView: React.FC = () => {
  const { token } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [selectedPair, setSelectedPair] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalMarks, setTotalMarks] = useState(50);
  const [passingMarks, setPassingMarks] = useState(25);
  const [durationMinutes, setDurationMinutes] = useState(30);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchQuizzes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/teacher/quizzes', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        setQuizzes(d.quizzes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const res = await fetch('/api/teacher/courses', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        const cList = d.courses || [];
        setCoursesList(cList);
        if (cList.length > 0) {
          setSelectedPair(`${cList[0].courseId}-${cList[0].batchId}`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    fetchDependencies();
  }, [token]);

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    const [courseIdStr, batchIdStr] = selectedPair.split('-');
    if (!courseIdStr || !batchIdStr) return;

    try {
      const res = await fetch('/api/teacher/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: parseInt(courseIdStr, 10),
          batchId: parseInt(batchIdStr, 10),
          title,
          description,
          totalMarks,
          passingMarks,
          durationMinutes,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Evaluation quiz published and scheduled for students.' });
        setIsAddModalOpen(false);
        setTitle('');
        setDescription('');
        fetchQuizzes();
      } else {
        setMessage({ type: 'error', text: d.error || 'Failed to create quiz' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#263238] tracking-tight flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-[#527564]" />
            <span>Course Quizzes & Assessments</span>
          </h2>
          <p className="text-xs text-[#687477]">
            Schedule timed assessments, configure MCQ/subjective questions, and review cohort submissions.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white text-xs font-bold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Timed Quiz</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between ${
          message.type === 'success' ? 'bg-[#EBF2ED] text-[#527564]' : 'bg-red-50 text-red-700'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-[#687477]">Loading quizzes...</div>
        ) : quizzes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[#687477]">
            No timed quizzes created yet. Click "Create Timed Quiz" to publish an assessment.
          </div>
        ) : quizzes.map((q) => (
          <div key={q.id} className="rounded-3xl bg-white border border-[#DDD5F2] p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-[#FAF7F0] border border-[#DDD5F2] font-mono text-[10px] font-bold text-[#527564]">
                  {q.courseCode}
                </span>
                <span className="text-[11px] font-semibold text-[#687477]">
                  {q.durationMinutes} Minutes
                </span>
              </div>
              <h3 className="font-bold text-[#263238] text-base">{q.title}</h3>
              <p className="text-xs text-[#687477] line-clamp-2">{q.description || 'General course assessment'}</p>
              <div className="flex items-center gap-2 text-xs text-[#687477]">
                <Layers className="w-3.5 h-3.5 text-[#527564]" />
                <span>{q.batchNumber}</span>
                <span>&bull;</span>
                <span>Passing: <strong>{q.passingMarks} / {q.totalMarks}</strong></span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DDD5F2]/60 flex items-center justify-between text-xs text-[#687477]">
              <span>Attempts: <strong>{q.attemptsCount || 0}</strong> ({q.passedCount || 0} Passed)</span>
              <span className="font-semibold text-[#527564]">Active Status</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create Quiz */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl border border-[#DDD5F2] p-6 sm:p-8 space-y-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#263238]">Create Assessment Quiz</h2>
            <form onSubmit={handleCreateQuiz} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#263238] mb-1">Course & Cohort Batch *</label>
                <select
                  required
                  value={selectedPair}
                  onChange={(e) => setSelectedPair(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] bg-white focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                >
                  <option value="">-- Choose Module & Batch --</option>
                  {coursesList.map((c) => (
                    <option key={c.assignmentId} value={`${c.courseId}-${c.batchId}`}>
                      {c.courseCode} &bull; {c.batchNumber} - {c.courseTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#263238] mb-1">Quiz Title *</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Assessment: Container Networking and Kubernetes Basics"
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#263238] mb-1">Quiz Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief guidance for students..."
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Total Marks *</label>
                  <input
                    required
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Passing Marks *</label>
                  <input
                    required
                    type="number"
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Duration (Mins) *</label>
                  <input
                    required
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
                </div>
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
                  Schedule Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
