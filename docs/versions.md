# Versioning

### Motivation

Since the whole application is cached locally and served from downloaded assets, clients need to
have a way to receive updates. Previously this was done via a simple build timestamp, but this was
limiting, since it didn't allow sending changelogs.

### Versioning File

Upon opening the application, client requests `/versions.json`, which contains a historic log of
version numbers, changelogs, and descriptions. If the latest version number is higher than the
installed version number, the client displays an update popup.

### Versioning CLI

To publish, unpublish, and modify versions, use the versioning CLI, accessed via the `version`
command. Do not edit the versioning file directly.

- `version add <number> <changelog>` publishes a new version, e.g. `version add 1.1.3 Bug fixes`.
- `version remove <number>` unpublishes a version, e.g. `version remove 1.1.3`.
- `version update <number> <new changelog>` updates the changelog of an existing version, e.g.
  `version update 1.1.3 Bug fixes and features`.

The CLI also allows you to list existing versions.

- `version list [n]` lists the n latest versions, five by default.
- `version listall` lists all versions.

Many shorthands are supported:

- `version` -> `ver`
- `add` -> `a`
- `remove` -> `rm`
- `update` -> `up`

Version numbers can be expressed as relative:

- `latest` or `l` refers to the current version.
- `patch` or `p` refers to the _next_ patch version, e.g. with a current version of `1.1.3`, the
  next patch would be `1.1.4`.
- `minor` or `min` refers to the _next_ minor version, e.g. with a current version of `1.1.3`, the
  next minor version would be `1.2.0`.
- `major` refers to the _next_ major version, e.g. with a current version of `1.1.3`, the
  next minor version would be `2.0.0`.

For example, you can use `ver a p Changelog` to add a new patch, or `ver rm l` to unpublish the
latest version.

### Limitations

With the current updating system, the client, upon accepting the update, downloads the latest
bundle, even if it was created after the update was published. This means that pushing changes
without publishing a version **does not guarantee** it will not be downloaded by clients. It only
guarantees that it will not invoke an update popup to clients which have already updated.
