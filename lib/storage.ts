import { PriorAuthCase } from "@/lib/types";

const STORAGE_KEY = "priorauthiq_cases_v1";

export function getStoredCases(): PriorAuthCase[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as PriorAuthCase[];
  } catch {
    return [];
  }
}

export function saveStoredCases(cases: PriorAuthCase[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
}

export function addStoredCase(newCase: PriorAuthCase) {
  const currentCases = getStoredCases();
  const withoutDuplicate = currentCases.filter((item) => item.id !== newCase.id);
  const updatedCases = [newCase, ...withoutDuplicate];

  saveStoredCases(updatedCases);

  return updatedCases;
}

export function updateStoredCase(updatedCase: PriorAuthCase) {
  const currentCases = getStoredCases();
  const caseExists = currentCases.some((item) => item.id === updatedCase.id);

  const updatedCases = caseExists
    ? currentCases.map((item) =>
        item.id === updatedCase.id ? updatedCase : item
      )
    : [updatedCase, ...currentCases];

  saveStoredCases(updatedCases);

  return updatedCases;
}

export function deleteStoredCase(caseId: string) {
  const currentCases = getStoredCases();
  const updatedCases = currentCases.filter((item) => item.id !== caseId);

  saveStoredCases(updatedCases);

  return updatedCases;
}

export function isStoredCase(caseId: string) {
  return getStoredCases().some((item) => item.id === caseId);
}

export function getAllCasesWithDemoCases(demoCases: PriorAuthCase[]) {
  const storedCases = getStoredCases();
  const storedIds = new Set(storedCases.map((item) => item.id));
  const demoCasesNotOverridden = demoCases.filter(
    (item) => !storedIds.has(item.id)
  );

  return [...storedCases, ...demoCasesNotOverridden];
}

export function clearStoredCases() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}