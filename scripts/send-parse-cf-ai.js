const API_URL = "http://localhost:5180/api/parse";
const LOG_DIRECTORY = "logs";
const SCRIPT_LOG_PREFIX = "send-parse-cf-ai";

const LINES = [
  "2 paket ekologisk mjölk",
  "1 kg potatis",
  "6 st ägg",
  "1 burk krossade tomater",
  "500 g spaghetti",
  "3 dl grädde",
  "1 flaska olivolja",
  "2 pkt jäst",
  "1 st gurka",
  "4 bananer",
  "ett halvt kilo morötter",
  "två paket med smör",
  "en burk tonfisk i olja",
  "mjölk 2 liter",
  "potatis 1 kilo",
  "3 stycken röda äpplen",
  "ett par tomater",
  "ungefär ett kilo lök",
  "lite grädde",
  "några ägg",
  "2 paket Arla mjölk från Ica",
  "Zeta olivolja 500 ml",
  "Garant kikärtor burk",
  "1 st ekologisk banan från Coop",
  "Findus ärtor 750 g",
];

async function send_requests() {
  const timestamp = new Date().toISOString().replace(/[:]/g, "-");
  const log_path = `${LOG_DIRECTORY}/${SCRIPT_LOG_PREFIX}-${timestamp}.json`;
  /** @type {Array<{ line: string; status: number; body: unknown; error?: string }>} */
  const results = [];

  let lines_processed_count = 0;
  for (const line of LINES) {
    console.log(`${lines_processed_count + 1}/${LINES.length} > "${line}"`);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: line }),
      });

      const result_text = await response.text();

      console.log(`  status: ${response.status}`);
      console.log(`  body: ${result_text}`);

      results.push({
        line,
        status: response.status,
        body: parse_json_safe(result_text),
      });
    } catch (error) {
      console.error(`  error:`, error);
      results.push({
        line,
        status: 0,
        body: null,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      lines_processed_count++;
    }
  }

  await write_log(log_path, results);
}

send_requests().catch((error) => {
  console.error("unexpected error:", error);
  process.exitCode = 1;
});

/**
 * @param {string} raw
 */
function parse_json_safe(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/**
 * @param {string} log_path
 * @param {unknown} payload
 */
async function write_log(log_path, payload) {
  const fs = await import("node:fs/promises");
  await fs.mkdir(LOG_DIRECTORY, { recursive: true });
  await fs.writeFile(log_path, JSON.stringify(payload), "utf-8");
  console.log(`Log saved to ${log_path}`);
}
