import mongoose from "mongoose";
import flatten, { unflatten } from "flat";
import glob from "glob";
import path from 'path';
import mkdirp from 'mkdirp';
import * as fs from 'fs';

const { ObjectId } = mongoose.Schema.Types;

const MAIN_HEADER = "/* tslint:disable */\n/* eslint-disable */\n\n// ######################################## THIS FILE WAS GENERATED BY MONGOOSE-TSGEN ######################################## //\n\n// NOTE: ANY CHANGES MADE WILL BE OVERWRITTEN ON SUBSEQUENT EXECUTIONS OF MONGOOSE-TSGEN.\n// TO ADD CUSTOM INTERFACES, DEFINE THEM IN THE `custom.d.ts` FILE.\n\n"
const CUSTOM_HEADER = "/* tslint:disable */\n/* eslint-disable */\n\n// ######################################## THIS FILE WAS GENERATED BY MONGOOSE-TSGEN ######################################## //\n\n// ADD ANY CUSTOM INTERFACES OR TYPES WITHIN THE MONGOOSE MODULE DECLARATION BELOW.\n// THIS FILE WILL NOT BE CHANGED ONCE IT HAS BEEN CREATED. IF YOU NEED TO REGENERATE IT, SIMPLY DELETE IT AND RE-RUN MONGOOSE-TSGEN.\n\n"
const IMPORTS = `import mongoose from "mongoose";\n\n`;
const DECLARATION_HEADER = `declare module "mongoose" {\n\n`;
const DECLARATION_FOOTER = "}\n";

let globalFuncTypes: { 
  [modelName: string]: { 
      methods: { [funcName: string]: string }, 
      statics: { [funcName: string]: string }, 
  }
};

// TODO: cleanup this grossness
export const setFunctionTypes = (funcTypes: any) => {
  globalFuncTypes = funcTypes;
}

const getSubDocName = (path: string, modelName = "") => {
  let subDocName = modelName +
    path
      .split(".")
      .map((p: string) => p[0].toUpperCase() + p.slice(1))
      .join("")

  if (subDocName.endsWith("s")) subDocName = subDocName.slice(0, -1);
  return subDocName;
};

const makeLine = ({
  key,
  val,
  prefix,
  isOptional = false,
  newline = true,
}: {
  key: string;
  val: string;
  prefix: string;
  isOptional?: boolean;
  newline?: boolean;
}) => {
  let line = prefix ? prefix : "";

  if (key) {
    line += key;
    if (isOptional) line += "?";
    line += ": ";
  }
  line += val + ";";
  if (newline) line += "\n";
  return line;
};

// TODO: this doesnt handle query funcs with params - atleast tack on some ...any param
const parseFunctions = (funcs: any, modelName: string, funcType: "methods" | "statics" | "query", prefix = "") => {
  let interfaceString = "";

  Object.keys(funcs).forEach(key => {
    if (["initializeTimestamps"].includes(key)) return;
    
    let type;
    if (funcType === "query") {
      key += `<Q extends mongoose.DocumentQuery<any, I${modelName}, {}>>(this: Q)`
      type = "Q";
    }
    else {
      type = globalFuncTypes[modelName][funcType][key]
    }
    interfaceString += makeLine({ key, val: type, prefix });
  });

  return interfaceString;
}

export const parseSchema = ({ schema, modelName, addModel = false, header = "", footer = "", prefix = "" }: {schema: any, modelName?: string, addModel?: boolean, header?: string, footer?: string, prefix?: string}) => {
  let template = "";

  if (schema.childSchemas?.length > 0 && modelName) {
      const flatSchemaTree: any = flatten(schema.tree, { safe: true });
      let childInterfaces = "";
      
      const processChild = (rootPath: string) => {
          return (child: any) => {
              const path = child.model.path;
              const isSubdocArray = child.model.$isArraySubdocument;
          
              const name = getSubDocName(path, rootPath);
          
              child.schema._isReplacedWithSchema = true;
              child.schema._inferredInterfaceName = `I${name}`;
              child.schema._isSubdocArray = isSubdocArray;
              flatSchemaTree[path] = isSubdocArray ? [child.schema] : child.schema;
          
              const header = `\tinterface I${name} extends ${
                  isSubdocArray ? "mongoose.Types.Subdocument" : "Document"
                  } {\n`;

              childInterfaces += parseSchema({ schema: child.schema, modelName: name, header, footer: "\t}\n\n", prefix: "\t\t" });
          };
      };
      
      schema.childSchemas.forEach(processChild(modelName));
  
      const schemaTree = unflatten(flatSchemaTree);
      schema.tree = schemaTree;
      template += childInterfaces;
  }

  if (schema.statics && modelName && addModel) {
      let modelExtend: string;
      if (schema.query) {
        template += `\tinterface I${modelName}Queries {\n`;
        template += parseFunctions(schema.query, modelName, "query", "\t\t");
        template += "\t}\n\n";

        modelExtend = `Model<I${modelName}, I${modelName}Queries>`
      }
      else {
        modelExtend = `Model<I${modelName}>`
      }

      template += `\tinterface I${modelName}Model extends ${modelExtend} {\n`;
      template += parseFunctions(schema.statics, modelName, "statics", "\t\t");
      template += "\t}\n\n";
  }

  template += header;

  const schemaTree = schema.tree;

  const parseKey = (key: string, val: any, prefix: string): string => {
    // if type is provided directly on property, expand it
    if ([String, Number, Boolean, Date, ObjectId].includes(val))
      val = { type: val, required: false };

    let valType;
    let isOptional = !val.required;

    let isArray = Array.isArray(val);
    // this means its a subdoc
    if (isArray) {
      isOptional = false;
      val = val[0];
    } else if (Array.isArray(val.type)) {
      val.type = val.type[0];
      isArray = true;
    }

    if (val._inferredInterfaceName) {
      valType = val._inferredInterfaceName;
    }

    // check for virtual properties
    else if (val.path && val.path && val.setters && val.getters) {
      if (key === "id") {
        return "";
      }

      valType = "any";
      isOptional = false;
    } 
    else if (
      key &&
      [
        "get",
        "set",
        "schemaName",
        "defaultOptions",
        "_checkRequired",
        "_cast",
        "checkRequired",
        "cast",
        "__v",
      ].includes(key)
    ) {
      return "";
    } else if (val.ref) {
      let docRef: string;

      docRef = val.ref.replace(`'`, "");
      if (docRef.includes(".")) {
        docRef = getSubDocName(docRef);
      }

      // isArray check for second type option happens when adding line - but we do need to add the index

      valType = `I${docRef}["_id"] | I${docRef}`;
    }
    // NOTE: ideally we check actual type of value to ensure its Schema.Types.Mixed (the same way we do with Schema.Types.ObjectId), 
    // but this doesnt seem to work for some reason
    else if (val.schemaName === "Mixed" || val.type?.schemaName === "Mixed") {
      valType = "any";
    }   
    else {
      switch (val.type) {
        case String:
          if (val.enum?.length > 0) {
              valType = `"` + val.enum.join(`" | "`) + `"`;
          }
          else valType = "string";
          break;
        case Number:
          if (key !== "__v") valType = "number";
          break;
        case Boolean:
          valType = "boolean";
          break;
        case Date:
          valType = "Date";
          break;
        case ObjectId:
          valType = "ObjectId";
          break;
        // _id fields have type as a string
        case "ObjectId":
          return "";
        default:
          // if we dont find it, go one level deeper
          valType = parseSchema({ schema: { tree: val }, header: "{\n", footer: prefix + "}", prefix: prefix + "\t"});
          isOptional = false;
      }
    }

    if (!valType) return "";

    if (isArray)
      valType =
        `Types.${val._isSubdocArray ? "Document" : ""}Array<` + valType + ">";

    return makeLine({ key, val: valType, prefix, isOptional });
  }

  Object.keys(schemaTree).forEach((key: string) => {
    const val = schemaTree[key];
    template += parseKey(key, val, prefix);
  });

  // if (schema.methods && modelName) {
  if (schema.methods) {
    if (!modelName) throw new Error("No model name found on schema " + schema)
    template += parseFunctions(schema.methods, modelName, "methods", prefix);
  }

  template += footer;

  return template;
}

export const registerUserTs = (basePath: string): (() => void) | null => {
  let pathToSearch: string;
  if (basePath.endsWith("tsconfig.json")) pathToSearch = basePath;
  else pathToSearch = path.join(basePath, "**/tsconfig.json")

  const files = glob.sync(pathToSearch, { ignore: "**/node_modules/**"});

  if (files.length === 0)
    throw new Error(`No tsconfig.json file found at path "${basePath}"`);
  else if (files.length > 1)
    throw new Error(`Multiple tsconfig.json files found. Please specify a more specific --project value.\nPaths found: ${files}`);

  const foundPath = path.join(process.cwd(), files[0]);
  require('ts-node').register({ transpileOnly: true, project: foundPath });

  // handle path aliases
  const tsConfig = require(foundPath);
  if (tsConfig?.compilerOptions?.paths) {
    const cleanup = require("tsconfig-paths").register({
      baseUrl: process.cwd(),
      paths: tsConfig.compilerOptions.paths,
    });

    return cleanup;
  }

  return null;
}

interface LoadedSchemas {
  [modelName: string]: mongoose.Schema
}

export const loadSchemas = (modelsIndexOrPaths: string | string[]) => {
  const schemas: LoadedSchemas = {};

  const checkAndRegisterModel = (obj: any): boolean => {
    if (!obj?.modelName || !obj?.schema) return false;
    schemas[obj.modelName] = obj.schema;
    return true;
  }

  // if models folder does not export all schemas from an index.js file, we check each file's export object
  // for property names that would commonly export the schema. Here is the priority (using the filename as a starting point to determine model name): 
  // default export, model name (ie `User`), model name lowercase (ie `user`), collection name (ie `users`), collection name uppercased (ie `Users`).
  // If none of those exist, we assume the export object is set to the schema directly
  if (Array.isArray(modelsIndexOrPaths)) {
    modelsIndexOrPaths.forEach((singleModelPath: string) => {
      let exportedData;
      try {
        exportedData = require(singleModelPath);
      }
      catch (err) {
        if (err.message?.includes(`Cannot find module '${singleModelPath}'`))
            throw new Error(`Could not find a module at path ${singleModelPath}.`);
        else throw err;
      }

      // if exported data has a default export, use that
      if (checkAndRegisterModel(exportedData.default) || checkAndRegisterModel(exportedData)) return;
      
      // if no default export, look for a property matching file name
      const { name: filenameRoot } = path.parse(singleModelPath);

      // capitalize first char
      const modelName = filenameRoot.charAt(0).toUpperCase() + filenameRoot.slice(1)
      const collectionNameUppercased = modelName + "s";

      let modelNameLowercase = filenameRoot.endsWith("s") ? filenameRoot.slice(0, -1) : filenameRoot
      modelNameLowercase = modelNameLowercase.toLowerCase();

      const collectionName = modelNameLowercase + "s";

      // check likely names that schema would be exported from
      if (
        checkAndRegisterModel(exportedData[modelName]) ||
        checkAndRegisterModel(exportedData[modelNameLowercase]) ||
        checkAndRegisterModel(exportedData[collectionName]) ||
        checkAndRegisterModel(exportedData[collectionNameUppercased])
      ) return;
      
      // if none of those have it, check all properties
      for (const obj of Object.values(exportedData)) {
        if (checkAndRegisterModel(obj)) return;
      }

      throw new Error(`A module was found at ${singleModelPath}, but no exported models were found. Please ensure this file exports a Mongoose Model (preferably default export).`)
    });

    return schemas;
  }

  // if path is not array
  try {
    // usually this will be the path to an index.{t|j}s file that exports all models
    let exportedData = require(modelsIndexOrPaths);
    if (exportedData?.default) exportedData = exportedData.default;

    // if exported data is a model, likely the user only has one model in their models folder (and no index file)
    // therefore we'll load that module in and finish
    if (checkAndRegisterModel(exportedData)) return schemas;
    
    // check all values in exported object
    Object.values(exportedData).forEach(checkAndRegisterModel)

    // if any models found, return;
    if (Object.keys(schemas).length > 0) return schemas;

    throw new Error(`A module was found at ${modelsIndexOrPaths}, but no exported models were found. Please ensure this file exports a Mongoose Model or an object containing all your Mongoose Models (preferably default export).`)
  }
  catch (err) {
    if (err.message?.includes(`Cannot find module '${modelsIndexOrPaths}'`))
        throw new Error(`Could not find a module at path ${modelsIndexOrPaths}.`);
    else throw err;
  }
}

export const generateFileString = ({
  schemas
}: {
  schemas: LoadedSchemas;
}) => {
  let fullTemplate = MAIN_HEADER;

  fullTemplate += IMPORTS;
  fullTemplate += DECLARATION_HEADER;

  Object.keys(schemas).forEach(modelName => {
    const schema = schemas[modelName];
    let interfaceStr = "";

    // passing modelName causes childSchemas to be processed
    interfaceStr += parseSchema({ schema, modelName, addModel: true, header: `\tinterface I${modelName} extends Document {\n`, footer: "\t}\n\n", prefix: "\t\t" });
    fullTemplate += interfaceStr;
  });

  fullTemplate += DECLARATION_FOOTER;

  return fullTemplate;
};

export const cleanOutputPath = (outputPath: string) => {
  const { dir, base, ext } = path.parse(outputPath);
  
  // if `ext` is not empty (meaning outputPath references a file and not a directory) and `base` != index.d.ts, the path is pointing to a file other than index.d.ts
  if (ext !== "" && base !== "index.d.ts") {
    throw new Error("--output parameter must reference a folder path or an index.d.ts file.")
  }

  // if extension is empty, means `base` is the last folder in the path, so append it to the end
  return ext === "" ? path.join(dir, base) : dir;
}

// get empty custom interface template
const getCustomTemplate = () => {
  let customTemplateString = CUSTOM_HEADER;
  customTemplateString += IMPORTS;
  customTemplateString += DECLARATION_HEADER;
  customTemplateString += DECLARATION_FOOTER;
  return customTemplateString;
}

export const writeOrCreateInterfaceFiles = (outputPath: string, interfaceString: string) => {
  const writeFiles = () => {
    const indexOutputPath = path.join(outputPath, "index.d.ts")
    const customOutputPath = path.join(outputPath, "custom.d.ts")

    fs.writeFileSync(indexOutputPath, interfaceString, "utf8");

    if (glob.sync(customOutputPath).length === 0) {
      console.log("custom.d.ts file not found, creating...")
      const customInterfaceString = getCustomTemplate();
      fs.writeFileSync(customOutputPath, customInterfaceString, "utf8");
    }
  }

  try {
    writeFiles()
  }
  catch (err) {
    // if folder doesnt exist, create and then write again
    if (err.message.includes("ENOENT: no such file or directory")) {
      console.log(`Path ${outputPath} not found; creating...`)
      mkdirp.sync(outputPath);
      writeFiles()
    }
  }
}
