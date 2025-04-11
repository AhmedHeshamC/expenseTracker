#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Command } = require('commander');
const program = new Command();

const DATA_FILE = path.join(__dirname, 'expenses.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// Helper functions
function readExpenses() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    console.error('Error reading expenses:', err.message);
    return [];
  }
}

// Input validation functions
function validateAmount(amount) {
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Amount must be a positive number');
  }
  return parseFloat(amount);
}

function sanitizeDescription(description) {
  // Remove any HTML/script tags
  return description.replace(/<[^>]*>?/gm, '');
}

function writeExpenses(expenses) {
  // Validate all expenses before writing
  expenses.forEach(expense => {
    if (!expense.id || !expense.date || !expense.description || !expense.amount) {
      throw new Error('Invalid expense data');
    }
  });
  fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2));
}

function generateId(expenses) {
  return expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
}

function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

const CATEGORIES = [
  'Food', 'Transportation', 'Housing', 'Entertainment', 
  'Utilities', 'Healthcare', 'Education', 'Other'
];

let BUDGETS = {};

// Helper function to get/set budgets
function readBudgets() {
  try {
    const budgetsFile = path.join(__dirname, 'budgets.json');
    if (fs.existsSync(budgetsFile)) {
      BUDGETS = JSON.parse(fs.readFileSync(budgetsFile, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading budgets:', err.message);
  }
}

function writeBudgets() {
  const budgetsFile = path.join(__dirname, 'budgets.json');
  fs.writeFileSync(budgetsFile, JSON.stringify(BUDGETS, null, 2));
}

// CLI Commands
program
  .name('expense-tracker')
  .description('CLI tool to track your expenses')
  .version('1.0.0');

program.command('add')
  .description('Add a new expense')
  .argument('[args...]', 'Additional arguments (ignored)')
  .requiredOption('-d, --description <string>', 'Expense description')
  .requiredOption('-a, --amount <number>', 'Expense amount', parseFloat)
  .option('-c, --category <string>', `Expense category (${CATEGORIES.join(', ')})`)
  .action((args, options) => {
    const expenses = readExpenses();
    const newExpense = {
      id: generateId(expenses),
      date: formatDate(),
      description: options.description,
      amount: options.amount,
      category: options.category || 'Other'
    };
    expenses.push(newExpense);
    writeExpenses(expenses);
    console.log(`# Expense added successfully (ID: ${newExpense.id})`);
  });

program.command('list')
  .description('List all expenses with full details')
  .option('-c, --category <string>', 'Filter by category')
  .action((options) => {
    let expenses = readExpenses();
    if (options.category) {
      expenses = expenses.filter(e => (e.category || 'Other').toLowerCase() === options.category.toLowerCase());
    }
    if (expenses.length === 0) {
      console.log('# No expenses found');
      return;
    }
    
    // Calculate column widths
    const idWidth = Math.max(2, ...expenses.map(e => e.id.toString().length));
    const dateWidth = 10;
    const categoryWidth = Math.max(8, ...expenses.map(e => (e.category || 'Other').length));
    const descWidth = Math.max(11, ...expenses.map(e => e.description.length));
    const amountWidth = Math.max(6, ...expenses.map(e => e.amount.toString().length + 3));
    
    // Print header
    console.log(
      `# ${'ID'.padEnd(idWidth)}  ${'Date'.padEnd(dateWidth)}  ${'Category'.padEnd(categoryWidth)}  ${'Description'.padEnd(descWidth)}  ${'Amount'.padStart(amountWidth)}`
    );
    
    // Print each expense
    expenses.forEach(expense => {
      console.log(
        `# ${expense.id.toString().padEnd(idWidth)}  ${expense.date.padEnd(dateWidth)}  ${(expense.category || 'Other').padEnd(categoryWidth)}  ${expense.description.padEnd(descWidth)}  $${expense.amount.toFixed(2).padStart(amountWidth - 1)}`
      );
    });
  });

program.command('update')
  .description('Update an expense by ID')
  .requiredOption('-i, --id <number>', 'Expense ID to update', parseInt)
  .option('-d, --description <string>', 'New description')
  .option('-a, --amount <number>', 'New amount', parseFloat)
  .option('-c, --category <string>', 'New category')
  .action((options) => {
    const expenses = readExpenses();
    const index = expenses.findIndex(e => e.id === options.id);
    if (index === -1) {
      console.log(`# Expense with ID ${options.id} not found`);
      return;
    }
    
    const expense = expenses[index];
    if (options.description) expense.description = options.description;
    if (options.amount) expense.amount = options.amount;
    if (options.category) expense.category = options.category;
    
    writeExpenses(expenses);
    console.log('# Expense updated successfully');
  });

program.command('delete')
  .description('Delete an expense by ID')
  .requiredOption('-i, --id <number>', 'Expense ID to delete', parseInt)
  .action((options) => {
    const expenses = readExpenses();
    const index = expenses.findIndex(e => e.id === options.id);
    if (index === -1) {
      console.log(`# Expense with ID ${options.id} not found`);
      return;
    }
    expenses.splice(index, 1);
    writeExpenses(expenses);
    console.log('# Expense deleted successfully');
  });

program.command('set-budget')
  .description('Set monthly budget')
  .requiredOption('-m, --month <number>', 'Month (1-12)', parseInt)
  .requiredOption('-a, --amount <number>', 'Budget amount', parseFloat)
  .action((options) => {
    readBudgets();
    BUDGETS[options.month] = options.amount;
    writeBudgets();
    const monthName = new Date(2024, options.month - 1).toLocaleString('default', { month: 'long' });
    console.log(`# Budget for ${monthName} set to $${options.amount}`);
  });



program.command('summary')
  .description('Show summary of expenses')
  .option('-m, --month <number>', 'Filter by month (1-12)', parseInt)
  .option('-c, --category <string>', 'Filter by category')
  .option('-g, --by-category', 'Group expenses by category')
  .action((options) => {
    const expenses = readExpenses();
    let filtered = expenses;
    
    if (options.category) {
      filtered = filtered.filter(e => (e.category || 'Other').toLowerCase() === options.category.toLowerCase());
    }
    
    if (options.month) {
      filtered = expenses.filter(e => {
        const month = parseInt(e.date.split('-')[1]);
        return month === options.month;
      });
      const total = filtered.reduce((sum, e) => sum + e.amount, 0);
      const monthName = new Date(2024, options.month - 1).toLocaleString('default', { month: 'long' });
      console.log(`# Total expenses for ${monthName}: $${total}`);
      
      // Check budget
      readBudgets();
      if (BUDGETS[options.month]) {
        const budget = BUDGETS[options.month];
        if (total >= budget) {
          console.log(`# WARNING: You've exceeded your ${monthName} budget of $${budget} by $${(total - budget).toFixed(2)}`);
        } else {
          console.log(`# Remaining budget for ${monthName}: $${(budget - total).toFixed(2)}`);
        }
      }
    } else {
      console.log(`# Total expenses: $${filtered.reduce((sum, e) => sum + e.amount, 0)}`);
    }
    
    if (options.byCategory) {
      console.log('\n# Expenses by category:');
      const byCategory = filtered.reduce((acc, expense) => {
        const category = expense.category || 'Other';
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {});
      
      Object.entries(byCategory).forEach(([category, amount]) => {
        console.log(`# ${category.padEnd(12)}: $${amount.toFixed(2)}`);
      });
    }
  });

program.command('export')
  .description('Export expenses to CSV file')
  .option('-f, --file <path>', 'Output file path (default: expenses.csv)')
  .action((options) => {
    const expenses = readExpenses();
    const outputFile = options.file || 'expenses.csv';
    
    // Create CSV header
    let csv = 'ID,Date,Category,Description,Amount\n';
    
    // Add each expense as a CSV row
    expenses.forEach(expense => {
      csv += `${expense.id},${expense.date},${expense.category || 'Other'},"${expense.description}",${expense.amount}\n`;
    });
    
    // Write to file
    fs.writeFileSync(outputFile, csv);
    console.log(`# Expenses exported to ${outputFile}`);
  });

program.parse();