var Promise = require('bluebird'),
    fs = require('fs'),
    semver = require('semver'),
    packageInfo = require('../../package.json'),
    config = require('./config');

function GhostServer(app) {
    this.app = app;
    this.httpServer = null;
    this.connections = [];
    this.upgradeWarning = setTimeout(this.logUpgradeWarning.bind(this), 5000);
}

GhostServer.prototype.connection = function (socket) {
    this.connections.push(socket);
};

// Most browsers keep a persistant connection open to the server
// which prevents the close callback of httpServer from returning
// We need to destroy all connections manually
GhostServer.prototype.closeConnections = function () {
    this.connections.forEach(function (socket) {
        socket.destroy();
    });
};

GhostServer.prototype.logStartMessages = function () {
    // Tell users if their node version is not supported, and exit
    if (!semver.satisfies(process.versions.node, packageInfo.engines.node)) {
        console.log(
            "\nERROR: Unsupported version of Node".red,
            "\nGhost needs Node version".red,
            packageInfo.engines.node.yellow,
            "you are using version".red,
            process.versions.node.yellow,
            "\nPlease go to http://nodejs.org to get a supported version".green
        );

        process.exit(0);
    }

    // Startup & Shutdown messages
    if (process.env.NODE_ENV === 'production') {
        console.log(
            "Ghost is running...".green,
            "\nYour blog is now available on",
            config.url,
            "\nCtrl+C to shut down".grey
        );

        // ensure that Ghost exits correctly on Ctrl+C
        process.removeAllListeners('SIGINT').on('SIGINT', function () {
            console.log(
                "\nGhost has shut down".red,
                "\nYour blog is now offline"
            );
            process.exit(0);
        });
    } else {
        console.log(
            ("Ghost is running in " + process.env.NODE_ENV + "...").green,
            "\nListening on",
                config.getSocket() || config.server.host + ':' + config.server.port,
            "\nUrl configured as:",
            config.url,
            "\nCtrl+C to shut down".grey
        );
        // ensure that Ghost exits correctly on Ctrl+C
        process.removeAllListeners('SIGINT').on('SIGINT', function () {
            console.log(
                "\nGhost has shutdown".red,
                "\nGhost was running for",
                Math.round(process.uptime()),
                "seconds"
            );
            process.exit(0);
        });
    }
};

GhostServer.prototype.logShutdownMessages = function () {
    console.log('Ghost is closing connections'.red);
};

GhostServer.prototype.logUpgradeWarning = function () {
    console.log('Warning: Ghost will no longer start automatically when using it as an npm module. Please see the docs(http://tinyurl.com/npm-upgrade) for information on how to update your code.'.red);
};

// Starts the ghost server listening on the configured port
GhostServer.prototype.start = function () {
    var self = this;

    // ## Start Ghost App
    return new Promise(function (resolve) {
        if (config.getSocket()) {
            // Make sure the socket is gone before trying to create another
            try {
                fs.unlinkSync(config.getSocket());
            } catch (e) {
                // We can ignore this.
            }

            self.httpServer = self.app.listen(
                config.getSocket()
            );

            fs.chmod(config.getSocket(), '0660');

        } else {
            self.httpServer = self.app.listen(
                config.server.port,
                config.server.host
            );
        }

        self.httpServer.on('connection', self.connection.bind(self));
        self.httpServer.on('listening', function () {
            self.logStartMessages();
            clearTimeout(self.upgradeWarning);
            resolve(self);
        });
    });
};

// Returns a promise that will be fulfilled when the server stops.
// If the server has not been started, the promise will be fulfilled
// immediately
GhostServer.prototype.stop = function () {
    var self = this;

    return new Promise(function (resolve) {
        if (self.httpServer === null) {
            resolve(self);
        } else {
            self.httpServer.close(function () {
                self.httpServer = null;
                self.logShutdownMessages();
                resolve(self);
            });

            self.closeConnections();
        }
    });
};

// Restarts the ghost application
GhostServer.prototype.restart = function () {
    return this.stop().then(this.start.bind(this));
};

// To be called after `stop`
GhostServer.prototype.hammertime = function () {
    console.log('Can\'t touch this'.green);

    return Promise.resolve(this);
};

module.exports = GhostServer;
