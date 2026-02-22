import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Filter, Download, Eye, DollarSign, AlertCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";

type PaymentStatus = "pending" | "paid" | "refunded" | "all";

export default function AdminQuotes() {
  const { data: quotes, isLoading, error, refetch } = trpc.quotes.list.useQuery();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus>("all");
  const [reviewFilter, setReviewFilter] = useState<"all" | "yes" | "no">("all");
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  // Filter and search quotes
  const filteredQuotes = useMemo(() => {
    if (!quotes) return [];
    
    return quotes.filter(quote => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        quote.customerName.toLowerCase().includes(searchLower) ||
        quote.customerEmail.toLowerCase().includes(searchLower) ||
        quote.customerPhone.includes(searchTerm) ||
        quote.boatType.toLowerCase().includes(searchLower);
      
      // Status filter
      const matchesStatus = statusFilter === "all" || quote.paymentStatus === statusFilter;
      
      // Review filter
      const matchesReview = reviewFilter === "all" || 
        (reviewFilter === "yes" && quote.requiresManualReview) ||
        (reviewFilter === "no" && !quote.requiresManualReview);
      
      return matchesSearch && matchesStatus && matchesReview;
    });
  }, [quotes, searchTerm, statusFilter, reviewFilter]);

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredQuotes.length) return;
    
    const headers = ["ID", "Date", "Customer", "Email", "Phone", "Boat", "Length", "Location", "Total", "Deposit", "Status", "Manual Review"];
    const rows = filteredQuotes.map(q => [
      q.id,
      format(new Date(q.createdAt), "yyyy-MM-dd HH:mm"),
      q.customerName,
      q.customerEmail,
      q.customerPhone,
      q.boatType,
      q.boatLength,
      q.serviceLocation,
      `$${(q.estimatedTotal / 100).toFixed(2)}`,
      `$${(q.depositAmount / 100).toFixed(2)}`,
      q.paymentStatus,
      q.requiresManualReview ? "Yes" : "No"
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quotes-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      paid: "default",
      refunded: "destructive"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Quotes</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Quote Management</h1>
              <p className="text-muted-foreground mt-1">View and manage all customer quote submissions</p>
            </div>
            <a href="/" className="text-primary hover:text-primary/80 transition-colors font-medium">
              Back to Quote Form
            </a>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Quotes</p>
                  <p className="text-2xl font-bold text-foreground">{quotes?.length || 0}</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payment</p>
                  <p className="text-2xl font-bold text-foreground">
                    {quotes?.filter(q => q.paymentStatus === "pending").length || 0}
                  </p>
                </div>
                <Loader2 className="w-8 h-8 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="text-2xl font-bold text-foreground">
                    {quotes?.filter(q => q.paymentStatus === "paid").length || 0}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Manual Review</p>
                  <p className="text-2xl font-bold text-foreground">
                    {quotes?.filter(q => q.requiresManualReview).length || 0}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search customer, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(value: PaymentStatus) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={reviewFilter} onValueChange={(value: any) => setReviewFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Manual Review" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quotes</SelectItem>
                  <SelectItem value="yes">Requires Review</SelectItem>
                  <SelectItem value="no">No Review Needed</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={exportToCSV} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quotes Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Quotes ({filteredQuotes.length})</CardTitle>
            <CardDescription>Click any row to view full details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Boat</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No quotes found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuotes.map((quote) => (
                      <TableRow key={quote.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">#{quote.id}</TableCell>
                        <TableCell>{format(new Date(quote.createdAt), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{quote.customerName}</p>
                            <p className="text-sm text-muted-foreground">{quote.customerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{quote.boatLength}ft {quote.boatType}</p>
                            <p className="text-sm text-muted-foreground">{quote.serviceLocation}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${(quote.estimatedTotal / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(quote.paymentStatus)}</TableCell>
                        <TableCell>
                          {quote.requiresManualReview && (
                            <Badge variant="outline" className="gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Review
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedQuote(quote)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                              <QuoteDetailModal quote={quote} onClose={() => setSelectedQuote(null)} refetch={refetch} />
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Quote Detail Modal Component
function QuoteDetailModal({ quote, onClose, refetch }: { quote: any; onClose: () => void; refetch: () => void }) {
  const updatePaymentStatus = trpc.quotes.updatePaymentStatus.useMutation({
    onSuccess: () => {
      refetch();
      onClose();
    }
  });

  const servicesConfig = typeof quote.servicesConfig === 'string' 
    ? JSON.parse(quote.servicesConfig) 
    : quote.servicesConfig;

  const reviewReasons = quote.reviewReasons 
    ? (typeof quote.reviewReasons === 'string' ? JSON.parse(quote.reviewReasons) : quote.reviewReasons)
    : [];

  return (
    <>
      <DialogHeader>
        <DialogTitle>Quote #{quote.id} Details</DialogTitle>
        <DialogDescription>
          Submitted on {format(new Date(quote.createdAt), "MMMM d, yyyy 'at' h:mm a")}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Customer Information */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Customer Information</h3>
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{quote.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{quote.customerEmail}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{quote.customerPhone}</p>
            </div>
          </div>
        </div>

        {/* Boat Details */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Boat Details</h3>
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Length</p>
              <p className="font-medium">{quote.boatLength} feet</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{quote.boatType}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Service Location</p>
              <p className="font-medium">{quote.serviceLocation}</p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Pricing</h3>
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Estimated Total</p>
              <p className="font-bold text-2xl text-primary">${(quote.estimatedTotal / 100).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deposit Amount</p>
              <p className="font-semibold text-xl">${(quote.depositAmount / 100).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Payment Status</h3>
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Current Status</p>
              <Badge variant={quote.paymentStatus === "paid" ? "default" : "secondary"}>
                {quote.paymentStatus.toUpperCase()}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={quote.paymentStatus === "paid" || updatePaymentStatus.isPending}
                onClick={() => updatePaymentStatus.mutate({ id: quote.id, status: "paid" })}
              >
                Mark as Paid
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={quote.paymentStatus === "pending" || updatePaymentStatus.isPending}
                onClick={() => updatePaymentStatus.mutate({ id: quote.id, status: "pending" })}
              >
                Mark as Pending
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={quote.paymentStatus === "refunded" || updatePaymentStatus.isPending}
                onClick={() => updatePaymentStatus.mutate({ id: quote.id, status: "refunded" })}
              >
                Mark as Refunded
              </Button>
            </div>
          </div>
        </div>

        {/* Manual Review */}
        {quote.requiresManualReview && (
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Manual Review Required
            </h3>
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <ul className="list-disc list-inside space-y-1">
                {reviewReasons.map((reason: string, i: number) => (
                  <li key={i} className="text-sm">{reason}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Selected Services */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Selected Services</h3>
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            {Object.entries(servicesConfig.selectedServices || {}).map(([service, selected]) => 
              selected ? (
                <div key={service} className="border-b border-border/50 last:border-0 pb-3 last:pb-0">
                  <p className="font-medium capitalize mb-2">{service.replace(/([A-Z])/g, ' $1').trim()}</p>
                  {servicesConfig[service] && (
                    <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                      {JSON.stringify(servicesConfig[service], null, 2)}
                    </pre>
                  )}
                </div>
              ) : null
            )}
          </div>
        </div>
      </div>
    </>
  );
}
