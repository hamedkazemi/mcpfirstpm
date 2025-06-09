'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  ArrowRightIcon, 
  SparklesIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  BoltIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const features = [
    {
      icon: <ChartBarIcon className="w-8 h-8" />,
      title: "Advanced Analytics",
      description: "Get deep insights into project performance with real-time analytics and customizable dashboards.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <UserGroupIcon className="w-8 h-8" />,
      title: "Team Collaboration",
      description: "Seamlessly collaborate with your team through integrated chat, file sharing, and real-time updates.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <ClipboardDocumentCheckIcon className="w-8 h-8" />,
      title: "Smart Task Management",
      description: "AI-powered task prioritization and automated workflow suggestions to boost productivity.",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: <BoltIcon className="w-8 h-8" />,
      title: "Lightning Fast",
      description: "Built for speed with optimized performance that scales with your growing team.",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: <ShieldCheckIcon className="w-8 h-8" />,
      title: "Enterprise Security",
      description: "Bank-level encryption and security protocols to keep your data safe and compliant.",
      color: "from-red-500 to-rose-500",
    },
    {
      icon: <SparklesIcon className="w-8 h-8" />,
      title: "AI-Powered Insights",
      description: "Leverage machine learning to predict project outcomes and optimize resource allocation.",
      color: "from-indigo-500 to-blue-500",
    },
  ];

  return (
    <div className="min-h-screen bg-base-100">
      {/* Animated Background */}
      <div className="fixed inset-0 hero-pattern opacity-50" />
      
      {/* Navigation */}
      <nav className={`navbar-glass fixed top-0 left-0 right-0 transition-all duration-300 ${
        scrolled ? 'py-2 shadow-lg backdrop-blur-xl' : 'py-4'
      }`}>
        <div className="navbar-start">
          <div className="dropdown lg:hidden">
            <label tabIndex={0} className="btn btn-ghost btn-circle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </label>
            {isMenuOpen && (
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-2xl bg-base-100 rounded-box w-52 animate-slide-down">
                <li><a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a></li>
                <li><a href="#testimonials" onClick={() => setIsMenuOpen(false)}>Testimonials</a></li>
                <li><a href="#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</a></li>
              </ul>
            )}
          </div>
          <Link href="/" className="btn btn-ghost text-xl font-bold">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">M</span>
              </div>
              <span className="text-gradient hidden sm:inline">MCP Manager</span>
            </div>
          </Link>
        </div>
        
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-2">
            <li><a href="#features" className="hover-glow rounded-lg">Features</a></li>
            <li><a href="#testimonials" className="hover-glow rounded-lg">Testimonials</a></li>
            <li><a href="#pricing" className="hover-glow rounded-lg">Pricing</a></li>
          </ul>
        </div>
        
        <div className="navbar-end gap-2">
          <Link href="/auth/login" className="btn btn-ghost btn-sm">
            Sign In
          </Link>
          <Link href="/auth/register" className="btn btn-primary btn-sm btn-gradient">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero min-h-screen relative overflow-hidden">
        <div className="hero-content text-center py-32 px-4 max-w-5xl mx-auto animate-fade-in">
          <div className="max-w-full">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-slide-down">
              <SparklesIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Introducing AI-Powered Project Insights</span>
            </div>
            
            {/* Heading */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up text-balance">
              Project Management
              <br />
              <span className="text-gradient">Reimagined</span>
            </h1>
            
            {/* Subheading */}
            <p className="text-xl md:text-2xl mb-10 text-base-content/80 max-w-3xl mx-auto animate-slide-up animation-delay-200">
              Experience the future of team collaboration with intelligent task management, 
              real-time analytics, and seamless workflow automation.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-scale-in animation-delay-400">
              <Link href="/auth/register" className="btn btn-primary btn-lg btn-gradient group">
                Start Free Trial
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/auth/login" className="btn btn-outline btn-lg glass-hover">
                <span>Watch Demo</span>
                <span className="badge badge-primary badge-sm ml-2">2 min</span>
              </Link>
            </div>
            
            {/* Trust Badges */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="text-sm">Trusted by</div>
              <div className="flex flex-wrap justify-center items-center gap-8">
                {['Google', 'Microsoft', 'Amazon', 'Meta'].map((company) => (
                  <div key={company} className="font-semibold text-lg hover:text-primary transition-colors">
                    {company}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDownIcon className="w-6 h-6 text-base-content/50" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to
              <span className="text-gradient"> Succeed</span>
            </h2>
            <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
              Powerful features designed to streamline your workflow and boost team productivity
            </p>
          </div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card-modern card-hover-lift p-8 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} p-3 mb-6 group-hover:scale-110 transition-transform`}>
                  <div className="text-white">{feature.icon}</div>
                </div>
                
                {/* Content */}
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-base-content/70 leading-relaxed">{feature.description}</p>
                
                {/* Learn More Link */}
                <div className="mt-6">
                  <a href="#" className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all">
                    Learn more
                    <ArrowRightIcon className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 bg-base-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Active Users", value: "50K+", suffix: "" },
              { label: "Projects Managed", value: "1M", suffix: "+" },
              { label: "Team Satisfaction", value: "98", suffix: "%" },
              { label: "Uptime SLA", value: "99.9", suffix: "%" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-gradient mb-2">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-base-content/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your
            <span className="text-gradient"> Workflow?</span>
          </h2>
          <p className="text-xl mb-10 text-base-content/70">
            Join thousands of teams already using MCP Manager to deliver exceptional results
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register" className="btn btn-primary btn-lg btn-gradient">
              Start Your Free 14-Day Trial
            </Link>
            <Link href="#" className="btn btn-ghost btn-lg">
              Schedule a Demo
            </Link>
          </div>
          <p className="mt-6 text-sm text-base-content/60">
            No credit card required • Cancel anytime • 24/7 Support
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-200 text-base-content">
        <aside>
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">M</span>
          </div>
          <p className="font-bold">
            MCP Manager
            <br />
            Empowering teams since 2024
          </p>
          <p>Copyright © 2025 - All rights reserved</p>
        </aside>
        <nav>
          <div className="grid grid-flow-col gap-4">
            <a className="hover:text-primary transition-colors">About</a>
            <a className="hover:text-primary transition-colors">Contact</a>
            <a className="hover:text-primary transition-colors">Jobs</a>
            <a className="hover:text-primary transition-colors">Press</a>
          </div>
        </nav>
      </footer>
    </div>
  );
}
