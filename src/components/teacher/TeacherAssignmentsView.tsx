import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  FileSpreadsheet, Plus, BookOpen, Clock, Calendar, CheckCircle,
  FileText, Award, Layers, Check
} from 'lucide-react';

export const TeacherAssignmentsView: React.FC = () => {
  const { token } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);

  // Create Assignment state
  const [selectedPair, setSelectedPair] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalMarks, setTotalMarks] = useState(100);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/teacher/assignments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setAssignments(d.assignments || []);
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
    fetchAssignments();
    fetchDependencies();
  }, [token]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const [courseIdStr, batchIdStr] = selectedPair.split('-');
    if (!courseIdStr || !batchIdStr) return;

    try {
      const res = await fetch('/api/teacher/assignments', {
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
          dueDate,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Assignment task published to students.' });
        setIsAddModalOpen(false);
        setTitle('');
        setDescription('');
        fetchAssignments();
      } else {
        setMessage({ type: 'error', text: d.error || 'Failed to create assignment' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const openGradebook = async (assignment: any) => {
    setSelectedAssignment(assignment);
    setIsGradeModalOpen(true);
    try {
      const res = await fetch(`/api/teacher/assignments/${assignment.id}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setSubmissions(d.submissions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGradeSubmission = async (studentId: number, marks: number, feedback: string) => {
    if (!selectedAssignment) return;
    try {
      const res = await fetch(`/api/teacher/assignments/${selectedAssignment.id}/submissions/${studentId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ marks, feedback }),
      });
      if (res.ok) {
        openGradebook(selectedAssignment);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#263238] tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#527564]" />
            <span>Course Assignments & Submissions</span>
          </h2>
          <p className="text-xs text-[#687477]">
            Post problem sets, review student project submissions, and assign official marks.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white text-xs font-bold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Assignment</span>
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

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-[#687477]">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[#687477]">
            No coursework assignments created yet. Click "Post New Assignment" to get started.
          </div>
        ) : assignments.map((a) => (
          <div key={a.id} className="rounded-3xl bg-white border border-[#DDD5F2] p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-[#FAF7F0] border border-[#DDD5F2] font-mono text-[10px] font-bold text-[#527564]">
                  {a.courseCode}
                </span>
                <span className="text-[11px] font-semibold text-[#687477]">
                  Due: {new Date(a.dueDate).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-bold text-[#263238] text-base">{a.title}</h3>
              <p className="text-xs text-[#687477] line-clamp-2">{a.description}</p>
              <div className="flex items-center gap-2 text-xs text-[#687477]">
                <Layers className="w-3.5 h-3.5 text-[#527564]" />
                <span>{a.batchNumber}</span>
                <span>&bull;</span>
                <span>Total Marks: <strong>{a.totalMarks}</strong></span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DDD5F2]/60 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#527564]">
                {a.totalSubmissions} Submissions ({a.gradedCount} Graded)
              </span>
              <button
                onClick={() => openGradebook(a)}
                className="px-3 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#DDD5F2] text-[#527564] hover:bg-[#8FAF9A]/20 text-xs font-bold cursor-pointer"
              >
                Open Gradebook &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create Assignment */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl border border-[#DDD5F2] p-6 sm:p-8 space-y-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#263238]">Post New Course Assignment</h2>
            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
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
                <label className="block font-bold text-[#263238] mb-1">Assignment Title *</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lab 03: Containerized Microservices in Docker"
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#263238] mb-1">Task Instructions & Requirements *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed instructions for students..."
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block font-bold text-[#263238] mb-1">Submission Due Date *</label>
                  <input
                    required
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
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
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Gradebook */}
      {isGradeModalOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-3xl border border-[#DDD5F2] p-6 sm:p-8 space-y-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#263238]">Assignment Gradebook</h2>
                <p className="text-xs text-[#687477]">{selectedAssignment.title} &bull; Total: {selectedAssignment.totalMarks} Marks</p>
              </div>
              <button
                onClick={() => setIsGradeModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[#DDD5F2] text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {submissions.length === 0 ? (
                <div className="py-8 text-center text-[#687477]">
                  No student enrollments found for this cohort.
                </div>
              ) : submissions.map((sub) => (
                <div key={sub.studentId} className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#DDD5F2] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#263238] block">{sub.fullName}</span>
                      <span className="text-[11px] font-mono text-[#687477]">Roll: {sub.rollNumber}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      sub.status === 'GRADED' ? 'bg-[#EBF2ED] text-[#527564]' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {sub.status}
                    </span>
                  </div>

                  {sub.content && (
                    <p className="text-xs text-[#263238] bg-white p-3 rounded-xl border border-[#DDD5F2]">
                      {sub.content}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block font-bold text-[#263238] mb-1">Awarded Marks (out of {selectedAssignment.totalMarks})</label>
                      <input
                        type="number"
                        defaultValue={sub.obtainedMarks !== null ? sub.obtainedMarks : ''}
                        id={`marks-${sub.studentId}`}
                        className="w-full p-2 rounded-lg border border-[#DDD5F2] bg-white focus:ring-1 focus:ring-[#8FAF9A] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#263238] mb-1">Faculty Feedback</label>
                      <input
                        type="text"
                        defaultValue={sub.teacherFeedback || ''}
                        id={`feedback-${sub.studentId}`}
                        placeholder="e.g. Well executed solution."
                        className="w-full p-2 rounded-lg border border-[#DDD5F2] bg-white focus:ring-1 focus:ring-[#8FAF9A] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        const marks = parseInt((document.getElementById(`marks-${sub.studentId}`) as HTMLInputElement)?.value || '0', 10);
                        const fb = (document.getElementById(`feedback-${sub.studentId}`) as HTMLInputElement)?.value || '';
                        handleGradeSubmission(sub.studentId, marks, fb);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-[#527564] hover:bg-[#3f5a4d] text-white font-bold cursor-pointer transition shadow-xs"
                    >
                      Save Grade
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
