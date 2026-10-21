# Google Sheets Setup Instructions

To enable Google Sheets integration, follow these steps:

## 1. Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "Order-Automation").
3. In the search bar, search for "Google Sheets API" and click **Enable**.

## 2. Create a Service Account
1. Go to **IAM & Admin** > **Service Accounts**.
2. Click **Create Service Account**.
3. Give it a name (e.g., "sheets-bot") and click **Create and Continue**.
4. Skip optional roles and click **Done**.
5. In the list of service accounts, click on the one you just created.
6. Go to the **Keys** tab > **Add Key** > **Create new key**.
7. Select **JSON** and click **Create**.
8. A JSON file will download. Rename it to `service_account.json` and place it in the root of your `order-automation` project directory.

## 3. Prepare the Google Sheet
1. Create a new Google Sheet.
2. Copy the **Spreadsheet ID** from the URL: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`.
3. **IMPORTANT**: Share the sheet with the service account email (found in your `service_account.json` as `client_email`). Give it "Editor" access.

## 4. Configure Environment Variables
Set the `GOOGLE_SHEETS_ID` environment variable:

**Windows (Cmd):**
\`\`\`cmd
set GOOGLE_SHEETS_ID=your_spreadsheet_id_here
npm start
\`\`\`

**Windows (PowerShell):**
\`\`\`powershell
$env:GOOGLE_SHEETS_ID="your_spreadsheet_id_here"
npm start
\`\`\`

**Linux/macOS:**
\`\`\`bash
export GOOGLE_SHEETS_ID="your_spreadsheet_id_here"
npm start
\`\`\`
