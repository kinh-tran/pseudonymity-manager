const express = require("express");
const { spawn } = require('node:child_process');
const router = express.Router();

const countryCodes = new Map();
countryCodes.set('United States', 'US');
countryCodes.set('Australia', 'AU');
countryCodes.set('New Zealand', 'NZ');
countryCodes.set('United Kingdom', 'UK');
countryCodes.set('Canada', 'CA');

// Home page route.
router.get("/", function (req, res) {
  res.send("Wiki home page");
});

// About page route.
router.get("/about", function (req, res) {
  res.send("About this wiki");
});

router.get("/connect/:country", function (req, res) {

  country = req.params.country;
  if (country === "random") {
    Math.floor(Math.random() * 4);
  }

  const myConnect = spawn('sudo', ['protonvpn', 'c', '--cc', countryCodes.get(country)]);
  myConnect.stdout.on('data', (data) => {
    res.send(`stdout: ${data}`);
  });
  myConnect.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
});

router.get("/disconnect/", function (_, res) {
  const myConnect = spawn('sudo', ['protonvpn', 'd']);
  myConnect.stdout.on('data', (data) => {
    res.send(`stdout: ${data}`);
  });
  myConnect.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
});

module.exports = router;

