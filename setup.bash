#!/bin/bash
# -------------------------------------------------------------------------
# Here is what we did to set this all up...
rm package*
rm -fr node_modules

npm init
# npm init creates a package.json
# http://browsenpm.org/package.json
# https://docs.npmjs.com/files/package.json

npm install --save express
npm install --save body-parser
npm install --save ws
npm install --save JSON
npm install --save sqlite3
npm install --save url
npm install --save https

rm database.db
sqlite3 db/database.db < db/schema.sql


# check out the package.json now
# check out node_modules

echo  "*********
        Note: ws server port is static. https hosts the websocket port as well. Need to modify controller.js line 128 in setupGame().
        Usuage: nodejs fortwod.js 10345
        Access: https://localhost:10345/
*********"
# http://localhost:PORT_NUMBER

