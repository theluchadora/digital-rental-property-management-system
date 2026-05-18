// pages/owner/Properties.tsx - Fixed version

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPin, Plus, Download, Loader2, Building2, Car, Home, Eye, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { propertiesApi } from "@/lib/api/properties";
import type { Property } from "@/types/api";

export default function OwnerPropertiesPage() {
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-properties");
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    async function loadProperties() {
      if (!isAuthenticated || !user) {
        toast({ title: "Please login to view properties", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Get current user's properties
        const myPropsResponse = await propertiesApi.getByOwner(user.id);
        // Handle different response formats
        let myProps: Property[] = [];
        if (Array.isArray(myPropsResponse.data)) {
          myProps = myPropsResponse.data;
        } else if (myPropsResponse.data?.properties) {
          myProps = myPropsResponse.data.properties;
        } else if (Array.isArray(myPropsResponse)) {
          myProps = myPropsResponse;
        }
        setMyProperties(myProps);

        // Get all properties (to see others)
        const allPropsResponse = await propertiesApi.getAll();
        // Handle different response formats
        let allProps: Property[] = [];
        if (Array.isArray(allPropsResponse.data)) {
          allProps = allPropsResponse.data;
        } else if (allPropsResponse.data?.properties) {
          allProps = allPropsResponse.data.properties;
        } else if (Array.isArray(allPropsResponse)) {
          allProps = allPropsResponse;
        }
        setAllProperties(allProps);
      } catch (err: any) {
        console.error("Failed to load properties:", err);
        toast({ 
          title: "Failed to load properties", 
          description: err.response?.data?.error || err.message,
          variant: "destructive" 
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadProperties();
  }, [user, isAuthenticated, toast]);

  // Filter out current user's properties from all properties to get others
  const otherProperties = allProperties.filter(prop => prop.ownerId !== user?.id);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "BUILDING": return <Building2 className="h-4 w-4" />;
      case "VEHICLE": return <Car className="h-4 w-4" />;
      case "HOUSE": return <Home className="h-4 w-4" />;
      default: return <Building2 className="h-4 w-4" />;
    }
  };

  const downloadCSV = (properties: Property[], filename: string) => {
    if (properties.length === 0) return;
    const header = "Property Title,Type,Status,Location,Monthly Rent\n";
    const rows = properties.map(p => 
      `"${p.title}","${p.type}","${p.status || "VACANT"}","${p.city || ""}","${p.monthlyRent || 0}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${properties.length} properties exported` });
  };

  const PropertyCard = ({ property, showOwner = false }: { property: Property; showOwner?: boolean }) => {
    const firstPhoto = property.photos?.[0]?.url || property.photos?.[0];
    const unitsCount = property.totalUnits || 0;
    
    return (
      <Link to={`/properties/${property.id}`}>
        <Card className="group overflow-hidden transition-shadow hover:shadow-lg cursor-pointer h-full">
          <div className="relative h-48 overflow-hidden">
            {firstPhoto ? (
              <img 
                src={typeof firstPhoto === 'string' ? firstPhoto : firstPhoto.url} 
                alt={property.title} 
                loading="lazy" 
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center">
                <span className="text-muted-foreground">No Image</span>
              </div>
            )}
            <Badge className={`absolute right-3 top-3 text-xs ${
              property.status === "VACANT" ? "bg-green-500 text-white" :
              property.status === "OCCUPIED" ? "bg-secondary text-secondary-foreground" :
              "bg-muted text-muted-foreground"
            }`}>
              {property.status || "VACANT"}
            </Badge>
            <Badge className="absolute left-3 top-3 bg-primary/80 text-primary-foreground text-xs flex items-center gap-1">
              {getTypeIcon(property.type)}
              {property.type}
            </Badge>
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground truncate">{property.title}</h3>
            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="h-3 w-3 flex-shrink-0" /> 
              {property.city || "Location not specified"}
            </p>
            {showOwner && property.ownerId && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <User className="h-3 w-3" />
                Owner ID: {property.ownerId.slice(0, 8)}...
              </p>
            )}
            {property.type === "BUILDING" && (
              <div className="mt-4 flex gap-6">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Total Units</p>
                  <p className="font-bold text-foreground">{unitsCount}</p>
                </div>
                {property.hasUnits && (
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Has Units</p>
                    <p className="font-bold text-foreground">Yes</p>
                  </div>
                )}
              </div>
            )}
            {property.type === "VEHICLE" && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">
                  {property.brand} {property.model} • {property.year}
                </p>
              </div>
            )}
            {property.monthlyRent && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-sm font-bold text-secondary">${property.monthlyRent.toLocaleString()}/mo</p>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Portfolio Overview</p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Properties</h1>
          <div className="mt-2 flex gap-6 text-sm">
            <div>
              <span className="text-xs uppercase text-muted-foreground">My Properties</span>
              <p className="font-bold">{myProperties.length}</p>
            </div>
            <div>
              <span className="text-xs uppercase text-muted-foreground">Other Properties</span>
              <p className="font-bold">{otherProperties.length}</p>
            </div>
            <div>
              <span className="text-xs uppercase text-muted-foreground">Total Units</span>
              <p className="font-bold">{myProperties.reduce((acc, p) => acc + (p.totalUnits || 0), 0)}</p>
            </div>
          </div>
        </div>
        <Link to="/properties/new">
          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <Plus className="mr-2 h-4 w-4" /> New Property
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="my-properties">My Properties ({myProperties.length})</TabsTrigger>
          <TabsTrigger value="other-properties">Other Properties ({otherProperties.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="my-properties" className="mt-6">
          {myProperties.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">You haven't added any properties yet.</p>
                <Link to="/properties/new">
                  <Button variant="outline" className="mt-4">Add Your First Property</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Button variant="outline" size="sm" onClick={() => downloadCSV(myProperties, "my_properties.csv")}>
                  <Download className="mr-2 h-4 w-4" /> Export My Properties
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {myProperties.map((prop) => (
                  <PropertyCard key={prop.id} property={prop} showOwner={false} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="other-properties" className="mt-6">
          {otherProperties.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No other properties available to view.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Button variant="outline" size="sm" onClick={() => downloadCSV(otherProperties, "other_properties.csv")}>
                  <Download className="mr-2 h-4 w-4" /> Export Other Properties
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {otherProperties.map((prop) => (
                  <PropertyCard key={prop.id} property={prop} showOwner={true} />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Portfolio Summary Table - Only for my properties */}
      {myProperties.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">My Portfolio Summary</h2>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                      <th className="p-4 font-medium">Property</th>
                      <th className="p-4 font-medium">Type</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Location</th>
                      <th className="p-4 font-medium text-right">Units</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {myProperties.slice(0, 10).map((prop) => (
                      <tr key={prop.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => window.location.href = `/properties/${prop.id}`}>
                        <td className="p-4 font-medium">{prop.title}</td>
                        <td className="p-4 text-secondary">{prop.type}</td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-xs">{prop.status || "VACANT"}</Badge>
                        </td>
                        <td className="p-4 text-muted-foreground">{prop.city || "-"}</td>
                        <td className="p-4 text-right font-medium">{prop.totalUnits || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}