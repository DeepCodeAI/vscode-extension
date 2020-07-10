import * as crypto from "crypto";
import * as nodePath from "path";
import * as vscode from "vscode";
import { Buffer } from "buffer";
import { fs } from "mz";
import {
  HASH_ALGORITHM,
  ENCODE_TYPE,
  FILE_FORMAT,
  GITIGNORE_FILENAME,
  DCIGNORE_FILENAME,
  FILE_CURRENT_STATUS
} from "../constants/filesConstants";
import { ALLOWED_PAYLOAD_SIZE } from "../constants/general";
import DeepCode from "../../interfaces/DeepCodeInterfaces";

// The file limit was hardcoded to 2mb but seems to be a function of ALLOWED_PAYLOAD_SIZE
// TODO what exactly is transmitted eventually and what is a good exact limit?
const SAFE_PAYLOAD_SIZE = ALLOWED_PAYLOAD_SIZE / 2; // safe size for requests

export const createFileHash = (file: string): string => {
  return crypto
    .createHash(HASH_ALGORITHM)
    .update(file)
    .digest(ENCODE_TYPE);
};

export const readFile = async (filePath: string): Promise<string> => {
  return await fs.readFile(filePath, { encoding: FILE_FORMAT });
};

export const getFileNameFromPath = (path: string): string => {
  const splittedPath = path.split("/");
  return splittedPath[splittedPath.length - 1];
};

// Count all files in directory (recursively, anologously to createListOfDirFilesHashes())
export const scanFileCountFromDirectory = async (folderPath: string) => {
  const dirContent: string[] = await fs.readdir(folderPath);
  let subFileCount = 0;

  for (const name of dirContent) {
    const fullChildPath = nodePath.join(folderPath, name);
    if (fs.lstatSync(fullChildPath).isDirectory()) {
      subFileCount += await scanFileCountFromDirectory(fullChildPath);
    } else {
      ++subFileCount;
    }
  }
  return subFileCount;
};

export let filesProgress = { processed: 0, total: 0 };

export const acceptFileToBundle = (
  name: string,
  serverFilesFilterList: DeepCode.AllowedServerFilterListInterface
): boolean => {
  name = nodePath.basename(name);
  if (
    (serverFilesFilterList.configFiles &&
      serverFilesFilterList.configFiles.includes(name)) ||
    (serverFilesFilterList.extensions &&
      serverFilesFilterList.extensions.includes(nodePath.extname(name)))
  ) {
    return true;
  }
  return false;
};

export const isFileChangingBundle = (name: string): boolean => {
  name = nodePath.basename(name);
  if (name === GITIGNORE_FILENAME || name === DCIGNORE_FILENAME) {
    return true;
  }
  return false;
};

export const parseGitignoreFile = async (
  filePath: string
): Promise<string[]> => {
  let gitignoreContent: string | string[] = await readFile(filePath);
  gitignoreContent = gitignoreContent.split("\n").filter(file => !!file);
  return gitignoreContent;
};

export const createMissingFilesPayloadUtil = async (
  missingFiles: Array<string>,
  currentWorkspacePath: string
): Promise<Array<DeepCode.PayloadMissingFileInterface>> => {
  const result: {
    fileHash: string;
    filePath: string;
    fileContent: string;
  }[] = [];
  for await (const file of missingFiles) {
    if (currentWorkspacePath) {
      const filePath = `${currentWorkspacePath}${file}`;
      const fileContent = await readFile(filePath);
      result.push({
        fileHash: createFileHash(fileContent),
        filePath,
        fileContent
      });
    }
  }
  return result;
};

export const compareFileChanges = async (
  filePath: string,
  currentWorkspacePath: string,
  currentWorkspaceFilesBundle: { [key: string]: string } | null
): Promise<{ [key: string]: string }> => {
  const filePathInsideBundle = filePath.split(currentWorkspacePath)[1];
  const response: { [key: string]: string } = {
    fileHash: "",
    filePath: filePathInsideBundle,
    status: ""
  };
  const { same, modified, created, deleted } = FILE_CURRENT_STATUS;
  try {
    const fileHash = await createFileHash(await readFile(filePath));
    response.fileHash = fileHash;
    if (currentWorkspaceFilesBundle) {
      if (currentWorkspaceFilesBundle[filePathInsideBundle]) {
        response.status =
          fileHash === currentWorkspaceFilesBundle[filePathInsideBundle]
            ? same
            : modified;
      } else {
        response.status = created;
      }
    }
  } catch (err) {
    if (
      currentWorkspaceFilesBundle &&
      currentWorkspaceFilesBundle[filePathInsideBundle]
    ) {
      response.status = deleted;
      return response;
    }
    throw err;
  }
  return response;
};

export const processServerFilesFilterList = (
  filterList: DeepCode.AllowedServerFilterListInterface
): DeepCode.AllowedServerFilterListInterface => {
  const { configFiles } = filterList;
  if (configFiles) {
    const processedConfigFiles = configFiles.map((item: string) =>
      item.slice(1)
    );
    return { ...filterList, configFiles: processedConfigFiles };
  }
  return filterList;
};

export const processPayloadSize = (
  payload: Array<DeepCode.PayloadMissingFileInterface>
): {
  chunks: boolean;
  payload:
    | Array<DeepCode.PayloadMissingFileInterface>
    | Array<Array<DeepCode.PayloadMissingFileInterface>>;
} => {
  const buffer = Buffer.from(JSON.stringify(payload));
  const payloadByteSize = Buffer.byteLength(buffer);

  if (payloadByteSize < ALLOWED_PAYLOAD_SIZE) {
    return { chunks: false, payload };
  }
  const chunkedPayload = splitPayloadIntoChunks(payload, payloadByteSize);
  return chunkedPayload;
};

export const splitPayloadIntoChunks = (
  payload: {
    fileHash: string;
    filePath: string;
    fileContent: string;
  }[],
  payloadByteSize: number
) => {
  const chunkedPayload = [];

  // Break input array of files
  //     [  {hash1, content1},    {hash2, content2},   ...]
  // into array of chunks limited by an upper size bound to avoid http 413 errors
  //     [  [{hash1, content1}],  [{hash2, content2}, {hash3, content3}]  ]
  let currentChunkSize = 0;
  for (let i = 0; i < payload.length; i++) {
    const currentChunkElement = payload[i];
    const currentWorstCaseChunkElementSize = Buffer.byteLength(
      Buffer.from(JSON.stringify(currentChunkElement))
    );
    const lastChunk = chunkedPayload[chunkedPayload.length - 1];

    if (
      !lastChunk ||
      currentChunkSize + currentWorstCaseChunkElementSize > SAFE_PAYLOAD_SIZE
    ) {
      // Start a new chunk
      chunkedPayload.push([payload[i]]);
      currentChunkSize = currentWorstCaseChunkElementSize;
    } else {
      // Append item to current chunk
      lastChunk.push(payload[i]);
      currentChunkSize += currentWorstCaseChunkElementSize;
    }
  }

  return { chunks: true, payload: chunkedPayload };
};

export const createDCIgnore = async (
  defaultDcIgnore: string | undefined,
  path: string,
  custom: boolean
) => {
  console.log("createDCIgnore");
  const customIgnore = [
    "# Write glob rules for ignored files.",
    "# Check syntax on https://deepcode.freshdesk.com/support/solutions/articles/60000531055-how-can-i-ignore-files-or-directories-",
    "# Check examples on https://github.com/github/gitignore"
  ].join("\n");
  const content: Buffer | Uint8Array = custom || !defaultDcIgnore ? 
    Buffer.from(customIgnore, 'utf8') :
    await vscode.workspace.fs.readFile(vscode.Uri.file(defaultDcIgnore));
  
  const filePath = `${path}/.dcignore`;
  const openPath = vscode.Uri.file(filePath);
  await vscode.workspace.fs.writeFile(openPath, content);
  const doc = await vscode.workspace.openTextDocument(openPath);
  vscode.window.showTextDocument(doc);
};
