# pseudonymity-manager

## Getting Started
You will need to set up the following:
- [ProtonMail WebClients](https://github.com/ProtonMail/WebClients/tree/main/applications)
- [ProtonPass Extension](https://github.com/ProtonMail/WebClients/tree/main/applications/pass-extension)
- [ProtonVPN-CLI](https://github.com/Rafficer/linux-cli-community#protonvpn-cli)

## How to run the server
Change directories to following: 
`pseudonymity-manager/Server`

Install the dependencies listed in ProtonVPN-CLI if you have not yet. 

Run

```bash
npm i express
node index.js
```

## Open a new terminal window


## How to run the extension

Please note that all commands should be run from the following directory: 
`pseudonymity-manager/WebClients/applications/pass-extension`

Install the dependencies listed in ProtonMail WebClients and ProtonPass Extension if you have not yet. 

On Mac, please first install `mkcert` with `brew install mkcert` (brew can be installed on https://brew.sh/) then:

```bash
yarn install
yarn install:devtools
```

### For Chromium

Run

```bash
# `yarn start` targets the internal environment by default.
yarn start:prod
```

After that, the build is available in `dist/` directory that you can install in Chromium by going to [extension page](chrome://extensions/), enable the developer mode, click on "Load Unpacked" and choose the `dist/` directory here.
