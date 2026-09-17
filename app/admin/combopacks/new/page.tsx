import { ComboPackCreateForm } from "@/components/admin/combo-pack-create-form";

export default function NewComboPackPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 font-display text-xl font-semibold text-ink">New Combo Pack</h1>
      <p className="mb-4 text-sm text-muted">
        Creates the pack with three empty tiers (Small, Medium, Large) — add items to each on the next screen.
      </p>
      <ComboPackCreateForm />
    </div>
  );
}
