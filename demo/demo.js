/*jslint node: true */

(function () {
    'use strict';

    var Tipi = require('../lib/tipi'),

        tipi = new Tipi({
            tipi_url: 'http://127.0.0.1:9999/',
            app_name: 'Demo',
            app_key: 'M9kUGp37UD/6X38t60vanyJmbxza2SwFDowal6V5xz4975LSzCoikEpxN/jrXaf7M/zRN/Cowuikbmm54NhsYA=='
        });

    tipi.getUserDataByUserId('4ad3194556070140397a323250000fbb', 'mooncare', function (err, data) {
        if (err) {
            return console.log(err);
        }

        console.dir(data);
    });
}());
