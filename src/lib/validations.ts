import { z } from 'zod'
import { ApplicationStage, JobStatus, LocationType, UserRole } from '@prisma/client'

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.nativeEnum(UserRole).default(UserRole.CANDIDATE),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Company schemas
export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(200),
  logo: z.string().url('Invalid URL').optional().nullable(),
  website: z.string().url('Invalid URL').optional().nullable(),
  description: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
})

export const updateCompanySchema = createCompanySchema.partial()

// Job schemas
export const createJobSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(200),
  companyId: z.string().uuid('Invalid company ID'),
  location: z.string().min(1, 'Location is required'),
  locationType: z.nativeEnum(LocationType).default(LocationType.ONSITE),
  salaryMin: z.number().int().positive().optional().nullable(),
  salaryMax: z.number().int().positive().optional().nullable(),
  shortDescription: z.string().min(10, 'Short description too short').max(500),
  fullDescription: z.string().min(50, 'Full description too short'),
  requirements: z.string().min(10, 'Requirements are required'),
  responsibilities: z.string().min(10, 'Responsibilities are required'),
  experienceLevel: z.string().min(1, 'Experience level is required'),
  skillTags: z.array(z.string()).default([]),
  deadline: z.string().datetime().optional().nullable(),
  status: z.nativeEnum(JobStatus).default(JobStatus.ACTIVE),
})

export const updateJobSchema = createJobSchema.partial()

export const jobFiltersSchema = z.object({
  search: z.string().optional(),
  location: z.string().optional(),
  companyId: z.string().optional(),
  locationType: z.nativeEnum(LocationType).optional(),
  status: z.nativeEnum(JobStatus).optional(),
  experienceLevel: z.string().optional(),
  skills: z.string().optional(),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})

// Referral code schemas
export const generateReferralCodeSchema = z.object({
  usageLimit: z.number().int().positive().max(1000).default(10),
  expiresAt: z.string().datetime().optional().nullable(),
})

export const validateReferralCodeSchema = z.object({
  code: z.string().min(1, 'Referral code is required'),
})

// Application schemas
export const createApplicationSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
  referralCode: z.string().optional(),
  resumeUrl: z.string().url('Invalid resume URL').optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export const updateApplicationStageSchema = z.object({
  stage: z.nativeEnum(ApplicationStage),
  notes: z.string().max(2000).optional().nullable(),
})

// Candidate profile schemas
export const updateCandidateProfileSchema = z.object({
  phone: z.string().optional().nullable(),
  resumeUrl: z.string().url('Invalid URL').optional().nullable(),
  skills: z.array(z.string()).default([]),
  experience: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  portfolioLinks: z.array(z.string().url('Invalid URL')).default([]),
})

// Recruiter profile schemas
export const updateRecruiterProfileSchema = z.object({
  bio: z.string().max(1000).optional().nullable(),
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// Aliases used by API routes (PascalCase variants)
export const UpdateStageSchema = updateApplicationStageSchema
export const CandidateProfileSchema = updateCandidateProfileSchema
export const CreateApplicationSchema = createApplicationSchema
export const CreateCompanySchema = createCompanySchema
export const UpdateCompanySchema = updateCompanySchema
export const CreateJobSchema = createJobSchema
export const UpdateJobSchema = updateJobSchema
export const JobFiltersSchema = jobFiltersSchema
export const PaginationSchema = paginationSchema
export const GenerateReferralCodeSchema = generateReferralCodeSchema
export const ValidateReferralCodeSchema = validateReferralCodeSchema
export const RegisterSchema = registerSchema
export const LoginSchema = loginSchema

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateCompanyInput = z.infer<typeof createCompanySchema>
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>
export type CreateJobInput = z.infer<typeof createJobSchema>
export type UpdateJobInput = z.infer<typeof updateJobSchema>
export type JobFiltersInput = z.infer<typeof jobFiltersSchema>
export type GenerateReferralCodeInput = z.infer<typeof generateReferralCodeSchema>
export type ValidateReferralCodeInput = z.infer<typeof validateReferralCodeSchema>
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>
export type UpdateApplicationStageInput = z.infer<typeof updateApplicationStageSchema>
export type UpdateCandidateProfileInput = z.infer<typeof updateCandidateProfileSchema>
export type UpdateRecruiterProfileInput = z.infer<typeof updateRecruiterProfileSchema>
