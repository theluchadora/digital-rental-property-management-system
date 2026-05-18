import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ReportIncidentPage from "@/pages/ReportIncidentPage";
import { incidentsApi } from "@/lib/api/incidents";
import { Toaster } from "@/components/ui/toaster";

// Mock the API
vi.mock("@/lib/api/incidents", () => ({
  incidentsApi: {
    create: vi.fn(),
    uploadEvidence: vi.fn(),
  },
}));

// Mock the AuthContext values if needed, or wrap in AuthProvider
// We'll wrap in AuthProvider but we need to ensure it's "logged in"
vi.mock("@/contexts/AuthContext", async () => {
  const actual = await vi.importActual("@/contexts/AuthContext");
  return {
    ...actual,
    useAuth: () => ({
      user: { id: "u-1", role: "TENANT", firstName: "Test", lastName: "User" },
      isAuthenticated: true,
      loading: false,
    }),
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {children}
      <Toaster />
    </BrowserRouter>
  </QueryClientProvider>
);

describe("ReportIncidentPage UI Integration", () => {
  it("renders the reporting form and handles submission", async () => {
    vi.mocked(incidentsApi.create).mockResolvedValue({ data: { report: { id: "inc-123" } } } as unknown as never);

    render(
      <AllProviders>
        <ReportIncidentPage />
      </AllProviders>
    );

    expect(screen.getByText(/Tenant Complaint & Help Center/i)).toBeInTheDocument();

    // Fill the form
    fireEvent.change(screen.getByPlaceholderText(/provide a thorough description/i), {
      target: { value: "Someone is playing loud music" },
    });
    fireEvent.change(screen.getByPlaceholderText(/e.g., Building A/i), {
      target: { value: "Apartment 101" },
    });
    
    // Set date (using a label match)
    const dateInput = screen.getByLabelText(/Date of Incident/i);
    fireEvent.change(dateInput, { target: { value: "2024-05-10" } });

    // Agree to terms
    fireEvent.click(screen.getByLabelText(/I confirm that the information provided is accurate/i));

    // Submit
    const submitBtn = screen.getByRole("button", { name: /File Complaint/i });
    fireEvent.click(submitBtn);

    // Confirm dialog
    expect(screen.getByText(/Confirm Submission/i)).toBeInTheDocument();
    
    const confirmBtn = screen.getByRole("button", { name: /Confirm & Submit/i });
    fireEvent.click(confirmBtn);

    // Verify API call
    await waitFor(() => {
      expect(incidentsApi.create).toHaveBeenCalledWith(expect.objectContaining({
        description: "Someone is playing loud music",
        location: "Apartment 101",
      }));
    });

    // Verify success toast
    expect(await screen.findByText(/Complaint Filed/i)).toBeInTheDocument();
    expect(screen.getByText(/Ref: INC-123/i)).toBeInTheDocument();
  });
});
