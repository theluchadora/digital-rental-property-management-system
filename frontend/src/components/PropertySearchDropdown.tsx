import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Building2, Home } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

export default function PropertySearchDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isOwner = user?.role === "OWNER";
  const isOnProperties = location.pathname === "/properties" || location.pathname === "/browse";

  // Filter properties and units
  const q = query.toLowerCase().trim();
  const filteredProperties: any[] = [];

  const filteredUnits: any[] = [];

  const hasResults = filteredProperties.length > 0 || filteredUnits.length > 0;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // If on properties page, emit search event
  useEffect(() => {
    if (isOnProperties) {
      window.dispatchEvent(new CustomEvent("property-search", { detail: q }));
    }
  }, [q, isOnProperties]);

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search properties, units..."
        className="pl-10 bg-muted border-0"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { if (query) setOpen(true); }}
      />

      {open && query && !isOnProperties && hasResults && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {filteredProperties.length > 0 && (
            <div>
              <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Properties</p>
              {filteredProperties.slice(0, 5).map(p => (
                <button
                  key={p.id}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    navigate(isOwner ? `/properties/${p.id}` : `/browse/${p.id}`);
                  }}
                >
                  <Building2 className="h-4 w-4 text-secondary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.addressCity}{p.addressSubCity ? `, ${p.addressSubCity}` : ""}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {filteredUnits.length > 0 && (
            <div className={filteredProperties.length > 0 ? "border-t border-border" : ""}>
              <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Units</p>
              {filteredUnits.map(u => (
                <button
                  key={u.id}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    navigate(isOwner ? `/properties/${u.propertyId}` : `/browse/${u.id}`);
                  }}
                >
                  <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.unitIdentifier}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.property?.title} • {u.property?.addressCity}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {open && query && !isOnProperties && !hasResults && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-popover p-4 text-center text-sm text-muted-foreground shadow-lg">
          No properties or units found for "{query}"
        </div>
      )}
    </div>
  );
}
