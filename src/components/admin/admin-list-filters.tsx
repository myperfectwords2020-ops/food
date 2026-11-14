"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent } from "react";

import { Button } from "@/components/ui/button";

type Field = {
  name: string;
  label: string;
  type?: "search" | "select";
  options?: { value: string; label: string }[];
};

export function AdminListFilters({ fields }: { fields: Field[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = new URLSearchParams(params.toString());
    fields.forEach((f) => {
      const v = String(fd.get(f.name) ?? "").trim();
      if (v) next.set(f.name, v);
      else next.delete(f.name);
    });
    next.delete("page");
    const q = next.toString();
    router.push(`${window.location.pathname}${q ? `?${q}` : ""}`);
  };

  return (
    <form className="panel mb-4 flex flex-wrap gap-3 items-end" onSubmit={onSubmit}>
      {fields.map((field) => (
        <label key={field.name} className="field min-w-[140px] flex-1">
          <span>{field.label}</span>
          {field.type === "select" && field.options ? (
            <select name={field.name} defaultValue={params.get(field.name) ?? ""}>
              <option value="">All</option>
              {field.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="search"
              name={field.name}
              defaultValue={params.get(field.name) ?? ""}
              placeholder={`Search ${field.label.toLowerCase()}`}
            />
          )}
        </label>
      ))}
      <Button type="submit" size="sm">
        Apply
      </Button>
    </form>
  );
}
