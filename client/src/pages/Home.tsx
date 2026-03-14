/**
 * A1 Marine Care Instant Quote System
 * Design Philosophy: Premium Marine Aesthetic
 * - Pure black background (#000000) for depth
 * - Dark gray cards (#2B2B2B) for surface elevation
 * - Cyan accent (#00FFFF) used sparingly for premium feel
 * - Clean typography with Inter font
 * - Generous spacing and subtle borders
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  BoatDetails,
  BottomPaintingConfig,
  calculateTotal,
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
import { Anchor, Download, Loader2, Ship, Waves } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import LearnMoreModal, { type ServiceKey } from "@/components/LearnMoreModal";

export default function Home() {
  // Test mode: enabled by visiting ?test=true in the URL — never shown to customers
  const isTestMode = new URLSearchParams(window.location.search).get('test') === 'true';

  // Quote submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const submitQuote = trpc.quotes.submit.useMutation();

  // Learn More modal state
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);
  const [learnMoreService, setLearnMoreService] = useState<ServiceKey | null>(null);
  const openLearnMore = (service: ServiceKey) => {
    setLearnMoreService(service);
    setLearnMoreOpen(true);
  };

  // Boat details
  const [boatDetails, setBoatDetails] = useState<BoatDetails>({
    length: 0,
    type: "",
    location: ""
  });

  // Contact info
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    fullName: "",
    email: "",
    phone: ""
  });

  // Service selections
  const [selectedServices, setSelectedServices] = useState<{
    gelcoat: boolean;
    exterior: boolean;
    interior: boolean;
    ceramic: boolean;
    graphene: boolean;
    wetSanding: boolean;
    bottomPainting: boolean;
    vinyl: boolean;
  }>({
    gelcoat: false,
    exterior: false,
    interior: false,
    ceramic: false,
    graphene: false,
    wetSanding: false,
    bottomPainting: false,
    vinyl: false
  });

  // Service configurations
  const [gelcoatConfig, setGelcoatConfig] = useState<GelcoatConfig>({
    area: 'hull',
    radarArch: false,
    hardTop: false,
    spotWetSanding: 0,
    heavyOxidation: false
  });

  const [exteriorConfig, setExteriorConfig] = useState<ExteriorConfig>({
    tier: 'refresh',
    teakCleaning: false,
    canvasCleaning: false,
    fenderCleaning: false,
    exteriorOzone: false
  });

  const [interiorConfig, setInteriorConfig] = useState<InteriorConfig>({
    tier: 'refresh',
    moldRemediation: false,
    mattressShampoo: false,
    headDeepClean: false,
    galleyDeepClean: false,
    petHairRemoval: false,
    ozoneInterior: false,
    photos: [],
    photoConfirmation: false
  });

  const [ceramicConfig, setCeramicConfig] = useState<CeramicConfig>({
    secondLayer: false,
    teakCeramic: false,
    interiorCeramic: false
  });

  const [grapheneConfig, setGrapheneConfig] = useState<GrapheneConfig>({
    secondLayer: false,
    teakGraphene: false
  });

  const [wetSandingConfig, setWetSandingConfig] = useState<WetSandingConfig>({
    deepScratchRepair: false,
    spotWetSanding: 0
  });

  const [bottomPaintingConfig, setBottomPaintingConfig] = useState<BottomPaintingConfig>({
    secondCoat: false,
    oldPaintRemoval: false,
    heavyGrowthRemoval: false,
    blisterRepair: false
  });

  const [vinylConfig, setVinylConfig] = useState<VinylConfig>({
    service: 'removal',
    customDesign: false
  });

  // Calculate total
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <img 
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663289180469/WGIEJYNWHRlJZpOd.png" 
              alt="A1 Marine Care" 
              className="h-24 w-auto"
            />
            <a 
              href="https://a1marinecare.ca" 
              className="text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Back to Home
            </a>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4 pb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Waves className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">A1 Service. A1 Results.</span>
            </div>
            <h2 className="text-4xl font-bold text-foreground">Get Your Instant Quote</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Premium boat care services with transparent pricing. Fill out the form below to receive your customized estimate.
            </p>
          </div>

          {/* Section 1: Boat Details */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Anchor className="w-5 h-5 text-primary" />
                Boat Details
              </CardTitle>
              <CardDescription className="text-muted-foreground">Tell us about your vessel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length" className="text-foreground">Boat Length (ft)</Label>
                  <Input
                    id="length"
                    type="number"
                    placeholder="30"
                    value={boatDetails.length || ""}
                    onChange={(e) => setBoatDetails({ ...boatDetails, length: parseInt(e.target.value) || 0 })}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-foreground">Boat Type</Label>
                  <Select value={boatDetails.type} onValueChange={(value) => setBoatDetails({ ...boatDetails, type: value })}>
                    <SelectTrigger id="type" className="bg-input border-border text-foreground">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
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
                  <Label htmlFor="location" className="text-foreground">Service Location</Label>
                  <Input
                    id="location"
                    placeholder="Marina name or city"
                    value={boatDetails.location}
                    onChange={(e) => setBoatDetails({ ...boatDetails, location: e.target.value })}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Contact Info */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-foreground">Contact Information</CardTitle>
              <CardDescription className="text-muted-foreground">How can we reach you?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="John Smith"
                    value={contactInfo.fullName}
                    onChange={(e) => setContactInfo({ ...contactInfo, fullName: e.target.value })}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(705) 996-1010"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Services */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-foreground">Select Services</CardTitle>
              <CardDescription className="text-muted-foreground">Choose the services you need</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Gelcoat Restoration */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gelcoat"
                    checked={selectedServices.gelcoat}
                    onCheckedChange={(checked) => setSelectedServices({ ...selectedServices, gelcoat: checked as boolean })}
                  />
                  <Label htmlFor="gelcoat" className="text-foreground font-semibold cursor-pointer">
                    Gelcoat Restoration
                  </Label>
                  <button type="button" onClick={() => openLearnMore('gelcoat')} className="ml-auto text-xs font-medium text-[#00FFFF] hover:text-[#00FFFF]/80 hover:underline transition-colors">Learn More</button>
                </div>
                {selectedServices.gelcoat && (
                  <div className="ml-6 p-4 rounded-lg bg-background/50 border border-border/30 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Area</Label>
                      <Select value={gelcoatConfig.area} onValueChange={(value: any) => setGelcoatConfig({ ...gelcoatConfig, area: value })}>
                        <SelectTrigger className="bg-input border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="hull">Hull (Below Rub Rail)</SelectItem>
                          <SelectItem value="topsides">Topsides</SelectItem>
                          <SelectItem value="bowrider">Bowrider Special (Low Gelcoat Only)</SelectItem>
                          <SelectItem value="fullboat">Full Boat (Hull + Topsides)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="radarArch"
                          checked={gelcoatConfig.radarArch}
                          onCheckedChange={(checked) => setGelcoatConfig({ ...gelcoatConfig, radarArch: checked as boolean })}
                        />
                        <Label htmlFor="radarArch" className="text-sm text-foreground cursor-pointer">Radar Arch (+$175)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="hardTop"
                          checked={gelcoatConfig.hardTop}
                          onCheckedChange={(checked) => setGelcoatConfig({ ...gelcoatConfig, hardTop: checked as boolean })}
                        />
                        <Label htmlFor="hardTop" className="text-sm text-foreground cursor-pointer">Hard Top (+$475)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="heavyOxidation"
                          checked={gelcoatConfig.heavyOxidation}
                          onCheckedChange={(checked) => setGelcoatConfig({ ...gelcoatConfig, heavyOxidation: checked as boolean })}
                        />
                        <Label htmlFor="heavyOxidation" className="text-sm text-foreground cursor-pointer">Heavy Oxidation (+20%)</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="spotWetSandingGelcoat" className="text-foreground">Spot Wet Sanding Areas</Label>
                      <Input
                        id="spotWetSandingGelcoat"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={gelcoatConfig.spotWetSanding || ""}
                        onChange={(e) => setGelcoatConfig({ ...gelcoatConfig, spotWetSanding: parseInt(e.target.value) || 0 })}
                        className="bg-input border-border text-foreground"
                      />
                      <p className="text-xs text-muted-foreground">$125 per area</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-border/30" />

              {/* Exterior Detailing */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="exterior"
                    checked={selectedServices.exterior}
                    onCheckedChange={(checked) => setSelectedServices({ ...selectedServices, exterior: checked as boolean })}
                  />
                  <Label htmlFor="exterior" className="text-foreground font-semibold cursor-pointer">
                    Exterior Detailing
                  </Label>
                  <button type="button" onClick={() => openLearnMore('exterior')} className="ml-auto text-xs font-medium text-[#00FFFF] hover:text-[#00FFFF]/80 hover:underline transition-colors">Learn More</button>
                </div>
                {selectedServices.exterior && (
                  <div className="ml-6 p-4 rounded-lg bg-background/50 border border-border/30 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Service Tier</Label>
                      <Select value={exteriorConfig.tier} onValueChange={(value: any) => setExteriorConfig({ ...exteriorConfig, tier: value })}>
                        <SelectTrigger className="bg-input border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="refresh">Refresh</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="deep">Deep Clean</SelectItem>
                          <SelectItem value="restoration">Restoration</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="teakCleaning"
                          checked={exteriorConfig.teakCleaning}
                          onCheckedChange={(checked) => setExteriorConfig({ ...exteriorConfig, teakCleaning: checked as boolean })}
                        />
                        <Label htmlFor="teakCleaning" className="text-sm text-foreground cursor-pointer">Teak Cleaning (+$225)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canvasCleaning"
                          checked={exteriorConfig.canvasCleaning}
                          onCheckedChange={(checked) => setExteriorConfig({ ...exteriorConfig, canvasCleaning: checked as boolean })}
                        />
                        <Label htmlFor="canvasCleaning" className="text-sm text-foreground cursor-pointer">Canvas Cleaning (+$150)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="fenderCleaning"
                          checked={exteriorConfig.fenderCleaning}
                          onCheckedChange={(checked) => setExteriorConfig({ ...exteriorConfig, fenderCleaning: checked as boolean })}
                        />
                        <Label htmlFor="fenderCleaning" className="text-sm text-foreground cursor-pointer">Fender Cleaning (+$60)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="exteriorOzone"
                          checked={exteriorConfig.exteriorOzone}
                          onCheckedChange={(checked) => setExteriorConfig({ ...exteriorConfig, exteriorOzone: checked as boolean })}
                        />
                        <Label htmlFor="exteriorOzone" className="text-sm text-foreground cursor-pointer">Exterior Ozone (+$100)</Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-border/30" />

              {/* Interior Detailing */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="interior"
                    checked={selectedServices.interior}
                    onCheckedChange={(checked) => setSelectedServices({ ...selectedServices, interior: checked as boolean })}
                  />
                  <Label htmlFor="interior" className="text-foreground font-semibold cursor-pointer">
                    Interior Detailing
                  </Label>
                  <button type="button" onClick={() => openLearnMore('interior')} className="ml-auto text-xs font-medium text-[#00FFFF] hover:text-[#00FFFF]/80 hover:underline transition-colors">Learn More</button>
                </div>
                {selectedServices.interior && (
                  <div className="ml-6 p-4 rounded-lg bg-background/50 border border-border/30 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Service Tier</Label>
                      <Select value={interiorConfig.tier} onValueChange={(value: any) => setInteriorConfig({ ...interiorConfig, tier: value })}>
                        <SelectTrigger className="bg-input border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="refresh">Refresh</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="deep">Deep Clean</SelectItem>
                          <SelectItem value="restoration">Restoration</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-4">
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">Photos will be requested after checkout.</span> After you complete your deposit, we'll send you an email requesting 3-10 interior photos so our team can prepare for your service.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="moldRemediation"
                            checked={interiorConfig.moldRemediation}
                            onCheckedChange={(checked) => setInteriorConfig({ ...interiorConfig, moldRemediation: checked as boolean })}
                          />
                          <Label htmlFor="moldRemediation" className="text-sm text-foreground cursor-pointer">Advanced Mold & Mildew Remediation (+$295)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="petHairRemoval"
                            checked={interiorConfig.petHairRemoval}
                            onCheckedChange={(checked) => setInteriorConfig({ ...interiorConfig, petHairRemoval: checked as boolean })}
                          />
                          <Label htmlFor="petHairRemoval" className="text-sm text-foreground cursor-pointer">Heavy Pet Hair Removal (+$150)</Label>
                        </div>
                        {['cuddy', 'cruiser', 'express', 'yacht'].includes(boatDetails.type) && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="mattressShampoo"
                              checked={interiorConfig.mattressShampoo}
                              onCheckedChange={(checked) => setInteriorConfig({ ...interiorConfig, mattressShampoo: checked as boolean })}
                            />
                            <Label htmlFor="mattressShampoo" className="text-sm text-foreground cursor-pointer">Cabin Mattress / Cushion Shampoo (+$175)</Label>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="headDeepClean"
                            checked={interiorConfig.headDeepClean}
                            onCheckedChange={(checked) => setInteriorConfig({ ...interiorConfig, headDeepClean: checked as boolean })}
                          />
                          <Label htmlFor="headDeepClean" className="text-sm text-foreground cursor-pointer">Head (Bathroom) Deep Clean (+$125)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="galleyDeepClean"
                            checked={interiorConfig.galleyDeepClean}
                            onCheckedChange={(checked) => setInteriorConfig({ ...interiorConfig, galleyDeepClean: checked as boolean })}
                          />
                          <Label htmlFor="galleyDeepClean" className="text-sm text-foreground cursor-pointer">Galley Deep Clean (+$175)</Label>
                        </div>
                        {(interiorConfig.tier === 'deep' || interiorConfig.tier === 'restoration') && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="ozoneInterior"
                              checked={interiorConfig.ozoneInterior}
                              onCheckedChange={(checked) => setInteriorConfig({ ...interiorConfig, ozoneInterior: checked as boolean })}
                            />
                            <Label htmlFor="ozoneInterior" className="text-sm text-foreground cursor-pointer">Ozone Odor Treatment (+$195)</Label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-border/30" />

              {/* Ceramic Coating */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ceramic"
                    checked={selectedServices.ceramic}
                    onCheckedChange={(checked) => setSelectedServices({ ...selectedServices, ceramic: checked as boolean })}
                  />
                  <Label htmlFor="ceramic" className="text-foreground font-semibold cursor-pointer">
                    Ceramic Coating
                  </Label>
                  <button type="button" onClick={() => openLearnMore('ceramic')} className="ml-auto text-xs font-medium text-[#00FFFF] hover:text-[#00FFFF]/80 hover:underline transition-colors">Learn More</button>
                </div>
                {selectedServices.ceramic && (
                  <div className="ml-6 p-4 rounded-lg bg-background/50 border border-border/30 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="secondLayerCeramic"
                          checked={ceramicConfig.secondLayer}
                          onCheckedChange={(checked) => setCeramicConfig({ ...ceramicConfig, secondLayer: checked as boolean })}
                        />
                        <Label htmlFor="secondLayerCeramic" className="text-sm text-foreground cursor-pointer">Second Layer (+$8/ft)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="teakCeramic"
                          checked={ceramicConfig.teakCeramic}
                          onCheckedChange={(checked) => setCeramicConfig({ ...ceramicConfig, teakCeramic: checked as boolean })}
                        />
                        <Label htmlFor="teakCeramic" className="text-sm text-foreground cursor-pointer">Teak Ceramic (+$300)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="interiorCeramic"
                          checked={ceramicConfig.interiorCeramic}
                          onCheckedChange={(checked) => setCeramicConfig({ ...ceramicConfig, interiorCeramic: checked as boolean })}
                        />
                        <Label htmlFor="interiorCeramic" className="text-sm text-foreground cursor-pointer">Interior Ceramic (+$150)</Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-border/30" />

              {/* Graphene Coating */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="graphene"
                    checked={selectedServices.graphene}
                    onCheckedChange={(checked) => setSelectedServices({ ...selectedServices, graphene: checked as boolean })}
                  />
                  <Label htmlFor="graphene" className="text-foreground font-semibold cursor-pointer">
                    Graphene Nano Coating
                  </Label>
                  <button type="button" onClick={() => openLearnMore('graphene')} className="ml-auto text-xs font-medium text-[#00FFFF] hover:text-[#00FFFF]/80 hover:underline transition-colors">Learn More</button>
                </div>
                {selectedServices.graphene && (
                  <div className="ml-6 p-4 rounded-lg bg-background/50 border border-border/30 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="secondLayerGraphene"
                          checked={grapheneConfig.secondLayer}
                          onCheckedChange={(checked) => setGrapheneConfig({ ...grapheneConfig, secondLayer: checked as boolean })}
                        />
                        <Label htmlFor="secondLayerGraphene" className="text-sm text-foreground cursor-pointer">Second Layer (+$10/ft)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="teakGraphene"
                          checked={grapheneConfig.teakGraphene}
                          onCheckedChange={(checked) => setGrapheneConfig({ ...grapheneConfig, teakGraphene: checked as boolean })}
                        />
                        <Label htmlFor="teakGraphene" className="text-sm text-foreground cursor-pointer">Teak Graphene (+$350)</Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-border/30" />

              {/* Wet Sanding */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="wetSanding"
                    checked={selectedServices.wetSanding}
                    onCheckedChange={(checked) => setSelectedServices({ ...selectedServices, wetSanding: checked as boolean })}
                  />
                  <Label htmlFor="wetSanding" className="text-foreground font-semibold cursor-pointer">
                    Wet Sanding & Paint/Gelcoat Correction
                  </Label>
                  <button type="button" onClick={() => openLearnMore('wetSanding')} className="ml-auto text-xs font-medium text-[#00FFFF] hover:text-[#00FFFF]/80 hover:underline transition-colors">Learn More</button>
                </div>
                {selectedServices.wetSanding && (
                  <div className="ml-6 p-4 rounded-lg bg-background/50 border border-border/30 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="deepScratchRepair"
                        checked={wetSandingConfig.deepScratchRepair}
                        onCheckedChange={(checked) => setWetSandingConfig({ ...wetSandingConfig, deepScratchRepair: checked as boolean })}
                      />
                      <Label htmlFor="deepScratchRepair" className="text-sm text-foreground cursor-pointer">Deep Scratch Repair (+$275)</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="spotWetSandingWS" className="text-foreground">Spot Wet Sanding Areas</Label>
                      <Input
                        id="spotWetSandingWS"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={wetSandingConfig.spotWetSanding || ""}
                        onChange={(e) => setWetSandingConfig({ ...wetSandingConfig, spotWetSanding: parseInt(e.target.value) || 0 })}
                        className="bg-input border-border text-foreground"
                      />
                      <p className="text-xs text-muted-foreground">$125 per area</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-border/30" />

              {/* Bottom Painting */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bottomPainting"
                    checked={selectedServices.bottomPainting}
                    onCheckedChange={(checked) => setSelectedServices({ ...selectedServices, bottomPainting: checked as boolean })}
                  />
                  <Label htmlFor="bottomPainting" className="text-foreground font-semibold cursor-pointer">
                    Bottom Painting
                  </Label>
                  <button type="button" onClick={() => openLearnMore('bottomPainting')} className="ml-auto text-xs font-medium text-[#00FFFF] hover:text-[#00FFFF]/80 hover:underline transition-colors">Learn More</button>
                </div>
                {selectedServices.bottomPainting && (
                  <div className="ml-6 p-4 rounded-lg bg-background/50 border border-border/30 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="secondCoat"
                          checked={bottomPaintingConfig.secondCoat}
                          onCheckedChange={(checked) => setBottomPaintingConfig({ ...bottomPaintingConfig, secondCoat: checked as boolean })}
                        />
                        <Label htmlFor="secondCoat" className="text-sm text-foreground cursor-pointer">2nd Coat (+$12/ft)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="oldPaintRemoval"
                          checked={bottomPaintingConfig.oldPaintRemoval}
                          onCheckedChange={(checked) => setBottomPaintingConfig({ ...bottomPaintingConfig, oldPaintRemoval: checked as boolean })}
                        />
                        <Label htmlFor="oldPaintRemoval" className="text-sm text-foreground cursor-pointer">Old Paint Removal (+$18/ft)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="heavyGrowthRemoval"
                          checked={bottomPaintingConfig.heavyGrowthRemoval}
                          onCheckedChange={(checked) => setBottomPaintingConfig({ ...bottomPaintingConfig, heavyGrowthRemoval: checked as boolean })}
                        />
                        <Label htmlFor="heavyGrowthRemoval" className="text-sm text-foreground cursor-pointer">Heavy Growth Removal (+$250)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="blisterRepair"
                          checked={bottomPaintingConfig.blisterRepair}
                          onCheckedChange={(checked) => setBottomPaintingConfig({ ...bottomPaintingConfig, blisterRepair: checked as boolean })}
                        />
                        <Label htmlFor="blisterRepair" className="text-sm text-foreground cursor-pointer">Blister Repair (Manual Review)</Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-border/30" />

              {/* Vinyl Services */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vinyl"
                    checked={selectedServices.vinyl}
                    onCheckedChange={(checked) => setSelectedServices({ ...selectedServices, vinyl: checked as boolean })}
                  />
                  <Label htmlFor="vinyl" className="text-foreground font-semibold cursor-pointer">
                    Vinyl Removal & Installation
                  </Label>
                  <button type="button" onClick={() => openLearnMore('vinyl')} className="ml-auto text-xs font-medium text-[#00FFFF] hover:text-[#00FFFF]/80 hover:underline transition-colors">Learn More</button>
                </div>
                {selectedServices.vinyl && (
                  <div className="ml-6 p-4 rounded-lg bg-background/50 border border-border/30 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Service Type</Label>
                      <Select value={vinylConfig.service} onValueChange={(value: any) => setVinylConfig({ ...vinylConfig, service: value })}>
                        <SelectTrigger className="bg-input border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="removal">Removal Only ($12/ft)</SelectItem>
                          <SelectItem value="install">Install Only ($15/ft)</SelectItem>
                          <SelectItem value="both">Removal + Install ($24/ft)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="customDesign"
                        checked={vinylConfig.customDesign}
                        onCheckedChange={(checked) => setVinylConfig({ ...vinylConfig, customDesign: checked as boolean })}
                      />
                      <Label htmlFor="customDesign" className="text-sm text-foreground cursor-pointer">Custom Design (+$125)</Label>
                    </div>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>

          {/* Estimate Display */}
          {estimate && (estimate.subtotal > 0 || estimate.requiresManualReview) && (
            <Card className="bg-card border-primary/30 shadow-lg shadow-primary/5">
              <CardHeader>
                <CardTitle className="text-foreground text-2xl">Your Estimate</CardTitle>
                {estimate.requiresManualReview && (
                  <div className="mt-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-primary font-medium">⚠️ Manual Review Required</p>
                    <ul className="mt-1 text-xs text-primary/80 list-disc list-inside">
                      {estimate.reviewReasons.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {!estimate.requiresManualReview && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-muted-foreground">Estimated Total:</span>
                        <span className="text-4xl font-bold text-primary">${estimate.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-baseline justify-between pt-2 border-t border-border/30">
                        <span className="text-muted-foreground">Deposit Required:</span>
                        <span className="text-2xl font-semibold text-foreground">$250.00</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                      <p className="text-sm text-muted-foreground">
                        To secure your service appointment, a refundable <span className="text-foreground font-medium">$250 deposit</span> is required. 
                        This deposit is applied toward your final invoice.
                      </p>
                    </div>

                    {/* Price Breakdown */}
                    {estimate.breakdown.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground">Price Breakdown</h4>
                        <div className="p-4 rounded-lg bg-background/50 border border-border/30 space-y-1 max-h-64 overflow-y-auto">
                          {estimate.breakdown.map((line, i) => (
                            <p key={i} className={`text-sm ${line.startsWith('---') ? 'font-semibold text-primary mt-3 first:mt-0' : 'text-muted-foreground'}`}>
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Pay Deposit Button or Manual Review Message */}
                {estimate.requiresManualReview ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                      <p className="text-foreground font-semibold">Your interior estimate requires review.</p>
                      <p className="text-sm text-muted-foreground mt-1">We will confirm pricing within 24–48 hours.</p>
                    </div>
                    {hasRequiredFields && (
                      <Button
                        size="lg"
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-lg h-14 rounded-xl"
                        disabled={isSubmitting}
                        onClick={async () => {
                          setIsSubmitting(true);
                          try {
                            // Submit quote to backend
                            const result = await submitQuote.mutateAsync({
                              customerName: contactInfo.fullName,
                              customerEmail: contactInfo.email,
                              customerPhone: contactInfo.phone,
                              boatLength: boatDetails.length,
                              boatType: boatDetails.type,
                              serviceLocation: boatDetails.location,
                              estimatedTotal: Math.round((estimate?.subtotal || 0) * 100), // convert to cents
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
                            
                            // Store quote ID in localStorage for thank you page
                            localStorage.setItem('lastQuoteId', result.quoteId.toString());
                            
                            // Redirect to Stripe payment (or bypass in test mode)
                            if (isTestMode) {
                              window.location.href = '/thank-you';
                            } else {
                              window.location.href = "https://buy.stripe.com/4gM3cvetybh54ao8Tjgbm01";
                            }
                          } catch (error) {
                            console.error('Failed to submit quote:', error);
                            alert('Failed to submit quote. Please try again.');
                            setIsSubmitting(false);
                          }
                        }}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Submitting...
                          </>
                        ) : (
                          "Submit for Manual Review ($250 Deposit)"
                        )}
                      </Button>
                    )}
                  </div>
                ) : canPayDeposit && (
                  <div className="space-y-3">
                    <Button
                      size="lg"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-lg h-14 rounded-xl"
                      disabled={isSubmitting}
                      onClick={async () => {
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
                            requiresManualReview: false,
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
                            window.location.href = "https://buy.stripe.com/4gM3cvetybh54ao8Tjgbm01";
                          }
                        } catch (error) {
                          console.error('Failed to submit quote:', error);
                          alert('Failed to submit quote. Please try again.');
                          setIsSubmitting(false);
                        }
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        "Pay $250 Deposit"
                      )}
                    </Button>
                    
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full font-semibold text-lg h-14 rounded-xl border-border/50 hover:bg-background/50"
                      disabled={isDownloadingPDF}
                      onClick={async () => {
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
                              services: services, // This is the ServiceSelections object
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
                      }}
                    >
                      {isDownloadingPDF ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5 mr-2" />
                          Download Quote as PDF
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 mt-16">
        <div className="container py-8">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              © 2026 A1 Marine Care.
            </p>
            <p className="text-xs text-muted-foreground">
              After making your deposit, you'll be contacted by our agent to schedule your service date and time.
            </p>
          </div>
        </div>
      </footer>

      {/* Learn More Modal */}
      <LearnMoreModal
        open={learnMoreOpen}
        onOpenChange={setLearnMoreOpen}
        service={learnMoreService}
      />
    </div>
  );
}
