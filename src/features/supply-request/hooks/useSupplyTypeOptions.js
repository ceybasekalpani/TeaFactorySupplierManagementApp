import { useEffect, useMemo } from "react";

export function useSupplyTypeOptions({ category, fertilizerTypes, itemTypes, selectedType, setSelectedType }) {
  const currentTypes = useMemo(() => {
    const toPickerOption = (type) => {
      const value = typeof type === "string"
        ? type
        : (type?.name ?? type?.Name ?? type?.type ?? type?.Type ?? type?.value ?? type?.Value ?? "");
      return { value, label: value };
    };

    return (category === "fertilizer" ? fertilizerTypes : itemTypes)
      .map(toPickerOption)
      .filter((type) => type.value);
  }, [category, fertilizerTypes, itemTypes]);

  useEffect(() => {
    if (selectedType && !currentTypes.some((type) => type.value === selectedType)) {
      setSelectedType("");
    }
  }, [currentTypes, selectedType, setSelectedType]);

  return currentTypes;
}
