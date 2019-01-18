### 25.0.0

This is the first release that is de-coupled from the Jest release cycle. So,
in your head, consider this a 1.0 kinda thing.

- Updates the `jest-snapshot` dependency to an alpha build of jest 24.x

  This is because the codebase was migrated with Jest, and now uses functions
  from the master builds that don't seem to be available on the latest production
  versions of jest-snapshot/. If someone wants to backport this to the prod builds 
  look at the useage of the `buildSnapshotResolver`

- Adds the ability to parse describe blocks - https://github.com/facebook/jest/pull/7215

