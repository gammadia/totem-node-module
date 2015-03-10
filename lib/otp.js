/*jslint node: true */

/**
 *  Objet Otp
 *
 *  @type {Object}
 */
var Otp = {};

(function () {
    'use strict';

    var crypto = require('crypto'),

        /**
         *  Taille, en bit, du passe à générer.
         *
         *  @type {Number}
         */
        key_size = 96;

    Otp.prototype = {
        /**
         *  Création du code et encodage en base64
         *
         *  @param {Boolean} raw Retourner le buffer sans conversion en base64
         *  @param {Number}  time Forcer la valeur du temps pour le code à générer
         *  @returns {String | Buffer}   Code en base64 ou Buffer
         */
        getCode: function (raw, time) {
            var hash = null;

            time = time || Math.floor((new Date()) / 30000);   //  Unix timestamp / 30

            if (this.last_time !== time) {
                hash = crypto.createHmac('sha512', this.secret)
                        .update(String(time))
                        .digest();

                //  Garde seulement les [key_size] bits les moins significatifs
                hash = hash.slice(hash.length - (key_size / 8));

                this.last_time = time;
                this.last_hash = hash;
            } else {
                hash = this.last_hash;
            }

            return raw ? hash : hash.toString('base64');
        },

        /**
         *  Code OTP des 30 secondes futures
         */
        getPrevCode: function (raw) {
            return this.getCode(raw, Math.floor((new Date()) / 30000) - 1);
        },

        /**
         *  Code OTP des 30 secondes passées
         */
        getNextCode: function (raw) {
            return this.getCode(raw, Math.floor((new Date()) / 30000) + 1);
        }
    };

    /**
     *  Création d'un générateur OTP
     *
     *  @param   {String | Buffer} secret Clef privée, String en hex ou instance de Buffer
     *
     *  @returns {Object}        Générateur OTP
     */
    Otp.create = function (secret) {
        var that = null;

        if (typeof secret === 'string') {
            secret = new Buffer(secret, 'hex');
        }

        that = Object.create(Otp.prototype, {
            /**
             *  Clef de base des codes Otp
             *
             *  @type string
             */
            secret: {
                value: secret,
                enumerable: false
            },

            /**
             *  Base du dernier hash généré.
             *
             *  @type {Number}
             */
            last_time: {
                value: null,
                enumerable: false,
                writable: true
            },

            /**
             *  Dernier code retourné.
             *
             *  @type {String}
             */
            last_hash: {
                value: null,
                enumerable: false,
                writable: true
            }
        });

        return that;
    };
}());

module.exports = Otp;
