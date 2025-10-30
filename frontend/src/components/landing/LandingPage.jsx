import { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
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
  ArrowRight,
  Sparkles,
  Star
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import LoginForm from '../auth/LoginForm';
import RegisterForm from '../auth/RegisterForm';
import JobOpportunitiesDialog from '../jobs/JobOpportunitiesDialog';
import AnimatedBackground from './AnimatedBackground';
import HeroScene from './HeroScene';

export default function LandingPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [animateStats, setAnimateStats] = useState(false);
  const [isOpportunitiesOpen, setIsOpportunitiesOpen] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');

  // Check if redirected from interview link
  useEffect(() => {
    if (location.state?.message) {
      setLoginMessage(location.state.message);
      setSelectedRole('employee'); // Default to employee for interview candidates
      setIsLoginOpen(true);
    }
  }, [location]);

  // Check for OAuth error in URL query parameters
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      // Show error toast
      toast.error(decodeURIComponent(error));
      // Clean up the URL by removing the error parameter
      searchParams.delete('error');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { scrollY } = useScroll();

  const heroY = useTransform(scrollY, [0, 300], [0, 200]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      
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
      icon: <Brain className="h-8 w-8 text-white" />,
      title: 'AI-Powered Resume Analysis',
      description: 'Intelligent candidate matching and resume parsing with advanced ML algorithms',
      gradient: 'from-blue-500 to-blue-600',
      delay: 0
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-white" />,
      title: 'Smart Application Tracking',
      description: 'Manage your entire recruitment pipeline in one centralized platform',
      gradient: 'from-purple-500 to-purple-600',
      delay: 0.1
    },
    {
      icon: <Users className="h-8 w-8 text-white" />,
      title: 'Collaborative Hiring',
      description: 'Seamless collaboration between HR, managers, and teams throughout the process',
      gradient: 'from-pink-500 to-pink-600',
      delay: 0.2
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-white" />,
      title: 'Advanced Analytics',
      description: 'Data-driven insights for better hiring decisions and process optimization',
      gradient: 'from-green-500 to-green-600',
      delay: 0.3
    },
    {
      icon: <Zap className="h-8 w-8 text-white" />,
      title: 'Automated Workflows',
      description: 'Save time with automated screening, communications, and scheduling',
      gradient: 'from-yellow-500 to-yellow-600',
      delay: 0.4
    },
    {
      icon: <Shield className="h-8 w-8 text-white" />,
      title: 'Secure & Scalable',
      description: 'Enterprise-grade security with role-based access control and compliance',
      gradient: 'from-indigo-500 to-indigo-600',
      delay: 0.5
    }
  ];

  const steps = [
    { icon: <Briefcase className="h-6 w-6 text-white" />, title: 'Post Jobs', description: 'Create and publish job postings' },
    { icon: <Inbox className="h-6 w-6 text-white" />, title: 'Receive Applications', description: 'Collect candidate submissions' },
    { icon: <Bot className="h-6 w-6 text-white" />, title: 'AI-Powered Screening', description: 'Automated resume analysis' },
    { icon: <Calendar className="h-6 w-6 text-white" />, title: 'Review & Interview', description: 'Schedule and conduct interviews' },
    { icon: <CheckCircle className="h-6 w-6 text-white" />, title: 'Make Offers', description: 'Send offers and onboard talent' }
  ];

  const roles = [
    {
      icon: <UserCog className="h-12 w-12 text-white" />,
      title: 'Admin',
      description: 'Complete system control and user management with full access to all features',
      color: 'from-blue-500 to-blue-600',
      delay: 0
    },
    {
      icon: <UserCheck className="h-12 w-12 text-white" />,
      title: 'HR Manager',
      description: 'End-to-end recruitment and candidate management with AI-powered tools',
      color: 'from-purple-500 to-purple-600',
      delay: 0.1
    },
    {
      icon: <Building2 className="h-12 w-12 text-white" />,
      title: 'Manager',
      description: 'Department-specific hiring and team building with approval workflows',
      color: 'from-green-500 to-green-600',
      delay: 0.2
    },
    {
      icon: <Search className="h-12 w-12 text-white" />,
      title: 'Employee',
      description: 'Easy job search and application tracking with personalized recommendations',
      color: 'from-orange-500 to-orange-600',
      delay: 0.3
    }
  ];

  const stats = [
    { value: '500+', label: 'Companies Trust Us', delay: 0 },
    { value: '10,000+', label: 'Jobs Posted Monthly', delay: 0.1 },
    { value: '95%', label: 'Faster Hiring Process', delay: 0.2 },
    { value: '4.9/5', label: 'AI-Powered Matching', delay: 0.3 }
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setIsLoginOpen(true);
  };

  const handleLoginRequired = () => {
    setSelectedRole('employee');
    setIsLoginOpen(true);
  };

  const getRoleTitle = () => {
    const roleTitles = {
      admin: 'Admin',
      hr_recruiter: 'HR Manager',
      manager: 'Manager',
      employee: 'Employee'
    };
    return roleTitles[selectedRole] || '';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold">HR</span>
              </div>
              <span className={`transition-colors ${isScrolled ? 'text-gray-900' : 'text-white'}`}>
                HRMS Portal
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <motion.a 
                href="#features"
                whileHover={{ y: -2 }}
                className={`relative transition-all duration-300 ${isScrolled ? 'text-gray-700' : 'text-white'} hover:text-blue-400 hover:text-lg`}
              >
                <span className="relative">
                Features
                  <motion.span 
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500"
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </span>
              </motion.a>
              <motion.a 
                href="#how-it-works"
                whileHover={{ y: -2 }}
                className={`relative transition-all duration-300 ${isScrolled ? 'text-gray-700' : 'text-white'} hover:text-blue-400 hover:text-lg`}
              >
                <span className="relative">
                How It Works
                  <motion.span 
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500"
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </span>
              </motion.a>
              <motion.a 
                href="#roles"
                whileHover={{ y: -2 }}
                className={`relative transition-all duration-300 ${isScrolled ? 'text-gray-700' : 'text-white'} hover:text-blue-400 hover:text-lg`}
              >
                <span className="relative">
                Roles
                  <motion.span 
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500"
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </span>
              </motion.a>
              <motion.button
                onClick={() => setIsOpportunitiesOpen(true)}
                whileHover={{ y: -2 }}
                className={`relative transition-all duration-300 ${isScrolled ? 'text-gray-700' : 'text-white'} hover:text-blue-400 hover:text-lg`}
              >
                <span className="relative">
                Opportunities
                  <motion.span 
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500"
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </span>
              </motion.button>
              <motion.a 
                href="#contact"
                whileHover={{ y: -2 }}
                className={`relative transition-all duration-300 ${isScrolled ? 'text-gray-700' : 'text-white'} hover:text-blue-400 hover:text-lg`}
              >
                <span className="relative">
                Contact
                  <motion.span 
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500"
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </span>
              </motion.a>
              <Popover>
                <PopoverTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                  <Button 
                      variant={isScrolled ? 'outline' : 'ghost'}
                      className={`transition-all duration-300 hover:scale-105 text-base hover:text-lg ${
                        !isScrolled 
                          ? 'bg-white/10 backdrop-blur-md text-white border border-white/30 hover:bg-white/20 hover:border-white/50 shadow-lg' 
                          : 'bg-transparent hover:bg-gray-100'
                      }`}
                  >
                    Sign In
                  </Button>
                  </motion.div>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 px-2 py-1">Login as:</p>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleRoleSelect('admin')}
                    >
                      <UserCog className="mr-2 h-4 w-4" />
                      Admin
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleRoleSelect('hr_recruiter')}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      HR Manager
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleRoleSelect('manager')}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Manager
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleRoleSelect('employee')}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Employee
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
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
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl border-t border-white/40 shadow-2xl relative overflow-hidden"
          >
            {/* Decorative background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
            
            <div className="px-4 py-4 space-y-3 relative z-10">
              <motion.a 
                href="#features" 
                whileHover={{ x: 5 }}
                className="block py-2 text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium"
              >
                Features
              </motion.a>
              <motion.a 
                href="#how-it-works"
                whileHover={{ x: 5 }}
                className="block py-2 text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium"
              >
                How It Works
              </motion.a>
              <motion.a 
                href="#roles"
                whileHover={{ x: 5 }}
                className="block py-2 text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium"
              >
                Roles
              </motion.a>
              <motion.button
                onClick={() => {
                  setIsOpportunitiesOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                whileHover={{ x: 5 }}
                className="block w-full text-left py-2 text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium"
              >
                Opportunities
              </motion.button>
              <motion.a 
                href="#contact"
                whileHover={{ x: 5 }}
                className="block py-2 text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium"
              >
                Contact
              </motion.a>
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="w-full bg-purple-600/80 text-white hover:bg-purple-700 shadow-lg transition-all duration-200 hover:scale-105 text-base hover:text-lg">
                    Sign In
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 px-2 py-1">Login as:</p>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleRoleSelect('admin')}
                    >
                      <UserCog className="mr-2 h-4 w-4" />
                      Admin
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleRoleSelect('hr_recruiter')}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      HR Manager
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleRoleSelect('manager')}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Manager
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleRoleSelect('employee')}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Employee
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Hero Section with 3D Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
        <div className="absolute inset-0 z-0">
          <AnimatedBackground />
        </div>
        
        {/* Mobile: Centered 3D Scene in Background */}
        <div className="absolute inset-0 lg:hidden z-0 opacity-60">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full max-w-md">
              <HeroScene />
            </div>
          </div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/90 via-purple-600/90 to-pink-500/90 z-10"></div>
        
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-20"
        >
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white space-y-6 relative z-30"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center gap-2 mb-4"
            >
              <Sparkles className="h-8 w-8 animate-pulse text-yellow-300" />
              <span className="text-sm font-semibold text-yellow-300 bg-yellow-300/20 px-3 py-1 rounded-full">
                AI-Powered Recruitment
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight drop-shadow-2xl"
            >
              Streamline Your Hiring Process with{' '}
              <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                AI-Powered HRMS
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-xl text-white/90"
            >
              Complete recruitment solution for modern organizations - from job posting to hiring
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Popover>
                <PopoverTrigger asChild>
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto"
                  >
                  <Button 
                    size="lg" 
                      className="w-full sm:w-auto bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/30 shadow-xl font-semibold px-8 py-6 text-base sm:text-lg transition-all duration-200 hover:scale-105 hover:text-lg"
                  >
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  </motion.div>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 px-2 py-1">Login as:</p>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleRoleSelect('admin')}
                    >
                      <UserCog className="mr-2 h-4 w-4" />
                      Admin
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleRoleSelect('hr_recruiter')}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      HR Manager
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleRoleSelect('manager')}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Manager
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleRoleSelect('employee')}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Employee
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
              <Button 
                size="lg" 
                  onClick={() => { setSelectedRole('employee'); setIsRegisterMode(true); setIsLoginOpen(true); }}
                  className="w-full sm:w-auto bg-purple-600 text-white border border-white/30 hover:bg-purple-700 hover:text-white hover:border-purple-500 backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-105 shadow-xl font-semibold px-8 py-6 text-base sm:text-lg hover:text-lg whitespace-nowrap"
              >
                Get Started
              </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-2xl overflow-hidden shadow-2xl h-[500px]"
            >
              <HeroScene />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-20 md:bottom-8 left-1/2 transform -translate-x-1/2 z-30"
        >
          <ChevronDown className="h-6 w-6 text-white" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-4">
              <Sparkles className="h-12 w-12 text-blue-600 mx-auto" />
          </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600">Everything you need to transform your recruitment process</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: feature.delay, duration: 0.5 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-2xl transition-all duration-300 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity"></div>
                <div 
                  className={`w-16 h-16 rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-lg bg-gradient-to-br ${feature.gradient}`}
                  style={{
                    background: feature.gradient === 'from-blue-500 to-blue-600' ? 'linear-gradient(to bottom right, #3b82f6, #2563eb)' :
                               feature.gradient === 'from-purple-500 to-purple-600' ? 'linear-gradient(to bottom right, #a855f7, #9333ea)' :
                               feature.gradient === 'from-pink-500 to-pink-600' ? 'linear-gradient(to bottom right, #ec4899, #db2777)' :
                               feature.gradient === 'from-green-500 to-green-600' ? 'linear-gradient(to bottom right, #10b981, #059669)' :
                               feature.gradient === 'from-yellow-500 to-yellow-600' ? 'linear-gradient(to bottom right, #eab308, #ca8a04)' :
                               feature.gradient === 'from-indigo-500 to-indigo-600' ? 'linear-gradient(to bottom right, #6366f1, #4f46e5)' : ''
                  }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple, streamlined process from start to finish</p>
          </motion.div>

          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transform -translate-y-1/2"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.1, z: 10 }}
                  className="relative"
                >
                  <div className="flex flex-col items-center text-center">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white mb-4 relative z-10 shadow-lg"
                    >
                      {step.icon}
                    </motion.div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section id="roles" className="py-20 bg-gray-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Built for Every Role</h2>
            <p className="text-xl text-gray-600">Tailored experiences for different user types</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {roles.map((role, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: role.delay, duration: 0.5 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group relative overflow-hidden"
                onClick={() => handleRoleSelect(role.title.toLowerCase())}
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity"></div>
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  className={`w-20 h-20 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}
                  style={{
                    background: role.color === 'from-blue-500 to-blue-600' ? 'linear-gradient(to bottom right, #3b82f6, #2563eb)' :
                               role.color === 'from-purple-500 to-purple-600' ? 'linear-gradient(to bottom right, #a855f7, #9333ea)' :
                               role.color === 'from-green-500 to-green-600' ? 'linear-gradient(to bottom right, #10b981, #059669)' :
                               role.color === 'from-orange-500 to-orange-600' ? 'linear-gradient(to bottom right, #f97316, #ea580c)' : ''
                  }}
                >
                  {role.icon}
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{role.title}</h3>
                <p className="text-gray-600">{role.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section id="stats-section" className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={animateStats ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: stat.delay, duration: 0.8, type: "spring" }}
                className="text-center"
              >
                <div className="text-5xl md:text-6xl font-bold mb-2 text-white drop-shadow-lg">
                  {stat.value}
                </div>
                <p className="text-white/90 text-lg">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block mb-4">
              <Star className="h-12 w-12 text-yellow-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Hiring?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join hundreds of companies already using our AI-powered HRMS
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Popover>
                <PopoverTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="shadow-xl">
                      Get Started Today
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 px-2 py-1">Login as:</p>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleRoleSelect('admin')}
                    >
                      <UserCog className="mr-2 h-4 w-4" />
                      Admin
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleRoleSelect('hr_recruiter')}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      HR Manager
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleRoleSelect('manager')}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Manager
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleRoleSelect('employee')}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Employee
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="outline" className="shadow-xl">
                  Schedule a Demo
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">HR</span>
                </div>
                <span className="font-semibold">HRMS Portal</span>
              </div>
              <p className="text-gray-400 text-sm">
                Modern recruitment made simple with AI-powered tools
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h4 className="mb-4 font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h4 className="mb-4 font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="mb-4 font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </motion.div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-gray-400 mb-4 md:mb-0">
              © 2025 HRMS Portal. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <motion.a href="#" whileHover={{ scale: 1.2, y: -5 }} className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </motion.a>
              <motion.a href="#" whileHover={{ scale: 1.2, y: -5 }} className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </motion.a>
              <motion.a href="#" whileHover={{ scale: 1.2, y: -5 }} className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </motion.a>
              <motion.a href="mailto:support@hrms.com" whileHover={{ scale: 1.2, y: -5 }} className="text-gray-400 hover:text-white transition-colors">
                <Mail className="h-5 w-5" />
              </motion.a>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <Dialog open={isLoginOpen} onOpenChange={(open) => {
        setIsLoginOpen(open);
        if (!open) setIsRegisterMode(false);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">
            {isRegisterMode && selectedRole === 'employee' ? 'Create Account' : 'Sign In'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isRegisterMode && selectedRole === 'employee'
              ? 'Create a new account to access your HRMS dashboard' 
              : 'Sign in to access your HRMS dashboard'}
          </DialogDescription>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl font-bold">HR</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isRegisterMode && selectedRole === 'employee' ? 'Create Account' : 'Welcome Back'}
            </h2>
            {selectedRole && (
              <p className="text-sm text-gray-500 mb-2">
                {isRegisterMode && selectedRole === 'employee' ? 'Registering as' : 'Logging in as'}{' '}
                <span className="font-semibold text-blue-600">{getRoleTitle()}</span>
              </p>
            )}
            <p className="text-gray-600">
              {isRegisterMode && selectedRole === 'employee'
                ? 'Fill in the details to create your account' 
                : 'Sign in to access your dashboard'}
            </p>
          </div>

          {isRegisterMode && selectedRole === 'employee' ? (
            <RegisterForm 
              onSuccess={() => setIsLoginOpen(false)} 
              expectedRole={selectedRole}
            />
          ) : (
            <LoginForm 
              onSuccess={() => setIsLoginOpen(false)} 
              expectedRole={selectedRole}
            />
          )}

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600 mt-4">
              {isRegisterMode ? (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setIsRegisterMode(false)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  {selectedRole === 'employee' ? (
                    <button
                      onClick={() => setIsRegisterMode(true)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Register
                    </button>
                  ) : (
                    <a 
                      href="#contact" 
                      className="text-blue-600 hover:underline font-medium"
                      onClick={() => setIsLoginOpen(false)}
                    >
                      Contact Admin
                    </a>
                  )}
                </>
              )}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Opportunities Dialog */}
      <JobOpportunitiesDialog
        isOpen={isOpportunitiesOpen}
        onClose={() => setIsOpportunitiesOpen(false)}
        onLoginRequired={handleLoginRequired}
      />
    </div>
  );
}
