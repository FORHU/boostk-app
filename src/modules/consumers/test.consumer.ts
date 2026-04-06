export const handleTestMessage = async (data: unknown, routingKey: string) => {
  console.log("\n====================================");
  console.log("🤖 [BACKGROUND WORKER] Test Message Caught!");
  console.log(`🔑 Routing Key: ${routingKey}`);
  console.log(`📦 Payload:`, data);
  console.log("====================================\n");
};
