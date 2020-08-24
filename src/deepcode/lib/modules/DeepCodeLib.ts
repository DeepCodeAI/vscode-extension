import * as _ from "lodash";
import DeepCode from "../../../interfaces/DeepCodeInterfaces";
import BundlesModule from "./BundlesModule";
import { setContext } from "../../utils/vscodeCommandsUtils";
import { DEEPCODE_CONTEXT } from "../../constants/views";
import { EXECUTION_DEBOUNCE_INTERVAL } from "../../constants/general";
import { errorsLogs } from "../../messages/errorsServerLogMessages";
import { TELEMETRY_EVENTS } from "../../constants/telemetry";

export default class DeepCodeLib extends BundlesModule implements DeepCode.DeepCodeLibInterface {
  activateAll(): void {
    // this.filesWatcher.activate(this);
    this.workspacesWatcher.activate(this);
    this.editorsWatcher.activate(this);
    this.settingsWatcher.activate(this);
    this.analyzer.activate(this);
  }

  private async executeExtensionPipeline(): Promise<void> {
    console.log("DeepCode: starting execution pipeline");
    await setContext(DEEPCODE_CONTEXT.ERROR, false);
    
    const loggedIn = await this.checkSession();
    if (!loggedIn) {
      await this.sendEvent(TELEMETRY_EVENTS.viewLogin, {});
      return;
    }
    const approved = await this.checkApproval();
    if (!approved) {
      await this.sendEvent(TELEMETRY_EVENTS.viewConsent, {});
      return;
    }
    await this.startAnalysis();
    
    this.resetTransientErrors();
  }

  startExtension = _.debounce(
    async (): Promise<void> => {
      // This function is called by commands, error handlers, etc.
      // We should avoid having duplicate parallel executions.
      try {
        await this.executeExtensionPipeline();
      } catch (err) {
        this.processError(err, {
          message: errorsLogs.failedExecutionDebounce,
        });
      }
    },
    EXECUTION_DEBOUNCE_INTERVAL,
    { 'leading': true }
  );
}
