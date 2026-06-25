export default (): string =>
  crypto.randomUUID().replace(/-/g, "").substring(0, 8);
