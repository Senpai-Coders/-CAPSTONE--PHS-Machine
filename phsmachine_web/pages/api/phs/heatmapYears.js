import {
  COMPARE_PASSWORD,
  GENERATE_JWT,
  setCookie,
} from "../../../helpers/api/index";
import dbConnect from "../../../configs/dbConnection";
const cookie = require("cookie");
const users = require("../../../models/user");

dbConnect();

const handler = async (req, res) => {
  try {
    res.status(200).json({ goodies: "I'll give you this: 🍍 🍎" });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: "Internal Server Error 😥",
    });
  }
};

export default handler;
