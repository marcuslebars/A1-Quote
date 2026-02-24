import { CheckCircle, Phone, Mail, Calendar, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";

/**
 * Design Philosophy: Modern Marine Elegance
 * - Pure black background (#000000) with dark gray cards (#1a1a1a)
 * - Cyan accent (#00d9ff) for brand consistency
 * - Clean, professional layout with clear visual hierarchy
 * - Success-oriented messaging with actionable next steps
 */

export default function ThankYou() {
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [callRequested, setCallRequested] = useState(false);
  const [widgetInitialized, setWidgetInitialized] = useState(false);

  // Get session_id or quoteId from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeSessionId = params.get("session_id");
    const id = params.get("quoteId");
    
    if (stripeSessionId) {
      setSessionId(stripeSessionId);
    } else if (id) {
      setQuoteId(id);
    } else {
      // Fallback to localStorage
      const storedQuoteId = localStorage.getItem("lastQuoteId");
      if (storedQuoteId) {
        setQuoteId(storedQuoteId);
      }
    }
  }, []);

  // Fetch quote by session ID if we have one
  const { data: quoteBySession } = trpc.quote.getBySessionId.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  // Fetch quote by ID if we have one
  const { data: quoteById } = trpc.quote.getById.useQuery(
    { id: quoteId || "" },
    { enabled: !!quoteId && !sessionId }
  );

  // Use whichever quote we got
  const quote = quoteBySession || quoteById;

  // Update quoteId when we get quote from session
  useEffect(() => {
    if (quoteBySession?.id) {
      setQuoteId(quoteBySession.id);
    }
  }, [quoteBySession]);

  // Initialize ElevenLabs widget with agent ID
  useEffect(() => {
    const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
    if (agentId && !widgetInitialized) {
      const widget = document.querySelector('elevenlabs-convai');
      if (widget) {
        widget.setAttribute('agent-id', agentId);
        setWidgetInitialized(true);
      }
    }
  }, [widgetInitialized]);

  // Mutation to trigger Marina call
  const requestCall = trpc.marina.requestCall.useMutation({
    onSuccess: () => {
      setCallRequested(true);
    },
  });

  const handleRequestCall = () => {
    if (quoteId) {
      requestCall.mutate({ quoteId });
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between py-4">
          <a href="https://a1marinecare.ca" className="flex items-center gap-3">
            <img
              src="https://s3.us-east-1.amazonaws.com/assets.manus.space/a1-marine-care/A1TealLogo1240x648.png"
              alt="A1 Marine Care"
              className="h-24 w-auto"
            />
          </a>
          <a
            href="https://a1marinecare.ca"
            className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium"
          >
            Back to Home
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-16">
        <div className="max-w-3xl mx-auto">
          {/* Success Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-2xl"></div>
              <CheckCircle className="w-24 h-24 text-cyan-400 relative" strokeWidth={1.5} />
            </div>
          </div>

          {/* Thank You Message */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Thank You for Your Deposit!
            </h1>
            <p className="text-xl text-gray-400">
              Your $250 deposit has been successfully processed.
            </p>
          </div>

          {/* What Happens Next Card */}
          <Card className="bg-[#1a1a1a] border-gray-800 mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <span className="text-cyan-400">→</span>
                What Happens Next
              </h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-cyan-400/10 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Our Team Will Contact You
                    </h3>
                    <p className="text-gray-400">
                      A company representative will reach out to you shortly to confirm your service details and answer any questions you may have.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-cyan-400/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Schedule Your Service
                    </h3>
                    <p className="text-gray-400">
                      We'll work with you to find the perfect time slot for your boat detailing service based on your availability and our schedule.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-cyan-400/10 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Service Completion
                    </h3>
                    <p className="text-gray-400">
                      Your deposit will be applied toward your final invoice. We'll deliver exceptional results that exceed your expectations.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card className="bg-[#1a1a1a] border-gray-800 mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Need Immediate Assistance?
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-300">
                  <Mail className="w-5 h-5 text-cyan-400" />
                  <a href="mailto:info@a1marinecare.ca" className="hover:text-cyan-400 transition-colors">
                    info@a1marinecare.ca
                  </a>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Phone className="w-5 h-5 text-cyan-400" />
                  <a href="tel:+15551234567" className="hover:text-cyan-400 transition-colors">
                    (555) 123-4567
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule with Marina */}
          <Card className="bg-[#1a1a1a] border-gray-800 mb-8">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Schedule Your Appointment</CardTitle>
              <CardDescription className="text-gray-400">
                Choose how you'd like to schedule your boat detailing service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Chat with Marina */}
                <Card className="bg-black/50 border-gray-700 hover:border-cyan-400/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-cyan-400/10">
                        <MessageSquare className="w-6 h-6 text-cyan-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Chat with Marina</h3>
                    </div>
                    <p className="text-gray-400 mb-4 text-sm">
                      Schedule your appointment through our AI assistant
                    </p>
                    <Button 
                      className="w-full bg-cyan-400 hover:bg-cyan-500 text-black font-semibold" 
                      onClick={() => {
                        document.getElementById("marina-chatbot")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      Start Chat
                    </Button>
                  </CardContent>
                </Card>

                {/* Request a Call */}
                <Card className="bg-black/50 border-gray-700 hover:border-cyan-400/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-cyan-400/10">
                        <Phone className="w-6 h-6 text-cyan-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Request a Call</h3>
                    </div>
                    <p className="text-gray-400 mb-4 text-sm">
                      Prefer to talk? Marina will call you shortly
                    </p>
                    <Button 
                      variant="outline"
                      className="w-full border-gray-700 hover:bg-gray-800 text-white font-semibold"
                      onClick={handleRequestCall}
                      disabled={callRequested || requestCall.isPending}
                    >
                      {requestCall.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {callRequested ? "Call Requested ✓" : "Request Call"}
                    </Button>
                    {callRequested && (
                      <p className="text-sm text-cyan-400 mt-2 text-center">
                        Marina will call you within the next few minutes!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Marina Chatbot Widget */}
              <div id="marina-chatbot" className="w-full h-[600px] rounded-lg border border-gray-700 overflow-hidden bg-black/30">
                <elevenlabs-convai></elevenlabs-convai>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              className="bg-cyan-400 hover:bg-cyan-500 text-black font-semibold px-8 py-6 text-lg"
            >
              <a href="https://a1marinecare.ca">Return to Home</a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-gray-700 hover:bg-gray-800 text-white px-8 py-6 text-lg"
            >
              <a href="/">Get Another Quote</a>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 mt-16">
        <div className="container text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} A1 Marine Care. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
