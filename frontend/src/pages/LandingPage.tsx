import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Shield, Wrench, MessageSquare, ArrowRight, Star, Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { propertyImages } from "@/lib/placeholders";
import { useState, useEffect } from "react";

const features = [
  { icon: Building2, title: "Portfolio Management", desc: "Manage your entire real estate portfolio from a single, elegant dashboard." },
  { icon: Shield, title: "Secure Leasing", desc: "Digital lease management with e-signatures and automated workflows." },
  { icon: Wrench, title: "Maintenance Tracking", desc: "Streamlined maintenance requests with real-time status updates." },
  { icon: MessageSquare, title: "In-App Messaging", desc: "Direct communication between owners and tenants in one place." },
];

const featuredProperties = [
  { image: propertyImages[0], title: "The Glass Pavilion", location: "Miami Beach, FL", price: "$4,250", beds: 2, baths: 2.5 },
  { image: propertyImages[1], title: "Vanguard Plaza", location: "San Francisco, CA", price: "$3,900", beds: 1, baths: 1 },
  { image: propertyImages[3], title: "The Sterling Heights", location: "New York, NY", price: "$8,250", beds: 3, baths: 3 },
];

// Smooth scroll helper function
const scrollToSection = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    const offset = 80; // Height of fixed navbar
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  }
};

// Scroll to top function
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Handle scrollbar visibility
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      setIsScrolling(true);
      
      // Clear previous timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Hide scrollbar after 1 second of no scrolling
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 1000);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, []);

  const handleNavClick = (sectionId: string) => {
    scrollToSection(sectionId);
    setIsMobileMenuOpen(false); // Close mobile menu if open
  };

  const handleLogoClick = () => {
    scrollToTop();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Global style for scrollbar visibility */}
      <style>{`
        /* Hide scrollbar by default */
        ::-webkit-scrollbar {
          width: 8px;
          background: transparent;
        }
        
        /* Show scrollbar only when scrolling */
        body {
          scrollbar-width: ${isScrolling ? 'auto' : 'none'};
        }
        
        body::-webkit-scrollbar-track {
          background: transparent;
        }
        
        body::-webkit-scrollbar-thumb {
          background: ${isScrolling ? '#888' : 'transparent'};
          border-radius: 4px;
          transition: background 0.3s ease;
        }
        
        body::-webkit-scrollbar-thumb:hover {
          background: ${isScrolling ? '#555' : 'transparent'};
        }
        
        /* Firefox scrollbar styling */
        body {
          scrollbar-width: ${isScrolling ? 'auto' : 'none'};
        }
      `}</style>
      
      <div className="min-h-screen bg-background overflow-x-hidden">
        {/* Navbar */}
        <nav className="fixed top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            {/* Logo - Click to scroll to top */}
            <div 
              onClick={handleLogoClick}
              className="flex cursor-pointer items-center gap-2"
            >
              <img src={logo} alt="Digital Estate" className="h-7 w-7 sm:h-8 sm:w-8" width={32} height={32} />
              <span className="text-base sm:text-lg font-bold text-foreground">Digital Estate</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-6 md:flex">
              <button 
                onClick={() => handleNavClick("properties")}
                className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                Properties
              </button>
              <button 
                onClick={() => handleNavClick("features")}
                className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => handleNavClick("about")}
                className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                About
              </button>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/75">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-md p-2 hover:bg-muted md:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-foreground" />
              ) : (
                <Menu className="h-5 w-5 text-foreground" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="border-t border-border bg-card md:hidden">
              <div className="flex flex-col space-y-3 p-4">
                <button
                  onClick={() => handleNavClick("properties")}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md text-left"
                >
                  Properties
                </button>
                <button
                  onClick={() => handleNavClick("features")}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md text-left"
                >
                  Features
                </button>
                <button
                  onClick={() => handleNavClick("about")}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md text-left"
                >
                  About
                </button>
                <div className="flex flex-col gap-2 pt-2">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full">Sign In</Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button size="sm" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/75">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="relative flex min-h-screen items-center pt-16">

          <div className="absolute inset-0 z-0">
            <img src={propertyImages[0]} alt="Hero" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-primary/80" />
          </div>
          
          {/* Mobile Content */}
          <div className="relative z-10 w-full mx-auto max-w-7xl px-5 sm:hidden">
            <div className="max-w-full">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-secondary">
                Architectural Authority
              </p>
              <h1 className="mb-4 text-4xl font-bold leading-tight text-primary-foreground">
                Premium Property Management, Reimagined
              </h1>
              <p className="mb-6 text-base text-primary-foreground/80">
                A sophisticated platform for managing high-end residential and commercial properties with precision and elegance.
              </p>
              <div className="flex flex-col gap-3">
                <Link to="/register" className="w-full">
                  <Button size="default" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/85 py-2.5">
                    Explore Properties <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login" className="w-full">
                  <Button size="default" variant="outline" className="w-full border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-secondary hover:text-secondary-foreground py-2.5">
                    Owner Portal
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Desktop Content */}
          <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 hidden sm:block">
            <div className="max-w-2xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-secondary">
                Architectural Authority
              </p>
              <h1 className="mb-6 text-5xl font-bold leading-tight text-primary-foreground md:text-6xl">
                Premium Property Management, Reimagined
              </h1>
              <p className="mb-8 text-lg text-primary-foreground/80">
                A sophisticated platform for managing high-end residential and commercial properties with precision and elegance.
              </p>
              <div className="flex gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/85 px-8">
                    Explore Properties <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-secondary hover:text-secondary-foreground px-8">
                    Owner Portal
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Properties */}
        <section id="properties" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20 scroll-mt-20">
          <div className="mb-8 sm:mb-12 text-center">
            <p className="mb-2 text-xs sm:text-sm font-semibold uppercase tracking-widest text-secondary">Curated Collection</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Featured Properties</h2>
            <p className="mx-auto mt-3 sm:mt-4 max-w-xl text-sm sm:text-base text-muted-foreground">
              Discover our handpicked selection of premium residences designed for modern living.
            </p>
          </div>
          
          {/* See More link - Desktop */}
          <div className="hidden sm:flex justify-end mb-4">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-secondary transition-colors group"
            >
              See more
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredProperties.map((p, i) => (
              <div key={i} className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-lg">
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  <span className="absolute left-3 top-3 rounded bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground">
                    FEATURED
                  </span>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm sm:text-base">{p.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{p.location}</p>
                    </div>
                    <span className="text-base sm:text-lg font-bold text-secondary">{p.price}<span className="text-xs text-muted-foreground">/mo</span></span>
                  </div>
                  <div className="mt-3 sm:mt-4 flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
                    <span>{p.beds} Beds</span>
                    <span>{p.baths} Baths</span>
                  </div>
                  <Link to="/login">
                    <Button className="mt-4 w-full bg-secondary text-secondary-foreground hover:bg-secondary/85" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          {/* See More link - Mobile */}
          <div className="mt-4 flex justify-end sm:hidden">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-secondary transition-colors group"
            >
              See more
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-primary py-12 sm:py-20 scroll-mt-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 sm:mb-12 text-center">
              <p className="mb-2 text-xs sm:text-sm font-semibold uppercase tracking-widest text-secondary">Why Digital Estate</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-foreground">Built for Excellence</h2>
            </div>
            <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((f, i) => (
                <div key={i} className="rounded-lg bg-sidebar-accent p-5 sm:p-6 transition-transform hover:scale-105">
                  <f.icon className="mb-3 sm:mb-4 h-6 w-6 sm:h-8 sm:w-8 text-secondary" />
                  <h3 className="mb-2 font-semibold text-primary-foreground text-base sm:text-lg">{f.title}</h3>
                  <p className="text-xs sm:text-sm text-primary-foreground/70">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial / About */}
        <section id="about" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20 scroll-mt-20">
          <div className="rounded-xl bg-muted p-6 sm:p-12 text-center">
            <Star className="mx-auto mb-3 sm:mb-4 h-6 w-6 sm:h-8 sm:w-8 text-secondary" />
            <blockquote className="mx-auto max-w-2xl text-base sm:text-xl italic text-foreground">
              "Digital Estate transformed how we manage our portfolio. The platform's attention to detail mirrors the quality of the properties we manage."
            </blockquote>
            <p className="mt-4 sm:mt-6 font-semibold text-foreground text-sm sm:text-base">Alexander Thorne</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Portfolio Manager, Sterling Holdings</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-card py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <img src={logo} alt="Digital Estate" className="h-5 w-5 sm:h-6 sm:w-6" width={24} height={24} />
                  <span className="font-bold text-foreground text-sm sm:text-base">Digital Estate</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">© 2024 THE DIGITAL ESTATE. ARCHITECTURAL AUTHORITY.</p>
              </div>
              <div className="flex gap-4 sm:gap-6 text-xs text-muted-foreground">
                <span className="hover:text-foreground cursor-pointer transition-colors">TERMS</span>
                <span className="hover:text-foreground cursor-pointer transition-colors">PRIVACY</span>
                <span className="hover:text-foreground cursor-pointer transition-colors">SUPPORT</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Add custom animation keyframes */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scrollDown {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(10px);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        .animate-scroll-down {
          animation: scrollDown 1.5s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}