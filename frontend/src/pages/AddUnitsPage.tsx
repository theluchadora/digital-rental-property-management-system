// pages/owner/AddUnitsPage.tsx - Complete version with all rental and additional fields

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { propertiesApi } from "@/lib/api/properties";
import { uploadPropertyImage } from "@/lib/cloudinary";

interface UnitForm {
  // Unit specific fields
  unitNumber: string;
  floorNumber: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  hasGarage: boolean;
  hasGarden: boolean;
  description: string;
  
  // Pricing / Rental fields
  monthlyRent: string;
  paidEvery: string;
  minLeaseMonth: string;
  latefee: string;
  
  // Additional info
  features: string;
  rules: string;
  notes: string;
  
  // Images
  images: File[];
  previews: string[];
}

export default function AddUnitsPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [units, setUnits] = useState<UnitForm[]>([
    { 
      unitNumber: "", 
      floorNumber: "", 
      bedrooms: "", 
      bathrooms: "", 
      squareFeet: "", 
      hasGarage: false, 
      hasGarden: false, 
      description: "",
      monthlyRent: "",
      paidEvery: "1",
      minLeaseMonth: "12",
      latefee: "50",
      features: "",
      rules: "",
      notes: "",
      images: [], 
      previews: [] 
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addUnit = () => {
    setUnits([...units, { 
      unitNumber: "", 
      floorNumber: "", 
      bedrooms: "", 
      bathrooms: "", 
      squareFeet: "", 
      hasGarage: false, 
      hasGarden: false, 
      description: "",
      monthlyRent: "",
      paidEvery: "1",
      minLeaseMonth: "12",
      latefee: "50",
      features: "",
      rules: "",
      notes: "",
      images: [], 
      previews: [] 
    }]);
  };

  const removeUnit = (index: number) => {
    if (units.length === 1) {
      toast({ title: "Cannot remove", description: "At least one unit is required.", variant: "destructive" });
      return;
    }
    setUnits(units.filter((_, i) => i !== index));
  };

  const updateUnit = (index: number, field: keyof UnitForm, value: any) => {
    const updated = [...units];
    updated[index] = { ...updated[index], [field]: value };
    setUnits(updated);
  };

  const handleImageSelect = (unitIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith("image/"));
    
    const previews: string[] = [];
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === validFiles.length) {
          updateUnit(unitIndex, "images", [...units[unitIndex].images, ...validFiles]);
          updateUnit(unitIndex, "previews", [...units[unitIndex].previews, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (unitIndex: number, imageIndex: number) => {
    const unit = units[unitIndex];
    const newImages = unit.images.filter((_, i) => i !== imageIndex);
    const newPreviews = unit.previews.filter((_, i) => i !== imageIndex);
    updateUnit(unitIndex, "images", newImages);
    updateUnit(unitIndex, "previews", newPreviews);
  };

  const handleSubmit = async () => {
    // Validate required fields for each unit
    for (let i = 0; i < units.length; i++) {
      const unit = units[i];
      if (!unit.unitNumber) {
        toast({ title: "Missing fields", description: `Unit ${i + 1}: Unit number is required.`, variant: "destructive" });
        return;
      }
      if (!unit.bedrooms) {
        toast({ title: "Missing fields", description: `Unit ${i + 1}: Number of bedrooms is required.`, variant: "destructive" });
        return;
      }
      if (!unit.monthlyRent) {
        toast({ title: "Missing fields", description: `Unit ${i + 1}: Monthly rent is required.`, variant: "destructive" });
        return;
      }
      if (!unit.minLeaseMonth) {
        toast({ title: "Missing fields", description: `Unit ${i + 1}: Minimum lease months is required.`, variant: "destructive" });
        return;
      }
      if (!unit.latefee) {
        toast({ title: "Missing fields", description: `Unit ${i + 1}: Late fee is required.`, variant: "destructive" });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      for (let i = 0; i < units.length; i++) {
        const unit = units[i];
        
        // Parse features from comma-separated string to array
        const featuresArray = unit.features 
          ? unit.features.split(",").map(f => f.trim()).filter(f => f)
          : undefined;
        
        const payload = {
          title: `Unit ${unit.unitNumber}`,
          description: unit.description || undefined,
          type: "UNIT" as const,
          hasUnits: false,
          parentId: propertyId,
          // Unit specific
          unitNumber: unit.unitNumber,
          floorNumber: unit.floorNumber ? Number(unit.floorNumber) : undefined,
          bedrooms: Number(unit.bedrooms),
          bathrooms: unit.bathrooms ? Number(unit.bathrooms) : undefined,
          squareFeet: unit.squareFeet ? Number(unit.squareFeet) : undefined,
          hasGarage: unit.hasGarage,
          hasGarden: unit.hasGarden,
          // Pricing / Rental fields
          monthlyRent: Number(unit.monthlyRent),
          paidEvery: Number(unit.paidEvery),
          minLeaseMonth: Number(unit.minLeaseMonth),
          latefee: Number(unit.latefee),
          // Additional info
          features: featuresArray,
          rules: unit.rules || undefined,
          notes: unit.notes || undefined,
          status: "VACANT" as const,
        };

        console.log(`Creating unit ${i + 1}:`, payload);
        const response = await propertiesApi.create(payload);
        const unitId = response.id;

        // Upload images for this unit
        if (unit.images.length > 0) {
          const uploadedUrls: string[] = [];
          for (const file of unit.images) {
            try {
              const imageUrl = await uploadPropertyImage(file, unitId);
              uploadedUrls.push(imageUrl);
            } catch (err) {
              console.error("Failed to upload image:", err);
            }
          }
          
          if (uploadedUrls.length > 0) {
            await propertiesApi.addPhotos(unitId, uploadedUrls);
          }
        }
      }

      toast({ title: "Success", description: `${units.length} unit(s) added successfully!` });
      navigate(`/properties/${propertyId}`);
    } catch (error: any) {
      console.error("Error creating units:", error);
      toast({ 
        title: "Error", 
        description: error.response?.data?.error || error.response?.data?.message || "Failed to create units", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <button onClick={() => navigate(`/properties/${propertyId}`)} className="inline-flex items-center gap-1 text-sm text-secondary hover:underline mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Property
      </button>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Add Rental Units</h1>
        <p className="text-sm text-muted-foreground">Add individual units to your property. Each unit will have its own rental terms.</p>
      </div>

      {units.map((unit, idx) => (
        <Card key={idx} className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Unit {idx + 1}</CardTitle>
            {units.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => removeUnit(idx)} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Unit Details Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-secondary">Unit Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unit Number *</Label>
                  <Input 
                    value={unit.unitNumber} 
                    onChange={(e) => updateUnit(idx, "unitNumber", e.target.value)} 
                    placeholder="e.g. 101, A1, Suite 401" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Floor Number</Label>
                  <Input 
                    type="number" 
                    value={unit.floorNumber} 
                    onChange={(e) => updateUnit(idx, "floorNumber", e.target.value)} 
                    placeholder="e.g. 1" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bedrooms *</Label>
                  <Input 
                    type="number" 
                    value={unit.bedrooms} 
                    onChange={(e) => updateUnit(idx, "bedrooms", e.target.value)} 
                    placeholder="e.g. 2" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bathrooms</Label>
                  <Input 
                    type="number" 
                    step="0.5" 
                    value={unit.bathrooms} 
                    onChange={(e) => updateUnit(idx, "bathrooms", e.target.value)} 
                    placeholder="e.g. 2 or 2.5" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Square Feet</Label>
                  <Input 
                    type="number" 
                    value={unit.squareFeet} 
                    onChange={(e) => updateUnit(idx, "squareFeet", e.target.value)} 
                    placeholder="Area in sq ft" 
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`garage-${idx}`}
                    checked={unit.hasGarage}
                    onCheckedChange={(checked) => updateUnit(idx, "hasGarage", checked === true)}
                  />
                  <label htmlFor={`garage-${idx}`} className="text-sm cursor-pointer">Has Garage</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`garden-${idx}`}
                    checked={unit.hasGarden}
                    onCheckedChange={(checked) => updateUnit(idx, "hasGarden", checked === true)}
                  />
                  <label htmlFor={`garden-${idx}`} className="text-sm cursor-pointer">Has Garden</label>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label>Description</Label>
                <Textarea 
                  value={unit.description} 
                  onChange={(e) => updateUnit(idx, "description", e.target.value)} 
                  placeholder="Describe this unit..." 
                  rows={2} 
                />
              </div>
            </div>

            {/* Rental Information Section */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3 text-secondary">Rental Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Rent ($) *</Label>
                  <Input 
                    type="number" 
                    value={unit.monthlyRent} 
                    onChange={(e) => updateUnit(idx, "monthlyRent", e.target.value)} 
                    placeholder="e.g. 2500" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Frequency (months)</Label>
                  <Input 
                    type="number" 
                    value={unit.paidEvery} 
                    onChange={(e) => updateUnit(idx, "paidEvery", e.target.value)} 
                    placeholder="e.g. 1 (monthly)" 
                  />
                  <p className="text-xs text-muted-foreground">How often rent is collected</p>
                </div>
                <div className="space-y-2">
                  <Label>Minimum Lease (months) *</Label>
                  <Input 
                    type="number" 
                    value={unit.minLeaseMonth} 
                    onChange={(e) => updateUnit(idx, "minLeaseMonth", e.target.value)} 
                    placeholder="e.g. 12" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Late Fee ($) *</Label>
                  <Input 
                    type="number" 
                    value={unit.latefee} 
                    onChange={(e) => updateUnit(idx, "latefee", e.target.value)} 
                    placeholder="e.g. 50" 
                  />
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3 text-secondary">Additional Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Features & Amenities</Label>
                  <Input 
                    value={unit.features} 
                    onChange={(e) => updateUnit(idx, "features", e.target.value)} 
                    placeholder="Comma separated: Pool, Gym, WiFi, AC, Balcony" 
                  />
                  <p className="text-xs text-muted-foreground">Enter features separated by commas</p>
                </div>
                <div className="space-y-2">
                  <Label>Rules & Policies</Label>
                  <Textarea 
                    value={unit.rules} 
                    onChange={(e) => updateUnit(idx, "rules", e.target.value)} 
                    placeholder="Pet policy, smoking policy, noise restrictions, etc." 
                    rows={2} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Internal Notes (Owner only)</Label>
                  <Textarea 
                    value={unit.notes} 
                    onChange={(e) => updateUnit(idx, "notes", e.target.value)} 
                    placeholder="Private notes for your reference" 
                    rows={2} 
                  />
                  <p className="text-xs text-muted-foreground">These notes are only visible to you</p>
                </div>
              </div>
            </div>

            {/* Unit Images Section */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3 text-secondary">Unit Images</h3>
              {unit.previews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {unit.previews.map((preview, imgIdx) => (
                    <div key={imgIdx} className="relative group">
                      <div className="relative aspect-square rounded-lg overflow-hidden border">
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(idx, imgIdx)}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div 
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:border-secondary transition-colors"
                onClick={() => document.getElementById(`unit-images-${idx}`)?.click()}
              >
                <Upload className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">Click to upload images for this unit</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB each. Multiple images allowed.</p>
                <input
                  id={`unit-images-${idx}`}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageSelect(idx, e)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-4 mt-6">
        <Button variant="outline" onClick={addUnit} className="gap-2">
          <Plus className="h-4 w-4" /> Add Another Unit
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save All Units"}
        </Button>
      </div>
    </div>
  );
}