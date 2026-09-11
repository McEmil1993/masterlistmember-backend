import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import {getMembers,getMember,createMember,updateMember,deleteMember,importMembers,upsertMembersBatch} from "../controllers/member.controller.js";
import multer from "multer";

const router=Router();
const upload = multer({ dest: "uploads/" });

router.use(auth);
router.post("/import", upload.single("file"), importMembers);
router.post("/import-batch", upsertMembersBatch);
router.get("/",getMembers);router.get("/:id",getMember);router.post("/",createMember);router.put("/:id",updateMember);router.delete("/:id",deleteMember);
export default router;
