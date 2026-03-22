import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { Problem } from '../components/landing/Problem';
import { Solution } from '../components/landing/Solution';
import { Features } from '../components/landing/Features';
import { HowItWorks } from '../components/landing/HowItWorks';
import { WhoIsItFor } from '../components/landing/WhoIsItFor';
import { Partners } from '../components/landing/Partners';
import { CTA } from '../components/landing/CTA';
import { Footer } from '../components/landing/Footer';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <Features />
        <HowItWorks />
        <WhoIsItFor />
        <Partners />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
