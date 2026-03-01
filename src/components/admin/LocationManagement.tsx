import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Plus, Search, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { locationsService, State, City, Area } from '@/api/locationsService';

const LocationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('states');
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    stateId: '',
    cityId: '',
    pincode: '',
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'states': {
          const response = searchTerm
            ? await locationsService.getStates({ search: searchTerm })
            : await locationsService.getAllStates();
          if (response.success) setStates(response.data);
          break;
        }
        case 'cities': {
          const response = await locationsService.getCities({ search: searchTerm || undefined });
          if (response.success) setCities(response.data as any);
          break;
        }
        case 'areas': {
          const response = await locationsService.getAreas({ search: searchTerm || undefined });
          if (response.success) setAreas(response.data as any);
          break;
        }
      }
    } catch (error) {
      console.error('Load data error:', error);
      toast({ title: "Error", description: "Failed to load location data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      let response: any;
      switch (activeTab) {
        case 'states':
          response = await locationsService.createState({ name: formData.name, code: formData.code });
          break;
        case 'cities':
          response = await locationsService.createCity({
            name: formData.name,
            state_id: formData.stateId,
            latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
            longitude: formData.longitude ? parseFloat(formData.longitude) : undefined
          });
          break;
        case 'areas':
          response = await locationsService.createArea({
            name: formData.name,
            city_id: formData.cityId,
            pincode: formData.pincode,
            latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
            longitude: formData.longitude ? parseFloat(formData.longitude) : undefined
          });
          break;
      }

      if (response?.success) {
        toast({ title: "Success", description: `${activeTab.slice(0, -1)} created successfully` });
        setIsCreateDialogOpen(false);
        resetForm();
        loadData();
      } else {
        throw new Error(response?.error || 'Create failed');
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || `Failed to create`, variant: "destructive" });
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm(`Are you sure you want to deactivate this ${activeTab.slice(0, -1)}?`)) return;

    try {
      let response: any;
      switch (activeTab) {
        case 'states':
          response = await locationsService.deactivateState(id);
          break;
        case 'cities':
          response = await locationsService.deactivateCity(id);
          break;
        case 'areas':
          response = await locationsService.deactivateArea(id);
          break;
      }

      if (response?.success) {
        toast({ title: "Success", description: `${activeTab.slice(0, -1)} deactivated successfully` });
        loadData();
      } else {
        throw new Error(response?.error || 'Deactivate failed');
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || `Failed to deactivate`, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', stateId: '', cityId: '', pincode: '', latitude: '', longitude: '' });
  };

  // Load states for city creation dropdown
  const [allStates, setAllStates] = useState<State[]>([]);
  const [allCities, setAllCities] = useState<City[]>([]);
  useEffect(() => {
    locationsService.getAllStates().then(r => { if (r.success) setAllStates(r.data); });
  }, []);
  useEffect(() => {
    if (formData.stateId) {
      locationsService.getCities({ stateId: formData.stateId }).then(r => { if (r.success) setAllCities(r.data as any); });
    }
  }, [formData.stateId]);

  const renderCreateForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter name" />
      </div>

      {activeTab === 'states' && (
        <div>
          <Label htmlFor="code">Code</Label>
          <Input id="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="e.g., KA" maxLength={3} />
        </div>
      )}

      {activeTab === 'cities' && (
        <div>
          <Label htmlFor="stateId">State</Label>
          <Select value={formData.stateId} onValueChange={(value) => setFormData({ ...formData, stateId: value })}>
            <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
            <SelectContent>
              {allStates.map((state) => (
                <SelectItem key={state.id} value={state.id}>{state.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {activeTab === 'areas' && (
        <>
          <div>
            <Label htmlFor="stateId">State</Label>
            <Select value={formData.stateId} onValueChange={(value) => setFormData({ ...formData, stateId: value, cityId: '' })}>
              <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent>
                {allStates.map((state) => (
                  <SelectItem key={state.id} value={state.id}>{state.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="cityId">City</Label>
            <Select value={formData.cityId} onValueChange={(value) => setFormData({ ...formData, cityId: value })}>
              <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
              <SelectContent>
                {allCities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="pincode">Pincode</Label>
            <Input id="pincode" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} placeholder="Enter pincode" />
          </div>
        </>
      )}

      {(activeTab === 'cities' || activeTab === 'areas') && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input id="latitude" type="number" step="any" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} placeholder="Latitude" />
          </div>
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input id="longitude" type="number" step="any" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} placeholder="Longitude" />
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>Cancel</Button>
        <Button onClick={handleCreate}>Create</Button>
      </div>
    </div>
  );

  const renderTable = () => {
    let data: any[] = [];
    let columns: string[] = [];

    switch (activeTab) {
      case 'states':
        data = states;
        columns = ['Name', 'Code', 'Status', 'Actions'];
        break;
      case 'cities':
        data = cities;
        columns = ['Name', 'State', 'Coordinates', 'Actions'];
        break;
      case 'areas':
        data = areas;
        columns = ['Name', 'City', 'Pincode', 'Coordinates', 'Actions'];
        break;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              {activeTab === 'states' && <TableCell>{item.code}</TableCell>}
              {activeTab === 'states' && (
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
              )}
              {activeTab === 'cities' && (
                <>
                  <TableCell>{item.state?.name || 'N/A'}</TableCell>
                  <TableCell>
                    {item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : 'N/A'}
                  </TableCell>
                </>
              )}
              {activeTab === 'areas' && (
                <>
                  <TableCell>{item.city?.name || 'N/A'}</TableCell>
                  <TableCell>{item.pincode || 'N/A'}</TableCell>
                  <TableCell>
                    {item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : 'N/A'}
                  </TableCell>
                </>
              )}
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => handleDeactivate(item.id)}>
                  <EyeOff className="h-4 w-4 mr-1" />
                  Deactivate
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Location Management</h1>
          <p className="text-muted-foreground">Manage states, cities, and areas</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Locations
            </CardTitle>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Search locations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64" />
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add {activeTab.slice(0, -1)}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create {activeTab.slice(0, -1)}</DialogTitle>
                  </DialogHeader>
                  {renderCreateForm()}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearchTerm(''); }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="states">States</TabsTrigger>
              <TabsTrigger value="cities">Cities</TabsTrigger>
              <TabsTrigger value="areas">Areas</TabsTrigger>
            </TabsList>

            <TabsContent value="states" className="mt-6">
              {loading ? <div className="text-center py-8">Loading states...</div> : renderTable()}
            </TabsContent>
            <TabsContent value="cities" className="mt-6">
              {loading ? <div className="text-center py-8">Loading cities...</div> : renderTable()}
            </TabsContent>
            <TabsContent value="areas" className="mt-6">
              {loading ? <div className="text-center py-8">Loading areas...</div> : renderTable()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationManagement;
