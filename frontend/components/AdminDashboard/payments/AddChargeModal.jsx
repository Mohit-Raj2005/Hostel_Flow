"use client";
import React, { useState, useEffect } from "react";
import Button from "../ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { usePathname } from "next/navigation";
import { toast } from "react-toastify";

const url = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function AddChargeModal({
  open,
  onClose,
  studentId,
  onSuccess,
}) {
  const pathname = usePathname();
  const role = pathname.split("/")[1];
  const [chargeTypes, setChargeTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    chargeType: "",
    baseAmount: "",
    frequency: "ONE_TIME",
    interval: 1,
    dueDate: "",
  });

  const fetchChargeTypes = async () => {
    try {
      const res = await axios.get(`${url}/api/v1/${role}/charge-types`, {
        withCredentials: true,
      });

      setChargeTypes(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load charge types.");
    }
  };

  useEffect(() => {
    if (!role || !open) return;

    fetchChargeTypes();
  }, [role, open]);

  const handleAdd = async () => {
    if (!form.chargeType) {
      toast.error("Please select a charge type.");
      return;
    }

    if (!form.baseAmount) {
      toast.error("Please enter an amount.");
      return;
    }

    if (!form.dueDate) {
      toast.error("Please select a due date.");
      return;
    }

    if (form.frequency === "CUSTOM" && form.interval < 1) {
      toast.error("Interval must be at least 1.");
      return;
    }

    try {
      setLoading(true);
      const defaultIntervals = {
        ONE_TIME: 1,
        MONTHLY: 12,
        QUARTERLY: 4,
        HALF_YEARLY:2,
        YEARLY: 1,
      };

      const interval =
        form.frequency === "CUSTOM"
          ? Number(form.interval)
          : defaultIntervals[form.frequency];
      const res1 = await axios.post(
        `${url}/api/v1/${role}/charge`,
        {
          chargeTypeId: form.chargeType,
          baseAmount: Number(form.baseAmount),
          frequency: form.frequency,
          interval,
        },
        { withCredentials: true },
      );

      const charge = res1.data;

      await axios.post(
        `${url}/api/v1/${role}/invoice`,
        {
          studentId,
          chargeId: charge.id,
        },
        { withCredentials: true },
      );

      toast.success("Charge assigned successfully.");

      onSuccess();
      onClose();
      setForm({
        chargeType: "",
        baseAmount: "",
        frequency: "ONE_TIME",
        interval: 1,
        dueDate: "",
      });
    } catch (err) {
      console.error(err);
      console.log(err.response?.data);

      toast.error(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          "Failed to assign charge.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
          <motion.div className="bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e1b4b] p-6 rounded-2xl w-full max-w-md space-y-5 border border-white/10">
            <h3 className="text-lg font-semibold text-white">
              Assign Charge to Student
            </h3>
            <label className="text-sm font-medium text-gray-300">
              Charge Type
            </label>
            <select
              value={form.chargeType}
              onChange={(e) =>
                setForm({
                  ...form,
                  chargeType: e.target.value,
                })
              }
              className="w-full p-3 rounded-lg bg-[#020617] border border-white/10 text-gray-200"
            >
              <option value="">Select Charge Type</option>

              {chargeTypes.map((type) => (
                <option key={type.id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>

            <label className="text-sm font-medium text-gray-300">Amount</label>
            <input
              type="number"
              placeholder="Base Amount"
              value={form.baseAmount}
              onChange={(e) => setForm({ ...form, baseAmount: e.target.value })}
              className="w-full p-3 rounded-lg bg-[#020617] border border-white/10 text-gray-200"
            />

            <label className="text-sm font-medium text-gray-300">
              Frequency
            </label>
            <select
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              className="w-full p-3 rounded-lg bg-[#020617] border border-white/10 text-gray-200"
            >
              <option value="ONE_TIME">One Time</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="HALF_YEARLY">Half Yearly</option>
              <option value="YEARLY">Yearly</option>
              <option value="CUSTOM">Custom</option>
            </select>

            <label className="text-sm font-medium text-gray-300">
              Interval
            </label>
            {form.frequency === "CUSTOM" && (
              <input
                type="number"
                min={1}
                placeholder="Interval"
                value={form.interval}
                onChange={(e) =>
                  setForm({
                    ...form,
                    interval: Number(e.target.value),
                  })
                }
                className="w-full p-3 rounded-lg bg-[#020617] border border-white/10 text-gray-200"
              />
            )}

            <label className="text-sm font-medium text-gray-300">
              Due Date
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) =>
                setForm({
                  ...form,
                  dueDate: e.target.value,
                })
              }
              className="w-full p-3 rounded-lg bg-[#020617] border border-white/10 text-gray-200"
            />

            <div className="flex gap-3">
              <Button
                onClick={handleAdd}
                disabled={loading}
                className="w-full bg-indigo-600"
              >
                {loading ? "Assigning..." : "Assign Charge"}
              </Button>
              <Button
                onClick={onClose}
                disabled={loading}
                className="w-full bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
