// `server-only` is provided by Next at build time (it has no standalone types).
// Declare it so `import "server-only"` type-checks under tsc.
declare module "server-only";
