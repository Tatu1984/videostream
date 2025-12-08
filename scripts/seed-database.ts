import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...\n')

  // Create sample users
  console.log('📝 Creating users...')
  const hashedPassword = await bcrypt.hash('password123', 10)

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john@example.com' },
      update: {},
      create: {
        email: 'john@example.com',
        name: 'John Creator',
        username: 'johncreator',
        password: hashedPassword,
        role: 'CREATOR',
        emailVerified: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: 'sarah@example.com' },
      update: {},
      create: {
        email: 'sarah@example.com',
        name: 'Sarah Gaming',
        username: 'sarahgaming',
        password: hashedPassword,
        role: 'CREATOR',
        emailVerified: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: 'mike@example.com' },
      update: {},
      create: {
        email: 'mike@example.com',
        name: 'Mike Music',
        username: 'mikemusic',
        password: hashedPassword,
        role: 'CREATOR',
        emailVerified: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        email: 'user@example.com',
        name: 'Regular User',
        username: 'regularuser',
        password: hashedPassword,
        role: 'USER',
        emailVerified: new Date(),
      },
    }),
  ])

  console.log(`✅ Created ${users.length} users`)

  // Create channels
  console.log('\n📺 Creating channels...')

  // First, delete existing channels and related data to avoid conflicts
  await prisma.channel.deleteMany({
    where: {
      handle: {
        in: ['techreviews', 'gamingpro', 'musicbeats'],
      },
    },
  })

  const channels = await Promise.all([
    prisma.channel.create({
      data: {
        name: 'Tech Reviews Daily',
        handle: 'techreviews',
        description: 'Latest tech reviews and unboxings',
        ownerId: users[0].id,
        verified: true,
        subscriberCount: 125000,
        videoCount: 0,
      },
    }),
    prisma.channel.create({
      data: {
        name: 'Gaming Pro',
        handle: 'gamingpro',
        description: 'Pro gaming content and tutorials',
        ownerId: users[1].id,
        verified: true,
        subscriberCount: 89000,
        videoCount: 0,
      },
    }),
    prisma.channel.create({
      data: {
        name: 'Music Beats',
        handle: 'musicbeats',
        description: 'Best music and beats',
        ownerId: users[2].id,
        verified: false,
        subscriberCount: 45000,
        videoCount: 0,
      },
    }),
  ])

  console.log(`✅ Created ${channels.length} channels`)

  // Create videos
  console.log('\n🎥 Creating videos...')
  const videosData = [
    // Tech channel videos
    {
      title: 'iPhone 15 Pro Max Review - Is It Worth It?',
      description: 'Complete review of the new iPhone 15 Pro Max with camera tests, performance benchmarks, and more!',
      channelId: channels[0].id,
      visibility: 'PUBLIC' as const,
      videoType: 'STANDARD' as const,
      processingStatus: 'COMPLETED' as const,
      duration: 1245,
      viewCount: 125000,
      likeCount: 8500,
      dislikeCount: 150,
      commentCount: 420,
      tags: ['tech', 'iphone', 'review', 'apple'],
      category: 'Technology',
      publishedAt: new Date('2024-01-15'),
    },
    {
      title: 'Best Budget Laptops 2024 - Top 5 Picks',
      description: 'My top picks for budget laptops in 2024. Perfect for students and professionals!',
      channelId: channels[0].id,
      visibility: 'PUBLIC' as const,
      videoType: 'STANDARD' as const,
      processingStatus: 'COMPLETED' as const,
      duration: 892,
      viewCount: 89000,
      likeCount: 6200,
      dislikeCount: 98,
      commentCount: 340,
      tags: ['tech', 'laptop', 'budget', '2024'],
      category: 'Technology',
      publishedAt: new Date('2024-01-20'),
    },
    {
      title: 'Samsung Galaxy S24 Ultra Unboxing!',
      description: 'Unboxing and first impressions of the Samsung Galaxy S24 Ultra',
      channelId: channels[0].id,
      visibility: 'PUBLIC' as const,
      videoType: 'STANDARD' as const,
      processingStatus: 'COMPLETED' as const,
      duration: 675,
      viewCount: 67000,
      likeCount: 4800,
      dislikeCount: 75,
      commentCount: 290,
      tags: ['tech', 'samsung', 'unboxing', 'android'],
      category: 'Technology',
      publishedAt: new Date('2024-02-01'),
    },

    // Gaming channel videos
    {
      title: 'How to Rank Up FAST in Valorant - Pro Tips',
      description: 'Learn the secrets to ranking up quickly in Valorant with these pro tips and tricks!',
      channelId: channels[1].id,
      visibility: 'PUBLIC' as const,
      videoType: 'STANDARD' as const,
      processingStatus: 'COMPLETED' as const,
      duration: 1456,
      viewCount: 245000,
      likeCount: 18500,
      dislikeCount: 340,
      commentCount: 1240,
      tags: ['gaming', 'valorant', 'tips', 'tutorial'],
      category: 'Gaming',
      publishedAt: new Date('2024-01-18'),
    },
    {
      title: 'Best Fortnite Settings for Competitive Play',
      description: 'Optimize your Fortnite settings for competitive gameplay',
      channelId: channels[1].id,
      visibility: 'PUBLIC' as const,
      videoType: 'STANDARD' as const,
      processingStatus: 'COMPLETED' as const,
      duration: 945,
      viewCount: 156000,
      likeCount: 11200,
      dislikeCount: 210,
      commentCount: 890,
      tags: ['gaming', 'fortnite', 'settings', 'competitive'],
      category: 'Gaming',
      publishedAt: new Date('2024-01-25'),
    },
    {
      title: 'NEW Battle Royale Game Review - Is it Better?',
      description: 'Reviewing the latest battle royale game and comparing it to the classics',
      channelId: channels[1].id,
      visibility: 'PUBLIC' as const,
      videoType: 'STANDARD' as const,
      processingStatus: 'COMPLETED' as const,
      duration: 1134,
      viewCount: 198000,
      likeCount: 14500,
      dislikeCount: 450,
      commentCount: 1050,
      tags: ['gaming', 'battle royale', 'review', 'new'],
      category: 'Gaming',
      publishedAt: new Date('2024-02-05'),
    },

    // Music channel videos
    {
      title: 'Chill Lofi Beats to Study/Relax - 1 Hour Mix',
      description: 'Perfect lofi hip hop beats for studying, working, or relaxing',
      channelId: channels[2].id,
      visibility: 'PUBLIC' as const,
      videoType: 'STANDARD' as const,
      processingStatus: 'COMPLETED' as const,
      duration: 3600,
      viewCount: 456000,
      likeCount: 32000,
      dislikeCount: 580,
      commentCount: 2340,
      tags: ['music', 'lofi', 'chill', 'study'],
      category: 'Music',
      publishedAt: new Date('2024-01-10'),
    },
    {
      title: 'Top 10 Trending Songs This Week',
      description: 'Check out the top 10 trending songs of this week!',
      channelId: channels[2].id,
      visibility: 'PUBLIC' as const,
      videoType: 'STANDARD' as const,
      processingStatus: 'COMPLETED' as const,
      duration: 1890,
      viewCount: 234000,
      likeCount: 16800,
      dislikeCount: 320,
      commentCount: 1450,
      tags: ['music', 'trending', 'top10', 'songs'],
      category: 'Music',
      publishedAt: new Date('2024-01-28'),
    },

    // Shorts
    {
      title: 'Quick iPhone Tip #shorts',
      description: 'Did you know about this iPhone feature?',
      channelId: channels[0].id,
      visibility: 'PUBLIC' as const,
      videoType: 'SHORT' as const,
      processingStatus: 'COMPLETED' as const,
      duration: 45,
      viewCount: 567000,
      likeCount: 45000,
      dislikeCount: 890,
      commentCount: 3400,
      tags: ['shorts', 'iphone', 'tip', 'tech'],
      category: 'Technology',
      publishedAt: new Date('2024-02-10'),
    },
    {
      title: 'Insane Gaming Clutch! #shorts',
      description: '1v5 clutch in Valorant!',
      channelId: channels[1].id,
      visibility: 'PUBLIC' as const,
      videoType: 'SHORT' as const,
      processingStatus: 'COMPLETED' as const,
      duration: 38,
      viewCount: 892000,
      likeCount: 67000,
      dislikeCount: 1200,
      commentCount: 5600,
      tags: ['shorts', 'gaming', 'clutch', 'valorant'],
      category: 'Gaming',
      publishedAt: new Date('2024-02-08'),
    },
  ]

  const videos = await Promise.all(
    videosData.map((data) => prisma.video.create({ data }))
  )

  console.log(`✅ Created ${videos.length} videos`)

  // Create comments
  console.log('\n💬 Creating comments...')
  const comments = await Promise.all([
    prisma.comment.create({
      data: {
        content: 'Great review! Very helpful',
        videoId: videos[0].id,
        userId: users[3].id,
        likeCount: 45,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'Thanks for this! Exactly what I needed',
        videoId: videos[3].id,
        userId: users[3].id,
        likeCount: 128,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'Best lofi mix on YouTube!',
        videoId: videos[6].id,
        userId: users[0].id,
        likeCount: 234,
      },
    }),
  ])

  console.log(`✅ Created ${comments.length} comments`)

  // Create flags (for moderation testing)
  console.log('\n🚩 Creating sample flags...')
  const flags = await Promise.all([
    prisma.flag.create({
      data: {
        targetType: 'VIDEO',
        targetId: videos[4].id,
        videoId: videos[4].id,
        reason: 'MISLEADING',
        comment: 'The title is misleading, the game is not actually better',
        reporterId: users[3].id,
        status: 'PENDING',
      },
    }),
    prisma.flag.create({
      data: {
        targetType: 'VIDEO',
        targetId: videos[5].id,
        videoId: videos[5].id,
        reason: 'SPAM',
        comment: 'This video contains spam links',
        reporterId: users[0].id,
        status: 'PENDING',
      },
    }),
    prisma.flag.create({
      data: {
        targetType: 'COMMENT',
        targetId: comments[0].id,
        commentId: comments[0].id,
        reason: 'HATEFUL_CONTENT',
        comment: 'Inappropriate language',
        reporterId: users[1].id,
        status: 'UNDER_REVIEW',
      },
    }),
  ])

  console.log(`✅ Created ${flags.length} flags`)

  // Create copyright claims
  console.log('\n©️  Creating copyright claims...')

  // First create a rights holder
  const rightsHolder = await prisma.rightsHolder.create({
    data: {
      name: 'Universal Music Group',
      email: 'copyright@umg.com',
      verified: true,
      companyName: 'Universal Music Group Inc.',
    },
  })

  const claims = await Promise.all([
    prisma.copyrightClaim.create({
      data: {
        videoId: videos[6].id,
        rightsHolderId: rightsHolder.id,
        claimType: 'MANUAL',
        description: 'This video contains copyrighted music from our catalog',
        status: 'PENDING',
      },
    }),
    prisma.copyrightClaim.create({
      data: {
        videoId: videos[7].id,
        rightsHolderId: rightsHolder.id,
        claimType: 'AUTOMATED',
        description: 'Automated copyright match detected',
        status: 'UPHELD',
      },
    }),
  ])

  console.log(`✅ Created ${claims.length} copyright claims`)

  // Create subscriptions
  console.log('\n👥 Creating subscriptions...')
  const subscriptions = await Promise.all([
    prisma.subscription.create({
      data: {
        userId: users[3].id,
        channelId: channels[0].id,
        notificationLevel: 'ALL',
      },
    }),
    prisma.subscription.create({
      data: {
        userId: users[3].id,
        channelId: channels[1].id,
        notificationLevel: 'PERSONALIZED',
      },
    }),
  ])

  console.log(`✅ Created ${subscriptions.length} subscriptions`)

  // Create watch history
  console.log('\n📺 Creating watch history...')
  const watchHistory = await Promise.all([
    prisma.watchHistory.create({
      data: {
        userId: users[3].id,
        videoId: videos[0].id,
        watchTime: 1000,
        completed: true,
      },
    }),
    prisma.watchHistory.create({
      data: {
        userId: users[3].id,
        videoId: videos[3].id,
        watchTime: 800,
        completed: false,
      },
    }),
  ])

  console.log(`✅ Created ${watchHistory.length} watch history entries`)

  console.log('\n✨ Database seeding completed!\n')
  console.log('📊 Summary:')
  console.log(`   - ${users.length} users created`)
  console.log(`   - ${channels.length} channels created`)
  console.log(`   - ${videos.length} videos created`)
  console.log(`   - ${comments.length} comments created`)
  console.log(`   - ${flags.length} flags created`)
  console.log(`   - ${claims.length} copyright claims created`)
  console.log(`   - ${subscriptions.length} subscriptions created`)
  console.log(`   - ${watchHistory.length} watch history entries created`)
  console.log('\n🎉 You can now explore the platform with sample data!')
  console.log('\n📝 Test Account Credentials:')
  console.log('   Email: user@example.com')
  console.log('   Password: password123')
  console.log('\n👮 Admin Account:')
  console.log('   Email: admin@metube.com')
  console.log('   Password: admin123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
