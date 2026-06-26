import { generateSalt, hashCode } from "./server/utils/auth";
import { setAccessCode } from "./server/db/queries";

const salt = generateSalt();
const hash = hashCode("7800", salt);
await setAccessCode("smh", hash, salt);
