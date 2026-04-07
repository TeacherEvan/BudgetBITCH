import type { StartSmartProfileInput } from "@/modules/start-smart/profile-schema";

type ProfileFieldErrors = Partial<Record<keyof StartSmartProfileInput, string>>;

type ProfileFormProps = {
  values: StartSmartProfileInput;
  onChange: <K extends keyof StartSmartProfileInput>(
    field: K,
    value: StartSmartProfileInput[K],
  ) => void;
  errors?: ProfileFieldErrors;
};

const sharedFieldClassName =
  "bb-start-smart-field px-4 py-3 outline-none transition";

function buildFieldClassName() {
  return sharedFieldClassName;
}

function getDescribedByIds(field: keyof StartSmartProfileInput, hasError: boolean) {
  const ids = [`${field}-hint`];

  if (hasError) {
    ids.push(`${field}-error`);
  }

  return ids.join(" ");
}

export function ProfileForm({ values, onChange, errors = {} }: ProfileFormProps) {
  return (
    <section className="bb-start-smart-form p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="bb-start-smart-eyebrow">Fast profile</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Regional + household checks</h2>
        </div>
        <p className="bb-start-smart-copy-soft max-w-2xl text-sm">
          Required fields stay starred. Use a 2-letter country code and 2- to 3-letter region code
          so the local assumptions stay useful.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="bb-start-smart-copy grid gap-2 text-sm">
          <span>
            Country <span aria-hidden="true">*</span>
          </span>
          <input
            aria-label="Country"
            aria-describedby={getDescribedByIds("countryCode", Boolean(errors.countryCode))}
            aria-invalid={Boolean(errors.countryCode)}
            autoCapitalize="characters"
            inputMode="text"
            maxLength={2}
            required
            value={values.countryCode}
            onChange={(event) =>
              onChange("countryCode", event.target.value.toUpperCase().slice(0, 2))
            }
            className={buildFieldClassName()}
            placeholder="US"
            spellCheck={false}
          />
          <span id="countryCode-hint" className="bb-start-smart-copy-soft text-xs">
            Use a 2-letter country code like US.
          </span>
          {errors.countryCode ? (
            <span id="countryCode-error" className="text-xs text-rose-200">
              {errors.countryCode}
            </span>
          ) : null}
        </label>

        <label className="bb-start-smart-copy grid gap-2 text-sm">
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
            className={buildFieldClassName()}
            placeholder="CA"
            spellCheck={false}
          />
          <span id="stateCode-hint" className="bb-start-smart-copy-soft text-xs">
            Use a 2- or 3-letter state or region code like CA.
          </span>
          {errors.stateCode ? (
            <span id="stateCode-error" className="text-xs text-rose-200">
              {errors.stateCode}
            </span>
          ) : null}
        </label>

        <label className="bb-start-smart-copy grid gap-2 text-sm">
          Housing
          <select
            aria-invalid={Boolean(errors.housing)}
            value={values.housing}
            onChange={(event) =>
              onChange("housing", event.target.value as StartSmartProfileInput["housing"])
            }
            className={buildFieldClassName()}
          >
            <option value="living_with_family">Living with family</option>
            <option value="renting">Renting</option>
            <option value="owning">Owning</option>
            <option value="temporary">Temporary</option>
            <option value="housing_insecure">Housing insecure</option>
          </select>
        </label>

        <label className="bb-start-smart-copy grid gap-2 text-sm">
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
            className={buildFieldClassName()}
          >
            <option value="steady">Steady</option>
            <option value="variable">Variable</option>
            <option value="seasonal">Seasonal</option>
            <option value="none">None</option>
          </select>
        </label>

        <label className="bb-start-smart-copy grid gap-2 text-sm">
          Dependents
          <input
            aria-invalid={Boolean(errors.dependents)}
            type="number"
            min={0}
            value={values.dependents}
            onChange={(event) => onChange("dependents", Number(event.target.value))}
            className={buildFieldClassName()}
          />
        </label>

        <label className="bb-start-smart-copy grid gap-2 text-sm">
          Pets
          <input
            aria-invalid={Boolean(errors.pets)}
            type="number"
            min={0}
            value={values.pets}
            onChange={(event) => onChange("pets", Number(event.target.value))}
            className={buildFieldClassName()}
          />
        </label>
      </div>
    </section>
  );
}
