export const WARNINGS_ISSUES_CHECK_LIMIT = 5;
export const FEEDBACK_REFUSE_COUNT_LIMIT = 2;
export const TWO_DAYS_LIMIT = 172800000; // 2 days in ms
export const MONTH_LIMIT = 2592000000; // 1 month in ms
export const defaultFeedbackData = {
  isFeedbackPageOpened: false,
  warningsChecked: 0,
  timeLimit: TWO_DAYS_LIMIT,
  refusedCount: 0
};
