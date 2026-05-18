// pages/owner/AddProperty.tsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Upload, X, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { propertiesApi } from "@/lib/api/properties";
import { uploadPropertyImage } from "@/lib/cloudinary";
import type { PropertyType, FuelType } from "@/types/api";

export default function AddPropertyPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [propertyType, setPropertyType] = useState<PropertyType>("BUILDING");
  const [hasUnits, setHasUnits] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Basic Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"VACANT" | "OCCUPIED" | "MAINTENANCE">("VACANT");

  // Rental Information (only for rentable properties)
  const [monthlyRent, setMonthlyRent] = useState("");
  const [minLeaseMonth, setMinLeaseMonth] = useState("12");
  const [latefee, setLatefee] = useState("");
  const [paidEvery, setPaidEvery] = useState("1");

  // Location (for BUILDING, HOUSE, UNIT - NOT for VEHICLE)
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  // Total Units (for BUILDING and HOUSE with units)
  const [totalUnits, setTotalUnits] = useState("");
  
  // Building specific amenities (only for BUILDING type)
  const [hasElevator, setHasElevator] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [hasGym, setHasGym] = useState(false);
  const [hasPool, setHasPool] = useState(false);
  const [hasSecurity, setHasSecurity] = useState(false);
  const [yearBuilt, setYearBuilt] = useState("");

  // Unit specific (for HOUSE without units OR when directly creating UNIT)
  const [unitNumber, setUnitNumber] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [squareFeet, setSquareFeet] = useState("");
  const [hasGarage, setHasGarage] = useState(false);
  const [hasGarden, setHasGarden] = useState(false);

  // Vehicle specific (only for VEHICLE type)
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => file.type.startsWith("image/"));
    
    setFiles(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Determine if this property is rentable
  const isRentable = () => {
    if (propertyType === "VEHICLE") return true;
    if (propertyType === "UNIT") return true;
    if (propertyType === "HOUSE" && !hasUnits) return true;
    if (propertyType === "BUILDING" && !hasUnits) return true;
    return false;
  };

  // Should show location fields (not for VEHICLE)
  const showLocationFields = propertyType !== "VEHICLE";
  
  // Should show building amenities (only for BUILDING)
  const showBuildingAmenities = propertyType === "BUILDING";
  
  // Should show total units field (for BUILDING OR HOUSE with units)
  const showTotalUnitsField = propertyType === "BUILDING" || (propertyType === "HOUSE" && hasUnits);
  
  // Should show unit-specific fields (for HOUSE without units OR directly creating UNIT)
  const showUnitFields = (propertyType === "HOUSE" && !hasUnits) || propertyType === "UNIT";
  
  // Should show vehicle fields
  const showVehicleFields = propertyType === "VEHICLE";
  
  // Should show hasUnits checkbox (for BUILDING and HOUSE)
  const showHasUnitsCheckbox = propertyType === "BUILDING" || propertyType === "HOUSE";
  
  // Should show rental info (only if rentable)
  const showRentalInfo = isRentable();
  
  // Should show additional info (only if rentable)
  const showAdditionalInfo = isRentable();

  const buildPayload = () => {
    const payload: any = {
      title,
      description: description || undefined,
      type: propertyType,
      status,
      hasUnits: (propertyType === "BUILDING" || propertyType === "HOUSE") ? hasUnits : false,
      minLeaseMonth: Number(minLeaseMonth),
      latefee: latefee ? Number(latefee) : 50,
    };

    // Add rental info only if rentable
    if (isRentable()) {
      if (monthlyRent) payload.monthlyRent = Number(monthlyRent);
      if (paidEvery) payload.paidEvery = Number(paidEvery);
      if (rules) payload.rules = rules;
      if (notes) payload.notes = notes;
      if (features) {
        const featuresArray = features.split(",").map(f => f.trim()).filter(f => f);
        if (featuresArray.length > 0) payload.features = featuresArray;
      }
    }

    // Location (not for VEHICLE)
    if (showLocationFields) {
      if (address) payload.address = address;
      if (city) payload.city = city;
      if (state) payload.state = state;
      if (zipCode) payload.zipCode = zipCode;
    }

    // Total Units for BUILDING or HOUSE with units
    if (showTotalUnitsField && totalUnits) {
      payload.totalUnits = Number(totalUnits);
    }

    // Building amenities (only for BUILDING)
    if (showBuildingAmenities) {
      payload.hasElevator = hasElevator;
      payload.hasParking = hasParking;
      payload.hasGym = hasGym;
      payload.hasPool = hasPool;
      payload.hasSecurity = hasSecurity;
      if (yearBuilt) payload.yearBuilt = Number(yearBuilt);
    }

    // Unit specific (for HOUSE without units or UNIT)
    if (showUnitFields) {
      if (unitNumber) payload.unitNumber = unitNumber;
      if (floorNumber) payload.floorNumber = Number(floorNumber);
      if (bedrooms) payload.bedrooms = Number(bedrooms);
      if (bathrooms) payload.bathrooms = Number(bathrooms);
      if (squareFeet) payload.squareFeet = Number(squareFeet);
      payload.hasGarage = hasGarage;
      payload.hasGarden = hasGarden;
    }

    // Vehicle specific
    if (showVehicleFields) {
      if (plateNumber) payload.plateNumber = plateNumber;
      if (brand) payload.brand = brand;
      if (model) payload.model = model;
      if (year) payload.year = Number(year);
      if (color) payload.color = color;
      if (mileage) payload.mileage = Number(mileage);
      if (fuelType) payload.fuelType = fuelType;
      if (seats) payload.seats = Number(seats);
    }

    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      toast({ title: "Error", description: "Please enter a property title.", variant: "destructive" });
      return;
    }

    if (showLocationFields && !city) {
      toast({ title: "Error", description: "Please enter a city.", variant: "destructive" });
      return;
    }

    if (isRentable() && !monthlyRent) {
      toast({ title: "Error", description: "Please enter monthly rent for rentable property.", variant: "destructive" });
      return;
    }

    // Validate total units for Building or House with units
    if (showTotalUnitsField && !totalUnits) {
      toast({ title: "Error", description: "Please enter total number of units.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = buildPayload();
      const response = await propertiesApi.create(payload);
      
      let propertyId = null;
      if (response.id) {
        propertyId = response.id;
      } else if (response.data && response.data.id) {
        propertyId = response.data.id;
      }
      
      if (!propertyId) {
        throw new Error("Could not get property ID from response");
      }

      // Upload images
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          try {
            await uploadPropertyImage(files[i], propertyId);
            await propertiesApi.uploadPhoto(propertyId, files[i]);
          } catch (uploadErr) {
            console.error(`Failed to upload image ${i + 1}:`, uploadErr);
          }
        }
      }

      toast({ title: "Success", description: "Property created successfully!" });
      
      if ((propertyType === "BUILDING" || propertyType === "HOUSE") && hasUnits) {
        navigate(`/properties/${propertyId}/add-units`);
      } else {
        navigate(`/properties/${propertyId}`);
      }
    } catch (error: any) {
      console.error("Create property error:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message ||
                          "Failed to create property";
      
      toast({
        title: "Unable to create property",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <button onClick={() => navigate("/properties")} className="inline-flex items-center gap-1 text-sm text-secondary hover:underline mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Properties
      </button>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Add New Property</h1>
        <p className="text-sm text-muted-foreground">Register a new asset to your portfolio</p>
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
                  <Input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="e.g. The Glass Pavilion" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Describe the property..." 
                    rows={3} 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Property Type *</Label>
                    <Select value={propertyType} onValueChange={(value: PropertyType) => {
                      setPropertyType(value);
                      if (value === "VEHICLE") setHasUnits(false);
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUILDING">Building (Apartment Complex)</SelectItem>
                        <SelectItem value="HOUSE">House (Single Family)</SelectItem>
                        <SelectItem value="VEHICLE">Vehicle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isRentable() && (
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
                </div>

                {showHasUnitsCheckbox && (
                  <div className="flex items-center gap-2 pt-2">
                    <Checkbox 
                      id="hasUnits" 
                      checked={hasUnits} 
                      onCheckedChange={(checked) => setHasUnits(checked === true)}
                    />
                    <label htmlFor="hasUnits" className="text-sm cursor-pointer">
                      This property contains multiple rental units
                    </label>
                  </div>
                )}

                {hasUnits && (propertyType === "BUILDING" || propertyType === "HOUSE") && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <p className="text-muted-foreground">
                      {propertyType === "BUILDING" 
                        ? "This building contains multiple units. The building itself won't be rentable - you'll add individual units after creation."
                        : "This house contains multiple units (e.g., basement apartment). The main house won't be rentable - you'll add individual units after creation."}
                    </p>
                  </div>
                )}

                {!hasUnits && propertyType === "HOUSE" && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <p className="text-muted-foreground">
                      This house will be rented as a whole unit. You can add details like bedrooms and bathrooms below.
                    </p>
                  </div>
                )}

                {!hasUnits && propertyType === "BUILDING" && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <p className="text-muted-foreground">
                      This building will be rented as a single unit. Add building details and rental information below.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location */}
            {showLocationFields && (
              <Card>
                <CardHeader><CardTitle>Location</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)} 
                      placeholder="Street address" 
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>City *</Label>
                      <Input 
                        value={city} 
                        onChange={(e) => setCity(e.target.value)} 
                        placeholder="e.g. Addis Ababa" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State/Region</Label>
                      <Input 
                        value={state} 
                        onChange={(e) => setState(e.target.value)} 
                        placeholder="Optional" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Zip Code</Label>
                      <Input 
                        value={zipCode} 
                        onChange={(e) => setZipCode(e.target.value)} 
                        placeholder="Optional" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Total Units Field - For BUILDING or HOUSE with units */}
            {showTotalUnitsField && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {propertyType === "BUILDING" ? "Building Details" : "Property Details"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Total Units *</Label>
                    <Input 
                      type="number" 
                      value={totalUnits} 
                      onChange={(e) => setTotalUnits(e.target.value)} 
                      placeholder="Number of units" 
                      min={1}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {propertyType === "BUILDING" 
                        ? "Total number of apartments/units in this building"
                        : "Total number of units in this property (e.g., main house + basement apartment = 2 units)"}
                    </p>
                  </div>

                  {/* Year Built for BUILDING only */}
                  {propertyType === "BUILDING" && (
                    <div className="space-y-2">
                      <Label>Year Built</Label>
                      <Input 
                        type="number" 
                        value={yearBuilt} 
                        onChange={(e) => setYearBuilt(e.target.value)} 
                        placeholder="e.g. 2020" 
                        min={1900} 
                      />
                    </div>
                  )}

                  {/* Building amenities - ONLY for BUILDING type */}
                  {showBuildingAmenities && (
                    <div className="flex flex-wrap gap-4 pt-2">
                      {[
                        { id: "elevator", label: "Has Elevator", checked: hasElevator, set: setHasElevator },
                        { id: "parking", label: "Has Parking", checked: hasParking, set: setHasParking },
                        { id: "gym", label: "Has Gym", checked: hasGym, set: setHasGym },
                        { id: "pool", label: "Has Pool", checked: hasPool, set: setHasPool },
                        { id: "security", label: "Has Security", checked: hasSecurity, set: setHasSecurity },
                      ].map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <Checkbox
                            id={item.id}
                            checked={item.checked}
                            onCheckedChange={(checked) => item.set(checked === true)}
                          />
                          <label htmlFor={item.id} className="text-sm">{item.label}</label>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* House Details (when rented as a whole - without units) */}
            {showUnitFields && propertyType === "HOUSE" && !hasUnits && (
              <Card>
                <CardHeader>
                  <CardTitle>House Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bedrooms *</Label>
                      <Input 
                        type="number" 
                        value={bedrooms} 
                        onChange={(e) => setBedrooms(e.target.value)} 
                        placeholder="Number of bedrooms" 
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bathrooms</Label>
                      <Input 
                        type="number" 
                        step="0.5" 
                        value={bathrooms} 
                        onChange={(e) => setBathrooms(e.target.value)} 
                        placeholder="e.g. 2 or 2.5" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Square Feet</Label>
                      <Input 
                        type="number" 
                        value={squareFeet} 
                        onChange={(e) => setSquareFeet(e.target.value)} 
                        placeholder="Area in sq ft" 
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="garage"
                        checked={hasGarage}
                        onCheckedChange={(checked) => setHasGarage(checked === true)}
                      />
                      <label htmlFor="garage" className="text-sm">Has Garage</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="garden"
                        checked={hasGarden}
                        onCheckedChange={(checked) => setHasGarden(checked === true)}
                      />
                      <label htmlFor="garden" className="text-sm">Has Garden</label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Unit Details (for UNIT type only) */}
            {propertyType === "UNIT" && (
              <Card>
                <CardHeader>
                  <CardTitle>Unit Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Unit Number</Label>
                      <Input 
                        value={unitNumber} 
                        onChange={(e) => setUnitNumber(e.target.value)} 
                        placeholder="e.g. 401" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Floor Number</Label>
                      <Input 
                        type="number" 
                        value={floorNumber} 
                        onChange={(e) => setFloorNumber(e.target.value)} 
                        placeholder="e.g. 4" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bedrooms *</Label>
                      <Input 
                        type="number" 
                        value={bedrooms} 
                        onChange={(e) => setBedrooms(e.target.value)} 
                        placeholder="Number of bedrooms" 
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bathrooms</Label>
                      <Input 
                        type="number" 
                        step="0.5" 
                        value={bathrooms} 
                        onChange={(e) => setBathrooms(e.target.value)} 
                        placeholder="e.g. 2 or 2.5" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Square Feet</Label>
                      <Input 
                        type="number" 
                        value={squareFeet} 
                        onChange={(e) => setSquareFeet(e.target.value)} 
                        placeholder="Area in sq ft" 
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="garage"
                        checked={hasGarage}
                        onCheckedChange={(checked) => setHasGarage(checked === true)}
                      />
                      <label htmlFor="garage" className="text-sm">Has Garage</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="garden"
                        checked={hasGarden}
                        onCheckedChange={(checked) => setHasGarden(checked === true)}
                      />
                      <label htmlFor="garden" className="text-sm">Has Garden</label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vehicle Specific Fields */}
            {showVehicleFields && (
              <Card>
                <CardHeader><CardTitle>Vehicle Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Plate Number *</Label>
                      <Input 
                        value={plateNumber} 
                        onChange={(e) => setPlateNumber(e.target.value)} 
                        placeholder="e.g. AA-12345" 
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input 
                        value={brand} 
                        onChange={(e) => setBrand(e.target.value)} 
                        placeholder="e.g. Toyota" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Input 
                        value={model} 
                        onChange={(e) => setModel(e.target.value)} 
                        placeholder="e.g. Corolla" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input 
                        type="number" 
                        value={year} 
                        onChange={(e) => setYear(e.target.value)} 
                        placeholder="e.g. 2022" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Input 
                        value={color} 
                        onChange={(e) => setColor(e.target.value)} 
                        placeholder="e.g. White" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mileage (km)</Label>
                      <Input 
                        type="number" 
                        value={mileage} 
                        onChange={(e) => setMileage(e.target.value)} 
                        placeholder="e.g. 23000" 
                      />
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
                      <Input 
                        type="number" 
                        value={seats} 
                        onChange={(e) => setSeats(e.target.value)} 
                        placeholder="Number of seats" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rental Information - ONLY for rentable properties */}
            {showRentalInfo && (
              <Card>
                <CardHeader><CardTitle>Rental Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Monthly Rent ($) *</Label>
                      <Input 
                        type="number" 
                        value={monthlyRent} 
                        onChange={(e) => setMonthlyRent(e.target.value)} 
                        placeholder="e.g. 2500" 
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Lease (months)</Label>
                      <Input 
                        type="number" 
                        value={minLeaseMonth} 
                        onChange={(e) => setMinLeaseMonth(e.target.value)} 
                        placeholder="e.g. 12" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Late Fee ($)</Label>
                      <Input 
                        type="number" 
                        value={latefee} 
                        onChange={(e) => setLatefee(e.target.value)} 
                        placeholder="e.g. 50" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Frequency (months)</Label>
                      <Input 
                        type="number" 
                        value={paidEvery} 
                        onChange={(e) => setPaidEvery(e.target.value)} 
                        placeholder="e.g. 1 (monthly)" 
                      />
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
                    <Input 
                      value={features} 
                      onChange={(e) => setFeatures(e.target.value)} 
                      placeholder="Comma separated: Pool, Gym, WiFi, AC" 
                    />
                    <p className="text-xs text-muted-foreground">Enter features separated by commas</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Rules & Policies</Label>
                    <Textarea 
                      value={rules} 
                      onChange={(e) => setRules(e.target.value)} 
                      placeholder="Pet policy, smoking policy, etc." 
                      rows={2} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Internal Notes</Label>
                    <Textarea 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      placeholder="Private notes for your reference" 
                      rows={2} 
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Image Upload */}
            <Card>
              <CardHeader><CardTitle>Property Images</CardTitle></CardHeader>
              <CardContent>
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {imagePreviews.map((preview, idx) => (
                      <div key={idx} className="relative group">
                        <div className="relative aspect-square rounded-lg overflow-hidden border border-border">
                          <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div 
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 cursor-pointer hover:border-secondary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-10 w-10 mb-3 opacity-50" />
                  <p className="text-sm font-medium">Click to upload images</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB each. Multiple images allowed.</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
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
                      Creating...
                    </>
                  ) : (
                    "Create Property"
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => navigate("/properties")}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Property Type Guide</CardTitle></CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-3">
                <div>
                  <p className="font-semibold text-foreground mb-1">🏢 Building with Units</p>
                  <p>Check "has units" - Add total units. Building NOT rentable.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">🏢 Building without Units</p>
                  <p>Uncheck "has units" - Building IS rentable as a single unit.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">🏠 House with Units</p>
                  <p>Check "has units" - Add total units. House NOT rentable.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">🏠 House without Units</p>
                  <p>Uncheck "has units" - House IS rentable as a whole.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">🚗 Vehicle</p>
                  <p>Always rentable. No location needed.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}