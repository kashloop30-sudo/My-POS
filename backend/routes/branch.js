const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Get branches for a specific business
router.get('/', protect, async (req, res) => {
  try {
    const { businessId } = req.query;
    
    if (!businessId) {
      return res.status(400).json({ message: 'businessId query parameter is required' });
    }

    // Verify user has access to this business
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return res.status(404).json({ message: 'Business not found' });

    if (req.user.role !== 'SUPER_ADMIN' && business.ownerId !== req.user.id) {
      // Allow if they are a manager of any branch in this business (future enhancement)
      return res.status(403).json({ message: 'Not authorized' });
    }

    const branches = await prisma.branch.findMany({
      where: { businessId },
      include: { manager: { select: { id: true, name: true, email: true } } }
    });

    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new branch
router.post('/', protect, async (req, res) => {
  try {
    const { name, address, contact, status, businessId, managerId } = req.body;
    
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return res.status(404).json({ message: 'Business not found' });

    if (req.user.role !== 'SUPER_ADMIN' && business.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        address,
        contact,
        status: status || 'ACTIVE',
        businessId,
        managerId: managerId || null
      },
    });
    
    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a branch
router.delete('/:id', protect, async (req, res) => {
  try {
    const branch = await prisma.branch.findUnique({ where: { id: req.params.id } });
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    const business = await prisma.business.findUnique({ where: { id: branch.businessId } });
    if (req.user.role !== 'SUPER_ADMIN' && business.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await prisma.branch.delete({ where: { id: req.params.id } });
    res.json({ message: 'Branch deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
