export function shouldDeleteShopMediaObject(
  replacedPath,
  currentMediaUrls,
  resolveOwnedPath,
) {
  if (!replacedPath) return false;
  return !currentMediaUrls.some((url) => resolveOwnedPath(url) === replacedPath);
}
