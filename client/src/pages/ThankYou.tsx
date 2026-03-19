import Cal, { getCalApi } from "@calcom/embed-react";
import { Calendar, CheckCircle, ChevronDown, Mail, Phone, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";

/** Build a Google Calendar "Add to Calendar" URL */
function buildGoogleCalendarUrl(startTime: string, endTime: string, title: string, description: string, location: string) {
  const fmt = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(startTime)}/${fmt(endTime || startTime)}`,
    details: description,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Build and trigger an iCal (.ics) file download */
function downloadIcal(startTime: string, endTime: string, title: string, description: string, location: string) {
  const fmt = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const uid = `a1marine-${Date.now()}@a1marinecare.ca`;
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//A1 Marine Care//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${fmt(new Date().toISOString())}`,
    `DTSTART:${fmt(startTime)}`,
    `DTEND:${fmt(endTime || startTime)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'a1-marine-care-appointment.ics';
  a.click();
  URL.revokeObjectURL(url);
}

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

function CalEmbed({ customerName, customerEmail }: { customerName?: string; customerEmail?: string }) {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: 'book-your-service' });
      cal('ui', {
        theme: 'dark',
        cssVarsPerTheme: {
          light: { 'cal-brand': '#000000' },
          dark: { 'cal-brand': '#00ffff' },
        },
        hideEventTypeDetails: true,
        layout: 'month_view',
      });
    })();
  }, []);

  const config: Record<string, string> = {
    layout: 'month_view',
    useSlotsViewOnSmallScreen: 'true',
    theme: 'dark',
  };
  if (customerName) config.name = customerName;
  if (customerEmail) config.email = customerEmail;

  return (
    <Cal
      namespace="book-your-service"
      calLink="a1-marine-care/book-your-service"
      style={{ width: '100%', height: '600px', overflow: 'scroll' }}
      config={config}
    />
  );
}

export default function ThankYou() {
  // Test mode: skip Stripe, used for verifying the thank you page flow
  const isTestMode = new URLSearchParams(window.location.search).get('test') === 'true';

  const [quoteData, setQuoteData] = useState<any>(null);

  // Get quote ID from localStorage (saved when quote was submitted).
  // Initialised synchronously so downstream state (booking persistence) can
  // use the correct key on the very first render.
  const [quoteId] = useState<string | null>(() => {
    try {
      const id = localStorage.getItem('lastQuoteId');
      if (id) {
        console.log('[ThankYou] Found quote ID in localStorage:', id);
      } else {
        console.warn('[ThankYou] No quote ID found in localStorage');
      }
      return id;
    } catch {
      return null;
    }
  });

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

  // Restore booking confirmation from localStorage on mount so the card
  // survives a page refresh (keyed by quoteId to avoid cross-quote bleed).
  const storageKey = quoteId ? `bookingConfirmed_${quoteId}` : 'bookingConfirmed_latest';
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  });
  const [bookingDetails, setBookingDetails] = useState<{ startTime: string; endTime: string; bookingUid?: string } | null>(() => {
    try {
      const raw = localStorage.getItem(`${storageKey}_details`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Persist booking state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(bookingConfirmed));
      if (bookingDetails) {
        localStorage.setItem(`${storageKey}_details`, JSON.stringify(bookingDetails));
      }
    } catch {
      // localStorage unavailable (private browsing, storage full, etc.) — silently ignore
    }
  }, [bookingConfirmed, bookingDetails, storageKey]);

  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);
  const calendarMenuRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Close the calendar dropdown when clicking outside
  useEffect(() => {
    if (!calendarMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarMenuRef.current && !calendarMenuRef.current.contains(e.target as Node)) {
        setCalendarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [calendarMenuOpen]);

  const chatMutation = trpc.booking.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.booked && data.bookingDetails) {
        setBookingConfirmed(true);
        setBookingDetails({
          startTime: data.bookingDetails.startTime,
          endTime: data.bookingDetails.endTime,
          bookingUid: (data.bookingDetails as any).bookingUid,
        });
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
            className="text-[#00FFFF] hover:text-[#00FFFF]/80 transition-colors text-sm font-medium"
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
              <div className="absolute inset-0 bg-[#00FFFF]/20 rounded-full blur-2xl"></div>
              <CheckCircle className="w-24 h-24 text-[#00FFFF] relative" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-white">
                {isTestMode ? 'Quote Submitted — Test Mode' : 'Thank You for Your Deposit!'}
              </h1>
              <p className="text-gray-400 text-lg">
                {isTestMode
                  ? 'Stripe checkout bypassed. Use the chat below to test the booking flow.'
                  : 'Your $250 deposit has been successfully processed.'}
              </p>
            </div>
          </div>

          {/* What Happens Next */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-[#00FFFF]">→</span>
                What Happens Next
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#00FFFF]/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-[#00FFFF]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Schedule Your Service Below</h3>
                  <p className="text-gray-400 text-sm">
                    Use the chat below to find a date and time that works for you. Our assistant will check availability and book your appointment instantly.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#00FFFF]/10 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-[#00FFFF]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Marina Will Call You</h3>
                  <p className="text-gray-400 text-sm">
                    Once your appointment is confirmed, Marina from our team will give you a call to go over the service details and answer any questions.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#00FFFF]/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-[#00FFFF]" />
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
                <Bot className="w-5 h-5 text-[#00FFFF]" />
                Book Your Service with Marina
              </CardTitle>
              <CardDescription className="text-gray-400">
                Chat with Marina to find and book your preferred service date
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Booking Confirmation Card */}
              {bookingConfirmed && bookingDetails && (
                <div className="rounded-xl border border-[#00FFFF]/40 bg-gradient-to-br from-[#00FFFF]/10 to-[#00FFFF]/5 p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#00FFFF]/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-[#00FFFF]" />
                    </div>
                    <div>
                      <p className="text-[#00FFFF] font-bold text-lg leading-tight">Appointment Confirmed!</p>
                      <p className="text-gray-400 text-xs">A confirmation email has been sent to you</p>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="bg-black/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-4 h-4 text-[#00FFFF] flex-shrink-0" />
                      <span className="font-semibold text-white">
                        {new Date(bookingDetails.startTime).toLocaleDateString('en-CA', {
                          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-[#00FFFF] font-bold text-xs">⏰</span>
                      <span className="text-gray-300">
                        {new Date(bookingDetails.startTime).toLocaleTimeString('en-CA', {
                          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                          hour: 'numeric', minute: '2-digit', hour12: true,
                        })}
                        {bookingDetails.endTime && (
                          <span className="text-gray-500">
                            {' '}–{' '}
                            {new Date(bookingDetails.endTime).toLocaleTimeString('en-CA', {
                              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                              hour: 'numeric', minute: '2-digit', hour12: true,
                            })}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Footer: Add to Calendar + Reschedule */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <p className="text-gray-400 text-sm">
                      Marina will call you shortly to confirm the details.
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Add to Calendar dropdown */}
                      <div className="relative" ref={calendarMenuRef}>
                        <button
                          onClick={() => setCalendarMenuOpen(prev => !prev)}
                          className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-[#00FFFF] text-black hover:bg-[#00CCCC] transition-colors whitespace-nowrap"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Add to Calendar
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${calendarMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {calendarMenuOpen && (
                          <div className="absolute right-0 mt-1 w-48 rounded-lg bg-gray-900 border border-gray-700 shadow-xl z-20 overflow-hidden">
                            <a
                              href={buildGoogleCalendarUrl(
                                bookingDetails.startTime,
                                bookingDetails.endTime,
                                'A1 Marine Care – Boat Detailing Service',
                                `Your boat detailing appointment with A1 Marine Care.\nQuote ref: ${quoteId || ''}`,
                                quoteData?.location || 'Marina'
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setCalendarMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-200 hover:bg-gray-800 transition-colors"
                            >
                              {/* Google Calendar colour icon */}
                              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.5 3H6.5C4.567 3 3 4.567 3 6.5v11C3 19.433 4.567 21 6.5 21h11c1.933 0 3.5-1.567 3.5-3.5v-11C21 4.567 19.433 3 17.5 3z" fill="#fff"/>
                                <path d="M17.5 3H6.5C4.567 3 3 4.567 3 6.5V8h18V6.5C21 4.567 19.433 3 17.5 3z" fill="#4285F4"/>
                                <path d="M3 8v9.5C3 19.433 4.567 21 6.5 21H8V8H3z" fill="#34A853"/>
                                <path d="M16 21h1.5c1.933 0 3.5-1.567 3.5-3.5V8h-5v13z" fill="#FBBC04"/>
                                <path d="M8 8v13h8V8H8z" fill="#EA4335"/>
                                <path d="M8 8V3H6.5C4.567 3 3 4.567 3 6.5V8h5z" fill="#188038"/>
                                <path d="M21 8h-5V3h1.5C19.433 3 21 4.567 21 6.5V8z" fill="#1967D2"/>
                                <text x="12" y="17" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#4285F4">G</text>
                              </svg>
                              Google Calendar
                            </a>
                            <button
                              onClick={() => {
                                downloadIcal(
                                  bookingDetails.startTime,
                                  bookingDetails.endTime,
                                  'A1 Marine Care – Boat Detailing Service',
                                  `Your boat detailing appointment with A1 Marine Care.\nQuote ref: ${quoteId || ''}`,
                                  quoteData?.location || 'Marina'
                                );
                                setCalendarMenuOpen(false);
                              }}
                              className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-200 hover:bg-gray-800 transition-colors border-t border-gray-700"
                            >
                              {/* Generic calendar icon for iCal/Outlook */}
                              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="4" width="18" height="17" rx="2" fill="#0078D4"/>
                                <rect x="3" y="4" width="18" height="5" rx="2" fill="#0078D4"/>
                                <rect x="3" y="7" width="18" height="2" fill="#005A9E"/>
                                <rect x="7" y="2" width="2" height="4" rx="1" fill="#fff"/>
                                <rect x="15" y="2" width="2" height="4" rx="1" fill="#fff"/>
                                <text x="12" y="18" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#fff">ICS</text>
                              </svg>
                              Apple / Outlook (.ics)
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Reschedule link */}
                      {bookingDetails.bookingUid ? (
                        <a
                          href={`https://cal.com/reschedule/${bookingDetails.bookingUid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-[#00FFFF] hover:text-[#00CCCC] transition-colors font-medium whitespace-nowrap"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Reschedule
                        </a>
                      ) : (
                        <a
                          href="https://cal.com/a1-marine-care/book-your-service"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-[#00FFFF] hover:text-[#00CCCC] transition-colors font-medium whitespace-nowrap"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Manage
                        </a>
                      )}
                    </div>
                  </div>
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
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00FFFF]/10 flex items-center justify-center mt-1">
                        <Bot className="w-4 h-4 text-[#00FFFF]" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-[#00FFFF]/20 text-white rounded-tr-sm'
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
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00FFFF]/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-[#00FFFF]" />
                    </div>
                    <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1 items-center h-5">
                        <span className="w-2 h-2 bg-[#00FFFF]/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-[#00FFFF]/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-[#00FFFF]/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                  className="bg-[#00FFFF] hover:bg-[#00CCCC] text-black px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cal.com Booking Calendar */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#00FFFF]" />
                Book Your Service Date
              </CardTitle>
              <CardDescription className="text-gray-400">
                Prefer to book directly? Select a date and time below
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden rounded-b-lg">
              <CalEmbed
                customerName={quoteData?.fullName}
                customerEmail={quoteData?.email}
              />
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
                <Mail className="w-5 h-5 text-[#00FFFF]" />
                <a href="mailto:contact@a1marinecare.ca" className="hover:text-[#00FFFF] transition-colors">
                  contact@a1marinecare.ca
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Phone className="w-5 h-5 text-[#00FFFF]" />
                <a href="tel:+17059961010" className="hover:text-[#00FFFF] transition-colors">
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
              className="bg-transparent border-[#00FFFF]/50 text-[#00FFFF] hover:bg-[#00FFFF]/10"
            >
              <a href="https://a1marinecare.ca">Return to Home</a>
            </Button>
            <Button
              asChild
              className="bg-[#00FFFF] hover:bg-[#00CCCC] text-black font-semibold px-8 py-6 text-lg"
            >
              <a href="/">Get Another Quote</a>
            </Button>
          </div>

        </div>
      </main>
    </div>
  );
}
