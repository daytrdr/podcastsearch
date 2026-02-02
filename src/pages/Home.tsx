import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Podcast, Radio, Database, User } from "lucide-react";

export function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            iTunes Search API
          </h1>
          <p className="text-muted-foreground text-lg">
            Reference application for searching podcasts and episodes
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6 hover:shadow-md transition-shadow">
            <Link to="/podcast" className="block space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Podcast className="size-8 text-primary" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Search by Podcast</h2>
                <p className="text-sm text-muted-foreground">
                  Find podcasts by name, author, or keyword
                </p>
              </div>
              <Button className="w-full" variant="outline">
                Get Started
              </Button>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow">
            <Link to="/episode" className="block space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Radio className="size-8 text-primary" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Search by Episode</h2>
                <p className="text-sm text-muted-foreground">
                  Find specific episodes across all podcasts
                </p>
              </div>
              <Button className="w-full" variant="outline">
                Get Started
              </Button>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow">
            <Link to="/author" className="block space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <User className="size-8 text-primary" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Search by Author</h2>
                <p className="text-sm text-muted-foreground">
                  Find podcasts by their creators and hosts
                </p>
              </div>
              <Button className="w-full" variant="outline">
                Get Started
              </Button>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow">
            <Link to="/all-search" className="block space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Database className="size-8 text-primary" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">All Search & Data</h2>
                <p className="text-sm text-muted-foreground">
                  Advanced search with complete data view
                </p>
              </div>
              <Button className="w-full" variant="outline">
                Get Started
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
