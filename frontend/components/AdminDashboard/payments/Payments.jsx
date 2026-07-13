"use client";
import React, { useState, useEffect } from "react";
import Card from "../ui/Cards";
import Button from "../ui/Button";
import { CreditCard, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import StudentPayments from "./StudentPayments";
import { useStudentsDues } from "../../../hooks/useStudentsDues";
import { usePathname } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";

import AssignChargesModal from "./AssignChargesModal"; // Import the AssignChargesModal component

const url = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Payments() {
  const pathname = usePathname();
  const role = pathname.split("/")[1];

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 15;

  const [summary, setSummary] = useState({
    total: 0,
    paid: 0,
    remaining: 0,
  });

  const [showChargeTypeModal, setShowChargeTypeModal] = useState(false);

  const [showAssignCharges, setShowAssignCharges] = useState(false);

  const [chargeTypeName, setChargeTypeName] = useState("");

  const { students, total, loading, setRefresh } = useStudentsDues({
    role,
    page,
    limit,
    search: "",
  });

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${url}/api/v1/${role}/summary`, {
        credentials: "include",
      });
      const data = await res.json();
      setSummary(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!role) return;
    fetchSummary();
  }, [role]);

  const handleCreateChargeType = async () => {
    if (!chargeTypeName) return;

    try {
      await axios.post(
        `${url}/api/v1/${role}/charge-type`,
        { name: chargeTypeName },
        { withCredentials: true },
      );

      toast.success("Charge type created");
      setShowChargeTypeModal(false);
      setChargeTypeName("");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Error");
    }
  };

  const handleAssignSuccess = () => {
    fetchSummary();
    setRefresh((prev) => !prev);
  };

  if (selectedStudent) {
    return (
      <StudentPayments
        student={selectedStudent}
        onBack={() => setSelectedStudent(null)}
        onPaymentSuccess={() => {
          fetchSummary();
          setRefresh((prev) => !prev);
        }}
      />
    );
  }

  const totalPending = students.reduce((acc, s) => acc + s.due, 0);
  const totalCollected = summary.paid;

  const colorMap = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
    rose: "bg-rose-500/10 text-rose-400",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e1b4b] text-white p-4 sm:p-6 space-y-6">
      {/* <div className="flex justify-between items-center">
        <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
          <CreditCard className="text-indigo-400" /> Payment Dashboard
        </h2>

        <Button
          size="sm"
          className="px-3 py-1 text-xs sm:text-sm md:text-base md:px-4 md:py-2"
          onClick={() => setShowChargeTypeModal(true)}
        >
          + Add Charge Type
        </Button>
      </div> */}
      {/* ✅ DASHBOARD CARDS  new assign charges button added*/}
      <div className="flex justify-between items-center">
        <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
          <CreditCard className="text-indigo-400" /> Payment Dashboard
        </h2>

        <div className="flex gap-3">
          <Button
            size="sm"
            className="px-3 py-1 text-xs sm:text-sm md:text-base md:px-4 md:py-2"
            onClick={() => setShowAssignCharges(true)}
          >
            Assign Charges
          </Button>

          <Button
            size="sm"
            className="px-3 py-1 text-xs sm:text-sm md:text-base md:px-4 md:py-2"
            onClick={() => setShowChargeTypeModal(true)}
          >
            + Add Charge Type
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[
          {
            label: "Collected",
            value: totalCollected,
            color: "emerald",
            icon: <ArrowUpRight />,
          },
          {
            label: "Pending",
            value: totalPending,
            color: "amber",
            icon: <CreditCard />,
          },
          {
            label: "Students",
            value: total,
            color: "rose",
            icon: <ArrowDownLeft />,
          },
        ].map((item, i) => (
          <Card
            key={i}
            className="flex items-center gap-3 sm:gap-4 bg-white/5 backdrop-blur-md border border-white/10"
          >
            <div className={`p-2 sm:p-3 rounded-xl ${colorMap[item.color]}`}>
              {item.icon}
            </div>
            <div>
              <p className="text-xs text-gray-400">{item.label}</p>
              <h4
                className={`text-lg sm:text-2xl font-bold ${colorMap[item.color].split(" ")[1]}`}
              >
                {item.value}
              </h4>
            </div>
          </Card>
        ))}
      </div>

      <Card className="!p-0 bg-white/5 backdrop-blur-md border border-white/10">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-gray-400 uppercase text-[11px]">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Room</th>
                <th className="px-6 py-3">Due</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {students.map((student) => (
                <tr key={student.studentId}>
                  <td className="px-6 py-3 text-gray-200">{student.name}</td>
                  <td className="px-6 py-3 text-gray-400">{student.room}</td>
                  <td className="px-6 py-3 font-bold">₹{student.due}</td>
                  <td className="px-6 py-3">
                    <Button
                      size="sm"
                      onClick={() => setSelectedStudent(student)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden p-4 space-y-3">
          {students.map((student) => (
            <Card
              key={student.studentId}
              className="p-4 bg-white/5 border border-white/10"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{student.name}</p>
                  <p className="text-xs text-gray-400">{student.room}</p>
                </div>
                <p className="font-bold">₹{student.due}</p>
              </div>

              <Button
                size="sm"
                className="w-full mt-3"
                onClick={() => setSelectedStudent(student)}
              >
                View
              </Button>
            </Card>
          ))}
        </div>
      </Card>

      {/* ✅ PAGINATION FOOTER */}
      <div className="px-6 py-4 border-t border-white/10 flex justify-between text-sm text-gray-400">
        <p>
          {students.length} / {total}
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="px-4 py-2 bg-white/5 rounded-lg"
          >
            Prev
          </button>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * limit >= total}
            className="px-4 py-2 bg-white/5 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {showChargeTypeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0f172a] border border-white/10 rounded-xl p-6 w-[90%] max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Create Charge Type</h3>

            <input
              type="text"
              placeholder="Enter type (e.g. MESS)"
              value={chargeTypeName}
              onChange={(e) => setChargeTypeName(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/5 border border-white/10 outline-none"
            />

            <div className="flex gap-3">
              <Button className="w-full" onClick={handleCreateChargeType}>
                Create
              </Button>
              <Button
                className="w-full bg-gray-600"
                onClick={() => setShowChargeTypeModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <AssignChargesModal
        open={showAssignCharges}
        onClose={() => setShowAssignCharges(false)}
        onSuccess={handleAssignSuccess}
      />
    </div>
  );
}
