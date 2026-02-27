import { Calendar, CheckCircle, Mail, Phone, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";

/**
 * Design Philosophy: Modern Marine Elegance
 * - Pure black background (#000000) with dark gray cards (#1a1a1a)
 * - Cyan accent (#00FFFF) for brand consistency
 * - Clean, professional layout with clear visual hierarchy
 * - AI chat interface for scheduling replaces manual call request
 */

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ThankYou() {
  const [quoteData, setQuoteData] = useState<any>(null);

  // Get quote ID from localStorage (saved when quote was submitted)
  const [quoteId, setQuoteId] = useState<string | null>(null);

  useEffect(() => {
    const savedQuoteId = localStorage.getItem('lastQuoteId');
    if (savedQuoteId) {
      setQuoteId(savedQuoteId);
      console.log('[ThankYou] Found quote ID in localStorage:', savedQuoteId);
    } else {
      console.warn('[ThankYou] No quote ID found in localStorage');
    }
  }, []);

  // Fetch quote data using the quote ID
  const { data: quote, error } = trpc.quotes.getById.useQuery(
    { id: quoteId || '' },
    { enabled: !!quoteId }
  );

  useEffect(() => {
    if (quote) {
      console.log('[ThankYou] Quote data loaded:', quote);
      setQuoteData(quote);
    }
  }, [quote]);

  useEffect(() => {
    if (error) {
      console.error('[ThankYou] Error loading quote:', error);
    }
  }, [error]);

  // --- AI Booking Chat ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm here to help you schedule your boat detailing service. Just let me know what date and time works best for you, and I'll check our availability right away.",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{ startTime: string; endTime: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.booking.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.booked && data.bookingDetails) {
        setBookingConfirmed(true);
        setBookingDetails(data.bookingDetails);
      }
      setIsSending(false);
    },
    onError: (err) => {
      console.error('[BookingChat] Error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I ran into an issue. Please try again or contact us directly at (705) 996-1010.",
      }]);
      setIsSending(false);
    },
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isSending || bookingConfirmed) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsSending(true);

    chatMutation.mutate({
      messages: updatedMessages,
      quoteId: quoteId || undefined,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
                  <Calendar className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Schedule Your Service Below</h3>
                  <p className="text-gray-400 text-sm">
                    Use the chat below to find a date and time that works for you. Our assistant will check availability and book your appointment instantly.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-cyan-400/10 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Marina Will Call You</h3>
                  <p className="text-gray-400 text-sm">
                    Once your appointment is confirmed, Marina from our team will give you a call to go over the service details and answer any questions.
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

          {/* AI Booking Chat */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                Schedule Your Appointment
              </CardTitle>
              <CardDescription className="text-gray-400">
                Chat with our assistant to find and book your preferred service date
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Booking Confirmed Banner */}
              {bookingConfirmed && bookingDetails && (
                <div className="rounded-lg bg-cyan-400/10 border border-cyan-400/30 p-4 text-center space-y-1">
                  <p className="text-cyan-400 font-semibold text-lg">Appointment Booked!</p>
                  <p className="text-gray-300 text-sm">
                    {new Date(bookingDetails.startTime).toLocaleString('en-CA', {
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      hour: 'numeric', minute: '2-digit', hour12: true,
                    })}
                  </p>
                  <p className="text-gray-400 text-xs">A confirmation email has been sent. Marina will call you shortly.</p>
                </div>
              )}

              {/* Chat Messages */}
              <div className="h-80 overflow-y-auto space-y-3 pr-1">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-400/10 flex items-center justify-center mt-1">
                        <Bot className="w-4 h-4 text-cyan-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-cyan-400/20 text-white rounded-tr-sm'
                          : 'bg-gray-800 text-gray-200 rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mt-1">
                        <User className="w-4 h-4 text-gray-300" />
                      </div>
                    )}
                  </div>
                ))}
                {isSending && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-400/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1 items-center h-5">
                        <span className="w-2 h-2 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  placeholder={bookingConfirmed ? 'Appointment booked!' : 'e.g. I would like Saturday March 8th at 10am'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSending || bookingConfirmed}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isSending || bookingConfirmed}
                  className="bg-cyan-400 hover:bg-cyan-500 text-black px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
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
