import { countryOptions } from "@/modules/start-smart/country-options";
import type { StartSmartProfileInput } from "@/modules/start-smart/profile-schema";

type ProfileFieldErrors = Partial<Record<keyof StartSmartProfileInput, string>>;
export type ProfileFormField =
  | "countryCode"
  | "stateCode"
  | "housing"
  | "incomePattern"
  | "dependents"
  | "pets";

type ProfileFormProps = {
  values: StartSmartProfileInput;
  onChange: <K extends keyof StartSmartProfileInput>(
    field: K,
    value: StartSmartProfileInput[K],
  ) => void;
  errors?: ProfileFieldErrors;
  fields?: ProfileFormField[];
  kicker?: string;
  title?: string;
  description?: string;
};

const sharedFieldClassName =
  "rounded-2xl border px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus-visible:border-yellow-300 focus-visible:ring-2 focus-visible:ring-yellow-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

function buildFieldClassName(hasError: boolean, surfaceClassName: string) {
  return `${sharedFieldClassName} ${surfaceClassName} ${
    hasError ? "border-rose-300/80 ring-1 ring-rose-300/40" : "border-white/10"
  }`;
}

function getDescribedByIds(field: keyof StartSmartProfileInput, hasError: boolean) {
  const ids = [`${field}-hint`];

  if (hasError) {
    ids.push(`${field}-error`);
  }

  return ids.join(" ");
}

export function ProfileForm({
  values,
  onChange,
  errors = {},
  fields = [
    "countryCode",
    "stateCode",
    "housing",
    "incomePattern",
    "dependents",
    "pets",
  ],
  kicker = "Fast profile",
  title = "Regional + household checks",
  description =
    "Required fields stay starred. Choose a supported country and use a 2- to 3-character region code so the local assumptions stay useful.",
}: ProfileFormProps) {
  const fieldSet = new Set<ProfileFormField>(fields);
  const selectedCountry = countryOptions.find((option) => option.code === values.countryCode) ?? null;

  return (
    <section className="rounded-[28px] border border-white/10 bg-black/20 p-6 backdrop-blur">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-yellow-200">{kicker}</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
        </div>
        <p className="max-w-2xl text-sm text-emerald-50/80">
          {description}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {fieldSet.has("countryCode") ? (
        <label className="grid gap-2 text-sm text-emerald-50/85">
          <span>
            Country <span aria-hidden="true">*</span>
          </span>
          <select
            aria-label="Country"
            aria-describedby={getDescribedByIds("countryCode", Boolean(errors.countryCode))}
            aria-invalid={Boolean(errors.countryCode)}
            required
            value={values.countryCode}
            onChange={(event) => {
              const nextCountryCode = event.target.value;
              const nextCountry = countryOptions.find((option) => option.code === nextCountryCode) ?? null;

              onChange("countryCode", nextCountryCode);
              onChange("stateCode", nextCountry?.regionExample ?? "");
            }}
            className={buildFieldClassName(Boolean(errors.countryCode), "bg-slate-950")}
          >
            <option value="">Select a country</option>
            {countryOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
          <span id="countryCode-hint" className="text-xs text-emerald-100/65">
            Choose one of the supported countries for regional seeding.
          </span>
          {errors.countryCode ? (
            <span id="countryCode-error" className="text-xs text-rose-200">
              {errors.countryCode}
            </span>
          ) : null}
        </label>
        ) : null}

        {fieldSet.has("stateCode") ? (
        <label className="grid gap-2 text-sm text-emerald-50/85">
          <span>
            State or region <span aria-hidden="true">*</span>
          </span>
          <input
            aria-label="State or region"
            aria-describedby={getDescribedByIds("stateCode", Boolean(errors.stateCode))}
            aria-invalid={Boolean(errors.stateCode)}
            autoCapitalize="characters"
            inputMode="text"
            maxLength={3}
            required
            value={values.stateCode}
            onChange={(event) =>
              onChange("stateCode", event.target.value.toUpperCase().slice(0, 3))
            }
            className={buildFieldClassName(Boolean(errors.stateCode), "bg-white/5")}
            placeholder="CA"
            spellCheck={false}
          />
          <span id="stateCode-hint" className="text-xs text-emerald-100/65">
            {selectedCountry
              ? `Use the supported code for ${selectedCountry.label}, like ${selectedCountry.regionExample}.`
              : "Select a country first, then enter its supported 2- or 3-character region code."}
          </span>
          {errors.stateCode ? (
            <span id="stateCode-error" className="text-xs text-rose-200">
              {errors.stateCode}
            </span>
          ) : null}
        </label>
        ) : null}

        {fieldSet.has("housing") ? (
        <label className="grid gap-2 text-sm text-emerald-50/85">
          Housing
          <select
            aria-invalid={Boolean(errors.housing)}
            value={values.housing}
            onChange={(event) =>
              onChange("housing", event.target.value as StartSmartProfileInput["housing"])
            }
            className={buildFieldClassName(Boolean(errors.housing), "bg-slate-950")}
          >
            <option value="living_with_family">Living with family</option>
            <option value="renting">Renting</option>
            <option value="owning">Owning</option>
            <option value="temporary">Temporary</option>
            <option value="housing_insecure">Housing insecure</option>
          </select>
        </label>
        ) : null}

        {fieldSet.has("incomePattern") ? (
        <label className="grid gap-2 text-sm text-emerald-50/85">
          Income pattern
          <select
            aria-invalid={Boolean(errors.incomePattern)}
            value={values.incomePattern}
            onChange={(event) =>
              onChange(
                "incomePattern",
                event.target.value as StartSmartProfileInput["incomePattern"],
              )
            }
            className={buildFieldClassName(Boolean(errors.incomePattern), "bg-slate-950")}
          >
            <option value="steady">Steady</option>
            <option value="variable">Variable</option>
            <option value="seasonal">Seasonal</option>
            <option value="none">None</option>
          </select>
        </label>
        ) : null}

        {fieldSet.has("dependents") ? (
        <label className="grid gap-2 text-sm text-emerald-50/85">
          Dependents
          <input
            aria-invalid={Boolean(errors.dependents)}
            type="number"
            min={0}
            value={values.dependents}
            onChange={(event) => onChange("dependents", Number(event.target.value))}
            className={buildFieldClassName(Boolean(errors.dependents), "bg-white/5")}
          />
        </label>
        ) : null}

        {fieldSet.has("pets") ? (
        <label className="grid gap-2 text-sm text-emerald-50/85">
          Pets
          <input
            aria-invalid={Boolean(errors.pets)}
            type="number"
            min={0}
            value={values.pets}
            onChange={(event) => onChange("pets", Number(event.target.value))}
            className={buildFieldClassName(Boolean(errors.pets), "bg-white/5")}
          />
        </label>
        ) : null}
      </div>
    </section>
  );
}
