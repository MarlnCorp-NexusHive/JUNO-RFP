import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Atomic JSON write using a unique per-write temp file (prevents concurrent .tmp collisions),
 * fsync, cleanup on failure, and best-effort backup copy for crash recovery.
 */
export function writeJsonAtomic(filePath, data, { pretty = false, dirFsync = false, backup = true } = {}) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const payload = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  const suffix = `${process.pid}.${Date.now()}.${crypto.randomBytes(4).toString("hex")}`;
  const tmp = `${filePath}.${suffix}.tmp`;

  let fd;
  try {
    fd = fs.openSync(tmp, "w");
    fs.writeFileSync(fd, payload, "utf8");
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = null;

    if (backup && fs.existsSync(filePath)) {
      try {
        fs.copyFileSync(filePath, `${filePath}.bak`);
      } catch {
        // Best-effort backup; do not block primary atomic rename.
      }
    }

    fs.renameSync(tmp, filePath);

    if (dirFsync) {
      try {
        const dirFd = fs.openSync(dir, "r");
        try {
          fs.fsyncSync(dirFd);
        } finally {
          fs.closeSync(dirFd);
        }
      } catch {
        // Some filesystems disallow directory fsync.
      }
    }

    return Buffer.byteLength(payload, "utf8");
  } catch (err) {
    if (fd != null) {
      try {
        fs.closeSync(fd);
      } catch {
        /* ignore */
      }
    }
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
    throw err;
  }
}

/**
 * Non-blocking async atomic JSON write (prevents blocking the Node event loop
 * under 50+ concurrent user logins / feature saves).
 */
export async function writeJsonAtomicAsync(filePath, data, { pretty = false, backup = true } = {}) {
  const dir = path.dirname(filePath);
  await fs.promises.mkdir(dir, { recursive: true });

  const payload = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  const suffix = `${process.pid}.${Date.now()}.${crypto.randomBytes(4).toString("hex")}`;
  const tmp = `${filePath}.${suffix}.tmp`;

  try {
    await fs.promises.writeFile(tmp, payload, "utf8");
    if (backup && fs.existsSync(filePath)) {
      try {
        await fs.promises.copyFile(filePath, `${filePath}.bak`);
      } catch {
        /* best-effort backup */
      }
    }
    await fs.promises.rename(tmp, filePath);
    return Buffer.byteLength(payload, "utf8");
  } catch (err) {
    try {
      await fs.promises.unlink(tmp);
    } catch {
      /* ignore */
    }
    throw err;
  }
}

/**
 * Safely read and parse a JSON file.
 * If the primary file is corrupted, preserves a `.corrupt.<ts>` copy and attempts
 * recovery from `.bak` before falling back, preventing silent total DB wipes.
 */
export function readJsonSafe(filePath, label = "store") {
  if (!fs.existsSync(filePath)) {
    return { exists: false, data: null, recoveredFromBackup: false };
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return { exists: true, data: JSON.parse(raw), recoveredFromBackup: false };
  } catch (primaryErr) {
    console.error(`[${label}] primary JSON read/parse failed (${filePath}):`, primaryErr.message);
    try {
      const corruptPath = `${filePath}.corrupt.${Date.now()}`;
      fs.copyFileSync(filePath, corruptPath);
      console.error(`[${label}] preserved corrupt file at ${corruptPath}`);
    } catch {
      /* best-effort */
    }
    const bakPath = `${filePath}.bak`;
    if (fs.existsSync(bakPath)) {
      try {
        const bakRaw = fs.readFileSync(bakPath, "utf8");
        const parsed = JSON.parse(bakRaw);
        console.warn(`[${label}] recovered valid state from backup ${bakPath}`);
        return { exists: true, data: parsed, recoveredFromBackup: true };
      } catch (bakErr) {
        console.error(`[${label}] backup recovery also failed:`, bakErr.message);
      }
    }
    throw primaryErr;
  }
}
