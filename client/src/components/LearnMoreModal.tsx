import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type ServiceKey =
  | "gelcoat"
  | "exterior"
  | "interior"
  | "ceramic"
  | "graphene"
  | "wetSanding"
  | "bottomPainting"
  | "vinyl";

interface LearnMoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceKey | null;
}

/* ─── Content definitions ─────────────────────────────────────────────── */

interface ModalContent {
  title: string;
  description: string;
  sections: { heading: string; body: React.ReactNode }[];
}

const SERVICE_CONTENT: Record<ServiceKey, ModalContent> = {
  /* ── Gelcoat Restoration ─────────────────────────────────────────── */
  gelcoat: {
    title: "Gelcoat Restoration",
    description:
      "Restores gloss, removes oxidation, and improves the overall finish of fiberglass surfaces above or below the rub rail.",
    sections: [
      {
        heading: "Coverage Options",
        body: (
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Hull Only (below rub rail)</li>
            <li>Topsides Only (above rub rail)</li>
            <li>Full Boat (hull + topsides)</li>
            <li>Bowrider Special</li>
          </ul>
        ),
      },
      {
        heading: "Hull Service Includes",
        body: (
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Full multi-stage compound &amp; polish</li>
            <li>Waterline acid wash</li>
            <li>Final gloss sealant</li>
          </ul>
        ),
      },
      {
        heading: "Topsides Service Includes",
        body: (
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Free exterior wash</li>
            <li>Hand polish of rails and accents</li>
          </ul>
        ),
      },
      {
        heading: "Bowrider Special",
        body: (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Bowrider boats typically have far less gelcoat surface above the
              rub rail because large portions of the boat are made up of
              windshield, vinyl seating, and an open bow layout.
            </p>
            <p>
              Because of this reduced gelcoat surface area, Bowrider pricing is
              calculated differently. Instead of charging full topside pricing,
              we apply a <strong className="text-foreground">40% reduction</strong> to the topside portion.
            </p>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 font-mono text-xs text-primary">
              Bowrider Price = Hull Price + (Topside Price &times; 0.6)
            </div>
            <p>
              This ensures the pricing accurately reflects the reduced gelcoat
              area while still covering the full hull restoration. Bowrider
              pricing applies to select vessels only and may be confirmed by a
              technician.
            </p>
          </div>
        ),
      },
      {
        heading: "Available Add-Ons",
        body: (
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Arch / Radar Arch &mdash; $175</li>
            <li>Hard Top &mdash; $350 &ndash; $600</li>
            <li>Spot Wet Sanding &mdash; $75 &ndash; $150 per area</li>
            <li>Heavy Oxidation Treatment &mdash; +15% &ndash; +25%</li>
          </ul>
        ),
      },
    ],
  },

  /* ── Exterior Detailing ──────────────────────────────────────────── */
  exterior: {
    title: "Exterior Detailing",
    description:
      "Professional exterior cleaning, polishing, and protection for your vessel's outer surfaces.",
    sections: [
      {
        heading: "Package Tiers",
        body: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Refresh</strong> &mdash; Basic wash, dry, and light polish. Ideal for well-maintained boats.</p>
            <p><strong className="text-foreground">Standard</strong> &mdash; Full wash, clay bar treatment, and hand polish with sealant.</p>
            <p><strong className="text-foreground">Deep Clean</strong> &mdash; Intensive decontamination, multi-stage polish, and premium sealant.</p>
            <p><strong className="text-foreground">Restoration</strong> &mdash; Complete exterior restoration for neglected or heavily oxidised surfaces.</p>
          </div>
        ),
      },
      {
        heading: "Available Add-Ons",
        body: (
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Teak Cleaning &amp; Brightening</li>
            <li>Canvas &amp; Enclosure Cleaning</li>
            <li>Fender Cleaning</li>
            <li>Exterior Ozone Treatment</li>
          </ul>
        ),
      },
    ],
  },

  /* ── Interior Detailing ──────────────────────────────────────────── */
  interior: {
    title: "Interior Detailing",
    description:
      "Thorough interior cleaning and restoration tailored to your boat type and condition.",
    sections: [
      {
        heading: "Package Tiers",
        body: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Refresh</strong> &mdash; Light vacuum, wipe-down, and surface sanitisation.</p>
            <p><strong className="text-foreground">Standard</strong> &mdash; Full vacuum, upholstery cleaning, and surface treatment.</p>
            <p><strong className="text-foreground">Deep Clean</strong> &mdash; Intensive deep cleaning of all interior surfaces, fabrics, and compartments.</p>
            <p><strong className="text-foreground">Restoration</strong> &mdash; Complete interior restoration for heavily soiled or neglected interiors.</p>
          </div>
        ),
      },
      {
        heading: "Pricing Factors",
        body: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Interior pricing is calculated based on boat length, selected tier, and boat type. Larger cabin layouts and multi-cabin vessels require more time and materials.</p>
          </div>
        ),
      },
      {
        heading: "Available Add-Ons",
        body: (
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Advanced Mold &amp; Mildew Remediation</li>
            <li>Heavy Pet Hair Removal</li>
            <li>Cabin Mattress / Cushion Shampoo</li>
            <li>Head (Bathroom) Deep Clean</li>
            <li>Galley Deep Clean</li>
            <li>Ozone Odor Treatment</li>
          </ul>
        ),
      },
    ],
  },

  /* ── Ceramic Coating ─────────────────────────────────────────────── */
  ceramic: {
    title: "Ceramic Coating",
    description:
      "Long-lasting ceramic protection that creates a hydrophobic barrier against UV, salt, and contaminants.",
    sections: [
      {
        heading: "What's Included",
        body: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Professional-grade ceramic coating applied to all exterior gelcoat and painted surfaces. Provides up to 2 years of protection with proper maintenance.</p>
          </div>
        ),
      },
      {
        heading: "Available Add-Ons",
        body: (
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Second Layer &mdash; Additional durability and depth of gloss</li>
            <li>Teak Ceramic Coating &mdash; Protects and seals teak surfaces</li>
            <li>Interior Ceramic &mdash; Protects interior gelcoat and hard surfaces</li>
          </ul>
        ),
      },
    ],
  },

  /* ── Graphene Nano Coating ───────────────────────────────────────── */
  graphene: {
    title: "Graphene Nano Coating",
    description:
      "Next-generation graphene-infused coating offering superior hardness, heat resistance, and anti-static properties.",
    sections: [
      {
        heading: "What's Included",
        body: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Advanced graphene nano coating applied to all exterior surfaces. Offers enhanced scratch resistance, reduced water spotting, and longer durability compared to traditional ceramic coatings.</p>
          </div>
        ),
      },
      {
        heading: "Available Add-Ons",
        body: (
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Second Layer &mdash; Maximum protection and gloss</li>
            <li>Teak Graphene Coating &mdash; Protects and enhances teak surfaces</li>
          </ul>
        ),
      },
    ],
  },

  /* ── Wet Sanding / Paint Correction ──────────────────────────────── */
  wetSanding: {
    title: "Wet Sanding & Paint Correction",
    description:
      "Precision wet sanding and multi-stage paint correction to remove deep scratches, orange peel, and surface imperfections.",
    sections: [
      {
        heading: "What's Included",
        body: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Full wet sanding and paint/gelcoat correction using progressive grits followed by multi-stage compounding and polishing to restore a factory-smooth finish.</p>
          </div>
        ),
      },
      {
        heading: "Available Add-Ons",
        body: (
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Deep Scratch Repair &mdash; Targeted repair of deep gouges and scratches</li>
            <li>Spot Wet Sanding &mdash; Focused correction on specific problem areas</li>
          </ul>
        ),
      },
    ],
  },

  /* ── Bottom Painting ─────────────────────────────────────────────── */
  bottomPainting: {
    title: "Bottom Painting",
    description:
      "Professional antifouling bottom paint application to protect your hull from marine growth and corrosion.",
    sections: [
      {
        heading: "What's Included",
        body: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Surface preparation, priming (if needed), and application of high-quality antifouling bottom paint. Includes haul-out coordination if required.</p>
          </div>
        ),
      },
      {
        heading: "Available Add-Ons",
        body: (
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Second Coat &mdash; Additional layer for extended protection</li>
            <li>Old Paint Removal &mdash; Stripping of existing bottom paint</li>
            <li>Heavy Growth Removal &mdash; Barnacle and marine growth removal</li>
            <li>Blister Repair &mdash; Osmotic blister assessment and repair (requires manual review)</li>
          </ul>
        ),
      },
    ],
  },

  /* ── Vinyl Removal & Installation ────────────────────────────────── */
  vinyl: {
    title: "Vinyl Removal & Installation",
    description:
      "Professional vinyl wrap removal, installation, or both for boat graphics, names, and custom designs.",
    sections: [
      {
        heading: "Service Options",
        body: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Removal Only</strong> &mdash; Clean removal of existing vinyl graphics and adhesive residue.</p>
            <p><strong className="text-foreground">Installation Only</strong> &mdash; Professional application of new vinyl graphics or wraps.</p>
            <p><strong className="text-foreground">Removal + Installation</strong> &mdash; Full service: remove old graphics and apply new ones.</p>
          </div>
        ),
      },
      {
        heading: "Available Add-Ons",
        body: (
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Custom Design &mdash; Custom graphic design for boat names, logos, or wraps</li>
          </ul>
        ),
      },
    ],
  },
};

/* ─── Component ───────────────────────────────────────────────────────── */

export default function LearnMoreModal({
  open,
  onOpenChange,
  service,
}: LearnMoreModalProps) {
  if (!service) return null;

  const content = SERVICE_CONTENT[service];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 bg-card border-border/50 overflow-hidden">
        <ScrollArea className="max-h-[85vh]">
          <div className="p-6 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-xl text-foreground">
                {content.title}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                {content.description}
              </DialogDescription>
            </DialogHeader>

            {content.sections.map((section, i) => (
              <div key={i} className="space-y-2">
                <h3 className="text-sm font-semibold text-primary tracking-wide uppercase">
                  {section.heading}
                </h3>
                {section.body}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export type { ServiceKey };
