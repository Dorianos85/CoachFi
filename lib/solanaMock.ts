const base58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function createMockTransactionHash(length = 44) {
  return Array.from({ length }, () => base58[Math.floor(Math.random() * base58.length)]).join("");
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
