"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Edit2, Check, X, ShieldAlert, 
  LogOut, AlertCircle, Loader2, User 
} from "lucide-react";

export default function AdminDashboard() {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");

  // --- Data State ---
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // --- Edit State ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", midterm: 0, final: 0 });
  const [isSaving, setIsSaving] = useState(false);

  const ADMIN_PASSCODE = process.env.ADMIN_PASSWORD;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect passcode");
    }
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("grades")
      .select("*")
      .order("name", { ascending: true });

    if (!error && data) setStudents(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) fetchStudents();
  }, [isAuthenticated]);

  const handleEditClick = (student: any) => {
    setEditingId(student.student_id);
    setEditForm({
      name: student.name,
      midterm: student.midterm,
      final: student.final,
    });
  };

  const handleSave = async (student_id: string) => {
    setIsSaving(true);
    const { error } = await supabase
      .from("grades")
      .update({
        name: editForm.name,
        midterm: Number(editForm.midterm),
        final: Number(editForm.final),
      })
      .eq("student_id", student_id);

    setIsSaving(false);

    if (error) {
      alert("Failed to update: " + error.message);
    } else {
      setEditingId(null);
      fetchStudents(); // Refresh the data
    }
  };

  const computeAverage = (mid: number, fin: number) => {
    if (mid === 0 && fin === 0) return 0;
    return ((Number(mid) + Number(fin)) / 2).toFixed(2);
  };

  // Filter students based on search query
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-900/5 text-center"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-6">Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Enter admin passcode"
              className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
            {authError && <p className="text-sm text-red-600">{authError}</p>}
            <button
              type="submit"
              className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-all active:scale-[0.98]"
            >
              Unlock Dashboard
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // --- MAIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-6 md:p-10 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-6xl rounded-2xl bg-white shadow-xl ring-1 ring-gray-900/5 overflow-hidden"
      >
        {/* Header */}
        <div className="border-b border-gray-100 bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Manage student records and grades</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search ID or Name..."
                className="block w-64 rounded-lg border-0 py-2 pl-9 pr-4 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsAuthenticated(false)}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Lock
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto p-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-900 uppercase tracking-wider text-xs border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-semibold rounded-tl-lg">Student ID</th>
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold text-center">Midterm</th>
                  <th className="py-3 px-4 font-semibold text-center">Final</th>
                  <th className="py-3 px-4 font-semibold text-right rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No students found matching your search.
                      </td>
                    </tr>
                  )}
                  {filteredStudents.map((s) => {
                    const isEditing = editingId === s.student_id;
                    return (
                      <motion.tr 
                        key={s.student_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="py-3 px-4 font-medium text-gray-900">{s.student_id}</td>
                        
                        {/* NAME */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <input 
                              className="w-full rounded border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              value={editForm.name}
                              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              {s.name}
                            </div>
                          )}
                        </td>

                        {/* MIDTERM */}
                        <td className="py-3 px-4 text-center">
                          {isEditing ? (
                            <input 
                              type="number" step="0.01"
                              className="w-20 rounded border-gray-300 px-2 py-1 text-sm shadow-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              value={editForm.midterm}
                              onChange={(e) => setEditForm({...editForm, midterm: Number(e.target.value)})}
                            />
                          ) : (
                            <span className={s.midterm > 3.0 ? "text-red-600 font-semibold" : s.midterm > 0 ? "text-green-600 font-semibold" : ""}>
                              {s.midterm === 0 ? "NG" : s.midterm.toFixed(2)}
                            </span>
                          )}
                        </td>

                        {/* FINAL */}
                        <td className="py-3 px-4 text-center">
                          {isEditing ? (
                            <input 
                              type="number" step="0.01"
                              className="w-20 rounded border-gray-300 px-2 py-1 text-sm shadow-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              value={editForm.final}
                              onChange={(e) => setEditForm({...editForm, final: Number(e.target.value)})}
                            />
                          ) : (
                            <span className={s.final > 3.0 ? "text-red-600 font-semibold" : s.final > 0 ? "text-green-600 font-semibold" : ""}>
                              {s.final === 0 ? "NG" : s.final.toFixed(2)}
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3 px-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleSave(s.student_id)}
                                disabled={isSaving}
                                className="rounded bg-green-100 p-1.5 text-green-700 hover:bg-green-200 transition-colors"
                              >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              </button>
                              <button 
                                onClick={() => setEditingId(null)}
                                disabled={isSaving}
                                className="rounded bg-red-100 p-1.5 text-red-700 hover:bg-red-200 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleEditClick(s)}
                              className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
}