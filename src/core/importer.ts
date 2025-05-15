// This wrapper is used to allow easier mocking of dynamic imports in tests.
export async function dynamicImportWrapper(modulePath: string) {
  return await import(modulePath);
}
