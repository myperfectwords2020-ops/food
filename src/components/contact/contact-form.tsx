"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { submitContactLeadAction } from "@/app/actions/crm";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().max(40).optional(),
  message: z.string().min(10, "Please share a few more details (at least 10 characters)"),
  website: z.string().max(0).optional(),
});

type Values = z.infer<typeof schema>;

const defaultValues: Values = {
  name: "",
  email: "",
  phone: "",
  message: "",
  website: "",
};

export function ContactForm() {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    setError,
    reset,
  } = form;

  return (
    <form
      className="gc-contact-form"
      onSubmit={handleSubmit(async (values) => {
        const result = await submitContactLeadAction(values);
        if (!result.ok) {
          setError("message", { message: result.error });
          return;
        }
        reset(defaultValues);
      })}
      noValidate
    >
      <h2 className="gc-contact-form-title">Send a message</h2>

      {isSubmitSuccessful ? (
        <p className="gc-contact-success" role="status">
          Thank you—we received your message and will respond shortly.
        </p>
      ) : null}

      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="gc-contact-honeypot"
        aria-hidden
        {...register("website")}
      />

      <div className="gc-contact-field-row">
        <div className="gc-contact-field">
          <label htmlFor="contact-name">Name</label>
          <input
            id="contact-name"
            className="gc-contact-input"
            autoComplete="name"
            placeholder="Your name"
            required
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            {...register("name")}
          />
          {errors.name?.message ? (
            <span id="contact-name-error" className="gc-contact-error" role="alert">
              {errors.name.message}
            </span>
          ) : null}
        </div>
        <div className="gc-contact-field">
          <label htmlFor="contact-email">Email</label>
          <input
            id="contact-email"
            className="gc-contact-input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            {...register("email")}
          />
          {errors.email?.message ? (
            <span id="contact-email-error" className="gc-contact-error" role="alert">
              {errors.email.message}
            </span>
          ) : null}
        </div>
      </div>

      <div className="gc-contact-field">
        <label htmlFor="contact-phone">Phone (optional)</label>
        <input
          id="contact-phone"
          className="gc-contact-input"
          type="tel"
          autoComplete="tel"
          placeholder="+234 800 000 0000"
          {...register("phone")}
        />
      </div>

      <div className="gc-contact-field">
        <label htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          className="gc-contact-input gc-contact-textarea"
          rows={6}
          placeholder="Tell us about your order, delivery question, or feedback…"
          required
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={
            errors.message ? "contact-message-error contact-message-hint" : "contact-message-hint"
          }
          {...register("message")}
        />
        {errors.message?.message ? (
          <span id="contact-message-error" className="gc-contact-error" role="alert">
            {errors.message.message}
          </span>
        ) : null}
        <p id="contact-message-hint" className="gc-contact-hint">
          Your message is sent securely to our team. We never share your details for marketing
          without consent.
        </p>
      </div>

      <button
        type="submit"
        className="gc-btn gc-btn-green gc-contact-submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
