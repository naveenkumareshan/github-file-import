import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { uploadService } from '@/api/uploadService';
import { vendorDocumentService } from '@/api/vendorDocumentService';
import { 
  Upload, 
  FileText, 
  CreditCard, 
  Zap, 
  Home, 
  Camera, 
  User, 
  Building,
  CheckCircle,
  X,
  Eye
} from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

interface DocumentType {
  key: string;
  label: string;
  icon: React.ElementType;
  required: boolean;
  description: string;
  acceptedFormats: string;
}

interface UploadedDocument {
  key: string;
  url: string;
  filename: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

const DOCUMENT_TYPES: DocumentType[] = [
  {
    key: 'aadhar',
    label: 'Aadhar Card',
    icon: FileText,
    required: true,
    description: 'Upload clear photo of your Aadhar card (both sides)',
    acceptedFormats: 'JPG, PNG, PDF (Max 5MB)'
  },
  {
    key: 'pan',
    label: 'PAN Card',
    icon: CreditCard,
    required: true,
    description: 'Upload clear photo of your PAN card',
    acceptedFormats: 'JPG, PNG, PDF (Max 5MB)'
  },
  {
    key: 'gst_certificate',
    label: 'GST Certificate',
    icon: FileText,
    required: true,
    description: 'Upload your GST registration certificate',
    acceptedFormats: 'JPG, PNG, PDF (Max 5MB)'
  },
  {
    key: 'electricity_bill',
    label: 'Electricity Bill',
    icon: Zap,
    required: true,
    description: 'Upload recent electricity bill (within 3 months)',
    acceptedFormats: 'JPG, PNG, PDF (Max 5MB)'
  },
  {
    key: 'site_photos',
    label: 'Site/Premises Photos',
    icon: Home,
    required: true,
    description: 'Upload 3-5 photos of your property/site',
    acceptedFormats: 'JPG, PNG (Max 5MB each)'
  },
  {
    key: 'owner_photo',
    label: 'Owner Photo',
    icon: User,
    required: true,
    description: 'Upload a clear passport-size photo of the owner',
    acceptedFormats: 'JPG, PNG (Max 2MB)'
  },
  {
    key: 'cancelled_cheque',
    label: 'Cancelled Cheque',
    icon: Building,
    required: true,
    description: 'Upload photo of cancelled cheque or bank statement',
    acceptedFormats: 'JPG, PNG, PDF (Max 5MB)'
  }
];

export const VendorDocumentUpload: React.FC = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);


  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchDocuments();
    }
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await vendorDocumentService.getDocuments();
      if (response.success) {
        setDocuments(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentType: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSize = documentType === 'owner_photo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024; // 2MB for owner photo, 5MB for others

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `File size should be less than ${documentType === 'owner_photo' ? '2MB' : '5MB'}`,
        variant: "destructive"
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPG, PNG, and PDF files are allowed",
        variant: "destructive"
      });
      return;
    }

    setUploading(documentType);
    setUploadProgress({ ...uploadProgress, [documentType]: 0 });

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          [documentType]: Math.min((prev[documentType] || 0) + 10, 90)
        }));
      }, 200);

      const uploadResponse = await uploadService.uploadImage(file);
      
      clearInterval(progressInterval);
      setUploadProgress({ ...uploadProgress, [documentType]: 100 });

      if (uploadResponse.success) {
        const documentData = {
          documentType,
          filename: file.name,
          url: uploadResponse.data.url,
          fileSize: file.size,
          mimeType: file.type
        };

        const saveResponse = await vendorDocumentService.uploadDocument(documentData);
        
        if (saveResponse.success) {
          toast({
            title: "Document uploaded",
            description: "Document uploaded successfully and sent for verification"
          });
          fetchDocuments(); // Refresh the documents list
        } else {
          throw new Error(saveResponse.error);
        }
      } else {
        throw new Error(uploadResponse.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive"
      });
    } finally {
      setUploading(null);
      setUploadProgress({ ...uploadProgress, [documentType]: 0 });
    }
  };

  const handleMultipleFileUpload = async (documentType: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    if (documentType === 'site_photos' && files.length > 5) {
      toast({
        title: "Too many files",
        description: "Maximum 5 photos allowed for site photos",
        variant: "destructive"
      });
      return;
    }

    setUploading(documentType);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress({ ...uploadProgress, [documentType]: (i / files.length) * 100 });
        
        const uploadResponse = await uploadService.uploadImage(file);
        if (uploadResponse.success) {
          uploadedUrls.push(uploadResponse.data.url);
        }
      }

      const documentData = {
        documentType,
        filename: `${files.length} files`,
        url: uploadedUrls.join(','), // Store multiple URLs as comma-separated
        fileSize: Array.from(files).reduce((total, file) => total + file.size, 0),
        mimeType: 'multiple/images'
      };

      const saveResponse = await vendorDocumentService.uploadDocument(documentData);
      
      if (saveResponse.success) {
        toast({
          title: "Documents uploaded",
          description: `${files.length} documents uploaded successfully`
        });
        fetchDocuments();
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload documents",
        variant: "destructive"
      });
    } finally {
      setUploading(null);
      setUploadProgress({ ...uploadProgress, [documentType]: 0 });
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const response = await vendorDocumentService.deleteDocument(documentId);
      if (response.success) {
        toast({
          title: "Document deleted",
          description: "Document deleted successfully"
        });
        fetchDocuments();
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  const getDocumentForType = (documentType: string) => {
    return documents.find(doc => doc.key === documentType);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full"><CheckCircle className="w-3 h-3 mr-1" />Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full"><X className="w-3 h-3 mr-1" />Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full"><Camera className="w-3 h-3 mr-1" />Pending</span>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading documents...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Document Upload Center
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload all required documents for verification. All documents are mandatory for account approval.
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DOCUMENT_TYPES.map((docType) => {
          const uploadedDoc = getDocumentForType(docType.key);
          const Icon = docType.icon;
          const isUploading = uploading === docType.key;
          const progress = uploadProgress[docType.key] || 0;

          return (
            <Card key={docType.key} className={`relative ${uploadedDoc?.status === 'approved' ? 'border-green-200 bg-green-50' : uploadedDoc?.status === 'rejected' ? 'border-red-200 bg-red-50' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{docType.label}</CardTitle>
                    {docType.required && <span className="text-red-500 text-sm">*</span>}
                  </div>
                  {uploadedDoc && getStatusBadge(uploadedDoc.status)}
                </div>
                <p className="text-sm text-muted-foreground">{docType.description}</p>
                <p className="text-xs text-gray-500">{docType.acceptedFormats}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {uploadedDoc ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">{uploadedDoc.filename}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getImageUrl(uploadedDoc.url), '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {/* <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDocument(uploadedDoc.key)}
                        >
                          <X className="h-4 w-4" />
                        </Button> */}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Uploaded on {new Date(uploadedDoc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Icon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-3">
                        {docType.key === 'site_photos' ? 'Click to upload multiple photos' : 'Click to upload document'}
                      </p>
                      
                      <Input
                        type="file"
                        accept={docType.key === 'site_photos' ? 'image/*' : 'image/*,application/pdf'}
                        multiple={docType.key === 'site_photos'}
                        onChange={(e) => {
                          if (docType.key === 'site_photos') {
                            handleMultipleFileUpload(docType.key, e.target.files);
                          } else {
                            handleFileUpload(docType.key, e.target.files);
                          }
                        }}
                        disabled={isUploading}
                        className="hidden"
                        id={`file-${docType.key}`}
                      />
                      
                      <Label
                        htmlFor={`file-${docType.key}`}
                        className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? 'Uploading...' : 'Choose File'}
                      </Label>
                    </div>
                    
                    {isUploading && (
                      <div className="space-y-2">
                        <Progress value={progress} className="w-full" />
                        <p className="text-sm text-center text-gray-600">{progress}% uploaded</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <h3 className="font-medium">Document Verification Status</h3>
            <p className="text-sm text-muted-foreground">
              All documents will be reviewed by our team within 24-48 hours. 
              You will be notified via email once the verification is complete.
            </p>
            <div className="flex justify-center gap-4 text-xs text-gray-500 mt-4">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-600" />
                Approved
              </span>
              <span className="flex items-center gap-1">
                <Camera className="w-3 h-3 text-yellow-600" />
                Pending Review
              </span>
              <span className="flex items-center gap-1">
                <X className="w-3 h-3 text-red-600" />
                Rejected
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};