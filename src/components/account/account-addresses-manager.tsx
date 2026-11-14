"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  deleteAccountAddressAction,
  saveAccountAddressAction,
  setDefaultAccountAddressAction,
} from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import type { AccountAddress } from "@/types/commerce";

const emptyForm = {
  label: "Home",
  firstName: "",
  lastName: "",
  phone: "",
  street: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "NG",
  isDefault: false,
};

export function AccountAddressesManager({ addresses }: { addresses: AccountAddress[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(addresses.length === 0);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (address: AccountAddress) => {
    setEditingId(address.id);
    setForm({
      label: address.label,
      firstName: address.firstName ?? "",
      lastName: address.lastName ?? "",
      phone: address.phone ?? "",
      street: address.street,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode ?? "",
      country: address.country ?? "NG",
      isDefault: address.isDefault,
    });
    setShowForm(true);
  };

  const save = async () => {
    const payload = {
      ...form,
      ...(editingId ? { id: editingId } : {}),
    };
    const result = await saveAccountAddressAction(payload);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Address saved.");
    setShowForm(false);
    router.refresh();
  };

  return (
    <div className="grid gap-4">
      {addresses.map((address) => (
        <div className="panel" key={address.id}>
          <p className="eyebrow">{address.label}</p>
          <p className="text-sm leading-7">
            {[address.firstName, address.lastName].filter(Boolean).join(" ")}
            <br />
            {address.street}
            {address.line2 ? (
              <>
                <br />
                {address.line2}
              </>
            ) : null}
            <br />
            {address.city}, {address.state} {address.postalCode}
            <br />
            {address.phone}
          </p>
          {address.isDefault ? (
            <p className="text-xs font-bold mt-2 text-primary">Default address</p>
          ) : (
            <Button
              type="button"
              variant="link"
              className="mt-2 h-auto p-0 text-xs"
              onClick={async () => {
                const result = await setDefaultAccountAddressAction(address.id);
                if (!result.ok) toast.error(result.error);
                else {
                  toast.success("Default address updated.");
                  router.refresh();
                }
              }}
            >
              Set as default
            </Button>
          )}
          <div className="flex gap-2 mt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => startEdit(address)}>
              Edit
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={async () => {
                const result = await deleteAccountAddressAction(address.id);
                if (!result.ok) toast.error(result.error);
                else {
                  toast.success("Address removed.");
                  router.refresh();
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}

      {showForm ? (
        <div className="panel form-grid">
          {(
            [
              ["label", "Label"],
              ["firstName", "First name"],
              ["lastName", "Last name"],
              ["phone", "Phone"],
              ["street", "Street address"],
              ["line2", "Apartment, suite (optional)"],
              ["city", "City"],
              ["state", "State"],
              ["postalCode", "Postal code"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className={`field ${key === "street" || key === "line2" ? "full" : ""}`}
            >
              <span>{label}</span>
              <input
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm full">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            />
            Default address
          </label>
          <div className="flex gap-2 full">
            <Button type="button" onClick={() => void save()}>
              Save address
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={startCreate}>
          Add address
        </Button>
      )}
    </div>
  );
}
