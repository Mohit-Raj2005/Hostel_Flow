"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { usePathname } from "next/navigation";

const url = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function AssignChargesModal({ open, onClose }) {
    const pathname = usePathname();
    const role = pathname.split("/")[1];


    const [formData, setFormData] = useState({
        chargeType: "",
        baseAmount: "",
        frequency: "ONE_TIME",
        interval: 1,
        dueDate: "",
        assignmentType: "ALL",
    });
    const [chargeTypes, setChargeTypes] = useState([]);



    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const fetchChargeTypes = async () => {
        try {

            const res = await axios.get(
                `${url}/api/v1/${role}/charge-types`,
                {
                    withCredentials: true,
                }
            );


            setChargeTypes(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (open) {
            fetchChargeTypes();
        }
    }, [open, role]);

    useEffect(() => {
    }, [chargeTypes]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-3xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">

                    {/* Header */}
                    <div className="sticky top-0 bg-[#0f172a] border-b border-white/10 px-6 py-4">
                        <h2 className="text-2xl font-bold text-white">
                            Assign Charges
                        </h2>
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
                                    <option value="YEARLY" className="bg-[#1e293b] text-white">
                                        Half-Yearly
                                    </option>
                                    <option value="YEARLY" className="bg-[#1e293b] text-white">
                                        Yearly
                                    </option>
                                    <option value="CUSTOM" className="bg-[#1e293b] text-white">
                                        Custom
                                    </option>
                                </select>
                            </div>

                            {/* Interval */}
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

                        {/* Student Selection Placeholder */}

                        {formData.assignmentType === "SELECTED" && (
                            <div className="border border-white/10 rounded-xl p-4">
                                <h3 className="text-white font-semibold mb-3">
                                    Select Students
                                </h3>

                                <div className="text-gray-400 text-sm">
                                    Student list will appear here in the next step.
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer */}

                    <div className="sticky bottom-0 bg-[#0f172a] border-t border-white/10 px-6 py-4 flex justify-end gap-3">

                        <button
                            onClick={onClose}
                            className="px-5 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition"
                        >
                            Cancel
                        </button>

                        <button
                            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition"
                        >
                            Assign Charges
                        </button>

                    </div>

                </div>
            </div>
        </div>
    );
}