import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { ref } from "node:process";

const prisma = new PrismaClient();


export const createCharge = async (req: any, res: Response) => {
  try {
    const hostelId = req.user.hostelId;

    const { chargeTypeId, baseAmount, frequency, interval, studentId } =
      req.body;

    const chargeType = await prisma.chargeType.findFirst({
      where: {
        name: chargeTypeId.toUpperCase(),
      },
    });

    if (!chargeType) {
      return res.status(400).json({ msg: "Invalid charge type" });
    }

    const charge = await prisma.charge.create({
      data: {
        hostelId,
        chargeTypeId: chargeType.id,
        baseAmount,
        frequency,
        interval,
        startDate: new Date(),
      },
    });

    if (studentId) {
      const totalAmount = baseAmount * interval;

      await prisma.invoice.create({
        data: {
          studentId,
          chargeId: charge.id,
          totalAmount,
          paidAmount: 0,
          remaining: totalAmount,
          dueDate: new Date(),
        },
      });
    }

    return res.status(201).json(charge);
  } catch (e) {
    console.log(e);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

export const getChargeTypes = async (req: any, res: Response) => {
  try {
    const chargeTypes = await prisma.chargeType.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return res.json(chargeTypes);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      msg: "Internal server error",
    });
  }
};

export const generateInvoices = async (req: any, res: Response) => {
  try {
    const hostelId = req.user.hostelId;
    const { dueDate } = req.body;

    if (!dueDate) {
      return res.status(400).json({ msg: "Due date required" });
    }

    const parsedDate = new Date(dueDate);

    const students = await prisma.student.findMany({
      where: { hostelId },
    });

    const charges = await prisma.charge.findMany({
      where: { hostelId },
    });

    let created = 0;

    for (const student of students) {
      for (const charge of charges) {
        const totalAmount = charge.baseAmount * charge.interval;

        const exists = await prisma.invoice.findFirst({
          where: {
            studentId: student.id,
            chargeId: charge.id,
            dueDate: parsedDate,
          },
        });

        if (!exists) {
          await prisma.invoice.create({
            data: {
              studentId: student.id,
              chargeId: charge.id,
              totalAmount,
              paidAmount: 0,
              remaining: totalAmount,
              dueDate: parsedDate,
            },
          });

          created++;
        }
      }
    }

    return res.json({ msg: "Invoices generated", count: created });
  } catch {
    return res.status(500).json({ msg: "Internal server error" });
  }
};

export const generateInvoiceForStudent = async (req: any, res: Response) => {
  try {
    const { studentId, chargeId } = req.body;

    const charge = await prisma.charge.findUnique({
      where: { id: chargeId },
    });

    if (!charge) {
      return res.status(404).json({ msg: "Charge not found" });
    }

    const totalAmount = charge.baseAmount * charge.interval;

    const invoice = await prisma.invoice.create({
      data: {
        studentId,
        chargeId,
        totalAmount,
        paidAmount: 0,
        remaining: totalAmount,
        dueDate: new Date(),
      },
    });

    return res.json(invoice);
  } catch {
    return res.status(500).json({ msg: "Internal server error" });
  }
};

export const payInvoice = async (req: any, res: Response) => {
  try {
    const { invoiceId, amount, method, reference } = req.body;
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return res.status(404).json({ msg: "Invoice not found" });
    }
    const remaining = invoice.totalAmount - invoice.paidAmount;

    if (amount > remaining) {
      return res.status(400).json({
        msg: "Amount exceeds remaining balance",
      });
    }

    const newPaid = invoice.paidAmount + amount;
    const newRemaining = invoice.totalAmount - newPaid;

    const status =
      newRemaining === 0 ? "PAID" : newPaid > 0 ? "PARTIAL" : "PENDING";

    if (method && method !== "CASH" && !reference?.trim()) {
      return res.status(400).json({
        msg: "Reference is required",
      });
    }
    await prisma.$transaction(async (tx)=>{
          await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaid,
        remaining: newRemaining,
        status,
      },
    });
    await tx.paymentTransaction.create({
      data: {
        studentId: invoice.studentId,
        invoiceId,
        amount,
        method,
        reference: reference?.trim() || null,
      },
    });
    });
    return res.json({ msg: "Payment successful" });

  }catch(e){
      console.log(e);
      return res.status(500).json({
        msg:"Internal server Error"
      });
    }
  };

export const getStudentPayments = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    // console.log("API studentId:", studentId);

    const invoices = await prisma.invoice.findMany({
      where: { studentId },
      include: {
        charge: {
          include: { chargeType: true },
        },
      },
    });

    // console.log("Invoices found:", invoices.length);

    const formatted = invoices.map((inv) => ({
      id: inv.id,
      type: inv.charge.chargeType.name,
      amount: inv.totalAmount,
      paidAmount: inv.paidAmount,
      frequency: inv.charge.interval,
      status: inv.status,
    }));

    return res.json(formatted);
  } catch (e) {
    console.log(e);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

export const getDashboardSummary = async (req: any, res: Response) => {
  try {
    const hostelId = req.user.hostelId;

    const invoices = await prisma.invoice.findMany({
      where: { student: { hostelId } },
    });

    let total = 0;
    let paid = 0;

    invoices.forEach((i) => {
      total += i.totalAmount;
      paid += i.paidAmount;
    });

    return res.json({
      total,
      paid,
      remaining: total - paid,
    });
  } catch {
    return res.status(500).json({ msg: "Internal server error" });
  }
};

export const getAllStudentsWithDues = async (req: any, res: Response) => {
  try {
    const hostelId = req.user.hostelId;

    const page = Number(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;

    const [students, totalCount] = await Promise.all([
      prisma.student.findMany({
        where: { hostelId },
        include: {
          user: true,
          room: true,
          invoices: true,
        },
        skip,
        take: limit,
      }),

      prisma.student.count({
        where: { hostelId },
      }),
    ]);

    const result = students.map((student) => ({
      studentId: student.id,
      name: student.user.name,
      room: student.room?.number || "N/A",
      due: student.invoices.reduce((sum, inv) => sum + inv.remaining, 0),
    }));

    return res.json({
      data: result,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch {
    return res.status(500).json({ msg: "Internal server error" });
  }
};

export const createChargeType = async (req: any, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ msg: "Name is required" });
    }
    const exists = await prisma.chargeType.findUnique({
      where: { name: name.toUpperCase() },
    });

    if (exists) {
      return res.status(400).json({ msg: "Charge type already exists" });
    }
    const chargeType = await prisma.chargeType.create({
      data: {
        name: name.toUpperCase(),
        description,
      },
    });

    return res.status(201).json(chargeType);
  } catch (e) {
    console.log(e);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

export const getStudentTransactions = async (req: any, res: Response) => {
  try {
    const { studentId } = req.params;

    const transactions = await prisma.paymentTransaction.findMany({
      where: { studentId },
      include: {
        invoice: {
          include: {
            charge: {
              include: {
                chargeType: true,
              },
            },
          },
        },
      },
      orderBy: { paidAt: "desc" },
      take: 7,
    });

    const formatted = transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      paidAt: t.paidAt,
      type: t.invoice.charge.chargeType.name,
      status: t.invoice.status,
      method: t.method,
      reference: t.reference,
    }));

    return res.json(formatted);
  } catch (e) {
    console.log(e);
    return res.status(500).json({ msg: "Internal server error" });
  }
}
