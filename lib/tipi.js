/*jslint node: true */

(function () {
    'use strict';

    var url = require('url'),
        http = require('http'),
        crypto = require('crypto'),
        util = require('util'),
        Otp = require('./otp'),

        /**
         *  Cache local pour les données utilisateur
         *
         *  @type {Object}
         */
        cache = {},

        /**
         *  Création d'une instance client pour Tipi
         *  options:
         *  api_version: Version de l'api Tipi a utiliser
         *  tipi_url:    URL de l'instance Tipi
         *  app_name:    Nom de l'application cliente
         *  app_key:     Clef privée de l'application
         *
         *  @param {Object} options Configuration
         */
        Tipi = function (options) {
            this.api_version = options.api_version || '~2';
            this.tipi_url = options.tipi_url || '';
            this.app_name = options.app_name || 'Tipi App';
            this.app_key = options.app_key || null;
            this.generator = null;
        };

    Tipi.prototype = {
        /**
         *  Création d'une requête sur le serveur
         *
         *  @param   {String}   resource Chemin de la resource
         *  @param   {String}   method   Methode HTTP
         *  @param   {Object}   data     Données pour les POST et PUT
         *  @param   {Function} callback
         */
        makeRequest: function (resource, method, data, callback) {
            var req_options = url.parse(this.tipi_url + resource),
                req = null;

            if (typeof method === 'function') {
                callback = method;
                method = null;
                data = null;
            }

            if (typeof data === 'function') {
                callback = data;
                data = null;
            }

            req_options.method = method || 'GET';
            req_options.headers = {
                'Accept-Version': '~2',
                'Authorization': this.getToken()
            };

            req = http.request(req_options, function (res) {
                if (res.statusCode !== 200) {
                    res.destroy();
                    return callback(res.statusCode);
                }

                res.setEncoding('utf8');

                res.on('data', function (buffer) {
                    res.destroy();
                    return callback(null, JSON.parse(buffer.toString()));
                });
            }).on('error', function (e) {
                callback(e.message);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        },

        /**
         *  Génération du jetton d'identification pour l'application
         *
         *  @returns {String} Contenu du header Authorization
         */
        getToken: function () {
            if (!this.generator) {
                this.generator = Otp.create(new Buffer(this.app_key, 'base64'));
            }

            var sign = crypto.createHmac('sha256', this.generator.getCode())
                .update(this.app_key)
                .digest();

            return util.format('TIPI-TOKEN app="%s", sign="%s"', this.app_name, sign.toString('base64'));
        },

        getUserDataByUserId: function (id, namespace, force_refresh, callback) {
            if (!id) {
                return callback('No id given');
            }

            if (!namespace) {
                return callback('No namespace given');
            }

            if (typeof force_refresh === 'function') {
                callback = force_refresh;
                force_refresh = false;
            }

            if (cache[id] === undefined || force_refresh) {
                return this.makeRequest('users/' + id + '/' + namespace, function (err, data) {
                    if (err) {
                        return callback(err);
                    }

                    cache[id] = data;
                    return callback(cache[id]);
                });
            }

            return callback(cache[id]);
        }
    };

    module.exports = Tipi;
}());
