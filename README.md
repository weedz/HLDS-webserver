# HLDS-webserver

This functions as a fastdownload server, MOTD page and stats page server. 

To use fastdownload, add `sv_downloadurl "http://127.0.0.1:8080/cstrike/"` (change `127.0.0.1` to your ip address) to your `server.cfg`

Use the `motd.txt` included and edit `views/motd.njk` as needed. Put images and other resource files in `motd/`

Stats requires csstats_sql running on the counter-strike server. Available from https://github.com/serfreeman1337/csstatsx-sql. 

##Installing
Put `hlds_webserver.js,package.json,motd/,views/` in the same directory as hlds.exe

Use `npm` to install node depencies:
```
npm install --production
```
**Note:** add these lines to your amxx.cfg file
```
csstats_sql_db "csstatsx"
csstats_sql_type "sqlite"
csstats_sql_weapons "1"
csstats_sql_maps "1"
```
Then start the counter-strike server to generate database file. This file should be located in `cstrike/amxmodx/data/sqlite3/csstatsx.sq3`. Open this file with a SQLite browser and execute `csstats_maps_sqlite.sql` from csstatsx-sql then restart server.

##Node depencies
Available from npm: `express,nunjucks,socket.io,sqlite3,jquery`
