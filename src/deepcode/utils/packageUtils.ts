import { fs } from "mz";
import * as nodePath from "path";
import DeepCode from "../../interfaces/DeepCodeInterfaces";
import { ExclusionRule, ExclusionFilter } from "../utils/ignoreUtils";
import {
  acceptFileToBundle,
  parseGitignoreFile,
} from "../utils/filesUtils";
import { DCIGNORE_FILENAME, GITIGNORE_FILENAME, EXCLUDED_NAMES } from "../constants/filesConstants";
import { ALLOWED_PAYLOAD_SIZE } from "../constants/general";

const SAFE_PAYLOAD_SIZE = ALLOWED_PAYLOAD_SIZE / 2;

interface ProgressInterface {
  onProgress: (value: number) => void;
  percentDone?: number;
  multiplier?: number;
}

interface CreateListOfFiles {
  serverFilesFilterList: DeepCode.AllowedServerFilterListInterface;
  path: string;
  progress: ProgressInterface;
  folderPath?: string;
  exclusionFilter?: ExclusionFilter;
}

// Helper function - read files and count progress
export const createListOfDirFiles = async (options: CreateListOfFiles) => {
  let {
    serverFilesFilterList,
    folderPath,
    path,
    exclusionFilter,
    progress
  } = options;
  // Entry point default values:
  exclusionFilter = exclusionFilter || getBaseExclusionFilter();
  progress.percentDone = progress.percentDone || 0;
  progress.multiplier = progress.multiplier || 1;

  let list: string[] = [];
  folderPath = folderPath || path;
  const dirContent: string[] = await fs.readdir(path);
  const relativeDirPath = nodePath.relative(folderPath, path);

  const progressPerChild = progress.multiplier / dirContent.length;
  let currentProgress = progress.percentDone;
  
  // First look for .gitignore and .dcignore files.
  for (const name of dirContent) {
    const fullChildPath = nodePath.join(path, name);

    if ([GITIGNORE_FILENAME, DCIGNORE_FILENAME].includes(name)) {
      // We've found a ignore file.
      const exclusionRule = new ExclusionRule();
      exclusionRule.addExclusions(
        await parseGitignoreFile(fullChildPath),
        relativeDirPath
      );
      // We need to modify the exclusion rules so we have to create a copy of the exclusionFilter.
      exclusionFilter = exclusionFilter.copy();
      exclusionFilter.addExclusionRule(exclusionRule);
    }
  }

  // Iterate through directory after updating exclusion rules.
  for (const name of dirContent) {
    try {
      const relativeChildPath = nodePath.join(relativeDirPath, name);
      const fullChildPath = nodePath.join(path, name);
      const fileStats = fs.statSync(fullChildPath);
      const isDirectory = fileStats.isDirectory();
      const isFile = fileStats.isFile();

      if (exclusionFilter.excludes(relativeChildPath)) {
        throw new Error(`File filtered by path: ${relativeChildPath}`);
      }

      if (isFile) {
        if (!acceptFileToBundle(name, serverFilesFilterList)) {
          throw new Error(`File filtered by name: ${name}`);
        }

        // Exclude files which are too large to be transferred via http. There is currently no
        // way to process them in multiple chunks
        const fileContentSize = fileStats.size;
        if (fileContentSize > SAFE_PAYLOAD_SIZE) {
          console.log(`Excluding file ${fullChildPath} from processing: size ${fileContentSize} exceeds payload size limit ${SAFE_PAYLOAD_SIZE}`);
          throw new Error(`File filtered by size: ${fileContentSize}`);
        }

        const filePath = path.split(folderPath)[1];
        list.push(`${filePath}/${name}`);
      }

      if (isDirectory) {
        const subList = await createListOfDirFiles({
          serverFilesFilterList,
          folderPath,
          path: `${path}/${name}`,
          exclusionFilter,
          progress: {
            onProgress: progress.onProgress,
            multiplier: progressPerChild,
            percentDone: currentProgress,
          }
        });
        list.push(...subList);
      }
    } catch (e) {
      // Ignore errors and continue
    } finally {
      currentProgress += progressPerChild;
      progress.onProgress(currentProgress);
    }
  }

  return list;
};

export const getBaseExclusionFilter = (): ExclusionFilter => {
  const exclusionFilter = new ExclusionFilter();
  const rootExclusionRule = new ExclusionRule();
  rootExclusionRule.addExclusions(EXCLUDED_NAMES, "");
  exclusionFilter.addExclusionRule(rootExclusionRule);
  return exclusionFilter;
};