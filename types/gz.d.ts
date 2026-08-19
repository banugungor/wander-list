declare module "*.gz" {
  // Metro resolves this the same way it resolves an image require — to a
  // numeric asset module id that Asset.fromModule() accepts. See
  // data/heritageSites.ts.
  const assetId: number;
  export default assetId;
}
