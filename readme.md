# Node.js Oracle Database Integration with Anthropic AI

This project demonstrates the integration of Node.js with an Oracle database, using Anthropic AI for additional processing. Follow the steps below to set up and run the project.

## Prerequisites

1. **Node.js LTS**: [Download and install](https://nodejs.org/en)
2. **Yarn Package Manager**: [Download and install](https://classic.yarnpkg.com/lang/en/docs/install/#windows-stable)
3. **OracleSQL "thick" client**: [Download and install](https://www.oracle.com/database/technologies/instant-client/downloads.html)

## Setup Instructions

1. Clone this repository to your local machine.
2. Run `yarn install` in the root directory to install dependencies.
3. Update the `index.js` file:
   - Modify the path to your OracleSQL "thick" client.
4. Create a `.env` file in the root directory and add the following credentials:

```env
ANTHROPIC_API_KEY="insert key here"
ORACLE_USERNAME="insert oracle db username"
ORACLE_PASSWORD="insert oracle db password"
ORACLE_CONNSTRING="insert oracle db connection string - example localhost:1521/xepdb1"
If you use Linux:    ORACLE_LIBRARY_DIR="/path/to/your/thick/client"
If you use Windows:  ORACLE_LIBRARY_DIR="C:\\Path\\to\\your\\thick\\client"
```

## Running the Project

To execute the script, run the following command:

```bash
node index.js
```

## Notes
- Ensure the Oracle Instant Client is properly installed and accessible from the specified path in `index.js`.
- The `.env` file must contain valid credentials for connecting to the Oracle database and the Anthropic API.

Feel free to contribute or modify the project as needed!
