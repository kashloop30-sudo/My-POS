const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/services?branchId=xxx
router.get('/', protect, async (req, res) => {
  try {
    const { branchId } = req.query;
    if (!branchId) return res.status(400).json({ message: 'branchId is required' });

    const services = await prisma.service.findMany({
      where: { branchId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/services
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, price, branchId } = req.body;
    if (!name || !branchId) return res.status(400).json({ message: 'name and branchId are required' });

    const service = await prisma.service.create({
      data: {
        name,
        description: description || '',
        price: parseFloat(price) || 0,
        branchId,
      },
    });
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/services/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
      },
    });
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/services/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await prisma.service.delete({ where: { id: req.params.id } });
    res.json({ message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
