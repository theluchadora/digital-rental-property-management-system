import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Edit, Plus, ChevronLeft, Building2, DollarSign, Bed, Bath, Car, Gauge, Loader2, Image, ChevronRight, X, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { propertiesApi } from "@/lib/api/properties";
import { photosApi } from "@/lib/api/photos";
import type { Property } from "@/types/api";

export default function PropertyDetailPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Property[]>([]);
  const [propertyPhotos, setPropertyPhotos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!propertyId) return;
      
      setIsLoading(true);
      try {
        const propResponse = await propertiesApi.getById(propertyId);
        
        let propertyData: Property | null = null;
        if (propResponse.data?.property) {
          propertyData = propResponse.data.property;
        } else if (propResponse.data?.data?.property) {
          propertyData = propResponse.data.data.property;
        } else if (propResponse.data?.id) {
          propertyData = propResponse.data;
        } else if (propResponse?.id) {
          propertyData = propResponse;
        }
        
        if (!propertyData) {
          toast({ title: "Error", description: "Failed to load property data", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        
        setProperty(propertyData);
        
        // Fetch photos
        let photos = [];
        try {
          const photosResponse = await photosApi.getByProperty(propertyId);
          if (photosResponse?.data && Array.isArray(photosResponse.data)) {
            photos = photosResponse.data;
          } else if (photosResponse && Array.isArray(photosResponse)) {
            photos = photosResponse;
          } else if (propertyData.photos && Array.isArray(propertyData.photos)) {
            photos = propertyData.photos.map((photo, index) => {
              if (typeof photo === 'string') {
                return { id: `photo-${index}`, url: photo, propertyId: propertyId };
              }
              return photo;
            });
          }
        } catch (photoErr) {
          if (propertyData.photos && Array.isArray(propertyData.photos)) {
            photos = propertyData.photos.map((photo, index) => {
              if (typeof photo === 'string') {
                return { id: `photo-${index}`, url: photo, propertyId: propertyId };
              }
              return photo;
            });
          }
        }
        
        setPropertyPhotos(photos);
        
        // Get units if property has units
        if (propertyData.hasUnits) {
          const unitsResponse = await propertiesApi.getUnits(propertyId);
          let unitsData: Property[] = [];
          if (Array.isArray(unitsResponse.data)) {
            unitsData = unitsResponse.data;
          } else if (unitsResponse.data?.units) {
            unitsData = unitsResponse.data.units;
          } else if (Array.isArray(unitsResponse)) {
            unitsData = unitsResponse;
          }
          setUnits(unitsData);
        }
      } catch (err) {
        console.error("Failed to load property:", err);
        toast({ title: "Error", description: "Failed to load property details", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [propertyId, toast]);

  const openLightbox = (index: number) => {
    setSelectedPhotoIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedPhotoIndex(null);
    document.body.style.overflow = 'auto';
  };

  const nextPhoto = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < propertyPhotos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex !== null) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextPhoto();
        if (e.key === 'ArrowLeft') prevPhoto();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, propertyPhotos.length]);

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
        <p className="text-muted-foreground mb-4">Property not found.</p>
        <Link to="/properties" className="text-secondary hover:underline">Back to Properties</Link>
      </div>
    );
  }

  const hasUnitsInside = property.hasUnits === true;
  const isVehicle = property.type === "VEHICLE";
  const displayPhotos = propertyPhotos.length > 0 ? propertyPhotos : 
    (property.photos?.map((p, i) => ({ id: `photo-${i}`, url: p, propertyId })) || []);

  // Get first 4 photos for grid display
  const firstFourPhotos = displayPhotos.slice(0, 4);
  const remainingCount = displayPhotos.length - 4;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      {/* Back button */}
      <Link to="/properties" className="inline-flex items-center gap-1 text-sm text-secondary hover:underline mb-4">
        <ChevronLeft className="h-4 w-4" /> Back to Properties
      </Link>

      {/* Header with title and action buttons */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-secondary text-secondary-foreground">
              {property.type} {hasUnitsInside && "• Multi-Unit"}
            </Badge>
            <Badge variant={property.status === "VACANT" ? "default" : "secondary"} className="text-xs">
              {property.status || "VACANT"}
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{property.title}</h1>
          {property.address && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {property.address}, {property.city}
            </p>
          )}
        </div>
        <div className="flex gap-2 lg:flex-col xl:flex-row">
          <Button variant="outline" size="sm" onClick={() => navigate(`/properties/${propertyId}/edit`)}>
            <Edit className="mr-2 h-4 w-4" /> Edit Property
          </Button>
          {hasUnitsInside && (
            <Button size="sm" onClick={() => navigate(`/properties/${propertyId}/add-units`)}>
              <Plus className="mr-2 h-4 w-4" /> Add Unit
            </Button>
          )}
        </div>
      </div>

      {/* Photo Gallery - Compact Grid Layout */}
      {displayPhotos.length > 0 ? (
        <div className="mb-6">
          <div className="grid grid-cols-4 gap-1.5 md:gap-2 h-48 md:h-64">
            {/* First photo - larger */}
            <div 
              className="relative col-span-2 row-span-2 rounded-lg overflow-hidden cursor-pointer bg-muted"
              onClick={() => openLightbox(0)}
            >
              <img 
                src={firstFourPhotos[0]?.url} 
                alt={property.title} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/800x600/e2e8f0/64748b?text=No+Image';
                }}
              />
              {displayPhotos.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                  <Camera className="h-3 w-3" />
                  {displayPhotos.length}
                </div>
              )}
            </div>
            
            {/* Second photo */}
            {firstFourPhotos[1] && (
              <div 
                className="relative rounded-lg overflow-hidden cursor-pointer bg-muted"
                onClick={() => openLightbox(1)}
              >
                <img 
                  src={firstFourPhotos[1].url} 
                  alt={`${property.title} 2`} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image';
                  }}
                />
              </div>
            )}
            
            {/* Third photo */}
            {firstFourPhotos[2] && (
              <div 
                className="relative rounded-lg overflow-hidden cursor-pointer bg-muted"
                onClick={() => openLightbox(2)}
              >
                <img 
                  src={firstFourPhotos[2].url} 
                  alt={`${property.title} 3`} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image';
                  }}
                />
              </div>
            )}
            
            {/* Fourth photo - with "+N" overlay if more photos exist */}
            {firstFourPhotos[3] && (
              <div 
                className="relative rounded-lg overflow-hidden cursor-pointer bg-muted"
                onClick={() => openLightbox(3)}
              >
                <img 
                  src={firstFourPhotos[3].url} 
                  alt={`${property.title} 4`} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image';
                  }}
                />
                {remainingCount > 0 && (
                  <div 
                    className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox(3);
                    }}
                  >
                    <span className="text-white text-xl md:text-2xl font-bold">+{remainingCount}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Fill empty slots if less than 4 photos */}
            {displayPhotos.length === 2 && (
              <>
                <div className="bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground text-xs">No image</span>
                </div>
                <div className="bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground text-xs">No image</span>
                </div>
              </>
            )}
            {displayPhotos.length === 3 && (
              <div className="bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground text-xs">No image</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div 
          className="mb-6 h-48 md:h-64 rounded-lg bg-muted flex items-center justify-center cursor-pointer border-2 border-dashed border-border hover:border-secondary transition-colors"
          onClick={() => navigate(`/properties/${propertyId}/edit`)}
        >
          <div className="text-center">
            <Camera className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No photos yet</p>
            <p className="text-xs text-muted-foreground mt-1">Click to add photos</p>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhotoIndex !== null && displayPhotos.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button 
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="h-8 w-8" />
          </button>
          
          {displayPhotos.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                className="absolute left-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2 z-10"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                className="absolute right-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2 z-10"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}
          
          <div 
            className="max-w-5xl max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={displayPhotos[selectedPhotoIndex].url} 
              alt={`${property.title} ${selectedPhotoIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain mx-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/1200x800/e2e8f0/64748b?text=Image+Not+Found';
              }}
            />
            <div className="text-center text-white mt-4">
              <p className="text-sm">
                {selectedPhotoIndex + 1} of {displayPhotos.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards - Compact Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {!hasUnitsInside && !isVehicle && (
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Status</p>
              <p className="font-semibold text-sm mt-1">{property.status || "VACANT"}</p>
            </CardContent>
          </Card>
        )}
        
        {!hasUnitsInside && !isVehicle && property.monthlyRent && (
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Monthly Rent</p>
              <p className="font-bold text-secondary text-sm mt-1">${property.monthlyRent.toLocaleString()}</p>
            </CardContent>
          </Card>
        )}
        
        {!hasUnitsInside && !isVehicle && property.bedrooms && (
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Bedrooms</p>
              <p className="font-semibold text-sm mt-1">{property.bedrooms}</p>
            </CardContent>
          </Card>
        )}
        
        {!hasUnitsInside && !isVehicle && property.bathrooms && (
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Bathrooms</p>
              <p className="font-semibold text-sm mt-1">{property.bathrooms}</p>
            </CardContent>
          </Card>
        )}
        
        {!hasUnitsInside && !isVehicle && property.squareFeet && (
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Square Feet</p>
              <p className="font-semibold text-sm mt-1">{property.squareFeet.toLocaleString()}</p>
            </CardContent>
          </Card>
        )}
        
        {isVehicle && (
          <>
            <Card>
              <CardContent className="p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Status</p>
                <p className="font-semibold text-sm mt-1">{property.status || "VACANT"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Vehicle</p>
                <p className="font-semibold text-sm mt-1">{property.brand} {property.model}</p>
                <p className="text-xs text-muted-foreground">{property.year}</p>
              </CardContent>
            </Card>
            {property.mileage && (
              <Card>
                <CardContent className="p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">Mileage</p>
                  <p className="font-semibold text-sm mt-1">{property.mileage.toLocaleString()} km</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Tabs for different sections */}
      <div className="space-y-6">
        {/* Description */}
        {property.description && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{property.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Building Details */}
        {property.type === "BUILDING" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Building Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {property.totalUnits && (
                  <div>
                    <p className="text-[10px] text-muted-foreground">Total Units</p>
                    <p className="font-semibold text-sm">{property.totalUnits}</p>
                  </div>
                )}
                {property.yearBuilt && (
                  <div>
                    <p className="text-[10px] text-muted-foreground">Year Built</p>
                    <p className="font-semibold text-sm">{property.yearBuilt}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 col-span-2">
                  {property.hasElevator && <Badge variant="outline" className="text-xs">Elevator</Badge>}
                  {property.hasParking && <Badge variant="outline" className="text-xs">Parking</Badge>}
                  {property.hasGym && <Badge variant="outline" className="text-xs">Gym</Badge>}
                  {property.hasPool && <Badge variant="outline" className="text-xs">Pool</Badge>}
                  {property.hasSecurity && <Badge variant="outline" className="text-xs">Security</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        {property.features && property.features.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Amenities & Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(property.features) && property.features.map((feature: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{feature}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Units List */}
        {hasUnitsInside && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Rental Units ({units.length})</CardTitle>
                <Button size="sm" variant="outline" onClick={() => navigate(`/properties/${propertyId}/add-units`)}>
                  <Plus className="h-3 w-3 mr-1" /> Add Unit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {units.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm mb-3">No units added yet</p>
                  <Button size="sm" onClick={() => navigate(`/properties/${propertyId}/add-units`)}>
                    Add Your First Unit
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {units.map((unit) => (
                    <div 
                      key={unit.id} 
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => navigate(`/properties/${unit.id}`)}
                    >
                      <div>
                        <p className="font-medium text-sm">Unit {unit.unitNumber}</p>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          <span>{unit.bedrooms} bed</span>
                          <span>{unit.bathrooms} bath</span>
                          {unit.squareFeet && <span>{unit.squareFeet} sq ft</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-secondary text-sm">${unit.monthlyRent?.toLocaleString()}/mo</p>
                        <Badge variant={unit.status === "VACANT" ? "default" : "secondary"} className="text-xs mt-1">
                          {unit.status || "VACANT"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Rental Terms */}
        {property.monthlyRent && !hasUnitsInside && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Rental Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Rent</span>
                  <span className="font-semibold">${property.monthlyRent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum Lease</span>
                  <span>{property.minLeaseMonth} months</span>
                </div>
                {property.latefee && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Late Fee</span>
                    <span>${property.latefee}</span>
                  </div>
                )}
                {property.paidEvery && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Every</span>
                    <span>{property.paidEvery} month(s)</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rules */}
        {property.rules && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Rules & Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{property.rules}</p>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {property.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{property.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}