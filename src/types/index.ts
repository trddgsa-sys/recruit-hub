import {
  Application,
  ApplicationStage,
  CandidateProfile,
  Company,
  Job,
  JobStatus,
  LocationType,
  Notification,
  RecruiterProfile,
  ReferralCode,
  ReferralUsage,
  SavedJob,
  User,
  UserRole,
} from '@prisma/client'

// Re-export Prisma enums
export { UserRole, JobStatus, LocationType, ApplicationStage }

// API Response type
export type ApiResponse<T = undefined> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Paginated response
export type PaginatedResponse<T> = ApiResponse<{
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}>

// Extended types with relations
export type UserWithProfile = User & {
  recruiterProfile?: RecruiterProfile | null
  candidateProfile?: CandidateProfile | null
}

export type JobWithCompany = Job & {
  company: Company
  _count?: {
    applications: number
    savedJobs: number
  }
}

export type JobPreview = {
  id: string
  title: string
  company: {
    name: string
    logo: string | null
    industry: string | null
  }
  location: string
  locationType: LocationType
  salaryMin: number | null
  salaryMax: number | null
  shortDescription: string
  experienceLevel: string
  skillTags: string[]
  status: JobStatus
  deadline: Date | null
  createdAt: Date
  applicationsCount: number
}

export type JobDetail = JobPreview & {
  fullDescription: string
  requirements: string
  responsibilities: string
  companyDetails: {
    id: string
    name: string
    logo: string | null
    website: string | null
    description: string | null
    industry: string | null
  }
}

export type ApplicationWithDetails = Application & {
  job: JobWithCompany
  candidate: Pick<User, 'id' | 'name' | 'email'> & {
    candidateProfile: CandidateProfile | null
  }
  recruiter?: Pick<User, 'id' | 'name' | 'email'> | null
}

export type ReferralCodeWithStats = ReferralCode & {
  _count: {
    usages: number
  }
}

export type RecruiterStats = {
  totalReferrals: number
  totalHires: number
  activeCodes: number
  totalCodes: number
  applicationsByStage: Record<ApplicationStage, number>
  recentApplications: ApplicationWithDetails[]
}

export type AdminStats = {
  totalUsers: number
  totalCandidates: number
  totalRecruiters: number
  totalCompanies: number
  totalJobs: number
  totalApplications: number
  hiredCount: number
  activeJobs: number
  applicationsByStage: Record<ApplicationStage, number>
  monthlyApplications: Array<{ month: string; count: number }>
  topCompanies: Array<{ name: string; jobCount: number; applicationCount: number }>
}

export type CandidateStats = {
  totalApplications: number
  savedJobs: number
  applicationsByStage: Record<ApplicationStage, number>
  recentApplications: ApplicationWithDetails[]
}

export interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRole
}

export interface NavigationItem {
  label: string
  href: string
  icon?: string
}
