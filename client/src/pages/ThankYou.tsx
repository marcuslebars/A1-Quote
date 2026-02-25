import { Calendar, CheckCircle, Mail, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";

/**
 * Design Philosophy: Modern Marine Elegance
 * - Pure black background (#000000) with dark gray cards (#1a1a1a)
 * - Cyan accent (#00FFFF) for brand consistency
 * - Clean, professional layout with clear visual hierarchy
 * - Success-oriented messaging with actionable next steps
 * - Simplified: No dependency on quote data from URL
 */

const ELEVENLABS_AGENT_ID = "agent_7701kgqf82xyekdafeh4mqvae127";

export default function ThankYou() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callRequested, setCallRequested] = useState(false);

  // Initialize Cal.com embed
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({"namespace":"book-your-service"});
      cal("ui", {"theme":"dark","cssVarsPerTheme":{"light":{"cal-brand":"#00ffff"},"dark":{"cal-brand":"#00ffff"}},"hideEventTypeDetails":true,"layout":"month_view"});
    })();
  }, []);

  // Mutation to trigger Marina call with phone number
  const requestCall = trpc.marina.requestCallByPhone.useMutation({
    onSuccess: () => {
      setCallRequested(true);
    },
    onError: (error) => {
      console.error('[Marina] Failed to request call:', error);
      alert('Failed to request call. Please try again or contact us directly at (705) 996-1010');
    },
  });

  const handleRequestCall = () => {
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      alert('Please enter a valid phone number');
      return;
    }
    requestCall.mutate({ phoneNumber: phoneNumber.trim() });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between py-4">
          <img 
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663289180469/WGIEJYNWHRlJZpOd.png" 
            alt="A1 Marine Care" 
            className="h-16 w-auto"
          />
          <a 
            href="https://a1marinecare.ca" 
            className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium"
          >
            Back to Home
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Success Message */}
          <div className="text-center space-y-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-2xl"></div>
              <CheckCircle className="w-24 h-24 text-cyan-400 relative" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-white">Thank You for Your Deposit!</h1>
              <p className="text-gray-400 text-lg">
                Your $250 deposit has been successfully processed.
              </p>
            </div>
          </div>

          {/* What Happens Next */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-cyan-400">→</span>
                What Happens Next
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-cyan-400/10 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Our Team Will Contact You</h3>
                  <p className="text-gray-400 text-sm">
                    A company representative will reach out to you shortly to confirm your service details and answer any questions you may have.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-cyan-400/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Schedule Your Service</h3>
                  <p className="text-gray-400 text-sm">
                    We'll work with you to find the perfect time slot for your boat detailing service based on your availability and our schedule.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-cyan-400/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Service Completion</h3>
                  <p className="text-gray-400 text-sm">
                    Your deposit will be applied toward your final invoice. We'll deliver exceptional results that exceed your expectations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Need Immediate Assistance?</CardTitle>
              <CardDescription className="text-gray-400">
                Feel free to reach out to us directly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-gray-300">
                <Mail className="w-5 h-5 text-cyan-400" />
                <a href="mailto:contact@a1marinecare.ca" className="hover:text-cyan-400 transition-colors">
                  contact@a1marinecare.ca
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Phone className="w-5 h-5 text-cyan-400" />
                <a href="tel:+17059961010" className="hover:text-cyan-400 transition-colors">
                  (705) 996-1010
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Marina Scheduling Section */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Schedule Your Appointment</CardTitle>
              <CardDescription className="text-gray-400">
                Choose how you'd like to schedule your boat detailing service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-1 gap-4">
                {/* Request a Call */}
                <Card className="bg-black/50 border-gray-700 hover:border-cyan-400/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-400/10">
                        <Phone className="w-6 h-6 text-cyan-400" />
                      </div>
                      <CardTitle className="text-white text-lg">Request a Call</CardTitle>
                    </div>
                    <CardDescription className="text-gray-400">
                      Prefer to talk? Marina will call you shortly
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-300">Your Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(705) 996-1010"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                        disabled={callRequested}
                      />
                    </div>
                    <Button 
                      onClick={handleRequestCall}
                      disabled={requestCall.isPending || callRequested}
                      className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-cyan-400/50" 
                    >
                      {callRequested ? 'Call Requested!' : requestCall.isPending ? 'Requesting...' : 'Request Call'}
                    </Button>
                    {callRequested && (
                      <p className="text-sm text-cyan-400 mt-2 text-center">
                        Marina will call you shortly!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Cal.com Booking Calendar */}
              <div className="w-full h-[700px] rounded-lg border border-gray-700 overflow-hidden bg-black/30">
                <Cal 
                  namespace="book-your-service"
                  calLink="a1-marine-care/book-your-service"
                  style={{width:"100%",height:"100%",overflow:"scroll"}}
                  config={{"layout":"month_view","useSlotsViewOnSmallScreen":"true","theme":"dark"}}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild
              variant="outline"
              className="bg-transparent border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10"
            >
              <a href="https://a1marinecare.ca">Return to Home</a>
            </Button>
            <Button 
              asChild
              className="bg-cyan-400 hover:bg-cyan-500 text-black font-semibold px-8 py-6 text-lg"
            >
              <a href="/">Get Another Quote</a>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
