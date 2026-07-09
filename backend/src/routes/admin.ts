import express, { Request, Response } from "express";
import { verifyToken } from "../middlewares/authMiddleware";
import { authorizeRole } from "../middlewares/roleMiddleware";
import { createStudent, createWarden, deleteStudent, deleteWarden, getAdmins, getInactiveStudents, getInactiveWardens, getSingleStudent, getSingleWarden, getStudents, getUnassignedStudents, getwardens, updateStudent, updateUser } from "../controller/adminController";
import { getSelfDetails, updateSelfProfile } from "../controller/userController";
import { allocateRoom, createRooms, deleteRoom, getAllRooms, getRooms, getSingleRoom, updateRoom } from "../controller/roomController";
import { createCharge, createChargeType, generateInvoiceForStudent, getAllStudentsWithDues, getDashboardSummary, getStudentPayments, getStudentTransactions, payInvoice, getChargeTypes } from "../controller/paymentController";  // Import getChargeTypes function
import { getAllStudents, inactiveStudent, removeStudent } from "../controller/admin/studentController";
import { inactiveWarden } from "../controller/admin/wardenController";
import { getAllComplaints, getComplaintById, updateComplaintPriority, updateComplaintStatus } from "../controller/admin/complaintController";
import { createNotice, deleteNotice, getAllNotices, getSingleNotice, updateNotice } from "../controller/noticeController";

import { applyChargeToStudents } from "../controller/payment/applyChargeController";   // Import the applyChargeToStudents function

const adminRouter = express.Router();

adminRouter.use(verifyToken);
adminRouter.use(authorizeRole("ADMIN"));

adminRouter.post("/create-student", (req: Request, res: Response) => createStudent(req, res));

adminRouter.get("/students", (req: Request, res: Response) => getStudents(req, res));

adminRouter.get("/inactive-students", (req: Request, res: Response) => getInactiveStudents(req, res));
adminRouter.get("/inactive-wardens", (req: Request, res: Response) => getInactiveWardens(req, res));

adminRouter.get("/student/:id", (req: Request, res: Response) => getSingleStudent(req, res));

adminRouter.post("/create-warden", (req: Request, res: Response) => createWarden(req, res));

adminRouter.get("/wardens", (req: Request, res: Response) => getwardens(req, res));

adminRouter.get("/warden/:id", (req: Request, res: Response) => getSingleWarden(req, res));

adminRouter.delete("/student/:id", (req: Request, res: Response) => deleteStudent(req, res));

adminRouter.delete("/warden/:id", (req: Request, res: Response) => deleteWarden(req, res));

adminRouter.put("/student/:id", (req: Request, res: Response) => updateStudent(req, res));
adminRouter.put("/inactive/:id", (req: Request, res: Response) => inactiveStudent(req, res));
adminRouter.put("/inactive-warden/:id", (req: Request, res: Response) => inactiveWarden(req, res));

adminRouter.put("/user/:id", (req: Request, res: Response) => updateUser(req, res));

adminRouter.get("/admins", (req: Request, res: Response) => getAdmins(req, res));

adminRouter.get("/me", (req: Request, res: Response) => getSelfDetails(req, res));

adminRouter.put("/update-selfprofile", (req: Request, res: Response) => updateSelfProfile(req, res));

adminRouter.post("/rooms/allocate", (req: Request, res: Response) => allocateRoom(req, res));

adminRouter.post("/rooms/create", (req: Request, res: Response) => createRooms(req, res));

adminRouter.get("/rooms", (req: Request, res: Response) => getRooms(req, res));

adminRouter.get("/rooms/:id", (req: Request, res: Response) => getSingleRoom(req, res));

adminRouter.put("/rooms/update/:id", (req: Request, res: Response) => updateRoom(req, res));

adminRouter.delete("/rooms/:id", (req: Request, res: Response) => deleteRoom(req, res));


adminRouter.put("/rooms/remove-student/:studentId", (req: Request, res: Response) =>
  removeStudent(req, res)
);

adminRouter.get("/unassigned-student", (req: Request, res: Response) => getUnassignedStudents(req, res));


adminRouter.get("/student-payments/:studentId", getStudentPayments);
adminRouter.post("/charge", createCharge);
adminRouter.post("/invoice", generateInvoiceForStudent);
adminRouter.post("/pay", payInvoice);
adminRouter.get("/summary", getDashboardSummary);
adminRouter.get("/students-dues", getAllStudentsWithDues);
adminRouter.post("/charge-type", createChargeType);
adminRouter.get("/student-transactions/:studentId", getStudentTransactions);

adminRouter.post("/assign-charges", applyChargeToStudents); // New route for applying charges to students
adminRouter.get("/charge-types", getChargeTypes); // New route to get all charge types


adminRouter.get("/complaints", getAllComplaints);
adminRouter.get("/complaints/:id", getComplaintById);
adminRouter.patch("/complaints/:id/status", updateComplaintStatus);
adminRouter.patch("/complaints/:id/priority", updateComplaintPriority);


adminRouter.post("/notices", createNotice);
adminRouter.get("/notices", getAllNotices);
adminRouter.patch("/notices/:id", updateNotice);
adminRouter.delete("/notices/:id", deleteNotice);
adminRouter.get("/notices/:id", getSingleNotice);


// For dashboard-data
adminRouter.get("/allstudents", (req: Request, res: Response) => getAllStudents(req, res));
adminRouter.get("/allrooms", (req: Request, res: Response) => getAllRooms(req, res));

export default adminRouter;