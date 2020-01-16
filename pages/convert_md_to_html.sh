#!/bin/bash

for directory in `find . -type d -maxdepth 100 -mindepth 0`
do
    (cd "$directory" && node /Users/knuth/repos/github/markdown-to-html-github-style/convert.js)
done