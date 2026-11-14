import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/components/contact/contact-form";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Contact", "Reach the Greencart customer care team.");

export default function ContactPage() {
  return (
    <section className="gc-contact-page" aria-labelledby="contact-heading">
      <div className="gc-wrap">
        <header className="gc-contact-header">
          <p className="gc-contact-eyebrow">Customer care</p>
          <h1 id="contact-heading">We&apos;re here to help.</h1>
          <p className="gc-contact-lede">
            Questions about an order, delivery, or something in your cart? Send us a message and our
            team will get back to you.
          </p>
        </header>

        <div className="gc-contact-card">
          <aside className="gc-contact-aside" aria-label="How to reach us">
            <h2 className="gc-contact-aside-title">Reach us directly</h2>
            <ul className="gc-contact-details">
              <li>
                <Mail size={18} aria-hidden />
                <span>
                  <strong>Email</strong>
                  <a href="mailto:hello@greencart.ng">hello@greencart.ng</a>
                </span>
              </li>
              <li>
                <Phone size={18} aria-hidden />
                <span>
                  <strong>Phone</strong>
                  <a href="tel:+2348000000000">+234 800 000 0000</a>
                </span>
              </li>
              <li>
                <Clock size={18} aria-hidden />
                <span>
                  <strong>Hours</strong>
                  Monday–Saturday, 9am–6pm WAT
                </span>
              </li>
              <li>
                <MapPin size={18} aria-hidden />
                <span>
                  <strong>Location</strong>
                  Lagos, Nigeria
                </span>
              </li>
            </ul>
            <p className="gc-contact-aside-note">
              For urgent delivery or payment issues, include your order number in the message so we
              can help faster.
            </p>
          </aside>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
