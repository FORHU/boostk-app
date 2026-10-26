export const handleTestMessage = async (job: unknown) => {
  console.log("\n====================================");
  console.log("🤖 [BACKGROUND WORKER] Test Job Caught!");
  console.log(`📦 Payload:`, job);
  console.log("====================================\n");
};
