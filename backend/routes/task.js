const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Get tasks (filter by businessId or branchId)
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

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: { branch: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new task
router.post('/', protect, async (req, res) => {
  try {
    const { title, priority, dueDate, branchId } = req.body;
    
    const task = await prisma.task.create({
      data: {
        title,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        branchId,
        status: 'PENDING'
      }
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update task status or details
router.put('/:id', protect, async (req, res) => {
  try {
    const { status, title, priority, dueDate } = req.body;
    
    const data = {};
    if (status) data.status = status;
    if (title) data.title = title;
    if (priority) data.priority = priority;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a task
router.delete('/:id', protect, async (req, res) => {
  try {
    await prisma.task.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
