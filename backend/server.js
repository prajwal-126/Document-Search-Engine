// import express from "express";
// import cors from "cors";
// import multer from "multer";
// import fs from "fs";
// import pdfParse from "pdf-parse";
// import mammoth from "mammoth";
// import { Client } from "@elastic/elasticsearch";

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { Client } = require("@elastic/elasticsearch");

const app = express();
const upload = multer({ dest: "uploads/" });
const client = new Client({ node: "http://localhost:9200" });

app.use(cors());
app.use(express.json());

// Reset documents index
app.post("/reset-index", async (req, res) => {
  const indexName = "documents";

  try {
    const exists = await client.indices.exists({ index: indexName });

    if (exists) {
      await client.indices.delete({ index: indexName });
      console.log(`Index "${indexName}" deleted.`);
    }

    res.send({ message: "Index reset successfully" });
  } catch (err) {
    console.error("Error resetting index:", err);
    res.status(500).send({ error: "Failed to reset index" });
  }
});

// Upload endpoint
app.post("/upload", upload.array("files"), async (req, res) => {
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).send("No files uploaded");
  }

  try {
    const indexName = "documents";

    for (const file of files) {
      let text = "";

      if (file.mimetype === "application/pdf") {
        const dataBuffer = fs.readFileSync(file.path);
        const pdfData = await pdfParse(dataBuffer);
        text = pdfData.text;
      } else if (
        file.mimetype ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.mimetype === "application/msword"
      ) {
        const result = await mammoth.extractRawText({ path: file.path });
        text = result.value;
      } else {
        console.log(`Skipping unsupported file: ${file.originalname}`);
        continue;
      }

      // Index in Elasticsearch
      await client.index({
        index: indexName,
        body: {
          filename: file.originalname,
          content: text,
        },
      });

      fs.unlinkSync(file.path); // cleanup temp file
    }

    res.send("Files uploaded and indexed!");
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).send("Error processing files");
  }
});

// Search endpoint
app.get("/search", async (req, res) => {
  const query = req.query.q;

  console.log(query, "yaha aaya hai sirrr");

  const exists = await client.indices.exists({ index: "documents" });

    if (!exists) {
      return res
        .status(400)
        .send("Please upload documents first!!!");
    }


  const body = await client.search({
    index: "documents",
    query: {
      match_phrase: {
        content: query, // Exact phrase match
      },
    },
    highlight: {
      pre_tags: ["<mark>"], // wrap before highlight
      post_tags: ["</mark>"], // wrap after highlight
      fields: {
        content: {},
      },
    },
  });
  console.log(body);

  const results = body.hits.hits.map((hit) => ({
    filename: hit._source.filename,
    highlight: hit.highlight?.content?.[0] || hit._source.content,
  }));

  res.json(results);
});

app.listen(5000, () => console.log("Server running on port 5000 , woohoo!!!"));
