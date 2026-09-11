import prisma from "../config/prisma.js";
import xlsx from "xlsx";
import fs from "fs";

export async function getMembers(req,res){try{res.json(await prisma.member.findMany({where:{deletedAt:null},orderBy:{joinedAt:"desc"}}));}catch(e){console.error(e);res.status(500).json({message:"Failed to fetch members."});}}
export async function getMember(req,res){try{const id=Number(req.params.id);if(!Number.isInteger(id))return res.status(400).json({message:"Invalid member ID."});const member=await prisma.member.findFirst({where:{id,deletedAt:null}});if(!member)return res.status(404).json({message:"Member not found."});res.json(member);}catch(e){console.error(e);res.status(500).json({message:"Failed to fetch member."});}}
export async function createMember(req,res){try{const {studentId,fullname,gender,position,yearLevel,email,status}=req.body;if(!studentId||!fullname)return res.status(422).json({message:"Student ID and fullname are required."});const member=await prisma.member.create({data:{studentId,fullname,gender:gender??null,position:position??null,yearLevel:yearLevel??null,email:email??null,status:status??"active"}});res.status(201).json(member);}catch(e){console.error(e);if(e.code==="P2002")return res.status(409).json({message:"Student ID already exists."});res.status(500).json({message:"Failed to create member."});}}
export async function updateMember(req,res){try{const id=Number(req.params.id);if(!Number.isInteger(id))return res.status(400).json({message:"Invalid member ID."});const {studentId,fullname,gender,position,yearLevel,email,status}=req.body;const existing=await prisma.member.findFirst({where:{id,deletedAt:null}});if(!existing)return res.status(404).json({message:"Member not found."});const member=await prisma.member.update({where:{id},data:{...(studentId!==undefined&&{studentId}),...(fullname!==undefined&&{fullname}),...(gender!==undefined&&{gender}),...(position!==undefined&&{position}),...(yearLevel!==undefined&&{yearLevel}),...(email!==undefined&&{email}),...(status!==undefined&&{status})}});res.json(member);}catch(e){console.error(e);if(e.code==="P2002")return res.status(409).json({message:"Student ID already exists."});res.status(500).json({message:"Failed to update member."});}}
export async function deleteMember(req,res){try{const id=Number(req.params.id);if(!Number.isInteger(id))return res.status(400).json({message:"Invalid member ID."});const existing=await prisma.member.findFirst({where:{id,deletedAt:null}});if(!existing)return res.status(404).json({message:"Member not found."});await prisma.member.update({where:{id},data:{deletedAt:new Date()}});res.json({message:"Member deleted successfully."});}catch(e){console.error(e);res.status(500).json({message:"Failed to delete member."});}}

export async function upsertMembersBatch(req, res) {
  try {
    const { members } = req.body;
    if (!members || !Array.isArray(members)) {
      return res.status(400).json({ message: "Invalid data format. Members array is required." });
    }

    const results = await Promise.all(
      members.map(member =>
        prisma.member.upsert({
          where: { studentId: member.studentId },
          update: {
            fullname: member.fullname,
            gender: member.gender,
            position: member.position,
            yearLevel: member.yearLevel,
            email: member.email,
            status: member.status,
            joinedAt: member.joinedAt ? new Date(member.joinedAt) : undefined,
          },
          create: {
            studentId: member.studentId,
            fullname: member.fullname,
            gender: member.gender,
            position: member.position,
            yearLevel: member.yearLevel,
            email: member.email,
            status: member.status,
            joinedAt: member.joinedAt ? new Date(member.joinedAt) : new Date(),
          }
        })
      )
    );

    res.json({ success: true, processed: results.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to process batch import." });
  }
}

export async function importMembers(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "The uploaded file is empty." });
    }

    const membersToProcess = data.map((row) => {
      const normalizedRow = {};
      for (const key in row) {
        normalizedRow[key.trim().toLowerCase()] = row[key];
      }

      // Date parsing logic for Joined Date
      let joinedDate = null;
      const rawDate = normalizedRow["joined"] || normalizedRow["joined date"] || normalizedRow["date joined"];
      if (rawDate) {
        if (typeof rawDate === 'number') {
          joinedDate = new Date((rawDate - 25569) * 86400 * 1000);
        } else {
          const parsedDate = new Date(rawDate);
          if (!isNaN(parsedDate.getTime())) {
            joinedDate = parsedDate;
          }
        }
      }

      return {
        studentId: normalizedRow["student id"] || normalizedRow["student_id"] || normalizedRow["studentid"] || normalizedRow["id"],
        fullname: normalizedRow["full name"] || normalizedRow["fullname"] || normalizedRow["name"],
        gender: normalizedRow["gender"],
        position: normalizedRow["position"] || null,
        yearLevel: normalizedRow["year level"] || normalizedRow["yearlevel"] || normalizedRow["year"] || null,
        email: normalizedRow["email"] || null,
        status: normalizedRow["status"] || "active",
        joinedAt: joinedDate,
      };
    }).filter(m => m.studentId && m.fullname);

    if (membersToProcess.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "No valid member data found in the file. Please check headers (Student ID, Full Name)." });
    }

    // Process each member using upsert to handle updates and creates
    const operations = membersToProcess.map(async (member) => {
      const { studentId, joinedAt, ...data } = member;

      return prisma.member.upsert({
        where: { studentId },
        update: {
          ...data,
          joinedAt: joinedAt || undefined // Only update joinedAt if provided in Excel
        },
        create: {
          studentId,
          ...data,
          joinedAt: joinedAt || new Date()
        },
      });
    });

    await Promise.all(operations);

    fs.unlinkSync(req.file.path);
    res.json({
      message: `Successfully processed ${membersToProcess.length} members. Existing records were updated and new ones were created based on the Excel data.`,
      processed: membersToProcess.length
    });

  } catch (e) {
    console.error(e);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Failed to import members from Excel." });
  }
}
