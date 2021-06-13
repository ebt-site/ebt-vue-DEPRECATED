---
title: Software Changes
description: Instructions for software maintainers
img: radowan-nakif-rehan-cYyqhdbJ9TI-unsplash.png
alt: Generic picture of software laptop
order: 3
---

EBT-Vue is an NPM package used in EBT-Sites.
It comprises:

* Vuetify components for sutta display and search
* I18N text for localization
* Nuxt configuration files for EBT-Sites
* Javascript libraries (e.g., bilara-web) for client-side processing
* Shared assets such as images, sounds, etc.

### Software Development
#### Installation
Develop EBT-Vue in a local desktop environment:
```
git clone https://github.com/ebt-site/ebt-vue
npm install
```
#### Interactive Development
Launch a local server for interactive development.
```
npm run dev
```

#### Static website testing
Subtle platform-specific issues (e.g., IOS) may need to be debugged
in a static HTML testing environment.
To launch a static HTML testing environment on port 3000:
```
npm run build:serve
```

### NPM Version ⚠️
Since EBT-Vue is an NPM package, any changes
to EBT-Vue must be accompanied by a new version number.
As a convention:
* Github actions should update *patch* version
* humans should update *minor/major* npm versions.
For example, humans should use the following command
to update the minor version:

```
npm version minor
```

EBT-Vue changes published to NPM will be automatically
propagated throughout EBT-Sites by Github Actions.
Changes made without a corresponding version number change
will be ignored by EBT-Sites until the EBT-Vue version number changes
and is published to NPM.
