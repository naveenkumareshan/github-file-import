
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { locationsService, Country, State, City, Area, LocationFilters } from '@/api/locationsService';

const LocationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('countries');
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    countryId: '',
    stateId: '',
    cityId: '',
    pincode: '',
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab, currentPage, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters: LocationFilters = {
        page: currentPage,
        limit: 20,
        search: searchTerm
      };

      let response;
      switch (activeTab) {
        case 'countries':
          response = await locationsService.getCountries(filters);
          if (response.success) {
            setCountries(response.data.data);
            setTotalPages(response.data.pagination.pages);
          }
          break;
        case 'states':
          response = await locationsService.getStates(filters);
          if (response.success) {
            setStates(response.data.data);
            setTotalPages(response.data.pagination.pages);
          }
          break;
        case 'cities':
          response = await locationsService.getCities(filters);
          if (response.success) {
            setCities(response.data.data);
            setTotalPages(response.data.pagination.pages);
          }
          break;
        case 'areas':
          response = await locationsService.getAreas(filters);
          if (response.success) {
            setAreas(response.data.data);
            setTotalPages(response.data.pagination.pages);
          }
          break;
      }
    } catch (error) {
      console.error('Load data error:', error);
      toast({
        title: "Error",
        description: "Failed to load location data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      let response;
      switch (activeTab) {
        case 'countries':
          response = await locationsService.createCountry({
            name: formData.name,
            code: formData.code
          });
          break;
        case 'states':
          response = await locationsService.createState({
            name: formData.name,
            code: formData.code,
            countryId: formData.countryId
          });
          break;
        case 'cities':
          response = await locationsService.createCity({
            name: formData.name,
            stateId: formData.stateId,
            latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
            longitude: formData.longitude ? parseFloat(formData.longitude) : undefined
          });
          break;
        case 'areas':
          response = await locationsService.createArea({
            name: formData.name,
            cityId: formData.cityId,
            pincode: formData.pincode,
            latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
            longitude: formData.longitude ? parseFloat(formData.longitude) : undefined
          });
          break;
      }

      if (response?.success) {
        toast({
          title: "Success",
          description: `${activeTab.slice(0, -1)} created successfully`
        });
        setIsCreateDialogOpen(false);
        resetForm();
        loadData();
      } else {
        throw new Error(response?.error || 'Create failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || `Failed to create ${activeTab.slice(0, -1)}`,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) {
      return;
    }

    try {
      let response;
      switch (activeTab) {
        case 'countries':
          response = await locationsService.deleteCountry(id);
          break;
        case 'states':
          response = await locationsService.deleteState(id);
          break;
        case 'cities':
          response = await locationsService.deleteCity(id);
          break;
        case 'areas':
          response = await locationsService.deleteArea(id);
          break;
      }

      if (response?.success) {
        toast({
          title: "Success",
          description: `${activeTab.slice(0, -1)} deleted successfully`
        });
        loadData();
      } else {
        throw new Error(response?.error || 'Delete failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || `Failed to delete ${activeTab.slice(0, -1)}`,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      countryId: '',
      stateId: '',
      cityId: '',
      pincode: '',
      latitude: '',
      longitude: ''
    });
    setEditingItem(null);
  };

  const renderCreateForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter name"
        />
      </div>

      {(activeTab === 'countries' || activeTab === 'states') && (
        <div>
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="Enter code (e.g., IN, KA)"
            maxLength={3}
          />
        </div>
      )}

      {activeTab === 'states' && (
        <div>
          <Label htmlFor="countryId">Country</Label>
          <Select value={formData.countryId} onValueChange={(value) => setFormData({ ...formData, countryId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country._id} value={country._id}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {activeTab === 'cities' && (
        <div>
          <Label htmlFor="stateId">State</Label>
          <Select value={formData.stateId} onValueChange={(value) => setFormData({ ...formData, stateId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state._id} value={state._id}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {activeTab === 'areas' && (
        <>
          <div>
            <Label htmlFor="cityId">City</Label>
            <Select value={formData.cityId} onValueChange={(value) => setFormData({ ...formData, cityId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city._id} value={city._id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="pincode">Pincode</Label>
            <Input
              id="pincode"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              placeholder="Enter pincode"
            />
          </div>
        </>
      )}

      {(activeTab === 'cities' || activeTab === 'areas') && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              placeholder="Enter latitude"
            />
          </div>
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              placeholder="Enter longitude"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
          Cancel
        </Button>
        <Button onClick={handleCreate}>
          Create
        </Button>
      </div>
    </div>
  );

  const renderTable = () => {
    let data: any[] = [];
    let columns: string[] = [];

    switch (activeTab) {
      case 'countries':
        data = countries;
        columns = ['Name', 'Code', 'Status', 'Actions'];
        break;
      case 'states':
        data = states;
        columns = ['Name', 'Code', 'Country', 'Status', 'Actions'];
        break;
      case 'cities':
        data = cities;
        columns = ['Name', 'State', 'Country', 'Coordinates', 'Actions'];
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
            <TableRow key={item._id}>
              <TableCell>{item.name}</TableCell>
              {item.code && <TableCell>{item.code}</TableCell>}
              {activeTab === 'states' && (
                <TableCell>{item.countryId?.name || 'N/A'}</TableCell>
              )}
              {activeTab === 'cities' && (
                <>
                  <TableCell>{item.stateId?.name || 'N/A'}</TableCell>
                  <TableCell>{item.stateId?.countryId?.name || 'N/A'}</TableCell>
                  <TableCell>
                    {item.latitude && item.longitude 
                      ? `${item.latitude}, ${item.longitude}`
                      : 'N/A'
                    }
                  </TableCell>
                </>
              )}
              {activeTab === 'areas' && (
                <>
                  <TableCell>{item.cityId?.name || 'N/A'}</TableCell>
                  <TableCell>{item.pincode || 'N/A'}</TableCell>
                  <TableCell>
                    {item.latitude && item.longitude 
                      ? `${item.latitude}, ${item.longitude}`
                      : 'N/A'
                    }
                  </TableCell>
                </>
              )}
              {(activeTab === 'countries' || activeTab === 'states') && (
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    item.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
              )}
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
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
          <p className="text-muted-foreground">Manage countries, states, cities, and areas</p>
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="countries">Countries</TabsTrigger>
              <TabsTrigger value="states">States</TabsTrigger>
              <TabsTrigger value="cities">Cities</TabsTrigger>
              <TabsTrigger value="areas">Areas</TabsTrigger>
            </TabsList>

            <TabsContent value="countries" className="mt-6">
              {loading ? (
                <div className="text-center py-8">Loading countries...</div>
              ) : (
                renderTable()
              )}
            </TabsContent>

            <TabsContent value="states" className="mt-6">
              {loading ? (
                <div className="text-center py-8">Loading states...</div>
              ) : (
                renderTable()
              )}
            </TabsContent>

            <TabsContent value="cities" className="mt-6">
              {loading ? (
                <div className="text-center py-8">Loading cities...</div>
              ) : (
                renderTable()
              )}
            </TabsContent>

            <TabsContent value="areas" className="mt-6">
              {loading ? (
                <div className="text-center py-8">Loading areas...</div>
              ) : (
                renderTable()
              )}
            </TabsContent>
          </Tabs>

          {totalPages > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export  default LocationManagement;