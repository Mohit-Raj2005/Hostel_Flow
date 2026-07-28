"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { usePathname } from "next/navigation";
import { useStudents } from "../../../hooks/useStudents";
import { toast } from "react-toastify";

const url = process.env.NEXT_PUBLIC_BACKEND_URL;

const INITIAL_FORM_DATA = {
  chargeType: "",
  baseAmount: "",
  frequency: "ONE_TIME",
  interval: 1,
  dueDate: "",
  assignmentType: "ALL",
};

export default function AssignChargesModal({ open, onClose, onSuccess }) {
  const pathname = usePathname();
  const role = pathname.split("/")[1];

  // Form state
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // UI state
  const [chargeTypes, setChargeTypes] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Search State
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const limit = 10;

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);

    setSelectedStudentIds([]);
    setSearch("");
    setPage(1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const { students, loading } = useStudents({
    role,
    page,
    limit,
    search: debouncedSearch,
  });

  const toggleStudent = (studentId) => {
    setSelectedStudentIds((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      }

      return [...prev, studentId];
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "frequency" && value != "CUSTOM" ? { interval: 1 } : {}),
    }));
  };

  const fetchChargeTypes = async () => {
    try {
      const res = await axios.get(`${url}/api/v1/${role}/charge-types`, {
        withCredentials: true,
      });

      setChargeTypes(res.data);
    } catch (error) {
      console.error("Failed to fetch charge types:", error);
    }
  };

  const handleAssignCharges = async () => {
    try {
      // Validation
      if (!formData.chargeType) {
        return toast.error("Please select a charge type.");
      }

      if (!formData.baseAmount) {
        return toast.error("Please enter an amount.");
      }

      if (!formData.dueDate) {
        return toast.error("Please select a due date.");
      }

      if (
        formData.assignmentType === "SELECTED" &&
        selectedStudentIds.length === 0
      ) {
        return toast.error("Please select at least one student.");
      }

      if (formData.frequency === "CUSTOM" && Number(formData.interval) < 1) {
        return toast.error("Interval must be at least 1.");
      }
      setSubmitting(true);

      const defaultIntervals = {
        ONE_TIME: 1,
        MONTHLY: 12,
        QUARTERLY: 4,
        HALF_YEARLY:2,
        YEARLY: 1,
      };

      const interval =
        formData.frequency === "CUSTOM"
          ? Number(formData.interval)
          : defaultIntervals[formData.frequency];
      const payload = {
        chargeType: formData.chargeType,
        baseAmount: Number(formData.baseAmount),
        frequency: formData.frequency,
        interval,
        dueDate: formData.dueDate,
        assignmentType: formData.assignmentType,
        studentIds:
          formData.assignmentType === "SELECTED" ? selectedStudentIds : [],
      };

      await axios.post(`${url}/api/v1/${role}/assign-charges`, payload, {
        withCredentials: true,
      });
      toast.success("Charges assigned successfully.");

      onSuccess?.();

      handleClose();
    } catch (error) {
      console.error("Failed to assign charges:", error);

      toast.error(error?.response?.data?.msg || "Failed to assign charges.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchChargeTypes();
    }
  }, [open, role]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-[#0f172a] border-b border-white/10 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">Assign Charges</h2>
            <p className="text-gray-400 text-sm mt-1">
              Create a charge and assign it to all or selected students.
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Charge Type */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Charge Type
                </label>

                <select
                  name="chargeType"
                  value={formData.chargeType}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white outline-none"
                >
                  <option value="" className="bg-[#1e293b] text-white">
                    Select Charge Type
                  </option>

                  {chargeTypes.length === 0 ? (
                    <option disabled className="bg-[#1e293b] text-white">
                      Loading...
                    </option>
                  ) : (
                    chargeTypes.map((type) => (
                      <option
                        key={type.id}
                        value={type.name}
                        className="bg-[#0f172a] text-white"
                      >
                        {type.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Amount
                </label>

                <input
                  type="number"
                  name="baseAmount"
                  value={formData.baseAmount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white outline-none"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Frequency
                </label>

                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white outline-none"
                >
                  <option value="ONE_TIME" className="bg-[#1e293b] text-white">
                    One Time
                  </option>
                  <option value="MONTHLY" className="bg-[#1e293b] text-white">
                    Monthly
                  </option>
                  <option value="QUARTERLY" className="bg-[#1e293b] text-white">
                    Quarterly
                  </option>
                  <option value="HALF_YEARLY" className="bg-[#1e293b] text-white">
                    Half Yearly
                  </option>
                  <option value="YEARLY" className="bg-[#1e293b] text-white">
                    Yearly
                  </option>
                  <option value="CUSTOM" className="bg-[#1e293b] text-white">
                    Custom
                  </option>
                </select>
              </div>

              {formData.frequency === "CUSTOM" && (
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Interval
                  </label>

                  <input
                    type="number"
                    name="interval"
                    min="1"
                    value={formData.interval}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white outline-none"
                  />
                </div>
              )}

              {/* Due Date */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Due Date
                </label>

                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white outline-none"
                />
              </div>

              {/* Apply To */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Apply To
                </label>

                <div className="flex gap-6 mt-3">
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="radio"
                      name="assignmentType"
                      value="ALL"
                      checked={formData.assignmentType === "ALL"}
                      onChange={handleChange}
                    />
                    All Students
                  </label>

                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="radio"
                      name="assignmentType"
                      value="SELECTED"
                      checked={formData.assignmentType === "SELECTED"}
                      onChange={handleChange}
                    />
                    Selected Students
                  </label>
                </div>
              </div>
            </div>

            {/* Student Selection */}
            {formData.assignmentType === "SELECTED" && (
              <div className="border border-white/10 rounded-xl p-4 space-y-4">
                <h3 className="text-white font-semibold">Select Students</h3>

                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg bg-white/5 border border-white/10 p-3 text-white outline-none"
                />

                <div className="max-h-72 overflow-y-auto border border-white/10 rounded-lg">
                  {loading ? (
                    <p className="p-4 text-gray-400">Loading students...</p>
                  ) : students.length === 0 ? (
                    <p className="p-4 text-gray-400">No students found.</p>
                  ) : (
                    students.map((student) => (
                      <div
                        key={student.student.id}
                        onClick={() => toggleStudent(student.student.id)}
                        className={`cursor-pointer border-b border-white/10 p-4 transition ${
                          selectedStudentIds.includes(student.student.id)
                            ? "bg-indigo-500/20"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(
                              student.student.id,
                            )}
                            readOnly
                            className="mt-1"
                          />

                          <div>
                            <p className="text-white font-medium">
                              {student.name}
                            </p>

                            <p className="text-sm text-gray-400">
                              Reg No: {student.student?.regNo}
                            </p>

                            <p className="text-sm text-gray-400">
                              Room: {student.student?.room?.number || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-sm text-indigo-300">
                  Selected Students: {selectedStudentIds.length}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}

          <div className="sticky bottom-0 bg-[#0f172a] border-t border-white/10 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleAssignCharges}
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? "Assigning..." : "Assign Charges"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
