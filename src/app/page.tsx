'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Dumbbell,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Clock,
  MapPin,
  Phone,
  Mail,
  Waves,
  HeartPulse,
  Flame,
  Check,
  Calendar,
  X,
  AlertCircle,
  Loader2,
  Sparkles,
  Info,
  ChevronRight,
  User,
  Layers,
  Send,
  RefreshCw,
  Menu,
  Building2,
  UserCheck,
  MessageSquare,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { MembershipPlan } from '@/lib/types';

export default function LandingPage() {
  // Mobile navigation drawer toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal states
  const [activeModal, setActiveModal] = useState<'REGISTER' | 'TRIAL' | 'CONTACT' | null>(null);

  // Contact Department routing options
  const contactDepartments = [
    {
      id: 'FRONT_DESK',
      title: 'Front Desk & Reception Concierge',
      handler: 'Selam Tesfaye (Duty Receptionist)',
      roleDesc: 'General questions, operational hours, guest passes, facility tours',
    },
    {
      id: 'MANAGEMENT',
      title: 'General Management & Gym Owner Desk',
      handler: 'Dawit Bekele (Owner) & Abebe Bikila (GM)',
      roleDesc: 'Corporate memberships, executive partnerships, official feedback',
    },
    {
      id: 'COACHING',
      title: 'Head Coach & Training Department',
      handler: 'Coach Marcus Vance (Head of Strength & Conditioning)',
      roleDesc: '1-on-1 personal training, aquatic coaching, biomechanics reviews',
    },
    {
      id: 'BILLING',
      title: 'Finance & Billing Desk',
      handler: 'Tewodros Girma (Finance Officer)',
      roleDesc: 'Payment receipts, corporate invoicing, refund adjustments',
    },
  ];

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    selectedPackage: '',
    packageId: '',
    preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    interest: 'Gym Floor & Strength Arena',
    department: 'FRONT_DESK',
    subject: 'General Operations Inquiry',
    message: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<null | {
    id: string;
    source: string;
    createdAt: string;
    recipientName?: string;
  }>(null);

  // Packages data-driven state
  const [packages, setPackages] = useState<MembershipPlan[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);

  // Fetch data-driven packages
  const fetchPackages = async () => {
    setPackagesLoading(true);
    setPackagesError(null);
    try {
      const res = await fetch('/api/plans?tenantId=tenant-1');
      if (!res.ok) {
        throw new Error('Failed to load packages');
      }
      const data = await res.json();
      const activePlans = (data.plans || []).filter(
        (p: MembershipPlan) => p.isActive !== false && p.isPublished !== false
      );
      setPackages(activePlans);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading packages';
      setPackagesError(msg);
    } finally {
      setPackagesLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // Modal open helper
  const openModal = (
    type: 'REGISTER' | 'TRIAL' | 'CONTACT',
    packageDetails?: { name: string; id: string }
  ) => {
    setMobileMenuOpen(false);
    setFormErrors({});
    setSubmissionSuccess(null);
    setCopiedCode(false);

    if (packageDetails) {
      setFormData((prev) => ({
        ...prev,
        selectedPackage: packageDetails.name,
        packageId: packageDetails.id,
        interest: packageDetails.name,
      }));
    } else if (packages.length > 0 && !formData.selectedPackage) {
      setFormData((prev) => ({
        ...prev,
        selectedPackage: packages[0].name,
        packageId: packages[0].id,
      }));
    }
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSubmissionSuccess(null);
    setFormErrors({});
    setCopiedCode(false);
  };

  // Form Validation
  const validateForm = (type: 'REGISTER' | 'TRIAL' | 'CONTACT') => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }

    const cleanPhone = formData.phone.replace(/[\s\-\(\)\+]/g, '');
    if (!cleanPhone || cleanPhone.length < 5 || !/^\d+$/.test(cleanPhone)) {
      errors.phone = 'Please enter a valid phone number (minimum 5 digits).';
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please provide a valid email format or leave blank.';
      }
    }

    if (type === 'REGISTER' && !formData.selectedPackage) {
      errors.selectedPackage = 'Please select a membership package.';
    }

    if (type === 'TRIAL' && !formData.preferredDate) {
      errors.preferredDate = 'Please select your preferred trial visit date.';
    }

    if (type === 'CONTACT' && (!formData.message || formData.message.trim().length < 5)) {
      errors.message = 'Please provide a message with at least 5 characters.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submission
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    if (!validateForm(activeModal)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedDept = contactDepartments.find((d) => d.id === formData.department);
      const recipientName =
        activeModal === 'CONTACT'
          ? `${selectedDept?.title} (${selectedDept?.handler})`
          : 'Apex Athletic Club Reception Desk';

      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        source: activeModal,
        tenantId: 'tenant-1',
        selectedPackage: activeModal === 'REGISTER' ? formData.selectedPackage : undefined,
        packageId: activeModal === 'REGISTER' ? formData.packageId : undefined,
        preferredDate: activeModal === 'TRIAL' ? formData.preferredDate : undefined,
        interest:
          activeModal === 'TRIAL'
            ? formData.interest
            : activeModal === 'CONTACT'
            ? `Routing: ${selectedDept?.title}`
            : formData.selectedPackage || undefined,
        message:
          activeModal === 'CONTACT'
            ? `[To: ${selectedDept?.title} - ${selectedDept?.handler}]\nSubject: ${formData.subject}\n\n${formData.message.trim()}`
            : undefined,
      };

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit request');
      }

      setSubmissionSuccess({
        id: result.lead.id,
        source: activeModal,
        createdAt: result.lead.createdAt,
        recipientName,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setFormErrors((prev) => ({ ...prev, form: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Facility amenities specification
  const amenities = [
    {
      title: 'Cardio Deck & Biometric Theater',
      description: 'Connected treadmills, Concept2 rowers, assault bikes, and stairmasters with real-time biometric metrics.',
      icon: HeartPulse,
      highlight: '30+ Cardio Stations',
      access: 'All Memberships & Trial',
    },
    {
      title: 'Olympic Strength & Powerlifting Arena',
      description: 'Eleiko power racks, calibrated bumper plates, Olympic platforms, and dumbbell sets spanning 5kg to 50kg.',
      icon: Dumbbell,
      highlight: 'Pro Competition Spec',
      access: 'All Memberships & Trial',
    },
    {
      title: 'Heated 25m Olympic Lap Pool',
      description: 'Temperature-controlled lap pool with dedicated swim lanes, morning lap hours, and aquatic conditioning.',
      icon: Waves,
      highlight: '4 Heated Lap Lanes',
      access: 'Pro & Combo Packages',
    },
    {
      title: 'Finnish Cedar Sauna & Steam Suite',
      description: 'Authentic Finnish dry sauna, aromatic eucalyptus steam bath, and contrast therapy for muscle regeneration.',
      icon: Flame,
      highlight: 'Recovery & Hydrotherapy',
      access: 'Quarterly & VIP Tiers',
    },
    {
      title: 'Digital RFID Lockers & Rainfall Showers',
      description: 'Secure code-operated lockers, premium rainfall showers, towel service, and full vanity amenities.',
      icon: ShieldCheck,
      highlight: '120 Digital Lockers',
      access: 'All Memberships & Trial',
    },
    {
      title: 'Certified Performance Coaching',
      description: 'CSCS and NASM certified strength coaches providing structured technique assessment and progressive overloading.',
      icon: Sparkles,
      highlight: 'Bi-Weekly Body Audits',
      access: 'Pro & VIP Tiers',
    },
  ];

  // Coaching staff
  const trainers = [
    {
      name: 'Coach Marcus Vance',
      role: 'Head of Strength & Conditioning',
      specialty: 'Powerlifting, Hypertrophy & Athletic Periodization',
      experience: '9+ Years Experience',
      badge: 'CSCS Certified',
    },
    {
      name: 'Coach Selam Tesfaye',
      role: 'Aquatic & Endurance Specialist',
      specialty: 'Olympic Swimming, Triathlon Conditioning & Mobility',
      experience: '7+ Years Experience',
      badge: 'Master Swim Coach',
    },
    {
      name: 'Coach Dawit Bekele',
      role: 'Functional Fitness & Biomechanics',
      specialty: 'Functional Movement, Injury Prevention & Fat Loss',
      experience: '11+ Years Experience',
      badge: 'NASM-PES Certified',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1F2937] font-sans antialiased selection:bg-[#0F766E] selection:text-[#FFFFFF]">
      {/* ========================================================================= */}
      {/* RESPONSIVE NAVBAR: Usable from 320px mobile to 1440px desktop             */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-[#FFFFFF]/95 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto flex h-16 items-center justify-between px-3 sm:px-6 lg:px-8">
          {/* Brand Logo & Gym Identification */}
          <Link href="/" className="flex items-center gap-2.5 min-w-0" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F766E] text-[#FFFFFF] shrink-0">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[16px] sm:text-[18px] font-bold text-[#1F2937] tracking-tight truncate">
                  M Fitness & Gym
                </span>
                <span className="rounded border border-[#0F766E]/20 bg-[#F8FAFC] px-1.5 py-0.2 text-[10px] sm:text-[11px] font-semibold text-[#0F766E] shrink-0">
                  Figa Branch
                </span>
              </div>
              <p className="text-[11px] text-[#1F2937]/70 hidden md:block truncate">Figa Main Branch • 0961889867</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-[14px] leading-[20px] font-semibold text-[#1F2937]">
            <a href="#amenities" className="hover:text-[#0F766E] transition-colors">Amenities</a>
            <a href="#packages" className="hover:text-[#0F766E] transition-colors">Packages & Pricing</a>
            <a href="#coaches" className="hover:text-[#0F766E] transition-colors">Coaches</a>
            <a href="#schedule" className="hover:text-[#0F766E] transition-colors">Hours & Location</a>
            <Link href="/member-portal" className="text-[#0F766E] hover:underline">Member Pass</Link>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              onClick={() => openModal('TRIAL')}
              className="inline-flex items-center justify-center rounded-lg border border-[#1F2937] bg-[#FFFFFF] px-3 py-2 text-[13px] font-semibold text-[#1F2937] hover:bg-[#F8FAFC] transition-colors"
            >
              Book 1-Day Trial
            </button>

            <button
              onClick={() => openModal('REGISTER')}
              className="inline-flex items-center justify-center rounded-lg bg-[#0F766E] px-3.5 py-2 text-[13px] font-semibold text-[#FFFFFF] hover:bg-[#0F766E]/90 transition-colors shadow-sm"
            >
              <span>Register</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </button>
          </div>

          {/* Mobile Actions: Compact CTA + Hamburger Menu */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => openModal('TRIAL')}
              className="rounded-lg bg-[#0F766E] px-2.5 py-1.5 text-[12px] font-semibold text-[#FFFFFF] hover:bg-[#0F766E]/90 transition-colors shadow-sm shrink-0"
            >
              Book Trial
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#1F2937] hover:bg-[#F8FAFC] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E5E7EB] bg-[#FFFFFF] px-4 py-5 shadow-lg space-y-4 animate-in fade-in duration-150">
            {/* Active Gym Context */}
            <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#0F766E]" />
                <span className="text-[12px] font-bold text-[#1F2937]">M Fitness and Gym</span>
              </div>
              <p className="text-[11px] text-[#1F2937]/70 mt-0.5">Figa, Addis Ababa • Tel: 0961889867</p>
              <p className="text-[11px] text-[#0F766E] font-semibold mt-0.5">Open 06:00 – 22:00 Daily</p>
            </div>

            {/* Mobile Nav Links */}
            <div className="space-y-1 text-[14px] font-semibold text-[#1F2937]">
              <a
                href="#amenities"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2 px-2 rounded hover:bg-[#F8FAFC]"
              >
                <span>Facility Amenities</span>
                <ChevronRight className="h-4 w-4 text-[#1F2937]/40" />
              </a>
              <a
                href="#packages"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2 px-2 rounded hover:bg-[#F8FAFC]"
              >
                <span>Membership Packages</span>
                <ChevronRight className="h-4 w-4 text-[#1F2937]/40" />
              </a>
              <a
                href="#coaches"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2 px-2 rounded hover:bg-[#F8FAFC]"
              >
                <span>Coaches & Trainers</span>
                <ChevronRight className="h-4 w-4 text-[#1F2937]/40" />
              </a>
              <a
                href="#schedule"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2 px-2 rounded hover:bg-[#F8FAFC]"
              >
                <span>Hours & Location</span>
                <ChevronRight className="h-4 w-4 text-[#1F2937]/40" />
              </a>
              <Link
                href="/member-portal"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2 px-2 rounded text-[#0F766E] hover:bg-[#F8FAFC]"
              >
                <span>Member QR Pass PWA</span>
                <ChevronRight className="h-4 w-4 text-[#0F766E]" />
              </Link>
            </div>

            {/* Mobile CTAs */}
            <div className="pt-2 border-t border-[#E5E7EB] space-y-2">
              <button
                onClick={() => openModal('REGISTER')}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] py-2.5 text-[14px] font-semibold text-[#FFFFFF]"
              >
                <span>Register for Membership</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => openModal('CONTACT')}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#1F2937] bg-[#FFFFFF] py-2 text-[14px] font-semibold text-[#1F2937]"
              >
                <MessageSquare className="h-4 w-4 text-[#0F766E]" />
                <span>Contact Administration</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="border-b border-[#E5E7EB] bg-[#F8FAFC] py-14 sm:py-24">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Gym & Facility Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-[#FFFFFF] px-3.5 py-1 text-[11px] sm:text-[12px] font-semibold text-[#1F2937]">
            <span className="h-2 w-2 rounded-full bg-[#0F766E]" />
            <span>Apex Athletic Club • Bole Medhanealem Branch • Fully Digital Operations</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-[28px] sm:text-[46px] lg:text-[56px] leading-[1.15] font-bold text-[#1F2937] max-w-4xl mx-auto tracking-tight">
            Engineered for Peak Athletic Performance. Transparent Pricing. Zero Friction.
          </h1>

          {/* Subheading */}
          <p className="text-[15px] sm:text-[18px] leading-[24px] sm:leading-[28px] text-[#1F2937]/80 max-w-2xl mx-auto">
            Train at our premier Bole Medhanealem facility with Olympic-spec Eleiko racks, 25m heated lap swimming, Finnish dry saunas, and instant smartphone turnstile passes.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 max-w-md mx-auto">
            <button
              onClick={() => openModal('TRIAL')}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-[#0F766E] px-6 py-3 text-[14px] leading-[20px] font-semibold text-[#FFFFFF] hover:bg-[#0F766E]/90 transition-colors shadow-sm"
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span>Book Free 1-Day Trial</span>
            </button>

            <button
              onClick={() => openModal('REGISTER')}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-[#1F2937] bg-[#FFFFFF] px-6 py-3 text-[14px] leading-[20px] font-semibold text-[#1F2937] hover:bg-[#F8FAFC] transition-colors"
            >
              <span>View Packages</span>
              <ChevronRight className="ml-1.5 h-4 w-4 text-[#1F2937]/60" />
            </button>
          </div>

          {/* Key Facts Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-8 sm:pt-10 max-w-4xl mx-auto text-left">
            <div className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-3.5 sm:p-4">
              <span className="text-[11px] sm:text-[12px] font-semibold text-[#1F2937]/70 uppercase">Operating Hours</span>
              <p className="text-[15px] sm:text-[16px] font-bold text-[#1F2937] mt-0.5">06:00 – 22:00</p>
              <p className="text-[11px] text-[#1F2937]/70">Open 365 Days a Year</p>
            </div>
            <div className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-3.5 sm:p-4">
              <span className="text-[11px] sm:text-[12px] font-semibold text-[#1F2937]/70 uppercase">Access Technology</span>
              <p className="text-[15px] sm:text-[16px] font-bold text-[#1F2937] mt-0.5">Sub-Second QR Pass</p>
              <p className="text-[11px] text-[#1F2937]/70">Dynamic Turnstile Validation</p>
            </div>
            <div className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-3.5 sm:p-4">
              <span className="text-[11px] sm:text-[12px] font-semibold text-[#1F2937]/70 uppercase">Facility Scale</span>
              <p className="text-[15px] sm:text-[16px] font-bold text-[#1F2937] mt-0.5">1,800 m² Complex</p>
              <p className="text-[11px] text-[#1F2937]/70">Weights, Pool, Saunas & Turf</p>
            </div>
            <div className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-3.5 sm:p-4">
              <span className="text-[11px] sm:text-[12px] font-semibold text-[#1F2937]/70 uppercase">Duty Front Desk</span>
              <p className="text-[15px] sm:text-[16px] font-bold text-[#1F2937] mt-0.5">Live Concierge</p>
              <p className="text-[11px] text-[#1F2937]/70">+251 91 122 3344</p>
            </div>
          </div>
        </div>
      </section>

      {/* Facility Amenities Section */}
      <section id="amenities" className="py-16 sm:py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="text-[12px] leading-[16px] font-bold uppercase tracking-wider text-[#0F766E]">
            Infrastructure & Equipment
          </span>
          <h2 className="text-[26px] sm:text-[36px] leading-[34px] sm:leading-[44px] font-bold text-[#1F2937]">
            World-Class Facility Amenities
          </h2>
          <p className="text-[14px] sm:text-[16px] leading-[22px] sm:leading-[24px] text-[#1F2937]/70">
            Available at Apex Athletic Club (Bole Medhanealem) for strength training, cardiovascular endurance, and recovery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {amenities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-5 sm:p-6 flex flex-col justify-between hover:border-[#0F766E] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#0F766E]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded border border-[#E5E7EB] bg-[#F8FAFC] px-2.5 py-0.5 text-[11px] sm:text-[12px] font-semibold text-[#1F2937]">
                      {item.highlight}
                    </span>
                  </div>
                  <h3 className="text-[17px] sm:text-[18px] font-bold text-[#1F2937]">{item.title}</h3>
                  <p className="text-[13px] sm:text-[14px] text-[#1F2937]/70 mt-2">{item.description}</p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-[#E5E7EB] flex items-center justify-between text-[12px]">
                  <span className="text-[#1F2937]/70">Service Access:</span>
                  <span className="font-semibold text-[#0F766E]">{item.access}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Transparent Membership Packages (Data-Driven) */}
      <section id="packages" className="py-16 sm:py-20 border-y border-[#E5E7EB] bg-[#F8FAFC]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-10 sm:mb-12">
            <span className="text-[12px] leading-[16px] font-bold uppercase tracking-wider text-[#0F766E]">
              Data-Driven Tiers
            </span>
            <h2 className="text-[26px] sm:text-[36px] leading-[34px] sm:leading-[44px] font-bold text-[#1F2937]">
              Transparent Membership Packages
            </h2>
            <p className="text-[14px] sm:text-[16px] leading-[22px] sm:leading-[24px] text-[#1F2937]/70">
              Clear billing periods, verified benefits, included facility access, and transparent pricing with no hidden administration fees.
            </p>
          </div>

          {/* Loading State */}
          {packagesLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-6 space-y-4 animate-pulse">
                  <div className="h-5 w-24 bg-[#E5E7EB] rounded" />
                  <div className="h-8 w-32 bg-[#E5E7EB] rounded" />
                  <div className="h-4 w-full bg-[#E5E7EB] rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!packagesLoading && packagesError && (
            <div className="rounded-lg border border-[#1F2937] bg-[#FFFFFF] p-8 text-center max-w-md mx-auto space-y-4">
              <AlertCircle className="h-8 w-8 text-[#1F2937] mx-auto" />
              <div>
                <h3 className="text-[18px] font-bold text-[#1F2937]">Unable to load packages</h3>
                <p className="text-[14px] text-[#1F2937]/70 mt-1">{packagesError}</p>
              </div>
              <button
                onClick={fetchPackages}
                className="inline-flex items-center justify-center rounded-lg bg-[#0F766E] px-4 py-2 text-[14px] font-semibold text-[#FFFFFF] hover:bg-[#0F766E]/90"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!packagesLoading && !packagesError && packages.length === 0 && (
            <div className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-12 text-center max-w-lg mx-auto space-y-4">
              <Layers className="h-10 w-10 text-[#1F2937]/40 mx-auto" />
              <div>
                <h3 className="text-[18px] font-bold text-[#1F2937]">No Packages Published Yet</h3>
                <p className="text-[14px] text-[#1F2937]/70 mt-1">
                  Our management is currently configuring updated membership tiers. Please contact administration for custom rates.
                </p>
              </div>
              <button
                onClick={() => openModal('CONTACT')}
                className="inline-flex items-center justify-center rounded-lg bg-[#0F766E] px-4 py-2 text-[14px] font-semibold text-[#FFFFFF]"
              >
                Contact Front Desk
              </button>
            </div>
          )}

          {/* Packages Grid */}
          {!packagesLoading && !packagesError && packages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`rounded-lg p-5 sm:p-6 flex flex-col justify-between transition-all bg-[#FFFFFF] ${
                    pkg.isPopular
                      ? 'border-2 border-[#D97706] relative shadow-sm'
                      : 'border border-[#E5E7EB] hover:border-[#1F2937]'
                  }`}
                >
                  {pkg.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded bg-[#D97706] px-3 py-0.5 text-[11px] font-bold uppercase text-[#FFFFFF]">
                      Most Popular
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[18px] font-bold text-[#1F2937]">{pkg.name}</h3>
                      <span className="rounded border border-[#E5E7EB] bg-[#F8FAFC] px-2 py-0.5 text-[11px] font-semibold text-[#1F2937]">
                        {pkg.billingPeriod || (pkg.durationDays === 1 ? '1 Day' : `${pkg.durationDays} Days`)}
                      </span>
                    </div>

                    <p className="text-[12px] text-[#1F2937]/70 mt-1 min-h-[32px]">
                      {pkg.description || 'Full facility access with digital access credentials.'}
                    </p>

                    {/* Price */}
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-[32px] font-bold text-[#1F2937]">ETB {pkg.price.toLocaleString()}</span>
                      <span className="text-[13px] text-[#1F2937]/70">
                        /{pkg.billingPeriod ? pkg.billingPeriod.toLowerCase() : 'term'}
                      </span>
                    </div>

                    {pkg.admissionFee > 0 && (
                      <p className="text-[12px] text-[#1F2937]/60 mt-0.5">
                        One-time admission: ETB {pkg.admissionFee.toLocaleString()}
                      </p>
                    )}

                    {/* Included Services Tags */}
                    {pkg.includedServices && pkg.includedServices.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {pkg.includedServices.map((svc, sIdx) => (
                          <span
                            key={sIdx}
                            className="rounded bg-[#F8FAFC] border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-semibold text-[#1F2937]"
                          >
                            {svc}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Benefits List */}
                    <div className="mt-5 border-t border-[#E5E7EB] pt-4">
                      <span className="text-[11px] font-bold text-[#1F2937] uppercase tracking-wider block mb-2">
                        Included Benefits
                      </span>
                      <ul className="space-y-2 text-[12px] text-[#1F2937]">
                        {(pkg.benefits && pkg.benefits.length > 0
                          ? pkg.benefits
                          : [
                              'Full access to gym floor & free weights',
                              'Sub-second QR turnstile check-in',
                              'Locker room & shower access',
                            ]
                        ).map((b, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-[#0F766E] shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Restrictions List */}
                    {pkg.restrictions && pkg.restrictions.length > 0 && (
                      <div className="mt-4 border-t border-[#E5E7EB] pt-3">
                        <span className="text-[11px] font-bold text-[#1F2937]/80 uppercase tracking-wider block mb-1">
                          Terms & Conditions
                        </span>
                        <ul className="space-y-1 text-[12px] text-[#1F2937]/70">
                          {pkg.restrictions.map((r, rIdx) => (
                            <li key={rIdx} className="flex items-start gap-1.5">
                              <Info className="h-3.5 w-3.5 text-[#1F2937]/50 shrink-0 mt-0.5" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="mt-6 pt-4 border-t border-[#E5E7EB]">
                    <button
                      onClick={() => openModal('REGISTER', { name: pkg.name, id: pkg.id })}
                      className={`w-full rounded-lg py-2.5 text-[13px] font-semibold transition-colors ${
                        pkg.isPopular
                          ? 'bg-[#0F766E] text-[#FFFFFF] hover:bg-[#0F766E]/90 shadow-sm'
                          : 'border border-[#1F2937] bg-[#FFFFFF] text-[#1F2937] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      Register with this Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Certified Coaches & Mentors */}
      <section id="coaches" className="py-16 sm:py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="text-[12px] leading-[16px] font-bold uppercase tracking-wider text-[#0F766E]">
            Expert Guidance
          </span>
          <h2 className="text-[26px] sm:text-[36px] leading-[34px] sm:leading-[44px] font-bold text-[#1F2937]">
            Certified Coaching Staff
          </h2>
          <p className="text-[14px] sm:text-[16px] leading-[22px] sm:leading-[24px] text-[#1F2937]/70">
            Available at Apex Athletic Club for personalized training, aquatic technique, and progressive overloading.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trainers.map((t, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-6 flex flex-col justify-between hover:border-[#1F2937] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded bg-[#F8FAFC] border border-[#E5E7EB] px-2.5 py-0.5 text-[11px] font-semibold text-[#0F766E]">
                    {t.badge}
                  </span>
                  <span className="text-[12px] text-[#1F2937]/70">{t.experience}</span>
                </div>
                <h3 className="text-[18px] font-bold text-[#1F2937]">{t.name}</h3>
                <p className="text-[13px] font-semibold text-[#0F766E] mt-0.5">{t.role}</p>
                <p className="text-[13px] text-[#1F2937]/70 mt-3">{t.specialty}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E5E7EB]">
                <button
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      interest: `1-on-1 Consultation with ${t.name}`,
                    }));
                    openModal('TRIAL');
                  }}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] py-2 text-[12px] font-semibold text-[#1F2937] hover:bg-[#E5E7EB] transition-colors"
                >
                  Book Assessment with {t.name.split(' ')[1]}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Operational Hours, Location & Front Desk */}
      <section id="schedule" className="py-16 border-t border-[#E5E7EB] bg-[#F8FAFC]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 items-start">
            {/* Location & Contacts */}
            <div className="space-y-5">
              <div>
                <span className="text-[12px] leading-[16px] font-bold uppercase tracking-wider text-[#0F766E]">
                  Visit The Facility
                </span>
                <h2 className="text-[26px] sm:text-[28px] font-bold text-[#1F2937] mt-1">
                  M Fitness and Gym — Figa Branch
                </h2>
                <p className="text-[14px] text-[#1F2937]/70 mt-1">
                  Main operations hub, reception turnstiles, and administration offices.
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-4">
                  <MapPin className="h-5 w-5 text-[#0F766E] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[14px] font-bold text-[#1F2937]">Facility Address</h4>
                    <p className="text-[13px] text-[#1F2937]/70">Figa, Addis Ababa, Ethiopia</p>
                    <p className="text-[11px] text-[#1F2937]/50 mt-0.5">Figa Main Center • Dedicated member parking & locker access</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-4">
                  <Phone className="h-5 w-5 text-[#0F766E] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[14px] font-bold text-[#1F2937]">Reception & Concierge Desk</h4>
                    <p className="text-[13px] text-[#1F2937]/70">0961889867</p>
                    <p className="text-[11px] text-[#1F2937]/50 mt-0.5">Duty Staff: Reception Desk • Call anytime during 06:00 – 22:00</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-4">
                  <Mail className="h-5 w-5 text-[#0F766E] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[14px] font-bold text-[#1F2937]">Administration & Management</h4>
                    <p className="text-[13px] text-[#1F2937]/70">operations@apexathletic.com</p>
                    <p className="text-[11px] text-[#1F2937]/50 mt-0.5">General Manager: Abebe Bikila • Gym Owner: Dawit Bekele</p>
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => openModal('CONTACT')}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1F2937] px-5 py-2.5 text-[14px] font-semibold text-[#FFFFFF] hover:bg-[#1F2937]/90 transition-colors shadow-sm"
                >
                  <Send className="h-4 w-4 text-[#0F766E]" />
                  <span>Send Direct Inquiry to Staff</span>
                </button>
              </div>
            </div>

            {/* Operational Schedule Table */}
            <div className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-5 sm:p-6 space-y-4">
              <h3 className="text-[18px] font-bold text-[#1F2937] flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#0F766E]" />
                <span>Verified Operational Schedule</span>
              </h3>

              <div className="divide-y divide-[#E5E7EB] text-[13px] sm:text-[14px]">
                <div className="py-2.5 sm:py-3 flex justify-between items-center">
                  <span className="font-semibold text-[#1F2937]">Monday – Friday</span>
                  <span className="font-mono font-bold text-[#0F766E]">06:00 – 22:00</span>
                </div>
                <div className="py-2.5 sm:py-3 flex justify-between items-center">
                  <span className="font-semibold text-[#1F2937]">Saturday</span>
                  <span className="font-mono font-bold text-[#0F766E]">07:00 – 21:00</span>
                </div>
                <div className="py-2.5 sm:py-3 flex justify-between items-center">
                  <span className="font-semibold text-[#1F2937]">Sunday & Public Holidays</span>
                  <span className="font-mono font-bold text-[#0F766E]">08:00 – 20:00</span>
                </div>
                <div className="py-2.5 sm:py-3 flex justify-between items-center">
                  <span className="font-semibold text-[#1F2937]">Olympic Lap Pool Hours</span>
                  <span className="font-mono font-bold text-[#1F2937]">06:30 – 20:30</span>
                </div>
                <div className="py-2.5 sm:py-3 flex justify-between items-center">
                  <span className="font-semibold text-[#1F2937]">Sauna & Steam Suite</span>
                  <span className="font-mono font-bold text-[#1F2937]">08:00 – 21:30</span>
                </div>
              </div>

              <div className="rounded border border-[#E5E7EB] bg-[#F8FAFC] p-3 text-[12px] text-[#1F2937]/70 flex items-center gap-2">
                <Info className="h-4 w-4 text-[#0F766E] shrink-0" />
                <span>Entry turnstiles automatically lock 15 minutes before closing time.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-[#FFFFFF] py-8 text-[12px] text-[#1F2937]/70">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1F2937]">Apex Athletic Club</span>
            <span>•</span>
            <span>Bole Medhanealem Road, Addis Ababa</span>
          </div>

          <p>© {new Date().getFullYear()} Apex Athletic Platform. All Rights Reserved.</p>

          <div className="flex items-center gap-4">
            <Link href="/login" className="font-semibold text-[#0F766E] hover:underline">
              Staff Portal
            </Link>
            <Link href="/member-portal" className="font-semibold text-[#0F766E] hover:underline">
              Member PWA Pass
            </Link>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* INTERACTIVE LEAD CAPTURE MODALS (REGISTER, TRIAL, CONTACT)               */}
      {/* ========================================================================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2937]/60 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-5 sm:p-6 shadow-xl relative max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-[#E5E7EB]">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0F766E] uppercase tracking-wider">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Apex Athletic Club • Bole Medhanealem</span>
                </div>
                <h3 className="text-[18px] sm:text-[20px] font-bold text-[#1F2937] mt-0.5">
                  {activeModal === 'REGISTER' && 'Membership Registration'}
                  {activeModal === 'TRIAL' && 'Book Free 1-Day Guest Pass'}
                  {activeModal === 'CONTACT' && 'Contact Front Desk & Administration'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="rounded p-1 text-[#1F2937]/50 hover:bg-[#F8FAFC] hover:text-[#1F2937]"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* =================================================================== */}
            {/* SUCCESS CONFIRMATION STATES (TRIAL PASS / VOUCHERS)                 */}
            {/* =================================================================== */}
            {submissionSuccess ? (
              <div className="py-5 space-y-4">
                {/* Visual Pass Voucher */}
                <div className="rounded-lg border-2 border-[#0F766E] bg-[#F8FAFC] p-4 sm:p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded bg-[#0F766E] flex items-center justify-center text-[#FFFFFF]">
                        <Dumbbell className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-[#1F2937]">Apex Athletic Club</h4>
                        <p className="text-[11px] text-[#1F2937]/70">Bole Medhanealem Branch</p>
                      </div>
                    </div>
                    <span className="rounded bg-[#0F766E]/10 border border-[#0F766E]/30 px-2 py-0.5 text-[10px] font-bold uppercase text-[#0F766E]">
                      {submissionSuccess.source === 'TRIAL'
                        ? '1-Day Guest Pass'
                        : submissionSuccess.source === 'REGISTER'
                        ? 'Registration Reserved'
                        : 'Inquiry Logged'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 text-[12px]">
                    <div>
                      <span className="text-[#1F2937]/60 uppercase text-[10px] font-semibold block">Guest / Member</span>
                      <p className="font-bold text-[#1F2937] text-[13px]">{formData.name}</p>
                    </div>

                    <div>
                      <span className="text-[#1F2937]/60 uppercase text-[10px] font-semibold block">Pass Reference ID</span>
                      <p className="font-mono font-bold text-[#0F766E] text-[13px]">{submissionSuccess.id}</p>
                    </div>

                    <div>
                      <span className="text-[#1F2937]/60 uppercase text-[10px] font-semibold block">
                        {submissionSuccess.source === 'TRIAL' ? 'Pass Date' : 'Package / Subject'}
                      </span>
                      <p className="font-semibold text-[#1F2937]">
                        {submissionSuccess.source === 'TRIAL'
                          ? formData.preferredDate
                          : submissionSuccess.source === 'REGISTER'
                          ? formData.selectedPackage
                          : formData.subject}
                      </p>
                    </div>

                    <div>
                      <span className="text-[#1F2937]/60 uppercase text-[10px] font-semibold block">Duty Staff / Routing</span>
                      <p className="font-semibold text-[#1F2937] truncate">
                        {submissionSuccess.recipientName || 'Front Desk (Selam T.)'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#E5E7EB] text-[11px] text-[#1F2937]/70 flex items-center justify-between">
                    <span>Issued: {new Date(submissionSuccess.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => copyToClipboard(submissionSuccess.id)}
                      className="inline-flex items-center gap-1 text-[#0F766E] font-semibold hover:underline"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>
                </div>

                {/* Specific Instructions based on Flow */}
                {submissionSuccess.source === 'TRIAL' && (
                  <div className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-3 text-[12px] text-[#1F2937]/80 space-y-1.5">
                    <p className="font-bold text-[#1F2937] flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-[#0F766E]" />
                      <span>Check-In Instructions for Your Free Visit:</span>
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-[#1F2937]/70">
                      <li>Arrive at Apex Athletic Club (Bole Medhanealem Road, Suite 400).</li>
                      <li>Present this Pass Code <strong className="font-mono text-[#1F2937]">{submissionSuccess.id}</strong> or your phone number to Receptionist Selam Tesfaye.</li>
                      <li>Bring a valid government photo ID and clean sports shoes for entry.</li>
                    </ul>
                  </div>
                )}

                {submissionSuccess.source === 'REGISTER' && (
                  <div className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-3 text-[12px] text-[#1F2937]/80 space-y-1.5">
                    <p className="font-bold text-[#1F2937] flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-[#0F766E]" />
                      <span>Next Steps for Membership Activation:</span>
                    </p>
                    <p className="text-[#1F2937]/70">
                      Your package selection for <strong>{formData.selectedPackage}</strong> is locked in. Front desk reception has received your file. You may complete your payment at the gym via cash, card, or telebirr to receive your digital QR code.
                    </p>
                  </div>
                )}

                {submissionSuccess.source === 'CONTACT' && (
                  <div className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-3 text-[12px] text-[#1F2937]/80 space-y-1.5">
                    <p className="font-bold text-[#1F2937] flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-[#0F766E]" />
                      <span>Message Dispatched Directly:</span>
                    </p>
                    <p className="text-[#1F2937]/70">
                      Routed to <strong>{submissionSuccess.recipientName}</strong>. Our duty manager will follow up with you via phone ({formData.phone}) or email within 2 operational hours.
                    </p>
                  </div>
                )}

                {/* Direct Front Desk WhatsApp Button */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <a
                    href={`https://wa.me/251911223344?text=Hi%20Apex%20Athletic%20Front%20Desk%2C%20my%20name%20is%20${encodeURIComponent(
                      formData.name
                    )}%20and%20my%20reservation%20code%20is%20${encodeURIComponent(submissionSuccess.id)}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-[#1F2937] bg-[#FFFFFF] py-2 text-[13px] font-semibold text-[#1F2937] hover:bg-[#F8FAFC]"
                  >
                    <MessageSquare className="h-4 w-4 text-[#0F766E]" />
                    <span>WhatsApp Front Desk</span>
                  </a>

                  <button
                    onClick={closeModal}
                    className="flex-1 rounded-lg bg-[#0F766E] py-2 text-[13px] font-semibold text-[#FFFFFF] hover:bg-[#0F766E]/90"
                  >
                    Close Pass
                  </button>
                </div>
              </div>
            ) : (
              /* =================================================================== */
              /* FORM SUBMISSION STATE                                               */
              /* =================================================================== */
              <form onSubmit={handleSubmitLead} className="mt-4 space-y-4 text-[13px] sm:text-[14px]">
                {/* BEFORE-REGISTRATION GYM CONTEXT CARD */}
                <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3 text-[12px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1F2937]">Facility: Apex Athletic Club</span>
                    <span className="text-[#0F766E] font-semibold">Bole Medhanealem</span>
                  </div>
                  <p className="text-[#1F2937]/70">
                    {activeModal === 'TRIAL' &&
                      'Includes full open gym floor, Olympic lifting zone, cardio deck, locker and shower facilities. Free for first-time guests with photo ID.'}
                    {activeModal === 'REGISTER' &&
                      'Lock in your package rate and set up your member profile. Activation takes less than 5 minutes at front desk.'}
                    {activeModal === 'CONTACT' &&
                      'Send your message directly to our on-duty front desk staff or general management desk.'}
                  </p>
                </div>

                {/* Server Error Alert */}
                {formErrors.form && (
                  <div className="rounded border border-[#1F2937] bg-[#F8FAFC] p-3 text-[12px] text-[#1F2937] flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-[#1F2937] shrink-0" />
                    <span>{formErrors.form}</span>
                  </div>
                )}

                {/* CONTACT FLOW: EXPLICIT WHO ARE WE CONTACTING SELECTOR */}
                {activeModal === 'CONTACT' && (
                  <div>
                    <label className="block font-bold text-[#1F2937] mb-1 text-[12px] uppercase">
                      Who Are You Contacting? <span className="text-[#D97706]">*</span>
                    </label>
                    <div className="space-y-2">
                      {contactDepartments.map((dept) => (
                        <label
                          key={dept.id}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            formData.department === dept.id
                              ? 'border-[#0F766E] bg-[#0F766E]/5'
                              : 'border-[#E5E7EB] bg-[#FFFFFF] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="department"
                            checked={formData.department === dept.id}
                            onChange={() => setFormData({ ...formData, department: dept.id })}
                            className="mt-0.5 text-[#0F766E] focus:ring-[#0F766E]"
                          />
                          <div className="text-[12px]">
                            <p className="font-bold text-[#1F2937]">{dept.title}</p>
                            <p className="text-[#0F766E] font-medium">{dept.handler}</p>
                            <p className="text-[#1F2937]/60 text-[11px] mt-0.5">{dept.roleDesc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label className="block font-semibold text-[#1F2937] mb-1">
                    Your Full Name <span className="text-[#D97706]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samuel Kebede"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full rounded-lg border px-3 py-2 text-[#1F2937] bg-[#FFFFFF] focus:outline-none focus:border-[#0F766E] ${
                      formErrors.name ? 'border-[#D97706]' : 'border-[#E5E7EB]'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-[12px] text-[#D97706] mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block font-semibold text-[#1F2937] mb-1">
                    Phone Number <span className="text-[#D97706]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+251 9..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full rounded-lg border px-3 py-2 text-[#1F2937] bg-[#FFFFFF] focus:outline-none focus:border-[#0F766E] ${
                      formErrors.phone ? 'border-[#D97706]' : 'border-[#E5E7EB]'
                    }`}
                  />
                  <p className="text-[11px] text-[#1F2937]/50 mt-1">Used for turnstile check-in and pass confirmation.</p>
                  {formErrors.phone && (
                    <p className="text-[12px] text-[#D97706] mt-1">{formErrors.phone}</p>
                  )}
                </div>

                {/* Email Address (Optional) */}
                <div>
                  <label className="block font-semibold text-[#1F2937] mb-1">
                    Email Address <span className="text-[12px] font-normal text-[#1F2937]/60">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full rounded-lg border px-3 py-2 text-[#1F2937] bg-[#FFFFFF] focus:outline-none focus:border-[#0F766E] ${
                      formErrors.email ? 'border-[#D97706]' : 'border-[#E5E7EB]'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-[12px] text-[#D97706] mt-1">{formErrors.email}</p>
                  )}
                </div>

                {/* REGISTER SPECIFIC: PACKAGE SELECTION */}
                {activeModal === 'REGISTER' && (
                  <div>
                    <label className="block font-semibold text-[#1F2937] mb-1">
                      Selected Membership Package <span className="text-[#D97706]">*</span>
                    </label>
                    <select
                      value={formData.selectedPackage}
                      onChange={(e) => {
                        const sel = packages.find((p) => p.name === e.target.value);
                        setFormData({
                          ...formData,
                          selectedPackage: e.target.value,
                          packageId: sel ? sel.id : '',
                        });
                      }}
                      className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 py-2 text-[#1F2937] focus:outline-none focus:border-[#0F766E]"
                    >
                      {packages.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} — ${p.price} / {p.billingPeriod || `${p.durationDays}d`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* TRIAL SPECIFIC: DATE & INTEREST */}
                {activeModal === 'TRIAL' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#1F2937] mb-1">
                          Preferred Visit Date <span className="text-[#D97706]">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.preferredDate}
                          onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                          className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 py-2 text-[#1F2937] focus:outline-none focus:border-[#0F766E]"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-[#1F2937] mb-1">Primary Interest</label>
                        <select
                          value={formData.interest}
                          onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                          className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 py-2 text-[#1F2937] focus:outline-none focus:border-[#0F766E]"
                        >
                          <option value="Gym Floor & Strength Arena">Gym Floor & Strength Arena</option>
                          <option value="Olympic Lap Pool">Heated Olympic Lap Pool</option>
                          <option value="Finnish Sauna & Steam Suite">Finnish Sauna & Steam Suite</option>
                          <option value="1-on-1 Personal Training">1-on-1 Personal Training</option>
                          <option value="Full Facility Tour">VIP Full Facility Tour</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* CONTACT SPECIFIC: SUBJECT & MESSAGE */}
                {activeModal === 'CONTACT' && (
                  <>
                    <div>
                      <label className="block font-semibold text-[#1F2937] mb-1">Inquiry Subject</label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 py-2 text-[#1F2937] focus:outline-none focus:border-[#0F766E]"
                      >
                        <option value="General Operations Inquiry">General Operations & Visiting Inquiry</option>
                        <option value="Corporate / Group Rates">Corporate / Company Group Rates</option>
                        <option value="Facility Tour Booking">Private Facility Tour Booking</option>
                        <option value="Personal Training Programs">Personal Trainer & Coaching Inquiry</option>
                        <option value="Owner / Executive Feedback">Owner / Executive Desk Direct Message</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#1F2937] mb-1">
                        Your Message <span className="text-[#D97706]">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Please describe your question or requirement..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className={`w-full rounded-lg border px-3 py-2 text-[#1F2937] bg-[#FFFFFF] focus:outline-none focus:border-[#0F766E] ${
                          formErrors.message ? 'border-[#D97706]' : 'border-[#E5E7EB]'
                        }`}
                      />
                      {formErrors.message && (
                        <p className="text-[12px] text-[#D97706] mt-1">{formErrors.message}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Submit & Cancel Buttons */}
                <div className="mt-5 pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-[13px] font-semibold text-[#1F2937] hover:bg-[#F8FAFC]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-lg bg-[#0F766E] px-4 py-2 text-[13px] font-semibold text-[#FFFFFF] hover:bg-[#0F766E]/90 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>
                        {activeModal === 'REGISTER' && 'Generate Registration Voucher'}
                        {activeModal === 'TRIAL' && 'Issue 1-Day Trial Pass'}
                        {activeModal === 'CONTACT' && 'Send Message to Staff'}
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
