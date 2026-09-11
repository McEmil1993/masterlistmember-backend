import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";

export async function getOfficers(req, res) {
  try {
    const officers = await prisma.officer.findMany({
      include: {
        user: {
          select: { fullname: true, email: true, role: true }
        },
        member: {
          select: { fullname: true, studentId: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(officers);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to fetch officers." });
  }
}

export async function getAvailableMembers(req, res) {
  try {
    // Fetch members who are NOT currently officers
    const officers = await prisma.officer.findMany({
      select: { memberId: true }
    });
    const officerMemberIds = officers.map(o => o.memberId).filter(Boolean);

    const members = await prisma.member.findMany({
      where: {
        deletedAt: null,
        id: { notIn: officerMemberIds }
      },
      orderBy: { fullname: 'asc' }
    });
    res.json(members);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to fetch available members." });
  }
}

export async function appointOfficer(req, res) {
  try {
    const { memberId, position, role } = req.body;
    if (!memberId || !position || !role) {
      return res.status(422).json({ message: "memberId, position and role are required." });
    }

    // Check if position is already taken
    const existingOfficer = await prisma.officer.findFirst({
      where: { position }
    });

    if (existingOfficer) {
      return res.status(409).json({ message: `The position '${position}' is already assigned to another officer.` });
    }

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) return res.status(404).json({ message: "Member not found." });

    // 1. Handle User creation/update
    // We use email as a unique identifier for the user
    let user;
    const hashedPassword = await bcrypt.hash("Password123!", 10);

    if (member.email) {
      const existingUser = await prisma.user.findFirst({ where: { email: member.email } });
      if (existingUser) {
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            fullname: member.fullname,
            position: position,
            role: role
          }
        });
      } else {
        user = await prisma.user.create({
          data: {
            fullname: member.fullname,
            username: member.studentId,
            email: member.email,
            password: hashedPassword,
            position: position,
            role: role
          }
        });
      }
    } else {
      return res.status(422).json({ message: "Member must have an email to be appointed as an officer." });
    }

    // 2. Handle Officer record
    const officer = await prisma.officer.upsert({
      where: { userId: user.id },
      update: {
        memberId: member.id,
        position: position,
        role: role
      },
      create: {
        userId: user.id,
        memberId: member.id,
        position: position,
        role: role
      }
    });

    res.status(201).json(officer);
  } catch (e) {
    console.error(e);
    if (e.code === "P2002") return res.status(409).json({ message: "Username or email already exists." });
    res.status(500).json({ message: "Failed to appoint officer." });
  }
}

export async function removeOfficer(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid officer ID." });

    const officer = await prisma.officer.findUnique({ where: { id } });
    if (!officer) return res.status(404).json({ message: "Officer not found." });

    // Reset the User record position and role
    await prisma.user.update({
      where: { id: officer.userId },
      data: {
        position: null,
        role: 'user'
      }
    });

    // Remove the Officer link
    await prisma.officer.delete({ where: { id } });

    res.json({ message: "Officer removed successfully." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to remove officer." });
  }
}

export async function updateOfficer(req, res) {
  try {
    const id = Number(req.params.id);
    const { memberId, position, role } = req.body;

    const officer = await prisma.officer.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!officer) return res.status(404).json({ message: "Officer not found." });

    // Check if new position is taken by another officer
    if (position && position !== officer.position) {
      const existingOfficer = await prisma.officer.findFirst({
        where: {
          position,
          NOT: { id }
        }
      });
      if (existingOfficer) {
        return res.status(409).json({ message: `The position '${position}' is already assigned to another officer.` });
      }
    }

    let userId = officer.userId;

    if (memberId && memberId !== officer.memberId) {
      const member = await prisma.member.findUnique({ where: { id: memberId } });
      if (!member) return res.status(404).json({ message: "New member not found." });

      const existingUser = await prisma.user.findFirst({ where: { email: member.email } });
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const hashedPassword = await bcrypt.hash("Password123!", 10);
        const newUser = await prisma.user.create({
          data: {
            fullname: member.fullname,
            username: member.studentId,
            email: member.email,
            password: hashedPassword,
            position: position,
            role: role
          }
        });
        userId = newUser.id;
      }
    }

    const updatedOfficer = await prisma.officer.update({
      where: { id },
      data: {
        userId: userId,
        memberId: memberId || officer.memberId,
        position: position,
        role: role
      }
    });

    await prisma.user.update({
      where: { id: userId },
      data: { position, role }
    });

    res.json(updatedOfficer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to update officer." });
  }
}
