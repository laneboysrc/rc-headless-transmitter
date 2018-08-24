module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module",
        "ecmaVersion": 2017
    },
    "rules": {
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-console": ["off"]
    },
    "globals": {
        "Device": true,
        "Database": true,
        "DatabaseObject": true,
        "MDLHelper": true,
        "Utils": true,
        "WebsocketTransport": true,
        "WebusbTransport": true,

        "About": true,
        "DeviceList": true,
        "EditCurve": true,
        "EditSwitch": true,
        "HardwareInputs": true,
        "Limits": true,
        "LogicalInputs": true,
        "Main": true,
        "Mixer": true,
        "MixerUnit": true,
        "ModelDetails": true,
        "ModelList": true,
        "Path": true,
        "RFProtocol": true,
        "SelectIcon": true,
        "SelectMultiple": true,
        "SelectSingle": true,
        "TransmitterDetails": true,
        "TransmitterList": true,

        "componentHandler": true,
        "strftime": true,
        "Sortable": true,

        "TEST_CONFIG_DATA": true,
        "CONFIG_VERSIONS": true,
        "VERSION_HASH": true,
        "VERSION_DATE": true,
        "VERSION_DIRTY": true
    }
};
