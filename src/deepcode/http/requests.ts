import { ServiceAI } from "@deepcode/tsc";
import { IDE_NAME } from "../constants/general";

const AI = new ServiceAI();

const http = {

  login(baseURL: string, source: string = IDE_NAME): Promise<any> {
    return AI.startSession({ baseURL, source });
  },

  async checkSession(baseURL: string, sessionToken: string): Promise<any> {
    return AI.checkSession({ baseURL, sessionToken });
  },

  getFilters(baseURL: string, sessionToken: string): Promise<any> {
    return AI.getFilters({ baseURL, sessionToken});
  },

  getServiceAI() {
    return AI;
  },

  analyse(baseURL: string, sessionToken: string, baseDir: string, files: string[], removedFiles: string[] = []) {
    return AI.analyse({
      baseURL,
      sessionToken,
      baseDir,
      files,
      removedFiles,
    });
  },

  async sendError(baseURL: string, options: {[key: string]: any}): Promise<any> {
    return AI.reportError({
      baseURL,
      ...options
    });
  },

  async sendEvent(baseURL: string, options: {[key: string]: any}): Promise<any> {
    return AI.reportEvent({
      baseURL,
      ...options,
    });
  },
};

export default http;
