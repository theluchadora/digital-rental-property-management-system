// pages/owner/UnitDetailPage.tsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Edit, ChevronLeft, Bed, Bath, Maximize, DollarSign, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { propertiesApi } from "@/lib/api/properties";
import type { Property } from "@/types/api";

export default function UnitDetailPage() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [unit, setUnit] = useState<Property | null>(null);
  const [parentProperty, setParentProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!unitId) return;
      
      setIsLoading(true);
      try {
        const unitResponse = await propertiesApi.getById(unitId);
        const unitData: Property | null = unitResponse.data || null;
        
        if (unitData) {
          setUnit(unitData);
          
          // Load parent property if exists
          if (unitData.parentId) {
            const parentResponse = await propertiesApi.getById(unitData.parentId);
            const parentData: Property | null = parentResponse.data || null;
            setParentProperty(parentData);
          }
        }
      } catch (err) {
        console.error("Failed to load unit:", err);
        toast({ title: "Error", description: "Failed to load unit details", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [unitId, toast]);

  const handleStatusChange = async (newStatus: string) => {
    if (!unit) return;
    
    setUpdatingStatus(true);
    try {
      await propertiesApi.update(unit.id, { status: newStatus as any });
      setUnit({ ...unit, status: newStatus as any });
      toast({ title: "Success", description: "Unit status updated!" });
    } catch (err: any) {
      console.error("Failed to update status:", err);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Unit not found.</p>
        <Link to="/properties" className="text-secondary hover:underline">Back to Properties</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <button 
        onClick={() => navigate(parentProperty ? `/properties/${parentProperty.id}` : "/properties")} 
        className="inline-flex items-center gap-1 text-sm text-secondary hover:underline mb-4"
      >
        <ChevronLeft className="h-4 w-4" /> 
        Back to {parentProperty ? parentProperty.title : "Properties"}
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <Badge className="mb-2 bg-secondary text-secondary-foreground">Unit</Badge>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {unit.unitNumber}
          </h1>
          {parentProperty && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {parentProperty.title}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/properties/${unit.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs uppercase text-muted-foreground">Unit Status</p>
              <div className="mt-2">
                <Select 
                  value={unit.status || "VACANT"} 
                  onValueChange={handleStatusChange}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VACANT">Vacant</SelectItem>
                    <SelectItem value="OCCUPIED">Occupied</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unit Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Unit Specifications</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit Number</span>
              <span className="font-semibold">{unit.unitNumber}</span>
            </div>
            {unit.floorNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Floor</span>
                <span className="font-semibold">{unit.floorNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bedrooms</span>
              <span className="font-semibold">{unit.bedrooms}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bathrooms</span>
              <span className="font-semibold">{unit.bathrooms}</span>
            </div>
            {unit.squareFeet && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Square Feet</span>
                <span className="font-semibold">{unit.squareFeet} sq ft</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Has Garage</span>
              <span className="font-semibold">{unit.hasGarage ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Has Garden</span>
              <span className="font-semibold">{unit.hasGarden ? "Yes" : "No"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Rental Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Rent</span>
              <span className="font-bold text-secondary">${unit.monthlyRent?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Minimum Lease</span>
              <span>{unit.minLeaseMonth} months</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Late Fee</span>
              <span>${unit.latefee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Frequency</span>
              <span>Every {unit.paidEvery} month(s)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {unit.description && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Description</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{unit.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Features */}
      {unit.features && unit.features.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Amenities & Features</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(unit.features) && unit.features.map((feature: string, i: number) => (
                <Badge key={i} variant="outline">{feature}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules */}
      {unit.rules && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Rules & Policies</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{unit.rules}</p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {unit.notes && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Internal Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{unit.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}