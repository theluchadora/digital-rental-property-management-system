import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, Bed, Bath, Maximize, Building2, CheckCircle, MessageSquare, CalendarCheck } from "lucide-react";
import PhotoGalleryDialog from "@/components/PhotoGalleryDialog";
import { useToast } from "@/hooks/use-toast";
import { propertiesApi } from "@/lib/api/properties";
import { unitsApi } from "@/lib/api/units";
import type { Property } from "@/types/api";

export default function TenantPropertyDetailPage() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProperty() {
      if (!listingId) return;
      try {
        try {
          const unitResponse = await unitsApi.getById(listingId);
          console.log("Tenant listing (unit) response:", unitResponse);
          setProperty(unitResponse.unit || null);
          return;
        } catch (unitErr) {
          const response = await propertiesApi.getById(listingId);
          console.log("Tenant listing (property) response:", response);
          setProperty(response || null);
        }
      } catch (err) {
        console.error("Failed to load property:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProperty();
  }, [listingId]);

  const availableUnits = property?.units?.filter(u => u.status === "VACANT") || [];
  const rentAmount = property?.monthlyRent ? Number(property.monthlyRent) : 0;
  const isWholeProperty = property?.hasUnits === false;
  const images = property?.photos?.map((photo) => photo.url).filter(Boolean) || [];

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const openGallery = (index: number) => { setGalleryIndex(index); setGalleryOpen(true); };

  const handleApply = () => {
    if (!property) return;
    toast({ title: "Redirecting to Messages", description: "Send a message to the property owner to apply." });
    navigate(property.ownerId ? `/messages?userId=${property.ownerId}` : "/messages");
  };

  const handleSchedule = () => {
    if (!property) return;
    toast({ title: "Redirecting to Messages", description: "Send a message to schedule a viewing." });
    navigate(property.ownerId ? `/messages?userId=${property.ownerId}` : "/messages");
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading property details...</div>;
  }

  if (!property) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Property not found.</p>
        <Link to="/browse" className="text-secondary hover:underline">Back to Browse</Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-secondary hover:underline mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Browse
      </Link>

      {/* Image Gallery */}
      {images.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="col-span-2 md:col-span-2 row-span-2">
              <img src={images[0]} alt={property.title} className="h-48 md:h-72 w-full rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => openGallery(0)} />
            </div>
            {images.slice(1, 4).map((img, index) => (
              <div key={img} className={index === 0 ? "hidden md:block" : "col-span-1"}>
                <img
                  src={img}
                  alt="Gallery"
                  className={index === 0 ? "h-[calc(50%-4px)] w-full rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity" : "h-24 md:h-[calc(50%-4px)] w-full rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"}
                  onClick={() => openGallery(index + 1)}
                />
              </div>
            ))}
            {images.length > 4 && (
              <div className="col-span-1 relative">
                <img src={images[3]} alt="Gallery" className="h-24 md:h-[calc(50%-4px)] w-full rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => openGallery(3)} />
                <button onClick={() => openGallery(0)} className="absolute inset-0 flex items-center justify-center rounded-lg bg-foreground/50 text-primary-foreground font-semibold hover:bg-foreground/60 transition-colors">
                  +{images.length} Photos
                </button>
              </div>
            )}
          </div>

          <PhotoGalleryDialog images={images} initialIndex={galleryIndex} open={galleryOpen} onOpenChange={setGalleryOpen} />
        </>
      ) : (
        <div className="h-48 md:h-72 w-full rounded-lg border border-dashed border-border bg-muted flex items-center justify-center text-sm text-muted-foreground">
          No photos uploaded yet.
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <Badge className="bg-secondary text-secondary-foreground mb-2">{property.status}</Badge>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{property.title}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {property.address}, {property.city}
            </p>
          </div>

          <Card>
            <CardHeader><CardTitle>About this Property</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{property.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                  { label: "Year Built", value: property.yearBuilt || "—" },
                  { label: "Total Units", value: property.totalUnits || "—" },
                  { label: "Type", value: property.type },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] uppercase text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pricing & Lease</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Monthly Rent</p>
                <p className="text-xl font-semibold text-foreground">
                  {rentAmount ? `$${rentAmount.toLocaleString()}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Minimum Lease</p>
                <p className="text-xl font-semibold text-foreground">
                  {property.minLeaseMonth ? `${property.minLeaseMonth} months` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Late Fee</p>
                <p className="text-xl font-semibold text-foreground">
                  {property.latefee ? `$${property.latefee}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Payment Frequency</p>
                <p className="text-xl font-semibold text-foreground">
                  {property.paidEvery ? `Every ${property.paidEvery} month(s)` : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          {isWholeProperty && (
            <Card>
              <CardHeader><CardTitle>Property Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Bedrooms</p>
                  <p className="text-lg font-semibold text-foreground">
                    {property.bedrooms ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Bathrooms</p>
                  <p className="text-lg font-semibold text-foreground">
                    {property.bathrooms ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Square Feet</p>
                  <p className="text-lg font-semibold text-foreground">
                    {property.squareFeet ?? "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Building Amenities</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  property.hasParking ? "Parking" : null,
                  property.hasElevator ? "Elevator" : null,
                  property.hasSecurity ? "24/7 Security" : null,
                  property.hasGym ? "Fitness Center" : null,
                  property.hasPool ? "Swimming Pool" : null,
                ].filter(Boolean).map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-secondary" /> {a}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {property.hasUnits && (
            <div>
            <h2 className="text-xl font-bold mb-4">Available Units ({availableUnits.length})</h2>
            <div className="space-y-4">
              {availableUnits.map((unit, i) => (
                <Card key={unit.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex flex-col sm:flex-row gap-4 p-4">
                    {unit.photos?.[0]?.url ? (
                      <img src={unit.photos[0].url} alt={unit.unitNumber || unit.title} className="h-24 w-full sm:w-32 rounded-lg object-cover" />
                    ) : (
                      <div className="h-24 w-full sm:w-32 rounded-lg border border-dashed border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        No photo
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{unit.unitNumber ? `Unit ${unit.unitNumber}` : unit.title}</h3>
                      <div className="mt-1 flex items-center gap-3 md:gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Bed className="h-3 w-3" /> {unit.bedrooms} Beds</span>
                        <span className="flex items-center gap-1"><Bath className="h-3 w-3" /> {unit.bathrooms} Baths</span>
                        <span className="flex items-center gap-1"><Maximize className="h-3 w-3" /> {unit.squareFeet} sqft</span>
                        {unit.floorNumber !== undefined && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> Floor {unit.floorNumber}</span>}
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2">
                      <div className="text-right">
                        <span className="text-lg md:text-xl font-bold text-secondary">${(unit.monthlyRent || 0).toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">/mo</span>
                      </div>
                      <Link to={`/browse/${unit.id}`}>
                        <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">VIEW UNIT</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {availableUnits.length === 0 && (
                <Card><CardContent className="p-8 text-center text-muted-foreground">No units currently available in this property.</CardContent></Card>
              )}
            </div>
          </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-secondary/20 bg-secondary/5">
            <CardContent className="p-6 space-y-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Starting From</p>
              <p className="text-3xl font-bold text-secondary">
                ${availableUnits.length > 0
                  ? Math.min(...availableUnits.map(u => Number(u.monthlyRent || 0))).toLocaleString()
                  : rentAmount.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {property.hasUnits ? `${availableUnits.length} unit(s) available` : "Whole property rental"}
              </p>
              <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={handleApply}>
                <MessageSquare className="mr-2 h-4 w-4" /> APPLY NOW
              </Button>
              <Button variant="outline" className="w-full" onClick={handleSchedule}>
                <CalendarCheck className="mr-2 h-4 w-4" /> SCHEDULE A TOUR
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Location</CardTitle></CardHeader>
            <CardContent>
              <div className="h-40 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">
                <MapPin className="h-5 w-5 mr-2" /> Map View
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {property.address}, {property.city}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
