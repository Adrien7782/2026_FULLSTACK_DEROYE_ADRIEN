import { prisma } from "../lib/prisma.js";

const KEEP = ["UserAdy", "Adrien7782"];

const users = await prisma.user.findMany({ select: { id: true, username: true, role: true } });
console.log("Utilisateurs existants:", users.map((u) => `${u.username} (${u.role})`).join(", "));

const toDelete = users.filter((u) => !KEEP.includes(u.username));
if (toDelete.length === 0) {
  console.log("Aucun utilisateur à supprimer.");
} else {
  console.log("Suppression de:", toDelete.map((u) => u.username).join(", "));
  await prisma.user.deleteMany({ where: { id: { in: toDelete.map((u) => u.id) } } });
  console.log(`${toDelete.length} utilisateur(s) supprimé(s).`);
}

await prisma.$disconnect();
