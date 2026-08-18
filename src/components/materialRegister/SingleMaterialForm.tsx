import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JOURNEY_STATUS_LABEL, type EntryType, type JourneyStatus } from "@/types/materialPrioritisation";
import { CURRENT_USER, useRegister } from "@/components/materialRegister/registerStore";
import { cleanTags, tagVocabulary } from "@/components/materialRegister/tags";
import {
  AutocompleteField,
  Field,
  LABEL,
  NumberField,
  TagInput,
} from "@/components/materialRegister/entryFields";
import {
  CERTIFICATIONS,
  ENTRY_TYPES,
  SEEDED_CLASSES,
  blankMaterial,
  computeGhg,
  computeSpend,
  emptyRequirements,
  lookupCas,
  provenanceOf,
  requirementsOrNull,
  showsReplacedPanel,
  toNullString,
  type OntologyResult,
} from "@/components/materialRegister/materialEntry";
import { X } from "lucide-react";

const STATUS_ORDER: JourneyStatus[] = [
  "under_evaluation",
  "go",
  "go_with_conditions",
  "hold",
  "no_go",
];

interface Props {
  onDone: (savedName: string, again: boolean) => void;
}

export const SingleMaterialForm: React.FC<Props> = ({ onDone }) => {
  const { data, addMaterials } = useRegister();

  const [entryType, setEntryType] = useState<EntryType>("drop_in");
  const [name, setName] = useState("");
  const [cas, setCas] = useState("");
  const [lookup, setLookup] = useState<OntologyResult | null>(null);
  const [lookupAccepted, setLookupAccepted] = useState(false);
  const [materialClass, setMaterialClass] = useState<string | null>(null);
  const [customerIds, setCustomerIds] = useState<string[]>([""]);
  const [tags, setTags] = useState<string[]>([]);
  const [applications, setApplications] = useState<string[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [owner, setOwner] = useState<string | null>(null);
  const [status, setStatus] = useState<JourneyStatus>("under_evaluation");

  // Panel A — the material being replaced
  const [volume, setVolume] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [spend, setSpend] = useState<number | null>(null);
  const [spendOverridden, setSpendOverridden] = useState(false);
  const [factor, setFactor] = useState<number | null>(null);
  const [ghg, setGhg] = useState<number | null>(null);
  const [ghgOverridden, setGhgOverridden] = useState(false);
  const [supplierCount, setSupplierCount] = useState<number | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [boundary, setBoundary] = useState<string | null>(null);
  const [dataBasis, setDataBasis] = useState<string | null>(null);

  // Panel B — requirements for the replacement
  const [req, setReq] = useState(emptyRequirements());
  const patchReq = <K extends keyof typeof req>(k: K, v: (typeof req)[K]) =>
    setReq((r) => ({ ...r, [k]: v }));

  const suggestions = useMemo(() => {
    const uniq = (vals: (string | null)[]) =>
      [...new Set(vals.filter((v): v is string => Boolean(v)))].sort((a, b) => a.localeCompare(b));
    return {
      tags: tagVocabulary(data).map((t) => t.tag),
      applications: uniq(data.flatMap((m) => m.application_categories)),
      products: uniq(data.flatMap((m) => m.product_categories)),
      owners: uniq(data.map((m) => m.owner)),
      countries: uniq(data.flatMap((m) => m.supplier_countries)),
      classes: SEEDED_CLASSES,
    };
  }, [data]);

  const derivedSpend = spendOverridden ? spend : computeSpend(volume, price);
  const derivedGhg = ghgOverridden ? ghg : computeGhg(volume, factor);
  const showPanelA = showsReplacedPanel(entryType);

  const runLookup = () => {
    const trimmed = cas.trim();
    if (!trimmed) return setLookup(null);
    const result = lookupCas(trimmed);
    setLookup(result);
    setLookupAccepted(false);
    if (result.material_class && !materialClass) {
      setMaterialClass(result.material_class);
      setLookupAccepted(true);
    }
  };

  const reset = () => {
    setName("");
    setCas("");
    setLookup(null);
    setMaterialClass(null);
    setCustomerIds([""]);
    setTags([]);
    setApplications([]);
    setProducts([]);
    setVolume(null);
    setPrice(null);
    setSpend(null);
    setSpendOverridden(false);
    setFactor(null);
    setGhg(null);
    setGhgOverridden(false);
    setSupplierCount(null);
    setCountries([]);
    setBoundary(null);
    setDataBasis(null);
    setReq(emptyRequirements());
  };

  const save = (again: boolean) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const entered = provenanceOf("entered", CURRENT_USER);
    const provenance: Record<string, ReturnType<typeof provenanceOf>> = { entry_type: entered };
    const markEntered = (field: string, present: boolean) => {
      if (present) provenance[field] = entered;
    };
    markEntered("annual_volume", volume !== null);
    markEntered("unit_price", price !== null);
    markEntered("ghg_emission_factor", factor !== null);
    markEntered("supplier_count", supplierCount !== null);
    markEntered("material_class", Boolean(materialClass));
    markEntered("owner", Boolean(owner));
    markEntered("journey_status", true);
    if (derivedSpend !== null)
      provenance.annual_spend = spendOverridden
        ? entered
        : provenanceOf("computed", "annual volume x unit price");
    if (derivedGhg !== null)
      provenance.ghg_contribution = ghgOverridden
        ? entered
        : provenanceOf("computed", "emission factor x annual volume");

    const draft = {
      ...blankMaterial(entryType),
      name: trimmedName,
      cas_number: toNullString(cas),
      material_class: toNullString(materialClass),
      customer_material_ids: customerIds.map((v) => v.trim()).filter(Boolean),
      tags: cleanTags(tags),
      application_categories: applications,
      product_categories: products,
      owner: toNullString(owner),
      journey_status: status,
      annual_volume: showPanelA ? volume : null,
      unit_price: showPanelA ? price : null,
      annual_spend: showPanelA ? derivedSpend : null,
      ghg_emission_factor: showPanelA ? factor : null,
      ghg_contribution: showPanelA ? derivedGhg : null,
      ghg_boundary: showPanelA ? toNullString(boundary) : null,
      ghg_data_basis: showPanelA ? toNullString(dataBasis) : null,
      supplier_count: showPanelA ? supplierCount : null,
      supplier_countries: showPanelA ? countries : [],
      requirements: requirementsOrNull({ ...req, notes: toNullString(req.notes) }),
      provenance,
    };

    addMaterials([draft], { batchOrigin: "real_transition", source: CURRENT_USER });
    if (again) reset();
    onDone(trimmedName, again);
  };

  return (
    <div className="space-y-5">
      <p className="rounded-md border border-border bg-muted/40 px-2 py-1.5 text-[11px] text-muted-foreground">
        Add what you have. Missing figures show as unranked.
      </p>

      {/* Step 1 */}
      <section className="space-y-2">
        <h3 className={LABEL}>1 — What kind of entry</h3>
        <div className="grid gap-2 md:grid-cols-3">
          {ENTRY_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setEntryType(t.id)}
              aria-pressed={entryType === t.id}
              className={cn(
                "rounded-md border p-2 text-left transition-colors",
                entryType === t.id
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-muted-foreground/40",
              )}
            >
              <div className="text-[11px] font-medium text-foreground">{t.label}</div>
              <div className="text-[10px] leading-tight text-muted-foreground">{t.description}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Step 2 */}
      <section className="space-y-3 border-t border-border pt-4">
        <h3 className={LABEL}>2 — Identity</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Material name"
              className="h-7 text-[11px]"
            />
          </Field>
          <div className="space-y-1">
            <span className={LABEL}>CAS number</span>
            <Input
              value={cas}
              onChange={(e) => setCas(e.target.value)}
              onBlur={runLookup}
              placeholder="e.g. 57-55-6"
              className="h-7 font-mono text-[11px]"
            />
            {lookup && (
              <div className="rounded-sm border border-dashed border-border bg-muted/30 px-1.5 py-1 text-[10px] leading-tight text-muted-foreground">
                {lookup.material_class ? (
                  <>
                    <span className="font-medium text-foreground/80">
                      {lookup.material_class}
                    </span>{" "}
                    — Derived by VCG — correct if wrong.
                    {!lookup.found && " CAS not found in the ontology, so this is a proposal only."}
                    {!lookupAccepted && (
                      <button
                        type="button"
                        onClick={() => {
                          setMaterialClass(lookup.material_class);
                          setLookupAccepted(true);
                        }}
                        className="ml-1 underline decoration-dotted underline-offset-2 hover:text-foreground"
                      >
                        Use it
                      </button>
                    )}
                  </>
                ) : (
                  "No ontology match — classify it yourself below."
                )}
              </div>
            )}
          </div>

          <AutocompleteField
            label="Material class"
            value={materialClass}
            onChange={(v) => {
              setMaterialClass(v);
              setLookupAccepted(false);
            }}
            suggestions={suggestions.classes}
            placeholder="Unclassified"
          />
          <TagInput
            label="Tags"
            values={tags}
            onChange={(v) => setTags(cleanTags(v))}
            suggestions={suggestions.tags}
            placeholder="e.g. Solvents"
            hint="Free text, your own labels. Nothing is derived from tags."
          />

          <div className="space-y-1">
            <span className={LABEL}>Customer material IDs</span>
            <div className="space-y-1">
              {customerIds.map((v, i) => (
                <div key={i} className="flex items-center gap-1">
                  <Input
                    value={v}
                    onChange={(e) =>
                      setCustomerIds((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))
                    }
                    placeholder="SKU / internal code"
                    className="h-7 font-mono text-[11px]"
                  />
                  {customerIds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCustomerIds((prev) => prev.filter((_, j) => j !== i))}
                    >
                      <X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCustomerIds((prev) => [...prev, ""])}
                className="text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
              >
                Add another ID
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AutocompleteField
              label="Owner"
              value={owner}
              onChange={setOwner}
              suggestions={suggestions.owners}
              placeholder="Unassigned"
            />
            <div className="space-y-1">
              <span className={LABEL}>Journey status</span>
              <Select value={status} onValueChange={(v) => setStatus(v as JourneyStatus)}>
                <SelectTrigger className="h-7 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s} className="text-[11px]">
                      {JOURNEY_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TagInput
            label="Application categories"
            values={applications}
            onChange={setApplications}
            suggestions={suggestions.applications}
          />
          <TagInput
            label="Product categories"
            values={products}
            onChange={setProducts}
            suggestions={suggestions.products}
          />
        </div>
      </section>

      {/* Step 3 */}
      <section className="space-y-3 border-t border-border pt-4">
        <h3 className={LABEL}>3 — Data they already hold</h3>
        <div className={cn("grid gap-4", showPanelA ? "lg:grid-cols-2" : "grid-cols-1")}>
          {showPanelA && (
            <div className="space-y-3 rounded-md border border-border p-3">
              <div className="text-[11px] font-medium text-foreground">Material being replaced</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberField label="Annual volume" unit="t/yr" value={volume} onChange={setVolume} />
                <NumberField label="Unit price" unit="EUR/kg" value={price} onChange={setPrice} />
                <NumberField
                  label="Annual spend"
                  unit="EUR"
                  value={derivedSpend}
                  computed
                  overridden={spendOverridden}
                  onChange={(v) => {
                    setSpend(v);
                    setSpendOverridden(v !== null);
                  }}
                />
                <NumberField
                  label="GHG emission factor"
                  unit="kgCO2e/kg"
                  value={factor}
                  onChange={setFactor}
                />
                <NumberField
                  label="GHG contribution"
                  unit="tCO2e/yr"
                  value={derivedGhg}
                  computed
                  overridden={ghgOverridden}
                  onChange={(v) => {
                    setGhg(v);
                    setGhgOverridden(v !== null);
                  }}
                />
                <NumberField label="Supplier count" value={supplierCount} onChange={setSupplierCount} />
              </div>
              <TagInput
                label="Supplier countries"
                values={countries}
                onChange={setCountries}
                suggestions={suggestions.countries}
                placeholder="DE, BE, US…"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="GHG boundary">
                  <Input
                    value={boundary ?? ""}
                    onChange={(e) => setBoundary(e.target.value || null)}
                    placeholder="e.g. Cradle-to-gate (A1-A3)"
                    className="h-7 text-[11px]"
                  />
                </Field>
                <Field label="GHG data basis">
                  <Input
                    value={dataBasis ?? ""}
                    onChange={(e) => setDataBasis(e.target.value || null)}
                    placeholder="e.g. Supplier-specific"
                    className="h-7 text-[11px]"
                  />
                </Field>
              </div>
            </div>
          )}

          <div className="space-y-3 rounded-md border border-border p-3">
            <div className="text-[11px] font-medium text-foreground">Requirements for the replacement</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberField
                label="Target volume"
                unit="t/yr"
                value={req.target_volume}
                onChange={(v) => patchReq("target_volume", v)}
              />
              <NumberField
                label="Price ceiling"
                unit="EUR/kg"
                value={req.price_ceiling}
                onChange={(v) => patchReq("price_ceiling", v)}
              />
              <NumberField
                label="GHG reduction target"
                unit="%"
                value={req.ghg_reduction_target}
                onChange={(v) => patchReq("ghg_reduction_target", v)}
              />
              <Field label="Earliest need date">
                <Input
                  type="date"
                  value={req.earliest_need_date ?? ""}
                  onChange={(e) => patchReq("earliest_need_date", e.target.value || null)}
                  className="h-7 text-[11px]"
                />
              </Field>
            </div>
            <TagInput
              label="Required certifications"
              values={req.required_certifications}
              onChange={(v) => patchReq("required_certifications", v)}
              suggestions={CERTIFICATIONS}
            />
            <Field label="Notes">
              <Textarea
                value={req.notes ?? ""}
                onChange={(e) => patchReq("notes", e.target.value || null)}
                rows={3}
                className="text-[11px]"
                placeholder="Anything the team should know"
              />
            </Field>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Button size="sm" className="h-7 text-[11px]" disabled={!name.trim()} onClick={() => save(false)}>
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px]"
          disabled={!name.trim()}
          onClick={() => save(true)}
        >
          Save and add another
        </Button>
        <span className="text-[10px] text-muted-foreground">
          Only the name is required. Everything else can follow later.
        </span>
      </div>
    </div>
  );
};

export default SingleMaterialForm;
