import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import { getOfficers, getAvailableMembers, appointOfficer, removeOfficer, updateOfficer } from "../controllers/officer.controller.js";

const router = Router();

router.use(auth);

router.get("/", getOfficers);
router.get("/available-members", getAvailableMembers);
router.post("/appoint", appointOfficer);
router.put("/:id", updateOfficer);
router.delete("/:id", removeOfficer);

export default router;
