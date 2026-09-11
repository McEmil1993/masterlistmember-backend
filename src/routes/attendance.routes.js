import express from 'express'
import {
  getAttendanceByDate,
  batchUpdateAttendance,
  getMemberAttendanceHistory
} from '../controllers/attendance.controller.js'
import { auth } from '../middleware/auth.middleware.js'

const router = express.Router()

router.use(auth)

router.get('/', getAttendanceByDate)
router.post('/batch', batchUpdateAttendance)
router.get('/member/:memberId', getMemberAttendanceHistory)

export default router
