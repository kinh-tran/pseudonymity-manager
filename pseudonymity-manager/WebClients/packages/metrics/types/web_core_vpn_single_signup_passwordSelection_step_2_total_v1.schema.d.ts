/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * Measures the total number of step loads for the web vpn single signup password selection step.
 */
export interface WebCoreVpnSingleSignupPasswordSelectionStep2Total {
  Value: number;
  Labels: {
    step: "given_password" | "own_password" | "copy_password_modal";
    flow: "b2c" | "b2b";
  };
}
