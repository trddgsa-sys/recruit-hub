import { PrismaClient, UserRole, JobStatus, LocationType } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clean existing data in correct order
  await prisma.notification.deleteMany()
  await prisma.savedJob.deleteMany()
  await prisma.application.deleteMany()
  await prisma.referralUsage.deleteMany()
  await prisma.referralCode.deleteMany()
  await prisma.job.deleteMany()
  await prisma.company.deleteMany()
  await prisma.recruiterProfile.deleteMany()
  await prisma.candidateProfile.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Cleared existing data')

  // Create Admin
  const adminPassword = await hash('admin123!', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@recruithub.com',
      passwordHash: adminPassword,
      name: 'Platform Admin',
      role: UserRole.ADMIN,
    },
  })
  console.log('✅ Admin created:', admin.email)

  // Create Recruiter
  const recruiterPassword = await hash('recruiter123!', 12)
  const recruiter = await prisma.user.create({
    data: {
      email: 'recruiter@recruithub.com',
      passwordHash: recruiterPassword,
      name: 'Sarah Johnson',
      role: UserRole.RECRUITER,
    },
  })

  await prisma.recruiterProfile.create({
    data: {
      userId: recruiter.id,
      bio: 'Senior technical recruiter with 8+ years experience in tech recruitment.',
      totalReferrals: 0,
      totalHires: 0,
    },
  })

  // Create referral code for recruiter
  const referralCode = await prisma.referralCode.create({
    data: {
      code: 'REC-DEMO01',
      recruiterId: recruiter.id,
      usageLimit: 50,
      usageCount: 0,
      isActive: true,
    },
  })
  console.log('✅ Recruiter created:', recruiter.email, '| Referral code:', referralCode.code)

  // Create Candidate
  const candidatePassword = await hash('candidate123!', 12)
  const candidate = await prisma.user.create({
    data: {
      email: 'candidate@recruithub.com',
      passwordHash: candidatePassword,
      name: 'Alex Chen',
      role: UserRole.CANDIDATE,
    },
  })

  await prisma.candidateProfile.create({
    data: {
      userId: candidate.id,
      phone: '+1 (555) 234-5678',
      skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
      experience: '5 years of full-stack development experience.',
      education: 'B.S. Computer Science, MIT',
      portfolioLinks: ['https://github.com/alexchen', 'https://alexchen.dev'],
    },
  })
  console.log('✅ Candidate created:', candidate.email)

  // Create Companies
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'TechCorp',
        website: 'https://techcorp.example.com',
        description: 'Leading technology company building the future of cloud computing and AI.',
        industry: 'Technology',
      },
    }),
    prisma.company.create({
      data: {
        name: 'FinanceHub',
        website: 'https://financehub.example.com',
        description: 'Innovative fintech company revolutionizing digital payments.',
        industry: 'Finance',
      },
    }),
    prisma.company.create({
      data: {
        name: 'GreenEnergy Solutions',
        website: 'https://greenenergy.example.com',
        description: 'Sustainable energy company pioneering clean tech solutions.',
        industry: 'Energy',
      },
    }),
    prisma.company.create({
      data: {
        name: 'HealthFirst',
        website: 'https://healthfirst.example.com',
        description: 'Digital health platform connecting patients with healthcare providers.',
        industry: 'Healthcare',
      },
    }),
  ])
  console.log(`✅ ${companies.length} companies created`)

  // Create Jobs
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: 'Senior Full-Stack Engineer',
        companyId: companies[0].id,
        location: 'San Francisco, CA',
        locationType: LocationType.HYBRID,
        salaryMin: 180000,
        salaryMax: 250000,
        shortDescription: 'Join our core engineering team to build scalable cloud infrastructure and developer tools.',
        fullDescription: `We are looking for a Senior Full-Stack Engineer to join our core platform team. You will work on building and scaling our cloud infrastructure that serves millions of developers worldwide.

You will be responsible for designing and implementing new features, optimizing performance, and mentoring junior engineers. Our tech stack includes React, Node.js, PostgreSQL, Redis, and Kubernetes.`,
        requirements: `• 5+ years of full-stack development experience
• Strong proficiency in TypeScript, React, and Node.js
• Experience with PostgreSQL and Redis
• Familiarity with cloud services (AWS, GCP, or Azure)
• Experience with containerization and orchestration (Docker, Kubernetes)
• Strong problem-solving and communication skills`,
        responsibilities: `• Design and implement new platform features
• Optimize application performance and scalability
• Participate in code reviews and architectural discussions
• Mentor junior team members
• Collaborate with product and design teams
• On-call rotation for production systems`,
        experienceLevel: 'Senior',
        skillTags: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Kubernetes', 'AWS'],
        status: JobStatus.FEATURED,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.job.create({
      data: {
        title: 'Product Manager',
        companyId: companies[0].id,
        location: 'Remote',
        locationType: LocationType.REMOTE,
        salaryMin: 150000,
        salaryMax: 200000,
        shortDescription: 'Lead product strategy for our developer tools platform serving 2M+ users.',
        fullDescription: `We are seeking an experienced Product Manager to lead our developer tools product line. You will define the product vision, strategy, and roadmap while working closely with engineering, design, and sales teams.

The ideal candidate has a strong technical background and a passion for developer experience.`,
        requirements: `• 4+ years of product management experience
• Technical background or degree in Computer Science
• Experience with developer tools or B2B SaaS
• Strong analytical and communication skills
• Experience with agile methodologies`,
        responsibilities: `• Define product vision and strategy
• Prioritize features based on user research and data
• Work with engineering teams on delivery
• Conduct user research and competitive analysis
• Define and track KPIs`,
        experienceLevel: 'Mid',
        skillTags: ['Product Management', 'Agile', 'B2B SaaS', 'User Research'],
        status: JobStatus.ACTIVE,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.job.create({
      data: {
        title: 'Backend Engineer - Payments',
        companyId: companies[1].id,
        location: 'New York, NY',
        locationType: LocationType.ONSITE,
        salaryMin: 160000,
        salaryMax: 220000,
        shortDescription: 'Build and scale our payment processing infrastructure handling billions in transactions.',
        fullDescription: `Join our payments team to build reliable, secure, and scalable payment processing systems. You will work on mission-critical infrastructure that handles billions of dollars in transactions annually.

This role requires deep knowledge of distributed systems and a security-first mindset.`,
        requirements: `• 4+ years of backend engineering experience
• Strong knowledge of Java, Go, or Python
• Experience with payment systems or financial services
• Understanding of distributed systems patterns
• Knowledge of security best practices
• Experience with message queues (Kafka, RabbitMQ)`,
        responsibilities: `• Design and implement payment processing flows
• Ensure system reliability and compliance
• Optimize transaction latency and throughput
• Implement fraud detection mechanisms
• Participate in PCI compliance audits`,
        experienceLevel: 'Senior',
        skillTags: ['Go', 'Java', 'Kafka', 'PostgreSQL', 'Payments', 'Security'],
        status: JobStatus.FEATURED,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.job.create({
      data: {
        title: 'Data Scientist',
        companyId: companies[2].id,
        location: 'Austin, TX',
        locationType: LocationType.HYBRID,
        salaryMin: 130000,
        salaryMax: 180000,
        shortDescription: 'Apply ML/AI to optimize energy grid efficiency and predict renewable energy output.',
        fullDescription: `We are looking for a Data Scientist to join our analytics team. You will apply machine learning techniques to optimize energy distribution, predict renewable energy output, and identify patterns in energy consumption.

This is an impactful role where your work directly contributes to a more sustainable future.`,
        requirements: `• 3+ years of data science experience
• Strong knowledge of Python and ML frameworks
• Experience with time-series analysis
• Familiarity with energy systems is a plus
• Strong statistical background
• Experience with big data tools (Spark, Hadoop)`,
        responsibilities: `• Build and deploy ML models for energy optimization
• Analyze energy consumption patterns
• Create dashboards and reports
• Collaborate with engineering teams
• Present findings to stakeholders`,
        experienceLevel: 'Mid',
        skillTags: ['Python', 'Machine Learning', 'TensorFlow', 'Data Analysis', 'SQL'],
        status: JobStatus.ACTIVE,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.job.create({
      data: {
        title: 'UX Designer',
        companyId: companies[3].id,
        location: 'Remote',
        locationType: LocationType.REMOTE,
        salaryMin: 110000,
        salaryMax: 150000,
        shortDescription: 'Design intuitive healthcare experiences that improve patient outcomes.',
        fullDescription: `Join our design team to create beautiful, accessible, and intuitive healthcare experiences. You will work on our patient-facing applications used by millions of people to manage their health.

We believe great design can save lives, and you will be at the forefront of making healthcare more accessible.`,
        requirements: `• 3+ years of UX/UI design experience
• Strong portfolio demonstrating user-centered design
• Proficiency in Figma and prototyping tools
• Experience with design systems
• Knowledge of accessibility standards (WCAG)
• Healthcare experience is a plus`,
        responsibilities: `• Conduct user research and usability testing
• Create wireframes, prototypes, and high-fidelity designs
• Maintain and evolve our design system
• Collaborate with PMs and engineers
• Ensure accessibility compliance`,
        experienceLevel: 'Mid',
        skillTags: ['Figma', 'UX Research', 'Design Systems', 'Accessibility', 'Prototyping'],
        status: JobStatus.ACTIVE,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      },
    }),
  ])
  console.log(`✅ ${jobs.length} jobs created`)

  // Create a sample application
  await prisma.application.create({
    data: {
      jobId: jobs[0].id,
      candidateId: candidate.id,
      recruiterId: recruiter.id,
      stage: 'UNDER_REVIEW',
      notes: 'Strong candidate with excellent technical background.',
    },
  })
  console.log('✅ Sample application created')

  // Create notification
  await prisma.notification.create({
    data: {
      userId: candidate.id,
      type: 'APPLICATION_SUBMITTED',
      message: `Your application for ${jobs[0].title} at TechCorp has been submitted.`,
    },
  })

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Test Accounts:')
  console.log('  Admin:     admin@recruithub.com     / admin123!')
  console.log('  Recruiter: recruiter@recruithub.com / recruiter123!')
  console.log('  Candidate: candidate@recruithub.com / candidate123!')
  console.log(`\n🔑 Referral Code: ${referralCode.code}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
