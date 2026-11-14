"use client";

import { Check, Droplets, Leaf, Sparkles, Sun } from "lucide-react";
import { useState } from "react";

import { recommendRoutineAction } from "@/app/actions/routine";
import { useCart } from "@/components/cart/cart-context";
import { ProductCard } from "@/components/product-card";
import { RouteLink } from "@/components/ui/route-link";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";
import type { RoutineAnswers, RoutineRecommendation } from "@/types/commerce";

const steps = ["Skin type", "Main concerns", "Current routine", "Preferences", "Budget", "Goals"];
const questions = [
  "How does your skin usually feel by midday?",
  "What would you most like to support?",
  "What does your routine look like today?",
  "What matters most in your products?",
  "What feels comfortable for this routine?",
  "What would make this routine feel successful?",
];
const options = [
  ["Oily", "Dry", "Combination", "Normal", "Sensitive"],
  ["Dark spots", "Dryness", "Dullness", "Texture", "Excess oil"],
  ["I’m starting fresh", "Just the basics", "A few active products", "A complete routine"],
  ["Fragrance-free", "Light textures", "Rich textures", "Minimal steps"],
  ["Under ₦40,000", "₦40k–₦70k", "₦70k–₦100k", "Flexible"],
  ["Build consistency", "Simplify my shelf", "Support radiance", "Balance hydration"],
];

const stepIcons = [Droplets, Sun, Leaf, Sparkles] as const;

export function RoutineExperience() {
  const { addItem } = useCart({ includeSummary: false });
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<RoutineRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const choose = (value: string) =>
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = value;
      return next;
    });

  const finish = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: RoutineAnswers = {
        skinType: answers[0] ?? "",
        concern: answers[1] ?? "",
        currentRoutine: answers[2] ?? "",
        preferences: answers[3] ?? "",
        budget: answers[4] ?? "",
        goals: answers[5] ?? "",
      };
      const recommendation = await recommendRoutineAction(payload);
      setResult(recommendation);
    } catch {
      setError("We couldn't build your routine. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const total = result.products.reduce((s, p) => s + p.price, 0);
    return (
      <div className="page-shell">
        <div className="page-intro">
          <div>
            <p className="eyebrow">Recommended based on your preferences</p>
            <h1>Your considered routine.</h1>
            <p>{result.guidanceNote}</p>
          </div>
          <Button
            type="button"
            disabled={addedToCart}
            onClick={() => {
              result.products.forEach((p) => addItem(p.id, 1));
              setAddedToCart(true);
            }}
          >
            {addedToCart ? "Added to bag" : `Add routine · ${formatNaira(total)}`}
          </Button>
        </div>
        <div className="panel mb-8 text-left">
          <h2 className="text-4xl">Morning</h2>
          <ol className="text-sm text-muted-foreground leading-7 mt-3 list-decimal pl-5">
            {result.morningSteps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <h2 className="text-4xl mt-8">Evening</h2>
          <ol className="text-sm text-muted-foreground leading-7 mt-3 list-decimal pl-5">
            {result.eveningSteps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
        <div className="product-grid">
          {result.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <RouteLink href="/shop" className="mt-8 inline-flex">
          Continue exploring
        </RouteLink>
      </div>
    );
  }

  return (
    <div className="quiz-shell">
      <aside className="quiz-aside">
        <p className="eyebrow">Guided consultation</p>
        <h1>Let’s listen to your skin.</h1>
        <p className="text-sm opacity-70 leading-6">
          Six thoughtful questions. Preference-based guidance only—not a medical diagnosis.
        </p>
        <div className="quiz-progress">
          {steps.map((label, i) => (
            <div className={i === step ? "active" : ""} key={label}>
              <i>{i < step ? <Check size={11} /> : i + 1}</i>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </aside>
      <section className="quiz-main">
        <p className="eyebrow">
          Question {step + 1} of {steps.length}
        </p>
        <h2>{questions[step]}</h2>
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <div className="quiz-options">
          {(options[step] ?? []).map((option, i) => {
            const Icon = stepIcons[i % stepIcons.length] ?? Droplets;
            return (
              <button
                type="button"
                className={`quiz-option ${answers[step] === option ? "selected" : ""}`}
                key={option}
                onClick={() => choose(option)}
              >
                <Icon size={22} />
                <h3>{option}</h3>
                <p>Choose this if it feels closest to your preference.</p>
              </button>
            );
          })}
        </div>
        <div className="quiz-nav">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
          >
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button type="button" disabled={!answers[step]} onClick={() => setStep(step + 1)}>
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!answers[step] || loading}
              onClick={() => void finish()}
            >
              {loading ? "Building routine…" : "See my routine"}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
