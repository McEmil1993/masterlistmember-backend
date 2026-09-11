# 🚀 Backend Module Guide: Adding a New Feature

This guide provides a step-by-step process for adding a new module (e.g., "Templates") to the backend.

## 🛠 Step-by-Step Implementation

### 1. Database Schema (`prisma/schema.prisma`)
First, define your new data model in the Prisma schema.

**Example:**
```prisma
model Template {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(150)
  content   String   @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  @@map("templates")
}
```

### 2. Database Migration
Run the following command to sync your schema with the database and create a migration file.
```bash
npx prisma migrate dev --name add_template_module
```
*Alternatively, for quick prototyping:* `npx prisma db push`

### 3. Create the Controller (`src/controllers/template.controller.js`)
Implement the business logic for your module. Follow the existing pattern of using `try-catch` blocks and Prisma.

**Example:**
```javascript
import prisma from "../config/prisma.js";

export async function getTemplates(req, res) {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(templates);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to fetch templates." });
  }
}

export async function createTemplate(req, res) {
  try {
    const { name, content } = req.body;
    if (!name || !content) {
      return res.status(422).json({ message: "Name and content are required." });
    }
    const template = await prisma.template.create({
      data: { name, content },
    });
    res.status(201).json(template);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to create template." });
  }
}
```

### 4. Create the Routes (`src/routes/template.routes.js`)
Define the API endpoints and link them to the controller.

**Example:**
```javascript
import { Router } from "express";
import { getTemplates, createTemplate } from "../controllers/template.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = Router();

// Apply auth middleware to all routes in this module
router.use(auth);

router.get("/", getTemplates);
router.post("/", createTemplate);

export default router;
```

### 5. Register Routes in Server (`src/server.js`)
Import and use the new router in the main server file.

**Example:**
```javascript
import templateRoutes from "./routes/template.routes.js";

// ... other imports

app.use("/api/templates", templateRoutes);
```
