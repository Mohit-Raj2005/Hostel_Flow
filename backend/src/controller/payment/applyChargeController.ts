import { Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const applyChargeToStudents = async (
    req: any,
    res: Response
) => {
    try {
        const hostelId = req.user.hostelId;

        const {
            chargeType,
            baseAmount,
            frequency,
            interval,
            dueDate,
            assignmentType,
            studentIds = [],
        } = req.body;

        // Validate required fields
        if (
            !chargeType ||
            baseAmount === undefined ||
            !frequency ||
            interval === undefined ||
            !dueDate ||
            !assignmentType
        ) {
            return res.status(400).json({
                msg: "All required fields must be provided.",
            });
        }

        // Validate due date
        const parsedDueDate = new Date(dueDate);

        if (isNaN(parsedDueDate.getTime())) {
            return res.status(400).json({
                msg: "Invalid due date.",
            });
        }

        // Validate charge type
        const chargeTypeRecord = await prisma.chargeType.findUnique({
            where: {
                name: chargeType.toUpperCase(),
            },
        });

        if (!chargeTypeRecord) {
            return res.status(404).json({
                msg: "Charge type not found.",
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Create Charge
            const charge = await tx.charge.create({
                data: {
                    hostelId,
                    chargeTypeId: chargeTypeRecord.id,
                    baseAmount: Number(baseAmount),
                    frequency,
                    interval: Number(interval),
                    startDate: new Date(),
                },
            });

            // Find Students
            let students: { id: string }[] = [];

            if (assignmentType === "ALL") {
                students = await tx.student.findMany({
                    where: {
                        hostelId,
                    },
                    select: {
                        id: true,
                    },
                });
            } else if (assignmentType === "SELECTED") {
                if (!studentIds.length) {
                    throw new Error("No students selected.");
                }

                students = await tx.student.findMany({
                    where: {
                        hostelId,
                        id: {
                            in: studentIds,
                        },
                    },
                    select: {
                        id: true,
                    },
                });
            } else {
                throw new Error("Invalid assignment type.");
            }

            if (students.length === 0) {
                throw new Error("No students found.");
            }

            // Calculate total amount
            const totalAmount =
                frequency === "ONE_TIME"
                    ? Number(baseAmount)
                    : Number(baseAmount) * Number(interval);

            // Prepare invoices
            const invoices = students.map((student) => ({
                studentId: student.id,
                chargeId: charge.id,
                totalAmount,
                paidAmount: 0,
                remaining: totalAmount,
                dueDate: parsedDueDate,
            }));

            // Bulk insert invoices
            await tx.invoice.createMany({
                data: invoices,
            });

            return {
                chargeId: charge.id,
                studentsAffected: students.length,
                invoicesCreated: invoices.length,
            };
        });

        return res.status(201).json({
            msg: "Charges assigned successfully.",
            ...result,
        });

    } catch (error: any) {
        console.error(error);

        if (
            error.message === "No students selected." ||
            error.message === "Invalid assignment type." ||
            error.message === "No students found."
        ) {
            return res.status(400).json({
                msg: error.message,
            });
        }

        return res.status(500).json({
            msg: "Internal Server Error",
        });
    }
};