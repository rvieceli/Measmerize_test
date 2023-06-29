import path from "node:path";
import fs from "node:fs/promises";
import Ajv from "ajv";

import flatToTree from "./flatToTree.js";

const inputPath = path.join(process.cwd(), "input");
const outputPath = path.join(process.cwd(), "output");

import inputSchema from "../schemas/input-schema.json" assert { type: "json" };
import outputSchema from "../schemas/output-schema.json" assert { type: "json" };
import { pipeline } from "node:stream/promises";
import { Readable, Transform } from "node:stream";

async function transformFiles() {
  const ajv = new Ajv();
  const filesInDir = await fs.readdir(inputPath);

  const validateInput = ajv.compile(inputSchema);
  const validateOutput = ajv.compile(outputSchema);

  try {
    await pipeline(
      Readable.from(filesInDir.filter((file) => path.extname(file) === ".json")),
      async function* readFile(source, { signal }) {
        for await (const file of source) {
          if (signal.aborted) {
            break;
          }
          const content = await fs.readFile(path.join(inputPath, file), "utf-8");
          const json = JSON.parse(content);

          yield { file, json };
        }
      },
      async function* validateFiles(source, { signal }) {
        for await (const { file, json } of source) {
          if (signal.aborted) {
            break;
          }
          if (validateInput(json)) {
            yield { file, json };
          }
        }
      },
      async function* transformFiles(source, { signal }) {
        for await (const { file, json } of source) {
          if (signal.aborted) {
            break;
          }
          const tree = flatToTree(json);
          yield { file, tree };
        }
      },
      async function* validateTrees(source, { signal }) {
        for await (const { file, tree } of source) {
          if (signal.aborted) {
            break;
          }
          if (validateOutput(tree)) {
            yield { file, tree };
          }
        }
      },
      async function* writeFile(source, { signal }) {
        for await (const { file, tree } of source) {
          if (signal.aborted) {
            break;
          }
          await fs.writeFile(
            path.join(outputPath, file),
            JSON.stringify(tree, null, 2),
            "utf-8"
          );
        }
      }
    );
  } catch (error) {
    console.log(error);
  }

  // await Promise.all(
  //   filesInDir
  //     .filter((file) => path.extname(file) === ".json")
  //     .map(async (file) => {
  //       const content = await fs.readFile(path.join(inputPath, file), "utf-8");

  //       const json = JSON.parse(content);

  //       if (!validateInput(json)) {
  //         console.log(`Invalid input file: ${file}`);
  //         return;
  //       }

  //       const tree = flatToTree(json);

  //       if (!validateOutput(tree)) {
  //         console.log(`Invalid output file: ${file}`);
  //         return;
  //       }

  //       await fs.writeFile(
  //         path.join(outputPath, file),
  //         JSON.stringify(tree, null, 2),
  //         "utf-8"
  //       );
  //     })
  // );
}

transformFiles();
