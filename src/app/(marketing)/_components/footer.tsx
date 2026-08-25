"use client";

import { motion } from "framer-motion";
import { ArrowRight, Github, Linkedin, Mail, Target, Twitter } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Demo", href: "#demo" },
    { label: "Changelog", href: "#" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press Kit", href: "#" },
  ],
  resources: [
    { label: "Documentation", href: "#" },
    { label: "Help Center", href: "#" },
    { label: "Community", href: "#" },
    { label: "Contact", href: "#" },
  ],
  legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-medium">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border">
      {/* CTA */}
      <div className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-balance font-heading text-3xl font-medium tracking-tight sm:text-4xl">
              Ready for your next interview?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
              Start with a free practice loop today. Your first scorecard is a
              few minutes away.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/sign-in">
                  Start practicing for free
                  <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#demo">See a demo</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main footer */}
      <div className="border-t border-border py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-6 lg:gap-12">
            {/* Brand + newsletter */}
            <div className="col-span-2">
              <Link
                href="/"
                className="flex items-center gap-2.5"
              >
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Target className="size-4 stroke-[2.25]" />
                </span>
                <span className="font-heading text-[15px] font-semibold tracking-tight">
                  RoundZero
                </span>
              </Link>
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
                AI-powered interview practice with structured, honest feedback.
              </p>

              <div className="mt-6 max-w-xs space-y-2.5">
                <p className="text-sm font-medium">Product updates</p>
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="flex gap-2"
                >
                  <Input
                    type="email"
                    required
                    placeholder="you@example.com"
                    aria-label="Email address"
                    className="h-9"
                  />
                  <Button type="submit" size="icon" className="size-9 shrink-0">
                    <Mail />
                    <span className="sr-only">Subscribe</span>
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground">
                  No spam. Unsubscribe anytime.
                </p>
              </div>
            </div>

            <FooterColumn title="Product" links={footerLinks.product} />
            <FooterColumn title="Company" links={footerLinks.company} />
            <FooterColumn title="Resources" links={footerLinks.resources} />
            <FooterColumn title="Legal" links={footerLinks.legal} />
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-border pt-8 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} RoundZero. All rights reserved.
            </p>
            <div className="flex items-center gap-1">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <social.icon className="size-4" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
