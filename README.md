# Expense Tracker By Ahmed Hesham

A simple command-line application to manage personal finances by tracking expenses.

## Features

- Add expenses with description and amount
- Update existing expenses
- Delete expenses
- View all expenses in a list
- View summary of all expenses
- View monthly expense summaries
- Set monthly budgets with warnings
- Export expenses to CSV
- Categorize expenses

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies

### Global Installation (Recommended)
Run `npm link` to install the command globally as `expense-tracker`

### Alternative Usage
You can also run the application directly without global installation:
```bash
node index.js [command] [options]
```

## Usage

### Global Command (after npm link)
```bash
# Add an expense
expense-tracker add --description "Lunch" --amount 20

# List all expenses
expense-tracker list

# View summary
expense-tracker summary

# View monthly summary
expense-tracker summary --month 8

# Delete an expense
expense-tracker delete --id 2

# Set monthly budget
expense-tracker set-budget --month 8 --amount 500

# Export to CSV
expense-tracker export --file expenses.csv
```

### Direct Node Command (without global installation)
```bash
# Add an expense
node index.js add --description "Lunch" --amount 20

# List all expenses
node index.js list

# View summary
node index.js summary

# View monthly summary
node index.js summary --month 8

# Delete an expense
node index.js delete --id 2

# Set monthly budget
node index.js set-budget --month 8 --amount 500

# Export to CSV
node index.js export --file expenses.csv
```

## Data Storage

Expenses are stored in `expenses.json` and budgets in `budgets.json` by default.

## Troubleshooting

If the `expense-tracker` command doesn't work after `npm link`:
1. Make sure npm's global bin directory is in your PATH
2. Try running `npm install -g` in the project directory
3. Alternatively, use the direct node commands shown above

## License

MIT

## Projects URLs
https://roadmap.sh/projects/expense-tracker
https://github.com/AhmedHeshamC/expenseTracker