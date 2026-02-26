import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Search, DollarSign, Ship, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";

/**
 * Admin Dashboard - Quote Management
 * Design Philosophy: Clean, data-focused interface
 * - Black background with dark cards for consistency
 * - Cyan accents for paid status, red for unpaid
 * - Table layout for easy scanning
 * - Search and filter capabilities
 */

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">("all");

  // Fetch all quotes
  const { data: quotes, isLoading, error } = trpc.quotes.list.useQuery();

  // Filter and search quotes
  const filteredQuotes = useMemo(() => {
    if (!quotes) return [];

    let filtered = [...quotes];

    // Filter by payment status
    if (paymentFilter === "paid") {
      filtered = filtered.filter(q => q.depositPaid);
    } else if (paymentFilter === "unpaid") {
      filtered = filtered.filter(q => !q.depositPaid);
    }

    // Search by customer name, email, or phone
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q => 
        q.fullName.toLowerCase().includes(query) ||
        q.email.toLowerCase().includes(query) ||
        q.phone.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [quotes, paymentFilter, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!quotes) return { total: 0, paid: 0, unpaid: 0, totalRevenue: 0 };

    const paid = quotes.filter(q => q.depositPaid).length;
    const unpaid = quotes.filter(q => !q.depositPaid).length;
    const totalRevenue = quotes
      .filter(q => q.depositPaid)
      .reduce((sum, q) => sum + q.depositAmount, 0);

    return {
      total: quotes.length,
      paid,
      unpaid,
      totalRevenue,
    };
  }, [quotes]);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <img 
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663289180469/WGIEJYNWHRlJZpOd.png" 
              alt="A1 Marine Care" 
              className="h-16 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-gray-400">Quote Management</p>
            </div>
          </div>
          <a 
            href="/" 
            className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium"
          >
            Back to Home
          </a>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-gray-400">Total Quotes</CardDescription>
                <CardTitle className="text-3xl text-white">{stats.total}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-gray-400">
                  <Ship className="w-4 h-4" />
                  <span className="text-sm">All submissions</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-gray-400">Paid Deposits</CardDescription>
                <CardTitle className="text-3xl text-cyan-400">{stats.paid}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-cyan-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Confirmed bookings</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-gray-400">Unpaid Quotes</CardDescription>
                <CardTitle className="text-3xl text-red-400">{stats.unpaid}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm">Pending payment</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-gray-400">Total Revenue</CardDescription>
                <CardTitle className="text-3xl text-white">
                  ${(stats.totalRevenue / 100).toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-gray-400">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">Deposits collected</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Quote List</CardTitle>
              <CardDescription className="text-gray-400">
                View and manage all quote submissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <Select value={paymentFilter} onValueChange={(value: any) => setPaymentFilter(value)}>
                  <SelectTrigger className="w-full md:w-48 bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All Quotes</SelectItem>
                    <SelectItem value="paid">Paid Only</SelectItem>
                    <SelectItem value="unpaid">Unpaid Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="text-center py-12">
                  <p className="text-red-400">Failed to load quotes: {error.message}</p>
                </div>
              )}

              {/* Table */}
              {!isLoading && !error && (
                <div className="rounded-lg border border-gray-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/50">
                        <TableHead className="text-gray-300">Date</TableHead>
                        <TableHead className="text-gray-300">Customer</TableHead>
                        <TableHead className="text-gray-300">Contact</TableHead>
                        <TableHead className="text-gray-300">Boat</TableHead>
                        <TableHead className="text-gray-300">Quote Total</TableHead>
                        <TableHead className="text-gray-300">Deposit</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuotes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                            No quotes found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredQuotes.map((quote) => (
                          <TableRow 
                            key={quote.id} 
                            className="border-gray-800 hover:bg-gray-800/30"
                          >
                            <TableCell className="text-gray-300">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                {format(new Date(quote.createdAt), "MMM d, yyyy")}
                              </div>
                            </TableCell>
                            <TableCell className="text-white font-medium">
                              {quote.fullName}
                            </TableCell>
                            <TableCell className="text-gray-400 text-sm">
                              <div>{quote.email}</div>
                              <div>{quote.phone}</div>
                            </TableCell>
                            <TableCell className="text-gray-300">
                              <div>{quote.boatLength}ft {quote.boatType}</div>
                              <div className="text-xs text-gray-500">{quote.location}</div>
                            </TableCell>
                            <TableCell className="text-white font-semibold">
                              ${(quote.total / 100).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              ${(quote.depositAmount / 100).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {quote.depositPaid ? (
                                <Badge className="bg-cyan-400/20 text-cyan-400 border-cyan-400/30">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Paid
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-400/10 text-red-400 border-red-400/30">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Unpaid
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Results Count */}
              {!isLoading && !error && filteredQuotes.length > 0 && (
                <p className="text-sm text-gray-400 text-center">
                  Showing {filteredQuotes.length} of {quotes?.length || 0} quotes
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
