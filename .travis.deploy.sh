#!/bin/bash
set -e
npm install -g bower
echo -e "Host github.com\n\tStrictHostKeyChecking no\n" >> ~/.ssh/config
bower --config.interactive=false install
git config --global user.email "bot@travis-ci.org"
git config --global user.name "Travis CI"
git remote set-url origin https://${GITHUB_OAUTH_TOKEN}:x-oauth-basic@github.com/strkio/strkio.github.io.git
./node_modules/.bin/gulp build && ./node_modules/.bin/gulp deploy
