require("dotenv").config();
const oracledb = require("oracledb");
const fs = require("fs");
const path = require("path");
const consoleTable = require("console.table");
const Anthropic = require("@anthropic-ai/sdk");

// Log directories and files
const logDir = path.resolve(__dirname, "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFilePath = path.join(logDir, `output-${Date.now()}.log`);
const tableLogFile = path.join(logDir, `table-${Date.now()}.log`);

// Oracle instant client setup
oracledb.initOracleClient({
  libDir:
    "C:\\Users\\VirtualC\\Downloads\\EIRA\\instantclient-basic-windows.x64-23.6.0.24.10\\instantclient_23_6",
});

// Database configuration
const dbConfig = {
  user: process.env.ORACLE_USERNAME,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNSTRING,
};

// Log functions
const log = (content) => {
  fs.appendFileSync(logFilePath, content + "\n", "utf8");
};
const logTable = (tableString) => {
  fs.appendFileSync(tableLogFile, `${tableString}\n`, "utf8");
};

// Anthropic client initialization
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Database operations
const dbConnect = async () => {
  try {
    console.log("Attempting to connect to the database...");
    const connection = await oracledb.getConnection(dbConfig);
    console.log("Connection successful!");
    log("Connection successful!");
    return connection;
  } catch (err) {
    console.error("Error connecting to the database:", err);
    log(`Error connecting to the database: ${err.message}`);
    throw err;
  }
};

const dbSelect = async (connection) => {
  const dbSelectQuery = `
    select event_id, event_subject, event_desc
    from event where state_id=96719 and sys_agenda_id=3907041 and event_template=0
    and not exists (select 1 from event_ai where event.event_id=event_ai.event_id)
    and rownum <= 5
  `;
  try {
    console.log("Executing query:", dbSelectQuery);
    log(`Executing query: ${dbSelectQuery}`);
    const result = await connection.execute(dbSelectQuery);
    console.log("Query executed successfully!");
    log("Query executed successfully!");
    return result;
  } catch (err) {
    console.error("Error executing query:", err);
    log(`Error executing query: ${err.message}`);
    throw err;
  }
};

const dbWrite = async (connection, event_id, response, priority) => {
  const insertQuery = `
    INSERT INTO EVENT_AI (EVENT_ID, RESPONSE, PRIORITY)
    VALUES (:event_id, :response, :priority)
  `;
  try {
    console.log(`Inserting EVENT_AI entry for EVENT_ID ${event_id}`);
    log(`Inserting EVENT_AI entry for EVENT_ID ${event_id}`);
    await connection.execute(insertQuery, {
      event_id,
      response,
      priority: '"' + priority + '"',
    }, { autoCommit: true });
    console.log(`Inserted EVENT_AI entry for EVENT_ID ${event_id}`);
    log(`Inserted EVENT_AI entry for EVENT_ID ${event_id}`);
  } catch (err) {
    console.error("Error inserting data:", err);
    log(`Error inserting data for EVENT_ID ${event_id}: ${err.message}`);
  }
};

// AI prompt and response handling
const promptAI = async (EVENT_SUBJECT, EVENT_DESC) => {
  let prompt = `Popis nahlášeného incidentu je: ${EVENT_SUBJECT};`;
  if (EVENT_DESC) {
    prompt += ` Podrobnosti: ${EVENT_DESC};`;
  }
  prompt += ` Jaká je priorita incidentu? Vyber jednu z možností: 1=vysoká, 2=střední, 3=nízká. Výsledek vrať ve formátu JSON ve tvaru: {"priorita":"1"}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    console.log("AI response:", response);
    log(`AI response: ${JSON.stringify(response)}`);
    return response.content[0].text;
  } catch (error) {
    console.error("Error communicating with Anthropic:", error);
    log(`Error communicating with Anthropic: ${error.message}`);
    throw error;
  }
};

// Main function to run the process
const processTables = async () => {
  let connection;
  try {
    connection = await dbConnect();
    const result = await dbSelect(connection);

    if (result.rows.length === 0) {
      console.log("No data found in the EVENT table.");
      log("No data found in the EVENT table.");
      return;
    }

    console.log("result" + result);
    const columnNames = result.metaData.map((meta) => meta.name);
    console.log("columnNames" + columnNames);
    const rowData = result.rows.map((row) =>
      columnNames.reduce((obj, col, index) => {
        obj[col] = row[index];
        return obj;
      }, {})
    );

    console.table(rowData);
    logTable(consoleTable.getTable(rowData));

    for (const row of rowData) {
      const { EVENT_ID, EVENT_SUBJECT, EVENT_DESC } = row;
      const responseContent = await promptAI(EVENT_SUBJECT, EVENT_DESC);

      let priority = "1"; // Default priority
      try {
        const parsedResponse = JSON.parse(responseContent);
        priority = parsedResponse?.priorita || "1";
      } catch (error) {
        console.error("Error parsing AI response:", error);
        log(`Error parsing AI response: ${error.message}`);
      }

      await dbWrite(connection, EVENT_ID, responseContent, priority);
    }
  } catch (err) {
    console.error("Error occurred:", err);
    log(`Error occurred: ${err.message}`);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("Connection closed.");
        log("Connection closed.");
      } catch (err) {
        console.error("Error closing connection:", err);
        log(`Error closing connection: ${err.message}`);
      }
    }
  }
};

// Execute the process
(async () => {
  await processTables();
  process.exit();
})();
