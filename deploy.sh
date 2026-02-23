#!/bin/bash
TIMESTAMP=`date "+%Y-%m-%dT%H-%M-%S"`
echo $TIMESTAMP
git add .
git commit -am "${TIMESTAMP}"
git push origin
