import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { Features } from '../components/landing/Features';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Partners } from '../components/landing/Partners';
import { PlatformPreview } from '../components/landing/PlatformPreview';
import { CTA } from '../components/landing/CTA';
import { Footer } from '../components/landing/Footer';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Partners />
        <PlatformPreview />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
