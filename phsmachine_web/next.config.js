/** @type {import('next').NextConfig} */

const PI_IP = 7;
const IS_PI = false;

const GET_SERVER_IP = () => {
    if(!IS_PI) return `192.168.1.${PI_IP}`
    var interfaces = require("os").networkInterfaces();
    for (var devName in interfaces) {
      var iface = interfaces[devName];
  
      for (var i = 0; i < iface.length; i++) {
        var alias = iface[i];
        if (
          alias.family === "IPv4" &&
          alias.address !== "127.0.0.1" &&
          !alias.internal
        )
          return alias.address;
      }
    }
    return "0.0.0.0";
  };

const IP = GET_SERVER_IP()

module.exports = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  api: {
    responseLimit: false,
  },
  env: {
    MONGODB_URI: IS_PI
      ? `mongodb://127.0.0.1:27017/PHS_MACHINE`
      : "mongodb+srv://Jervx:helloworld@capstone.nv1cu.mongodb.net/?retryWrites=true&w=majority",
    JWT_SCRT: "ErenJaeger",
    PI_IP : IP,
    MASTEREMAIL : process.env.MASTEREMAIL,
    MASTERPASSW : process.env.MASTERPASSW,
    EXPIRATION: 86400, //Seconds
    DEB : false
  },
  publicRuntimeConfig: {
    PI_IP: IP,
  },
};
