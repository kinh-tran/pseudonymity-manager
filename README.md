# pseudonymity-manager

## Getting started
You will need to create the following accounts:
- ProtonPass
- ProtonVPN

You will need to set up the following depenencies:
- To set up [ProtonMail WebClients](https://github.com/ProtonMail/WebClients/tree/main/) install:
  - Node.js LTS
  - Yarn 3

- To set up [ProtonPass Extension](https://github.com/ProtonMail/WebClients/tree/main/applications/pass-extension) install:
  - If on Mac: `brew install mkcert`

- To set up [ProtonVPN-CLI](https://github.com/Rafficer/linux-cli-community#protonvpn-cli) install:
  - OpenVPN:
    - If on Mac: `brew install openvpn` then `export PATH=$(brew --prefix openvpn)/sbin:$PATH`
  - Python3

You will also need to install [ProtonVPN-CLI](https://github.com/Rafficer/linux-cli-community#protonvpn-cli)
```bash
sudo pip3 install protonvpn-cli
sudo pip3 install protonvpn-cli --upgrade
```

Then initialize [ProtonVPN-CLI](https://github.com/Rafficer/linux-cli-community#protonvpn-cli) with your ProtonVPN OpenVPN login credentials.
```
sudo protonvpn init
```

Your ProtonVPN OpenVPN credentials can be found at: (https://account.protonvpn.com/account).
You will need a ProtonVPN account to do this.

## Clone the project
You will need:
- git
```bash
gh repo clone kinh-tran/pseudonymity-manager
```

## Run the server
Change directories to following: 
`cd pseudonymity-manager/pseudonymity-manager/Server`

Install the dependencies listed in ProtonVPN-CLI if you have not yet. 

Run

```bash
node index.js
```
Enter your credentials if prompted. 

## Open a new terminal window

## Run the extension on the new terminal window

Change directories to following: 
`cd pseudonymity-manager/pseudonymity-manager/WebClients/applications/pass-extension`

Install the dependencies listed in ProtonMail WebClients and ProtonPass Extension if you have not yet. 

On Mac, please first install `mkcert` with `brew install mkcert` (brew can be installed on https://brew.sh/) if you have not yet.

```bash
yarn install
yarn install:additional-tools
```

### For Chromium

Run

```bash
# `yarn start` targets the internal environment by default.
yarn start:prod
```

After that, the build is available in `dist/` directory that you can install in Chromium by going to [extension page](chrome://extensions/), enable the developer mode, click on "Load Unpacked" and choose the `dist/` directory here.

Sign into your ProtonPass account. You will need a ProtonPass account to do this.