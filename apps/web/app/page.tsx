"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, FileText, Award, AlertCircle, Loader2 } from "lucide-react";

export default function Home() {
  const [studentId, setStudentId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = async () => {
    // 1. Sanitize input (Allow only alphanumeric characters and dashes, remove spaces)
    const sanitizedId = studentId.replace(/[^a-zA-Z0-9-]/g, "").trim();

    if (!sanitizedId) {
      setErrorMsg("Please enter a valid Student ID.");
      setResult(null);
      return;
    }

    // 2. Prevent spamming the API
    setIsLoading(true);
    setErrorMsg("");
    setResult(null);

    // 3. Supabase uses parameterized queries, making this safe from SQL injection
    const { data, error } = await supabase
      .from("grades")
      .select("*")
      .eq("student_id", sanitizedId)
      .single();

    if (error) {
      setErrorMsg("No record found for this ID.");
      setResult(null);
    } else {
      setResult(data);
    }

    setIsLoading(false);
  };

  // Helper to format grade colors dynamically
  const getGradeColor = (grade: number) => {
    if (grade > 3.0) return "text-red-600 bg-red-50 border-red-200";
    if (grade > 0) return "text-green-600 bg-green-50 border-green-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 md:p-8 shadow-xl ring-1 ring-gray-900/5"
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Student Portal</h1>
          <p className="mt-2 text-sm text-gray-500">View your midterm and final grades</p>
        </div>

        <div className="space-y-4">
          {/* Search Input Area */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-xl border-0 py-3 pl-10 pr-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all"
              placeholder="Enter Student ID (e.g. 23102648)"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={isLoading || !studentId.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search Grades"}
          </button>
        </div>

        {/* Animated Results & Errors */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              key="error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-inset ring-red-600/20 overflow-hidden"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{errorMsg}</p>
            </motion.div>
          )}

          {result && !isLoading && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-8 space-y-4"
            >
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</p>
                  <p className="text-lg font-semibold text-gray-900">{result.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Midterm Card */}
                <div className={`flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-colors ${getGradeColor(result.midterm)}`}>
                  <FileText className="mb-2 h-6 w-6 opacity-80" />
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Midterm</p>
                  <p className="mt-1 text-2xl font-bold">
                    {result.midterm === 0 ? "NG" : result.midterm.toFixed(2)}
                  </p>
                </div>

                {/* Final Card */}
                <div className={`flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-colors ${getGradeColor(result.final)}`}>
                  <Award className="mb-2 h-6 w-6 opacity-80" />
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Final</p>
                  <p className="mt-1 text-2xl font-bold">
                    {result.final === 0 ? "NG" : result.final.toFixed(2)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}