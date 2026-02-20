
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Eye, Check, X, Clock, AlertTriangle, User, Building, CreditCard, FileText, Phone, Mail, Download, Filter, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { vendorApprovalService, Vendor, VendorFilters, VendorsResponse } from '@/api/vendorApprovalService';
import { VendorDetailsDialog } from './VendorDetailsDialog';
import { VendorStatsCards } from './VendorStatsCards';
import { Link } from 'react-router-dom';

const VendorApproval: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [filters, setFilters] = useState<VendorFilters>({
    status: 'all',
    search: '',
    businessType: '',
    city: '',
    state: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    const result = await vendorApprovalService.getVendors(
      { page: currentPage, limit: 10 },
      filters
    );
    
    if (result.success) {
      const data: VendorsResponse = result.data.data;
      setVendors(data.vendors);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } else {
      toast({
        title: "Error",
        description: "Failed to fetch Hosts",
        variant: "destructive"
      });
    }
    setLoading(false);
  }, [currentPage, filters, toast]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleStatusUpdate = async (vendorId: string, action: 'approve' | 'reject' | 'suspend', additionalData?: any) => {
    const data = {
      action,
      notes: approvalNotes,
      rejectionReason: action === 'reject' ? rejectionReason : undefined,
      ...additionalData
    };

    const result = await vendorApprovalService.updateVendorStatus(vendorId, data);
    
    if (result.success) {
      toast({
        title: "Success",
        description: `Host ${action}ed successfully`
      });
      fetchVendors(); // Refresh the list
      setRejectionReason('');
      setApprovalNotes('');
    } else {
      toast({
        title: "Error",
        description: result.error?.message || `Failed to ${action} Host`,
        variant: "destructive"
      });
    }
  };

  const handleVendorUpdate = async (vendorId: string, updatedData: Partial<Vendor>) => {
    const result = await vendorApprovalService.updateVendorDetails(vendorId, updatedData);
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Host details updated successfully"
      });
      fetchVendors(); // Refresh the list
      setSelectedVendor(result.data.data); // Update selected vendor with new data
    } else {
      toast({
        title: "Error",
        description: result.error?.message || "Failed to update Host details",
        variant: "destructive"
      });
    }
  };

  const handleFilterChange = (key: keyof VendorFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleExport = async () => {
    const result = await vendorApprovalService.exportVendors(filters);
    if (result.success) {
      const url = window.URL.createObjectURL(new Blob([result.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Hosts_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({
        title: "Success",
        description: "Hosts data exported successfully"
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to export Hosts data",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <Check className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      case 'suspended': return <AlertTriangle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return null;
    }
  };

  const columns = [
    {
      accessorKey: 'vendorId',
      header: 'Host ID',
      cell: ({ row }: { row: { original: Vendor } }) => (
        <div className="font-mono text-sm">{row.original.vendorId}</div>
      )
    },
    {
      accessorKey: 'businessName',
      header: 'Business Name',
      cell: ({ row }: { row: { original: Vendor } }) => (
        <div>
          <p className="font-medium">{row.original.businessName}</p>
          <p className="text-sm text-muted-foreground">{row.original.contactPerson}</p>
        </div>
      )
    },
    {
      accessorKey: 'businessType',
      header: 'Type',
      cell: ({ row }: { row: { original: Vendor } }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.businessType}
        </Badge>
      )
    },
    {
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }: { row: { original: Vendor } }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <Mail className="h-3 w-3" />
            {row.original.email}
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Phone className="h-3 w-3" />
            {row.original.phone}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'address',
      header: 'Location',
      cell: ({ row }: { row: { original: Vendor } }) => (
        <div className="text-sm">
          <p>{row.original.address.city}, {row.original.address.state}</p>
          <p className="text-muted-foreground">{row.original.address.pincode}</p>
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Vendor } }) => (
        <Badge className={`${getStatusColor(row.original.status)} border-0`}>
          <div className="flex items-center gap-1">
            {getStatusIcon(row.original.status)}
            <span className="capitalize">{row.original.status}</span>
          </div>
        </Badge>
      )
    },
    {
      accessorKey: 'createdAt',
      header: 'Applied On',
      cell: ({ row }: { row: { original: Vendor } }) => (
        <div className="text-sm">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </div>
      )
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: Vendor } }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedVendor(row.original);
              setShowDetailsDialog(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          {row.original.status === 'pending' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 hover:text-green-700"
                onClick={() => handleStatusUpdate(row.original._id, 'approve')}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject Host Application</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="rejectionReason">Rejection Reason</Label>
                      <Textarea
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a reason for rejection..."
                        required
                      />
                    </div>
                    <Button 
                      onClick={() => handleStatusUpdate(row.original._id, 'reject')}
                      className="w-full"
                      variant="destructive"
                    >
                      Reject Application
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
          
          {row.original.status === 'approved' && (
            <Button
              variant="outline"
              size="sm"
              className="text-yellow-600 hover:text-yellow-700"
              onClick={() => handleStatusUpdate(row.original._id, 'suspend')}
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  const filterTable = (searchValue: string) => {
    handleFilterChange('search', searchValue);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Host Management</h1>
          <p className="text-muted-foreground">Review and manage Host applications</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link to="/admin/vendor-auto-payout">
            <Button variant="outline" className="w-full justify-start">
              Auto Payout Settings
            </Button>
          </Link>
        </div>
      </div>

      <VendorStatsCards />

      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* <SelectItem value="all">All Status</SelectItem> */}
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Business Type</Label>
                <Select value={filters.businessType} onValueChange={(value) => handleFilterChange('businessType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem> */}
                    <SelectItem value="cabin">Cabin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>City</Label>
                <Input
                  value={filters.city || ''}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  placeholder="Filter by city"
                />
              </div>
              
              <div>
                <Label>State</Label>
                <Input
                  value={filters.state || ''}
                  onChange={(e) => handleFilterChange('state', e.target.value)}
                  placeholder="Filter by state"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Hosts ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={vendors}
                filter={filterTable}
              />
              
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      {totalPages > 5 && <PaginationEllipsis />}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {selectedVendor && (
        <VendorDetailsDialog
          vendor={selectedVendor}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          onStatusUpdate={handleStatusUpdate}
          onVendorUpdate={handleVendorUpdate}
        />
      )}
    </div>
  );
};

export default VendorApproval;