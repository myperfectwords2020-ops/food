import { PageIntro } from "@/components/page-ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("FAQ", "Answers to common Greencart questions.");

const items = [
  {
    q: "Are your recommendations medical advice?",
    a: "No. Guidance is based on product information and preferences you share. It is not a diagnosis or treatment plan.",
  },
  {
    q: "How do deliveries work?",
    a: "Standard delivery across Nigeria typically takes 2–4 business days after dispatch. Lagos orders over ₦50,000 qualify for complimentary delivery.",
  },
  {
    q: "Can I return a product?",
    a: "Unopened products may be returned within 14 days. Contact care@elanskin.example with your order number.",
  },
  {
    q: "How do I pay?",
    a: "Checkout supports Paystack when configured. Amounts are always confirmed on our servers before payment begins.",
  },
];

export default function FaqPage() {
  return (
    <div className="page-shell max-w-3xl">
      <PageIntro
        eyebrow="Help centre"
        title="Questions, answered."
        copy="Clear information about shopping, routines, and orders."
      />
      <div className="detail-list">
        {items.map((item) => (
          <details key={item.q} open>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
