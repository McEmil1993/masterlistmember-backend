import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import {getUsers,getUser,createUser,updateUser,deleteUser} from "../controllers/user.controller.js";
const router=Router();
router.use(auth);
router.get("/",getUsers);router.get("/:id",getUser);router.post("/",createUser);router.put("/:id",updateUser);router.delete("/:id",deleteUser);
export default router;
