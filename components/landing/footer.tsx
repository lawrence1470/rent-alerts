import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background px-8 py-12 sm:px-12 lg:px-16 xl:px-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Contact */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-1">
            <h3 className="mb-4 text-lg font-bold">Rent Notify</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Never miss your perfect NYC rental. Get instant notifications for new listings.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>1014 Lexington Ave, 3R<br />New York, NY 10021</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:+13476172607" className="hover:text-foreground">
                  +1 (347) 617-2607
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:lawrence.nicastro1@gmail.com" className="hover:text-foreground">
                  lawrence.nicastro1@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">
              Product
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/alerts" className="text-muted-foreground hover:text-foreground">
                  Saved Searches
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">
              Support
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground">
                  Help Center
                </Link>
              </li>
              <li>
                <a href="mailto:lawrence.nicastro1@gmail.com" className="text-muted-foreground hover:text-foreground">
                  Contact Us
                </a>
              </li>
              <li>
                <Link href="/refund" className="text-muted-foreground hover:text-foreground">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">
              Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-muted-foreground hover:text-foreground">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Rent Notify. All rights reserved.</p>
          <p className="mt-2">Software for NYC rental notifications</p>
        </div>
      </div>
    </footer>
  );
}
