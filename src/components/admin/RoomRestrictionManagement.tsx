
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { roomRestrictionService, type RoomRestriction, type RoomRestrictionData, type RoomRestrictionFilters } from '@/api/roomRestrictionService';
import { adminRoomsService } from '@/api/adminRoomsService';
import { format } from 'date-fns';
import { 
  Ban, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Users
} from 'lucide-react';

export const RoomRestrictionManagement: React.FC = () => {
  const [restrictions, setRestrictions] = useState<RoomRestriction[]>([]);
  const [cabins, setCabins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState<RoomRestrictionFilters>({});
  const [selectedRestriction, setSelectedRestriction] = useState<RoomRestriction | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState<RoomRestrictionData>({
    cabinId: '',
    restrictionType: 'date',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRestrictions();
    fetchCabins();
  }, [pagination.page, filters]);

  const fetchRestrictions = async () => {
    try {
      setLoading(true);
      const response = await roomRestrictionService.getRestrictions(pagination.page, pagination.limit, filters);

      if (response.success) {
        setRestrictions(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching restrictions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch restrictions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCabins = async () => {
    try {
      const response = await (adminRoomsService as any).getAllRooms();
      if (response.success) {
        setCabins(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching cabins:', error);
    }
  };

  const handleCreateRestriction = async () => {
    try {
      const response = await roomRestrictionService.createRestriction(formData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Restriction created successfully"
        });
        
        setShowCreateDialog(false);
        resetForm();
        fetchRestrictions();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error creating restriction:', error);
      toast({
        title: "Error",
        description: "Failed to create restriction",
        variant: "destructive"
      });
    }
  };

  const handleUpdateRestriction = async () => {
    if (!selectedRestriction) return;

    try {
      const response = await roomRestrictionService.updateRestriction(selectedRestriction._id, formData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Restriction updated successfully"
        });
        
        setShowEditDialog(false);
        resetForm();
        fetchRestrictions();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error updating restriction:', error);
      toast({
        title: "Error",
        description: "Failed to update restriction",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRestriction = async (restrictionId: string) => {
    if (!confirm('Are you sure you want to delete this restriction?')) return;

    try {
      const response = await roomRestrictionService.deleteRestriction(restrictionId);

      if (response.success) {
        toast({
          title: "Success",
          description: "Restriction deleted successfully"
        });
        
        fetchRestrictions();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error deleting restriction:', error);
      toast({
        title: "Error",
        description: "Failed to delete restriction",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (restrictionId: string) => {
    try {
      const response = await roomRestrictionService.toggleRestrictionStatus(restrictionId);

      if (response.success) {
        toast({
          title: "Success",
          description: "Restriction status updated successfully"
        });
        
        fetchRestrictions();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error toggling restriction status:', error);
      toast({
        title: "Error",
        description: "Failed to update restriction status",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      cabinId: '',
      restrictionType: 'date',
      startDate: '',
      endDate: '',
      reason: ''
    });
    setSelectedRestriction(null);
  };

  const getRestrictionTypeBadge = (type: string) => {
    const config = {
      date: { color: 'bg-blue-100 text-blue-800', icon: Calendar },
      time: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      capacity: { color: 'bg-purple-100 text-purple-800', icon: Users }
    };

    const { color, icon: Icon } = config[type as keyof typeof config] || config.date;

    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Room Restriction Management</h1>
          <p className="text-muted-foreground">Manage date and time restrictions for reading rooms</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Restriction
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Restrictions</p>
                <p className="text-2xl font-bold">{pagination.total}</p>
              </div>
              <Ban className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {restrictions.filter(r => r.isActive).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date Restrictions</p>
                <p className="text-2xl font-bold">
                  {restrictions.filter(r => r.restrictionType === 'date').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Time Restrictions</p>
                <p className="text-2xl font-bold">
                  {restrictions.filter(r => r.restrictionType === 'time').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search restrictions..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <Select 
              value={filters.restrictionType || 'all'} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, restrictionType: value === 'all' ? undefined : value }))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="date">Date Restrictions</SelectItem>
                <SelectItem value="time">Time Restrictions</SelectItem>
                <SelectItem value="capacity">Capacity Restrictions</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={filters.cabinId || 'all'} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, cabinId: value === 'all' ? undefined : value }))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by cabin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cabins</SelectItem>
                {cabins.map((cabin) => (
                  <SelectItem key={cabin._id} value={cabin._id}>
                    {cabin.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={fetchRestrictions}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Restrictions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Room Restrictions ({restrictions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cabin</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Time Range</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {restrictions.map((restriction) => (
                      <TableRow key={restriction._id}>
                        <TableCell className="font-medium">
                          {restriction.cabinId.name}
                        </TableCell>
                        <TableCell>
                          {getRestrictionTypeBadge(restriction.restrictionType)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(restriction.startDate), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(restriction.endDate), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          {restriction.startTime && restriction.endTime ? 
                            `${restriction.startTime} - ${restriction.endTime}` : 
                            '-'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={restriction.reason}>
                            {restriction.reason}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(restriction.isActive)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(restriction.createdAt), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRestriction(restriction);
                                setFormData({
                                  cabinId: restriction.cabinId,
                                  roomId: restriction.roomId,
                                  restrictionType: restriction.restrictionType,
                                  startDate: restriction.startDate.split('T')[0],
                                  endDate: restriction.endDate.split('T')[0],
                                  startTime: restriction.startTime,
                                  endTime: restriction.endTime,
                                  reason: restriction.reason
                                });
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(restriction._id)}
                            >
                              {restriction.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteRestriction(restriction._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} restrictions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Restriction Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Room Restriction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cabinId">Cabin</Label>
                <Select 
                  value={formData.cabinId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, cabinId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cabin" />
                  </SelectTrigger>
                  <SelectContent>
                    {cabins.map((cabin) => (
                      <SelectItem key={cabin._id} value={cabin._id}>
                        {cabin.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="restrictionType">Restriction Type</Label>
                <Select 
                  value={formData.restrictionType} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, restrictionType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date Restriction</SelectItem>
                    <SelectItem value="time">Time Restriction</SelectItem>
                    <SelectItem value="capacity">Capacity Restriction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {formData.restrictionType === 'time' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for restriction..."
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateRestriction} className="flex-1">
                Create Restriction
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Restriction Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Room Restriction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editCabinId">Cabin</Label>
                <Select 
                  value={formData.cabinId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, cabinId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cabin" />
                  </SelectTrigger>
                  <SelectContent>
                    {cabins.map((cabin) => (
                      <SelectItem key={cabin._id} value={cabin._id}>
                        {cabin.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="editRestrictionType">Restriction Type</Label>
                <Select 
                  value={formData.restrictionType} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, restrictionType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date Restriction</SelectItem>
                    <SelectItem value="time">Time Restriction</SelectItem>
                    <SelectItem value="capacity">Capacity Restriction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editStartDate">Start Date</Label>
                <Input
                  id="editStartDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="editEndDate">End Date</Label>
                <Input
                  id="editEndDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {formData.restrictionType === 'time' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editStartTime">Start Time</Label>
                  <Input
                    id="editStartTime"
                    type="time"
                    value={formData.startTime || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="editEndTime">End Time</Label>
                  <Input
                    id="editEndTime"
                    type="time"
                    value={formData.endTime || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="editReason">Reason</Label>
              <Textarea
                id="editReason"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for restriction..."
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleUpdateRestriction} className="flex-1">
                Update Restriction
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
