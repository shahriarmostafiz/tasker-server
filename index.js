const express = require("express");
const cors = require("cors");
require("dotenv").config();

const cloudinary = require("cloudinary").v2;
const multer = require("multer");

const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

const URI = process.env.URI;
// const upload = multer({ dest: "uploads/" });
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

cloudinary.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.API,
  api_secret: process.env.SECRET,
});

// pass: MRk4h6RSSu3FKvbR
// admin : JOBTASKER ;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.URI;

//   "mongodb+srv://JOBTASKER:MRk4h6RSSu3FKvbR@cluster1.rubdhat.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const AttachmentCollection = client
      .db("AllTasker")
      .collection("SEOPAGE1.1");

    app.post("/upload/:id", upload.array("files", 10), async (req, res) => {
      try {
        const files = req.files;
        const id = req.params.id;

        if (!files || files.length === 0) {
          return res.status(400).send("No files uploaded.");
        }

        const cloudinaryUrls = [];

        // Sequentially upload files to Cloudinary and collect URLs
        for (const file of files) {
          const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { resource_type: "auto" },
              (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(result.secure_url);
                }
              }
            );

            uploadStream.end(file.buffer);
          });

          cloudinaryUrls.push(result);
        }

        console.log("cloudinary", cloudinaryUrls);

        const result = await AttachmentCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $inc: { counter: cloudinaryUrls.length },
            $push: { urls: { $each: cloudinaryUrls } },
          },
          { upsert: true }
        );

        res.send({
          message: "Files uploaded to Cloudinary successfully.",
        });
      } catch (error) {
        console.error("Error uploading files to Cloudinary:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    app.get("/tasks", async (req, res) => {
      const result = await AttachmentCollection.find().toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch {
    (err) => console.log(err);
  } finally {
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Greetings ");
});
app.listen(port, () => {
  console.log("Server Running at port", port);
});
