// pages/tenant/Browse.tsx
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bed, Bath, Maximize, Filter, X, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { unitsApi } from "@/lib/api/units";
import { CardGridSkeleton } from "@/components/ui/loading-state";
import PropertyCardGallery from "@/components/PropertyCardGallery";
import type { Property } from "@/types/api";

export default function TenantBrowsePage() {
  const [units, setUnits] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useState("all");
  const [bedrooms, setBedrooms] = useState("all");
  const [sortBy, setSortBy] = useState("price-asc");
  const [showFilters, setShowFilters] = useState(false);
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyType, setPropertyType] = useState<"all" | "HOUSE" | "BUILDING" | "VEHICLE">("all");

  useEffect(() => {
    const handler = (e: Event) => {
      setSearchQuery((e as CustomEvent).detail || "");
    };
    window.addEventListener("property-search", handler);
    return () => window.removeEventListener("property-search", handler);
  }, []);

  useEffect(() => {
    async function loadUnits() {
      setIsLoading(true);
      try {
        const response = await unitsApi.list({
          city: location !== "all" ? location : undefined,
          minRent: minRent ? Number(minRent) : undefined,
          maxRent: maxRent ? Number(maxRent) : undefined,
          bedrooms: (bedrooms !== "all" && bedrooms !== "3+") ? Number(bedrooms) : undefined,
          status: "VACANT",
        });
        setUnits(response.data || []);
      } catch (err) {
        console.error("Failed to load units:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadUnits();
  }, [location, bedrooms, minRent, maxRent]);

  const cities = useMemo(() => {
    const set = new Set(units.map(u => u.city).filter(Boolean));
    return Array.from(set) as string[];
  }, [units]);

  const filteredUnits = useMemo(() => {
    let result = [...units];

    if (propertyType !== "all") {
      result = result.filter((u) => u.type === propertyType || u.parent?.type === propertyType);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.unitNumber?.toLowerCase().includes(q) ||
        u.title?.toLowerCase().includes(q) ||
        u.city?.toLowerCase().includes(q) ||
        u.brand?.toLowerCase().includes(q) ||
        u.model?.toLowerCase().includes(q)
      );
    }

    if (bedrooms === "3+") {
      result = result.filter((u) => (u.bedrooms ?? 0) >= 3);
    }

    if (sortBy === "price-desc") {
      result.sort((a, b) => (b.monthlyRent || 0) - (a.monthlyRent || 0));
    } else if (sortBy === "price-asc") {
      result.sort((a, b) => (a.monthlyRent || 0) - (b.monthlyRent || 0));
    }

    return result;
  }, [units, searchQuery, sortBy, propertyType, bedrooms]);

  const clearFilters = () => {
    setLocation("all");
    setBedrooms("all");
    setPropertyType("all");
    setMinRent("");
    setMaxRent("");
  };

  const hasActiveFilters = location !== "all" || bedrooms !== "all" || propertyType !== "all" || minRent || maxRent;

  if (isLoading) {
    return <CardGridSkeleton count={6} />;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 shrink-0">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Filter</h3>
          <div className="mt-4 space-y-6">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Property Type</label>
              <Select value={propertyType} onValueChange={(v) => setPropertyType(v as typeof propertyType)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="HOUSE">Houses</SelectItem>
                  <SelectItem value="BUILDING">Apartments</SelectItem>
                  <SelectItem value="VEHICLE">Vehicles</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Location</label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="All locations" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Rent Range</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <Input placeholder="Min" type="number" value={minRent} onChange={e => setMinRent(e.target.value)} />
                <Input placeholder="Max" type="number" value={maxRent} onChange={e => setMaxRent(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Bedrooms</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {["all", "1", "2", "3+"].map(b => (
                  <button
                    key={b}
                    onClick={() => setBedrooms(b)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      bedrooms === b ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-secondary"
                    }`}
                  >
                    {b === "all" ? "Any" : b === "3+" ? "3+ BR" : `${b} BR`}
                  </button>
                ))}
              </div>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Find your next home</h1>
              <p className="text-sm text-muted-foreground">
                {filteredUnits.length} listing{filteredUnits.length !== 1 ? "s" : ""} available.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="mr-1 h-3 w-3" /> Filters
              </Button>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 sm:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {showFilters && (
            <div className="lg:hidden mb-6 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Filters</h3>
                <button onClick={() => setShowFilters(false)}><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Location</label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Rent Range</label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <Input placeholder="Min" type="number" value={minRent} onChange={e => setMinRent(e.target.value)} />
                    <Input placeholder="Max" type="number" value={maxRent} onChange={e => setMaxRent(e.target.value)} />
                  </div>
                </div>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          )}

          {filteredUnits.length === 0 ? (
            <Card>
              <CardContent className="p-8 md:p-12 text-center">
                <p className="text-lg font-semibold text-foreground">No listings match your filters</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your search criteria</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>Clear Filters</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2">
              {filteredUnits.map((unit) => (
                  <Card key={unit.id} className="group overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="relative h-44 md:h-52 overflow-hidden">
                      <PropertyCardGallery property={unit} />
                      <Badge className="absolute left-3 top-3 z-10 bg-secondary text-secondary-foreground text-xs">
                        {unit.status === "VACANT" ? "AVAILABLE" : unit.status}
                      </Badge>
                    </div>
                    <CardContent className="p-4 md:p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground truncate">{unit.title || "Premium Unit"}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {unit.unitNumber ? `Unit ${unit.unitNumber}` : unit.type} • {unit.city}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-lg md:text-xl font-bold text-secondary">${(unit.monthlyRent || 0).toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">/mo</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
                        {unit.bedrooms !== undefined && <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> {unit.bedrooms}</span>}
                        {unit.bathrooms !== undefined && <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {unit.bathrooms}</span>}
                        {unit.squareFeet !== undefined && (
                          <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" /> {unit.squareFeet} sqft</span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                        <span className="text-xs text-muted-foreground">
                          MIN LEASE: {unit.minLeaseMonth || 1} mo
                        </span>
                        <Link to={`/browse/${unit.id}`}>
                          <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xs">
                            VIEW DETAILS
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}