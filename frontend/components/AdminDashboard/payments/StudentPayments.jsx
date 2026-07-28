"use client";
import React, { useEffect, useState } from "react";
import Card from "../ui/Cards";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { Plus } from "lucide-react";
import AddChargeModal from "./AddChargeModal";
import axios from "axios";
import { usePathname } from "next/navigation";
import { toast } from "react-toastify";
import RecentTransactions from "./RecentTransactions";

const url = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function StudentPayments({ student, onBack, onPaymentSuccess }) {
  const pathname = usePathname();
  const role = pathname.split("/")[1];

  const [payments, setPayments] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [payModal, setPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchPayments = async () => {
    try {
      const res = await axios.get(
        `${url}/api/v1/${role}/student-payments/${student.studentId}`,
        { withCredentials: true },
      );
      setPayments(res.data || []);
    } catch (err) {
      console.error(err);
      setPayments([]);
    }
  };

  useEffect(() => {
    if (!role) return;
    fetchPayments();
  }, [role]);

  const openPayModal = (invoice) => {
    setSelectedInvoice(invoice);
    setAmount("");
    setPaymentMethod("CASH");
    setReference("");
    setPayModal(true);
  };

  const handlePay = async () => {
    if (!amount) return;

    const current = selectedInvoice;
    if (!current) return;

    const remaining = current.amount - current.paidAmount;

    if (Number(amount) > remaining) {
      toast.error("Amount exceeds remaining balance");
      return;
    }

    if (paymentMethod !== "CASH" && !reference.trim()) {
      toast.error("Reference number is required.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${url}/api/v1/${role}/pay`,
        {
          invoiceId: selectedInvoice.id,
          amount: Number(amount),
          method: paymentMethod,
          reference,
        },
        { withCredentials: true },
      );

      setPayModal(false);
      fetchPayments();
      onPaymentSuccess && onPaymentSuccess();
      setRefresh((prev) => !prev);
      toast.success("Payment successful");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.msg || "Payment failed");
    }finally{
      setLoading(false);
    }
  };

  const getFrequencyLabel = (freq) => {
    if (freq === 12) return "Monthly";
    if (freq === 4) return "Quarterly";
    if (freq === 2) return "Half-Yearly";
    return "Yearly";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e1b4b] text-white p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Button size="sm" onClick={onBack}>
          ← Back
        </Button>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Assign Charge
        </Button>
      </div>

      <h2 className="text-lg sm:text-xl font-bold">
        {student.name} - Payments
      </h2>

      {/* DESKTOP TABLE */}
      <Card className="hidden sm:block !p-0 bg-white/5 border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-gray-400 text-[11px]">
            <tr>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Remaining</th>
              <th className="px-6 py-3">Frequency</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {payments?.map((p) => {
              const remaining = p.amount - p.paidAmount;

              return (
                <tr key={p.id}>
                  <td className="px-6 py-3">{p.type}</td>
                  <td className="px-6 py-3">₹{p.amount}</td>
                  <td className="px-6 py-3">₹{remaining}</td>
                  <td className="px-6 py-3">
                    {getFrequencyLabel(p.frequency)}
                  </td>
                  <td className="px-6 py-3">
                    <Badge
                      variant={p.status === "PAID" ? "success" : "warning"}
                    >
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-3">
                    <Button
                      size="sm"
                      onClick={() => openPayModal(p)}
                      disabled={p.status === "PAID"}
                      className="w-[140px] justify-center"
                    >
                      {p.status === "PAID"
                        ? "Completed ✓"
                        : p.status === "PARTIAL"
                          ? "Add Payment"
                          : "Pay"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* MOBILE CARDS */}
      <div className="sm:hidden space-y-3">
        {payments?.map((p) => {
          const remaining = p.amount - p.paidAmount;

          return (
            <Card
              key={p.id}
              className="p-4 bg-white/5 border border-white/10 space-y-2"
            >
              <div className="flex justify-between">
                <p className="font-semibold">{p.type}</p>
                <Badge variant={p.status === "PAID" ? "success" : "warning"}>
                  {p.status}
                </Badge>
              </div>

              <p className="text-sm">
                Amount: <span className="font-bold">₹{p.amount}</span>
              </p>

              <p className="text-sm">
                Remaining: <span className="font-bold">₹{remaining}</span>
              </p>

              <p className="text-xs text-gray-400">
                {getFrequencyLabel(p.frequency)}
              </p>

              <Button
                size="sm"
                className="w-full"
                onClick={() => openPayModal(p)}
                disabled={p.status === "PAID"}
              >
                {p.status === "PAID"
                  ? "Completed ✓"
                  : p.status === "PARTIAL"
                    ? "Add Payment"
                    : "Pay"}
              </Button>
            </Card>
          );
        })}
      </div>

      <RecentTransactions studentId={student.studentId} refresh={refresh} />

      {payModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0f172a] border border-white/10 rounded-xl p-6 w-[90%] max-w-md space-y-4">
            <h3 className="text-xl font-semibold text-white">
              Collect Payment
            </h3>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Student</span>
                <span className="font-medium">{student.name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Charge Type</span>
                <span>{selectedInvoice?.type}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Invoice Amount</span>
                <span>₹{selectedInvoice?.amount}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Already Paid</span>
                <span>₹{selectedInvoice?.paidAmount}</span>
              </div>

              <div className="flex justify-between font-semibold">
                <span>Remaining</span>
                <span>
                  ₹
                  {selectedInvoice
                    ? selectedInvoice.amount - selectedInvoice.paidAmount
                    : 0}
                </span>
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-300">
              Payment Amount
            </label>

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter payment amount"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none"
            />
            <label className="block text-sm font-medium text-gray-300">
              Payment Method
            </label>

            <select
              value={paymentMethod}
              onChange={(e) => {
                const value = e.target.value;
                setPaymentMethod(value);
                if(value === "CASH"){
                  setReference("");
                }
              }}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none text-white"
            >
              <option className="bg-[#0f172a] text-white" value="CASH">
                Cash
              </option>
              <option className="bg-[#0f172a] text-white" value="UPI">
                UPI
              </option>
              <option className="bg-[#0f172a] text-white" value="CARD">
                Card
              </option>
              <option className="bg-[#0f172a] text-white" value="BANK_TRANSFER">
                Bank Transfer
              </option>
            </select>

            {paymentMethod !== "CASH" && (
              <>
                <label className="block text-sm font-medium text-gray-300">
                  Reference Number
                </label>

                <input
                  type="text"
                  placeholder="Enter transaction reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none"
                />
              </>
            )}
            <div className="flex justify-between rounded-lg bg-white/5 p-3">
              <span className="text-gray-400">Remaining After Payment</span>

              <span className="font-semibold">
                ₹
                {selectedInvoice
                  ? Math.max(
                      0,
                      selectedInvoice.amount -
                        selectedInvoice.paidAmount -
                        Number(amount || 0),
                    )
                  : 0}
              </span>
            </div>

            <div className="flex gap-3">
              <Button className="w-full" onClick={handlePay} disabled={loading}>
                {loading?"Collecting...":"Collect Payment"}
              </Button>
              <Button
                className="w-full bg-gray-600"
                onClick={() => setPayModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <AddChargeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        studentId={student.studentId}
        onSuccess={fetchPayments}
      />
    </div>
  );
}
