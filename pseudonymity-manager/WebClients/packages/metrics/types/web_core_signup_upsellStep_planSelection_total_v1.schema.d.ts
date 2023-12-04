/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * Measures the total success or failures for the upsell step when signing up
 */
export interface WebCoreSignupUpsellStepPlanSelectionTotal {
  Value: number;
  Labels: {
    status: "success" | "failure";
    application: "proton-vpn-settings" | "proton-account";
  };
}
