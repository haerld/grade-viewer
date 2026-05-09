"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet } from "lucide-react";

export default function UploadPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clears the file input
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFeedback(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet);

      // 1. Filter out empty rows, gracefully handling the "ID " vs "ID" issue
      const validRows = json.filter((row) => {
        const id = row["ID"] !== undefined ? row["ID"] : row["ID "];
        return id !== undefined && String(id).trim() !== "";
      });

      // 2. Format the valid rows and round grades to 2 decimal places
      const formatted = validRows.map((row) => {
        const id = row["ID"] !== undefined ? row["ID"] : row["ID "];
        
        const midtermGrade = Number((Number(row["MG"]) || 0).toFixed(2));
        const finalGrade = Number((Number(row["FG"]) || 0).toFixed(2));

        return {
          student_id: String(id).trim(),
          name: row["NAME"] || "Unknown", 
          midterm: midtermGrade,
          final: finalGrade,
        };
      });

      if (formatted.length === 0) {
        setFeedback({ type: "error", message: "No valid data found in the Excel file." });
        resetFileInput();
        setIsLoading(false);
        return;
      }

      // 3. Upload to Supabase
      const { error } = await supabase
        .from("grades")
        .upsert(formatted, { onConflict: "student_id" });

      if (error) {
        console.error(error);
        setFeedback({ type: "error", message: "Upload failed: " + error.message });
      } else {
        setFeedback({ type: "success", message: `Successfully uploaded ${formatted.length} student records!` });
      }

    } catch (err: any) {
      console.error(err);
      setFeedback({ type: "error", message: "Error parsing file. Please ensure it is a valid Excel format." });
    } finally {
      resetFileInput(); // Always clear the input when done, regardless of success/fail
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 md:p-8 shadow-xl ring-1 ring-gray-900/5"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Upload Grades</h1>
          <p className="mt-2 text-sm text-gray-500">Select an Excel (.xlsx, .xls) file to update the database.</p>
        </div>

        <div className="space-y-4">
          {/* Drag & Drop style file input */}
          <label 
            className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors
              ${isLoading ? "bg-gray-50 border-gray-200 opacity-70 cursor-not-allowed" : "border-gray-300 hover:bg-blue-50 hover:border-blue-400 bg-gray-50"}
            `}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isLoading ? (
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-3" />
              ) : (
                <UploadCloud className="h-10 w-10 text-gray-400 mb-3" />
              )}
              <p className="mb-2 text-sm text-gray-500 font-semibold">
                {isLoading ? "Processing file..." : "Click to select file"}
              </p>
              <p className="text-xs text-gray-400">XLSX, XLS, or CSV</p>
            </div>
            
            <input 
              type="file" 
              className="hidden" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleUpload} 
              ref={fileInputRef}
              disabled={isLoading}
            />
          </label>
        </div>

        {/* Animated Feedback Messages */}
        <AnimatePresence mode="wait">
          {feedback && (
            <motion.div
              key={feedback.type}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-6 flex items-center gap-3 rounded-xl p-4 text-sm ring-1 ring-inset overflow-hidden ${
                feedback.type === "success" 
                  ? "bg-green-50 text-green-700 ring-green-600/20" 
                  : "bg-red-50 text-red-700 ring-red-600/20"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
              )}
              <p>{feedback.message}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}