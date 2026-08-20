const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Get financial records
router.get('/', protect, async (req, res) => {
  try {
    const { businessId, branchId } = req.query;
    let whereClause = {};

    if (branchId) {
      whereClause.branchId = branchId;
    } else if (businessId) {
      const branches = await prisma.branch.findMany({ where: { businessId } });
      const branchIds = branches.map(b => b.id);
      whereClause.branchId = { in: branchIds };
    } else {
      return res.status(400).json({ message: 'Must provide businessId or branchId' });
    }

    const finances = await prisma.finance.findMany({
      where: whereClause,
      include: { branch: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' }
    });

    res.json(finances);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a financial record (Income/Expense)
router.post('/', protect, async (req, res) => {
  try {
    const { type, amount, category, date, branchId } = req.body;
    
    const finance = await prisma.finance.create({
      data: {
        type, // 'INCOME' or 'EXPENSE'
        amount: parseFloat(amount),
        category,
        date: date ? new Date(date) : new Date(),
        branchId
      }
    });

    res.status(201).json(finance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get summary for dashboard
router.get('/summary', protect, async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) return res.status(400).json({ message: 'businessId required' });

    const branches = await prisma.branch.findMany({ where: { businessId } });
    const branchIds = branches.map(b => b.id);

    // Get all finances for this business
    const finances = await prisma.finance.findMany({
      where: { branchId: { in: branchIds } }
    });

    const totalIncome = finances.filter(f => f.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = finances.filter(f => f.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
    const netProfit = totalIncome - totalExpense;

    // Get active tasks count
    const tasks = await prisma.task.count({
      where: { branchId: { in: branchIds }, status: { not: 'COMPLETED' } }
    });

    // Get total clients
    const clients = await prisma.client.count({
      where: { branchId: { in: branchIds } }
    });

    res.json({
      totalIncome,
      totalExpense,
      netProfit,
      activeTasks: tasks,
      totalClients: clients
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a financial record
router.delete('/:id', protect, async (req, res) => {
  try {
    await prisma.finance.delete({ where: { id: req.params.id } });
    res.json({ message: 'Record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
