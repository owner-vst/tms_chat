const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Create users
  const user1 = await prisma.user.create({
    data: {
      name: 'Alice',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Bob',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'Charlie',
    },
  });

  // Create messages between users
  await prisma.message.createMany({
    data: [
      {
        senderId: user1.id,
        receiverId: user2.id,
        message: 'Hey Bob!',
        status: 'unread',
      },
      {
        senderId: user2.id,
        receiverId: user1.id,
        message: 'Hey Alice! How are you?',
        status: 'unread',
      },
      {
        senderId: user1.id,
        receiverId: user3.id,
        message: 'Hello Charlie!',
        status: 'unread',
      },
      {
        senderId: user3.id,
        receiverId: user1.id,
        message: 'Hi Alice! What’s up?',
        status: 'read',
      },
      {
        senderId: user2.id,
        receiverId: user3.id,
        message: 'Charlie, want to grab lunch?',
        status: 'unread',
      },
      {
        senderId: user3.id,
        receiverId: user2.id,
        message: 'Sure, Bob. Let’s go!',
        status: 'read',
      },
    ],
  });

  console.log('Seeding complete!');
}

// Run the main function and handle errors
main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
