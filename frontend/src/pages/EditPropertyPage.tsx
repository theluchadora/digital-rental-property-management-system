import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Upload, X, ImageIcon, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { propertiesApi } from "@/lib/api/properties";
import { photosApi } from "@/lib/api/photos"; // ADD THIS IMPORT
import { uploadPropertyImage } from "@/lib/cloudinary";
import type { Property, PropertyType, FuelType } from "@/types/api";

export default function EditPropertyPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<any[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"VACANT" | "OCCUPIED" | "MAINTENANCE">("VACANT");
  const [hasUnits, setHasUnits] = useState(false);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  
  // Rental info (only for rentable properties - those WITHOUT units)
  const [monthlyRent, setMonthlyRent] = useState("");
  const [minLeaseMonth, setMinLeaseMonth] = useState("12");
  const [latefee, setLatefee] = useState("");
  const [paidEvery, setPaidEvery] = useState("1");
  
  // Building specific
  const [totalUnits, setTotalUnits] = useState("");
  const [hasElevator, setHasElevator] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [hasGym, setHasGym] = useState(false);
  const [hasPool, setHasPool] = useState(false);
  const [hasSecurity, setHasSecurity] = useState(false);
  const [yearBuilt, setYearBuilt] = useState("");
  
  // Unit specific (only for HOUSE without units or UNIT type)
  const [unitNumber, setUnitNumber] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [squareFeet, setSquareFeet] = useState("");
  const [hasGarage, setHasGarage] = useState(false);
  const [hasGarden, setHasGarden] = useState(false);
  
  // Vehicle specific
  const [plateNumber, setPlateNumber] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [mileage, setMileage] = useState("");
  const [fuelType, setFuelType] = useState<FuelType>("PETROL");
  const [seats, setSeats] = useState("");
  
  // Additional info (only for rentable properties)
  const [rules, setRules] = useState("");
  const [notes, setNotes] = useState("");
  const [features, setFeatures] = useState("");

  useEffect(() => {
    async function loadProperty() {
        if (!propertyId) return;
        
        setIsLoading(true);
        try {
        const response = await propertiesApi.getById(propertyId);
        let prop: Property | null = null;
        
        if (response.data?.property) {
            prop = response.data.property;
        } else if (response.data?.id) {
            prop = response.data;
        } else if (response?.id) {
            prop = response;
        }
        
        if (prop) {
            setProperty(prop);
            setTitle(prop.title || "");
            setDescription(prop.description || "");
            setStatus(prop.status || "VACANT");
            setHasUnits(prop.hasUnits || false);
            setAddress(prop.address || "");
            setCity(prop.city || "");
            setState(prop.state || "");
            setZipCode(prop.zipCode || "");
            setMonthlyRent(prop.monthlyRent?.toString() || "");
            setMinLeaseMonth(prop.minLeaseMonth?.toString() || "12");
            setLatefee(prop.latefee?.toString() || "");
            setPaidEvery(prop.paidEvery?.toString() || "1");
            setTotalUnits(prop.totalUnits?.toString() || "");
            setHasElevator(prop.hasElevator || false);
            setHasParking(prop.hasParking || false);
            setHasGym(prop.hasGym || false);
            setHasPool(prop.hasPool || false);
            setHasSecurity(prop.hasSecurity || false);
            setYearBuilt(prop.yearBuilt?.toString() || "");
            setUnitNumber(prop.unitNumber || "");
            setFloorNumber(prop.floorNumber?.toString() || "");
            setBedrooms(prop.bedrooms?.toString() || "");
            setBathrooms(prop.bathrooms?.toString() || "");
            setSquareFeet(prop.squareFeet?.toString() || "");
            setHasGarage(prop.hasGarage || false);
            setHasGarden(prop.hasGarden || false);
            setPlateNumber(prop.plateNumber || "");
            setBrand(prop.brand || "");
            setModel(prop.model || "");
            setYear(prop.year?.toString() || "");
            setColor(prop.color || "");
            setMileage(prop.mileage?.toString() || "");
            setFuelType(prop.fuelType || "PETROL");
            setSeats(prop.seats?.toString() || "");
            setRules(prop.rules || "");
            setNotes(prop.notes || "");
            
            if (prop.features && Array.isArray(prop.features)) {
            setFeatures(prop.features.join(", "));
            }
            
            // ADD THIS: Fetch photos separately
            try {
            const photosResponse = await photosApi.getByProperty(propertyId);
            if (photosResponse && photosResponse.data) {
                setExistingPhotos(photosResponse.data);
            } else if (photosResponse && Array.isArray(photosResponse)) {
                setExistingPhotos(photosResponse);
            } else {
                setExistingPhotos(prop.photos || []);
            }
            } catch (photoErr) {
            console.error("Failed to load photos:", photoErr);
            setExistingPhotos(prop.photos || []);
            }
        }
        } catch (err) {
        console.error("Failed to load property:", err);
        toast({ title: "Error", description: "Failed to load property", variant: "destructive" });
        } finally {
        setIsLoading(false);
        }
    }
    
    loadProperty();
    }, [propertyId, toast]);

  const handleNewImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => file.type.startsWith("image/"));
    
    setNewFiles(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingPhoto = (photoId: string) => {
    setPhotosToDelete(prev => [...prev, photoId]);
    setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const removeNewImage = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Determine if the property is rentable (does NOT have units)
  const isRentable = () => {
    if (!property) return false;
    // Vehicle is always rentable
    if (property.type === "VEHICLE") return true;
    // Building with units is NOT rentable
    if (property.type === "BUILDING" && hasUnits) return false;
    // House with units is NOT rentable
    if (property.type === "HOUSE" && hasUnits) return false;
    // UNIT type is always rentable
    if (property.type === "UNIT") return true;
    // Default: rentable if no units
    return !hasUnits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      const updatePayload: any = {
        title,
        description: description || undefined,
        status,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        zipCode: zipCode || undefined,
        minLeaseMonth: Number(minLeaseMonth),
      };
      
      // Only include rental info if property is rentable
      if (isRentable()) {
        updatePayload.monthlyRent = monthlyRent ? Number(monthlyRent) : undefined;
        updatePayload.latefee = latefee ? Number(latefee) : undefined;
        updatePayload.paidEvery = paidEvery ? Number(paidEvery) : undefined;
        updatePayload.rules = rules || undefined;
        updatePayload.notes = notes || undefined;
        updatePayload.features = features ? features.split(",").map(f => f.trim()) : undefined;
      }
      
      // Building specific (always show for BUILDING type)
      if (property?.type === "BUILDING") {
        updatePayload.totalUnits = totalUnits ? Number(totalUnits) : undefined;
        updatePayload.hasElevator = hasElevator;
        updatePayload.hasParking = hasParking;
        updatePayload.hasGym = hasGym;
        updatePayload.hasPool = hasPool;
        updatePayload.hasSecurity = hasSecurity;
        updatePayload.yearBuilt = yearBuilt ? Number(yearBuilt) : undefined;
      }
      
      // Unit specific - ONLY for UNIT type OR HOUSE without units
      if (property?.type === "UNIT" || (property?.type === "HOUSE" && !hasUnits)) {
        updatePayload.unitNumber = unitNumber || undefined;
        updatePayload.floorNumber = floorNumber ? Number(floorNumber) : undefined;
        updatePayload.bedrooms = bedrooms ? Number(bedrooms) : undefined;
        updatePayload.bathrooms = bathrooms ? Number(bathrooms) : undefined;
        updatePayload.squareFeet = squareFeet ? Number(squareFeet) : undefined;
        updatePayload.hasGarage = hasGarage;
        updatePayload.hasGarden = hasGarden;
      }
      
      // Vehicle specific
      if (property?.type === "VEHICLE") {
        updatePayload.plateNumber = plateNumber || undefined;
        updatePayload.brand = brand || undefined;
        updatePayload.model = model || undefined;
        updatePayload.year = year ? Number(year) : undefined;
        updatePayload.color = color || undefined;
        updatePayload.mileage = mileage ? Number(mileage) : undefined;
        updatePayload.fuelType = fuelType;
        updatePayload.seats = seats ? Number(seats) : undefined;
      }
      
      await propertiesApi.update(propertyId!, updatePayload);
      
      // Delete removed photos - USING PHOTOS API
      for (const photoId of photosToDelete) {
        try {
          await photosApi.delete(photoId); // CHANGED to photosApi
        } catch (err) {
          console.error("Failed to delete photo:", err);
        }
      }
      
      // Upload new photos - USING PHOTOS API
      if (newFiles.length > 0 && propertyId) {
        for (const file of newFiles) {
          try {
            const imageUrl = await uploadPropertyImage(file, propertyId);
            await photosApi.upload(propertyId, imageUrl); // CHANGED to photosApi.upload
          } catch (err) {
            console.error("Failed to upload image:", err);
          }
        }
      }
      
      toast({ title: "Success", description: "Property updated successfully!" });
      navigate(`/properties/${propertyId}`);
    } catch (err: any) {
      console.error("Failed to update property:", err);
      toast({ 
        title: "Error", 
        description: err.response?.data?.error || "Failed to update property", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Property not found.</p>
        <Button variant="link" onClick={() => navigate("/properties")}>Back to Properties</Button>
      </div>
    );
  }

  const isVehicle = property.type === "VEHICLE";
  const isBuilding = property.type === "BUILDING";
  const isUnit = property.type === "UNIT";
  const isHouse = property.type === "HOUSE";
  const rentable = isRentable();

  // Show unit fields only for UNIT type OR House without units
  const showUnitFields = isUnit || (isHouse && !hasUnits);
  
  // Show rental info only if rentable
  const showRentalInfo = rentable;
  
  // Show additional info only if rentable
  const showAdditionalInfo = rentable;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <button onClick={() => navigate(`/properties/${propertyId}`)} className="inline-flex items-center gap-1 text-sm text-secondary hover:underline mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Property
      </button>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Edit Property</h1>
        <p className="text-sm text-muted-foreground">Update your property information</p>
        {hasUnits && (isBuilding || isHouse) && (
          <p className="text-sm text-secondary mt-2">
            ⚠️ This property contains units. The property itself is not rentable - rental information applies to individual units.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                <Label>Property Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                
                <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                </div>

                {/* Only show status field for rentable properties */}
                {rentable && (
                <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="VACANT">Vacant</SelectItem>
                        <SelectItem value="OCCUPIED">Occupied</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                )}

                {/* Show hasUnits info but make it read-only */}
                {(isBuilding || isHouse) && (
                <div className="rounded-md bg-muted p-3">
                    <p className="text-sm">
                    <span className="font-semibold">Has Units:</span> {hasUnits ? "Yes" : "No"}
                    {hasUnits && " - This property contains individual rental units (not rentable itself)"}
                    </p>
                </div>
                )}
            </CardContent>
            </Card>

            {/* Location (not for vehicles) */}
            {!isVehicle && (
              <Card>
                <CardHeader><CardTitle>Location</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>State/Region</Label>
                      <Input value={state} onChange={(e) => setState(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Zip Code</Label>
                      <Input value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Building Specific - ALWAYS show for BUILDING type regardless of hasUnits */}
            {isBuilding && (
              <Card>
                <CardHeader><CardTitle>Building Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Total Units</Label>
                      <Input type="number" value={totalUnits} onChange={(e) => setTotalUnits(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Year Built</Label>
                      <Input type="number" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { id: "elevator", label: "Has Elevator", checked: hasElevator, set: setHasElevator },
                      { id: "parking", label: "Has Parking", checked: hasParking, set: setHasParking },
                      { id: "gym", label: "Has Gym", checked: hasGym, set: setHasGym },
                      { id: "pool", label: "Has Pool", checked: hasPool, set: setHasPool },
                      { id: "security", label: "Has Security", checked: hasSecurity, set: setHasSecurity },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <Checkbox id={item.id} checked={item.checked} onCheckedChange={(checked) => item.set(checked === true)} />
                        <label htmlFor={item.id} className="text-sm">{item.label}</label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Unit/House Specific - ONLY for UNIT type OR House WITHOUT units */}
            {showUnitFields && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isHouse ? "House Details" : "Unit Details"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isUnit && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Unit Number</Label>
                        <Input value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Floor Number</Label>
                        <Input type="number" value={floorNumber} onChange={(e) => setFloorNumber(e.target.value)} />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bedrooms</Label>
                      <Input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Bathrooms</Label>
                      <Input type="number" step="0.5" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Square Feet</Label>
                      <Input type="number" value={squareFeet} onChange={(e) => setSquareFeet(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { id: "garage", label: "Has Garage", checked: hasGarage, set: setHasGarage },
                      { id: "garden", label: "Has Garden", checked: hasGarden, set: setHasGarden },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <Checkbox id={item.id} checked={item.checked} onCheckedChange={(checked) => item.set(checked === true)} />
                        <label htmlFor={item.id} className="text-sm">{item.label}</label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vehicle Specific */}
            {isVehicle && (
              <Card>
                <CardHeader><CardTitle>Vehicle Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Plate Number</Label>
                      <Input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Input value={model} onChange={(e) => setModel(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Input value={color} onChange={(e) => setColor(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Mileage</Label>
                      <Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Fuel Type</Label>
                      <Select value={fuelType} onValueChange={(value: FuelType) => setFuelType(value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PETROL">Petrol</SelectItem>
                          <SelectItem value="DIESEL">Diesel</SelectItem>
                          <SelectItem value="ELECTRIC">Electric</SelectItem>
                          <SelectItem value="HYBRID">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Seats</Label>
                      <Input type="number" value={seats} onChange={(e) => setSeats(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rental Information - ONLY for rentable properties (those WITHOUT units) */}
            {showRentalInfo && (
              <Card>
                <CardHeader><CardTitle>Rental Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Monthly Rent ($)</Label>
                      <Input type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Lease (months)</Label>
                      <Input type="number" value={minLeaseMonth} onChange={(e) => setMinLeaseMonth(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Late Fee ($)</Label>
                      <Input type="number" value={latefee} onChange={(e) => setLatefee(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Frequency (months)</Label>
                      <Input type="number" value={paidEvery} onChange={(e) => setPaidEvery(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Information - ONLY for rentable properties */}
            {showAdditionalInfo && (
              <Card>
                <CardHeader><CardTitle>Additional Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Features/Amenities</Label>
                    <Input value={features} onChange={(e) => setFeatures(e.target.value)} placeholder="Comma separated: Pool, Gym, WiFi" />
                  </div>
                  <div className="space-y-2">
                    <Label>Rules & Policies</Label>
                    <Textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Internal Notes</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Photos Management */}
            <Card>
              <CardHeader><CardTitle>Property Images</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {existingPhotos.length > 0 && (
                  <div>
                    <Label>Current Images</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                      {existingPhotos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <div className="relative aspect-square rounded-lg overflow-hidden border">
                            <img src={photo.url} alt="Property" className="w-full h-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExistingPhoto(photo.id)}
                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {newImagePreviews.length > 0 && (
                  <div>
                    <Label>New Images to Add</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                      {newImagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative group">
                          <div className="relative aspect-square rounded-lg overflow-hidden border">
                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeNewImage(idx)}
                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div 
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:border-secondary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Click to add more images</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB each</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleNewImageSelect}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <Button 
                  disabled={isSubmitting} 
                  type="submit" 
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => navigate(`/properties/${propertyId}`)}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Info Card for properties with units */}
            {hasUnits && (isBuilding || isHouse) && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Property Type Note</CardTitle></CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  <p>This property contains individual rental units.</p>
                  <p className="mt-2">The property itself is not rentable. Rental terms apply to each unit separately.</p>
                  <p className="mt-2">You can manage units from the property details page.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}