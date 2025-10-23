import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Users, 
  Brain, 
  BarChart3, 
  Zap, 
  Shield,
  FileText,
  Inbox,
  Bot,
  Calendar,
  CheckCircle,
  UserCog,
  UserCheck,
  Building2,
  Search,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Linkedin,
  Twitter,
  Facebook,
  Mail,
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';

export default function LandingPage({ onLogin }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [animateStats, setAnimateStats] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      
      // Trigger stats animation when section is visible
      const statsSection = document.getElementById('stats-section');
      if (statsSection) {
        const rect = statsSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom >= 0) {
          setAnimateStats(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: 'AI-Powered Resume Analysis',
      description: 'Intelligent candidate matching and resume parsing with advanced ML algorithms'
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Smart Application Tracking',
      description: 'Manage your entire recruitment pipeline in one centralized platform'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Collaborative Hiring',
      description: 'Seamless collaboration between HR, managers, and teams throughout the process'
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Advanced Analytics',
      description: 'Data-driven insights for better hiring decisions and process optimization'
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'Automated Workflows',
      description: 'Save time with automated screening, communications, and scheduling'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Secure & Scalable',
      description: 'Enterprise-grade security with role-based access control and compliance'
    }
  ];

  const steps = [
    { icon: <Briefcase className="h-6 w-6" />, title: 'Post Jobs', description: 'Create and publish job postings' },
    { icon: <Inbox className="h-6 w-6" />, title: 'Receive Applications', description: 'Collect candidate submissions' },
    { icon: <Bot className="h-6 w-6" />, title: 'AI-Powered Screening', description: 'Automated resume analysis' },
    { icon: <Calendar className="h-6 w-6" />, title: 'Review & Interview', description: 'Schedule and conduct interviews' },
    { icon: <CheckCircle className="h-6 w-6" />, title: 'Make Offers', description: 'Send offers and onboard talent' }
  ];

  const roles = [
    {
      icon: <UserCog className="h-12 w-12" />,
      title: 'Admin',
      description: 'Complete system control and user management with full access to all features',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <UserCheck className="h-12 w-12" />,
      title: 'HR Manager',
      description: 'End-to-end recruitment and candidate management with AI-powered tools',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: <Building2 className="h-12 w-12" />,
      title: 'Manager',
      description: 'Department-specific hiring and team building with approval workflows',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <Search className="h-12 w-12" />,
      title: 'Employee',
      description: 'Easy job search and application tracking with personalized recommendations',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const stats = [
    { value: '500+', label: 'Companies Trust Us' },
    { value: '10,000+', label: 'Jobs Posted Monthly' },
    { value: '95%', label: 'Faster Hiring Process' },
    { value: '4.9/5', label: 'AI-Powered Matching' }
  ];

  const handleDemoLogin = (role) => {
    setIsLoginOpen(false);
    onLogin(role);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white">HR</span>
              </div>
              <span className={`transition-colors ${isScrolled ? 'text-gray-900' : 'text-white'}`}>
                HRMS Portal
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className={`transition-colors hover:text-blue-600 ${isScrolled ? 'text-gray-700' : 'text-white'}`}>
                Features
              </a>
              <a href="#how-it-works" className={`transition-colors hover:text-blue-600 ${isScrolled ? 'text-gray-700' : 'text-white'}`}>
                How It Works
              </a>
              <a href="#roles" className={`transition-colors hover:text-blue-600 ${isScrolled ? 'text-gray-700' : 'text-white'}`}>
                Roles
              </a>
              <a href="#contact" className={`transition-colors hover:text-blue-600 ${isScrolled ? 'text-gray-700' : 'text-white'}`}>
                Contact
              </a>
              <Button 
                variant={isScrolled ? 'outline' : 'secondary'}
                onClick={() => setIsLoginOpen(true)}
              >
                Sign In
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className={isScrolled ? 'text-gray-900' : 'text-white'} />
              ) : (
                <Menu className={isScrolled ? 'text-gray-900' : 'text-white'} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block py-2 text-gray-700 hover:text-blue-600">Features</a>
              <a href="#how-it-works" className="block py-2 text-gray-700 hover:text-blue-600">How It Works</a>
              <a href="#roles" className="block py-2 text-gray-700 hover:text-blue-600">Roles</a>
              <a href="#contact" className="block py-2 text-gray-700 hover:text-blue-600">Contact</a>
              <Button className="w-full" onClick={() => setIsLoginOpen(true)}>Sign In</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-white space-y-6 animate-fade-in">
            <h1 className="text-gray-900 leading-tight">
              Streamline Your Hiring Process with AI-Powered HRMS
            </h1>
            <p className="text-xl text-white/90">
              Complete recruitment solution for modern organizations - from job posting to hiring
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => setIsLoginOpen(true)}
              >
                Sign In
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                className="bg-purple-600/50 text-white border border-white/30 hover:bg-purple-300 hover:text-gray-900 hover:border-purple-400 backdrop-blur-sm transition-all duration-300"
              >
                Get Started
              </Button>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1758873268631-fa944fc5cad2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjB3b3Jrc3BhY2UlMjB0ZWFtfGVufDF8fHx8MTc2MTE2NjM5NXww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Modern workplace"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-white" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600">Everything you need to transform your recruitment process</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple, streamlined process from start to finish</p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transform -translate-y-1/2"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white mb-4 relative z-10 shadow-lg">
                      {step.icon}
                    </div>
                    <h3 className="mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section id="roles" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-gray-900 mb-4">Built for Every Role</h2>
            <p className="text-xl text-gray-600">Tailored experiences for different user types</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {roles.map((role, index) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group"
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                  {role.icon}
                </div>
                <h3 className="text-gray-900 mb-3">{role.title}</h3>
                <p className="text-gray-600">{role.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section id="stats-section" className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-gray-900 mb-2 transition-all duration-1000 ${animateStats ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                  {stat.value}
                </div>
                <p className="text-white/90">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-gray-900 mb-4">Ready to Transform Your Hiring?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of companies already using our AI-powered HRMS
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setIsLoginOpen(true)}>
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white">HR</span>
                </div>
                <span>HRMS Portal</span>
              </div>
              <p className="text-gray-400 text-sm">
                Modern recruitment made simple with AI-powered tools
              </p>
            </div>

            <div>
              <h4 className="mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-gray-400 mb-4 md:mb-0">
              © 2025 HRMS Portal. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="mailto:support@hrms.com" className="text-gray-400 hover:text-white transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">Sign In</DialogTitle>
          <DialogDescription className="sr-only">
            Sign in to access your HRMS dashboard
          </DialogDescription>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">HR</span>
            </div>
            <h2 className="text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to access your dashboard</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@company.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm cursor-pointer">
                  Remember me
                </Label>
              </div>
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>

            <Button className="w-full">Sign In</Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              <Button variant="outline">
                <Linkedin className="w-5 h-5 mr-2" />
                LinkedIn
              </Button>
            </div>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="#contact" className="text-blue-600 hover:underline">
                Contact Admin
              </a>
            </p>

            {/* Demo Login Options */}
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3 text-center">Quick Demo Login:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDemoLogin('admin')}
                >
                  Admin
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDemoLogin('hr-manager')}
                >
                  HR Manager
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDemoLogin('manager')}
                >
                  Manager
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDemoLogin('employee')}
                >
                  Employee
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
