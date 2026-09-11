import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query
    if (!date) {
      return res.status(400).json({ message: 'Date query parameter is required' })
    }

    // Parse date to midnight UTC to match @db.Date
    const targetDate = new Date(date)
    targetDate.setUTCHours(0, 0, 0, 0)

    const members = await prisma.member.findMany({
      where: { status: 'active' },
      select: { id: true, fullname: true, studentId: true, position: true, gender: true, yearLevel: true }
    })

    // Sort members: Senior -> Middle -> Junior, then alphabetically by name
    members.sort((a, b) => {
      const order = { 'senior': 1, 'middle': 2, 'junior': 3 };
      const posA = (a.position || '').toLowerCase();
      const posB = (b.position || '').toLowerCase();

      const rankA = order[posA] || 99;
      const rankB = order[posB] || 99;

      if (rankA !== rankB) return rankA - rankB;

      return (a.fullname || '').localeCompare(b.fullname || '');
    })

    const attendanceRecords = await prisma.attendance.findMany({
      where: { date: targetDate },
      select: { memberId: true, status: true }
    })

    const data = members.map(member => {
      const record = attendanceRecords.find(r => r.memberId === member.id)
      return {
        memberId: member.id,
        studentId: member.studentId,
        fullName: member.fullname,
        position: member.position,
        gender: member.gender,
        yearLevel: member.yearLevel,
        status: record ? record.status : 'absent'
      }
    })

    res.json(data)
  } catch (error) {
    console.error('Error fetching attendance:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const batchUpdateAttendance = async (req, res) => {
  try {
    const { date, attendance } = req.body
    if (!date || !attendance || !Array.isArray(attendance)) {
      return res.status(400).json({ message: 'Invalid request body. Date and attendance array are required.' })
    }

    const targetDate = new Date(date)
    targetDate.setUTCHours(0, 0, 0, 0)

    const transactions = attendance.map(item =>
      prisma.attendance.upsert({
        where: {
          memberId_date: {
            memberId: item.memberId,
            date: targetDate
          }
        },
        update: { status: item.status },
        create: {
          memberId: item.memberId,
          date: targetDate,
          status: item.status
        }
      })
    )

    await prisma.$transaction(transactions)
    res.json({ message: 'Attendance updated successfully' })
  } catch (error) {
    console.error('Error updating attendance:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const getMemberAttendanceHistory = async (req, res) => {
  try {
    const { memberId } = req.params
    const history = await prisma.attendance.findMany({
      where: { memberId: parseInt(memberId) },
      orderBy: { date: 'desc' }
    })

    res.json(history)
  } catch (error) {
    console.error('Error fetching attendance history:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
