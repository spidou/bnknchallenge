# Install dependencies
## NVM
Install NVM: https://github.com/creationix/nvm

## NodeJS
run `nvm install` to install the node version required for the project (`cat .nvmrc`)
Once installed nvm use automatically the right version on node. Otherwise run `nvm use`.

## PhantomJS
`npm install phantomjs -g`

## Project
`npm install`

# Run project
`node app.js`

The JSON object is displayed on the console and a CSV file (output.csv) is generated with the data.

**Warning**: the script may consume a lot of CPU and memory to perform parallel scraping. This can be optimized be running the script by a cluster or in the cloud in some ec2 instances.