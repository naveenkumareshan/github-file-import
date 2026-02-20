
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileSpreadsheet, User, Bed, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { adminCabinsService } from '@/api/adminCabinsService';
import { bulkBookingService } from '@/api/bulkBookingService';

interface StudentData {
  name: string;
  email: string;
  phone: string;
  startDate: string | Date;
  endDate: string | Date;
  status: 'pending' | 'validated' | 'processing' | 'completed' | 'failed';
  error?: string;
  receipt_no?: string;
  transaction_id?: string;
  seat_no?: number;
  room_name?: string;
  amount?: number | string;
  userId?: string;
  key_deposite?: number | string;
  bookingId?: string;
  transactionId?: string;
  seatNumber?: number;
  totalPrice?: number;
}

interface Cabin {
  _id: string;
  name: string;
  floors : [{
    id:string,
    number : string;
  }];
  capacity?: number;
}

const StudentExcelImport = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [selectedCabin, setSelectedCabin] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('1');
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const selectedCabinData = cabins.find(c => c._id === selectedCabin);
  const floors = selectedCabinData?.floors || [];


function excelDateToJSDate(serial: number) {
  const utcDays = Math.floor(serial - 25569); // Days since 1970-01-01
  const utcValue = utcDays * 86400; // seconds
  const dateInfo = new Date(utcValue * 1000);
  // Adjust for timezone offset
  return new Date(dateInfo.getFullYear(), dateInfo.getMonth(), dateInfo.getDate());
}


function excelDateToJSStartOfDay(serial: number): Date {
  const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // Excel base in UTC
  const millis = serial * 86400 * 1000; // days → ms
  const fullDate = new Date(excelEpoch.getTime() + millis);
  fullDate.setUTCHours(9, 0, 0, 0); // start of day in UTC
  return fullDate;
}

function excelDateToJSEndOfDay(serial: number): Date {
  const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // Excel base in UTC
  const millis = serial * 86400 * 1000;
  const fullDate = new Date(excelEpoch.getTime() + millis);
  fullDate.setUTCHours(18, 0, 0, 0); // end of day in UTC
  return fullDate;
}



  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      const studentData: StudentData[] = jsonData
      .filter((row: any) => row.name && row.name?.toString().trim()  !== '')
      .map((row: any) => ({
        name: row.name,
        email: row.email ? row.email : row.phone+'@gmail.com',
        phone: row.phone,
        startDate: (row.startDate),
        endDate: (row.endDate),
        amount: row.amount,
        status: row.status || 'booked',
        receipt_no: row.receipt_no  || 'N/A',
        room_name: row.room_name || row.room_name || '',
        seat_no: row.seat_no || row.seat_no || '',
        transaction_id : row.transaction_id || 'TXN-UNKNOWN',
        pay_mode : row.pay_mode || 'Cash',
        key_deposite : row.key_deposite || 500,
      }));

      // Validate data
      const validation = bulkBookingService.validateStudentData(studentData);
      setValidationErrors(validation.errors);

      if (validation.valid) {
        setStudents(studentData.map(s => ({ ...s, status: 'validated' as const })));
        toast({
          title: "Excel Imported Successfully",
          description: `${studentData.length} students imported and validated`
        });
      } else {
        setStudents(studentData);
        toast({
          title: "Validation Errors Found",
          description: `${validation.errors.length} errors found. Please check the data.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.log(error)
      toast({
        title: "Import Failed",
        description: "Failed to read Excel file",
        variant: "destructive"
      });
    }
  };

  const fetchCabins = async () => {
    try {
      const response = await adminCabinsService.getAllCabins();
      if (response.success) {
        setCabins(response.data);
      }
    } catch (error) {
      console.error('Error fetching cabins:', error);
    }
  };


  const processStudents = async () => {
    if (!selectedCabin || !selectedFloor || students.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select a cabin and import students",
        variant: "destructive"
      });
      return;
    }

    if (validationErrors.length > 0) {
      toast({
        title: "Validation Errors",
        description: "Please fix validation errors before processing",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    setProgress(0);
    setCurrentStep('Checking available seats...');

    try {
      // Check available seats
      const seatsResponse = await bulkBookingService.getAvailableSeats(selectedCabin, selectedFloor);
      if (!seatsResponse.success) {
        throw new Error(seatsResponse.error);
      }

      const availableSeats = seatsResponse.data || [];
      if (availableSeats.length < students.length) {
        toast({
          title: "Insufficient Seats",
          description: `Only ${availableSeats.length} seats available for ${students.length} students`,
          variant: "destructive"
        });
        setProcessing(false);
        return;
      }

      // Update status to processing
      const updatedStudents = students.map(s => ({ ...s, status: 'processing' as const }));
      setStudents(updatedStudents);
      setProgress(25);
      setCurrentStep('Creating bulk bookings...');

      // Create bulk bookings
      const bulkData = {
        cabinId: selectedCabin,
        floorId: selectedFloor,
        students: students.map(s => ({
          name: s.name,
          email: s.email,
          phone: s.phone,
          startDate: excelDateToJSStartOfDay(Number(s.startDate)),
          endDate: excelDateToJSEndOfDay(Number(s.endDate)),
          status: s.status,
          receipt_no: s.receipt_no,
          room_name: s.room_name,
          seat_no: s.seat_no,
          transaction_id: s.transaction_id,
          amount: s.amount,
          key_deposite: s.key_deposite
        }))
      };

      const response = await bulkBookingService.createBulkBookings(bulkData);
      
      if (!response.success) {
        throw new Error(response.error);
      }

      setProgress(75);
      setCurrentStep('Processing results...');

      // Update students with results
      const finalStudents: StudentData[] = [...updatedStudents] as StudentData[];
      
      // Mark successful students
      response.data?.successful.forEach(success => {
        const studentIndex = finalStudents.findIndex(s => s.name === success.studentName);
        if (studentIndex !== -1) {
          finalStudents[studentIndex] = {
            ...finalStudents[studentIndex],
            status: 'completed' as StudentData['status'],
            bookingId: success.bookingId,
            transactionId: success.transactionId,
            seatNumber: success.seatNumber,
            totalPrice: success.totalPrice,
            userId: success.userId
          };
        }
      });

      // Mark failed students
      response.data?.failed.forEach(failure => {
        const studentIndex = finalStudents.findIndex(s => s.name === failure.studentName);
        if (studentIndex !== -1) {
          finalStudents[studentIndex] = {
            ...finalStudents[studentIndex],
            status: 'failed' as StudentData['status'],
            error: failure.error
          };
        }
      });

      setStudents(finalStudents);
      setProgress(100);
      setCurrentStep('Processing completed');

      const completed = response.data?.successful.length || 0;
      const failed = response.data?.failed.length || 0;

      toast({
        title: "Processing Complete",
        description: `${completed} students processed successfully, ${failed} failed`
      });

    } catch (error) {
      console.error('Error processing students:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
      
      // Reset students to validated state
      setStudents(students.map(s => ({ ...s, status: 'validated' as const })));
    } finally {
      setProcessing(false);
    }
  };

  const exportResults = () => {
    const exportData = students.map(student => ({
      name: student.name,
      email: student.email,
      phone: student.phone,
      endDate: student.endDate,
      startDate: student.startDate,
      seatNumber: student.seat_no || 'Not assigned',
      totalPrice: student.amount || 0,
      status: student.status,
      bookingId: student.bookingId || 'Not created',
      transactionId: student.transactionId || 'Not created',
      error: student.error || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, `booking_results_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Results Exported",
      description: "Processing results have been exported to Excel"
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: null },
      validated: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      processing: { color: 'bg-yellow-100 text-yellow-800', icon: CreditCard },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        {Icon && <Icon className="h-3 w-3 mr-1" />}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  React.useEffect(() => {
    fetchCabins();
  }, []);

  const completedCount = students.filter(s => s.status === 'completed').length;
  const failedCount = students.filter(s => s.status === 'failed').length;
  const totalRevenue = students
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Student Excel Import & Bulk Booking</h1>
        <p className="text-muted-foreground">
          Import student data from Excel and automatically assign seats with bookings and transactions
        </p>
      </div>

      {/* Summary Cards */}
      {students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-xl font-bold">{students.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-xl font-bold">{completedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-xl font-bold">{failedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Students
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            {/* <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button> */}
            <div className="flex-1">
              <Label htmlFor="excel-file">Upload Excel File</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
              />
            </div>
          </div>
          
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Validation Errors:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.slice(0, 5).map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                  {validationErrors.length > 5 && (
                    <li className="text-sm">... and {validationErrors.length - 5} more errors</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {students.length > 0 && validationErrors.length === 0 && (
            <div className="mt-4">
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Label htmlFor="cabin-select">Select Cabin</Label>
                  <Select value={selectedCabin} onValueChange={(value) => {
                        setSelectedCabin(value);
                        setSelectedFloor(null); // reset floor when cabin changes
                      }}
                    >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose cabin for assignments" />
                    </SelectTrigger>
                    <SelectContent>
                      {cabins.map((cabin) => (
                        <SelectItem key={cabin._id} value={cabin._id}>
                          {cabin.name} {cabin.capacity && `(${cabin.capacity} capacity)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Select Floor</Label>
                  <Select
                    value={selectedFloor ?? '' }
                    onValueChange={setSelectedFloor}
                    disabled={!selectedCabin}   // disable until cabin selected
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedCabin ? "Choose floor" : "Select cabin first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {floors.length > 0 ? (
                        floors.map((floor) => (
                          <SelectItem key={floor.id} value={floor.id}>
                            {floor.number}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No floors available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button 
                    onClick={processStudents} 
                    disabled={processing || !selectedCabin || !selectedFloor}
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Process All Students
                  </Button>
                  {students.some(s => s.status !== 'pending' && s.status !== 'validated') && (
                    <Button variant="outline" onClick={exportResults}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export Results
                    </Button>
                  )}
                </div>
              </div>

              {processing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{currentStep}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students Table */}
      {students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Imported Students ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Reading Room</TableHead>
                    <TableHead>Booking Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction_id</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{student.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.email}</div>
                          <div className="text-sm text-muted-foreground">{student.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.room_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm text-muted-foreground">From: {excelDateToJSDate(Number(student.startDate)).toLocaleDateString('en-IN')}</div>
                          <div className="text-sm text-muted-foreground">To: {excelDateToJSDate(Number(student.endDate)).toLocaleDateString('en-IN')}</div>
                          {student.seat_no && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Bed className="h-3 w-3" />
                              Seat #{student.seat_no}
                            </div>
                          )}
                          {student.amount && (
                            <div className="text-sm font-medium text-green-600">
                              Seat Price    : ₹{Number(student.amount).toLocaleString()}<br></br>
                              Key Deposite  : ₹{Number(student.key_deposite).toLocaleString()}<br></br>
                              Total         :  ₹{(Number(student.key_deposite) + Number(student.amount)).toLocaleString()}
                              
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(student.status)}
                        {student.error && (
                          <div className="text-xs text-red-600 mt-1">{student.error}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          {student.receipt_no && (
                            <div className="truncate max-w-20" title={student.receipt_no}>
                              Booking: {student.receipt_no}
                            </div>
                          )}
                          {student.transaction_id && (
                            <div className="truncate max-w-20" title={student.transaction_id}>
                              Transaction: {student.transaction_id}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentExcelImport;