const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateHrName() {
  const hrUser = await prisma.user.findUnique({
    where: { email: 'hr@hrms.com' },
    include: { employee: true },
  });

  if (!hrUser || !hrUser.employee) {
    console.error('HR user or employee profile not found!');
    return;
  }

  const updated = await prisma.employee.update({
    where: { id: hrUser.employee.id },
    data: {
      firstName: 'Giri',
      lastName: '',
    },
  });

  console.log(`HR Name successfully updated!`);
  console.log(`Employee Code: ${updated.employeeCode}`);
  console.log(`Full Name: ${updated.firstName} ${updated.lastName}`);
  console.log(`Department: ${updated.department}`);
  console.log(`Designation: ${updated.designation}`);
}

updateHrName()
  .catch((err) => console.error('Update failed:', err))
  .finally(async () => {
    await prisma.$disconnect();
  });
