/**
 * Parse raw HTTP headers into an object
 * @param {string} input - Headers string (one header per line)
 * @param {boolean} [handleForbidden=false] - Whether to add an x- prefix to forbidden headers
 * @returns {Object} headers - Parsed headers with lowercase keys
 */
export function parseHeaders(input, handleForbidden = false) {
  const headers = {};
  const headerNameRegex = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/; // RFC 7230 token

  input.split("\n").forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return; // skip empty lines

    const [rawKey, ...rest] = trimmedLine.split(":");
    if (!rawKey || rest.length === 0) return; // skip malformed lines

    let key = rawKey.trim();

    if (handleForbidden && isForbiddenHeader(key)) {
      key = `x-${key}`; // prefix forbidden headers
    }

    const value = rest.join(":").trim(); // handle values containing ":"

    // validate header name
    if (!headerNameRegex.test(key)) {
      return; // skip invalid header names
    }

    // normalize to lowercase
    const normalizedKey = key.toLowerCase();

    // store (overwrite if duplicate)
    headers[normalizedKey] = value;
  });

  return headers;
}

/**
 * Check if a header is forbidden to be set programmatically
 *
 * @param {String} header
 * @returns {Boolean}
 */
export function isForbiddenHeader(header) {
  const forbiddenHeaders = [
    "accept-charset",
    "accept-encoding",
    "access-control-request-headers",
    "access-control-request-method",
    "connection",
    "content-length",
    "cookie",
    "cookie2",
    "date",
    "dnt",
    "expect",
    "host",
    "keep-alive",
    "origin",
    "referer",
    "set-cookie",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "via",
    "user-agent",
  ];

  return forbiddenHeaders.includes(header.toLowerCase());
}

export function dev_log(...args) {
  if (import.meta.env.DEV) {
    // Only log in development
    console.log(...args);
  }
}
