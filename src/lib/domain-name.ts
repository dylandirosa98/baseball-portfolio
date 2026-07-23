export function normalizeManagedDomain(value: string) {
  const domain = value.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
  return domain && !domain.includes(".") ? domain + ".com" : domain;
}

export function isStandardComDomain(value: string) {
  if (!/^[a-z0-9-]+\.com$/.test(value)) return false;
  const label = value.slice(0, -4);
  return label.length > 0 && label.length <= 63 && !label.startsWith("-") && !label.endsWith("-");
}
