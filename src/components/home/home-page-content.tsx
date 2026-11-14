import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgePercent, Leaf, Smartphone, Star, Tag, Truck, Zap } from "lucide-react";

import { HomeCategoryTabs } from "@/components/home/home-category-tabs";
import { ProductCard } from "@/components/product-card";
import { catalogService } from "@/services/index";
import type { Product } from "@/types/commerce";

const promises = [
  {
    title: "Great Daily Deals",
    copy: "Fresh discounts every day on fruits, vegetables, and pantry staples you buy most.",
    icon: Tag,
  },
  {
    title: "Quick Delivery",
    copy: "Order before noon and get your groceries at your doorstep the same day.",
    icon: Truck,
  },
  {
    title: "Best Price Ever",
    copy: "We source directly from local farms, so you pay less for fresher food.",
    icon: BadgePercent,
  },
];

const testimonials = [
  {
    name: "Tunde Bakare",
    detail: "Lagos",
    quote: "The vegetables are always crisp and the delivery is faster than going to the market.",
    image: "/grocery/client-1.jpg",
  },
  {
    name: "David Okafor",
    detail: "Abuja",
    quote: "Great prices on meat and fish. Everything arrives well packed and still cold.",
    image: "/grocery/client-2.jpg",
  },
  {
    name: "Fatima Sule",
    detail: "Port Harcourt",
    quote: "I do my whole weekly shop here now. The fruit is genuinely fresh every time.",
    image: "/grocery/client-3.jpg",
  },
];

type CategoryTile = { name: string; image: string; count: number };

function categoryTiles(products: Product[]): CategoryTile[] {
  const byCategory = new Map<string, CategoryTile>();
  for (const product of products) {
    const existing = byCategory.get(product.category);
    if (existing) existing.count += 1;
    else
      byCategory.set(product.category, { name: product.category, image: product.image, count: 1 });
  }
  return [...byCategory.values()];
}

function SectionHead({ id, title, href }: { id: string; title: string; href?: string }) {
  return (
    <div className="gc-section-head">
      <h2 id={id} className="gc-h2">
        {title}
      </h2>
      {href ? (
        <Link href={href} className="gc-see-all">
          See All <ArrowRight size={14} aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

export async function HomePageContent() {
  const { items: products } = await catalogService.listProducts({
    pageSize: 24,
    sort: "featured",
  });

  const categories = categoryTiles(products);
  const freshProducts = products.slice(0, 12);

  return (
    <>
      <section className="gc-hero" aria-labelledby="hero-heading">
        <div className="gc-wrap gc-hero-inner">
          <div className="gc-hero-copy">
            <span className="gc-eyebrow">
              <Zap size={14} aria-hidden /> Weekly discounts on fresh produce
            </span>
            <h1 id="hero-heading">
              <span className="gc-text-green">Fresh Groceries,</span> Delivered Fast to Your Door.
            </h1>
            <p>
              Shop farm-fresh fruits, vegetables, meat, dairy, and everyday essentials. Hand-picked
              quality, fair prices, and same-day delivery across the city.
            </p>
            <div className="gc-hero-actions">
              <Link href="/shop" className="gc-btn gc-btn-yellow">
                Shop Now
              </Link>
              <Link href="/shop?sort=newest" className="gc-btn gc-btn-outline">
                View all products <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
            <ul className="gc-hero-perks">
              <li>
                <span className="gc-perk-icon" aria-hidden>
                  <Truck size={18} />
                </span>
                <span>
                  <strong>Fastest service</strong>
                  <small>Same-day delivery</small>
                </span>
              </li>
              <li>
                <span className="gc-perk-icon" aria-hidden>
                  <Leaf size={18} />
                </span>
                <span>
                  <strong>100% Fresh &amp; Natural</strong>
                  <small>Sourced from local farms</small>
                </span>
              </li>
            </ul>
          </div>
          <div className="gc-hero-visual">
            <div className="gc-hero-image">
              <Image
                src="/grocery/hero-delivery.jpg"
                alt="Shelves stocked with fresh peppers, lettuce, cucumbers, and other vegetables"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 48vw"
              />
            </div>
            <div className="gc-hero-badge">
              <strong>30%</strong>
              <span>Off on first order</span>
            </div>
          </div>
        </div>
      </section>

      <div className="gc-wrap">
        {categories.length > 0 ? (
          <section className="gc-section" aria-labelledby="category-heading">
            <SectionHead id="category-heading" title="Shop By Category" href="/shop" />
            <ul className="gc-category-row">
              {categories.map((category) => (
                <li key={category.name}>
                  <Link
                    href={`/shop?category=${encodeURIComponent(category.name)}`}
                    className="gc-category"
                  >
                    <span className="gc-category-media">
                      <img src={category.image} alt="" loading="lazy" />
                    </span>
                    <strong>{category.name}</strong>
                    <small>
                      {category.count} {category.count === 1 ? "item" : "items"}
                    </small>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="gc-section gc-promos" aria-label="Current offers">
          <article className="gc-promo gc-promo-green">
            <div>
              <h2>Get up to 40% off delivery when you spend ₦20,000 on fresh fruit</h2>
              <Link href="/shop?category=Fruits" className="gc-btn gc-btn-yellow gc-btn-sm">
                Shop Fruits
              </Link>
            </div>
            <img src="/grocery/strawberry.jpg" alt="" loading="lazy" />
          </article>
          <article className="gc-promo gc-promo-coral">
            <div>
              <h2>Enjoy 8% off every order with a Greencart membership</h2>
              <Link href="/account/register" className="gc-btn gc-btn-light gc-btn-sm">
                Join Free
              </Link>
            </div>
            <img src="/grocery/bell-pepper.jpg" alt="" loading="lazy" />
          </article>
        </section>

        <section className="gc-section" aria-labelledby="fresh-heading">
          <SectionHead id="fresh-heading" title="All Fresh Products" href="/shop" />
          {freshProducts.length ? (
            <div className="gc-product-grid">
              {freshProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="gc-empty">
              Our shelves are being restocked. <Link href="/shop">Browse the shop</Link>
            </p>
          )}
        </section>

        <section className="gc-section" aria-labelledby="promise-heading">
          <h2 id="promise-heading" className="gc-h2 gc-center">
            We Provide You the
            <br />
            Best of the Town
          </h2>
          <ul className="gc-promises">
            {promises.map(({ title, copy, icon: Icon }) => (
              <li key={title}>
                <span className="gc-promise-icon" aria-hidden>
                  <Icon size={22} />
                </span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="gc-section" aria-labelledby="best-heading">
          <SectionHead id="best-heading" title="Best Selling Products" href="/shop" />
          <HomeCategoryTabs products={products} />
        </section>

        <section className="gc-section" aria-labelledby="clients-heading">
          <div className="gc-center">
            <p className="gc-rating">
              <span className="gc-stars" role="img" aria-label="Rated 4.9 out of 5">
                {[0, 1, 2, 3, 4].map((n) => (
                  <Star key={n} size={14} fill="currentColor" aria-hidden />
                ))}
              </span>
              4.9 from 2,000+ happy shoppers
            </p>
            <h2 id="clients-heading" className="gc-h2">
              Recommended by Top Clients
            </h2>
          </div>
          <ul className="gc-testimonials">
            {testimonials.map((t) => (
              <li key={t.name}>
                <figure className="gc-testimonial">
                  <div className="gc-testimonial-media">
                    <Image
                      src={t.image}
                      alt={`Portrait of ${t.name}`}
                      fill
                      sizes="(max-width: 700px) 100vw, 33vw"
                    />
                  </div>
                  <blockquote>
                    <p>&ldquo;{t.quote}&rdquo;</p>
                  </blockquote>
                  <figcaption>
                    <strong>{t.name}</strong>
                    <small>{t.detail}</small>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>

        <section className="gc-section" aria-labelledby="app-heading">
          <div className="gc-app-banner">
            <div className="gc-app-copy">
              <h2 id="app-heading">Essentials at Your Doorstep – Only from Greencart</h2>
              <p>
                Shop thousands of fresh products in minutes. Our mobile app is coming soon—until
                then, order right here on the web.
              </p>
              <div className="gc-app-badges">
                <span className="gc-app-badge">
                  <Smartphone size={18} aria-hidden />
                  <span>
                    <small>Coming soon on</small>
                    Google Play
                  </span>
                </span>
                <span className="gc-app-badge">
                  <Smartphone size={18} aria-hidden />
                  <span>
                    <small>Coming soon on the</small>
                    App Store
                  </span>
                </span>
              </div>
            </div>
            <div className="gc-app-visual">
              <Image
                src="/grocery/banana.jpg"
                alt="Bunch of ripe yellow bananas"
                fill
                sizes="(max-width: 900px) 100vw, 40vw"
              />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
