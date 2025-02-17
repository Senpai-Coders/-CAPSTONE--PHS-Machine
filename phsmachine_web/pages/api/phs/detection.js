import dbConnect from "../../../configs/dbConnection";
const detections = require("../../../models/thermal_detection");
let ObjectId = require("mongoose").Types.ObjectId;
const fs = require("fs");

import { ToExcel, ToCsv, ToZip } from "../../../helpers/api";
import logger from "../../../services/logger";

dbConnect();

const handler = async (req, res) => {
  try {
    const { mode, detection_id, updates, path, toExport, filter, limit } = req.body;
    if (mode === 0) {
      const detData = await detections.find({}).sort({cat : -1});
      logger.info("Retrieved all detections");
      return res.status(200).json({ detection_data: detData });
    } else if (mode === 1) {
      const detection_info = await detections.findOne({
        _id: new ObjectId(detection_id),
      });
      logger.info(`Retrieve Detection -> ${detection_id}`);
      if (!detection_info) {
        logger.error(`${detection_id} does not exist in detection`);
        return res.status(404).json({ message: "Detection Doesn't Exist" });
      }
      return res.status(200).json({ detection_data: detection_info });
    } else if (mode === 2) {
      const update = await detections.updateOne(
        { _id: new ObjectId(detection_id) },
        {
          $set: {
            ...updates,
          },
        }
      );
      logger.info(`Updated detection -> ${detection_id}`);
      return res.status(200).json({
        message: "Updated!",
      });
    } else if (mode === 3) {
      const past_detect = await detections
        .find({})
        .sort({ cat : -1 })
        .limit(10);
      res.status(200).json({ detections: past_detect });
    } else if (mode === -1) {
      const update = await detections.deleteOne({
        _id: new ObjectId(detection_id),
      });

      try {
        const delRecrd = await fs.promises.rmdir(`public/detection/${path}`, {
          recursive: true,
        });
        logger.info(`Deleted detecion & it's data -> ${detection_id}`);
      } catch (e) {
        logger.error(`Failed To Delete, ${e.stack}`);
      }

      return res.status(200).json({ message: "Deleted!" });
    } else if (mode === -2) {
      const { ids } = req.body;
      logger.info(
        `Deleting multiple detections ${JSON.stringify(
          ids.map((dtss) => dtss._id)
        )}`
      );
      for (var x = 0; x < ids.length; x++) {
        const update = await detections.deleteOne({
          _id: new ObjectId(ids[x].id),
        });
        try{
            const delRecrd = await fs.promises.rmdir(`public/detection/${ids[x].path}`, { recursive: true });
        }catch(e){
            logger.error(`Failed To Delete, ${e.stack}`);
        }
      }
      return res.status(200).json({ message: "Deleted!" });
    } else if (mode === 4) {
      const { toExcel, toCsv, toZip } = toExport;
      let links = [];

      const data = await detections.find({});
      if (toExcel) {
        let parsedData = [];
        data.forEach((data, z) => {
        console.log("iter ", z)
          parsedData.push({
            "Detection Date": new Intl.DateTimeFormat("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
            }).format(new Date(data.cat)),
            "Time Occured": new Date(data.cat).toLocaleTimeString(),
            "Seen Pig(s)": data.data.pig_count,
            "Stressed Pig(s)": data.data.stressed_pig,
            "Min Temperature": data.data.min_temp.toFixed(2),
            "Average Temperature": data.data.avg_temp.toFixed(2),
            "Maximum Temperature": data.data.max_temp.toFixed(2),
            "Actions Performed": data.actions ? data.actions.length : 0,
            "Raw Data Directory": data.img_normal.substring(
              data.img_normal.indexOf("/Dete") + 1,
              43
            ),
            "Detection ID": `${data._id}`,
          });
        });

        let fileUrl = await ToExcel(parsedData);
        if (fileUrl.length > 0)
          links.push({ name: "Excel File", type: "xlsx", link: fileUrl });
        logger.info("Exported -> xlsx");
      }

      if (toCsv) {
        let parsedData = [];

        data.forEach((data) => {
          parsedData.push({
            "Detection Date": new Intl.DateTimeFormat("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
            }).format(new Date(data.cat)),
            "Time Occured": new Date(data.cat).toLocaleTimeString(),
            "Seen Pig(s)": data.data.pig_count,
            "Stressed Pig(s)": data.data.stressed_pig,
            "Min Temperature": data.data.min_temp.toFixed(2),
            "Average Temperature": data.data.avg_temp.toFixed(2),
            "Maximum Temperature": data.data.max_temp.toFixed(2),
            "Actions Performed": data.actions ? data.actions.length : 0,
            "Raw Data Directory": data.img_normal.substring(
              data.img_normal.indexOf("/Dete") + 1,
              43
            ),
            "Detection ID": `${data._id}`,
          });
        });

        const fileUrl = await ToCsv(parsedData);
        if (fileUrl.length > 0)
          links.push({ name: "CSV File", type: "csv", link: fileUrl });
        logger.info("Exported -> csv");
      }

      if (toZip) {
        const fileUrl = await ToZip("public/detection");
        if (fileUrl.length > 0)
          links.push({ name: "Zip File", type: "zip", link: fileUrl });
        logger.info("Exported -> zip");
      }

      res
        .status(200)
        .json({ downloadLinks: links.filter((ln) => ln.link.length > 0) });
    } else if (mode === 5){
        let strt = new Date();
        let end = new Date();
        strt.setHours(0,0,0,0)
        end.setHours(23,59,59,999)
        const todays = await detections.find({cat : { $gte : strt, $lt : end }}, {_id : 1}).sort({cat : -1})
        return res.status(200).json(todays)
    }else if(mode === 6){
        const filtered = await detections.find({...filter}).limit(limit)
        return res.status(200).json(filtered)
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Internal Server Error 😥" });
  }
};

export default handler;
