import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, Pencil } from "lucide-react";
import { getPosition, reverseGeocode } from "../../api/geocode";
import { toast } from "sonner";
import { getErrorMessage, extractFieldErrors } from "../../api/client";
import { useCreateAddress, useUpdateAddress } from "../../queries/addresses";
import FormField from "../form/FormField";
import SelectField from "../form/SelectField";
import { allCitiesQuery, barangaysQuery, provincesQuery, useAllCities, useBarangays, useProvinces } from "../../queries/psgc";
import { useQueryClient } from "@tanstack/react-query";
import { findMatch } from "../../lib/addressMatch";
import { FormModal } from "../ui/AppModal";

const initialValues = (address) => ({
    recipientName: address?.recipientName ?? "",
    contactNumber: address?.contactNumber ?? "",
    addressLine: address?.addressLine ?? "",
    barangay: address?.barangay ?? "",
    city: address?.city ?? "",
    province: address?.province ?? "",
    postalCode: address?.postalCode ?? "",
    isDefault: address?.isDefault ?? false,
});

function validate(v) {
    const errors = {};

    if (!v.recipientName) errors.recipientName = "Recipient name is required.";
    if (!/^(09|\+639)\d{9}$/.test(v.contactNumber.replace(/[\s-]/g, ""))) {
        errors.contactNumber = "Enter a valid PH mobile number, e.g. 09123456789.";
    }
    if (!v.addressLine) errors.addressLine = "Street address is required.";
    if (!v.barangay) errors.barangay = "Barangay is required.";
    if (!v.city) errors.city = "City is required.";
    if (!v.province) errors.province = "Province is required.";
    if (!/^\d{4}$/.test(v.postalCode)) errors.postalCode = "Enter a 4-digit postal code.";

    return errors;
}

const findCode = (list, name) =>
    name ? (list?.find((o) => o.name.toLowerCase() === name.toLowerCase())?.code ?? "") : "";
const findName = (list, code) => list?.find((o) => o.code === code)?.name ?? "";

export default function AddressModal({ address, onClose }) {
    const bodyRef = useRef(null);
    const isEdit = Boolean(address);

    const [values, setValues] = useState(() => initialValues(address));
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");

    const queryClient = useQueryClient();
    const [locating, setLocating] = useState(false);

    async function fillFromLocation() {
        setLocating(true);
        setFormError("");

        try {
            const { latitude, longitude, accuracy } = await getPosition();
            const a = await reverseGeocode(latitude, longitude);
            console.log({ latitude, longitude, accuracy }, a);

            const provinceNames = [a.province, a.state_district, a.state];
            const cityNames = [a.city, a.town, a.municipality, a.city_district];
            const barangayNames = [a.suburb, a.neighbourhood, a.quarter, a.village, a.hamlet];
            const street = [a.house_number, a.road].filter(Boolean).join(" ");
            const postalCode = String(a.postcode ?? "").match(/\b\d{4}\b/)?.[0] ?? "";

            let found = { provinceCode: "", province: "", cityCode: "", city: "", barangayCode: "", barangay: "" };

            try {
                const [provinceList, cityList] = await Promise.all([
                    queryClient.fetchQuery(provincesQuery),
                    queryClient.fetchQuery(allCitiesQuery),
                ]);

                // use the province as a hint to pick the right city when names repeat ("San Jose")
                const provinceGuess = findMatch(provinceList, provinceNames);
                const inProvince = provinceGuess ? cityList.filter((c) => c.provinceCode === provinceGuess.code) : [];
                const city = findMatch(inProvince, cityNames) ?? findMatch(cityList, cityNames);

                // the city decides the final province (this also handles Metro Manila)
                const province = city ? provinceList.find((p) => p.code === city.provinceCode) : provinceGuess;

                let barangay;
                if (city) {
                    const barangayList = await queryClient.fetchQuery(barangaysQuery(city.code));
                    barangay = findMatch(barangayList, barangayNames);
                }

                found = {
                    provinceCode: province?.code ?? "", province: province?.name ?? "",
                    cityCode: city?.code ?? "", city: city?.name ?? "",
                    barangayCode: barangay?.code ?? "", barangay: barangay?.name ?? "",
                };
            } catch {
                // PSGC is down: fall back to the raw names so the text inputs still fill
                found.province = provinceNames.find(Boolean) ?? "";
                found.city = cityNames.find(Boolean) ?? "";
                found.barangay = barangayNames.find(Boolean) ?? "";
            }

            setValues((c) => ({
                ...c,
                ...found,
                addressLine: street || c.addressLine,
                postalCode: postalCode || c.postalCode,
            }));
            setErrors({});

            toast.success(
                found.city && found.barangay
                    ? "Address filled from your location. Please check it."
                    : "Partly filled from your location. Please complete the rest."
            );
        } catch (err) {
            setFormError(err.message);
        } finally {
            setLocating(false);
        }
    }

    // location datas from thrid party psgc
    const provinces = useProvinces();
    const allCities = useAllCities();

    const provinceCode = values.provinceCode || findCode(provinces.data, values.province);

    //province chosen -> only its cities. No province -> every city, labelled with its province.
    const cityOptions = useMemo(() => {
        const list = allCities.data ?? [];
        const source = provinceCode ? list.filter((c) => c.provinceCode === provinceCode) : list;

        return source.map((c) => {
            if (provinceCode) return { code: c.code, name: c.name };
            const provinceName = findName(provinces.data, c.provinceCode);
            return { code: c.code, name: provinceName ? `${c.name}, ${provinceName}` : c.name };
        });
    }, [allCities.data, provinces.data, provinceCode]);

    const cityCode =
        values.cityCode ||
        (values.city
            ? (allCities.data?.find(
                (c) =>
                    c.name.toLowerCase() === values.city.toLowerCase() &&
                    (!provinceCode || c.provinceCode === provinceCode)
            )?.code ?? "")
            : "");

    const barangays = useBarangays(cityCode);
    const barangayCode = values.barangayCode || findCode(barangays.data, values.barangay);

    // fall back to plain text inputs if the PSGC API is down
    const typeProvince = provinces.isError;
    const typeCity = allCities.isError;
    const typeBarangay = typeCity || barangays.isError;

    function pickProvince(e) {
        const code = e.target.value;

        setValues((c) => {
            // keep the chosen city only if it belongs to the new province
            const currentCity = allCities.data?.find((x) => x.code === cityCode);
            const keepCity = currentCity && currentCity.provinceCode === code;

            return {
                ...c,
                provinceCode: code,
                province: findName(provinces.data, code),
                cityCode: keepCity ? currentCity.code : "",
                city: keepCity ? currentCity.name : "",
                barangayCode: keepCity ? c.barangayCode : "",
                barangay: keepCity ? c.barangay : "",
            };
        });
        setErrors((c) => ({ ...c, province: undefined, city: undefined, barangay: undefined }));
    }

    function pickCity(e) {
        const code = e.target.value;
        const city = allCities.data?.find((x) => x.code === code);

        setValues((c) => ({
            ...c,
            cityCode: code,
            city: city?.name ?? "",
            provinceCode: city?.provinceCode || c.provinceCode,
            province: findName(provinces.data, city?.provinceCode) || c.province,
            barangayCode: "",
            barangay: "",
        }));
        setErrors((c) => ({ ...c, city: undefined, province: undefined, barangay: undefined }));
    }

    function pickBarangay(e) {
        const code = e.target.value;
        setValues((c) => ({ ...c, barangayCode: code, barangay: findName(barangays.data, code) }));
        setErrors((c) => ({ ...c, barangay: undefined }));
    }

    const createMutation = useCreateAddress();
    const updateMutation = useUpdateAddress();
    const saving = createMutation.isPending || updateMutation.isPending;

    // FormModal opens the dialog itself, so we only focus the first input
    useEffect(() => {
        bodyRef.current?.querySelector("input")?.focus();
    }, []);

    function handleChange(e) {
        const { name, value } = e.target;
        setValues((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({ ...current, [name]: undefined }));
    }

    function handleSubmit(e) {
        e.preventDefault();

        // eslint-disable-next-line no-unused-vars
        const { provinceCode: _p, cityCode: _c, barangayCode: _b, ...fields } = values;
        const payload = Object.fromEntries(
            Object.entries(fields).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
        );

        const found = validate(payload);
        setErrors(found);
        setFormError("");
        if (Object.keys(found).length > 0) return;

        const options = {
            onSuccess: () => {
                toast.success(isEdit ? "Address updated" : "Address added");
                onClose();
            },
            onError: (err) => {
                const fieldErrors = extractFieldErrors(err);
                if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
                else setFormError(getErrorMessage(err));
            },
        };

        if (isEdit) updateMutation.mutate({ id: address.id, payload }, options);
        else createMutation.mutate(payload, options);
    }

    return (
        <FormModal
            isOpen
            onClose={onClose}
            onSubmit={handleSubmit}
            icon={isEdit ? Pencil : LocateFixed}
            title={isEdit ? "Edit address" : "Add new address"}
            submitLabel="Save address"
            isPending={saving}
        >
            <div ref={bodyRef} className="space-y-4">
                {formError && (
                    <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                        {formError}
                    </p>
                )}

                {/* <button
                    type="button"
                    onClick={fillFromLocation}
                    disabled={locating}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-accent-300 bg-accent-50 px-4 text-sm font-semibold text-accent-300 transition-colors hover:bg-accent-50/70 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                    <LocateFixed size={16} aria-hidden="true" />
                    {locating ? "Finding your location…" : "Use my current location"}
                </button> */}

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        label="Recipient name"
                        id="recipientName"
                        value={values.recipientName}
                        onChange={handleChange}
                        error={errors.recipientName}
                        autoComplete="name"
                        aria-invalid={Boolean(errors.recipientName)}
                        placeholder="Juan Dela Cruz"
                    />
                    <FormField
                        label="Contact number"
                        id="contactNumber"
                        value={values.contactNumber}
                        onChange={handleChange}
                        error={errors.contactNumber}
                        inputMode="tel"
                        placeholder="09123456789"
                        autoComplete="tel"
                        aria-invalid={Boolean(errors.contactNumber)}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {/* Province */}
                    {typeProvince ? (
                        <FormField
                            label="Province"
                            id="province"
                            value={values.province}
                            onChange={handleChange}
                            error={errors.province}
                            autoComplete="address-level1"
                            aria-invalid={Boolean(errors.province)}
                            placeholder="Cebu"
                        />
                    ) : (
                        <SelectField
                            label="Province"
                            id="province"
                            value={provinceCode}
                            onChange={pickProvince}
                            options={provinces.data}
                            loading={provinces.isPending}
                            placeholder="Select province"
                            error={errors.province}
                        />
                    )}

                    {/* City */}
                    {typeCity ? (
                        <FormField
                            label="City / Municipality"
                            id="city"
                            value={values.city}
                            onChange={handleChange}
                            error={errors.city}
                            autoComplete="address-level2"
                            aria-invalid={Boolean(errors.city)}
                            placeholder="Cebu City"
                        />
                    ) : (
                        <SelectField
                            label="City / Municipality"
                            id="city"
                            value={cityCode}
                            onChange={pickCity}
                            options={cityOptions}
                            loading={allCities.isPending}
                            placeholder="Select city / municipality"
                            error={errors.city}
                        />
                    )}

                    {/* Barangay */}
                    {typeBarangay ? (
                        <FormField
                            label="Barangay"
                            id="barangay"
                            value={values.barangay}
                            onChange={handleChange}
                            error={errors.barangay}
                            aria-invalid={Boolean(errors.barangay)}
                            placeholder="Barangay 1234"
                        />
                    ) : (
                        <SelectField
                            label="Barangay"
                            id="barangay"
                            value={barangayCode}
                            onChange={pickBarangay}
                            options={barangays.data}
                            loading={barangays.isFetching}
                            disabled={!cityCode}
                            placeholder={
                                !cityCode ? "Select city first"
                                    : barangays.isFetching ? "Loading barangays…"
                                        : "Select barangay"
                            }
                            error={errors.barangay}
                        />
                    )}

                    <FormField
                        label="Postal code"
                        id="postalCode"
                        value={values.postalCode}
                        onChange={handleChange}
                        error={errors.postalCode}
                        inputMode="numeric"
                        maxLength={4}
                        autoComplete="postal-code"
                        aria-invalid={Boolean(errors.postalCode)}
                        placeholder="6000"
                    />
                </div>

                <FormField
                    label="Street address"
                    id="addressLine"
                    value={values.addressLine}
                    onChange={handleChange}
                    error={errors.addressLine}
                    placeholder="House no., street, building"
                    autoComplete="address-line1"
                    aria-invalid={Boolean(errors.addressLine)}
                />

                <label className="flex items-center gap-2 text-sm text-heading">
                    <input
                        type="checkbox"
                        checked={values.isDefault}
                        onChange={(e) => setValues((current) => ({ ...current, isDefault: e.target.checked }))}
                        className="size-4 accent-accent-100"
                    />
                    Set as default address
                </label>
            </div>
        </FormModal>
    );
}