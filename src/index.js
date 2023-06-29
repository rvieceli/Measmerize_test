import { extname, join } from "node:path";
import { readdir, readFile, writeFile } from "node:fs/promises";
import Ajv from "ajv";

import flatToTree from "./flatToTree.js";

const inputPath = join(process.cwd(), "input");
const outputPath = join(process.cwd(), "output");

import inputSchema from "../schemas/input-schema.json" assert { type: "json" };
import outputSchema from "../schemas/output-schema.json" assert { type: "json" };

async function transformFiles() {
  const ajv = new Ajv();
  const filesInDir = await readdir(inputPath);

  const validateInput = ajv.compile(inputSchema);
  const validateOutput = ajv.compile(outputSchema);

  await Promise.all(
    filesInDir
      .filter((file) => extname(file) === ".json")
      .map(async (file) => {
        const content = await readFile(join(inputPath, file), "utf-8");

        const json = JSON.parse(content);

        if (!validateInput(json)) {
          console.log(`Invalid input file: ${file}`);
          return;
        }

        const tree = flatToTree(json);

        if (!validateOutput(tree)) {
          console.log(`Invalid output file: ${file}`);
          return;
        }

        await writeFile(
          join(outputPath, file),
          JSON.stringify(tree, null, 2),
          "utf-8"
        );
      })
  );
}

transformFiles();
