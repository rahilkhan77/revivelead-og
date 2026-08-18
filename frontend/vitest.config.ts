import path from "node:path";
import { defineConfig } from "vitest/config";

process.env.DATABASE_URL = "file:./dev.db";
process.env.RAZORPAY_KEY_ID = "";
process.env.RAZORPAY_KEY_SECRET = "";
process.env.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret";
process.env.RAZORPAY_PLAN_STARTER = "plan_test_starter";
process.env.RAZORPAY_PLAN_PRO = "plan_test_pro";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
