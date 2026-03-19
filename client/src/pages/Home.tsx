/**
 * A1 Marine Care — Premium Service Configurator
 * Design: Dark luxury marine aesthetic
 * Colors: #000000 bg, #2B2B2B cards, #00FFFF accent
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BoatDetails,
  BottomPaintingConfig,
  calculateTotal,
  calculateGelcoat,
  calculateExterior,
  calculateInterior,
  calculateCeramic,
  calculateGraphene,
  calculateWetSanding,
  calculateBottomPainting,
  calculateVinyl,
  CeramicConfig,
  ContactInfo,
  ExteriorConfig,
  GelcoatConfig,
  GrapheneConfig,
  InteriorConfig,
  ServiceSelections,
  VinylConfig,
  WetSandingConfig
} from "@/lib/pricing";
import { Anchor, Download, Loader2, Mail, MapPin, Phone, Ruler, Ship, User, Waves } from "lucide-react";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import LearnMoreModal, { type ServiceKey } from "@/components/LearnMoreModal";
import ProgressBar from "@/components/configurator/ProgressBar";
import ServiceCard from "@/components/configurator/ServiceCard";
import TierSelector from "@/components/configurator/TierSelector";
import OptionToggle from "@/components/configurator/OptionToggle";
import StickyPricePanel from "@/components/configurator/StickyPricePanel";
import AnimatedPrice from "@/components/configurator/AnimatedPrice";

/* ── Tier definitions ───────────────────────────────────────────────── */
const EXTERIOR_TIERS = [
  { value: "refresh", label: "Refresh", multiplier: "1.0x", description: "Quick maintenance clean for well-kept boats" },
  { value: "standard", label: "Standard", multiplier: "1.2x", description: "Full wash, clay bar, and hand polish with sealant" },
  { value: "deep", label: "Deep Clean", multiplier: "1.4x", description: "Heavy decontamination and multi-stage polish" },
  { value: "restoration", label: "Restoration", multiplier: "1.6x", description: "Complete exterior revival for neglected surfaces" },
];

const INTERIOR_TIERS = [
  { value: "refresh", label: "Refresh", multiplier: "1.0x", description: "Light vacuum, wipe-down, and surface sanitisation" },
  { value: "standard", label: "Standard", multiplier: "1.25x", description: "Full vacuum, upholstery cleaning, and treatment" },
  { value: "deep", label: "Deep Clean", multiplier: "1.5x", description: "Intensive deep cleaning of all surfaces and fabrics" },
  { value: "restoration", label: "Restoration", multiplier: "1.75x", description: "Complete interior restoration for heavy soiling" },
];

/* ── Service metadata ───────────────────────────────────────────────── */
const SERVICE_META: Record<ServiceKey, { title: string; description: string }> = {
  gelcoat: { title: "Gelcoat Restoration", description: "Restore gloss and remove oxidation from fiberglass surfaces." },
  exterior: { title: "Exterior Detailing", description: "Professional exterior cleaning, polishing, and protection." },
  interior: { title: "Interior Detailing", description: "Thorough interior cleaning tailored to your boat and condition." },
  ceramic: { title: "Ceramic Coating", description: "Long-lasting hydrophobic barrier against UV, salt, and contaminants." },
  graphene: { title: "Graphene Nano Coating", description: "Next-gen graphene coating with superior hardness and heat resistance." },
  wetSanding: { title: "Wet Sanding & Correction", description: "Precision wet sanding to remove deep scratches and imperfections." },
  bottomPainting: { title: "Bottom Painting", description: "Antifouling bottom paint to protect against marine growth." },
  vinyl: { title: "Vinyl Removal & Installation", description: "Professional vinyl graphics removal, installation, or both." },
};

export default function Home() {
  const isTestMode = new URLSearchParams(window.location.search).get('test') === 'true';

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const submitQuote = trpc.quotes.submit.useMutation();
  const createCheckoutSession = trpc.quotes.createCheckoutSession.useMutation();

  // Learn More modal
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);
  const [learnMoreService, setLearnMoreService] = useState<ServiceKey | null>(null);
  const openLearnMore = (service: ServiceKey) => { setLearnMoreService(service); setLearnMoreOpen(true); };

  // ── Boat details ──
  const [boatDetails, setBoatDetails] = useState<BoatDetails>({ length: 0, type: "", location: "" });

  // ── Contact info ──
  const [contactInfo, setContactInfo] = useState<ContactInfo>({ fullName: "", email: "", phone: "" });

  // ── Service selections ──
  const [selectedServices, setSelectedServices] = useState<{
    gelcoat: boolean; exterior: boolean; interior: boolean; ceramic: boolean;
    graphene: boolean; wetSanding: boolean; bottomPainting: boolean; vinyl: boolean;
  }>({
    gelcoat: false, exterior: false, interior: false, ceramic: false,
    graphene: false, wetSanding: false, bottomPainting: false, vinyl: false,
  });

  // ── Service configs (unchanged) ──
  const [gelcoatConfig, setGelcoatConfig] = useState<GelcoatConfig>({
    area: 'hull', radarArch: false, hardTop: false, spotWetSanding: 0, heavyOxidation: false,
  });
  const [exteriorConfig, setExteriorConfig] = useState<ExteriorConfig>({
    tier: 'refresh', teakCleaning: false, canvasCleaning: false, fenderCleaning: false, exteriorOzone: false,
  });
  const [interiorConfig, setInteriorConfig] = useState<InteriorConfig>({
    tier: 'refresh', moldRemediation: false, mattressShampoo: false, headDeepClean: false,
    galleyDeepClean: false, petHairRemoval: false, ozoneInterior: false, photos: [], photoConfirmation: false,
  });
  const [ceramicConfig, setCeramicConfig] = useState<CeramicConfig>({
    secondLayer: false, teakCeramic: false, interiorCeramic: false,
  });
  const [grapheneConfig, setGrapheneConfig] = useState<GrapheneConfig>({
    secondLayer: false, teakGraphene: false,
  });
  const [wetSandingConfig, setWetSandingConfig] = useState<WetSandingConfig>({
    deepScratchRepair: false, spotWetSanding: 0,
  });
  const [bottomPaintingConfig, setBottomPaintingConfig] = useState<BottomPaintingConfig>({
    secondCoat: false, oldPaintRemoval: false, heavyGrowthRemoval: false, blisterRepair: false,
  });
  const [vinylConfig, setVinylConfig] = useState<VinylConfig>({
    service: 'removal', customDesign: false,
  });

  // ── Calculate total (pricing logic untouched) ──
  const services: ServiceSelections = {};
  if (selectedServices.gelcoat) services.gelcoat = gelcoatConfig;
  if (selectedServices.exterior) services.exterior = exteriorConfig;
  if (selectedServices.interior) services.interior = interiorConfig;
  if (selectedServices.ceramic) services.ceramic = ceramicConfig;
  if (selectedServices.graphene) services.graphene = grapheneConfig;
  if (selectedServices.wetSanding) services.wetSanding = wetSandingConfig;
  if (selectedServices.bottomPainting) services.bottomPainting = bottomPaintingConfig;
  if (selectedServices.vinyl) services.vinyl = vinylConfig;

  const estimate = boatDetails.length > 0 ? calculateTotal(boatDetails.length, boatDetails.type, services) : null;

  const hasSelectedServices = Object.values(selectedServices).some(v => v);
  const hasRequiredFields = boatDetails.length > 0 && boatDetails.type && boatDetails.location &&
    contactInfo.fullName && contactInfo.email && contactInfo.phone;
  const canPayDeposit = hasSelectedServices && hasRequiredFields && estimate && estimate.subtotal > 0;

  // ── Progress step ──
  const currentStep = useMemo(() => {
    if (canPayDeposit) return 3;
    if (hasSelectedServices) return 2;
    if (boatDetails.length > 0 && boatDetails.type) return 1;
    return 0;
  }, [canPayDeposit, hasSelectedServices, boatDetails.length, boatDetails.type]);

  // ── Line items for price panel ──
  const lineItems = useMemo(() => {
    if (!estimate) return [];
    const items: { label: string; amount: number }[] = [];
    // Parse breakdown lines to extract service totals
    let currentService = "";
    let serviceTotal = 0;
    for (const line of estimate.breakdown) {
      if (line.startsWith("---")) {
        if (currentService && serviceTotal > 0) {
          items.push({ label: currentService, amount: serviceTotal });
        }
        currentService = line.replace(/^-+\s*/, "").replace(/\s*-+$/, "").trim();
        serviceTotal = 0;
      } else {
        const match = line.match(/\$([0-9,]+(?:\.\d{2})?)\s*$/);
        if (match) {
          serviceTotal += parseFloat(match[1].replace(/,/g, ""));
        }
        // Handle range format: $X – $Y
        const rangeMatch = line.match(/\$([0-9,]+)\s*[–-]\s*\$([0-9,]+)/);
        if (rangeMatch && !match) {
          // Use midpoint for display
          const low = parseFloat(rangeMatch[1].replace(/,/g, ""));
          const high = parseFloat(rangeMatch[2].replace(/,/g, ""));
          serviceTotal += (low + high) / 2;
        }
      }
    }
    if (currentService && serviceTotal > 0) {
      items.push({ label: currentService, amount: serviceTotal });
    }
    // If no structured breakdown, show single total
    if (items.length === 0 && estimate.subtotal > 0) {
      items.push({ label: "Selected Services", amount: estimate.subtotal });
    }
    return items;
  }, [estimate]);

  // ── Per-service subtotals (used for Stripe description) ──
  const perServiceSubtotals = useMemo(() => {
    if (!boatDetails.length) return [];
    const items: { name: string; price: number }[] = [];
    if (selectedServices.gelcoat) {
      const r = calculateGelcoat(boatDetails.length, gelcoatConfig);
      items.push({ name: 'Gelcoat Restoration', price: r.subtotal });
    }
    if (selectedServices.exterior) {
      const r = calculateExterior(boatDetails.length, exteriorConfig);
      items.push({ name: 'Exterior Detailing', price: r.subtotal });
    }
    if (selectedServices.interior) {
      const r = calculateInterior(boatDetails.length, boatDetails.type, interiorConfig);
      items.push({ name: 'Interior Detailing', price: r.subtotal });
    }
    if (selectedServices.ceramic) {
      const r = calculateCeramic(boatDetails.length, ceramicConfig);
      items.push({ name: 'Ceramic Coating', price: r.subtotal });
    }
    if (selectedServices.graphene) {
      const r = calculateGraphene(boatDetails.length, grapheneConfig);
      items.push({ name: 'Graphene Nano Coating', price: r.subtotal });
    }
    if (selectedServices.wetSanding) {
      const r = calculateWetSanding(boatDetails.length, wetSandingConfig);
      items.push({ name: 'Wet Sanding & Correction', price: r.subtotal });
    }
    if (selectedServices.bottomPainting) {
      const r = calculateBottomPainting(boatDetails.length, bottomPaintingConfig);
      items.push({ name: 'Bottom Painting', price: r.subtotal });
    }
    if (selectedServices.vinyl) {
      const r = calculateVinyl(boatDetails.length, vinylConfig);
      items.push({ name: 'Vinyl Services', price: r.subtotal });
    }
    return items;
  }, [boatDetails.length, boatDetails.type, selectedServices, gelcoatConfig, exteriorConfig, interiorConfig, ceramicConfig, grapheneConfig, wetSandingConfig, bottomPaintingConfig, vinylConfig]);

  // ── Submit handler ──
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await submitQuote.mutateAsync({
        customerName: contactInfo.fullName,
        customerEmail: contactInfo.email,
        customerPhone: contactInfo.phone,
        boatLength: boatDetails.length,
        boatType: boatDetails.type,
        serviceLocation: boatDetails.location,
        estimatedTotal: Math.round((estimate?.subtotal || 0) * 100),
        requiresManualReview: estimate?.requiresManualReview || false,
        reviewReasons: estimate?.reviewReasons,
        servicesConfig: {
          selectedServices,
          gelcoat: selectedServices.gelcoat ? gelcoatConfig : undefined,
          exterior: selectedServices.exterior ? exteriorConfig : undefined,
          interior: selectedServices.interior ? interiorConfig : undefined,
          ceramic: selectedServices.ceramic ? ceramicConfig : undefined,
          graphene: selectedServices.graphene ? grapheneConfig : undefined,
          wetSanding: selectedServices.wetSanding ? wetSandingConfig : undefined,
          bottomPainting: selectedServices.bottomPainting ? bottomPaintingConfig : undefined,
          vinyl: selectedServices.vinyl ? vinylConfig : undefined,
        },
      });
      localStorage.setItem('lastQuoteId', result.quoteId.toString());
      
      if (isTestMode) {
        window.location.href = '/thank-you';
      } else {
        // Build selected services array for Stripe using per-service subtotals (accurate prices from pricing engine)
        const selectedServicesArray = perServiceSubtotals.map((item, i) => ({
          id: i + 1,
          name: item.name,
          price: item.price,
        }));
        
        // Create Stripe checkout session
        const checkoutResult = await createCheckoutSession.mutateAsync({
          quoteId: result.quoteId.toString(),
          customerName: contactInfo.fullName,
          customerEmail: contactInfo.email,
          customerPhone: contactInfo.phone,
          boatLength: boatDetails.length,
          boatType: boatDetails.type,
          serviceLocation: boatDetails.location,
          selectedServices: selectedServicesArray,
          depositAmount: 100, // $1 in cents
          estimatedTotal: Math.round((estimate?.subtotal || 0) * 100),
          successUrl: 'https://booking.a1marinecare.ca',
          cancelUrl: window.location.href,
        });
        
        if (checkoutResult.url) {
          window.location.href = checkoutResult.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      }
    } catch (error) {
      console.error('Failed to submit quote:', error);
      alert('Failed to submit quote. Please try again.');
      setIsSubmitting(false);
    }
  };

  // ── PDF download handler ──
  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    try {
      const response = await fetch('/api/quote/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: contactInfo.fullName,
          customerEmail: contactInfo.email,
          customerPhone: contactInfo.phone,
          boatLength: boatDetails.length,
          boatType: boatDetails.type,
          serviceLocation: boatDetails.location,
          services,
          estimatedTotal: Math.round((estimate?.subtotal || 0) * 100),
          breakdown: estimate?.breakdown || [],
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `A1-Quote-${contactInfo.fullName.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Failed to download PDF:', error);
      alert(`Failed to download PDF: ${error.message}. Please try again.`);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // ── Toggle helper ──
  const toggleService = (key: keyof typeof selectedServices) =>
    setSelectedServices({ ...selectedServices, [key]: !selectedServices[key] });

  /* ════════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#000000]">
      {/* ── Header ── */}
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663289180469/WGIEJYNWHRlJZpOd.png"
            alt="A1 Marine Care"
            className="h-16 sm:h-20 w-auto"
          />
          <a
            href="https://a1marinecare.ca"
            className="text-sm text-[#00FFFF] hover:text-[#00FFFF]/80 transition-colors font-medium"
          >
            Back to Home
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* ── Hero ── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00FFFF]/10 border border-[#00FFFF]/20 mb-5">
            <Waves className="w-4 h-4 text-[#00FFFF]" />
            <span className="text-sm font-medium text-[#00FFFF]">A1 Service. A1 Results.</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Configure Your Service Package
          </h1>
          <p className="text-white/50 max-w-xl mx-auto">
            Premium boat care with transparent pricing. Customize your services and get an instant estimate.
          </p>
        </div>

        {/* ── Progress Bar ── */}
        <div className="mb-10 max-w-2xl mx-auto lg:max-w-none">
          <ProgressBar currentStep={currentStep} />
        </div>

        {/* ── Two-column layout: form + sticky panel ── */}
        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8">
          {/* LEFT COLUMN — Form */}
          <div className="space-y-8 pb-24 lg:pb-0">

            {/* ═══ SECTION 1: BOAT DETAILS ═══ */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-[#00FFFF]/10 flex items-center justify-center">
                  <Anchor className="w-4 h-4 text-[#00FFFF]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Boat Details</h2>
                  <p className="text-xs text-white/40">Tell us about your vessel</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/60 text-sm flex items-center gap-2">
                    <Ruler className="w-3.5 h-3.5" /> Boat Length (ft)
                  </Label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={boatDetails.length || ""}
                    onChange={(e) => setBoatDetails({ ...boatDetails, length: parseInt(e.target.value) || 0 })}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-11 rounded-xl focus:border-[#00FFFF]/50 focus:ring-[#00FFFF]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60 text-sm flex items-center gap-2">
                    <Ship className="w-3.5 h-3.5" /> Boat Type
                  </Label>
                  <Select value={boatDetails.type} onValueChange={(v) => setBoatDetails({ ...boatDetails, type: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 rounded-xl focus:border-[#00FFFF]/50 focus:ring-[#00FFFF]/20">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2B2B2B] border-white/10">
                      <SelectItem value="bowrider">Bowrider</SelectItem>
                      <SelectItem value="cruiser">Cruiser</SelectItem>
                      <SelectItem value="yacht">Yacht</SelectItem>
                      <SelectItem value="sailboat">Sailboat</SelectItem>
                      <SelectItem value="pontoon">Pontoon</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60 text-sm flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Service Location
                  </Label>
                  <Input
                    placeholder="Marina name or city"
                    value={boatDetails.location}
                    onChange={(e) => setBoatDetails({ ...boatDetails, location: e.target.value })}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-11 rounded-xl focus:border-[#00FFFF]/50 focus:ring-[#00FFFF]/20"
                  />
                </div>
              </div>
            </section>

            {/* ═══ SECTION 2: CONTACT INFO ═══ */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-[#00FFFF]/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-[#00FFFF]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Contact Information</h2>
                  <p className="text-xs text-white/40">How can we reach you?</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/60 text-sm flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Full Name
                  </Label>
                  <Input
                    placeholder="John Smith"
                    value={contactInfo.fullName}
                    onChange={(e) => setContactInfo({ ...contactInfo, fullName: e.target.value })}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-11 rounded-xl focus:border-[#00FFFF]/50 focus:ring-[#00FFFF]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60 text-sm flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </Label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-11 rounded-xl focus:border-[#00FFFF]/50 focus:ring-[#00FFFF]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60 text-sm flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> Phone
                  </Label>
                  <Input
                    type="tel"
                    placeholder="(705) 996-1010"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-11 rounded-xl focus:border-[#00FFFF]/50 focus:ring-[#00FFFF]/20"
                  />
                </div>
              </div>
            </section>

            {/* ═══ SECTION 3: SERVICES ═══ */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-[#00FFFF]/10 flex items-center justify-center">
                  <Waves className="w-4 h-4 text-[#00FFFF]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Choose Your Services</h2>
                  <p className="text-xs text-white/40">Select and configure the services you need</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* ── Gelcoat Restoration ── */}
                <ServiceCard
                  id="gelcoat"
                  title={SERVICE_META.gelcoat.title}
                  description={SERVICE_META.gelcoat.description}
                  selected={selectedServices.gelcoat}
                  onToggle={() => toggleService("gelcoat")}
                  onLearnMore={() => openLearnMore("gelcoat")}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white/60 text-sm">Coverage Area</Label>
                      <Select value={gelcoatConfig.area} onValueChange={(v: any) => setGelcoatConfig({ ...gelcoatConfig, area: v })}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2B2B2B] border-white/10">
                          <SelectItem value="hull">Hull (Below Rub Rail)</SelectItem>
                          <SelectItem value="topsides">Topsides</SelectItem>
                          <SelectItem value="bowrider">Bowrider Special (Low Gelcoat Only)</SelectItem>
                          <SelectItem value="fullboat">Full Boat (Hull + Topsides)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <OptionToggle id="radarArch" label="Radar Arch (+$175)" checked={gelcoatConfig.radarArch} onChange={(c) => setGelcoatConfig({ ...gelcoatConfig, radarArch: c })} />
                      <OptionToggle id="hardTop" label="Hard Top (+$475)" checked={gelcoatConfig.hardTop} onChange={(c) => setGelcoatConfig({ ...gelcoatConfig, hardTop: c })} />
                      <OptionToggle id="heavyOxidation" label="Heavy Oxidation (+20%)" checked={gelcoatConfig.heavyOxidation} onChange={(c) => setGelcoatConfig({ ...gelcoatConfig, heavyOxidation: c })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/60 text-sm">Spot Wet Sanding Areas</Label>
                      <Input
                        type="number" min="0" placeholder="0"
                        value={gelcoatConfig.spotWetSanding || ""}
                        onChange={(e) => setGelcoatConfig({ ...gelcoatConfig, spotWetSanding: parseInt(e.target.value) || 0 })}
                        className="bg-white/5 border-white/10 text-white h-10 rounded-xl w-32"
                      />
                      <p className="text-xs text-white/30">$125 per area</p>
                    </div>
                  </div>
                </ServiceCard>

                {/* ── Exterior Detailing ── */}
                <ServiceCard
                  id="exterior"
                  title={SERVICE_META.exterior.title}
                  description={SERVICE_META.exterior.description}
                  selected={selectedServices.exterior}
                  onToggle={() => toggleService("exterior")}
                  onLearnMore={() => openLearnMore("exterior")}
                >
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white/60 text-sm mb-3 block">Service Tier</Label>
                      <TierSelector
                        tiers={EXTERIOR_TIERS}
                        selected={exteriorConfig.tier}
                        onSelect={(v) => setExteriorConfig({ ...exteriorConfig, tier: v as any })}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <OptionToggle id="teakCleaning" label="Teak Cleaning (+$225)" checked={exteriorConfig.teakCleaning} onChange={(c) => setExteriorConfig({ ...exteriorConfig, teakCleaning: c })} />
                      <OptionToggle id="canvasCleaning" label="Canvas Cleaning (+$150)" checked={exteriorConfig.canvasCleaning} onChange={(c) => setExteriorConfig({ ...exteriorConfig, canvasCleaning: c })} />
                      <OptionToggle id="fenderCleaning" label="Fender Cleaning (+$60)" checked={exteriorConfig.fenderCleaning} onChange={(c) => setExteriorConfig({ ...exteriorConfig, fenderCleaning: c })} />
                      <OptionToggle id="exteriorOzone" label="Exterior Ozone (+$100)" checked={exteriorConfig.exteriorOzone} onChange={(c) => setExteriorConfig({ ...exteriorConfig, exteriorOzone: c })} />
                    </div>
                  </div>
                </ServiceCard>

                {/* ── Interior Detailing ── */}
                <ServiceCard
                  id="interior"
                  title={SERVICE_META.interior.title}
                  description={SERVICE_META.interior.description}
                  selected={selectedServices.interior}
                  onToggle={() => toggleService("interior")}
                  onLearnMore={() => openLearnMore("interior")}
                >
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white/60 text-sm mb-3 block">Service Tier</Label>
                      <TierSelector
                        tiers={INTERIOR_TIERS}
                        selected={interiorConfig.tier}
                        onSelect={(v) => setInteriorConfig({ ...interiorConfig, tier: v as any })}
                      />
                    </div>
                    <div className="rounded-xl bg-[#00FFFF]/[0.04] border border-[#00FFFF]/20 p-3.5">
                      <p className="text-sm text-white/70">
                        <span className="font-semibold text-white">Photos will be requested after checkout.</span>{" "}
                        After you complete your deposit, we'll send you an email requesting 3–10 interior photos so our team can prepare for your service.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <OptionToggle id="moldRemediation" label="Mold & Mildew Remediation (+$295)" checked={interiorConfig.moldRemediation} onChange={(c) => setInteriorConfig({ ...interiorConfig, moldRemediation: c })} />
                      <OptionToggle id="petHairRemoval" label="Heavy Pet Hair Removal (+$150)" checked={interiorConfig.petHairRemoval} onChange={(c) => setInteriorConfig({ ...interiorConfig, petHairRemoval: c })} />
                      {['cuddy', 'cruiser', 'express', 'yacht'].includes(boatDetails.type) && (
                        <OptionToggle id="mattressShampoo" label="Mattress / Cushion Shampoo (+$175)" checked={interiorConfig.mattressShampoo} onChange={(c) => setInteriorConfig({ ...interiorConfig, mattressShampoo: c })} />
                      )}
                      <OptionToggle id="headDeepClean" label="Head (Bathroom) Deep Clean (+$125)" checked={interiorConfig.headDeepClean} onChange={(c) => setInteriorConfig({ ...interiorConfig, headDeepClean: c })} />
                      <OptionToggle id="galleyDeepClean" label="Galley Deep Clean (+$175)" checked={interiorConfig.galleyDeepClean} onChange={(c) => setInteriorConfig({ ...interiorConfig, galleyDeepClean: c })} />
                      {(interiorConfig.tier === 'deep' || interiorConfig.tier === 'restoration') && (
                        <OptionToggle id="ozoneInterior" label="Ozone Odor Treatment (+$195)" checked={interiorConfig.ozoneInterior} onChange={(c) => setInteriorConfig({ ...interiorConfig, ozoneInterior: c })} />
                      )}
                    </div>
                  </div>
                </ServiceCard>

                {/* ── Ceramic Coating ── */}
                <ServiceCard
                  id="ceramic"
                  title={SERVICE_META.ceramic.title}
                  description={SERVICE_META.ceramic.description}
                  selected={selectedServices.ceramic}
                  onToggle={() => toggleService("ceramic")}
                  onLearnMore={() => openLearnMore("ceramic")}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <OptionToggle id="secondLayerCeramic" label="Second Layer (+$8/ft)" checked={ceramicConfig.secondLayer} onChange={(c) => setCeramicConfig({ ...ceramicConfig, secondLayer: c })} />
                    <OptionToggle id="teakCeramic" label="Teak Ceramic (+$300)" checked={ceramicConfig.teakCeramic} onChange={(c) => setCeramicConfig({ ...ceramicConfig, teakCeramic: c })} />
                    <OptionToggle id="interiorCeramic" label="Interior Ceramic (+$150)" checked={ceramicConfig.interiorCeramic} onChange={(c) => setCeramicConfig({ ...ceramicConfig, interiorCeramic: c })} />
                  </div>
                </ServiceCard>

                {/* ── Graphene Nano Coating ── */}
                <ServiceCard
                  id="graphene"
                  title={SERVICE_META.graphene.title}
                  description={SERVICE_META.graphene.description}
                  selected={selectedServices.graphene}
                  onToggle={() => toggleService("graphene")}
                  onLearnMore={() => openLearnMore("graphene")}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <OptionToggle id="secondLayerGraphene" label="Second Layer (+$10/ft)" checked={grapheneConfig.secondLayer} onChange={(c) => setGrapheneConfig({ ...grapheneConfig, secondLayer: c })} />
                    <OptionToggle id="teakGraphene" label="Teak Graphene (+$350)" checked={grapheneConfig.teakGraphene} onChange={(c) => setGrapheneConfig({ ...grapheneConfig, teakGraphene: c })} />
                  </div>
                </ServiceCard>

                {/* ── Wet Sanding & Correction ── */}
                <ServiceCard
                  id="wetSanding"
                  title={SERVICE_META.wetSanding.title}
                  description={SERVICE_META.wetSanding.description}
                  selected={selectedServices.wetSanding}
                  onToggle={() => toggleService("wetSanding")}
                  onLearnMore={() => openLearnMore("wetSanding")}
                >
                  <div className="space-y-3">
                    <OptionToggle id="deepScratchRepair" label="Deep Scratch Repair (+$275)" checked={wetSandingConfig.deepScratchRepair} onChange={(c) => setWetSandingConfig({ ...wetSandingConfig, deepScratchRepair: c })} />
                    <div className="space-y-2">
                      <Label className="text-white/60 text-sm">Spot Wet Sanding Areas</Label>
                      <Input
                        type="number" min="0" placeholder="0"
                        value={wetSandingConfig.spotWetSanding || ""}
                        onChange={(e) => setWetSandingConfig({ ...wetSandingConfig, spotWetSanding: parseInt(e.target.value) || 0 })}
                        className="bg-white/5 border-white/10 text-white h-10 rounded-xl w-32"
                      />
                      <p className="text-xs text-white/30">$125 per area</p>
                    </div>
                  </div>
                </ServiceCard>

                {/* ── Bottom Painting ── */}
                <ServiceCard
                  id="bottomPainting"
                  title={SERVICE_META.bottomPainting.title}
                  description={SERVICE_META.bottomPainting.description}
                  selected={selectedServices.bottomPainting}
                  onToggle={() => toggleService("bottomPainting")}
                  onLearnMore={() => openLearnMore("bottomPainting")}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <OptionToggle id="secondCoat" label="2nd Coat (+$12/ft)" checked={bottomPaintingConfig.secondCoat} onChange={(c) => setBottomPaintingConfig({ ...bottomPaintingConfig, secondCoat: c })} />
                    <OptionToggle id="oldPaintRemoval" label="Old Paint Removal (+$18/ft)" checked={bottomPaintingConfig.oldPaintRemoval} onChange={(c) => setBottomPaintingConfig({ ...bottomPaintingConfig, oldPaintRemoval: c })} />
                    <OptionToggle id="heavyGrowthRemoval" label="Heavy Growth Removal (+$250)" checked={bottomPaintingConfig.heavyGrowthRemoval} onChange={(c) => setBottomPaintingConfig({ ...bottomPaintingConfig, heavyGrowthRemoval: c })} />
                    <OptionToggle id="blisterRepair" label="Blister Repair (Manual Review)" checked={bottomPaintingConfig.blisterRepair} onChange={(c) => setBottomPaintingConfig({ ...bottomPaintingConfig, blisterRepair: c })} />
                  </div>
                </ServiceCard>

                {/* ── Vinyl Removal & Installation ── */}
                <ServiceCard
                  id="vinyl"
                  title={SERVICE_META.vinyl.title}
                  description={SERVICE_META.vinyl.description}
                  selected={selectedServices.vinyl}
                  onToggle={() => toggleService("vinyl")}
                  onLearnMore={() => openLearnMore("vinyl")}
                >
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-white/60 text-sm">Service Type</Label>
                      <Select value={vinylConfig.service} onValueChange={(v: any) => setVinylConfig({ ...vinylConfig, service: v })}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2B2B2B] border-white/10">
                          <SelectItem value="removal">Removal Only</SelectItem>
                          <SelectItem value="install">Installation Only</SelectItem>
                          <SelectItem value="both">Removal + Installation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <OptionToggle id="customDesign" label="Custom Design (+$125)" checked={vinylConfig.customDesign} onChange={(c) => setVinylConfig({ ...vinylConfig, customDesign: c })} />
                  </div>
                </ServiceCard>
              </div>
            </section>

            {/* ═══ SECTION 4: REVIEW & CTA (mobile / inline) ═══ */}
            {estimate && (estimate.subtotal > 0 || estimate.requiresManualReview) && (
              <section className="lg:hidden">
                <div className="rounded-2xl border border-white/10 bg-[#2B2B2B] p-6 space-y-5">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-[#00FFFF]/70">Your Estimate</p>
                    <AnimatedPrice value={estimate.subtotal} className="text-3xl font-bold text-white mt-1 block" />
                  </div>

                  {estimate.requiresManualReview && (
                    <div className="rounded-xl bg-[#00FFFF]/[0.05] border border-[#00FFFF]/20 p-4">
                      <p className="text-sm font-medium text-[#00FFFF]">Manual Review Required</p>
                      <ul className="mt-1 space-y-0.5">
                        {estimate.reviewReasons.map((r, i) => (
                          <li key={i} className="text-xs text-white/40">{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!estimate.requiresManualReview && (
                    <>
                      <div className="flex items-center justify-between py-3 border-t border-white/10">
                        <span className="text-sm text-white/50">Deposit Required</span>
                        <span className="text-lg font-semibold text-white">$1.00</span>
                      </div>
                      <p className="text-xs text-white/30">
                        $1 deposit secures your service appointment and is applied to the final invoice.
                      </p>
                    </>
                  )}

                  {/* Breakdown */}
                  {estimate.breakdown.length > 0 && (
                    <details className="group">
                      <summary className="text-xs font-medium text-[#00FFFF]/60 cursor-pointer hover:text-[#00FFFF]/80 transition-colors select-none flex items-center justify-between">
                        View Breakdown
                        <svg className="w-3 h-3 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </summary>
                      <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                        {estimate.breakdown.map((line, i) => (
                          <p key={i} className={`text-xs ${line.startsWith("---") ? "font-semibold text-[#00FFFF] mt-2 first:mt-0" : "text-white/40"}`}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* CTA */}
                  <div className="space-y-2.5 pt-2">
                    <p className="text-center text-sm font-semibold text-white">Ready to Secure Your Service?</p>
                    <p className="text-center text-xs text-white/40">Your instant estimate will be confirmed after inspection.</p>
                    <Button
                      size="lg"
                      className="w-full bg-[#00FFFF] text-black hover:bg-[#00FFFF]/90 font-semibold h-12 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]"
                      disabled={!canPayDeposit || isSubmitting}
                      onClick={handleSubmit}
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
                      ) : estimate.requiresManualReview ? (
                        "Submit for Review ($1 Deposit)"
                      ) : (
                        "Pay $1 Deposit"
                      )}
                    </Button>
                    {!estimate.requiresManualReview && (
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full font-medium h-10 rounded-xl border-white/10 text-white/60 hover:text-white hover:bg-white/5 text-sm"
                        disabled={isDownloadingPDF || !canPayDeposit}
                        onClick={handleDownloadPDF}
                      >
                        {isDownloadingPDF ? (
                          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
                        ) : (
                          <><Download className="w-4 h-4 mr-2" /> Download Quote as PDF</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN — Sticky Price Panel (desktop only) */}
          <StickyPricePanel
            lineItems={lineItems}
            subtotal={estimate?.subtotal || 0}
            requiresManualReview={estimate?.requiresManualReview || false}
            reviewReasons={estimate?.reviewReasons || []}
            breakdown={estimate?.breakdown || []}
            canSubmit={!!canPayDeposit}
            isSubmitting={isSubmitting}
            isDownloadingPDF={isDownloadingPDF}
            onSubmit={handleSubmit}
            onDownloadPDF={handleDownloadPDF}
          />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 bg-[#0a0a0a] mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center space-y-2">
            <p className="text-sm text-white/40">Serving Georgian Bay, Lake Simcoe, and Muskoka</p>
            <p className="text-xs text-white/25">
              Trusted by boat owners across Ontario's premier boating regions.
            </p>
            <p className="text-xs text-white/20 pt-2">
              &copy; 2026 A1 Marine Care. After making your deposit, you'll be contacted by our agent to schedule your service date and time.
            </p>
            <p className="text-xs text-white/20 pt-1">
              <a href="/terms" className="hover:text-[#00FFFF]/60 transition-colors underline underline-offset-2">Terms of Service</a>
            </p>
          </div>
        </div>
      </footer>

      {/* ── Learn More Modal ── */}
      <LearnMoreModal open={learnMoreOpen} onOpenChange={setLearnMoreOpen} service={learnMoreService} />
    </div>
  );
}
