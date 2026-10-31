import { Router } from 'express';
import { BudgetController } from '../controllers/budgetController';
import { authenticate } from '../middleware/auth';
import { verifyEventOwnership } from '../middleware/eventOwner';
import { validate } from '../middleware/validate';
import { createAllocationSchema, createExpenseSchema, updateExpenseSchema } from '../types';

export const budgetRouter = Router({ mergeParams: true });

budgetRouter.use(authenticate);
budgetRouter.use(verifyEventOwnership);

// Allocations
budgetRouter.get('/summary', BudgetController.getBudgetSummary);
budgetRouter.get('/allocations', BudgetController.getAllocations);
budgetRouter.post('/allocations', validate(createAllocationSchema), BudgetController.setAllocation);

// Expenses
budgetRouter.get('/expenses', BudgetController.getExpenses);
budgetRouter.post('/expenses', validate(createExpenseSchema), BudgetController.createExpense);
budgetRouter.put('/expenses/:expenseId', validate(updateExpenseSchema), BudgetController.updateExpense);
budgetRouter.delete('/expenses/:expenseId', BudgetController.deleteExpense);
