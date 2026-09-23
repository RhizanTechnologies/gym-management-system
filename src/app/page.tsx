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
  Flame,
  Check,
  Calendar,
  X,
  Loader2,
  Sparkles,
  ChevronRight,
  User,
  Send,
  Menu,
  Trophy,
  Utensils,
  Target,
  Zap,
  Star,
  Activity,
  HeartPulse,
  Award,
  Users,
  Compass,
} from 'lucide-react';
import { MembershipPlan } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'REGISTER' | 'TRIAL' | 'CONTACT' | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    selectedPackage: '',
    packageId: '',
    preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    interest: 'Gym Floor & Strength Arena',
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

  // Dynamic Packages
  const [packages, setPackages] = useState<MembershipPlan[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  const fetchPackages = async () => {
    setPackagesLoading(true);
    try {
      const res = await fetch('/api/plans?tenantId=tenant-1');
      if (res.ok) {
        const data = await res.json();
        const activePlans = (data.plans || []).filter(
          (p: MembershipPlan) => p.isActive !== false && p.isPublished !== false
        );
        setPackages(activePlans);
      }
    } catch {
      // Fallback
    } finally {
      setPackagesLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

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

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    if (!validateForm(activeModal)) {
      return;
    }

    setIsSubmitting(true);
    try {
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
            ? formData.subject
            : formData.selectedPackage || undefined,
        message:
          activeModal === 'CONTACT'
            ? `Subject: ${formData.subject}\n\n${formData.message.trim()}`
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
        recipientName: 'M Fitness Front Desk & Coaching Team',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setFormErrors((prev) => ({ ...prev, form: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-slate-100 selection:bg-[#D4F00D] selection:text-black">
      {/* 1. TOP NAVIGATION BAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0C]/85 backdrop-blur-md border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-11 w-11 rounded-2xl bg-[#D4F00D] text-black flex items-center justify-center font-black shadow-[0_0_15px_rgba(212,240,13,0.4)] group-hover:scale-105 transition-transform">
              <Dumbbell className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight uppercase text-white block">
                M FITNESS
              </span>
              <span className="text-[10px] font-bold text-[#D4F00D] tracking-widest uppercase block -mt-1">
                Peak Performance
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-300">
            <a href="#about" className="hover:text-[#D4F00D] transition-colors">
              About Us
            </a>
            <a href="#classes" className="hover:text-[#D4F00D] transition-colors">
              Classes
            </a>
            <a href="#pricing" className="hover:text-[#D4F00D] transition-colors">
              Pricing
            </a>
            <a href="#blog" className="hover:text-[#D4F00D] transition-colors">
              Blog
            </a>
            <a href="#contact" className="hover:text-[#D4F00D] transition-colors">
              Contact Us
            </a>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/10 hover:border-white/40 transition-all"
            >
              Sign In
            </Link>
            <button
              onClick={() => openModal('REGISTER')}
              className="rounded-full bg-[#D4F00D] px-6 py-2.5 text-xs font-black text-black hover:bg-[#E5F93F] transition-all shadow-[0_0_20px_rgba(212,240,13,0.35)] hover:scale-105"
            >
              Become a Member
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white hover:text-[#D4F00D]"
              aria-label="Toggle Menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0F0F12] border-b border-white/10 px-6 py-5 space-y-4 animate-in slide-in-from-top-2">
            <div className="flex flex-col space-y-3 text-sm font-bold uppercase tracking-wider text-slate-300">
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#D4F00D]"
              >
                About Us
              </a>
              <a
                href="#classes"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#D4F00D]"
              >
                Classes
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#D4F00D]"
              >
                Pricing
              </a>
              <a
                href="#blog"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#D4F00D]"
              >
                Blog
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#D4F00D]"
              >
                Contact Us
              </a>
            </div>
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full text-center rounded-xl border border-white/20 bg-white/5 py-2.5 text-xs font-bold text-white"
              >
                Sign In
              </Link>
              <button
                onClick={() => openModal('REGISTER')}
                className="w-full text-center rounded-xl bg-[#D4F00D] py-2.5 text-xs font-black text-black shadow-md"
              >
                Become a Member
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION WITH BACKGROUND GYM VIDEO */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden">
        {/* Fullscreen Video Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920&auto=format&fit=crop"
            className="w-full h-full object-cover scale-105"
          >
            <source src="/videos/hero-gym.mp4" type="video/mp4" />
          </video>
          {/* Multi-layered dark gradient overlay for optimal readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-black/70 to-black/85" />
          <div className="absolute inset-0 bg-radial from-transparent via-[#0A0A0C]/50 to-[#0A0A0C]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,240,13,0.08),transparent_70%)]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 mt-12 sm:mt-16">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4F00D]/30 bg-[#D4F00D]/10 px-4 py-1.5 backdrop-blur-md animate-pulse">
            <span className="h-2 w-2 rounded-full bg-[#D4F00D] shadow-[0_0_8px_#D4F00D]" />
            <span className="text-[11px] font-black uppercase tracking-widest text-[#D4F00D]">
              Feel the Energy & Transformation
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white leading-[1.05]">
            Peak Performance.
            <br />
            <span className="text-[#D4F00D] drop-shadow-[0_0_25px_rgba(212,240,13,0.25)]">
              Peak Results.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
            Welcome to M Fitness, where every workout propels you towards the summit of your fitness goals.
            Olympic power stations, premium cardio suites, and battle-tested personal coaching.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => openModal('REGISTER')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-[#D4F00D] px-8 py-4 text-xs sm:text-sm font-black uppercase tracking-wider text-black hover:bg-[#E5F93F] transition-all shadow-[0_0_30px_rgba(212,240,13,0.45)] hover:scale-105"
            >
              <span>Let&apos;s Reach Your Peak</span>
              <ArrowRight className="h-4 w-4 stroke-[3]" />
            </button>
            <a
              href="#classes"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-8 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:bg-white/10 hover:border-white/40 transition-all"
            >
              <span>Explore Classes</span>
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          {/* Stats Bar Ribbon (Matching Figma Image 1) */}
          <div className="pt-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-2xl">
              <div className="p-3 text-center border-r border-white/10 last:border-r-0">
                <span className="block text-2xl sm:text-3xl font-black text-white">10K+</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Active Members
                </span>
              </div>
              <div className="p-3 text-center md:border-r border-white/10 last:border-r-0">
                <span className="block text-2xl sm:text-3xl font-black text-white">1K+</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Classes & Sessions
                </span>
              </div>
              <div className="p-3 text-center border-r border-white/10 last:border-r-0">
                <span className="block text-2xl sm:text-3xl font-black text-white">10M+</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Calories Burned
                </span>
              </div>
              <div className="p-3 text-center">
                <span className="block text-2xl sm:text-3xl font-black text-[#D4F00D]">20K+</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Goals Crushed
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SHOWCASE CARD: "WE'RE HERE TO ASSIST YOU IN YOUR FITNESS GOALS" (Figma Image 1 & 2) */}
      <section id="about" className="py-20 bg-[#0E0E12] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl bg-[#141418] border border-white/10 p-6 sm:p-10 shadow-2xl overflow-hidden relative">
            {/* Visual Action Photo */}
            <div className="lg:col-span-5 relative h-80 sm:h-96 rounded-2xl overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=900&auto=format&fit=crop"
                alt="Coach assisting trainee"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#D4F00D]" />
                  <span className="text-xs font-bold text-white">Certified Personal Training</span>
                </div>
                <span className="text-[10px] font-bold text-[#D4F00D] uppercase">1-on-1 Coaching</span>
              </div>
            </div>

            {/* Description & Action */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-1.5 text-[#D4F00D] text-sm font-black">
                <span>▶</span>
                <span>▶</span>
                <span>▶</span>
                <span className="uppercase text-xs tracking-widest ml-1 text-slate-400">
                  Committed to Your Growth
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black uppercase text-white leading-tight">
                We&apos;re here to assist you in your fitness goals
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                At M Fitness, our certified team is dedicated to guiding you towards your fitness aspirations.
                Whether you want to build raw strength, torch body fat, enhance athletic mobility, or undergo a complete body transformation, our customized coaching regimens ensure you conquer your goals safely and efficiently.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#D4F00D] shrink-0" />
                  <span className="text-xs font-semibold text-slate-200">Personalized Workout Schedules</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#D4F00D] shrink-0" />
                  <span className="text-xs font-semibold text-slate-200">Body Composition Tracking</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#D4F00D] shrink-0" />
                  <span className="text-xs font-semibold text-slate-200">Expert Nutrition Counseling</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#D4F00D] shrink-0" />
                  <span className="text-xs font-semibold text-slate-200">Olympic Powerlifting Arena</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => openModal('TRIAL')}
                  className="rounded-full bg-[#D4F00D] px-6 py-3 text-xs font-black uppercase tracking-wider text-black hover:bg-[#E5F93F] transition-all shadow-md"
                >
                  Book 1-Day Trial Pass
                </button>
                <a
                  href="#contact"
                  className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-all"
                >
                  Contact Our Desk
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INFINITE SMOOTH TICKER MARQUEE (Figma Image 1) */}
      <div className="py-4 bg-[#0A0A0C] border-y border-white/10 overflow-hidden relative">
        <div className="animate-marquee items-center gap-8 text-xs sm:text-sm font-black uppercase tracking-widest text-[#D4F00D]">
          <span>MOTIVATION</span>
          <span className="text-white/40">▶</span>
          <span>WEIGHT MANAGEMENT</span>
          <span className="text-white/40">▶</span>
          <span>WELL-BEING</span>
          <span className="text-white/40">▶</span>
          <span>NUTRITION</span>
          <span className="text-white/40">▶</span>
          <span>MODERN EQUIPMENT</span>
          <span className="text-white/40">▶</span>
          <span>PERSONAL TRAINING</span>
          <span className="text-white/40">▶</span>
          <span>ATHLETIC AGILITY</span>
          <span className="text-white/40">▶</span>
          <span>RECOVERY & SPA</span>
          <span className="text-white/40">▶</span>
          {/* Repeated for continuous loop */}
          <span>MOTIVATION</span>
          <span className="text-white/40">▶</span>
          <span>WEIGHT MANAGEMENT</span>
          <span className="text-white/40">▶</span>
          <span>WELL-BEING</span>
          <span className="text-white/40">▶</span>
          <span>NUTRITION</span>
          <span className="text-white/40">▶</span>
          <span>MODERN EQUIPMENT</span>
          <span className="text-white/40">▶</span>
          <span>PERSONAL TRAINING</span>
          <span className="text-white/40">▶</span>
          <span>ATHLETIC AGILITY</span>
          <span className="text-white/40">▶</span>
          <span>RECOVERY & SPA</span>
          <span className="text-white/40">▶</span>
        </div>
      </div>

      {/* 5. "WHY GYMEDGE / WHY M FITNESS?" (Figma Image 1) */}
      <section className="py-24 bg-[#0A0A0C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12">
            <div>
              <span className="text-xs font-black text-[#D4F00D] uppercase tracking-widest block mb-2">
                Proven Standards
              </span>
              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                Why M Fitness?
              </h2>
            </div>
            <button
              onClick={() => openModal('REGISTER')}
              className="self-start md:self-auto rounded-full bg-[#D4F00D] px-6 py-3 text-xs font-black uppercase tracking-wider text-black hover:bg-[#E5F93F] transition-all shadow-[0_0_15px_rgba(212,240,13,0.3)]"
            >
              Become a Member
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Certified Trainer */}
            <div className="rounded-3xl bg-[#121216] border border-white/10 p-7 hover:border-[#D4F00D]/50 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-[#D4F00D]/10 text-[#D4F00D] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Trophy className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
                  Certified Trainer
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Work with experienced coaches who develop custom periodized workout programs aligned with your goals.
                </p>
              </div>
            </div>

            {/* Card 2: Nutrition & Diet */}
            <div className="rounded-3xl bg-[#121216] border border-white/10 p-7 hover:border-[#D4F00D]/50 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-[#D4F00D]/10 text-[#D4F00D] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Utensils className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
                  Nutrition & Diet
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Unlock your full potential with meal guidelines that fuel workout performance and maximize muscle recovery.
                </p>
              </div>
            </div>

            {/* Card 3: Years' Mastery */}
            <div className="rounded-3xl bg-[#121216] border border-white/10 p-7 hover:border-[#D4F00D]/50 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-[#D4F00D]/10 text-[#D4F00D] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
                  Years&apos; Mastery
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Decades of fitness leadership, boasting proven athlete training regimens and reliable milestone transformations.
                </p>
              </div>
            </div>

            {/* Card 4: Modern Equipment */}
            <div className="rounded-3xl bg-[#121216] border border-white/10 p-7 hover:border-[#D4F00D]/50 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-[#D4F00D]/10 text-[#D4F00D] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
                  High-Tech Equipment
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Equipped with top-of-the-line selectorized machines, Olympic squat racks, free dumbbells, and cardio equipment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. "CLASSES & TRAINING PROGRAMS" (Figma Image 3) */}
      <section id="classes" className="py-24 bg-[#0E0E12] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto pb-14 space-y-3">
            <span className="text-xs font-black text-[#D4F00D] uppercase tracking-widest">
              Dynamic Programs
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase text-white">
              Classes & Coaching
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Our diverse range of fitness classes offers programs for all fitness levels, from beginners to elite athletes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Power Lifting & Strength',
                intensity: 'High Intensity',
                level: 'Intermediate - Advanced',
                desc: 'Master the big three: squat, bench press, and deadlift with biomechanic form critique and barbell programming.',
                img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop',
              },
              {
                title: 'HIIT & Metabolic Burn',
                intensity: 'Ultra High',
                level: 'All Fitness Levels',
                desc: 'Interval-based functional conditioning that torches calories, elevates VO2 max, and spikes athletic stamina.',
                img: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?q=80&w=800&auto=format&fit=crop',
              },
              {
                title: 'TRX Suspension & Core',
                intensity: 'Moderate Intensity',
                level: 'Beginner - Pro',
                desc: 'Full-body suspension training designed to build 360-degree core rigidity, rotational power, and muscular balance.',
                img: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=800&auto=format&fit=crop',
              },
              {
                title: 'Boxing & Heavy Bag',
                intensity: 'High Intensity',
                level: 'All Fitness Levels',
                desc: 'Combine footwork, punch combos, and explosive agility drills to sharpen hand-eye coordination and burn body fat.',
                img: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=800&auto=format&fit=crop',
              },
              {
                title: 'Mobility, Yoga & Flow',
                intensity: 'Recovery & Flexibility',
                level: 'All Fitness Levels',
                desc: 'Decompress joints, relieve lower back strain, and restore deep tissue mobility with guided dynamic stretching.',
                img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=800&auto=format&fit=crop',
              },
              {
                title: '1-on-1 Personal Training',
                intensity: 'Custom Tailored',
                level: 'Personalized Plan',
                desc: 'Dedicated 1-on-1 coaching with customized nutrition plans, posture correction, and accelerated goal achievement.',
                img: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=800&auto=format&fit=crop',
              },
            ].map((cls, i) => (
              <div
                key={i}
                className="rounded-3xl bg-[#141418] border border-white/10 overflow-hidden hover:border-[#D4F00D]/50 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="h-48 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cls.img}
                      alt={cls.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141418] via-transparent to-transparent" />
                    <span className="absolute top-3 right-3 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[10px] font-black uppercase text-[#D4F00D] border border-white/10">
                      {cls.intensity}
                    </span>
                  </div>

                  <div className="p-6 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {cls.level}
                    </span>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">
                      {cls.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{cls.desc}</p>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <button
                    onClick={() => openModal('TRIAL')}
                    className="w-full rounded-2xl bg-white/5 border border-white/10 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#D4F00D] hover:text-black hover:border-[#D4F00D] transition-all"
                  >
                    Try Free In Class
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. "MEMBERSHIP PLANS" (PRICING IN ETB - Figma Image 1 & 3) */}
      <section id="pricing" className="py-24 bg-[#0A0A0C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto pb-14 space-y-3">
            <span className="text-xs font-black text-[#D4F00D] uppercase tracking-widest">
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase text-white">
              Membership Plans
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              No hidden fees. Select the membership that matches your goals. All rates in Ethiopian Birr (ETB).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Plan 1: 1 Day Pass */}
            <div className="rounded-3xl bg-[#121216] border border-white/10 p-8 flex flex-col justify-between hover:border-white/20 transition-all">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black uppercase text-white">1 Day Pass</h3>
                  <p className="text-xs text-slate-400 mt-1">Single Day Guest Access</p>
                </div>

                <div>
                  <span className="text-4xl font-black text-white">ETB 500</span>
                  <span className="text-xs text-slate-400 font-bold ml-1.5">/ Single Day</span>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#D4F00D] shrink-0" />
                    <span>Full Gym Floor Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#D4F00D] shrink-0" />
                    <span>Locker Room & Shower Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#D4F00D] shrink-0" />
                    <span>Fitness Orientation & Tour</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => openModal('REGISTER', { name: '1 Day Pass', id: 'plan-day-pass' })}
                  className="w-full rounded-2xl border border-white/20 bg-white/5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-all"
                >
                  Get Day Pass
                </button>
              </div>
            </div>

            {/* Plan 2: 1 Month Plan (MOST POPULAR - Neon Highlight) */}
            <div className="rounded-3xl bg-[#141418] border-2 border-[#D4F00D] p-8 flex flex-col justify-between relative shadow-[0_0_35px_rgba(212,240,13,0.15)] transform md:-translate-y-2">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#D4F00D] px-4 py-1 text-[10px] font-black uppercase tracking-wider text-black shadow-md">
                Most Popular
              </span>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black uppercase text-white">Monthly Plan</h3>
                  <p className="text-xs text-slate-400 mt-1">Full Monthly Training Access</p>
                </div>

                <div>
                  <span className="text-4xl font-black text-[#D4F00D]">ETB 1,500</span>
                  <span className="text-xs text-slate-400 font-bold ml-1.5">/ Month</span>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#D4F00D] shrink-0" />
                    <span>All Standard Plan Features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#D4F00D] shrink-0" />
                    <span>Cardio Suite & Free Weights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#D4F00D] shrink-0" />
                    <span>Group Aerobics & HIIT Classes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#D4F00D] shrink-0" />
                    <span>Dedicated Locker Assignment</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => openModal('REGISTER', { name: 'Monthly Plan', id: 'plan-1-monthly' })}
                  className="w-full rounded-2xl bg-[#D4F00D] py-3.5 text-xs font-black uppercase tracking-wider text-black hover:bg-[#E5F93F] transition-all shadow-[0_0_20px_rgba(212,240,13,0.3)]"
                >
                  Become a Member
                </button>
              </div>
            </div>

            {/* Plan 3: VIP Annual Plan */}
            <div className="rounded-3xl bg-[#121216] border border-white/10 p-8 flex flex-col justify-between hover:border-white/20 transition-all">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black uppercase text-white">VIP Annual Plan</h3>
                  <p className="text-xs text-slate-400 mt-1">Full 12-Month Elite Access</p>
                </div>

                <div>
                  <span className="text-4xl font-black text-white">ETB 14,000</span>
                  <span className="text-xs text-slate-400 font-bold ml-1.5">/ 12 Months</span>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#D4F00D] shrink-0" />
                    <span>All Premium Plan Features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#D4F00D] shrink-0" />
                    <span>2 Complimentary PT Sessions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#D4F00D] shrink-0" />
                    <span>VIP Locker & Towel Service</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#D4F00D] shrink-0" />
                    <span>Priority Turnstile QR Check-in</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => openModal('REGISTER', { name: 'VIP Annual Plan', id: 'plan-3-annual' })}
                  className="w-full rounded-2xl border border-white/20 bg-white/5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-all"
                >
                  Join VIP Annual
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. "OUR BLOG" / FITNESS INSIGHTS (Figma Image 4) */}
      <section id="blog" className="py-24 bg-[#0E0E12] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-12">
            <div>
              <span className="text-xs font-black text-[#D4F00D] uppercase tracking-widest block mb-2">
                Knowledge & Fitness
              </span>
              <h2 className="text-3xl sm:text-5xl font-black uppercase text-white">
                Our Blog
              </h2>
            </div>
            <a
              href="#blog"
              className="rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-all"
            >
              View All Blogs
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Conquering Consistency: How to Make Exercise a Habit You Love',
                category: 'Habits & Mindset',
                date: 'Sep 18, 2026',
                img: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?q=80&w=800&auto=format&fit=crop',
              },
              {
                title: 'Fuel Your Fitness: A Guide to Nutrition for Peak Performance',
                category: 'Nutrition & Diet',
                date: 'Sep 15, 2026',
                img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop',
              },
              {
                title: 'Weight Loss: A Sustainable Approach for a Healthier You',
                category: 'Fat Loss',
                date: 'Sep 10, 2026',
                img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop',
              },
            ].map((post, idx) => (
              <div
                key={idx}
                className="rounded-3xl bg-[#141418] border border-white/10 overflow-hidden hover:border-[#D4F00D]/50 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="h-52 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.img}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141418] via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase text-[#D4F00D] border border-white/10">
                      {post.category}
                    </span>
                  </div>

                  <div className="p-6 space-y-2">
                    <span className="text-[11px] text-slate-500 font-semibold">{post.date}</span>
                    <h3 className="text-base font-black text-white hover:text-[#D4F00D] transition-colors leading-snug">
                      {post.title}
                    </h3>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <button
                    onClick={() => openModal('TRIAL')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4F00D] hover:underline"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. REAL TRAINEE REVIEWS & TESTIMONIALS (Figma Image 1 & 4) */}
      <section className="py-20 bg-[#0A0A0C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto pb-12 space-y-2">
            <span className="text-xs font-black text-[#D4F00D] uppercase tracking-widest">
              Trainee Stories
            </span>
            <h2 className="text-3xl font-black uppercase text-white">Client Transformations</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Betelhem Tefera',
                role: 'Member for 8 Months',
                text: 'M Fitness changed my life. The personal trainers keep you accountable every session, and the atmosphere makes you want to push harder.',
                stars: 5,
              },
              {
                name: 'Yared Hailu',
                role: 'Powerlifting Athlete',
                text: 'The best gym in Addis Ababa. Olympic barbells, calibrated plates, and coaches who know exact biomechanics and progressive overload.',
                stars: 5,
              },
              {
                name: 'Marta Assefa',
                role: 'HIIT & Conditioning',
                text: 'Lost 12kg in 4 months with their customized nutrition and training guidance. The locker rooms and facility are always spotless.',
                stars: 5,
              },
            ].map((t, idx) => (
              <div
                key={idx}
                className="rounded-3xl bg-[#121216] border border-white/10 p-7 flex flex-col justify-between hover:border-white/20 transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-[#D4F00D]">
                    {[...Array(t.stars)].map((_, s) => (
                      <Star key={s} className="h-4 w-4 fill-[#D4F00D]" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-300 italic leading-relaxed">
                    &ldquo;{t.text}&rdquo;
                  </p>
                </div>

                <div className="pt-6 border-t border-white/10 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#D4F00D]/20 text-[#D4F00D] flex items-center justify-center font-black text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">{t.name}</h4>
                    <p className="text-[10px] text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. BIG MOTIVATIONAL BANNER (Figma Image 1, 2, 3, 4) */}
      <section className="py-20 bg-[#0E0E12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden min-h-[380px] flex items-center justify-center p-8 sm:p-14 text-center border border-white/10">
            {/* Background Athlete Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1600&auto=format&fit=crop"
              alt="Athlete working out"
              className="absolute inset-0 w-full h-full object-cover scale-105"
            />
            <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/80" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <span className="text-xs font-black uppercase tracking-widest text-[#D4F00D] inline-block">
                Start Today
              </span>
              <h2 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight leading-tight">
                Ready to Start Your Journey With M Fitness?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Join our community of athletes and fitness lovers. Personalized plans, elite equipment, and guaranteed results.
              </p>
              <div>
                <button
                  onClick={() => openModal('REGISTER')}
                  className="rounded-full bg-[#D4F00D] px-8 py-4 text-xs font-black uppercase tracking-wider text-black hover:bg-[#E5F93F] transition-all shadow-[0_0_25px_rgba(212,240,13,0.4)] hover:scale-105"
                >
                  Become a Member
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. "REACH OUT / CONTACT US" (Figma Image 5) */}
      <section id="contact" className="py-24 bg-[#0A0A0C] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto pb-14 space-y-2">
            <span className="text-xs font-black text-[#D4F00D] uppercase tracking-widest">
              Direct Inquiries
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase text-white">
              Contact Us
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              We value your inquiries and feedback. Whether you have questions about memberships, classes, or coaching, our team is here to assist.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Contact Form */}
            <div className="lg:col-span-7 rounded-3xl bg-[#121216] border border-white/10 p-7 sm:p-9 space-y-5">
              <h3 className="text-lg font-black uppercase text-white tracking-tight">
                Send Us a Message
              </h3>

              <form onSubmit={handleSubmitLead} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dawit Kebede"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-[#1A1A20] px-4 py-3 text-white placeholder-slate-500 focus:border-[#D4F00D] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0911223344"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-[#1A1A20] px-4 py-3 text-white placeholder-slate-500 focus:border-[#D4F00D] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="dawit@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#1A1A20] px-4 py-3 text-white placeholder-slate-500 focus:border-[#D4F00D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                    Your Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter your message or inquiry..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#1A1A20] p-4 text-white placeholder-slate-500 focus:border-[#D4F00D] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-[#D4F00D] py-3.5 text-xs font-black uppercase tracking-wider text-black hover:bg-[#E5F93F] transition-all shadow-[0_0_20px_rgba(212,240,13,0.3)] disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : "Let's Reach Your Peak"}
                </button>
              </form>
            </div>

            {/* Contact Information Cards */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-3xl bg-[#121216] border border-white/10 p-6 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-[#D4F00D]/10 text-[#D4F00D] flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Phone Number
                  </span>
                  <a href="tel:0961889867" className="text-sm font-extrabold text-white hover:text-[#D4F00D] mt-0.5 block font-mono">
                    0961889867 / +251 96 188 9867
                  </a>
                </div>
              </div>

              <div className="rounded-3xl bg-[#121216] border border-white/10 p-6 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-[#D4F00D]/10 text-[#D4F00D] flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Email Address
                  </span>
                  <a href="mailto:contact@mfitnessgym.com" className="text-sm font-extrabold text-white hover:text-[#D4F00D] mt-0.5 block">
                    contact@mfitnessgym.com
                  </a>
                </div>
              </div>

              <div className="rounded-3xl bg-[#121216] border border-white/10 p-6 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-[#D4F00D]/10 text-[#D4F00D] flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Facility Location
                  </span>
                  <p className="text-sm font-extrabold text-white mt-0.5">
                    Figa, Addis Ababa, Ethiopia
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Open Mon–Sat 5:30 AM – 10:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. FOOTER */}
      <footer className="py-12 bg-[#070709] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-[#D4F00D] text-black flex items-center justify-center font-black">
                <Dumbbell className="h-4 w-4 stroke-[2.5]" />
              </div>
              <span className="text-base font-black tracking-tight uppercase text-white">
                M FITNESS
              </span>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-400 font-bold uppercase tracking-wider">
              <a href="#about" className="hover:text-[#D4F00D] transition-colors">About Us</a>
              <a href="#classes" className="hover:text-[#D4F00D] transition-colors">Classes</a>
              <a href="#pricing" className="hover:text-[#D4F00D] transition-colors">Pricing</a>
              <a href="#blog" className="hover:text-[#D4F00D] transition-colors">Blog</a>
              <a href="#contact" className="hover:text-[#D4F00D] transition-colors">Contact</a>
              <Link href="/login" className="hover:text-[#D4F00D] transition-colors">Portal Login</Link>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} M Fitness & Gym. All rights reserved.</p>
            <p className="text-[11px]">Powered by GymOS • Built with Peak Performance</p>
          </div>
        </div>
      </footer>

      {/* MODAL: REGISTER / TRIAL / CONTACT */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-[#141418] border border-white/10 p-6 sm:p-8 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#D4F00D] text-black flex items-center justify-center font-black">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-white">
                    {activeModal === 'REGISTER' && 'Become a Member'}
                    {activeModal === 'TRIAL' && 'Claim Free Trial Pass'}
                    {activeModal === 'CONTACT' && 'Reach Out to Our Team'}
                  </h3>
                  <p className="text-[11px] text-slate-400">M Fitness & Gym • Figa, Addis Ababa</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submissionSuccess ? (
              <div className="py-8 text-center space-y-4">
                <div className="h-14 w-14 rounded-full bg-[#D4F00D]/20 text-[#D4F00D] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="text-lg font-black text-white uppercase">Request Submitted!</h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Thank you, <strong>{formData.name}</strong>! Your confirmation pass is ready. Our front desk staff will follow up via phone at{' '}
                  <strong className="text-[#D4F00D]">{formData.phone}</strong>.
                </p>
                <button
                  onClick={closeModal}
                  className="rounded-full bg-[#D4F00D] px-6 py-2.5 text-xs font-black uppercase text-black"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} className="mt-5 space-y-4 text-xs">
                {formErrors.form && (
                  <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-rose-300 font-semibold">
                    {formErrors.form}
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alazar Bekele"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#1A1A20] px-4 py-2.5 text-white placeholder-slate-500 focus:border-[#D4F00D] focus:outline-none"
                  />
                  {formErrors.name && (
                    <p className="text-rose-400 text-[11px] mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0911223344"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#1A1A20] px-4 py-2.5 text-white placeholder-slate-500 focus:border-[#D4F00D] focus:outline-none"
                  />
                  {formErrors.phone && (
                    <p className="text-rose-400 text-[11px] mt-1">{formErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="alazar@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#1A1A20] px-4 py-2.5 text-white placeholder-slate-500 focus:border-[#D4F00D] focus:outline-none"
                  />
                </div>

                {activeModal === 'REGISTER' && (
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                      Select Plan (ETB)
                    </label>
                    <select
                      value={formData.selectedPackage}
                      onChange={(e) => setFormData({ ...formData, selectedPackage: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-[#1A1A20] px-4 py-2.5 text-white focus:border-[#D4F00D] focus:outline-none"
                    >
                      <option value="1 Day Pass">1 Day Pass — ETB 500</option>
                      <option value="Monthly Plan">Monthly Plan — ETB 1,500</option>
                      <option value="VIP Annual Plan">VIP Annual Plan — ETB 14,000</option>
                    </select>
                  </div>
                )}

                {activeModal === 'TRIAL' && (
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                      Preferred Trial Visit Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.preferredDate}
                      onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-[#1A1A20] px-4 py-2.5 text-white focus:border-[#D4F00D] focus:outline-none"
                    />
                  </div>
                )}

                {activeModal === 'CONTACT' && (
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                      Your Message *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Tell us what you'd like to achieve..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-[#1A1A20] p-3 text-white placeholder-slate-500 focus:border-[#D4F00D] focus:outline-none"
                    />
                  </div>
                )}

                <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-[#D4F00D] px-5 py-2 text-xs font-black uppercase text-black hover:bg-[#E5F93F] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Confirm'}
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
