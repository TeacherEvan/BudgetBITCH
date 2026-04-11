import type { StartSmartProfileInput } from "@/modules/start-smart/profile-schema";
import {
  getCityOptions,
  getCountryOptions,
  getProvinceOptions,
  hasCityOptions,
} from "@/modules/start-smart/location-catalog";

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
  "rounded-2xl border px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus-visible:border-yellow-300 focus-visible:ring-2 focus-visible:ring-yellow-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

function buildFieldClassName(hasError: boolean, surfaceClassName: string) {
  return [
    sharedFieldClassName,
    surfaceClassName,
    hasError ? "border-rose-300/80 ring-1 ring-rose-300/40" : "border-white/10",
  ].join(" ");
}

function getDescribedByIds(field: keyof StartSmartProfileInput, hasError: boolean) {
  const ids = [field + "-hint"];

  if (hasError) {
    ids.push(field + "-error");
  }

  return ids.join(" ");
}

export function ProfileForm({ values, onChange, errors = {} }: ProfileFormProps) {
  const countryOptions = getCountryOptions();
  const provinceOptions = values.countryCode ? getProvinceOptions(values.countryCode) : [];
  const cityOptions =
    values.countryCode && values.stateCode ? getCityOptions(values.countryCode, values.stateCode) : [];
  const showCitySelect = hasCityOptions(values.countryCode, values.stateCode) && Boolean(values.stateCode);

  return (
    <section className="rounded-[28px] border border-white/10 bg-black/20 p-6 backdrop-blur">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-yellow-200">Fast profile</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Regional + household checks</h2>
        </div>
        <p className="max-w-2xl text-sm text-emerald-50/80">
          Required fields stay starred. Pick a country first, then the matching province or state.
          City options appear only for the US and China big-city paths.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-emerald-50/85">
          <span>
            Country <span aria-hidden="true">*</span>
          </span>
          <select
            aria-label="Country"
            aria-describedby={getDescribedByIds("countryCode", Boolean(errors.countryCode))}
            aria-invalid={Boolean(errors.countryCode)}
            value={values.countryCode}
            onChange={(event) => onChange("countryCode", event.target.value.toUpperCase())}
            className={buildFieldClassName(Boolean(errors.countryCode), "bg-slate-950")}
          >
            <option value="">Select a country</option>
            {countryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span id="countryCode-hint" className="text-xs text-emerald-100/65">
            Choose a country to unlock provinces and cities.
          </span>
          {errors.countryCode ? (
            <span id="countryCode-error" className="text-xs text-rose-200">
              {errors.countryCode}
            </span>
          ) : null}
        </label>

        <label className="grid gap-2 text-sm text-emerald-50/85">
          <span>
            Province or state <span aria-hidden="true">*</span>
          </span>
          <select
            aria-label="Province or state"
            aria-describedby={getDescribedByIds("stateCode", Boolean(errors.stateCode))}
            aria-invalid={Boolean(errors.stateCode)}
            disabled={!values.countryCode}
            value={values.stateCode}
            onChange={(event) => onChange("stateCode", event.target.value.toUpperCase())}
            className={buildFieldClassName(Boolean(errors.stateCode), "bg-slate-950")}
          >
            <option value="">{values.countryCode ? "Select a province or state" : "Choose a country first"}</option>
            {provinceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span id="stateCode-hint" className="text-xs text-emerald-100/65">
            {values.countryCode
              ? "Choose the province or state that matches the selected country."
              : "Choose a country first."}
          </span>
          {errors.stateCode ? (
            <span id="stateCode-error" className="text-xs text-rose-200">
              {errors.stateCode}
            </span>
          ) : null}
        </label>

        {showCitySelect ? (
          <label className="grid gap-2 text-sm text-emerald-50/85 md:col-span-2">
            <span>City</span>
            <select
              aria-label="City"
              aria-describedby={getDescribedByIds("cityCode", Boolean(errors.cityCode))}
              aria-invalid={Boolean(errors.cityCode)}
              disabled={!values.stateCode}
              value={values.cityCode ?? ""}
              onChange={(event) => onChange("cityCode", event.target.value)}
              className={buildFieldClassName(Boolean(errors.cityCode), "bg-slate-950")}
            >
              <option value="">Select a city</option>
              {cityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span id="cityCode-hint" className="text-xs text-emerald-100/65">
              Shown only for the US and China big-city paths.
            </span>
            {errors.cityCode ? (
              <span id="cityCode-error" className="text-xs text-rose-200">
                {errors.cityCode}
              </span>
            ) : null}
          </label>
        ) : null}

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
      </div>
    </section>
  );
}
