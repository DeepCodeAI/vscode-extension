import { fs } from "mz";
import * as nodePath from "path";
import { window, ProgressLocation, Progress } from "vscode";
import { deepCodeMessages } from "../messages/deepCodeMessages";
import DeepCode from "../../interfaces/DeepCodeInterfaces";
import { ExclusionRule, ExclusionFilter } from "../utils/ignoreUtils";
import {
  acceptFileToBundle,
  parseGitignoreFile,
} from "../utils/filesUtils";
import { DCIGNORE_FILENAME, GITIGNORE_FILENAME, EXCLUDED_NAMES } from "../constants/filesConstants";
import { ALLOWED_PAYLOAD_SIZE } from "../constants/general";

let filesProgress = { processed: 0, total: 0 };

// The file limit was hardcoded to 2mb but seems to be a function of ALLOWED_PAYLOAD_SIZE
// TODO what exactly is transmitted eventually and what is a good exact limit?
const SAFE_PAYLOAD_SIZE = ALLOWED_PAYLOAD_SIZE / 2; // safe size for requests0

interface ProgressInterface {
  filesProcessed: number;
  totalFiles: number;
  percentDone: number;
  progressWindow: Progress<{ increment: number; message: string }>;
}

interface CreateListOfFiles {
  serverFilesFilterList: DeepCode.AllowedServerFilterListInterface;
  folderPath: string;
  path: string;
  exclusionFilter: ExclusionFilter;
  progress: ProgressInterface;
}

// Helper function - read files and count progress
export const createListOfDirFiles = async (options: CreateListOfFiles):
Promise<{foundIgnoreFile: boolean, progress: ProgressInterface, bundle: string[]}> => {
  let {
    serverFilesFilterList,
    folderPath,
    path,
    exclusionFilter,
    progress
  } = options;

  let foundIgnoreFile: boolean = false;
  let list: string[] = [];
  const dirPath = path || folderPath;
  const dirContent: string[] = await fs.readdir(dirPath);
  const relativeDirPath = nodePath.relative(folderPath, dirPath);

  // First look for .gitignore and .dcignore files.
  for (const name of dirContent) {
    const fullChildPath = nodePath.join(dirPath, name);

    if ([GITIGNORE_FILENAME, DCIGNORE_FILENAME].includes(name)) {
      foundIgnoreFile = true;
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
      const fullChildPath = nodePath.join(dirPath, name);
      const fileStats = fs.statSync(fullChildPath);
      const isDirectory = fileStats.isDirectory();
      const isFile = fileStats.isFile();

      if (isFile) {
        // Update progress window on processed (non-directory) files
        ++progress.filesProcessed;

        // This check is just to throttle the reporting process
        if (progress.filesProcessed % 100 === 0) {
          const currentPercentDone = Math.round(
            (progress.filesProcessed / progress.totalFiles) * 100
          );
          const percentDoneIncrement =
            currentPercentDone - progress.percentDone;

          if (percentDoneIncrement > 0) {
            progress.progressWindow.report({
              increment: percentDoneIncrement,
              // message: `${progress.filesProcessed} of ${progress.totalFiles} done (${currentPercentDone}%)`
              message: `${progress.filesProcessed}`
            });
            progress.percentDone = currentPercentDone;
          }
        }
      }

      if (exclusionFilter.excludes(relativeChildPath)) {
        continue;
      }

      if (isFile) {
        if (!acceptFileToBundle(name, serverFilesFilterList)) {
          continue;
        }

        // Exclude files which are too large to be transferred via http. There is currently no
        // way to process them in multiple chunks
        const fileContentSize = fileStats.size;
        if (fileContentSize > SAFE_PAYLOAD_SIZE) {
          console.log(
            "Excluding file " +
              fullChildPath +
              " from processing: size " +
              fileContentSize +
              " exceeds payload size limit " +
              SAFE_PAYLOAD_SIZE
          );
          continue;
        }

        const filePath = dirPath.split(folderPath)[1];
        list.push(`${filePath}/${name}`);
      }

      if (isDirectory) {
        const {
          bundle: subBundle,
          progress: subProgress,
          foundIgnoreFile: subFoundIgnoreFile
        } = await createListOfDirFiles({
          serverFilesFilterList,
          folderPath,
          path: `${dirPath}/${name}`,
          exclusionFilter,
          progress
        });
        foundIgnoreFile = foundIgnoreFile || subFoundIgnoreFile;
        progress = subProgress;
        list.push(...subBundle);
      }
    } catch (err) {
      continue;
    }
  }
  filesProgress = {
    processed: progress.filesProcessed,
    total: progress.totalFiles
  };

  return {
    bundle: list,
    progress,
    foundIgnoreFile,
  };
};

export const startFilesUpload = async(
  folderPath: string,
  serverFilesFilterList: DeepCode.AllowedServerFilterListInterface
): Promise<{foundIgnoreFile: boolean, bundle: string[]}> => {
  const exclusionFilter = new ExclusionFilter();
  const rootExclusionRule = new ExclusionRule();
  rootExclusionRule.addExclusions(EXCLUDED_NAMES, "");
  exclusionFilter.addExclusionRule(rootExclusionRule);

  const progressOptions = {
    location: ProgressLocation.Notification,
    title: deepCodeMessages.fileLoadingProgress.msg,
    cancellable: false
  };

  const {
    bundle: finalBundle,
    progress: finalProgress,
    foundIgnoreFile,
  } = await window.withProgress(progressOptions, async (progress) => {
    // Get a directory size overview for progress reporting
    progress.report({ increment: 1 });

    // Filter, read and hash all files
    const res = await createListOfDirFiles({
      serverFilesFilterList,
      folderPath: folderPath,
      path: folderPath,
      exclusionFilter: exclusionFilter,
      progress: {
        // progress data
        filesProcessed: 0,
        totalFiles: 100,
        percentDone: 0,
        progressWindow: progress
      }
    });
    progress.report({ increment: 100 });
    return res;
  });

  console.warn(`Processed ${Object.keys(finalBundle).length} files`);
  if (!foundIgnoreFile) {
    console.warn(`Found no .dcignore or .gitignore file in the directory`);
  }

  return {
    foundIgnoreFile,
    bundle: finalBundle // final window result
  };
};
