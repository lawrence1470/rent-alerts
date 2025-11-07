import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Search, TrendingUp, MapPin } from "lucide-react";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your rental search overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Searches
              </CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                Across Manhattan & Brooklyn
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                New Listings
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                In the last 24 hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Notifications
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                Unread alerts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Price
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$2,850</div>
              <p className="text-xs text-muted-foreground">
                For 1BR in your searches
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Listings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Listings</CardTitle>
                <CardDescription>
                  New apartments matching your search criteria
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  address: "123 Fifth Avenue, Manhattan",
                  price: "$3,200",
                  bedrooms: "1BR",
                  bathrooms: "1BA",
                  size: "750 sq ft",
                  isNew: true,
                },
                {
                  address: "456 Brooklyn Heights, Brooklyn",
                  price: "$2,800",
                  bedrooms: "1BR",
                  bathrooms: "1BA",
                  size: "680 sq ft",
                  isNew: true,
                },
                {
                  address: "789 Park Slope, Brooklyn",
                  price: "$2,950",
                  bedrooms: "1BR",
                  bathrooms: "1BA",
                  size: "720 sq ft",
                  isNew: false,
                },
              ].map((listing, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        {listing.address}
                      </p>
                      {listing.isNew && (
                        <Badge variant="secondary" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-3 text-sm text-muted-foreground">
                      <span>{listing.bedrooms}</span>
                      <span>•</span>
                      <span>{listing.bathrooms}</span>
                      <span>•</span>
                      <span>{listing.size}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">
                      {listing.price}
                    </p>
                    <p className="text-sm text-muted-foreground">per month</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Searches */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Searches</CardTitle>
                <CardDescription>
                  Your saved search configurations
                </CardDescription>
              </div>
              <Button size="sm">
                New Search
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  name: "Upper West Side 1BR",
                  criteria: "1BR • $2,500-$3,500 • Pet-friendly",
                  matches: 8,
                },
                {
                  name: "Brooklyn Heights Studio",
                  criteria: "Studio • $1,800-$2,500 • Doorman",
                  matches: 4,
                },
                {
                  name: "East Village 1BR",
                  criteria: "1BR • $2,800-$3,800 • Laundry",
                  matches: 12,
                },
              ].map((search, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{search.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {search.criteria}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {search.matches} matches
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
