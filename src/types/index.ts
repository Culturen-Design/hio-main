// ─── User & Auth ───────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  created_at: string
}

// ─── Business ──────────────────────────────────────────────────────────────
export type BusinessCategory =
  | "salon"
  | "barbershop"
  | "spa"
  | "restaurant"
  | "bakery"
  | "gym"
  | "plumber"
  | "electrician"
  | "cleaning"
  | "other"

export interface Business {
  id: string
  user_id: string
  name: string
  category: BusinessCategory
  description: string
  logo_url?: string
  primary_color: string
  font_style: "serif" | "sans-serif" | "monospace"
  published: boolean
  created_at: string
  updated_at: string
}

// ─── Services ──────────────────────────────────────────────────────────────
export interface Service {
  id: string
  business_id: string
  name: string
  description?: string
  duration_minutes?: number
  price: number
  currency: string
  image_url?: string
  is_active: boolean
  created_at: string
}

// ─── Products ──────────────────────────────────────────────────────────────
export interface Product {
  id: string
  business_id: string
  name: string
  description?: string
  price: number
  currency: string
  image_url?: string
  stock?: number
  is_active: boolean
  created_at: string
}

// ─── Team Members ──────────────────────────────────────────────────────────
export interface TeamMember {
  id: string
  business_id: string
  name: string
  role: string
  bio?: string
  photo_url?: string
  created_at: string
}

// ─── Assets ────────────────────────────────────────────────────────────────
export interface Asset {
  id: string
  business_id: string
  url: string
  filename: string
  type: "logo" | "service_image" | "product_image" | "team_photo" | "gallery"
  created_at: string
}

// ─── Leads / Contact Form ──────────────────────────────────────────────────
export interface Lead {
  id: string
  business_id: string
  name: string
  email: string
  phone?: string
  message: string
  is_read: boolean
  created_at: string
}

// ─── Website JSON Structure ────────────────────────────────────────────────
export interface WebsiteSection {
  id: string
  type: "hero" | "services" | "about" | "testimonials" | "contact" | "footer"
  content: Record<string, unknown>
  order: number
  is_visible: boolean
}

export interface WebsiteConfig {
  business_id: string
  sections: WebsiteSection[]
  seo: {
    title: string
    description: string
    og_image?: string
  }
  version: number
  updated_at: string
}

// ─── Version History ───────────────────────────────────────────────────────
export interface WebsiteVersion {
  id: string
  business_id: string
  config_snapshot: WebsiteConfig
  created_by: "user" | "ai"
  ai_action?: string
  created_at: string
}

// ─── Onboarding ────────────────────────────────────────────────────────────
export interface OnboardingData {
  step1: {
    businessName: string
    category: BusinessCategory
  }
  step2: {
    primaryColor: string
    fontStyle: "serif" | "sans-serif" | "monospace"
    logoUrl?: string
  }
  step3: {
    description: string
    mainService?: string
  }
}
