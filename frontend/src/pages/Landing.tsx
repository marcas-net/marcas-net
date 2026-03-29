import { Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { Problem } from '../components/landing/Problem';
import { Solution } from '../components/landing/Solution';
import { Footer } from '../components/landing/Footer';

const Features = lazy(() => import('../components/landing/Features').then(m => ({ default: m.Features })));
const HowItWorks = lazy(() => import('../components/landing/HowItWorks').then(m => ({ default: m.HowItWorks })));
const WhoIsItFor = lazy(() => import('../components/landing/WhoIsItFor').then(m => ({ default: m.WhoIsItFor })));
const Partners = lazy(() => import('../components/landing/Partners').then(m => ({ default: m.Partners })));
const CTA = lazy(() => import('../components/landing/CTA').then(m => ({ default: m.CTA })));

function SectionFallback() {
  return <div className="py-24 flex items-center justify-center"><div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden transition-colors">
      <Helmet>
        <title>MarcasNet – The Professional Network for the Food Industry</title>
        <meta name="description" content="MarcasNet is the professional network for the food industry. Connect with producers, labs, regulators, and researchers while managing certifications, documents, and compliance workflows." />
        <meta name="keywords" content="food industry network, food safety, nutrition, laboratory, compliance, certification, professional network, food producers, regulators" />
        <link rel="canonical" href="https://marcas-net.com" />
        <meta property="og:title" content="MarcasNet – The Professional Network for the Food Industry" />
        <meta property="og:description" content="Connect with producers, labs, regulators, and researchers. Manage certifications, documents, and compliance workflows in one platform." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/logo-icon.jpeg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MarcasNet – Food Industry Professional Network" />
        <meta name="twitter:description" content="Connect, collaborate, and stay compliant. The professional network built for the food ecosystem." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "MarcasNet",
          "applicationCategory": "BusinessApplication",
          "description": "Collaboration platform for the food and nutrition ecosystem.",
          "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
        })}</script>
      </Helmet>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <Suspense fallback={<SectionFallback />}><Features /></Suspense>
        <Suspense fallback={<SectionFallback />}><HowItWorks /></Suspense>
        <Suspense fallback={<SectionFallback />}><WhoIsItFor /></Suspense>
        <Suspense fallback={<SectionFallback />}><Partners /></Suspense>
        <Suspense fallback={<SectionFallback />}><CTA /></Suspense>
      </main>
      <Footer />
    </div>
  );
}
