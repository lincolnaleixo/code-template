# Licensing and Ownership

## Template repository decision

`matrix-hq/code-template` is an internal private template. It intentionally uses:

```json
{
  "private": true,
  "license": "UNLICENSED"
}
```

The repository intentionally does not include an open-source `LICENSE` file. This keeps the template from granting a public license by default and prevents a newly generated product from inheriting an accidental distribution policy.

This document records repository policy. It is not a substitute for legal review when a product is distributed to customers, published publicly, sold, embedded in hardware, or submitted to an application store.

## Generated projects

Every repository created from this template must make its own licensing and ownership decision during project bootstrap.

Choose one of these deliberate outcomes:

### Internal proprietary product

- keep the package private
- keep `license: "UNLICENSED"`
- do not add a public license file
- document the owning company or business unit
- restrict repository and artifact access appropriately

### Public open-source project

- choose an approved open-source license
- add the complete license text in `LICENSE`
- replace `license: "UNLICENSED"` with the matching SPDX identifier
- add contribution and copyright guidance when needed
- review whether every bundled dependency and asset is compatible with the selected license

### Customer-distributed or commercial proprietary product

- keep source ownership and distribution terms explicit
- add the approved proprietary notice or agreement reference
- review desktop, mobile, container, font, icon, media, SDK, and store-distribution obligations
- confirm whether source notices or attribution must ship with the product

## Third-party software

Dependencies, generated native projects, icons, fonts, examples, and copied component source retain their own license terms. The template's internal licensing decision does not relicense third-party material.

Before a public or commercial release:

1. review direct and transitive dependency licenses
2. review copied source and generated artifacts
3. produce required attribution or notices
4. remove assets whose rights are unclear
5. retain evidence of the review with the release record

Automated license reports are useful evidence, but they do not replace review of unusual, custom, dual, source-available, or non-code terms.

## Ownership files

The template contains `.github/CODEOWNERS` for maintenance of this repository. A generated product must replace those owners with the real product team, or remove the file until ownership is known.

`CODEOWNERS` is a review-routing mechanism. Product ownership, copyright ownership, employment agreements, contractor assignments, and commercial distribution rights must be handled by the appropriate business records and agreements.

## Bootstrap checklist

Before feature development in a generated repository:

- choose internal, open-source, or commercial proprietary distribution
- update the root `license` field
- add or intentionally omit `LICENSE`
- replace template code owners
- record the product owner
- identify third-party attribution requirements
- update `README.md`, `SECURITY.md`, and release documentation

Before the first external release, repeat the review against the exact dependency lockfiles and artifacts being published.
