import type { StartSmartProfileInput } from "@/modules/start-smart/profile-schema";

type ProfileFormProps = {
  values: StartSmartProfileInput;
  onChange: <K extends keyof StartSmartProfileInput>(
    field: K,
    value: StartSmartProfileInput[K],
  ) => void;
};

export function ProfileForm({ values, onChange }: ProfileFormProps) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-black/20 p-6 backdrop-blur">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-emerald-50/85">
          Country
          <input
            aria-label="Country"
            value={values.countryCode}
            onChange={(event) => onChange("countryCode", event.target.value.toUpperCase())}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-0 placeholder:text-white/35"
            placeholder="US"
          />
        </label>

        <label className="grid gap-2 text-sm text-emerald-50/85">
          State
          <input
            aria-label="State"
            value={values.stateCode}
            onChange={(event) => onChange("stateCode", event.target.value.toUpperCase())}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-0 placeholder:text-white/35"
            placeholder="CA"
          />
        </label>

        <label className="grid gap-2 text-sm text-emerald-50/85">
          Housing
          <select
            value={values.housing}
            onChange={(event) => onChange("housing", event.target.value as StartSmartProfileInput["housing"])}
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
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
            value={values.incomePattern}
            onChange={(event) =>
              onChange(
                "incomePattern",
                event.target.value as StartSmartProfileInput["incomePattern"],
              )
            }
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
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
            type="number"
            min={0}
            value={values.dependents}
            onChange={(event) => onChange("dependents", Number(event.target.value))}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
          />
        </label>

        <label className="grid gap-2 text-sm text-emerald-50/85">
          Pets
          <input
            type="number"
            min={0}
            value={values.pets}
            onChange={(event) => onChange("pets", Number(event.target.value))}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
          />
        </label>
      </div>
    </section>
  );
}