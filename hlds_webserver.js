/* CONFIG
// CSStatsX SQL

csstats_sql_host "localhost"
csstats_sql_user "root"
csstats_sql_pass ""
csstats_sql_db "csstatsx"
csstats_sql_type "sqlite"
csstats_sql_create_db "1"
csstats_sql_update "5"
csstats_sql_weapons "1"
csstats_sql_maps "1"
csstats_sql_autoclear "7"
csstats_sql_autoclear_day "1"
*/
var express = require('express');
var njk = require('nunjucks');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('cstrike/addons/amxmodx/data/sqlite3/csstatsx.sq3');

// vars
var ip = '127.0.0.1';
var port = 8080;
var title = 'HL Stats';

app.set('view engine', 'njk');
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
njk.configure('views', {
    'autoescape': true,
    express: app
});

var clients = [];

io.on('connection', function(socket) {
    clients.push(socket.id);

    socket.on('disconnect', function() {
        var index = clients.indexOf(socket.id);
        if (index > -1) {
            clients.splice(index, 1)
        }
    })

    socket.on('fetch_data', function() {
        db.each("SELECT id,name,skill,kills,deaths,hs,shots,hits,dmg,connection_time FROM csstats", function(err, row) {
            socket.emit('recieve_data', row);
        });
    });
    socket.on('fetch_player_data', function(id) {
        db.get("SELECT * FROM csstats WHERE id = ?", id, function(err,row) {
            socket.emit('recieve_player_data', row);
        });
    });
    socket.on('fetch_player_data_weapon', function(data) {
		var stmt;
		if (data.weapon == 'best') {
			stmt = db.prepare("SELECT csstats.name,csstats.skill,csstats.connection_time,csstats.assists,csstats.bombdefused,csstats.bombplants,csstats.roundt,csstats.roundct,csstats.wint,csstats.winct,csstats.tks,csstats_weapons.player_id AS id,csstats_weapons.weapon,max(csstats_weapons.kills) as kills,csstats_weapons.deaths,csstats_weapons.hs,csstats_weapons.shots,csstats_weapons.hits,csstats_weapons.dmg FROM csstats_weapons INNER JOIN csstats ON csstats_weapons.player_id = csstats.id WHERE csstats.id = $id GROUP BY csstats_weapons.player_id ORDER BY csstats_weapons.kills DESC LIMIT 1");
			stmt.bind({
				$id:data.id
			});
		} else {
			stmt = db.prepare("SELECT csstats.name,csstats.skill,csstats.connection_time,csstats.assists,csstats.bombdefused,csstats.bombplants,csstats.roundt,csstats.roundct,csstats.wint,csstats.winct,csstats_weapons.* FROM csstats_weapons INNER JOIN csstats ON csstats_weapons.player_id = csstats.id WHERE weapon = $weapon AND csstats.id = $id LIMIT 1");
			stmt.bind({
				$id:data.id,
				$weapon:data.weapon
			});
		}
		stmt.get(function(err,row) {
			socket.emit('recieve_player_data_weapon', row);
		});
    });
    socket.on('fetch_player_data_weapons', function(id) {
        db.each("SELECT * FROM csstats_weapons WHERE player_id = ?", id, function(err, row) {
            socket.emit('recieve_player_data_weapons', row);
        });
    });
    socket.on('fetch_player_data_maps', function(id) {
        db.each("SELECT * FROM csstats_maps WHERE player_id = ?", id, function(err, row) {
            socket.emit('recieve_player_data_maps', row);
        });
    });
    socket.on('fetch_player_data_map', function(data) {
        var session = data.session;
        var player = data.player;
        db.get("SELECT csstats_maps.*,csstats.name FROM csstats_maps INNER JOIN csstats ON csstats.id = csstats_maps.player_id WHERE csstats_maps.session_id = $session AND csstats_maps.player_id = $player",{
                $session:session,
                $player:player
        },function(err,row) {
            socket.emit("recieve_player_data_map",row);
        });
    });
    socket.on('fetch_hit_data', function() {
        db.each("SELECT id,name,h_0,h_1,h_2,h_3,h_4,h_5,h_6,h_7 FROM csstats", function(err, row) {
            socket.emit('recieve_hit_data', row);
        });
    })
    socket.on('fetch_data_weapon', function(weapon) {
		var stmt;
		if (weapon == 'best') {
			stmt = db.prepare("SELECT csstats.name,csstats_weapons.player_id AS id,csstats_weapons.weapon,max(csstats_weapons.kills) as kills,csstats_weapons.deaths,csstats_weapons.hs,csstats_weapons.shots,csstats_weapons.hits,csstats_weapons.dmg FROM csstats_weapons INNER JOIN csstats ON csstats_weapons.player_id = csstats.id GROUP BY csstats_weapons.player_id ORDER BY csstats.name ASC");
		} else {
			stmt = db.prepare("SELECT csstats.name,csstats.skill,csstats.connection_time,csstats_weapons.player_id AS id,csstats_weapons.weapon,csstats_weapons.kills,csstats_weapons.deaths,csstats_weapons.hs,csstats_weapons.shots,csstats_weapons.hits,csstats_weapons.dmg FROM csstats_weapons INNER JOIN csstats ON csstats_weapons.player_id = csstats.id WHERE weapon = ?");
			stmt.bind(weapon);
		}
		stmt.each(function(err, row) {
            socket.emit('recieve_data_weapon', row);
        });
    });
    socket.on('fetch_data_weapons', function() {
        db.each("SELECT csstats.name,csstats_weapons.player_id AS id,csstats_weapons.weapon,csstats_weapons.kills,csstats_weapons.deaths,csstats_weapons.hs,csstats_weapons.shots,csstats_weapons.hits,csstats_weapons.dmg FROM csstats_weapons INNER JOIN csstats ON csstats_weapons.player_id = csstats.id", function(err, row) {
            socket.emit('recieve_data_weapons', row);
        });
    });
    socket.on('fetch_data_map', function(session_id) {
        db.each("SELECT csstats_maps.*,csstats.name,( SELECT csstats_maps.session_id FROM csstats_maps ORDER BY session_id desc LIMIT 1) AS latest FROM csstats_maps INNER JOIN csstats ON csstats.id = csstats_maps.player_id WHERE csstats_maps.session_id = ?",session_id,function(err,row) {
            socket.emit("recieve_data_map",row);
        });
    });
});

app.get('/', function(req,res) {
    res.render('index.njk',{
        ip:ip+':'+port,
        title:title
    });
}).get('/player/:id', function(req,res) {
    var id = req.params.id
    db.all("SELECT DISTINCT map,session_id FROM csstats_maps WHERE player_id = ? ORDER BY session_id DESC",id, function(err,row) {
        res.render('player.njk', {
			ip:ip+':'+port,
            id:id,
            title:title,
            maps:row
        });
    });
}).get('/hitmap', function(req,res) {
    res.render('hitmap.njk',{
        ip:ip+':'+port,
        title:title
    });
}).get('/weapons', function(req,res) {
    res.render('weapons.njk', {
        ip:ip+':'+port,
        title:title
    });
}).get('/maps', function(req,res) {
    var maps = [];
    db.all("SELECT DISTINCT map,session_id FROM csstats_maps ORDER BY session_id DESC", function(err,row) {
        res.render('maps.njk', {
			ip:ip+':'+port,
            title:title,
            maps:row
        });
    });
}).get('/cstrike*.(*)', function(req, res) {
	var illegalExt = [
	 'cfg',
	 'ini',
	 'inf',
	 'db',
	 'scr',
	 'dll',
	 'so',
	 'dylib',
	 'sma',
	 'amxx',
	 'dat',
	 'sq3',
	 'sql',
	 'mmdb',
	 'js',
	 'json',
	 'njk',
	 'gam',
	 'wdf',
	 'fgd',
	 'log',
	 'md'
	];
	var illegalPath = [
		'addons',
		'logs',
		'manual'
	];
	for(var i = 0; i < illegalPath.length; i++) {
		if (req.params[0].indexOf(illegalPath[i]) != -1) {
			console.log("Illegal parameters: " + req.params[0] + '.' + req.params[1]);
			res.sendStatus(404);
			return;
		}
	}
	if (req.params[0].indexOf('..') != -1 || illegalExt.indexOf(req.params[1]) != -1 || illegalPath.indexOf(req.params[0].toLowerCase()) != -1) {
		//
		console.log("Illegal parameters: " + req.params[0] + '.' + req.params[1]);
		res.sendStatus(404);
		return;
	} else if (req.params[0] != '/gfx/steam_banner') {
		console.log("Sending: " + req.params[0] + '.' + req.params[1] + ' to ' + req.connection.remoteAddress);
	}
	res.sendFile(__dirname + '/cstrike' + req.params[0] + '.' + req.params[1]);
}).get('/motd', function(req, res) {
	res.render('motd.njk', {
		ip:ip+':'+port
	});
}).get('/motd/*.(jpg|png|gif)', function(req, res) {
	res.sendFile(__dirname + '/motd/' + req.params[0] + '.' + req.params[1]);
});

server.listen(8080,'0.0.0.0', function() {
    console.log('Listening on '+ip+':'+port);
});
