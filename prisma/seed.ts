import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const hash = await bcrypt.hash("changeme123", 10);
  const user = await prisma.user.upsert({
    where: { email: "admin@agency.crm" },
    update: {},
    create: {
      email: "admin@agency.crm",
      passwordHash: hash,
      name: "Admin User",
    },
  });
  console.log("Created user:", user.email);

  // Create default pipeline
  const pipeline = await prisma.pipeline.upsert({
    where: { id: "default-pipeline" },
    update: {},
    create: {
      id: "default-pipeline",
      name: "Sales Pipeline",
      isDefault: true,
      stages: {
        create: [
          { name: "Prospecting", order: 0, probability: 10 },
          { name: "Qualified", order: 1, probability: 20 },
          { name: "Proposal Sent", order: 2, probability: 50 },
          { name: "Negotiation", order: 3, probability: 75 },
          { name: "Closed Won", order: 4, probability: 100 },
          { name: "Closed Lost", order: 5, probability: 0 },
        ],
      },
    },
    include: { stages: true },
  });
  console.log("Created pipeline:", pipeline.name, "with", pipeline.stages.length, "stages");

  // Sample data
  const company = await prisma.company.create({
    data: {
      name: "Acme Corp",
      domain: "acme.com",
      industry: "Technology",
      size: "51-200",
      city: "San Francisco",
      country: "USA",
      ownerId: user.id,
    },
  });

  const contact = await prisma.contact.create({
    data: {
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@acme.com",
      phone: "+1 555-0100",
      jobTitle: "VP of Sales",
      companyId: company.id,
      lifecycleStage: "opportunity",
      ownerId: user.id,
    },
  });

  const stage = pipeline.stages.find((s) => s.name === "Proposal Sent")!;
  await prisma.deal.create({
    data: {
      name: "Acme Corp — Enterprise Deal",
      amount: 50000,
      closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      stageId: stage.id,
      pipelineId: pipeline.id,
      companyId: company.id,
      ownerId: user.id,
      contacts: { create: { contactId: contact.id } },
    },
  });

  await prisma.activity.create({
    data: {
      type: "CALL",
      subject: "Intro call with John",
      body: "Discussed their needs for a CRM solution. Very interested.",
      durationMin: 30,
      outcome: "connected",
      direction: "outbound",
      contactId: contact.id,
      userId: user.id,
    },
  });

  console.log("Sample data created");
  console.log("\nLogin credentials:");
  console.log("  Email: admin@agency.crm");
  console.log("  Password: changeme123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
