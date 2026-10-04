import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { CreditCard, Plus, Search, CheckCircle, Clock, AlertTriangle, Download, Receipt } from 'lucide-react';

export const AdminPaymentsView: React.FC = () => {
  const { token } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCollected: 0, totalPending: 0, totalOverdue: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalCount: 0 });

  // Modal: Create Voucher
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    studentId: '',
    courseId: '',
    month: 'October 2026',
    amount: 5000,
    type: 'Tuition Fee',
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      let url = `/api/admin/payments?query=${encodeURIComponent(query)}&page=${page}&limit=10`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        setPayments(d.payments || []);
        setStats(d.stats || { totalCollected: 0, totalPending: 0, totalOverdue: 0 });
        setPagination(d.pagination || { totalPages: 1, totalCount: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        fetch('/api/admin/courses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/students?limit=100', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (cRes.ok) {
        const cData = await cRes.json();
        setCourses(cData.courses || []);
        if (cData.courses?.length > 0) setFormData(f => ({ ...f, courseId: cData.courses[0].id }));
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        setStudents(sData.students || []);
        if (sData.students?.length > 0) setFormData(f => ({ ...f, studentId: sData.students[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [token, query, statusFilter, page]);

  useEffect(() => {
    fetchDependencies();
  }, [token]);

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const d = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Voucher ${d.payment.voucherId} issued successfully.` });
        setIsVoucherModalOpen(false);
        fetchPayments();
      } else {
        setMessage({ type: 'error', text: d.error || 'Failed to issue voucher' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleMarkPaid = async (paymentId: number) => {
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'PAID' }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Fee payment receipt verified and recorded.' });
        fetchPayments();
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
            <CreditCard className="w-7 h-7 text-[#527564]" />
            <span>Student Fee & Payment Management</span>
          </h1>
          <p className="text-xs text-[#687477]">
            Voucher generation, bank receipt verification, outstanding dues, and cashbook audits.
          </p>
        </div>

        <button
          onClick={() => setIsVoucherModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white text-xs font-bold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Fee Voucher</span>
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

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#DDD5F2] shadow-xs">
          <span className="text-xs font-bold text-[#687477] uppercase tracking-wider block mb-1">Total Fee Collected</span>
          <div className="text-3xl font-black text-[#527564]">PKR {stats.totalCollected.toLocaleString()}</div>
          <span className="text-[11px] text-[#527564] font-semibold mt-1 block">Verified bank & cash receipts</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#DDD5F2] shadow-xs">
          <span className="text-xs font-bold text-[#687477] uppercase tracking-wider block mb-1">Outstanding Receivables</span>
          <div className="text-3xl font-black text-amber-700">PKR {stats.totalPending.toLocaleString()}</div>
          <span className="text-[11px] text-amber-700 font-semibold mt-1 block">Awaiting payment verification</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#DDD5F2] shadow-xs">
          <span className="text-xs font-bold text-[#687477] uppercase tracking-wider block mb-1">Overdue Arrears</span>
          <div className="text-3xl font-black text-red-700">PKR {stats.totalOverdue.toLocaleString()}</div>
          <span className="text-[11px] text-red-700 font-semibold mt-1 block">Past deadline threshold</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-3xl bg-white border border-[#DDD5F2] p-5 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#687477] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by voucher ID, student or receipt..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#8FAF9A]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-[#DDD5F2] text-xs font-semibold bg-white outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="OVERDUE">OVERDUE</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-white border border-[#DDD5F2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F0] border-b border-[#DDD5F2] text-[#687477] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Voucher No</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Course Module</th>
                <th className="py-3.5 px-4">Billing Month</th>
                <th className="py-3.5 px-4">Amount (PKR)</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD5F2]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#687477]">Loading fee vouchers...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#687477]">No payment records found.</td>
                </tr>
              ) : payments.map((p) => (
                <tr key={p.id} className="hover:bg-[#FAF7F0]/60 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#527564]">{p.voucherId}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[#263238]">{p.studentName}</div>
                    <div className="text-[11px] text-[#687477] font-mono">{p.studentCode} &bull; {p.rollNumber}</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#263238]">{p.courseTitle}</td>
                  <td className="py-3.5 px-4 text-[#687477]">{p.month}</td>
                  <td className="py-3.5 px-4 font-bold text-[#263238]">PKR {p.amount.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-[#687477]">{p.dueDate}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'PAID'
                        ? 'bg-[#EBF2ED] text-[#527564]'
                        : p.status === 'OVERDUE'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {p.status !== 'PAID' ? (
                      <button
                        onClick={() => handleMarkPaid(p.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#527564] hover:bg-[#3f5a4d] text-white text-xs font-bold cursor-pointer transition shadow-xs"
                      >
                        Record Payment
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#527564] font-semibold flex items-center justify-end gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Rec: {p.receiptNumber}</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-[#DDD5F2] flex items-center justify-between text-xs text-[#687477]">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-[#DDD5F2] disabled:opacity-40 font-semibold cursor-pointer"
          >
            &larr; Previous
          </button>
          <span>Page {page} of {pagination.totalPages || 1}</span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-[#DDD5F2] disabled:opacity-40 font-semibold cursor-pointer"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      {/* Modal: Generate Voucher */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl border border-[#DDD5F2] p-6 sm:p-8 space-y-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#263238]">Issue Student Fee Voucher</h2>
            <form onSubmit={handleCreateVoucher} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#263238] mb-1">Target Student *</label>
                <select
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] bg-white focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.studentId} &bull; Roll: {s.rollNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#263238] mb-1">Course Module *</label>
                <select
                  required
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] bg-white focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Billing Month</label>
                  <input
                    type="text"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Amount (PKR) *</label>
                  <input
                    required
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value, 10) })}
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] font-bold focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Fee Classification</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] bg-white focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  >
                    <option value="Tuition Fee">Tuition Fee</option>
                    <option value="Exam Fee">Exam Fee</option>
                    <option value="Lab Charges">Lab Charges</option>
                    <option value="Admission Fee">Admission Fee</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#263238] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DDD5F2] text-[#687477] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white font-bold cursor-pointer"
                >
                  Confirm & Issue Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
